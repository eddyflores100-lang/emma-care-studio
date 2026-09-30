'use client'

// HUD del modo juego: selección de mascota, barras de necesidades y botones
// de cuidado (alimentar, acariciar, jugar, bañar, dormir, curar).

import { useStudio } from '@/lib/studio/store'
import { STATS, STAT_KEYS, catalogById } from '@/lib/studio/catalog'
import { PlayerAction } from '@/lib/studio/types'
import { cn } from '@/lib/utils'

const ACTIONS: { id: PlayerAction; emoji: string; label: string }[] = [
  { id: 'alimentar', emoji: '🍖', label: 'Comida' },
  { id: 'acariciar', emoji: '🤗', label: 'Acariciar' },
  { id: 'jugar', emoji: '🎾', label: 'Jugar' },
  { id: 'banar', emoji: '🛁', label: 'Baño' },
  { id: 'dormir', emoji: '😴', label: 'Dormir' },
]

export function PlayHUD() {
  const mode = useStudio((s) => s.mode)
  const objects = useStudio((s) => s.objects)
  const petsMap = useStudio((s) => s.pets)
  const selectedId = useStudio((s) => s.selectedId)
  const select = useStudio((s) => s.select)
  const playerAction = useStudio((s) => s.playerAction)
  const actionCd = useStudio((s) => s.actionCd)

  if (mode !== 'play') return null

  const pets = objects.filter((o) => catalogById[o.catalogId]?.kind === 'pet')
  const sel = pets.find((p) => p.id === selectedId) ?? null
  const rt = sel ? petsMap[sel.id] : null
  const now = Date.now()

  const cooling = (a: PlayerAction) =>
    rt && sel ? now - (actionCd[`${sel.id}:${a}`] ?? 0) < 3500 : false

  const sleepAction = {
    id: 'dormir' as PlayerAction,
    emoji: rt?.state === 'sleep' ? '⏰' : '😴',
    label: rt?.state === 'sleep' ? 'Despertar' : 'Dormir',
  }

  return (
    <section
      className="safe-b shrink-0 rounded-3xl border-2 border-rose-100 bg-white p-2.5 shadow-md sm:p-3"
      aria-label="Cuidado de mascotas"
    >
      {/* selector de mascotas */}
      <div className="thin-scroll mb-2 flex items-center gap-1.5 overflow-x-auto pb-1">
        <span className="hidden shrink-0 text-xs font-black text-slate-400 sm:inline">MASCOTAS:</span>
        {pets.length === 0 && (
          <span className="text-xs font-bold text-slate-400">
            No hay mascotas — ve a ✏️ Editar para añadir una 🐶
          </span>
        )}
        {pets.map((p) => {
          const item = catalogById[p.catalogId]
          const active = p.id === selectedId
          return (
            <button
              key={p.id}
              onClick={() => select(p.id)}
              className={cn(
                'flex shrink-0 items-center gap-1 rounded-full border-2 px-2.5 py-1 text-xs font-black transition-all active:scale-95',
                active
                  ? 'border-rose-500 bg-rose-500 text-white shadow'
                  : 'border-rose-100 bg-rose-50 text-slate-600 hover:bg-rose-100',
              )}
            >
              <span className="text-base">{item?.emoji}</span> {p.name}
              {petsMap[p.id]?.sick && <span aria-hidden>🤒</span>}
            </button>
          )
        })}
      </div>

      {!sel || !rt ? (
        <p className="py-2 text-center text-sm font-bold text-slate-400">
          👆 Toca una mascota en el mundo (o arriba) para ver sus datos y cuidarla
        </p>
      ) : (
        <>
          {/* barras de necesidades */}
          <div className="mb-3 grid grid-cols-5 gap-2">
            {STAT_KEYS.map((k) => {
              const cfg = STATS[k]
              const v = Math.round(rt.stats[k])
              const low = v < 25
              return (
                <div key={k} className="flex flex-col items-center gap-1">
                  <div className="h-3 w-full overflow-hidden rounded-full border border-black/5 bg-slate-100">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', low && 'animate-pulse')}
                      style={{ width: `${v}%`, background: cfg.color }}
                    />
                  </div>
                  <span
                    className={cn(
                      'text-[10px] font-black whitespace-nowrap',
                      low ? 'text-rose-500' : 'text-slate-500',
                    )}
                  >
                    {cfg.emoji} <span className="hidden sm:inline">{cfg.label}</span>
                  </span>
                </div>
              )
            })}
          </div>

          {/* acciones de cuidado */}
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {ACTIONS.map((a) => {
              const isSleep = a.id === 'dormir'
              const emoji = isSleep ? sleepAction.emoji : a.emoji
              const label = isSleep ? sleepAction.label : a.label
              const disabled = cooling(a.id)
              return (
                <button
                  key={a.id}
                  onClick={() => playerAction(a.id)}
                  disabled={disabled}
                  className={cn(
                    'flex h-14 flex-col items-center justify-center gap-0.5 rounded-2xl border-2 font-black transition-all active:scale-95 sm:h-16',
                    disabled
                      ? 'border-slate-100 bg-slate-50 opacity-40'
                      : 'border-amber-200 bg-white hover:bg-amber-50',
                  )}
                >
                  <span className="text-2xl">{emoji}</span>
                  <span className="text-[10px] text-slate-500">{label}</span>
                </button>
              )
            })}
            {rt.sick && (
              <button
                onClick={() => playerAction('curar')}
                disabled={cooling('curar')}
                className={cn(
                  'flex h-14 flex-col items-center justify-center gap-0.5 rounded-2xl border-2 font-black transition-all active:scale-95 sm:h-16',
                  cooling('curar')
                    ? 'border-slate-100 bg-slate-50 opacity-40'
                    : 'border-teal-300 bg-teal-50 hover:bg-teal-100',
                )}
              >
                <span className="text-2xl">🏥</span>
                <span className="text-[10px] text-teal-700">Curar</span>
              </button>
            )}
          </div>

          <p className="mt-2 hidden text-center text-[11px] font-bold text-slate-400 sm:block">
            🪙 Gana monedas cuidando a {sel.name} · gástalas en la 🛍 Tienda
          </p>
        </>
      )}
    </section>
  )
}
