'use client'

// Portada de bienvenida del juego: se muestra la primera vez que se abre
// la web. Presenta el juego y da acceso directo a JUGAR o a construir.

import { useEffect, useState } from 'react'
import { useStudio } from '@/lib/studio/store'
import { Button } from '@/components/ui/button'

const SEEN_KEY = 'emma-intro-seen-v3'

const PARADE = ['🐶', '🐱', '🐭', '🐰', '🦊', '🐔', '🐻', '🐼', '🦁', '🐷', '🐵', '🦆', '🐦', '🐹', '🐢']

export function IntroSplash() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // diferido para no causar renders en cascada durante el montaje
    const t = setTimeout(() => {
      try {
        if (!localStorage.getItem(SEEN_KEY)) setShow(true)
      } catch {
        setShow(true)
      }
    }, 0)
    return () => clearTimeout(t)
  }, [])

  function close() {
    try {
      localStorage.setItem(SEEN_KEY, '1')
    } catch {
      // sin localStorage: solo cerrar
    }
    setShow(false)
  }

  if (!show) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-gradient-to-b from-rose-100 via-amber-50 to-emerald-100 p-4"
      role="dialog"
      aria-label="Bienvenida a Emma Care Studio"
    >
      <div className="my-auto w-full max-w-md rounded-[2rem] border-4 border-white bg-white/95 p-6 text-center shadow-2xl">
        <p className="text-[11px] font-black tracking-[0.2em] text-rose-400">
          EL ESTUDIO DE JUEGOS DE EMMA
        </p>
        <h2 className="mt-1 text-3xl font-black tracking-tight">
          <span className="text-rose-500">Emma</span> <span className="text-amber-500">Care</span>{' '}
          <span className="text-emerald-600">Studio</span>
        </h2>

        {/* desfile de mascotas */}
        <div className="mt-4 flex flex-wrap justify-center gap-1.5" aria-hidden>
          {PARADE.map((e, i) => (
            <span
              key={i}
              className="animate-bounce text-3xl"
              style={{ animationDelay: `${i * 0.12}s`, animationDuration: '1.6s' }}
            >
              {e}
            </span>
          ))}
        </div>

        <div className="mt-4 space-y-1.5 rounded-2xl bg-amber-50 p-3 text-sm font-bold text-slate-600">
          <p>🗺️ 4 mundos: 🌳 Jardín · 🏠 Casa · 🏥 Hospital · 🏖️ Playa</p>
          <p>🔊 Cada animal hace SU sonido: ladra, maúlla, ruge… ¡15 mascotas!</p>
          <p>😈 ¡Rivalidades! El perro persigue al gato: la pantalla tiembla 📳</p>
          <p>🌿 Escondites y trepaderas para escapar · 🎾 pelota · 🪑 órdenes</p>
          <p>🎙️ ¡Háblales por la voz! "¡Quietos!" · "¡Escondeos!" · "¡Max, ven!"</p>
          <p>🌧️ Sorpresas: lluvia, mariposas y cajas regalo · 👆 acaricia con el dedo</p>
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <Button
            onClick={() => {
              close()
              useStudio.getState().startPlay()
            }}
            className="h-14 rounded-full bg-rose-500 text-lg font-black text-white shadow-lg shadow-rose-200 transition-transform hover:bg-rose-600 active:scale-95"
          >
            ▶️ ¡JUGAR AHORA!
          </Button>
          <Button
            variant="outline"
            onClick={close}
            className="h-11 rounded-full border-2 font-black"
          >
            ✏️ Primero construir mi mundo
          </Button>
        </div>

        <p className="mt-4 text-[11px] font-bold text-slate-400">
          Consejo: sube el volumen 🔊 para oír a las mascotas
        </p>
      </div>
    </div>
  )
}
