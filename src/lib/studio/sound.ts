// Sonidos con WebAudio (sin archivos externos).
// Todos los sonidos son suaves y alegres, pensados para niñas/os.
//
// Además de los efectos de interfaz (sfx), cada animal tiene una VOZ
// propia sintetizada: el perro ladra, el gato maúlla, el león ruge...
// y cambia según su ánimo: contento, hambre, sueño o triste.

import { Mood } from './types'

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

/**tono que se desliza de una frecuencia a otra (miados, lamentos, bostezos...) */
function slide(
  f1: number,
  f2: number,
  start: number,
  dur: number,
  type: OscillatorType = 'sine',
  vol = 0.1,
) {
  const c = ac()
  if (!c || muted) return
  const t = c.currentTime + start
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(Math.max(30, f1), t)
  osc.frequency.exponentialRampToValueAtTime(Math.max(30, f2), t + dur)
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.03)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(gain)
  gain.connect(c.destination)
  osc.start(t)
  osc.stop(t + dur + 0.05)
}

/** ráfaga de ruido filtrado (textura de ladrido, rugido, gruñido...) */
function noise(start: number, dur: number, vol = 0.06, freq = 800) {
  const c = ac()
  if (!c || muted) return
  const t = c.currentTime + start
  const len = Math.max(1, Math.floor(c.sampleRate * dur))
  const buf = c.createBuffer(1, len, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
  const src = c.createBufferSource()
  src.buffer = buf
  const filter = c.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = freq
  filter.Q.value = 0.8
  const gain = c.createGain()
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  src.connect(filter)
  filter.connect(gain)
  gain.connect(c.destination)
  src.start(t)
  src.stop(t + dur + 0.05)
}

// ===== piezas de voces =====

/** ladrido: burst de sierra que cae + aire */
function bark(base = 320, start = 0) {
  slide(base * 1.7, base * 0.45, start, 0.11, 'sawtooth', 0.13)
  noise(start, 0.09, 0.05, 1600)
}

/** maullido: sube y baja */
function meow(start = 0, pitch = 1) {
  slide(480 * pitch, 900 * pitch, start, 0.16, 'sine', 0.11)
  slide(900 * pitch, 340 * pitch, start + 0.16, 0.3, 'sine', 0.1)
}

/** gorjeo corto de conejo/roedor */
function squeak(base = 1400, start = 0) {
  slide(base * 0.85, base * 1.3, start, 0.09, 'sine', 0.09)
}

/** gruñido grave */
function growl(start = 0, dur = 0.5, base = 110) {
  slide(base, base * 0.62, start, dur, 'sawtooth', 0.12)
  noise(start, dur * 0.9, 0.045, 300)
}

/** rugido de león (largo y grave) */
function roar(start = 0, dur = 0.85, vol = 0.14) {
  slide(175, 70, start, dur, 'sawtooth', vol)
  noise(start, dur * 0.85, 0.06, 220)
}

/** oink de cerdo */
function oink(start = 0, pitch = 1) {
  slide(270 * pitch, 120 * pitch, start, 0.12, 'square', 0.09)
}

/** parloteo de monito */
function chatter(start = 0, speed = 1, pitch = 1) {
  for (let i = 0; i < 6; i++) {
    const hi = i % 2 === 0
    slide(
      (hi ? 640 : 460) * pitch,
      (hi ? 520 : 380) * pitch,
      start + i * 0.07 * speed,
      0.055,
      'square',
      0.06,
    )
  }
}

/** graznido/yip de zorro */
function yip(start = 0, pitch = 1) {
  slide(620 * pitch, 240 * pitch, start, 0.09, 'sawtooth', 0.1)
  noise(start, 0.07, 0.04, 2200)
}

/** balido suave de panda */
function bleat(start = 0, pitch = 1) {
  slide(500 * pitch, 700 * pitch, start, 0.12, 'sine', 0.1)
  slide(700 * pitch, 480 * pitch, start + 0.12, 0.12, 'sine', 0.09)
}

/** grito agudo feliz (feliz) */
function yappy(base = 400, start = 0) {
  bark(base, start)
}

function whine(start = 0) {
  slide(750, 320, start, 0.55, 'sine', 0.1)
}

function yawn(start = 0) {
  slide(380, 160, start, 0.75, 'sine', 0.08)
}

function snore(start = 0) {
  slide(120, 70, start, 0.55, 'sawtooth', 0.055)
  slide(75, 115, start + 0.6, 0.45, 'sawtooth', 0.05)
}

function purr() {
  for (let i = 0; i < 8; i++) tone(95 + (i % 2) * 25, i * 0.07, 0.05, 'sawtooth', 0.04)
}

/** siseo de gato enfadado */
function hiss(start = 0, dur = 0.4) {
  noise(start, dur, 0.07, 2600)
  noise(start + 0.05, dur * 0.8, 0.05, 3400)
}

/** cacareo de gallina: "¡coc!" seco */
function cluck(start = 0, pitch = 1) {
  slide(420 * pitch, 180 * pitch, start, 0.09, 'square', 0.1)
  noise(start, 0.06, 0.03, 900)
}

/** cacareo de pánico largo: ¡COCOOOOO! */
function squawk(start = 0, dur = 0.5, pitch = 1) {
  slide(520 * pitch, 620 * pitch, start, 0.1, 'square', 0.11)
  slide(620 * pitch, 300 * pitch, start + 0.1, dur, 'square', 0.1)
}

/** graznido de pato: ¡cuac! */
function quack(start = 0, pitch = 1) {
  slide(300 * pitch, 170 * pitch, start, 0.16, 'square', 0.12)
  noise(start, 0.12, 0.045, 700)
}

/** trino de pajarito (dos notas subidas) */
function tweet(start = 0, pitch = 1) {
  slide(1800 * pitch, 2600 * pitch, start, 0.08, 'sine', 0.08)
  slide(2600 * pitch, 2100 * pitch, start + 0.08, 0.1, 'sine', 0.07)
}

/** chirrido agudo de ratón/hámster asustado */
function panicSqueak(start = 0) {
  for (let i = 0; i < 5; i++) slide(1600 + (i % 2) * 300, 2100, start + i * 0.08, 0.06, 'sine', 0.09)
}

/** golpecillo de conejo enfadado (pata en el suelo) */
function thump(start = 0) {
  slide(140, 70, start, 0.12, 'sine', 0.13)
}

/** grito de cerdo asustado: ¡chiiii! */
function squeal(start = 0) {
  slide(400, 1400, start, 0.28, 'sawtooth', 0.1)
  slide(1400, 700, start + 0.28, 0.2, 'sawtooth', 0.08)
}

/** quejido grave de tortuga: ¡plop! */
function plop(start = 0) {
  slide(180, 80, start, 0.18, 'sine', 0.13)
  slide(80, 120, start + 0.18, 0.1, 'sine', 0.06)
}

/** quejido de animalito grande asustado */
function moan(start = 0) {
  slide(240, 140, start, 0.6, 'sine', 0.1)
}

/** gritito agudo de miedo (yelp) */
function yelp(start = 0) {
  slide(900, 1500, start, 0.1, 'sawtooth', 0.1)
  slide(1500, 600, start + 0.1, 0.18, 'sawtooth', 0.09)
}

// ===== voz por especie y ánimo =====

export function petVoice(catalogId: string, mood: Mood) {
  switch (catalogId) {
    case 'dog':
      if (mood === 'feliz') {
        yappy(420, 0)
        yappy(480, 0.13)
        yappy(420, 0.26)
        tone(784, 0.42, 0.12, 'sine', 0.06)
      } else if (mood === 'hambre') {
        whine(0)
        whine(0.62)
      } else if (mood === 'sueno') {
        yawn(0)
      } else if (mood === 'triste') {
        slide(420, 240, 0, 0.6, 'sine', 0.09)
        slide(240, 200, 0.62, 0.4, 'sine', 0.07)
      } else if (mood === 'enojado') {
        growl(0, 0.45, 95)
        bark(260, 0.2)
        bark(240, 0.4)
        bark(280, 0.6)
      } else if (mood === 'miedo') {
        yelp(0)
        whine(0.3)
      } else {
        bark(320, 0)
        bark(345, 0.16)
      }
      break
    case 'cat':
      if (mood === 'feliz') {
        purr()
        meow(0.6, 1.15)
      } else if (mood === 'hambre') {
        meow(0, 1.1)
        meow(0.5, 1.05)
      } else if (mood === 'sueno') {
        slide(330, 210, 0, 0.6, 'sine', 0.07)
      } else if (mood === 'triste') {
        slide(420, 230, 0, 0.7, 'sine', 0.09)
      } else if (mood === 'enojado') {
        hiss(0, 0.5)
        growl(0.3, 0.4, 140)
      } else if (mood === 'miedo') {
        hiss(0, 0.3)
        meow(0.25, 1.6)
      } else {
        meow(0)
      }
      break
    case 'rabbit':
      if (mood === 'feliz') {
        squeak(1500, 0)
        squeak(1600, 0.1)
        squeak(1500, 0.2)
      } else if (mood === 'hambre') {
        squeak(1000, 0)
        squeak(1050, 0.14)
      } else if (mood === 'sueno') {
        squeak(750, 0)
      } else if (mood === 'triste') {
        slide(700, 480, 0, 0.35, 'sine', 0.07)
      } else if (mood === 'enojado') {
        thump(0)
        thump(0.2)
      } else if (mood === 'miedo') {
        squeak(1800, 0)
        squeak(1900, 0.09)
        thump(0.2)
      } else {
        squeak(1400, 0)
        squeak(1400, 0.13)
      }
      break
    case 'mouse':
      if (mood === 'feliz') {
        squeak(1700, 0)
        squeak(1800, 0.08)
        squeak(1700, 0.16)
        squeak(1850, 0.24)
      } else if (mood === 'hambre') {
        squeak(1300, 0)
        squeak(1350, 0.12)
      } else if (mood === 'sueno') {
        squeak(800, 0)
      } else if (mood === 'triste') {
        slide(1100, 600, 0, 0.3, 'sine', 0.07)
      } else if (mood === 'enojado') {
        squeak(1500, 0)
        squeak(1550, 0.08)
        squeak(1500, 0.16)
      } else if (mood === 'miedo') {
        panicSqueak(0)
      } else {
        squeak(1600, 0)
      }
      break
    case 'hamster':
      if (mood === 'feliz') {
        squeak(1400, 0)
        squeak(1500, 0.1)
        squeak(1400, 0.2)
      } else if (mood === 'hambre') {
        squeak(1100, 0)
        squeak(1150, 0.13)
      } else if (mood === 'sueno') {
        squeak(700, 0)
      } else if (mood === 'triste') {
        slide(900, 500, 0, 0.35, 'sine', 0.07)
      } else if (mood === 'enojado') {
        squeak(1250, 0)
        squeak(1300, 0.1)
      } else if (mood === 'miedo') {
        panicSqueak(0.02)
      } else {
        squeak(1350, 0)
        squeak(1350, 0.12)
      }
      break
    case 'bird':
      if (mood === 'feliz') {
        tweet(0, 1)
        tweet(0.18, 1.15)
        tweet(0.36, 1)
        tweet(0.54, 1.2)
      } else if (mood === 'hambre') {
        tweet(0, 0.85)
        tweet(0.12, 0.85)
        tweet(0.24, 0.9)
      } else if (mood === 'sueno') {
        slide(1400, 800, 0, 0.4, 'sine', 0.06)
      } else if (mood === 'triste') {
        slide(1200, 700, 0, 0.45, 'sine', 0.07)
      } else if (mood === 'enojado') {
        slide(2200, 1600, 0, 0.09, 'square', 0.08)
        slide(2200, 1600, 0.14, 0.09, 'square', 0.08)
      } else if (mood === 'miedo') {
        slide(1800, 2800, 0, 0.12, 'square', 0.09)
        slide(2800, 1200, 0.12, 0.25, 'square', 0.08)
      } else {
        tweet(0)
        tweet(0.16, 1.1)
      }
      break
    case 'chicken':
      if (mood === 'feliz') {
        cluck(0, 1.05)
        cluck(0.14, 1.1)
        cluck(0.28, 1.05)
      } else if (mood === 'hambre') {
        cluck(0, 0.95)
        cluck(0.13, 0.9)
        cluck(0.26, 0.95)
        cluck(0.39, 0.9)
      } else if (mood === 'sueno') {
        slide(300, 160, 0, 0.4, 'square', 0.06)
      } else if (mood === 'triste') {
        slide(340, 180, 0, 0.55, 'square', 0.08)
      } else if (mood === 'enojado') {
        cluck(0, 1.2)
        cluck(0.12, 1.2)
        cluck(0.24, 1.2)
        cluck(0.36, 1.25)
      } else if (mood === 'miedo') {
        squawk(0, 0.55)
      } else {
        cluck(0)
        cluck(0.15)
      }
      break
    case 'duck':
      if (mood === 'feliz') {
        quack(0, 1.1)
        quack(0.2, 1.15)
        quack(0.4, 1.05)
      } else if (mood === 'hambre') {
        quack(0, 1)
        quack(0.18, 1)
        quack(0.36, 1.05)
      } else if (mood === 'sueno') {
        slide(240, 140, 0, 0.45, 'square', 0.06)
      } else if (mood === 'triste') {
        slide(280, 130, 0, 0.6, 'square', 0.08)
      } else if (mood === 'enojado') {
        quack(0, 1.25)
        quack(0.18, 1.25)
        quack(0.36, 1.3)
      } else if (mood === 'miedo') {
        quack(0, 1.6)
        quack(0.2, 1.7)
        squawk(0.4, 0.4, 0.8)
      } else {
        quack(0)
        quack(0.2)
      }
      break
    case 'turtle':
      if (mood === 'feliz') {
        plop(0)
        plop(0.35)
      } else if (mood === 'hambre') {
        plop(0)
        slide(150, 100, 0.3, 0.3, 'sine', 0.07)
      } else if (mood === 'sueno') {
        snore(0)
      } else if (mood === 'triste') {
        slide(160, 70, 0, 0.7, 'sine', 0.09)
      } else if (mood === 'enojado') {
        hiss(0, 0.5)
      } else if (mood === 'miedo') {
        // se mete en el caparazón: ¡plop! y silencio
        plop(0)
        slide(220, 60, 0.18, 0.5, 'sine', 0.07)
      } else {
        plop(0)
      }
      break
    case 'fox':
      if (mood === 'feliz') {
        yip(0, 1.1)
        yip(0.12, 1.2)
        yip(0.24, 1.1)
      } else if (mood === 'hambre') {
        slide(900, 420, 0, 0.4, 'sine', 0.08)
      } else if (mood === 'sueno') {
        yawn(0)
      } else if (mood === 'triste') {
        slide(520, 300, 0, 0.55, 'sine', 0.08)
      } else if (mood === 'enojado') {
        growl(0, 0.4, 130)
        yip(0.25, 0.9)
        yip(0.4, 0.85)
      } else if (mood === 'miedo') {
        yelp(0)
        yip(0.3, 1.5)
      } else {
        yip(0)
        yip(0.14)
      }
      break
    case 'bear':
      if (mood === 'feliz') {
        growl(0, 0.3, 130)
        growl(0.36, 0.3, 150)
        tone(660, 0.75, 0.1, 'sine', 0.05)
      } else if (mood === 'hambre') {
        growl(0, 0.8, 100)
      } else if (mood === 'sueno') {
        snore(0)
      } else if (mood === 'triste') {
        growl(0, 0.6, 85)
      } else if (mood === 'enojado') {
        roar(0, 0.6, 0.12)
        growl(0.65, 0.5, 90)
      } else if (mood === 'miedo') {
        moan(0)
      } else {
        growl(0, 0.4, 115)
      }
      break
    case 'panda':
      if (mood === 'feliz') {
        bleat(0, 1.1)
        bleat(0.28, 1.2)
      } else if (mood === 'hambre') {
        bleat(0, 0.85)
        bleat(0.28, 0.85)
      } else if (mood === 'sueno') {
        snore(0)
      } else if (mood === 'triste') {
        slide(400, 260, 0, 0.55, 'sine', 0.08)
      } else if (mood === 'enojado') {
        bleat(0, 0.7)
        growl(0.3, 0.4, 110)
      } else if (mood === 'miedo') {
        bleat(0, 1.7)
      } else {
        bleat(0)
      }
      break
    case 'lion':
      if (mood === 'feliz') {
        roar(0, 0.5, 0.11)
        roar(0.6, 0.45, 0.1)
      } else if (mood === 'hambre') {
        roar(0, 0.95, 0.13)
      } else if (mood === 'sueno') {
        snore(0)
      } else if (mood === 'triste') {
        slide(140, 65, 0, 0.8, 'sawtooth', 0.1)
      } else if (mood === 'enojado') {
        roar(0, 0.9, 0.15)
        roar(0.95, 0.6, 0.13)
      } else if (mood === 'miedo') {
        growl(0, 0.7, 120)
      } else {
        roar(0, 0.7)
      }
      break
    case 'pig':
      if (mood === 'feliz') {
        oink(0, 1.15)
        oink(0.16, 1.2)
        oink(0.32, 1.1)
      } else if (mood === 'hambre') {
        oink(0, 1)
        oink(0.15, 1)
        oink(0.3, 1.05)
      } else if (mood === 'sueno') {
        snore(0)
      } else if (mood === 'triste') {
        slide(220, 110, 0, 0.5, 'square', 0.07)
      } else if (mood === 'enojado') {
        oink(0, 0.8)
        oink(0.14, 0.75)
        oink(0.28, 0.8)
        oink(0.42, 0.75)
      } else if (mood === 'miedo') {
        squeal(0)
      } else {
        oink(0)
        oink(0.17)
      }
      break
    case 'monkey':
      if (mood === 'feliz') {
        chatter(0, 0.85, 1.15)
        chatter(0.5, 0.85, 1.2)
      } else if (mood === 'hambre') {
        slide(480, 380, 0, 0.18, 'square', 0.07)
        slide(480, 380, 0.24, 0.18, 'square', 0.07)
      } else if (mood === 'sueno') {
        yawn(0)
      } else if (mood === 'triste') {
        slide(500, 280, 0, 0.6, 'sine', 0.08)
      } else if (mood === 'enojado') {
        chatter(0, 1.4, 0.85)
        chatter(0.4, 1.4, 0.8)
      } else if (mood === 'miedo') {
        chatter(0, 2, 1.6)
        slide(900, 1400, 0.45, 0.3, 'sine', 0.08)
      } else {
        chatter(0)
      }
      break
    default:
      // animal desconocido: sonido genérico
      if (mood === 'feliz') tone(784, 0, 0.12, 'sine', 0.07)
      else if (mood === 'enojado') growl(0, 0.4, 100)
      else if (mood === 'miedo') yelp(0)
      else tone(392, 0, 0.12, 'sine', 0.07)
  }
}

// ===== efectos de interfaz =====

export const sfx = {
  /** Agua al beber o bañarse. */
  water() {
    for (let i = 0; i < 4; i++) slide(700 + i * 150, 240, i * 0.09, 0.1, 'sine', 0.05)
    noise(0, 0.35, 0.025, 1400)
  },
  jump() { slide(220, 880, 0, 0.18, 'triangle', 0.07) },
  dance() {
    for (const [i, note] of [523, 659, 784, 659, 523, 784].entries())
      tone(note, i * 0.14, 0.1, 'triangle', 0.055)
  },
  travel() {
    noise(0, 0.22, 0.03, 800)
    tone(659, 0.2, 0.1, 'sine', 0.06)
    tone(988, 0.32, 0.15, 'sine', 0.06)
  },
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
  /** fanfarria de desbloqueo de mundo */
  unlock() {
    tone(523, 0, 0.12, 'triangle', 0.09)
    tone(659, 0.12, 0.12, 'triangle', 0.09)
    tone(784, 0.24, 0.12, 'triangle', 0.09)
    tone(1047, 0.36, 0.22, 'triangle', 0.1)
    tone(1319, 0.5, 0.3, 'sine', 0.08)
  },
  /** ¡boing! de la pelota al caer */
  boing() {
    slide(320, 110, 0, 0.12, 'triangle', 0.12)
    slide(110, 260, 0.12, 0.1, 'triangle', 0.08)
    slide(260, 120, 0.22, 0.08, 'triangle', 0.06)
  },
  /** whoosh de lanzamiento */
  whoosh() {
    noise(0, 0.18, 0.05, 900)
    slide(600, 200, 0, 0.16, 'sine', 0.04)
  },
  /** lluvia empezando (ruido suave de fondo) */
  rain() {
    noise(0, 0.9, 0.035, 500)
    noise(0.2, 0.8, 0.03, 800)
  },
  /** campanita de sorpresa/evento */
  alarm() {
    tone(880, 0, 0.1, 'triangle', 0.08)
    tone(880, 0.16, 0.1, 'triangle', 0.08)
    tone(1174, 0.32, 0.18, 'triangle', 0.08)
  },
  /** premio por buen comportamiento */
  treat() {
    tone(659, 0, 0.08, 'triangle', 0.08)
    tone(880, 0.09, 0.08, 'triangle', 0.08)
    tone(1174, 0.18, 0.16, 'triangle', 0.09)
  },
}
