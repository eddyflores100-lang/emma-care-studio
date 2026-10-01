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

// ===== vocabulario de órdenes (todo normalizado, sin acentos) =====
const WORDS = {
  calm: [
    'quieto', 'quietos', 'quietas', 'quietecitos', 'para', 'paren', 'alto', 'basta',
    'calmense', 'calmados', 'suficiente', 'no peleen', 'no pelear', 'no pelees',
    'dejense', 'basta de pelea', 'alto ahi', 'stop',
  ],
  hide: [
    'escondeos', 'escondanse', 'esconde', 'esconder', 'esconderse', 'escondite',
    'refugio', 'ocultense', 'a esconderse', 'escondite ya', 'busquen refugio',
  ],
  sit: ['sentado', 'sentados', 'sentate', 'sientate', 'sientense', 'sienta'],
  come: ['ven', 'ven aqui', 'ven aca', 'aqui', 'aca', 'vengan', 'vengan aqui', 'vamos'],
  hospital: ['hospital', 'ambulancia', 'medico', 'doctora', 'cura', 'curar'],
  ball: ['pelota', 'bola', 'lanza la pelota', 'tira la pelota', 'trae la pelota'],
} as const

// destinos: "a la casa", "casa", "a la cama", "toma agua", "a comer"…
const DESTS: { dest: 'casa' | 'cama' | 'agua' | 'comida'; words: string[] }[] = [
  {
    dest: 'casa',
    words: ['casa', 'casita', 'hogar', 'a la casa', 'a casa', 'ala casa', 'tu casa', 'su casa'],
  },
  { dest: 'cama', words: ['cama', 'camita', 'camilla', 'a dormir', 'duermete', 'acuestate', 'a la cama'] },
  { dest: 'agua', words: ['agua', 'al agua', 'a la agua', 'bebe agua', 'toma agua', 'a beber', 'bebedero'] },
  {
    dest: 'comida',
    words: ['comida', 'comer', 'a comer', 'plato', 'comedero', 'el plato', 'a desayunar', 'a cenar', 'come algo'],
  },
]

export type VoiceKind = keyof typeof WORDS | 'call' | 'goto'
export type VoiceDest = 'casa' | 'cama' | 'agua' | 'comida'

export type VoiceOutcome = 'ok' | 'unknown' | 'noplay'

export interface ParsedVoice {
  kind: VoiceKind
  /** mascotas mencionadas por nombre (si la niña llamó a alguna) */
  named: WorldObject[]
  /** nombre que se escuchó, para el mensaje */
  matchedName: string | null
  /** destino si la orden era de tipo "a la casa/cama/agua/comida" */
  dest?: VoiceDest
}

function wordHit(text: string, words: readonly string[]): boolean {
  return words.some((w) =>
    w.includes(' ') ? text.includes(w) : new RegExp(`(^| )${w}( |$)`).test(text),
  )
}

/** busca mascotas cuyo nombre aparece en el texto (exacto o con 1 error) */
function findPetsByName(text: string, pets: WorldObject[]): { named: WorldObject[]; name: string | null } {
  const named: WorldObject[] = []
  let name: string | null = null
  for (const p of pets) {
    const n = norm(p.name)
    if (n.length < 2) continue
    // evitar que "casa" del destino coincida con una mascota por fuzzy corto
    let ok = n.length >= 3 && new RegExp(`(^| )${n}( |$)`).test(text)
    if (!ok) {
      for (const tok of text.split(' ')) {
        if (tok.length < 3) continue
        // si el token es una palabra de destino, no la tratamos como nombre
        const isDest = DESTS.some((d) => d.words.includes(tok))
        if (isDest) continue
        const d = lev(tok, n)
        if (d === 0 || (n.length >= 4 && d <= 1) || (n.length === 3 && d <= 1 && tok.length === 3)) {
          ok = true
          break
        }
      }
    }
    if (ok) {
      named.push(p)
      name = p.name
    }
  }
  return { named, name }
}

/** interpreta lo que se dijo y decide qué orden es y a quién va dirigida */
export function parseVoiceCommand(raw: string, pets: WorldObject[]): ParsedVoice | null {
  const t = norm(raw)
  if (!t) return null
  const { named, name } = findPetsByName(t, pets)
  // 1) destinos ("a la casa") — antes que las demás para que "casa" no se pierda
  const destHit = DESTS.find((d) => d.words.some((w) => wordHit(t, [w])))
  // 2) órdenes normales
  const kind = (['calm', 'hide', 'hospital', 'sit', 'come', 'ball'] as const).find((k) =>
    wordHit(t, WORDS[k]),
  )
  if (kind) return { kind, named, matchedName: name }
  if (destHit) return { kind: 'goto', named, matchedName: name, dest: destHit.dest }
  if (named.length) return { kind: 'call', named, matchedName: name }
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
let handler: ((text: string) => void) | null = null

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
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const res = e.results[i]
      const txt = res?.[0]?.transcript ?? ''
      if (!txt.trim()) continue
      st.heard = txt
      emit()
      // probamos la alternativa principal y, si no se entiende, las demás
      if (handler) {
        handler(txt)
        if (res?.length > 1) {
          for (let a = 1; a < res.length; a++) {
            const alt = res[a]?.transcript
            if (alt && alt.trim() && norm(alt) !== norm(txt)) handler(alt)
          }
        }
      }
    }
  }
  r.onerror = (e) => {
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
      want = false
      st.listening = false
      st.error = 'permiso'
      emit()
    } else if (e.error === 'network') {
      st.error = 'red'
      emit()
      // la escucha necesita internet; se reintenta sola por si vuelve
    }
    // 'no-speech' / 'aborted' son normales: onend rearranca solo
  }
  r.onend = () => {
    if (want) {
      // pequeño respiro para no saturar al navegador al rearrancar
      if (restartTimer) window.clearTimeout(restartTimer)
      restartTimer = window.setTimeout(() => {
        if (!want) return
        try {
          r.start()
        } catch {
          /* ya arrancando */
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
  setHandler(fn: (text: string) => void) {
    handler = fn
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
    try {
      recog.start()
    } catch {
      /* ya estaba arrancando: no pasa nada */
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
