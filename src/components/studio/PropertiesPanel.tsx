'use client'

// Panel de propiedades del objeto seleccionado: nombre, tamaño, color y
// velocidad (mascotas). Si no hay nada seleccionado, muestra consejos.

import { useStudio } from '@/lib/studio/store'
import { catalogById } from '@/lib/studio/catalog'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const HUES = [0, 45, 90, 150, 210, 270, 320]
const SPEEDS = [
  { v: 4, l: '🐢 Lenta' },
  { v: 8, l: '🚶 Normal' },
  { v: 14, l: '🐇 Rápida' },
]

export function PropertiesPanel({ className }: { className?: string }) {
  const mode = useStudio((s) => s.mode)
  const objects = useStudio((s) => s.objects)
  const selectedId = useStudio((s) => s.selectedId)
  const updateObject = useStudio((s) => s.updateObject)
  const removeObject = useStudio((s) => s.removeObject)

  if (mode !== 'edit') return null

  const obj = objects.find((o) => o.id === selectedId) ?? null
  const item = obj ? catalogById[obj.catalogId] : null
  const isPet = item?.kind === 'pet'

  return (
    <aside
      className={cn(
        'thin-scroll flex flex-col gap-3 overflow-y-auto rounded-3xl border-2 border-amber-100 bg-white p-3 shadow-sm',
        className,
      )}
      aria-label="Propiedades del objeto"
    >
      <h2 className="px-1 text-sm font-black tracking-wide text-slate-500">⚙️ PROPIEDADES</h2>

      {!obj || !item ? (
        <div className="space-y-2.5 p-1 text-sm font-semibold text-slate-500">
          <p className="py-2 text-center text-4xl" aria-hidden>
            👆
          </p>
          <p>👆 Toca un objeto del mundo para cambiarlo.</p>
          <p>🧸 Arrastra objetos desde la biblioteca.</p>
          <p>🧩 Crea reglas mágicas abajo.</p>
          <p>▶️ ¡Y pulsa JUGAR para probar tu juego!</p>
        </div>
      ) : (
        <>
          {/* vista previa */}
          <div className="flex items-center justify-center rounded-2xl bg-gradient-to-b from-emerald-50 to-amber-50 py-3">
            <span
              className="text-5xl drop-shadow"
              style={{ filter: obj.hue ? `hue-rotate(${obj.hue}deg) saturate(1.25)` : undefined }}
            >
              {item.emoji}
            </span>
          </div>

          <div>
            <label htmlFor="obj-name" className="text-[11px] font-black text-slate-500">
              NOMBRE
            </label>
            <Input
              id="obj-name"
              value={obj.name}
              maxLength={14}
              onChange={(e) => updateObject(obj.id, { name: e.target.value })}
              className="mt-1 rounded-xl border-2 font-bold"
            />
          </div>

          <div>
            <label className="text-[11px] font-black text-slate-500">
              TAMAÑO <span className="text-slate-400">{obj.size.toFixed(1)}×</span>
            </label>
            <Slider
              value={[obj.size]}
              min={0.6}
              max={2.4}
              step={0.1}
              onValueChange={(v) => updateObject(obj.id, { size: v[0] })}
              className="mt-2"
              aria-label="Tamaño del objeto"
            />
          </div>

          <div>
            <label className="text-[11px] font-black text-slate-500">COLOR</label>
            <div className="mt-1.5 flex gap-1.5">
              {HUES.map((h) => (
                <button
                  key={h}
                  onClick={() => updateObject(obj.id, { hue: h })}
                  className={cn(
                    'h-7 w-7 rounded-full border-2 transition-transform',
                    obj.hue === h ? 'scale-110 border-slate-700' : 'border-white shadow',
                  )}
                  style={{ background: `hsl(${h} 85% 60%)` }}
                  aria-label={`Color ${h}`}
                  title={`Color ${h}`}
                />
              ))}
            </div>
            <input
              type="range"
              min={0}
              max={330}
              step={15}
              value={obj.hue}
              onChange={(e) => updateObject(obj.id, { hue: Number(e.target.value) })}
              className="hue-slider mt-2.5 w-full"
              aria-label="Color del objeto"
            />
          </div>

          {isPet && (
            <div>
              <label className="text-[11px] font-black text-slate-500">VELOCIDAD</label>
              <div className="mt-1 grid grid-cols-3 gap-1.5">
                {SPEEDS.map((o) => (
                  <button
                    key={o.v}
                    onClick={() => updateObject(obj.id, { speed: o.v })}
                    className={cn(
                      'rounded-xl border-2 py-1.5 text-xs font-bold transition-colors',
                      (obj.speed ?? 8) === o.v
                        ? 'border-rose-500 bg-rose-500 text-white'
                        : 'border-rose-100 bg-white text-slate-600 hover:bg-rose-50',
                    )}
                  >
                    {o.l}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button
            variant="outline"
            onClick={() => removeObject(obj.id)}
            className="mt-1 rounded-xl border-2 border-rose-200 font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700"
          >
            🗑 Quitar del mundo
          </Button>
        </>
      )}
    </aside>
  )
}
