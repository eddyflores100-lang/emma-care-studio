// Catálogo de objetos de Emma Care Studio + mundos/niveles + voces de mascotas.
// "Biblioteca" de cosas que la niña puede arrastrar al mundo.

import { CatalogItem, LevelDef, LevelId, Mood, Rule, StatKey, WorldObject } from './types'

export const CATALOG: CatalogItem[] = [
  // 🐾 Mascotas (15)
  { id: 'dog', emoji: '🐶', name: 'Perro', kind: 'pet' },
  { id: 'cat', emoji: '🐱', name: 'Gato', kind: 'pet' },
  { id: 'rabbit', emoji: '🐰', name: 'Conejo', kind: 'pet' },
  { id: 'mouse', emoji: '🐭', name: 'Ratón', kind: 'pet' },
  { id: 'bird', emoji: '🐦', name: 'Pajarito', kind: 'pet' },
  { id: 'hamster', emoji: '🐹', name: 'Hámster', kind: 'pet' },
  { id: 'chicken', emoji: '🐔', name: 'Gallina', kind: 'pet' },
  { id: 'duck', emoji: '🦆', name: 'Pato', kind: 'pet' },
  { id: 'fox', emoji: '🦊', name: 'Zorro', kind: 'pet' },
  { id: 'bear', emoji: '🐻', name: 'Oso', kind: 'pet' },
  { id: 'panda', emoji: '🐼', name: 'Panda', kind: 'pet' },
  { id: 'lion', emoji: '🦁', name: 'León', kind: 'pet' },
  { id: 'pig', emoji: '🐷', name: 'Cerdito', kind: 'pet' },
  { id: 'monkey', emoji: '🐵', name: 'Monito', kind: 'pet' },
  { id: 'turtle', emoji: '🐢', name: 'Tortuga', kind: 'pet' },
  // 🏠 Casa (14)
  { id: 'house', emoji: '🏠', name: 'Casita', kind: 'home', hide: true, shelter: true },
  { id: 'bed', emoji: '🛏️', name: 'Cama', kind: 'home', special: 'bed' },
  { id: 'bowl', emoji: '🥣', name: 'Comedero', kind: 'home', special: 'food' },
  { id: 'toy', emoji: '🧸', name: 'Juguete', kind: 'home', special: 'toy' },
  { id: 'bath', emoji: '🛁', name: 'Bañera', kind: 'home', special: 'bath' },
  { id: 'box', emoji: '📦', name: 'Caja', kind: 'home', hide: true },
  { id: 'sofa', emoji: '🛋️', name: 'Sofá', kind: 'home', climb: true },
  { id: 'shelf', emoji: '🗄️', name: 'Estantería', kind: 'home', climb: true },
  { id: 'chair', emoji: '🪑', name: 'Silla', kind: 'home', climb: true },
  { id: 'lamp', emoji: '💡', name: 'Lámpara', kind: 'home' },
  { id: 'tv', emoji: '📺', name: 'Televisión', kind: 'home' },
  { id: 'door', emoji: '🚪', name: 'Puerta', kind: 'home' },
  { id: 'meds', emoji: '💊', name: 'Medicina', kind: 'home' },
  // 🌳 Naturaleza (15)
  { id: 'tree', emoji: '🌳', name: 'Árbol', kind: 'nature', climb: true, shelter: true },
  { id: 'pine', emoji: '🌲', name: 'Pino', kind: 'nature', climb: true, shelter: true },
  { id: 'palm', emoji: '🌴', name: 'Palmera', kind: 'nature', climb: true, shelter: true },
  { id: 'bush', emoji: '🌿', name: 'Arbusto', kind: 'nature', hide: true },
  { id: 'tent', emoji: '⛺', name: 'Tienda', kind: 'nature', hide: true, shelter: true },
  { id: 'rock', emoji: '🪨', name: 'Piedra', kind: 'nature', hide: true },
  { id: 'flowers', emoji: '🌸', name: 'Flores', kind: 'nature' },
  { id: 'sunflower', emoji: '🌻', name: 'Girasol', kind: 'nature' },
  { id: 'cactus', emoji: '🌵', name: 'Cactus', kind: 'nature' },
  { id: 'pond', emoji: '💧', name: 'Estanque', kind: 'nature' },
  { id: 'mushroom', emoji: '🍄', name: 'Honguito', kind: 'nature' },
  { id: 'fountain', emoji: '⛲', name: 'Fuente', kind: 'nature' },
  { id: 'umbrella', emoji: '⛱️', name: 'Sombrilla', kind: 'nature', shelter: true },
  { id: 'shell', emoji: '🐚', name: 'Concha', kind: 'nature' },
]

export const catalogById: Record<string, CatalogItem> = Object.fromEntries(
  CATALOG.map((c) => [c.id, c]),
)

