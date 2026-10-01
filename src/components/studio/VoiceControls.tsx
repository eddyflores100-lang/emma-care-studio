'use client'

// Emma Care Studio — control de VOZ
// Botón 🎙 compacto (va en el dock flotante). El motor vive en voice.ts
// (singleton) y arranca SOLO al pulsar ▶ ¡JUGAR!; aquí se puede apagar
// o reencender, y un globito discreto muestra LO QUE OYE y, sobre todo,
// QUÉ ORDEN entendió (categoría con color propio para cada orden).

import { useEffect } from 'react'
import { toast } from 'sonner'
import { useVoice } from '@/lib/studio/voice'
import { useStudio } from '@/lib/studio/store'
import { cn } from '@/lib/utils'

export function VoiceControls() {
  const { supported, listening, error, heard, toggle } = useVoice()
  const lastVoice = useStudio((s) => s.lastVoice)
  const fresh = !!lastVoice && Date.now() - lastVoice.at < 8000

  // si el navegador nos negó el micrófono (o falta internet), avisamos
  useEffect(() => {
    if (error === 'permiso') {
      toast('🎙️ Permite el micrófono para hablar con tus mascotas', { duration: 4200 })
    }
    if (error === 'red') {
      toast('🎙️ La escucha necesita internet… revisa la conexión', { duration: 4200 })
    }
  }, [error])

  if (!supported) return null

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        aria-pressed={listening}
        title={
          listening
            ? 'Escuchando… pulsa para parar'
            : 'Habla a tus mascotas: ¡Quietos! ¡Escondeos! ¡Ven! ¡Max a la casa! ¡Salgan! o su nombre'
        }
        className={cn(
          'emma-dock-btn shrink-0',
          listening
            ? 'border-rose-500 bg-rose-500 text-white shadow-lg shadow-rose-200'
            : 'border-sky-300 bg-sky-50',
        )}
      >
        <span className={cn('leading-none', listening && 'emma-mic-live')} aria-hidden>
          🎙️
        </span>
      </button>

      {/* lo que oye + LA ORDEN que entendió, en una pastillita discreta */}
      {listening && (
        <div className="emma-voice-cap" role="status" aria-live="polite">
          <span
            className="emma-order-chip"
            data-kind={fresh && lastVoice ? lastVoice.kind : 'listen'}
          >
            {fresh && lastVoice ? lastVoice.label : '🎙️ escuchando…'}
          </span>
          <span className="emma-voice-heard">
            «{heard || '¡quietos! · ¡ven! · ¡Max a la casa! · ¡salgan!'}»
          </span>
        </div>
      )}
    </>
  )
}
