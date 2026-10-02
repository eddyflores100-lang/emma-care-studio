'use client'

// Emma Care Studio — página principal (v0.8: ¡el juego es el prota!)
// · El lienzo ocupa TODA la pantalla (móvil horizontal y escritorio).
// · Controles esenciales en un dock flotante pequeñito.
// · Todo lo demás vive en la mochila: panel oculto que aparece tocando
//   el lado derecho de la página (submenu apilable).
// · Escritorio (lg+) en modo editar: columnas clásicas biblioteca|mundo|ajustes.

import { useEffect } from 'react'
import { useStudio } from '@/lib/studio/store'
import { createAutosave } from '@/lib/studio/autosave'
import { keepScreenAwake, maintainLandscape, enterLandscape } from '@/lib/studio/screen'
import { voiceEngine, attachVoiceLifecycle } from '@/lib/studio/voice'
import { attachAudioRecovery, unlockAudio } from '@/lib/studio/sound'
import { HeaderBar } from '@/components/studio/HeaderBar'
import { LevelBar } from '@/components/studio/LevelBar'
import { IntroSplash } from '@/components/studio/IntroSplash'
import { LibraryPanel } from '@/components/studio/LibraryPanel'
import { WorldCanvas } from '@/components/studio/WorldCanvas'
import { PropertiesPanel } from '@/components/studio/PropertiesPanel'
import { RulesPanel } from '@/components/studio/RulesPanel'
import { PlayHUD } from '@/components/studio/PlayHUD'
import { RightDrawer } from '@/components/studio/RightDrawer'

export default function Home() {
  const mode = useStudio((s) => s.mode)

  useEffect(() => {
    if (mode !== 'play') return
    const cleanups = [keepScreenAwake(), maintainLandscape(), attachVoiceLifecycle(), attachAudioRecovery()]
    return () => cleanups.forEach(cleanup => cleanup())
  }, [mode])

  // cargar proyecto guardado al abrir + conectar la VOZ con el motor
  useEffect(() => {
    useStudio.getState().hydrate()
    voiceEngine.setHandler((text) => {
      return useStudio.getState().voiceCommand(text)
    })
    // acceso al motor desde la consola (útil para depurar y probar)
    ;(window as unknown as { __emma?: typeof useStudio }).__emma = useStudio
    return () => voiceEngine.clearHandler()
  }, [])

  // ===== AUTOGUARDADO =====
  // se guarda solo 1.2 s después de cualquier cambio importante
  // (objetos, reglas, monedas, mundos) y también al cerrar/ocultar la pestaña
  useEffect(() => {
    const autosave = createAutosave(() => useStudio.getState().saveSilent())
    const saveNow = autosave.flush
    const unsub = useStudio.subscribe((s, prev) => {
      const dirty =
        s.hydrated && (s.objects !== prev.objects ||
        s.pets !== prev.pets ||
        s.rules !== prev.rules ||
        s.coins !== prev.coins || s.progression !== prev.progression ||
        s.currentLevel !== prev.currentLevel ||
        s.unlockedLevels !== prev.unlockedLevels)
      if (!dirty) return
      if (s.lastSavedAt > 0) useStudio.setState({ lastSavedAt: 0 })
      autosave.schedule()
    })
    const onHide = () => {
      if (document.visibilityState === 'hidden') saveNow()
    }
    window.addEventListener('pagehide', saveNow)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      unsub()
      autosave.dispose()
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
    <main className={`emma-app flex h-[100dvh] flex-col overflow-hidden bg-[#FFF7ED] ${mode === 'play' ? 'emma-immersive' : ''}`}>
      {mode === 'edit' && <><HeaderBar /><LevelBar /></>}
      <IntroSplash />

      {mode === 'edit' ? (
        <>
          {/* ===== Móvil/tablet: el lienzo manda; herramientas en la mochila ===== */}
          <div className="emma-stage relative min-h-0 flex-1 lg:hidden">
            <div className="absolute inset-0 px-2 pb-2 pt-2">
              <WorldCanvas />
            </div>
            <RightDrawer key="edit" mode="edit" />
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
        /* ===== JUGAR: el mundo llena TODO; dock flotante + mochila ===== */
        <div className="relative min-h-0 flex-1">
          <div className="emma-play-canvas absolute inset-0">
            <WorldCanvas />
          </div>
          <PlayHUD />
          <RightDrawer key="play" mode="play" />
          {/* en móvil vertical: mejor de lado */}
          <div className="emma-rotate fixed left-1/2 top-12 z-40 hidden max-[1024px]:portrait:block">
            <button type="button" className="rounded-xl bg-white px-3 py-2 font-bold text-rose-600 shadow" onClick={() => { void unlockAudio(); void enterLandscape() }}>
              🔄 Volver a horizontal
            </button>
            <p className="mt-1 text-xs">Si no gira, gira el teléfono y desactiva el bloqueo de rotación.</p>
          </div>
        </div>
      )}
    </main>
  )
}
