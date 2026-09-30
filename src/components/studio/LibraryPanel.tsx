'use client'

// Biblioteca de objetos: pestañas Mascotas / Casa / Naturaleza.
// Se puede arrastrar un objeto al lienzo (o tocarlo para añadirlo).

import { CATALOG } from '@/lib/studio/catalog'
import { useStudio } from '@/lib/studio/store'
import { ObjKind } from '@/lib/studio/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

const TABS: { id: ObjKind; label: string }[] = [
  { id: 'pet', label: '🐾' },
  { id: 'home', label: '🏠' },
  { id: 'nature', label: '🌳' },
]

export function LibraryPanel({ className }: { className?: string }) {
  const mode = useStudio((s) => s.mode)
  const addObject = useStudio((s) => s.addObject)
  if (mode !== 'edit') return null

  return (
    <aside
      className={cn(
        'flex min-h-0 flex-col rounded-3xl border-2 border-rose-100 bg-white p-3 shadow-sm',
        className,
      )}
      aria-label="Biblioteca de objetos"
    >
      <h2 className="mb-2 px-1 text-sm font-black tracking-wide text-slate-500">
        🧸 OBJETOS <span className="ml-1 text-[10px] font-bold text-slate-400">arrastra o toca</span>
      </h2>
      <Tabs defaultValue="pet" className="flex min-h-0 flex-1 flex-col gap-2">
        <TabsList className="grid h-10 w-full grid-cols-3 rounded-full bg-rose-50 p-1">
          {TABS.map((t) => (
            <TabsTrigger
              key={t.id}
              value={t.id}
              className="rounded-full text-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
              aria-label={t.label}
            >
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {TABS.map((t) => (
          <TabsContent
            key={t.id}
            value={t.id}
            className="thin-scroll mt-0 min-h-0 flex-1 overflow-y-auto pr-1"
          >
            <div className="grid grid-cols-2 gap-2">
              {CATALOG.filter((c) => c.kind === t.id).map((item) => (
                <button
                  key={item.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', item.id)
                    e.dataTransfer.effectAllowed = 'copy'
                  }}
                  onClick={() => addObject(item.id)}
                  className="group relative flex cursor-grab flex-col items-center justify-center gap-1 rounded-2xl border-2 border-rose-100 bg-rose-50/50 py-3 transition-all touch-manipulation hover:border-amber-200 hover:bg-amber-50 active:scale-95"
                  title={`Añadir ${item.name}`}
                >
                  <span className="text-3xl transition-transform group-hover:scale-110">
                    {item.emoji}
                  </span>
                  <span className="text-xs font-bold text-slate-600">{item.name}</span>
                  {item.special && (
                    <span
                      className="absolute top-1 right-1.5 text-[10px]"
                      title="Objeto mágico: las mascotas lo usan solas ✨"
                      aria-hidden
                    >
                      ✨
                    </span>
                  )}
                </button>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </aside>
  )
}
