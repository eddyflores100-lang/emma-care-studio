'use client'

// Emma Care Studio — MOCHILA: panel oculto en el borde derecho.
// Solo aparece cuando la niña toca el lado derecho de la página (la
// zona invisible del borde o la asita «‹‹»); se cierra con ✕, tocando
// fuera o tras elegir una mascota en modo juego.
// Dentro va todo lo "de segundo nivel" en un SUBMENU APILABLE (acordeón).

import { useEffect, useState } from 'react'
import { petPersonality } from '@/lib/studio/personality'
import { useStudio } from '@/lib/studio/store'
import { STATS, STAT_KEYS, LEVELS, catalogById } from '@/lib/studio/catalog'
import { Command, PlayerAction } from '@/lib/studio/types'
import { LibraryPanel } from '@/components/studio/LibraryPanel'
import { PropertiesPanel } from '@/components/studio/PropertiesPanel'
import { RulesPanel } from '@/components/studio/RulesPanel'
import { cn } from '@/lib/utils'

const CARE_ACTIONS: { id: PlayerAction; emoji: string; label: string }[] = [
  { id: 'alimentar', emoji: '🍖', label: 'Comida' },
  { id: 'acariciar', emoji: '🤗', label: 'Acariciar' },
  { id: 'jugar', emoji: '🎾', label: 'Jugar' },
  { id: 'banar', emoji: '🛁', label: 'Baño' },
  { id: 'dormir', emoji: '😴', label: 'Dormir' },
]

const ORDERS: { id: Command; emoji: string; label: string }[] = [
  { id: 'sit', emoji: '🪑', label: '¡Sentado!' },
  { id: 'stay', emoji: '✋', label: '¡Quieto!' },
  { id: 'come', emoji: '👉', label: '¡Ven!' },
  { id: 'hide', emoji: '🙈', label: '¡Escondeos!' },
]

