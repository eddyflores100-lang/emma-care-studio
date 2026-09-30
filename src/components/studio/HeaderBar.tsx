'use client'

// Barra superior: logo, guardar/exportar/nuevo (editor) y monedas + tienda
// (modo juego). También el botón grande ▶️ ¡JUGAR!

import { useStudio } from '@/lib/studio/store'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { ShopItemId } from '@/lib/studio/types'

function ShopDialog() {
  const coins = useStudio((s) => s.coins)
  const buy = useStudio((s) => s.buyShopItem)

  const items: { id: ShopItemId; emoji: string; name: string; desc: string; price: number }[] = [
    { id: 'cake', emoji: '🎂', name: 'Pastel', desc: 'Felicidad +25 a la mascota elegida', price: 15 },
    { id: 'toy', emoji: '🧸', name: 'Juguete', desc: 'Aparecerá en el jardín', price: 30 },
    { id: 'cat', emoji: '🐱', name: 'Adoptar gato', desc: 'Un nuevo amigo para casa', price: 40 },
    { id: 'rabbit', emoji: '🐰', name: 'Adoptar conejo', desc: 'Un nuevo amigo saltarín', price: 60 },
  ]

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="rounded-full bg-amber-400 font-black text-amber-950 shadow-md shadow-amber-100 hover:bg-amber-500">
          🛍 Tienda
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm rounded-3xl border-2 border-amber-100">
        <DialogHeader>
          <DialogTitle className="font-black">🛍 Tienda de Emma Care</DialogTitle>
          <DialogDescription className="text-xs font-bold">
            Gana monedas cuidando a tus mascotas y cómpralas aquí
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {items.map((it) => (
            <div
              key={it.id}
              className="flex items-center gap-3 rounded-2xl border-2 border-amber-100 bg-amber-50/50 p-2.5"
            >
              <span className="text-3xl" aria-hidden>
                {it.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black">{it.name}</p>
                <p className="text-xs text-slate-500">{it.desc}</p>
              </div>
              <Button
                size="sm"
                onClick={() => buy(it.id)}
                className="shrink-0 rounded-full bg-emerald-500 font-black text-white hover:bg-emerald-600"
              >
                {it.price} 🪙
              </Button>
            </div>
          ))}
        </div>
        <p className="text-center text-xs font-bold text-slate-400">
          Tienes 🪙 {coins} monedas
        </p>
      </DialogContent>
    </Dialog>
  )
}

export function HeaderBar() {
  const mode = useStudio((s) => s.mode)
  const coins = useStudio((s) => s.coins)
  const muted = useStudio((s) => s.muted)
  const startPlay = useStudio((s) => s.startPlay)
  const stopPlay = useStudio((s) => s.stopPlay)
  const saveProject = useStudio((s) => s.saveProject)
  const exportProject = useStudio((s) => s.exportProject)
  const newProject = useStudio((s) => s.newProject)
  const toggleMute = useStudio((s) => s.toggleMute)

  return (
    <header className="flex shrink-0 items-center justify-between gap-2 border-b-2 border-rose-100 bg-white/85 px-3 py-2.5 backdrop-blur sm:px-4">
      <div className="flex min-w-0 items-center gap-2">
        <span className="text-2xl" aria-hidden>
          🎮
        </span>
        <h1 className="truncate text-base font-black tracking-tight sm:text-lg">
          <span className="text-rose-500">EMMA</span> <span className="text-amber-500">CARE</span>{' '}
          <span className="text-emerald-600">STUDIO</span>
        </h1>
        <span className="hidden text-xs font-bold text-slate-400 md:inline">
          {mode === 'edit' ? '✏️ editor de juegos para niños' : '🐾 modo juego'}
        </span>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {mode === 'edit' ? (
          <>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="rounded-full text-lg"
                  title="Empezar un mundo nuevo"
                  aria-label="Nuevo proyecto"
                >
                  🆕
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-3xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-black">
                    ¿Empezar un mundo nuevo?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Se vaciará el editor (lo que guardaste antes con 💾 no se borra).
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-full font-bold">
                    Seguir editando
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={newProject}
                    className="rounded-full bg-rose-500 font-black text-white hover:bg-rose-600"
                  >
                    ¡Sí, nuevo! ✨
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button
              variant="ghost"
              onClick={exportProject}
              className="rounded-full text-lg"
              title="Descargar proyecto en JSON"
              aria-label="Descargar proyecto"
            >
              ⬇️
            </Button>

            <Button
              onClick={saveProject}
              className="rounded-full bg-emerald-500 font-black text-white hover:bg-emerald-600"
              title="Guardar proyecto"
            >
              💾 <span className="hidden sm:inline">Guardar</span>
            </Button>

            <Button
              onClick={startPlay}
              className="rounded-full bg-rose-500 px-4 font-black text-white shadow-lg shadow-rose-200 transition-transform hover:bg-rose-600 hover:shadow-rose-300 active:scale-95 sm:px-6"
            >
              ▶️ ¡JUGAR!
            </Button>
          </>
        ) : (
          <>
            <div
              className="flex items-center gap-1 rounded-full border-2 border-amber-300 bg-amber-100 px-3 py-1.5 text-sm font-black text-amber-700"
              title="Tus monedas"
            >
              <span aria-hidden>🪙</span> {coins}
            </div>
            <ShopDialog />
            <Button
              variant="outline"
              onClick={stopPlay}
              className="rounded-full border-2 font-black"
            >
              ✏️ <span className="hidden sm:inline">Editar</span>
            </Button>
          </>
        )}

        <Button
          variant="ghost"
          onClick={toggleMute}
          className="rounded-full text-lg"
          title={muted ? 'Activar sonido' : 'Silenciar'}
          aria-label={muted ? 'Activar sonido' : 'Silenciar'}
        >
          {muted ? '🔇' : '🔊'}
        </Button>
      </div>
    </header>
  )
}