// ===== MUNDOS / NIVELES (se desbloquean jugando y ganando monedas) =====

export const LEVELS: LevelDef[] = [
  {
    id: 'jardin',
    name: 'Jardín',
    emoji: '🌳',
    desc: 'El mundo al aire libre, con césped y flores',
    cost: 0,
    bg: 'grass',
  },
  {
    id: 'casa',
    name: 'Casa',
    emoji: '🏠',
    desc: 'Dentro de casa: sofá, tele y camita',
    cost: 60,
    bg: 'floor-casa',
  },
  {
    id: 'hospital',
    name: 'Hospital',
    emoji: '🏥',
    desc: 'La clínica para curar a los animalitos',
    cost: 120,
    bg: 'floor-hospital',
  },
  {
    id: 'playa',
    name: 'Playa',
    emoji: '🏖️',
    desc: 'Arena, mar y palmeras para vacacionar',
    cost: 200,
    bg: 'floor-playa',
  },
]

export const levelById: Record<LevelId, LevelDef> = Object.fromEntries(
  LEVELS.map((l) => [l.id, l]),
) as Record<LevelId, LevelDef>

export const STATS: Record<StatKey, { emoji: string; label: string; color: string }> = {
  felicidad: { emoji: '❤️', label: 'Felicidad', color: '#f43f5e' },
  comida: { emoji: '🍖', label: 'Comida', color: '#f97316' },
  energia: { emoji: '⚡', label: 'Energía', color: '#f59e0b' },
  higiene: { emoji: '🧼', label: 'Higiene', color: '#14b8a6' },
  descanso: { emoji: '😴', label: 'Descanso', color: '#8b5cf6' },
}

export const STAT_KEYS = Object.keys(STATS) as StatKey[]

// ===== VOCES: lo que "dice" cada animal según su ánimo (globo + sonido) =====

// ===== RIVALIDADES: quién persigue a quién (¡como en la vida real!) =====
// El perro persigue al gato, el gato al ratón, el zorro a la gallina...

export const RIVALS: Record<string, string[]> = {
  dog: ['cat', 'mouse', 'chicken'],
  cat: ['mouse', 'bird', 'hamster'],
  fox: ['rabbit', 'mouse', 'chicken', 'duck'],
  lion: ['monkey'],
}

/** al revés: de quién huye cada animalito */
export const FLEE_FROM: Record<string, string[]> = (() => {
  const m: Record<string, string[]> = {}
  for (const [pred, preys] of Object.entries(RIVALS)) {
    for (const p of preys) {
      if (!m[p]) m[p] = []
      m[p].push(pred)
    }
  }
  return m
})()

