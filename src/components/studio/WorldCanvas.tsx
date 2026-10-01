'use client'

// Lienzo del mundo: aquí se colocan los objetos (editor) y viven las
// mascotas (modo juego). Soporta arrastrar desde la biblioteca (HTML5 DnD)
// y mover objetos ya colocados (pointer events, funciona con táctil).
//
// Modo juego:
//  · Caras de ánimo y de persecución (😠 persigue / 😱 huye)
//  · Escondites (mascota detrás, 👀 asomándose) y trepaderas (encima)
//  · Acariciar con el dedo: frotar la mascota = caricia de verdad
//  · Pelota lanzable, lluvia, mariposa y caja sorpresa
//  · La pantalla tiembla cuando hay una persecución (y vibra el móvil)

import React, { useRef } from 'react'
import { useStudio } from '@/lib/studio/store'
import { catalogById, levelById } from '@/lib/studio/catalog'
import { PetRuntime, WorldObject } from '@/lib/studio/types'
import { sfx } from '@/lib/studio/sound'
import { cn } from '@/lib/utils'

const clampPct = (v: number) => Math.max(3, Math.min(97, v))

function hueFilter(hue: number) {
  return hue ? `hue-rotate(${hue}deg) saturate(1.25)` : undefined
}

/** Cara de la mascota según su estado (expresiones para todos los animales) */
function petFace(rt: PetRuntime, now: number): string | null {
  if (rt.chaseUntil > now) return rt.chaseRole === 'chase' ? '😠' : '😱'
  if (rt.state === 'sleep' || rt.state === 'eat' || rt.state === 'rest') return null // tienen su propio símbolo
  if (rt.injured) return '🤕'
  if (rt.sick) return '🤒'
  if (rt.stats.comida < 25) return '😟'
  if (rt.stats.descanso < 25) return '🥱'
  if (rt.stats.energia < 20) return '😪'
  if (rt.stats.higiene < 25) return '🤢'
  if (rt.stats.felicidad < 25) return '😢'
  if (rt.stats.felicidad >= 85) return '😊'
  return null
}

/** Burbuja de petición cuando una necesidad está crítica */
function petBubble(rt: PetRuntime): string | null {
  if (rt.state === 'sleep' || rt.state === 'rest') return null
  if (rt.injured) return '🩹!'
  if (rt.stats.comida < 20) return '🍖!'
  if (rt.stats.energia < 22) return '💧!'
  if (rt.stats.descanso < 20) return '😴!'
  if (rt.stats.higiene < 15) return '🧼!'
  if (rt.stats.felicidad < 25) return '😢'
  return null
}

/** chip de orden que está obedeciendo */
function obeyChip(rt: PetRuntime, now: number): string | null {
  if (!rt.obey || now >= rt.obey.until) return null
  return rt.obey.cmd === 'sit' ? '🪑' : rt.obey.cmd === 'stay' ? '✋' : '👉'
}

