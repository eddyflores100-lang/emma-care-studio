'use client'

// HUD del modo juego v2: un DOCK flotante compacto que NO tapa el mundo.
//  · mini selector de mascotas (con estado 🤒🩹 y nivel)
//  · 3 acciones rápidas: 🍖 comida, 🤗 caricias, 🎾 pelota
//  · 🎙 micrófono (escucha continua)
//  · 🧰 abre la mochila (panel derecho oculto) con TODO lo demás
// El juego ahora ocupa toda la pantalla; esto flota encima.

import { useEffect, useRef, useState } from 'react'
import { catalogById } from '@/lib/studio/catalog'
import { PetIllustration } from '@/components/studio/PetIllustration'
import { useStudio } from '@/lib/studio/store'
import { PlayerAction } from '@/lib/studio/types'
import { VoiceControls } from '@/components/studio/VoiceControls'
import { cn } from '@/lib/utils'

/** abre la mochila (el panel derecho oculto) */
export function openDrawer() {
  window.dispatchEvent(new CustomEvent('emma-drawer-open'))
}

export function PlayHUD() {
  const [expanded, setExpanded] = useState(false)
  const toolsRef = useRef<HTMLElement>(null)
  useEffect(() => {
    if (!expanded) return
    const closeOutside = (event: PointerEvent) => {
      if (!toolsRef.current?.contains(event.target as Node)) setExpanded(false)
    }
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setExpanded(false) }
    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('pointerdown', closeOutside); document.removeEventListener('keydown', escape) }
  }, [expanded])
  const mode = useStudio((s) => s.mode)
  const objects = useStudio((s) => s.objects)
  const petsMap = useStudio((s) => s.pets)
  const selectedId = useStudio((s) => s.selectedId)
  const currentLevel = useStudio((s) => s.currentLevel)
  const ballPending = useStudio((s) => s.ballPending)
  const select = useStudio((s) => s.select)
  const playerAction = useStudio((s) => s.playerAction)
  const toggleBallMode = useStudio((s) => s.toggleBallMode)
  const actionCd = useStudio((s) => s.actionCd)

  if (mode !== 'play') return null

  const pets = objects.filter(
    (o) => catalogById[o.catalogId]?.kind === 'pet' && o.level === currentLevel,
  )
  const sel = pets.find((p) => p.id === selectedId) ?? null
  const rt = sel ? petsMap[sel.id] : null
  const now = Date.now()
  const cooling = (a: PlayerAction | 'cmd') =>
    rt && sel ? now - (actionCd[`${sel.id}:${a}`] ?? 0) < 3500 : false

  return (
    <section ref={toolsRef} className="emma-play-tools" aria-label="Controles del juego">
      <div className="emma-play-rail">
        <span className="emma-selected-name">{sel ? sel.name : 'Toca una mascota'}</span>
        <VoiceControls />
        <button type="button" className="emma-controls-toggle" aria-expanded={expanded} aria-controls="emma-care-panel" onClick={() => setExpanded(!expanded)}>
          {expanded ? '✕ Cerrar' : '☰ Controles'}
        </button>
      </div>
      {expanded && <section id="emma-care-panel" className="emma-dock emma-control-panel" aria-label="Cuidado rápido de mascotas">
      {/* mini selector de mascotas */}
      {pets.length === 0 ? (
        <button
          type="button"
          onClick={() => { setExpanded(false); openDrawer() }}
          className="rounded-full px-2 py-1 text-[11px] font-black text-slate-500"
        >
          🐾 Sin mascotas: añade una en 🧰
        </button>
      ) : (
        pets.map((p) => {
          const pRt = petsMap[p.id]
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => select(p.id)}
              data-on={p.id === selectedId ? '1' : '0'}
              className="emma-dock-pet"
              aria-label={`Seleccionar ${p.name}`}
              aria-pressed={p.id === selectedId}
              title={`${p.name}${pRt ? ` · Nv ${pRt.lvl}` : ''}`}
            >
              <span className="text-lg leading-none" aria-hidden>
                <PetIllustration species={p.catalogId} />
              </span>
              {pRt && pRt.lvl > 1 && (
                <span className="text-[9px] font-black text-violet-600">{pRt.lvl}</span>
              )}
              {pRt?.sick && <span aria-hidden>🤒</span>}
              {pRt?.injured && <span aria-hidden>🩹</span>}
            </button>
          )
        })
      )}

      {pets.length === 0 && <><button type="button" className="emma-dock-btn" aria-label="Mapa de mascotas" onClick={() => { setExpanded(false); window.dispatchEvent(new CustomEvent('emma-drawer-open',{detail:{section:'mapa'}})) }}>🗺️</button></>}
      {pets.length > 0 && (
        <>
          <span className="emma-dock-sep" aria-hidden />

          {/* acciones rápidas */}
          <button
            type="button"
            onClick={() => playerAction('alimentar')}
            data-cool={cooling('alimentar') ? '1' : '0'}
            className="emma-dock-btn"
            title="Dar comida 🍖"
            aria-label="Alimentar mascota seleccionada"
            disabled={!sel}
          >
            🍖
          </button>
          <button
            type="button"
            onClick={() => playerAction('acariciar')}
            data-cool={cooling('acariciar') ? '1' : '0'}
            className="emma-dock-btn"
            title="Acariciar 🤗"
            aria-label="Acariciar mascota seleccionada"
            disabled={!sel}
          >
            🤗
          </button>
          <button
            type="button"
            onClick={() => { toggleBallMode(); setExpanded(false) }}
            className={cn(
              'emma-dock-btn',
              ballPending ? 'border-rose-500 bg-rose-500 text-white' : 'border-lime-300 bg-lime-50',
            )}
            title={ballPending ? '¡Toca el mundo para lanzar!' : 'Lanzar la pelota 🎾'}
          >
            🎾
          </button>

          {rt?.hospitalStatus === 'waiting' && <button type="button" onClick={() => playerAction('curar')} className="emma-dock-btn shrink-0 border-teal-300 bg-teal-50" title="Iniciar tratamiento · 15 monedas" aria-label="Iniciar tratamiento por 15 monedas">🩺</button>}
          <button type="button" className="emma-dock-btn shrink-0 border-sky-300 bg-sky-50" aria-label="Mapa de mascotas" onClick={() => { setExpanded(false); window.dispatchEvent(new CustomEvent('emma-drawer-open',{detail:{section:'mapa'}})) }}>🗺️</button>

          {rt?.injured && currentLevel !== 'hospital' && (
            <button
              type="button"
              onClick={() => { setExpanded(false); openDrawer() }}
              className="emma-dock-btn shrink-0 border-sky-300 bg-sky-50"
              title="Lleva al hospital: ábrelo en la mochila 🚑"
            >
              🚑
            </button>
          )}

          <span className="emma-dock-sep" aria-hidden />
          <button
            type="button"
            onClick={() => { setExpanded(false); openDrawer() }}
            className="emma-dock-btn shrink-0 border-violet-300 bg-violet-50"
            title="Abrir mochila: baño, sueño, órdenes, barras y más"
          >
            🧰
          </button>
        </>
      )}
      </section>}
    </section>
  )
}
