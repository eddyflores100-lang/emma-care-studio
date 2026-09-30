// Sonidos simples con WebAudio (sin archivos externos).
// Todos los sonidos son suaves y alegres, pensados para niñas/os.

let ctx: AudioContext | null = null
let muted = false

export function setMuted(value: boolean) {
  muted = value
}

export function isMuted() {
  return muted
}

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    try {
      ctx = new AC()
    } catch {
      return null
    }
  }
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {})
  }
  return ctx
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.1) {
  const c = ac()
  if (!c || muted) return
  const t = c.currentTime + start
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(gain)
  gain.connect(c.destination)
  osc.start(t)
  osc.stop(t + dur + 0.05)
}

export const sfx = {
  click() {
    tone(660, 0, 0.07, 'triangle', 0.07)
  },
  pop() {
    tone(520, 0, 0.08, 'triangle', 0.11)
    tone(780, 0.06, 0.1, 'triangle', 0.09)
  },
  coin() {
    tone(1318, 0, 0.08, 'square', 0.05)
    tone(1760, 0.08, 0.14, 'square', 0.05)
  },
  happy() {
    tone(523, 0, 0.1, 'sine', 0.09)
    tone(659, 0.09, 0.1, 'sine', 0.09)
    tone(784, 0.18, 0.16, 'sine', 0.09)
  },
  sad() {
    tone(330, 0, 0.18, 'sine', 0.09)
    tone(262, 0.16, 0.26, 'sine', 0.09)
  },
  magic() {
    tone(880, 0, 0.07, 'sine', 0.07)
    tone(1108, 0.07, 0.07, 'sine', 0.07)
    tone(1318, 0.14, 0.1, 'sine', 0.07)
    tone(1760, 0.22, 0.16, 'sine', 0.07)
  },
  eat() {
    tone(392, 0, 0.07, 'triangle', 0.09)
    tone(330, 0.08, 0.07, 'triangle', 0.09)
    tone(392, 0.16, 0.09, 'triangle', 0.09)
  },
  wake() {
    tone(784, 0, 0.08, 'sine', 0.07)
    tone(988, 0.08, 0.1, 'sine', 0.07)
  },
}
