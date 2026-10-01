'use client'

// Emma Care Studio — comandos por VOZ (Web Speech API) v2
// La niña habla y sus mascotas obedecen. Todo funciona MIENTRAS SUENA:
//  · "¡Quietos!"            → se acaban las peleas y todos se congelan
//  · "¡Escondeos!" / refugio → corren a esconderse
//  · "¡Ven!" / "¡Aquí!"     → vienen hacia la dueña
//  · "¡Sentado!"            → se sientan
//  · "¡Max!" (su nombre)    → contesta y viene
//  · "¡Max a la casa!"      → Max camina hasta la casita (también cama,
//                             agua o comida)
//  · "hospital"             → la más herida viaja en ambulancia
//  · "pelota"               → prepara el lanzamiento
//
// Motor SINGLETON: vive fuera de React para que pueda arrancar solo
// (dentro del gesto de tocar ▶ ¡JUGAR!) y sobrevivir a los renders.

import { useSyncExternalStore } from 'react'
import type { WorldObject } from './types'

/** quita mayúsculas, acentos y signos: "¡Quietos!" → "quietos" */
export function norm(t: string): string {
  return t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[¡!¿?.,;:'"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** distancia de edición (para perdonar errores de escucha: "maz" ↔ "max") */
function lev(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (Math.abs(m - n) > 2) return 3
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array<number>(n).fill(0)])
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
  return dp[m][n]
}