export function RightDrawer({ mode }: { mode: 'edit' | 'play' }) {
  const careMissions = useStudio(s=>s.careMissions)
  const [open, setOpen] = useState(false)
  const [sec, setSec] = useState<string | null>(mode === 'edit' ? 'objetos' : 'estado')

  const objects = useStudio((s) => s.objects)
  const petsMap = useStudio((s) => s.pets)
  const selectedId = useStudio((s) => s.selectedId)
  const currentLevel = useStudio((s) => s.currentLevel)
  const ballPending = useStudio((s) => s.ballPending)
  const select = useStudio((s) => s.select)
  const playerAction = useStudio((s) => s.playerAction)
  const giveCommand = useStudio((s) => s.giveCommand)
  const sendToHospital = useStudio((s) => s.sendToHospital)
  const toggleBallMode = useStudio((s) => s.toggleBallMode)
  const actionCd = useStudio((s) => s.actionCd)

  // el dock (y cualquier parte) puede abrir la mochila con un evento
  useEffect(() => {
    const onOpen = (event: Event) => {
      setOpen(true)
      const section = (event as CustomEvent<{section?:string}>).detail?.section
      if (section) setSec(section)
    }
    window.addEventListener('emma-drawer-open', onOpen)
    return () => window.removeEventListener('emma-drawer-open', onOpen)
  }, [])

  const pets = objects.filter(
    (o) => catalogById[o.catalogId]?.kind === 'pet' && o.level === currentLevel,
  )
  const sel = pets.find((p) => p.id === selectedId) ?? null
  const rt = sel ? petsMap[sel.id] : null
  const now = Date.now()
  const cooling = (a: PlayerAction | 'cmd') =>
    rt && sel ? now - (actionCd[`${sel.id}:${a}`] ?? 0) < 3500 : false
  const sleepAction = {
    id: 'dormir' as PlayerAction,
    emoji: rt?.state === 'sleep' ? '⏰' : '😴',
    label: rt?.state === 'sleep' ? 'Despertar' : 'Dormir',
  }

  const toggle = (id: string) => setSec((cur) => (cur === id ? null : id))

  // ===== secciones según modo =====
  const playSections = [
    {id:'misiones',emoji:'🎯',title:'Misiones para ganar monedas',body:<div className="space-y-2 text-xs font-bold text-slate-600">
      <p>Cuida a cualquier mascota. Cada tres cuidados del mismo tipo ganas 5 monedas extra.</p>
      <p>🍖 Alimentar: {careMissions.alimentar}/3 · +3 🪙 por cuidado</p>
      <p>🤗 Acariciar: {careMissions.acariciar}/3 · +2 🪙 por cuidado</p>
      <p>🫧 Bañar: {careMissions.banar}/3 · +3 🪙 por cuidado</p>
      <p>🩺 Tratamiento: 15 🪙. Puedes cuidar a pacientes que esperan tratamiento.</p>
    </div>},
    {
      id: 'mapa', emoji: '🗺️', title: 'Dónde están mis mascotas',
      body: <div className="space-y-3">{LEVELS.map(level => {
        const residents = objects.filter(o => o.level === level.id && catalogById[o.catalogId]?.kind === 'pet')
        return <div key={level.id} className="rounded-xl border border-sky-100 bg-sky-50/50 p-2">
          <p className="mb-1 text-xs font-black">{level.emoji} {level.name} · {residents.length}</p>
          {residents.length === 0 && <p className="text-[11px] text-slate-500">Sin mascotas</p>}
          {residents.map(p => <button key={p.id} type="button" onClick={() => {
            useStudio.getState().setLevel(p.level); useStudio.getState().select(p.id)
            if (petsMap[p.id]?.inside) useStudio.getState().openHouse(petsMap[p.id].inside!)
            setOpen(false)
          }} className="mb-1 flex w-full items-center gap-1 rounded-lg bg-white px-2 py-1.5 text-left text-[11px] font-bold">
            {catalogById[p.catalogId]?.emoji} {p.name}
            <span className="ml-auto text-[10px] text-slate-500">{petsMap[p.id]?.hospitalStatus === 'waiting' ? '🩺 15 🪙'
              : petsMap[p.id]?.hospitalStatus === 'treating' ? '🩺 en tratamiento' : petsMap[p.id]?.hospitalStatus === 'ready' ? '✅ alta'
              : petsMap[p.id]?.inside ? '🏠 casita' : '📍 localizar'}</span>
          </button>)}
        </div>
      })}</div>,
    },
    {
      id: 'estado',
      emoji: '🐾',
      title: `Mis mascotas${sel ? ` · ${sel.name}` : ''}`,
      body: !sel || !rt ? (
        <p className="py-1 text-center text-xs font-bold text-slate-400">
          👆 Toca una mascota en el mundo o en el dock de abajo
        </p>
      ) : (
        <div className="space-y-2.5">
          <div className="grid grid-cols-5 gap-1.5">
            {STAT_KEYS.map((k) => {
              const cfg = STATS[k]
              const v = Math.round(rt.stats[k])
              const low = v < 25
              return (
                <div key={k} className="flex flex-col items-center gap-1">
                  <div className="h-2.5 w-full overflow-hidden rounded-full border border-black/5 bg-slate-100">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', low && 'animate-pulse')}
                      style={{ width: `${v}%`, background: cfg.color }}
                    />
                  </div>
                  <span className={cn('text-[10px] font-black', low ? 'text-rose-500' : 'text-slate-500')}>
                    {cfg.emoji}
                  </span>
                </div>
              )
            })}
          </div>
          <p className="text-[11px] font-bold text-slate-500">{petPersonality(sel).label}</p>
          <p className="text-[11px] text-slate-500">💛 Amigos: {objects.filter(o=>(rt.bonds[o.id] ?? 0)>=12).map(o=>o.name).join(', ') || 'aún conociéndose'}</p>
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-[10px] font-black text-violet-600">⭐ Nv. {rt.lvl}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full border border-violet-100 bg-violet-100">
              <div
                className="h-full rounded-full bg-violet-500 transition-all duration-500"
                style={{ width: `${Math.round(rt.xp)}%` }}
              />
            </div>
            <span className="shrink-0 text-[10px] font-bold text-slate-400">{Math.round(rt.xp)}/100</span>
          </div>
        </div>
      ),
    },
    {
      id: 'cuidado',
      emoji: '🧑‍⚕️',
      title: 'Cuidado',
      body: (
        <div className="grid grid-cols-3 gap-2">
          {rt?.hospitalStatus && <div className="col-span-3 rounded-xl bg-teal-50 p-2 text-xs font-bold text-teal-800">
            {rt.hospitalStatus === 'waiting' ? '🩺 Espera tratamiento: 15 🪙. Gana monedas dando comida (+3), caricias (+2) o un baño (+3).'
              : rt.hospitalStatus === 'treating' ? '🩺 Tratamiento en marcha… 25 segundos' : '✅ Tiene el alta. Dile que vaya al patio, casa o playa.'}
          </div>}
          {rt?.hospitalStatus === 'waiting' && <button type="button" onClick={() => playerAction('curar')} className="col-span-3 rounded-xl border-2 border-teal-300 bg-teal-50 p-2 text-xs font-black text-teal-800">🩺 Iniciar tratamiento · 15 🪙</button>}
          {[...CARE_ACTIONS.map((a) => (a.id === 'dormir' && rt ? sleepAction : a))].map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => playerAction(a.id)}
              disabled={cooling(a.id)}
              className={cn(
                'flex h-13 flex-col items-center justify-center gap-0.5 rounded-2xl border-2 py-2 font-black transition-all active:scale-95',
                cooling(a.id) ? 'border-slate-100 bg-slate-50 opacity-40' : 'border-amber-200 bg-white hover:bg-amber-50',
              )}
            >
              <span className="text-2xl leading-none">{a.emoji}</span>
              <span className="text-[10px] text-slate-500">{a.label}</span>
            </button>
          ))}
          {rt?.sick && !rt.hospitalStatus && (
            <button
              type="button"
              onClick={() => playerAction('curar')}
              disabled={cooling('curar')}
              className="flex flex-col items-center justify-center gap-0.5 rounded-2xl border-2 border-teal-300 bg-teal-50 py-2 font-black transition-all active:scale-95"
            >
              <span className="text-2xl leading-none">🏥</span>
              <span className="text-[10px] text-teal-700">Curar</span>
            </button>
          )}
          {rt?.injured && currentLevel !== 'hospital' && (
            <button
              type="button"
              onClick={() => {
                if (sel) sendToHospital(sel.id)
                setOpen(false)
              }}
              className="flex flex-col items-center justify-center gap-0.5 rounded-2xl border-2 border-sky-300 bg-sky-50 py-2 font-black transition-all active:scale-95"
            >
              <span className="text-2xl leading-none">🚑</span>
              <span className="text-[10px] text-sky-700">Hospital</span>
            </button>
          )}
        </div>
      ),
    },
    {
      id: 'ordenes',
      emoji: '🎖️',
      title: 'Órdenes y voz',
      body: (
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-1.5">
            {ORDERS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => giveCommand(c.id)}
                disabled={cooling('cmd')}
                className={cn(
                  'flex flex-col items-center justify-center gap-0 rounded-2xl border-2 py-2 text-[10px] font-black transition-all active:scale-95',
                  cooling('cmd') ? 'border-slate-100 bg-slate-50 opacity-40' : 'border-violet-200 bg-violet-50 text-violet-700',
                )}
              >
                <span className="text-lg leading-none">{c.emoji}</span>
                {c.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={toggleBallMode}
            className={cn(
              'flex w-full items-center justify-center gap-1.5 rounded-2xl border-2 py-2 text-xs font-black transition-all active:scale-95',
              ballPending ? 'border-rose-500 bg-rose-500 text-white' : 'border-lime-300 bg-lime-50 text-lime-700',
            )}
          >
            🎾 {ballPending ? '¡Toca el mundo para lanzar!' : 'Lanzar pelota'}
          </button>
          <div className="rounded-2xl border-2 border-sky-100 bg-sky-50/60 p-2.5 text-[11px] font-bold leading-relaxed text-slate-600">
            <p className="mb-1 font-black text-sky-700">🎙️ Prueba a decirle:</p>
            <p>«¡Quietos!» — dejan de pelear al instante</p>
            <p>«¡Max!» — contesta y viene hacia ti</p>
            <p>«Max a la casa» — viaja al mundo Casa desbloqueado</p>
            <p>«¡Escondeos!» — buscan refugio</p>
            <p>«{sel?.name ?? 'Max'} quieto» — solo esa mascota; «libre» para soltarla</p>
            <p>«{sel?.name ?? 'Max'} a la playa» · «al patio» · «al hospital»</p>
            <p>«a comer» · «a la cama» · «toma agua» · «báñate»</p>
            <p>«corre» · «pasea» · «salta» · «baila»</p>
            <p>«hola» · «sígueme» · «a la casita» · «fuera» · «tratamiento»</p>
            <p>«descansa» · «despierta» · «libre»</p>
            <p>Usa el nombre para ordenar a una; sin nombre, a las de este mundo.</p>
          </div>
        </div>
      ),
    },
  ]

  const editSections = [
    { id: 'objetos', emoji: '🧸', title: 'Objetos', body: <LibraryPanel /> },
    { id: 'ajustes', emoji: '⚙️', title: 'Ajustes', body: <PropertiesPanel /> },
    { id: 'reglas', emoji: '🧩', title: 'Reglas mágicas', body: <RulesPanel fill /> },
  ]

  const sections = mode === 'edit' ? editSections : playSections

  return (
    <>
      {/* 🤫 zona invisible: tocar/prender el dedo en el lado derecho */}
      <button
        type="button"
        aria-label="Abrir mochila"
        className="emma-edge-hot"
        onClick={() => setOpen(true)}
      />
      {/* asita visible que invita a abrir */}
      {!open && (
        <button
          type="button"
          aria-label="Abrir mochila"
          className="emma-edge-tab"
          onClick={() => setOpen(true)}
        >
          ‹‹
        </button>
      )}

      {open && mode === 'play' && <div className="emma-drawer-back" onClick={() => setOpen(false)} aria-hidden />}

      <aside className={cn('emma-drawer', open && 'emma-drawer-open')} aria-hidden={!open} inert={!open}>
        <header>
          <span className="flex items-center gap-1.5">
            {mode === 'edit' ? '🧰 Herramientas' : '🎒 Mochila'}
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Cerrar mochila"
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-rose-100 bg-rose-50 text-sm font-black text-rose-500 active:scale-90"
          >
            ✕
          </button>
        </header>

        <div className="emma-drawer-body thin-scroll">
          {sections.map((s) => (
            <div key={s.id} className="emma-acc">
              <button
                type="button"
                onClick={() => toggle(s.id)}
                aria-expanded={sec === s.id}
                className={cn(sec === s.id && 'emma-acc-open')}
              >
                <span>
                  {s.emoji} {s.title}
                </span>
                <span className="text-[10px] text-slate-400">{sec === s.id ? '▾' : '▸'}</span>
              </button>
              {sec === s.id && <div className="emma-acc-body">{s.body}</div>}
            </div>
          ))}

          {mode === 'play' && (
            <p className="px-1 pt-1 text-center text-[10px] font-bold text-slate-400">
              💡 Gana 🪙 cuidando a tus mascotas
            </p>
          )}
        </div>
      </aside>
    </>
  )
}
