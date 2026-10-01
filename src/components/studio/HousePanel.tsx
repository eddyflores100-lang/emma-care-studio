'use client'

// Emma Care Studio — PANEL DE LA CASITA
// Se abre al tocar la casita cuando hay mascotas DENTRO (mandadas por voz:
// «Max a la casita»). Muestra quiénes están dentro, cómo están, y permite
// sacarlas: una por una («¡Fuera!») o todas juntas («¡Sacar a todos!»).

import { useStudio } from '@/lib/studio/store'
import { catalogById } from '@/lib/studio/catalog'

export function HousePanel() {
  const housePanel = useStudio((s) => s.housePanel)
  const objects = useStudio((s) => s.objects)
  const pets = useStudio((s) => s.pets)
  const closeHouse = useStudio((s) => s.closeHouse)
  const comeOutOf = useStudio((s) => s.comeOutOf)

  if (!housePanel) return null
  const casa = objects.find((o) => o.id === housePanel)
  if (!casa) return null
  const dentro = objects.filter(
    (o) => catalogById[o.catalogId]?.kind === 'pet' && pets[o.id]?.inside === housePanel,
  )

  return (
    <div className="emma-house-panel" role="dialog" aria-label={`Quién está dentro de ${casa.name}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-xs font-black text-slate-700">
          🏠 {casa.name}
          <span className="ml-1 font-bold text-slate-400">
            {dentro.length ? `· ${dentro.length} dentro` : '· vacía'}
          </span>
        </p>
        <button
          type="button"
          onClick={closeHouse}
          className="shrink-0 text-xs font-black text-slate-400 transition-colors hover:text-slate-600"
          aria-label="Cerrar el panel de la casa"
        >
          ✕
        </button>
      </div>

      {dentro.length === 0 ? (
        <p className="text-[11px] font-bold text-slate-500">
          Nadie está dentro ahora mismo. Dícionales «¡Max a la casita!» por voz 🎙️
        </p>
      ) : (
        <>
          <ul className="emma-house-list">
            {dentro.map((p) => {
              const it = catalogById[p.catalogId]
              const rt = pets[p.id]
              return (
                <li key={p.id} className="flex items-center gap-1.5 rounded-xl bg-amber-50 px-2 py-1">
                  <span className="text-base leading-none" aria-hidden>
                    {it?.emoji ?? '🐾'}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[11px] font-black text-slate-700">
                    {p.name}
                    <span className="ml-1 font-bold text-slate-400">
                      {rt?.injured || rt?.sick ? '🩹 curándose' : '😴 tranquila'}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => comeOutOf(housePanel, p.id)}
                    className="shrink-0 rounded-full border-2 border-amber-300 bg-white px-2 py-0.5 text-[10px] font-black text-amber-700 transition-transform active:scale-95"
                    title={`Saca a ${p.name} de la casita`}
                  >
                    ¡Fuera!
                  </button>
                </li>
              )
            })}
          </ul>
          <button
            type="button"
            onClick={() => comeOutOf(housePanel, 'all')}
            className="w-full rounded-xl border-2 border-sky-300 bg-sky-50 py-1.5 text-[11px] font-black text-sky-700 transition-transform active:scale-95"
          >
            🚪 ¡Sacar a todos!
          </button>
        </>
      )}
    </div>
  )
}