// Vocabulary is shared by the parser and the command help panel.
const WORDS = {
  calm: ['quieto', 'quietos', 'quieta', 'quietas', 'para', 'paren', 'alto', 'basta', 'calmense', 'no peleen', 'separense', 'stop'],
  hide: ['escondeos', 'escondanse', 'esconde', 'esconderse', 'escondite', 'refugio', 'ocultense'],
  sit: ['sentado', 'sentados', 'sentate', 'sientate', 'sientense', 'sienta'],
  come: ['ven', 'ven aqui', 'ven aca', 'aqui', 'aca', 'vengan', 'sigueme', 'vengan aqui'],
  ball: ['pelota', 'bola', 'lanza la pelota', 'tira la pelota'],
  run: ['corre', 'corran', 'correr', 'a correr'],
  walk: ['pasea', 'paseen', 'camina', 'caminen', 'paseo'],
  free: ['libre', 'libres', 'suelto', 'sueltos', 'puedes moverte', 'a jugar'],
  rest: ['descansa', 'descansen', 'reposo'],
  wake: ['despierta', 'despierten', 'levantate'],
  jump: ['salta', 'salten', 'saltar'],
  dance: ['baila', 'bailen', 'bailar'],
} as const
export type VoiceKind = keyof typeof WORDS | 'call' | 'goto' | 'travel'
export type VoiceDest = 'cama' | 'agua' | 'comida' | 'bano' | 'casita'
export type VoiceOutcome = 'ok' | 'unknown' | 'noplay'
export interface ParsedVoice {
  kind: VoiceKind
  named: WorldObject[]
  matchedName: string | null
  dest?: VoiceDest
  level?: import('./types').LevelId
}
const DESTS: { dest: VoiceDest; words: string[] }[] = [
  { dest: 'casita', words: ['casita', 'refugiarse en casa'] },
  { dest: 'cama', words: ['cama', 'camita', 'camilla', 'a dormir', 'duermete', 'acuestate'] },
  { dest: 'agua', words: ['agua', 'bebe', 'beber', 'bebedero', 'toma agua'] },
  { dest: 'comida', words: ['comida', 'comer', 'comedero', 'desayunar', 'cenar', 'come algo'] },
  { dest: 'bano', words: ['banate', 'banarse', 'bano', 'banera', 'lavate'] },
]
const WORLDS: { level: import('./types').LevelId; words: string[] }[] = [
  { level: 'casa', words: ['casa', 'hogar'] },
  { level: 'jardin', words: ['jardin', 'patio', 'afuera'] },
  { level: 'playa', words: ['playa', 'mar'] },
  { level: 'hospital', words: ['hospital', 'clinica', 'ambulancia', 'medico', 'doctora', 'curar'] },
]
function wordHit(text: string, words: readonly string[]): boolean {
  const padded = ` ${text} `
  return words.some(w => padded.includes(` ${w} `))
}
function findPetsByName(text: string, pets: WorldObject[]) {
  // Literal matching: names are data, never regular expressions. Exact matches
  // win globally, so saying Max cannot simultaneously select Maz.
  const exact: WorldObject[] = []
  const used: {start:number;end:number}[] = []
  const padded = ` ${text} `
  for (const p of [...pets].sort((a,b) => norm(b.name).length - norm(a.name).length)) {
    const n = norm(p.name)
    if (!n) continue
    let start = padded.indexOf(` ${n} `)
    while (start >= 0) {
      const end = start + n.length + 1
      if (!used.some(span => start < span.end && end > span.start)) {
        exact.push(p); used.push({start,end}); break
      }
      start = padded.indexOf(` ${n} `, start + 1)
    }
  }
  if (exact.length) return exact
  const reserved = [...Object.values(WORDS).flat(), ...DESTS.flatMap(d => d.words), ...WORLDS.flatMap(d => d.words)]
  const tokens = text.split(' ').filter(t => t.length >= 3 && !reserved.includes(t))
  const candidates = pets.filter(p => {
    const n = norm(p.name)
    return n.length >= 3 && tokens.some(t => lev(t, n) <= 1 && Math.abs(t.length - n.length) <= 1)
  })
  // Ambiguous fuzzy matches must not direct several pets accidentally.
  return candidates.length === 1 ? candidates : []
}
export function parseVoiceCommand(raw: string, pets: WorldObject[]): ParsedVoice | null {
  const t = norm(raw)
  if (!t) return null
  const named = findPetsByName(t, pets)
  // Remove recognized names before parsing: a pet named Bola or Sol still
  // answers its name, and command-like names don't become destinations.
  let words = ` ${t} `
  for (const p of named) words = words.replace(` ${norm(p.name)} `, ' ')
  const commandText = words.trim()
  if (!named.length) {
    const known = [...Object.values(WORDS).flat(), ...DESTS.flatMap(d => d.words), ...WORLDS.flatMap(d => d.words),
      'todos', 'todas', 'mascotas', 'por', 'favor', 'a', 'al', 'ala', 'la', 'el', 'las', 'los', 'mi', 'tu', 'su', 'se', 'no', 'de', 'mis']
      .flatMap(w => w.split(' '))
    if (commandText.split(' ').some(token => !known.includes(token))) return null
  }
  const base = { named, matchedName: named.length ? named.map(p => p.name).join(', ') : null }
  const kind = (Object.keys(WORDS) as (keyof typeof WORDS)[]).find(k => wordHit(commandText, WORDS[k]))
  if (kind) return { ...base, kind }
  const world = WORLDS.find(d => wordHit(commandText, d.words))
  if (world) return { ...base, kind: 'travel', level: world.level }
  const dest = DESTS.find(d => wordHit(commandText, d.words))
  if (dest) return { ...base, kind: 'goto', dest: dest.dest }
  if (named.length) return { ...base, kind: 'call' }
  return null
}

// ===== Web Speech API (tipos mínimos, sin dependencias) =====
interface SpeechAlt {
  transcript: string
}
interface SpeechRes {
  isFinal: boolean
  length: number
  [i: number]: SpeechAlt
}
interface SpeechEvent {
  resultIndex: number
  results: { length: number; [i: number]: SpeechRes }
}
interface SpeechErr {
  error: string
}
interface Recog {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onresult: ((e: SpeechEvent) => void) | null
  onerror: ((e: SpeechErr) => void) | null
  onend: (() => void) | null
}
type RecogCtor = new () => Recog

