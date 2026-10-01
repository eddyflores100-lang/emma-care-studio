'use client'

// Emma Care Studio — controles de VOZ
// Botón 🎤 que escucha continuamente y un globito pequeñito (abajo a la
// izquierda, nunca tapa el título) con lo que está oyendo.

import { useEffect } from 'react'
import { toast } from 'sonner'
import { useStudio } from '@/lib/studio/store'
import { useVoice } from '@/lib/studio/voice'
import { cn } from '@/lib/utils'

export function VoiceControls() {
  const voiceCommand = useStudio((s) => s.voiceCommand)
  const { supported, listening, error, heard, toggle } = useVoice((text) => {
    useStudio.getState().voiceCommand(text)
  })

  // si el navegador nos negó el micrófono, avisamos una sola vez
  useEffect(() => {
    if (error === 'permiso') {
      toast('🎙️ Permite el micrófono para hablar con tus mascotas', { duration: 4200 })
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
            : 'Habla a tus mascotas: ¡Quietos! ¡Escondeos! ¡Ven! ¡Sentado! o su nombre'
        }
        className={cn(
          'flex h-11 flex-col items-center justify-center gap-0 rounded-2xl border-2 text-[10px] font-black transition-all active:scale-95',
          listening
            ? 'border-rose-500 bg-rose-500 text-white shadow-lg shadow-rose-200'
            : 'border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100',
        )}
      >
        <span className={cn('text-lg leading-none', listening && 'emma-mic-live')}>🎤</span>
        {listening ? 'Escuchando' : 'Voz'}
      </button>

      {/* lo que oye, en una pastillita discreta abajo (sin estorbar) */}
      {listening && (
        <div className="emma-voice-cap" role="status" aria-live="polite">
          🎤 {heard || 'escuchando… di ¡Quietos! ¡Escondeos! ¡Ven! o su nombre'}
        </div>
      )}
    </>
  )
}
