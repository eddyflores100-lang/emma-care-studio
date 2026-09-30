// Emma Care Studio — modelo de datos
// Un proyecto es: objetos en el mundo + reglas mágicas + monedas.
// En modo juego, cada mascota tiene un "runtime" con sus estadísticas.

export type ObjKind = 'pet' | 'home' | 'nature'

/** Objetos con comportamiento mágico incorporado (comen, duermen, limpian...) */
export type SpecialKind = 'food' | 'bed' | 'toy' | 'bath'

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
  /** cooldowns por pareja regla/mascota/objeto y objetos especiales */
  pairCd: Record<string, number>
}

export interface Particle {
  id: string
  emoji: string
  x: number
  y: number
}

export interface SavedProject {
  version: 1
  objects: WorldObject[]
  rules: Rule[]
  coins: number
  savedAt: string
}

export type PlayerAction = 'alimentar' | 'acariciar' | 'jugar' | 'banar' | 'dormir' | 'curar'

export type ShopItemId = 'cat' | 'rabbit' | 'toy' | 'cake'
