// Emma Care Studio — modelo de datos
// Un proyecto es: objetos por mundo (nivel) + reglas mágicas + monedas.
// En modo juego, cada mascota tiene un "runtime" con sus estadísticas.

export type ObjKind = 'pet' | 'home' | 'nature'

/** Objetos con comportamiento mágico incorporado (comen, duermen, limpian...) */
export type SpecialKind = 'food' | 'bed' | 'toy' | 'bath'

/** Mundos/niveles del juego (se desbloquean con monedas) */
export type LevelId = 'jardin' | 'casa' | 'hospital' | 'playa'

/** Ánimo de la mascota: decide su voz y su cara */
export type Mood = 'feliz' | 'hambre' | 'sueno' | 'normal' | 'triste'

export interface LevelDef {
  id: LevelId
  name: string
  emoji: string
  desc: string
  /** monedas necesarias para desbloquearlo (0 = gratis) */
  cost: number
  /** clase CSS del suelo del lienzo */
  bg: string
}

export interface CatalogItem {
  id: string
  emoji: string
  name: string
  kind: ObjKind
  special?: SpecialKind
}

export interface WorldObject {
  id: string
  catalogId: string
  name: string
  /** posición en % del lienzo (0-100) */
  x: number
  y: number
  /** multiplicador de tamaño 0.6 - 2.4 */
  size: number
  /** matiz de color 0-330 (filtro hue-rotate sobre el emoji) */
  hue: number
  /** solo mascotas: velocidad en %/segundo */
  speed?: number
  /** mundo al que pertenece el objeto */
  level: LevelId
}

export type StatKey = 'felicidad' | 'comida' | 'energia' | 'higiene' | 'descanso'

export type TriggerType = 'cerca' | 'acariciar' | 'cada'

export interface Rule {
  id: string
  trigger: TriggerType
  /** id de mascota o 'cualquiera' */
  petId: string
  /** solo para trigger 'cerca': id de objeto o 'cualquiera' */
  targetId: string
  /** solo para trigger 'cada': segundos */
  intervalSec: number
  effect: 'aumentar' | 'reducir'
  stat: StatKey
  amount: number
}

export type PetState = 'idle' | 'walk' | 'eat' | 'sleep'

export interface PetRuntime {
  stats: Record<StatKey, number>
  state: PetState
  /** destino actual en % */
  tx: number
  ty: number
  targetKind: 'random' | 'food' | 'bed'
  /** timestamp (ms) en que elegirá nuevo destino */
  wanderAt: number
  eatUntil: number
  facing: 1 | -1
  sick: boolean
  toyAt: number
  /** timestamp (ms) de la próxima vocalización espontánea */
  voiceAt: number
  /** cooldowns por pareja regla/mascota/objeto y objetos especiales */
  pairCd: Record<string, number>
}

export interface Particle {
  id: string
  emoji: string
  x: number
  y: number
}

/** Globo de voz: texto que dice una mascota (¡Guau!, ¡Miau...) */
export interface SayBubble {
  text: string
  until: number
}

export interface SavedProject {
  /** v1 = sin mundos (todo jardín); v2 = con niveles y desbloqueos */
  version: 1 | 2
  objects: WorldObject[]
  rules: Rule[]
  coins: number
  savedAt: string
  unlockedLevels?: LevelId[]
  currentLevel?: LevelId
}

export type PlayerAction = 'alimentar' | 'acariciar' | 'jugar' | 'banar' | 'dormir' | 'curar'

export type ShopItemId =
  | 'cake'
  | 'toy'
  | 'cat'
  | 'rabbit'
  | 'fox'
  | 'pig'
  | 'monkey'
  | 'panda'
  | 'bear'
  | 'lion'
