// Catálogo de objetos de Emma Care Studio + mundos/niveles + voces de mascotas.
// "Biblioteca" de cosas que la niña puede arrastrar al mundo.

import { CatalogItem, LevelDef, LevelId, Mood, Rule, StatKey, WorldObject } from './types'

export const CATALOG: CatalogItem[] = [
  // 🐾 Mascotas (9)
  { id: 'dog', emoji: '🐶', name: 'Perro', kind: 'pet' },
  { id: 'cat', emoji: '🐱', name: 'Gato', kind: 'pet' },
  { id: 'rabbit', emoji: '🐰', name: 'Conejo', kind: 'pet' },
  { id: 'fox', emoji: '🦊', name: 'Zorro', kind: 'pet' },
  { id: 'bear', emoji: '🐻', name: 'Oso', kind: 'pet' },
  { id: 'panda', emoji: '🐼', name: 'Panda', kind: 'pet' },
  { id: 'lion', emoji: '🦁', name: 'León', kind: 'pet' },
  { id: 'pig', emoji: '🐷', name: 'Cerdito', kind: 'pet' },
  { id: 'monkey', emoji: '🐵', name: 'Monito', kind: 'pet' },
  // 🏠 Casa (10)
  { id: 'bed', emoji: '🛏️', name: 'Cama', kind: 'home', special: 'bed' },
  { id: 'bowl', emoji: '🥣', name: 'Comedero', kind: 'home', special: 'food' },
  { id: 'toy', emoji: '🧸', name: 'Juguete', kind: 'home', special: 'toy' },
  { id: 'bath', emoji: '🛁', name: 'Bañera', kind: 'home', special: 'bath' },
  { id: 'sofa', emoji: '🛋️', name: 'Sofá', kind: 'home' },
  { id: 'lamp', emoji: '💡', name: 'Lámpara', kind: 'home' },
  { id: 'tv', emoji: '📺', name: 'Televisión', kind: 'home' },
  { id: 'chair', emoji: '🪑', name: 'Silla', kind: 'home' },
  { id: 'door', emoji: '🚪', name: 'Puerta', kind: 'home' },
  { id: 'meds', emoji: '💊', name: 'Medicina', kind: 'home' },
  // 🌳 Naturaleza (13)
  { id: 'tree', emoji: '🌳', name: 'Árbol', kind: 'nature' },
  { id: 'pine', emoji: '🌲', name: 'Pino', kind: 'nature' },
  { id: 'flowers', emoji: '🌸', name: 'Flores', kind: 'nature' },
  { id: 'sunflower', emoji: '🌻', name: 'Girasol', kind: 'nature' },
  { id: 'cactus', emoji: '🌵', name: 'Cactus', kind: 'nature' },
  { id: 'rock', emoji: '🪨', name: 'Piedra', kind: 'nature' },
  { id: 'pond', emoji: '💧', name: 'Estanque', kind: 'nature' },
  { id: 'mushroom', emoji: '🍄', name: 'Honguito', kind: 'nature' },
  { id: 'bush', emoji: '🌿', name: 'Arbusto', kind: 'nature' },
  { id: 'fountain', emoji: '⛲', name: 'Fuente', kind: 'nature' },
  { id: 'palm', emoji: '🌴', name: 'Palmera', kind: 'nature' },
  { id: 'umbrella', emoji: '⛱️', name: 'Sombrilla', kind: 'nature' },
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

export const VOICES: Record<string, Record<Mood, string>> = {
  dog: {
    feliz: '¡Guau guau! 🎉',
    hambre: '¡Grrr… guau! 🍖',
    sueno: 'Zzz… guau 😴',
    normal: '¡Guau!',
    triste: 'Auuu… 😢',
  },
  cat: {
    feliz: '¡Miau! 😻',
    hambre: '¡Miau miau! 🍖',
    sueno: 'Zzz… miau 😴',
    normal: '¡Miau!',
    triste: 'Miauu… 😢',
  },
  rabbit: {
    feliz: '¡Pff pff! 🎉',
    hambre: '¡Pff! 🥕',
    sueno: 'Zzz… 😴',
    normal: '¡Prrr!',
    triste: 'Pfff… 😢',
  },
  fox: {
    feliz: '¡Yip yip! 🎉',
    hambre: '¡Yip! 🍖',
    sueno: 'Zzz… yip 😴',
    normal: '¡Yip!',
    triste: 'Auuu… 😢',
  },
  bear: {
    feliz: '¡Rawr rawr! 🎉',
    hambre: '¡Grrr! 🍯',
    sueno: 'Zzz… grrr 😴',
    normal: '¡Grrr!',
    triste: 'Grrr… 😢',
  },
  panda: {
    feliz: '¡Brrr brrr! 🎉',
    hambre: '¡Brrr! 🎋',
    sueno: 'Zzz… 😴',
    normal: '¡Brrr!',
    triste: 'Brrr… 😢',
  },
  lion: {
    feliz: '¡Roar! 🎉',
    hambre: '¡Roooar! 🍖',
    sueno: 'Zzz… roar 😴',
    normal: '¡Roar!',
    triste: 'Roooar… 😢',
  },
  pig: {
    feliz: '¡Oink oink! 🎉',
    hambre: '¡Oink! 🍎',
    sueno: 'Zzz… oink 😴',
    normal: '¡Oink!',
    triste: 'Oiiiink… 😢',
  },
  monkey: {
    feliz: '¡Uja uja! 🎉',
    hambre: '¡Uja! 🍌',
    sueno: 'Zzz… uja 😴',
    normal: '¡Uja uja!',
    triste: 'Uaa… 😢',
  },
}

/** Nombres por defecto bonitos para las mascotas */
export const PET_NAMES: Record<string, string[]> = {
  dog: ['Max', 'Luna', 'Rocky', 'Toby'],
  cat: ['Misi', 'Mia', 'Pelusa', 'Simba'],
  rabbit: ['Copito', 'Nube', 'Canela', 'Bola'],
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
    mk('house', 'Casa', 12, 26, 2.3),
    mk('tree', 'Árbol', 71, 62, 1.9),
    mk('flowers', 'Flores', 30, 40, 1, 300),
    mk('pond', 'Estanque', 58, 84, 1.4, 180),
    mk('mushroom', 'Honguito', 44, 30, 0.9, 0),
    mk('sunflower', 'Girasol', 88, 55, 1, 0),
    mk('bowl', 'Comedero', 38, 72),
    mk('bed', 'Cama', 16, 76, 1.1),
    mk('toy', 'Juguete', 52, 48),
    mk('dog', 'Max', 47, 56, 1.3, 0, 8),
    mk('cat', 'Misi', 63, 60, 1.2, 0, 9),
  ]
  const toy = objects[8]
  const dog = objects[9]
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
    mk('house', 'Casa', 14, 28, 2.2),
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
        mk('shell', 'Concha', 70, 82, 0.8, 0, undefined, 'playa'),
      ]
    case 'jardin':
    default:
      return []
  }
}