export function WorldCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ id: string; offX: number; offY: number } | null>(null)
  // gesto de caricia: frotar el dedo (o el ratón) sobre la mascota
  const strokeRef = useRef<{ id: string; dist: number; lastX: number; lastY: number } | null>(
    null,
  )

  const mode = useStudio((s) => s.mode)
  const objects = useStudio((s) => s.objects)
  const pets = useStudio((s) => s.pets)
  const particles = useStudio((s) => s.particles)
  const say = useStudio((s) => s.say)
  const selectedId = useStudio((s) => s.selectedId)
  const currentLevel = useStudio((s) => s.currentLevel)
  const event = useStudio((s) => s.event)
  const ball = useStudio((s) => s.ball)
  const ballPending = useStudio((s) => s.ballPending)
  const shakeUntil = useStudio((s) => s.shakeUntil)
  const select = useStudio((s) => s.select)
  const selectForEdit = useStudio((s) => s.selectForEdit)
  const addObject = useStudio((s) => s.addObject)
  const updateObject = useStudio((s) => s.updateObject)
  const petPet = useStudio((s) => s.petPet)
  const throwBallAt = useStudio((s) => s.throwBallAt)
  const claimGift = useStudio((s) => s.claimGift)
  const calmAll = useStudio((s) => s.calmAll)

  const levelDef = levelById[currentLevel]
  const now = Date.now()
  const shaking = now < shakeUntil
  const raining = mode === 'play' && event?.kind === 'lluvia'
  // ¿hay una persecución en marcha? (para la pista de calmar con un toque)
  const chaseActive =
    mode === 'play' && Object.values(pets).some((rt) => rt.chaseUntil > now)
  // solo se ven los objetos del mundo activo
  const visible = objects.filter((o) => o.level === currentLevel)

  function pointFromClient(clientX: number, clientY: number) {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return { x: 50, y: 50 }
    return {
      x: clampPct(((clientX - rect.left) / rect.width) * 100),
      y: clampPct(((clientY - rect.top) / rect.height) * 100),
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const cid = e.dataTransfer.getData('text/plain')
    if (!cid || !catalogById[cid]) return
    const p = pointFromClient(e.clientX, e.clientY)
    addObject(cid, p.x, p.y)
  }

  function pointerDown(e: React.PointerEvent, obj: WorldObject) {
    if (mode === 'edit') {
      e.stopPropagation()
      selectForEdit(obj.id)
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      dragRef.current = {
        id: obj.id,
        offX: e.clientX - rect.left - (obj.x / 100) * rect.width,
        offY: e.clientY - rect.top - (obj.y / 100) * rect.height,
      }
      try {
        ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
      } catch {
        // algunos navegadores antiguos no soportan captura: no pasa nada
      }
    } else if (mode === 'play') {
      // empezar el gesto de caricia (frotar)
      e.stopPropagation()
      strokeRef.current = { id: obj.id, dist: 0, lastX: e.clientX, lastY: e.clientY }
      try {
        ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
      } catch {
        // sin captura: también funciona
      }
    }
  }

  function pointerMove(e: React.PointerEvent, obj: WorldObject) {
    if (mode === 'edit') {
      const d = dragRef.current
      if (!d || d.id !== obj.id) return
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      const x = clampPct(((e.clientX - rect.left - d.offX) / rect.width) * 100)
      const y = clampPct(((e.clientY - rect.top - d.offY) / rect.height) * 100)
      updateObject(obj.id, { x, y })
    } else if (mode === 'play') {
      const st = strokeRef.current
      if (!st || st.id !== obj.id) return
      st.dist += Math.hypot(e.clientX - st.lastX, e.clientY - st.lastY)
      st.lastX = e.clientX
      st.lastY = e.clientY
      // frotó lo suficiente → ¡caricia!
      if (st.dist > 42) {
        strokeRef.current = null
        petPet(obj.id)
      }
    }
  }

  function pointerUp(e: React.PointerEvent, obj: WorldObject) {
    if (dragRef.current?.id === obj.id) {
      dragRef.current = null
      sfx.click()
    }
    if (strokeRef.current?.id === obj.id) strokeRef.current = null
  }

  function handleObjectClick(obj: WorldObject) {
    if (mode === 'play') {
      const item = catalogById[obj.catalogId]
      if (item?.kind === 'pet') {
        select(obj.id)
        sfx.click()
      }
    }
  }

  function handleCanvasClick(e: React.MouseEvent) {
    if (mode === 'play' && ballPending) {
      const p = pointFromClient(e.clientX, e.clientY)
      throwBallAt(p.x, p.y)
      return
    }
    if (mode === 'play') {
      // tocar el mundo durante una persecución = aplauso calmante
      const p = pointFromClient(e.clientX, e.clientY)
      if (calmAll(p.x, p.y)) return
    }
    select(null)
  }

  return (
    <div
      ref={canvasRef}
      className={cn(
        'relative h-full w-full overflow-hidden rounded-3xl border-4 border-white shadow-md select-none',
        levelDef?.bg ?? 'grass',
        shaking && 'canvas-shake',
        ballPending && 'cursor-crosshair',
      )}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onClick={handleCanvasClick}
      role="application"
      aria-label={`Mundo del juego: ${levelDef?.name ?? 'Jardín'}`}
    >
      {/* decoración según el mundo */}
      {currentLevel === 'jardin' && (
        <>
          <div className="pointer-events-none absolute top-3 left-5 text-3xl opacity-80" aria-hidden>
            ☁️
          </div>
          <div className="pointer-events-none absolute top-8 right-12 text-2xl opacity-70" aria-hidden>
            ☁️
          </div>
          <div className="pointer-events-none absolute top-2 right-1/3 text-2xl" aria-hidden>
            ☀️
          </div>
        </>
      )}
      {currentLevel === 'casa' && (
        <>
          <div className="pointer-events-none absolute top-3 left-6 text-3xl opacity-80" aria-hidden>
            🖼️
          </div>
          <div className="pointer-events-none absolute top-3 right-8 text-3xl opacity-80" aria-hidden>
            🪟
          </div>
          <div className="pointer-events-none absolute top-4 right-1/3 text-2xl opacity-70" aria-hidden>
            🕰️
          </div>
        </>
      )}
      {currentLevel === 'hospital' && (
        <>
          <div className="pointer-events-none absolute top-3 left-6 text-3xl opacity-80" aria-hidden>
            🩺
          </div>
          <div className="pointer-events-none absolute top-3 right-8 text-3xl opacity-80" aria-hidden>
            🧪
          </div>
          <div className="pointer-events-none absolute top-2 right-1/3 text-3xl" aria-hidden>
            ➕
          </div>
        </>
      )}
      {currentLevel === 'playa' && (
        <>
          <div className="pointer-events-none absolute top-2 right-8 text-3xl" aria-hidden>
            ☀️
          </div>
          <div className="pointer-events-none absolute top-4 left-8 text-3xl opacity-90" aria-hidden>
            ⛵
          </div>
          <div className="pointer-events-none absolute top-7 left-1/3 text-2xl opacity-70" aria-hidden>
            🌊
          </div>
        </>
      )}

      {/* objetos del mundo */}
      {visible.map((obj) => {
        const item = catalogById[obj.catalogId]
        if (!item) return null
        const isPet = item.kind === 'pet'
        const rt = mode === 'play' ? pets[obj.id] : undefined
        const selected = selectedId === obj.id
        const bubble = rt ? petBubble(rt) : null
        const face = rt ? petFace(rt, now) : null
        const chip = rt ? obeyChip(rt, now) : null
        const voice = isPet ? say[obj.id] : undefined
        const voiceText = voice && voice.until > now ? voice.text : null
        const chasing = !!(rt && rt.chaseUntil > now)
        const hidden = !!(rt && rt.hiding)
        const onTop = !!(rt && rt.onTopOf)
        return (
          <div
            key={obj.id}
            data-object-id={obj.id}
            className={cn(
              'pop-in absolute touch-none',
              mode === 'edit'
                ? 'cursor-grab active:cursor-grabbing'
                : isPet
                  ? 'cursor-pointer'
                  : 'pointer-events-none',
            )}
            style={{
              left: `${obj.x}%`,
              top: `${obj.y}%`,
              transform: onTop
                ? 'translate(-50%, -60%) translateY(-20px)'
                : 'translate(-50%, -60%)',
              zIndex: hidden ? 8 : onTop ? 30 : isPet ? 20 : 10,
            }}
            onPointerDown={(e) => pointerDown(e, obj)}
            onPointerMove={(e) => pointerMove(e, obj)}
            onPointerUp={(e) => pointerUp(e, obj)}
            onClick={(e) => {
              e.stopPropagation()
              handleObjectClick(obj)
            }}
          >
            <div
              className={cn(
                'flex items-center justify-center rounded-full transition-shadow',
                selected && 'shadow-[0_0_0_4px_rgba(244,63,94,0.85)]',
              )}
              style={{ padding: 2 }}
            >
              <span
                className={cn(
                  'block drop-shadow-lg transition-transform',
                  (chasing || rt?.obey?.cmd === 'run' || rt?.obey?.cmd === 'jump') && 'pet-hop',
                  rt?.obey?.cmd === 'dance' && 'pet-dance',
                  rt?.injured && rt.state === 'walk' && 'pet-limp',
                )}
                style={{
                  fontSize: `${Math.round(30 * obj.size)}px`,
                  filter: hueFilter(obj.hue),
                  transform: `scaleX(${rt?.facing ?? 1})`,
                  lineHeight: 1,
                  opacity: hidden ? 0.55 : 1,
                  ['--face' as string]: rt?.facing ?? 1,
                } as React.CSSProperties}
              >
                {item.emoji}
              </span>
            </div>
            {/* sombra en el suelo */}
            <div
              className="pointer-events-none absolute left-1/2 -bottom-1.5 h-2 w-8 -translate-x-1/2 rounded-full bg-black/15 blur-[2px]"
              aria-hidden
            />
            {/* estados de la mascota */}
            {rt?.state === 'sleep' && (
              <span className="absolute -top-2 -right-1 animate-bounce text-lg" aria-hidden>
                💤
              </span>
            )}
            {rt?.state === 'eat' && (
              <span className="absolute -right-2 -bottom-1 text-base" aria-hidden>
                😋
              </span>
            )}
            {rt?.state === 'drink' && (
              <span className="absolute -right-2 -bottom-1 animate-bounce text-base" aria-hidden>
                💧
              </span>
            )}
            {rt?.state === 'rest' && (
              <span className="absolute -top-2 -right-1 animate-pulse text-lg" aria-hidden>
                {rt.injured || rt.sick ? '🩹' : '💤'}
              </span>
            )}
            {/* cara de ánimo (hambre, sueño, suciedad, tristeza, alegría, persecución...) */}
            {face && (
              <span className="absolute -top-3 -left-2 text-lg drop-shadow" aria-hidden>
                {face}
              </span>
            )}
            {/* chip de obediencia: está cumpliendo la orden */}
            {chip && (
              <span className="absolute -top-3 -right-2 text-base drop-shadow" aria-hidden>
                {chip}
              </span>
            )}
            {/* nivel de la mascota: se gana cuidándola y jugando */}
            {rt && rt.lvl > 1 && (
              <span
                className="pointer-events-none absolute -top-2.5 -right-2 rounded-full bg-violet-500 px-1 py-px text-[9px] font-black text-white shadow"
                aria-hidden
              >
                Nv{rt.lvl}
              </span>
            )}
            {/* escondida: solo se asoman los ojitos */}
            {hidden && (
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-sm" aria-hidden>
                👀
              </span>
            )}
            {/* trepada: brillitos de esfuerzo */}
            {onTop && (
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 animate-bounce text-sm" aria-hidden>
                ✨
              </span>
            )}
            {/* globo de petición de cuidado */}
            {bubble && !voiceText && (
              <span className="absolute -top-7 left-1/2 -translate-x-1/2 animate-bounce rounded-full bg-white px-2 py-0.5 text-sm font-black shadow-md">
                {bubble}
              </span>
            )}
            {/* globo de voz: ¡Guau!, ¡Miau... (acompaña al sonido) */}
            {voiceText && (
              <span
                className="say-pop absolute -top-8 left-1/2 -translate-x-1/2 rounded-full border border-amber-200 bg-white px-2 py-0.5 text-xs font-black whitespace-nowrap text-slate-700 shadow-md"
                aria-hidden
              >
                {voiceText}
              </span>
            )}
            {/* nombre (solo editor) */}
            {mode === 'edit' && (
              <span className="pointer-events-none absolute top-full left-1/2 mt-0.5 -translate-x-1/2 rounded-full bg-white/85 px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap text-slate-600 shadow-sm">
                {obj.name}
              </span>
            )}
          </div>
        )
      })}

      {/* pelota lanzada por el dueño */}
      {mode === 'play' && ball && ball.until > now && (
        <span
          className="ball-drop pointer-events-none absolute text-3xl"
          style={{ left: `${ball.x}%`, top: `${ball.y}%`, zIndex: 40 }}
          aria-hidden
        >
          🎾
        </span>
      )}

      {/* caja sorpresa del evento regalo */}
      {mode === 'play' && event?.kind === 'regalo' && (
        <button
          className="gift-pop absolute animate-bounce rounded-full text-4xl transition-transform active:scale-90"
          style={{ left: `${event.x}%`, top: `${event.y}%`, zIndex: 45 }}
          onClick={(e) => {
            e.stopPropagation()
            claimGift()
          }}
          aria-label="Abrir la caja sorpresa"
          title="¡Ábreme!"
        >
          🎁
        </button>
      )}

      {/* mariposa del evento */}
      {mode === 'play' && event?.kind === 'mariposa' && (
        <span className="butterfly pointer-events-none absolute text-3xl" style={{ zIndex: 60 }} aria-hidden>
          🦋
        </span>
      )}

      {/* lluvia del evento */}
      {raining && (
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl"
          style={{ zIndex: 60 }}
          aria-hidden
        >
          <div className="absolute inset-0 bg-slate-600/20" />
          {Array.from({ length: 26 }).map((_, i) => (
            <span
              key={i}
              className="rain-drop absolute text-base"
              style={{
                left: `${(i * 3.9 + (i % 5) * 1.7) % 100}%`,
                top: '-8%',
                animationDelay: `${(i % 9) * 0.14}s`,
                animationDuration: `${0.8 + (i % 4) * 0.14}s`,
              }}
            >
              💧
            </span>
          ))}
        </div>
      )}

      {/* partículas (corazones, comida, monedas...) */}
      {particles.map((p) => (
        <span
          key={p.id}
          className="particle pointer-events-none absolute text-3xl"
          style={{ left: `${p.x}%`, top: `${p.y}%`, zIndex: 50 }}
          aria-hidden
        >
          {p.emoji}
        </span>
      ))}

      {/* aviso del evento sorpresa activo */}
      {mode === 'play' && event && (
        <div
          className="absolute top-2 left-2 z-[70] rounded-full border-2 border-white bg-white/90 px-3 py-1 text-xs font-black text-slate-600 shadow-md"
          aria-live="polite"
        >
          {event.kind === 'lluvia' && '🌧️ ¡Lluvia! Refúgialas'}
          {event.kind === 'escasez' && '🥣 ¡Poca comida! Aliméntalas'}
          {event.kind === 'mariposa' && '🦋 ¡Visita de la mariposa!'}
          {event.kind === 'regalo' && '🎁 ¡Toca la caja sorpresa!'}
        </div>
      )}

      {/* pista: ¡tocar la pantalla los calma cuando hay persecución! */}
      {chaseActive && (
        <div className="pointer-events-none absolute inset-x-0 bottom-2 z-[70] flex justify-center">
          <span className="animate-pulse rounded-full bg-violet-600 px-3 py-1 text-xs font-black text-white shadow-lg">
            👋 ¡Toca la pantalla para calmarlos!
          </span>
        </div>
      )}

      {/* pista del modo pelota */}
      {mode === 'play' && ballPending && (
        <div className="absolute inset-x-0 top-2 z-[70] flex justify-center">
          <span className="animate-pulse rounded-full bg-rose-500 px-4 py-1.5 text-xs font-black text-white shadow-lg">
            🎾 Toca el mundo para lanzar la pelota
          </span>
        </div>
      )}

      {/* pista cuando el mundo está vacío */}
      {visible.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
          <span className="text-5xl" aria-hidden>
            🌟
          </span>
          <p className="rounded-full bg-white/85 px-4 py-2 text-sm font-bold text-slate-600 shadow">
            Arrastra objetos aquí desde la biblioteca
          </p>
        </div>
      )}
    </div>
  )
}