export const VOICES: Record<string, Record<Mood, string>> = {
  dog: {
    feliz: '¡Guau guau! 🎉',
    hambre: '¡Grrr… guau! 🍖',
    sueno: 'Zzz… guau 😴',
    normal: '¡Guau!',
    triste: 'Auuu… 😢',
    enojado: '¡GRRR! ¡GUAU! 😠',
    miedo: '¡Auuu! 😱',
  },
  cat: {
    feliz: '¡Miau! 😻',
    hambre: '¡Miau miau! 🍖',
    sueno: 'Zzz… miau 😴',
    normal: '¡Miau!',
    triste: 'Miauu… 😢',
    enojado: '¡PSSSS! 😠',
    miedo: '¡Miaaaau! 😱',
  },
  rabbit: {
    feliz: '¡Pff pff! 🎉',
    hambre: '¡Pff! 🥕',
    sueno: 'Zzz… 😴',
    normal: '¡Prrr!',
    triste: 'Pfff… 😢',
    enojado: '¡Pfff! 😠',
    miedo: '¡Piii! 😱',
  },
  mouse: {
    feliz: '¡Pi pi pi! 🎉',
    hambre: '¡Pi pi! 🧀',
    sueno: 'Zzz… pi 😴',
    normal: '¡Pi!',
    triste: 'Piii… 😢',
    enojado: '¡PI PI PI! 😠',
    miedo: '¡PIIIII! 😱',
  },
  bird: {
    feliz: '¡Pío pío! 🎉',
    hambre: '¡Pío pío! 🐛',
    sueno: 'Zzz… pío 😴',
    normal: '¡Pío!',
    triste: 'Pío… 😢',
    enojado: '¡PÍO PÍO! 😠',
    miedo: '¡AAAAH! 😱',
  },
  hamster: {
    feliz: '¡Pi pi! 🎉',
    hambre: '¡Pi! 🌰',
    sueno: 'Zzz… 😴',
    normal: '¡Piii!',
    triste: 'Pii… 😢',
    enojado: '¡PI PI! 😠',
    miedo: '¡PIII! 😱',
  },
  chicken: {
    feliz: '¡Coc coc! 🎉',
    hambre: '¡Coc! 🌽',
    sueno: 'Zzz… coc 😴',
    normal: '¡Coc coc!',
    triste: 'Bwok… 😢',
    enojado: '¡CO CO COC! 😠',
    miedo: '¡COCOOOO! 😱',
  },
  duck: {
    feliz: '¡Cuac cuac! 🎉',
    hambre: '¡Cuac! 🍞',
    sueno: 'Zzz… cuac 😴',
    normal: '¡Cuac!',
    triste: 'Cuaac… 😢',
    enojado: '¡CUAC CUAC! 😠',
    miedo: '¡CUAAAAC! 😱',
  },
  turtle: {
    feliz: '¡Plop plop! 🎉',
    hambre: '¡Plop! 🥬',
    sueno: 'Zzz… 😴',
    normal: '¡Plop!',
    triste: 'Plooop… 😢',
    enojado: '¡PLOP! 😠',
    miedo: '¡Me escondo! 😱',
  },
  fox: {
    feliz: '¡Yip yip! 🎉',
    hambre: '¡Yip! 🍖',
    sueno: 'Zzz… yip 😴',
    normal: '¡Yip!',
    triste: 'Auuu… 😢',
    enojado: '¡GRRR YIP! 😠',
    miedo: '¡Yiiip! 😱',
  },
  bear: {
    feliz: '¡Rawr rawr! 🎉',
    hambre: '¡Grrr! 🍯',
    sueno: 'Zzz… grrr 😴',
    normal: '¡Grrr!',
    triste: 'Grrr… 😢',
    enojado: '¡GRRRRR! 😠',
    miedo: '¡Ooooh! 😱',
  },
  panda: {
    feliz: '¡Brrr brrr! 🎉',
    hambre: '¡Brrr! 🎋',
    sueno: 'Zzz… 😴',
    normal: '¡Brrr!',
    triste: 'Brrr… 😢',
    enojado: '¡BRRR! 😠',
    miedo: '¡Biii! 😱',
  },
  lion: {
    feliz: '¡Roar! 🎉',
    hambre: '¡Roooar! 🍖',
    sueno: 'Zzz… roar 😴',
    normal: '¡Roar!',
    triste: 'Roooar… 😢',
    enojado: '¡ROOOAR! 😠',
    miedo: '¡Roar? 😱',
  },
  pig: {
    feliz: '¡Oink oink! 🎉',
    hambre: '¡Oink! 🍎',
    sueno: 'Zzz… oink 😴',
    normal: '¡Oink!',
    triste: 'Oiiiink… 😢',
    enojado: '¡OINK OINK! 😠',
    miedo: '¡Chiiii! 😱',
  },
  monkey: {
    feliz: '¡Uja uja! 🎉',
    hambre: '¡Uja! 🍌',
    sueno: 'Zzz… uja 😴',
    normal: '¡Uja uja!',
    triste: 'Uaa… 😢',
    enojado: '¡JA JA JA! 😠',
    miedo: '¡Uiiii! 😱',
  },
}

/** Nombres por defecto bonitos para las mascotas */
export const PET_NAMES: Record<string, string[]> = {
  dog: ['Max', 'Luna', 'Rocky', 'Toby'],
  cat: ['Misi', 'Mia', 'Pelusa', 'Simba'],
  rabbit: ['Copito', 'Nube', 'Canela', 'Bola'],
  mouse: ['Pinky', 'Quesito', 'Miguela', 'Bolita'],
  bird: ['Pío', 'Kiwi', 'Cielo', 'Piolín'],
  hamster: ['Nugget', 'Bombón', 'Galleta', 'Peluche'],
  chicken: ['Clara', 'Cocó', 'Pluma', 'Graciela'],
  duck: ['Patricio', 'Cuca', 'Lago', 'Nata'],
  turtle: ['Tortu', 'Lenta', 'Concha', 'Flash'],
  fox: ['Canela', 'Zorrita', 'Naranja', 'Rustie'],
  bear: ['Osito', 'Miel', 'Bodoque', 'Peluche'],
  panda: ['Bambú', 'Pandi', 'Momo', 'Nube'],
  lion: ['Simba', 'Rey', 'Sol', 'Dorado'],
  pig: ['Rosita', 'Trufa', 'Perla', 'Cerdito'],
  monkey: ['Coco', 'Chispa', 'Titi', 'Plátano'],
}

let counter = 0
export function uid(): string {
  counter += 1
  return `o${Date.now().toString(36)}${counter.toString(36)}${Math.floor(Math.random() * 46656).toString(36)}`
}

