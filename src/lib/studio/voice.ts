'use client'

// Emma Care Studio — comandos por VOZ (Web Speech API)
// La niña habla y sus mascotas obedecen: ¡Quietos!, ¡Escondeos!, ¡Ven!,
// ¡Sentado!, llamarlas por su nombre ("¡Max!") o mandarlas al hospital.
//
// Funciona en Chrome/Edge/Samsung (Android y escritorio) y en Safari moderno.
// Requiere HTTPS (el sitio ya lo tiene) y permiso del micrófono.

import { useCallback, useEffect, useRef, useState } from 'react'
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
  ],
  hide: [
    'escondeos', 'escondanse', 'esconde', 'esconder', 'esconderse', 'escondite',
    'refugio', 'ocultense', 'a esconderse',
  ],
  sit: ['sentado', 'sentados', 'sentate', 'sientate', 'sientense', 'sienta'],
  come: ['ven', 'ven aqui', 'ven aca', 'aqui', 'aca', 'vengan', 'vengan aqui', 'vamos'],
  hospital: ['hospital', 'ambulancia', 'medico', 'doctora', 'cura', 'curar'],
  ball: ['pelota', 'bola', 'lanza la pelota', 'tira la pelota', 'trae la pelota'],
} as const

export type VoiceKind = keyof typeof WORDS | 'call'

export type VoiceOutcome = 'ok' | 'unknown' | 'noplay'

export interface ParsedVoice {
  kind: VoiceKind
  /** mascotas mencionadas por nombre (si la niña llamó a alguna) */
  named: WorldObject[]
  /** nombre que se escuchó, para el mensaje */
  matchedName: string | null
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
    let ok = n.length >= 3 && text.includes(n)
    if (!ok) {
      for (const tok of text.split(' ')) {
        if (tok.length < 3) continue
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
  const kind = (['calm', 'hide', 'hospital', 'sit', 'come', 'ball'] as const).find((k) =>
    wordHit(t, WORDS[k]),
  )
  if (kind) return { kind, named, matchedName: name }
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

/**
 * Gancho de micrófono: escucha continuamente y llama a onCommand con lo
 * oído. Los resultados provisionales también se entregan (¡respuesta
 * rápida!); el motor deduplica las repeticiones.
 */
export function useVoice(onCommand: (text: string) => void) {
  const [supported, setSupported] = useState(isVoiceSupported)
  const [listening, setListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [heard, setHeard] = useState('')
  const recogRef = useRef<Recog | null>(null)
  const wantRef = useRef(false)
  const cmdRef = useRef(onCommand)
  useEffect(() => {
    cmdRef.current = onCommand
  }, [onCommand])

  // al desmontar, apagamos el micrófono
  useEffect(() => {
    return () => {
      wantRef.current = false
      try {
        recogRef.current?.abort()
      } catch {
        /* nada */
      }
    }
  }, [])

  const build = useCallback((): Recog | null => {
    const Ctor = getCtor()
    if (!Ctor) return null
    const r = new Ctor()
    r.lang =
      typeof navigator !== 'undefined' && navigator.language?.startsWith('es')
        ? navigator.language
        : 'es-ES'
    r.continuous = true
    r.interimResults = true

    r.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i]
        const txt = res?.[0]?.transcript ?? ''
        if (!txt.trim()) continue
        setHeard(txt)
        cmdRef.current(txt)
      }
    }
    r.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        wantRef.current = false
        setListening(false)
        setError('permiso')
      }
      // 'no-speech' / 'aborted' son normales: onend rearranca solo
    }
    r.onend = () => {
      if (wantRef.current) {
        try {
          r.start()
        } catch {
          /* ya está arrancando */
        }
      } else {
        setListening(false)
      }
    }
    return r
  }, [])

  const start = useCallback(() => {
    if (!isVoiceSupported()) return
    wantRef.current = true
    setError(null)
    setHeard('')
    const r = recogRef.current ?? build()
    if (!r) return
    recogRef.current = r
    try {
      r.start()
      setListening(true)
      // si el idioma del móvil no lo trae, WebSpeech avisa: probamos es-ES
    } catch {
      setListening(true)
    }
  }, [build])

  const stop = useCallback(() => {
    wantRef.current = false
    try {
      recogRef.current?.stop()
    } catch {
      /* nada */
    }
    setListening(false)
  }, [])

  const toggle = useCallback(() => {
    if (listening) stop()
    else start()
  }, [listening, start, stop])

  return { supported, listening, error, heard, start, stop, toggle }
}
