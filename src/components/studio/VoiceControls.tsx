'use client'

// Emma Care Studio — control de VOZ
// Botón 🎙 compacto (va en el dock flotante). El motor vive en voice.ts
// (singleton) y arranca SOLO al pulsar ▶ ¡JUGAR!; aquí se puede apagar
// o reencender, y un globito discreto muestra lo que está oyendo.

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useVoice } from '@/lib/studio/voice'
import { cn } from '@/lib/utils'
import { useStudio } from '@/lib/studio/store'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function VoiceControls() {
  const lastVoice = useStudio(s => s.lastVoice)
  const [text, setText] = useState('')
  const { supported, listening, error, heard, toggle } = useVoice()

  // si el navegador nos negó el micrófono (o falta internet), avisamos
  useEffect(() => {
    if (error === 'permiso') {
      toast('🎙️ Permite el micrófono para hablar con tus mascotas', { duration: 4200 })
    }
    if (error === 'red') {
      toast('🎙️ La escucha necesita internet… revisa la conexión', { duration: 4200 })
    }
  }, [error])


  return (
    <>
      <button
        type="button"
        onClick={toggle}
        disabled={!supported}
        aria-label={listening ? "Apagar micrófono" : supported ? "Activar micrófono" : "Voz no disponible en este navegador"}
        aria-pressed={listening}
        title={
          !supported ? 'Este navegador no ofrece reconocimiento de voz; puedes escribir la orden' : listening
            ? 'Escuchando… pulsa para parar'
            : 'Habla a tus mascotas: ¡Quietos! ¡Escondeos! ¡Ven! ¡Max a la casa! o su nombre'
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

      <Dialog>
        <DialogTrigger asChild>
          <button type="button" className="emma-dock-btn shrink-0" aria-label="Escribir comando" title="Escribir una orden o ver ejemplos">⌨️</button>
        </DialogTrigger>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle>🐾 Habla con tus mascotas</DialogTitle>
            <DialogDescription>Usa su nombre: «Max ven», «Max quieto», «Max a la casa». Sin nombre, la orden va a las mascotas de este mundo.</DialogDescription>
          </DialogHeader>
          <form onSubmit={e => {
            e.preventDefault()
            const result = useStudio.getState().voiceCommand(text)
            if (result === 'unknown') toast('No entendí. Revisa el nombre y prueba una de las órdenes de abajo.')
            else if (result === 'noplay') toast('Primero pulsa Jugar')
            setText('')
          }} className="flex gap-2">
            <Input value={text} onChange={e => setText(e.target.value)} maxLength={150} aria-label="Orden para las mascotas" placeholder="Max ven" autoFocus />
            <Button type="submit" disabled={!text.trim()}>Enviar</Button>
          </form>
          <p className="text-xs leading-relaxed text-slate-600">Hola · Sígueme · Fuera · Tratamiento · Ven · Quieto · Sentado · Libre · Escondeos · Corre · Pasea · Salta · Baila · Descansa · Despierta · A comer · A la cama · Toma agua · Báñate</p>
          <p className="text-xs text-slate-600">Viajes: a la casa · al patio · a la playa · al hospital. Primero desbloquea el mundo. «A la casita» entra al refugio local; «fuera» lo libera.</p>
        </DialogContent>
      </Dialog>
      {/* lo que oye, en una pastillita discreta abajo (sin estorbar) */}
      {listening && heard && (
        <div key={`${heard}:${lastVoice?.at ?? 0}`} className="emma-voice-cap" role="status" aria-live="polite">
          <span className="emma-order-chip" data-kind={lastVoice?.kind ?? 'listen'}>{lastVoice?.label ?? '🎙️ escuchando…'}</span>
          <span className="emma-voice-heard">«{heard || 'Max ven · gato hola · Max a la casa'}»</span>
        </div>
      )}
    </>
  )
}
