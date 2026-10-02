'use client'

// Barra superior: logo, guardar/exportar/nuevo (editor) y monedas + tienda
// (modo juego). También el botón grande ▶️ ¡JUGAR!, el micrófono de
// pantalla completa ⛶ y el silenciador.

import { enterLandscape } from '@/lib/studio/screen'
import { useRef, useSyncExternalStore } from 'react'
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
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { MAX_PROJECT_BYTES } from '@/lib/studio/persistence'

function ShopDialog() {
  const coins = useStudio((s) => s.coins)
  const buy = useStudio((s) => s.buyShopItem)

  const items: { id: ShopItemId; emoji: string; name: string; desc: string; price: number }[] = [
    { id: 'cake', emoji: '🎂', name: 'Pastel', desc: 'Felicidad +25 a la mascota elegida', price: 15 },
    { id: 'toy', emoji: '🧸', name: 'Juguete', desc: 'Aparecerá en el mundo actual', price: 30 },
    { id: 'mouse', emoji: '🐭', name: 'Adoptar ratón', desc: '¡Pi pi pi! … pero el gato lo persigue', price: 20 },
    { id: 'bird', emoji: '🐦', name: 'Adoptar pajarito', desc: 'Trina feliz… y huye de los gatos', price: 30 },
    { id: 'cat', emoji: '🐱', name: 'Adoptar gato', desc: 'Maúlla y caza ratones (¡y huye del perro!)', price: 40 },
    { id: 'chicken', emoji: '🐔', name: 'Adoptar gallina', desc: 'Cacarea de pánico si la persiguen', price: 45 },
    { id: 'hamster', emoji: '🐹', name: 'Adoptar hámster', desc: 'Pequeño, dulce y muy asustadizo', price: 55 },
    { id: 'rabbit', emoji: '🐰', name: 'Adoptar conejo', desc: 'Un amigo saltarín y ruidoso', price: 60 },
    { id: 'duck', emoji: '🦆', name: 'Adoptar pato', desc: '¡Cuac cuac! sin parar (y con miedo)', price: 70 },
    { id: 'fox', emoji: '🦊', name: 'Adoptar zorro', desc: 'Hace ¡yip yip! y trae la pelota', price: 80 },
    { id: 'pig', emoji: '🐷', name: 'Adoptar cerdito', desc: 'Nunca para de hacer ¡oink!', price: 90 },
    { id: 'monkey', emoji: '🐵', name: 'Adoptar monito', desc: 'Parlotea sin parar: ¡uja uja!', price: 100 },
    { id: 'turtle', emoji: '🐢', name: 'Adoptar tortuga', desc: 'Lenta y tranquila: se esconde en su caparazón', price: 110 },
    { id: 'panda', emoji: '🐼', name: 'Adoptar panda', desc: 'Balbucea dulcemente: ¡brrr!', price: 120 },
    { id: 'bear', emoji: '🐻', name: 'Adoptar oso', desc: 'Gruñe fuerte y ronca al dormir', price: 140 },
    { id: 'lion', emoji: '🦁', name: 'Adoptar león', desc: 'Su rugido se oye en todo el mundo', price: 180 },
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
        <div className="thin-scroll max-h-[50vh] space-y-2 overflow-y-auto">
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
  const saveError = useStudio(s => s.saveError)
  const fileInput = useRef<HTMLInputElement>(null)
  const importProject = useStudio(s => s.importProject)
  const restoreBackup = useStudio(s => s.restoreBackup)
  const lastSavedAt = useStudio((s) => s.lastSavedAt)
  const startPlay = useStudio((s) => s.startPlay)
  const stopPlay = useStudio((s) => s.stopPlay)
  const saveProject = useStudio((s) => s.saveProject)
  const exportProject = useStudio((s) => s.exportProject)
  const newProject = useStudio((s) => s.newProject)
  const toggleMute = useStudio((s) => s.toggleMute)

  // ===== PANTALLA COMPLETA =====
  // el juego ocupa todo el monitor o toda la pantalla del móvil y, en
  // Android, se intenta fijar la orientación horizontal (en iPhone no hay
  // fullscreen en la web: ahí el botón no aparece y el juego sigue normal)
  const subscribeFs = (cb: () => void) => {
    document.addEventListener('fullscreenchange', cb)
    return () => document.removeEventListener('fullscreenchange', cb)
  }
  const fsOn = useSyncExternalStore(
    subscribeFs,
    () => !!document.fullscreenElement,
    () => false,
  )
  const fsOk = useSyncExternalStore(
    subscribeFs,
    () => !!document.fullscreenEnabled,
    () => false,
  )

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await enterLandscape()
      } else {
        try {
          screen.orientation?.unlock?.()
        } catch {
          /* nada */
        }
        await document.exitFullscreen()
      }
    } catch {
      /* usuario canceló o navegador no lo permite */
    }
  }

  return (
    <header className="emma-top flex shrink-0 items-center justify-between gap-1.5 border-b-2 border-rose-100 bg-white/85 px-2.5 py-2.5 backdrop-blur sm:gap-2 sm:px-4">
      <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
        <span className="emma-logo text-2xl" aria-hidden>
          🎮
        </span>
        <h1 className="truncate text-sm font-black tracking-tight sm:text-lg">
          <span className="text-rose-500">EMMA</span> <span className="text-amber-500">CARE</span>{' '}
          <span className="text-emerald-600">STUDIO</span>
        </h1>
        <span className="hidden text-xs font-bold text-slate-400 lg:inline">
          {mode === 'edit' ? '✏️ editor de juegos para niños' : '🐾 modo juego'}
        </span>
        {saveError && <span className="text-xs font-bold text-rose-600" role="status">⚠️ Sin guardar</span>}
        {lastSavedAt > 0 && !saveError && (
          <span
            key={lastSavedAt}
            className="emma-saved hidden rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-600 sm:inline"
          >
            ✓ guardado
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {mode === 'edit' ? (
          <>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="hidden rounded-full text-lg sm:inline-flex"
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
                    Empezarás otro mundo. Conservaremos una copia del actual: puedes volver con 📂 → Recuperar anterior.
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

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" className="rounded-full text-lg" aria-label="Archivos del mundo" title="Abrir, descargar o recuperar mundo">📂</Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm rounded-3xl">
                <DialogHeader>
                  <DialogTitle>📂 Tus mundos</DialogTitle>
                  <DialogDescription>Guarda una copia para llevar tu mundo y su progreso a otro dispositivo.</DialogDescription>
                </DialogHeader>
                <input ref={fileInput} type="file" accept=".json,application/json" className="hidden" aria-label="Archivo del mundo"
                  onChange={async e => {
                    const file = e.target.files?.[0]
                    e.target.value = ''
                    if (!file) return
                    if (file.size > MAX_PROJECT_BYTES) { toast('El archivo es demasiado grande (máximo 2 MB)'); return }
                    try { importProject(await file.text()) } catch { toast('No se pudo leer el archivo') }
                  }} />
                <Button onClick={() => fileInput.current?.click()}>📂 Abrir archivo JSON</Button>
                <Button variant="outline" onClick={exportProject}>⬇️ Descargar este mundo</Button>
                <Button variant="outline" onClick={() => restoreBackup()}>↩️ Recuperar anterior</Button>
              </DialogContent>
            </Dialog>

            <Button
              onClick={saveProject}
              className="rounded-full bg-emerald-500 px-3 font-black text-white hover:bg-emerald-600 sm:px-4"
              title="Guardar proyecto"
            >
              💾 <span className="hidden sm:inline">Guardar</span>
            </Button>

            <Button
              onClick={startPlay}
              className="rounded-full bg-rose-500 px-3 font-black text-white shadow-lg shadow-rose-200 transition-transform hover:bg-rose-600 hover:shadow-rose-300 active:scale-95 sm:px-6"
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

        {fsOk && (
          <Button
            variant={fsOn ? 'default' : 'ghost'}
            onClick={toggleFullscreen}
            className={cn(
              'rounded-full text-lg',
              fsOn && 'bg-rose-500 font-black text-white hover:bg-rose-600',
            )}
            title={
              fsOn
                ? 'Salir de pantalla completa'
                : 'Pantalla completa: ¡el juego llena toda la pantalla! (en el móvil se pone horizontal)'
            }
            aria-label="Pantalla completa"
          >
            {fsOn ? '🗗' : '⛶'}
          </Button>
        )}
      </div>
    </header>
  )
}
