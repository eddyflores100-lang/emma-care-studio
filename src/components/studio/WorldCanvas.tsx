'use client'

// Lienzo del mundo: aquí se colocan los objetos (editor) y viven las
// mascotas (modo juego). Soporta arrastrar desde la biblioteca (HTML5 DnD)
// y mover objetos ya colocados (pointer events, funciona con táctil).
// El fondo cambia según el mundo/nivel activo y las mascotas muestran
// caras de ánimo y globos de voz (¡Guau!, ¡Miau...).

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
function petFace(rt: PetRuntime): string | null {
  if (rt.state === 'sleep' || rt.state === 'eat') return null // tienen su propio símbolo
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
  if (rt.state === 'sleep') return null
  if (rt.stats.comida < 20) return '🍖!'
  if (rt.stats.descanso < 20) return '😴!'
  if (rt.stats.higiene < 15) return '🧼!'
  if (rt.stats.felicidad < 25) return '😢'
  return null
}

export function WorldCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ id: string; offX: number; offY: number } | null>(null)

  const mode = useStudio((s) => s.mode)
  const objects = useStudio((s) => s.objects)
  const pets = useStudio((s) => s.pets)
  const particles = useStudio((s) => s.particles)
  const say = useStudio((s) => s.say)
  const selectedId = useStudio((s) => s.selectedId)
  const currentLevel = useStudio((s) => s.currentLevel)
  const select = useStudio((s) => s.select)
  const selectForEdit = useStudio((s) => s.selectForEdit)
  const addObject = useStudio((s) => s.addObject)
  const updateObject = useStudio((s) => s.updateObject)

  const levelDef = levelById[currentLevel]
  const now = Date.now()
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
    if (mode !== 'edit') return
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
  }

  function pointerMove(e: React.PointerEvent, obj: WorldObject) {
    const d = dragRef.current
    if (!d || d.id !== obj.id || mode !== 'edit') return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = clampPct(((e.clientX - rect.left - d.offX) / rect.width) * 100)
    const y = clampPct(((e.clientY - rect.top - d.offY) / rect.height) * 100)
    updateObject(obj.id, { x, y })
  }

  function pointerUp(e: React.PointerEvent, obj: WorldObject) {
    if (dragRef.current?.id === obj.id) {
      dragRef.current = null
      sfx.click()
    }
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

  return (
    <div
      ref={canvasRef}
      className={cn(
        'relative h-full w-full overflow-hidden rounded-3xl border-4 border-white shadow-md select-none',
        levelDef?.bg ?? 'grass',
      )}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onClick={() => select(null)}
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
        const face = rt ? petFace(rt) : null
        const voice = isPet ? say[obj.id] : undefined
        const voiceText = voice && voice.until > now ? voice.text : null
        return (
          <div
            key={obj.id}
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
              transform: 'translate(-50%, -60%)',
              zIndex: isPet ? 20 : 10,
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
                className="block drop-shadow-lg transition-transform"
                style={{
                  fontSize: `${Math.round(30 * obj.size)}px`,
                  filter: hueFilter(obj.hue),
                  transform: `scaleX(${rt?.facing ?? 1})`,
                  lineHeight: 1,
                }}
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
            {/* cara de ánimo (hambre, sueño, suciedad, tristeza, alegría...) */}
            {face && (
              <span className="absolute -top-3 -left-2 text-lg drop-shadow" aria-hidden>
                {face}
              </span>
            )}
            {/* globo de petición de cuidado */}
            {bubble && (
              <span className="absolute -top-7 left-1/2 -translate-x-1/2 animate-bounce rounded-full bg-white px-2 py-0.5 text-sm font-black shadow-md">
                {bubble}
              </span>
            )}
            {/* globo de voz: ¡Guau!, ¡Miau... (acompaña al sonido) */}
            {voiceText && !bubble && (
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
