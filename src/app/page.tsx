'use client'

// Emma Care Studio — página principal
// Editor visual de juegos para niños: arrastra → suelta → configura → juega.

import { useEffect } from 'react'
import { useStudio } from '@/lib/studio/store'
import { HeaderBar } from '@/components/studio/HeaderBar'
import { LibraryPanel } from '@/components/studio/LibraryPanel'
import { WorldCanvas } from '@/components/studio/WorldCanvas'
import { PropertiesPanel } from '@/components/studio/PropertiesPanel'
import { RulesPanel } from '@/components/studio/RulesPanel'
import { PlayHUD } from '@/components/studio/PlayHUD'

export default function Home() {
  const mode = useStudio((s) => s.mode)

  // cargar proyecto guardado al abrir
  useEffect(() => {
    useStudio.getState().hydrate()
  }, [])

  // bucle de juego: movimiento suave (rAF) + tick de necesidades (1 s)
  useEffect(() => {
    if (mode !== 'play') return
    let raf = 0
    let last = performance.now()
    const loop = (t: number) => {
      const dt = t - last
      last = t
      useStudio.getState().moveTick(dt)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    const iv = window.setInterval(() => {
      if (!document.hidden) useStudio.getState().gameTick()
    }, 1000)
    return () => {
      cancelAnimationFrame(raf)
      window.clearInterval(iv)
    }
  }, [mode])

  return (
    <main className="flex h-[100dvh] flex-col overflow-hidden bg-[#FFF7ED]">
      <HeaderBar />

      {mode === 'edit' ? (
        <>
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 pb-3 lg:flex-row lg:overflow-hidden">
            <WorldCanvasWrapper />
            <LibraryPanel className="order-2 max-h-64 shrink-0 lg:order-1 lg:w-52 lg:max-h-none" />
            <PropertiesPanel className="order-3 max-h-80 shrink-0 lg:w-64 lg:max-h-none" />
          </div>
          <RulesPanel />
        </>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
          <div className="min-h-0 flex-1">
            <WorldCanvas />
          </div>
          <PlayHUD />
        </div>
      )}
    </main>
  )
}

/** Contenedor del lienzo: primero en pantallas pequeñas, centro en grandes */
function WorldCanvasWrapper() {
  return (
    <div className="order-1 min-h-[340px] flex-1 lg:order-2 lg:min-h-0">
      <WorldCanvas />
    </div>
  )
}
