'use client'

// Emma Care Studio — página principal
// Editor visual de juegos para niños: arrastra → suelta → configura → juega.
//
// Responsive:
//  · Móvil/tablet (<lg): lienzo arriba (40vh) + pestañas 🧸 Objetos / ⚙️ Ajustes / 🧩 Reglas
//  · Escritorio (lg+): biblioteca | lienzo | propiedades en columnas + reglas abajo

import { useEffect } from 'react'
import { useStudio } from '@/lib/studio/store'
import { HeaderBar } from '@/components/studio/HeaderBar'
import { LevelBar } from '@/components/studio/LevelBar'
import { IntroSplash } from '@/components/studio/IntroSplash'
import { LibraryPanel } from '@/components/studio/LibraryPanel'
import { WorldCanvas } from '@/components/studio/WorldCanvas'
import { PropertiesPanel } from '@/components/studio/PropertiesPanel'
import { RulesPanel } from '@/components/studio/RulesPanel'
import { PlayHUD } from '@/components/studio/PlayHUD'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function Home() {
  const mode = useStudio((s) => s.mode)
  const mobileTab = useStudio((s) => s.mobileTab)
  const setMobileTab = useStudio((s) => s.setMobileTab)

  // cargar proyecto guardado al abrir
  useEffect(() => {
    useStudio.getState().hydrate()
    // acceso al motor desde la consola (útil para depurar y probar)
    ;(window as unknown as { __emma?: typeof useStudio }).__emma = useStudio
  }, [])

  // ===== AUTOGUARDADO =====
  // se guarda solo 1.2 s después de cualquier cambio importante
  // (objetos, reglas, monedas, mundos) y también al cerrar/ocultar la pestaña
  useEffect(() => {
    let timer: number | null = null
    const saveNow = () => {
      if (timer) window.clearTimeout(timer)
      timer = null
      useStudio.getState().saveSilent()
    }
    const unsub = useStudio.subscribe((s, prev) => {
      const dirty =
        s.objects !== prev.objects ||
        s.rules !== prev.rules ||
        s.coins !== prev.coins ||
        s.currentLevel !== prev.currentLevel ||
        s.unlockedLevels !== prev.unlockedLevels
      if (!dirty) return
      if (timer) window.clearTimeout(timer)
      timer = window.setTimeout(saveNow, 1200)
    })
    const onHide = () => {
      if (document.visibilityState === 'hidden') saveNow()
    }
    window.addEventListener('pagehide', saveNow)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      unsub()
      if (timer) window.clearTimeout(timer)
      window.removeEventListener('pagehide', saveNow)
      document.removeEventListener('visibilitychange', onHide)
    }
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
      <LevelBar />
      <IntroSplash />

      {mode === 'edit' ? (
        <>
          {/* ===== Móvil / tablet: lienzo + pestañas (en horizontal, lado a lado) ===== */}
          <div className="emma-mob-edit flex min-h-0 flex-1 flex-col lg:hidden">
            <div className="emma-mob-canvas h-[42vh] min-h-[250px] shrink-0 px-3 pt-3">
              <WorldCanvas />
            </div>
            <Tabs
              value={mobileTab}
              onValueChange={(v) => setMobileTab(v as typeof mobileTab)}
              className="emma-mob-side flex min-h-0 flex-1 flex-col pt-3"
            >
              <TabsList className="mx-3 grid h-11 w-auto shrink-0 grid-cols-3 rounded-full bg-rose-100 p-1">
                <TabsTrigger value="objetos" className="rounded-full text-xs font-black">
                  🧸 Objetos
                </TabsTrigger>
                <TabsTrigger value="ajustes" className="rounded-full text-xs font-black">
                  ⚙️ Ajustes
                </TabsTrigger>
                <TabsTrigger value="reglas" className="rounded-full text-xs font-black">
                  🧩 Reglas
                </TabsTrigger>
              </TabsList>
              <TabsContent value="objetos" className="mt-3 min-h-0 flex-1 px-3">
                <LibraryPanel className="h-full" />
              </TabsContent>
              <TabsContent value="ajustes" className="mt-3 min-h-0 flex-1 px-3">
                <PropertiesPanel className="h-full" />
              </TabsContent>
              <TabsContent value="reglas" className="mt-3 min-h-0 flex-1">
                <RulesPanel fill className="h-full" />
              </TabsContent>
            </Tabs>
          </div>

          {/* ===== Escritorio: tres columnas + reglas abajo ===== */}
          <div className="hidden min-h-0 flex-1 lg:flex lg:flex-row lg:gap-3 lg:p-3 lg:pb-0">
            <LibraryPanel className="w-52 shrink-0" />
            <div className="min-h-0 min-w-0 flex-1">
              <WorldCanvas />
            </div>
            <PropertiesPanel className="w-64 shrink-0" />
          </div>
          <div className="hidden lg:block">
            <RulesPanel />
          </div>
        </>
      ) : (
        <div className="emma-play flex min-h-0 flex-1 flex-col gap-2 p-3 sm:gap-3 sm:p-3">
          <div className="emma-canvas-play min-h-0 flex-1">
            <WorldCanvas />
          </div>
          <PlayHUD />
          {/* en móvil vertical: mejor de lado (el HUD y el mundo se estiran) */}
          <div className="emma-rotate pointer-events-none fixed left-1/2 top-12 z-40 hidden max-[1024px]:portrait:block">
            🔄 Gira el móvil: ¡se juega mejor en horizontal!
          </div>
        </div>
      )}
    </main>
  )
}
