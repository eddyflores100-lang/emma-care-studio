'use client'

// Barra de mundos/niveles: viajes entre Jardín, Casa, Hospital y Playa.
// Los mundos cerrados se abren con monedas ganadas cuidando mascotas.

import { useStudio } from '@/lib/studio/store'
import { LEVELS } from '@/lib/studio/catalog'
import { cn } from '@/lib/utils'

export function LevelBar() {
  const currentLevel = useStudio((s) => s.currentLevel)
  const unlockedLevels = useStudio((s) => s.unlockedLevels)
  const coins = useStudio((s) => s.coins)
  const setLevel = useStudio((s) => s.setLevel)

  return (
    <nav
      className="emma-levels thin-scroll flex shrink-0 items-center gap-1.5 overflow-x-auto px-2.5 py-1.5 sm:px-4"
      aria-label="Mundos del juego"
    >
      <span className="hidden shrink-0 text-[11px] font-black tracking-wide text-slate-400 sm:inline">
        🗺️ MUNDOS:
      </span>
      {LEVELS.map((l) => {
        const unlocked = unlockedLevels.includes(l.id)
        const active = currentLevel === l.id
        return (
          <button
            key={l.id}
            onClick={() => setLevel(l.id)}
            title={unlocked ? l.desc : `${l.desc} — cuesta ${l.cost} 🪙`}
            aria-label={
              unlocked ? `Ir al mundo ${l.name}` : `Desbloquear el mundo ${l.name} por ${l.cost} monedas`
            }
            className={cn(
              'flex shrink-0 items-center gap-1 rounded-full border-2 px-2.5 py-1.5 text-xs font-black whitespace-nowrap transition-all active:scale-95',
              active
                ? 'border-rose-500 bg-rose-500 text-white shadow-md shadow-rose-200'
                : unlocked
                  ? 'border-emerald-200 bg-white text-slate-600 hover:border-emerald-400 hover:bg-emerald-50'
                  : 'border-slate-200 bg-slate-50 text-slate-400 hover:border-amber-300 hover:bg-amber-50 hover:text-slate-600',
            )}
          >
            <span className="text-base" aria-hidden>
              {unlocked ? l.emoji : '🔒'}
            </span>
            {l.name}
            {!unlocked && <span className="text-[10px] font-bold">{l.cost} 🪙</span>}
          </button>
        )
      })}
      <span className="ml-auto hidden shrink-0 pl-2 text-[10px] font-bold text-slate-400 xl:inline">
        Gana 🪙 cuidando mascotas para abrir mundos nuevos · tienes {coins} 🪙
      </span>
    </nav>
  )
}