function mk(
  catalogId: string,
  name: string,
  x: number,
  y: number,
  size = 1,
  hue = 0,
  speed?: number,
  level: LevelId = 'jardin',
): WorldObject {
  return { id: uid(), catalogId, name, x, y, size, hue, speed, level }
}

/** Proyecto de bienvenida: un pequeño mundo de ejemplo con reglas demo */
export function makeDemoProject(): { objects: WorldObject[]; rules: Rule[] } {
  const objects = [
    mk('house', 'Casita', 12, 26, 2.3),
    mk('tree', 'Árbol', 71, 30, 1.9),
    mk('flowers', 'Flores', 30, 40, 1, 300),
    mk('pond', 'Estanque', 58, 88, 1.4, 180),
    mk('mushroom', 'Honguito', 44, 30, 0.9, 0),
    mk('sunflower', 'Girasol', 88, 55, 1, 0),
    mk('bush', 'Arbusto', 82, 76, 1.2),
    mk('box', 'Caja', 6, 58, 1.1),
    mk('bowl', 'Comedero', 38, 72),
    mk('bed', 'Cama', 16, 76, 1.1),
    mk('toy', 'Juguete', 52, 48),
    mk('dog', 'Max', 47, 56, 1.3, 0, 8),
    mk('cat', 'Misi', 60, 62, 1.2, 0, 9),
    mk('mouse', 'Pinky', 72, 70, 0.9, 0, 11),
  ]
  const toy = objects[10]
  const dog = objects[11]
  const rules: Rule[] = [
    {
      id: uid(),
      trigger: 'cerca',
      petId: dog.id,
      targetId: toy.id,
      intervalSec: 20,
      effect: 'aumentar',
      stat: 'felicidad',
      amount: 15,
    },
    {
      id: uid(),
      trigger: 'acariciar',
      petId: dog.id,
      targetId: '',
      intervalSec: 20,
      effect: 'aumentar',
      stat: 'felicidad',
      amount: 10,
    },
  ]
  return { objects, rules }
}

/** Mundo nuevo (vacío pero con lo esencial para empezar) */
export function makeBlankProject(): { objects: WorldObject[]; rules: Rule[] } {
  const objects = [
    mk('house', 'Casita', 14, 28, 2.2),
    mk('bush', 'Arbusto', 80, 74, 1.2),
    mk('bowl', 'Comedero', 40, 72),
    mk('bed', 'Cama', 20, 78, 1.1),
    mk('dog', 'Max', 50, 55, 1.3, 0, 8),
  ]
  return { objects, rules: [] }
}

/**
 * Muebles/decoración que aparecen solos al desbloquear un mundo,
 * para que sea jugable desde el primer segundo.
 */
export function makeLevelStarters(level: LevelId): WorldObject[] {
  switch (level) {
    case 'casa':
      return [
        mk('bowl', 'Comedero', 45, 78, 1, 0, undefined, 'casa'),
        mk('bed', 'Camita', 15, 80, 1.1, 0, undefined, 'casa'),
        mk('sofa', 'Sofá', 28, 42, 1.8, 0, undefined, 'casa'),
        mk('shelf', 'Estantería', 60, 30, 1.4, 0, undefined, 'casa'),
        mk('box', 'Caja', 78, 76, 1.1, 0, undefined, 'casa'),
        mk('lamp', 'Lámpara', 75, 28, 1.1, 0, undefined, 'casa'),
        mk('tv', 'Televisión', 88, 34, 1.3, 0, undefined, 'casa'),
        mk('door', 'Puerta', 6, 30, 1.2, 0, undefined, 'casa'),
      ]
    case 'hospital':
      return [
        mk('bowl', 'Comedero', 60, 82, 1, 0, undefined, 'hospital'),
        mk('bed', 'Camilla', 40, 74, 1.1, 0, undefined, 'hospital'),
        mk('bed', 'Camilla 2', 70, 74, 1.1, 150, undefined, 'hospital'),
        mk('meds', 'Medicina', 85, 28, 1, 0, undefined, 'hospital'),
        mk('bath', 'Bañera médica', 15, 78, 1.1, 0, undefined, 'hospital'),
      ]
    case 'playa':
      return [
        mk('bowl', 'Comedero', 35, 75, 1, 0, undefined, 'playa'),
        mk('bed', 'Toalla cama', 22, 80, 1.1, 0, undefined, 'playa'),
        mk('palm', 'Palmera', 12, 32, 1.7, 0, undefined, 'playa'),
        mk('umbrella', 'Sombrilla', 85, 45, 1.5, 0, undefined, 'playa'),
        mk('tent', 'Tienda', 55, 30, 1.3, 0, undefined, 'playa'),
        mk('shell', 'Concha', 70, 82, 0.8, 0, undefined, 'playa'),
      ]
    case 'jardin':
    default:
      return []
  }
}
