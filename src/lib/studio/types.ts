// Emma Care Studio — modelo de datos
// Un proyecto es: objetos por mundo (nivel) + reglas mágicas + monedas.
// En modo juego, cada mascota tiene un "runtime" con sus estadísticas.

export type ObjKind = 'pet' | 'home' | 'nature'

/** Objetos con comportamiento mágico incorporado (comen, duermen, limpian, beben...) */
export type SpecialKind = 'food' | 'bed' | 'toy' | 'bath' | 'water'

/** Mundos/niveles del juego (se desbloquean con monedas) */
export type LevelId = 'jardin' | 'casa' | 'hospital' | 'playa'

/** Ánimo de la mascota: decide su voz y su cara */
export type Mood =
  | 'feliz'
  | 'hambre'
  | 'sueno'
  | 'normal'
  | 'triste'
  | 'enojado'
  | 'miedo'

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
  /** las mascotas pueden esconderse aquí para escapar de sus rivales */
  hide?: boolean
  /** las mascotas pueden treparse aquí para escapar */
  climb?: boolean
  /** refugio contra la lluvia */
  shelter?: boolean
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
  /** mundo de origen de la mascota (para volver del hospital curada) */
  home?: LevelId
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

export type PetState = 'idle' | 'walk' | 'eat' | 'sleep' | 'drink' | 'rest'

/** órdenes de obediencia que el dueño puede dar */
export type Command = 'sit' | 'stay' | 'come' | 'hide'

/** sorpresas aleatorias del juego */
export type EventKind = 'lluvia' | 'escasez' | 'mariposa' | 'regalo'

export interface GameEvent {
  kind: EventKind
  /** momento en que termina */
  until: number
  /** para el regalo: posición de la caja sorpresa */
  x?: number
  y?: number
}

/** pelota lanzable por el dueño (el perro y el zorro la buscan) */
export interface Ball {
  id: string
  x: number
  y: number
  /** momento en que desaparece si nadie la recoge */
  until: number
}

export interface PetRuntime {
  stats: Record<StatKey, number>
  state: PetState
  /** destino actual en % */
  tx: number
  ty: number
  targetKind: 'random' | 'food' | 'bed' | 'water' | 'escape' | 'shelter' | 'goto'
  /** nivel de la mascota (sube con XP por buen cuidado) */
  lvl: number
  /** experiencia 0-99: al llegar a 100 sube de nivel */
  xp: number
  // ===== heridas (salen de persecuciones y peleas) =====
  /** está herido/a: cojea, no pelea ni juega, necesita reposo o hospital */
  injured: boolean
  /** momento en que se curará si descansa (en casa tarda más que en el hospital) */
  healAt: number
  /** si está en reposo: momento en que se levanta (las sanas también descansan) */
  restUntil: number
  /** escondite elegido por la orden ¡Escondeos! */
  hideSpot: string | null
  /** timestamp (ms) en que elegirá nuevo destino */
  wanderAt: number
  eatUntil: number
  drinkUntil: number
  facing: 1 | -1
  sick: boolean
  toyAt: number
  /** timestamp (ms) de la próxima vocalización espontánea */
  voiceAt: number
  /** cooldowns por pareja regla/mascota/objeto y objetos especiales */
  pairCd: Record<string, number>
  // ===== persecuciones entre rivales (¡el perro detrás del gato!) =====
  /** si > now, está en una persecución */
  chaseUntil: number
  chaseRole: 'chase' | 'flee' | null
  chasePartner: string | null
  /** próximo recálculo de rumbo de huida */
  fleeAt: number
  /** si está escondido: id del objeto tras el que se esconde */
  hiding: string | null
  /** si está trepado: id del objeto encima del que está */
  onTopOf: string | null
  // ===== órdenes del dueño (sentado, quieto, ven) =====
  obey: { cmd: Command; until: number } | null
  /** orden por voz con destino: "¡Max a la casa!" — camina hasta el lugar indicado */
  goTo: { dest: 'casa' | 'cama' | 'agua' | 'comida'; until: number } | null
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
  | 'mouse'
  | 'bird'
  | 'chicken'
  | 'hamster'
  | 'duck'
  | 'turtle'