function getCtor(): RecogCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { SpeechRecognition?: RecogCtor; webkitSpeechRecognition?: RecogCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function isVoiceSupported(): boolean {
  return getCtor() !== null
}

// ================= MOTOR SINGLETON =================
export interface VoiceState {
  supported: boolean
  listening: boolean
  error: 'permiso' | 'red' | null
  /** último texto oído (para el globito) */
  heard: string
}

type Listener = () => void
const listeners = new Set<Listener>()
let st: VoiceState = { supported: false, listening: false, error: null, heard: '' }
let recog: Recog | null = null
let want = false
let restartTimer: number | null = null
let handler: ((text: string) => VoiceOutcome) | null = null

function emit() {
  st = { ...st }
  for (const l of listeners) l()
}

function build(): Recog | null {
  const Ctor = getCtor()
  if (!Ctor) return null
  const r = new Ctor()
  r.lang =
    typeof navigator !== 'undefined' && navigator.language?.startsWith('es')
      ? navigator.language
      : 'es-ES'
  r.continuous = true
  r.interimResults = true
  r.maxAlternatives = 3

  r.onresult = (e) => {
    if (!want) return
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const res = e.results[i]
      const txt = res?.[0]?.transcript ?? ''
      if (!txt.trim()) continue
      st.heard = txt
      emit()
      // Interim transcripts only update the caption. Execute one complete
      // phrase, and only try alternatives if the previous one was unknown.
      if (!res.isFinal || !handler) continue
      for (let a = 0; a < res.length; a++) {
        const alt = res[a]?.transcript
        if (alt?.trim() && handler(alt) !== 'unknown') break
      }
    }
  }
  r.onerror = (e) => {
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
      want = false
      st.listening = false
      st.error = 'permiso'
      emit()
    } else if (e.error === 'network' || e.error === 'audio-capture' || e.error === 'language-not-supported') {
      want = false
      st.listening = false
      st.error = 'red'
      emit()
      // Explicit retry avoids hammering a failed speech service indefinitely.
    }
    // 'no-speech' / 'aborted' son normales: onend rearranca solo
  }
  r.onend = () => {
    st.listening = false
    emit()
    if (want) {
      // pequeño respiro para no saturar al navegador al rearrancar
      if (restartTimer) window.clearTimeout(restartTimer)
      restartTimer = window.setTimeout(() => {
        if (!want) return
        try {
          r.start()
          st.listening = true
          emit()
        } catch {
          want = false
          st.error = 'red'
          emit()
        }
      }, 300)
    } else {
      st.listening = false
      emit()
    }
  }
  return r
}

export const voiceEngine = {
  subscribe(l: Listener): () => void {
    listeners.add(l)
    return () => {
      listeners.delete(l)
    }
  },
  getSnapshot(): VoiceState {
    return st
  },
  /** fija quién recibe lo oído (se llama una vez desde la página) */
  setHandler(fn: (text: string) => VoiceOutcome) {
    handler = fn
  },
  clearHandler() {
    handler = null
    voiceEngine.stop()
  },
  /** arranca la escucha — llamar DENTRO de un gesto (clic) del usuario */
  start() {
    if (typeof window === 'undefined') return
    const supported = getCtor() !== null
    if (st.supported !== supported) {
      st.supported = supported
    }
    if (!supported) {
      emit()
      return
    }
    want = true
    st.error = null
    st.heard = ''
    if (!recog) recog = build()
    if (!recog) return
    if (st.listening) return
    try {
      recog.start()
    } catch {
      want = false
      st.listening = false
      st.error = 'red'
      emit()
      return
    }
    st.listening = true
    emit()
  },
  stop() {
    want = false
    if (restartTimer) {
      window.clearTimeout(restartTimer)
      restartTimer = null
    }
    try {
      recog?.stop()
    } catch {
      /* nada */
    }
    st.listening = false
    emit()
  },
  toggle() {
    if (st.listening) voiceEngine.stop()
    else voiceEngine.start()
  },
}

/** hook React: estado vivo del motor (sin efectos secundarios) */
export function useVoice(): VoiceState & { toggle: () => void } {
  const snap = useSyncExternalStore(voiceEngine.subscribe, voiceEngine.getSnapshot, voiceEngine.getSnapshot)
  return { ...snap, toggle: voiceEngine.toggle }
}
