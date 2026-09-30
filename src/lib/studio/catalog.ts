// Catálogo de objetos de Emma Care Studio + configuración de estadísticas.
// "Biblioteca" de cosas que la niña puede arrastrar al mundo.

import { CatalogItem, Rule, StatKey, WorldObject } from './types'

export const CATALOG: CatalogItem[] = [
  // 🐾 Mascotas
  { id: 'dog', emoji: '🐶', name: 'Perro', kind: 'pet' },
  { id: 'cat', emoji: '🐱', name: 'Gato', kind: 'pet' },
  { id: 'rabbit', emoji: '🐰', name: 'Conejo', kind: 'pet' },
  // 🏠 Casa
  { id: 'bed', emoji: '🛏️', name: 'Cama', kind: 'home', special: 'bed' },
  { id: 'bowl', emoji: '🥣', name: 'Comedero', kind: 'home', special: 'food' },
  { id: 'toy', emoji: '🧸', name: 'Juguete', kind: 'home', special: 'toy' },
  { id: 'bath', emoji: '🛁', name: 'Bañera', kind: 'home', special: 'bath' },
  { id: 'house', emoji: '🏠', name: 'Casa', kind: 'home' },
  { id: 'clinic', emoji: '🏥', name: 'Clínica', kind: 'home' },
  { id: 'petshop', emoji: '🛍️', name: 'Tienda', kind: 'home' },
  // 🌳 Naturaleza
  { id: 'tree', emoji: '🌳', name: 'Árbol', kind: 'nature' },
  { id: 'flowers', emoji: '🌸', name: 'Flores', kind: 'nature' },
  { id: 'rock', emoji: '🪨', name: 'Piedra', kind: 'nature' },
  { id: 'pond', emoji: '💧', name: 'Estanque', kind: 'nature' },
  { id: 'mushroom', emoji: '🍄', name: 'Honguito', kind: 'nature' },
]

export const catalogById: Record<string, CatalogItem> = Object.fromEntries(
  CATALOG.map((c) => [c.id, c]),
)

export const STATS: Record<StatKey, { emoji: string; label: string; color: string }> = {
  felicidad: { emoji: '❤️', label: 'Felicidad', color: '#f43f5e' },
  comida: { emoji: '🍖', label: 'Comida', color: '#f97316' },
  energia: { emoji: '⚡', label: 'Energía', color: '#f59e0b' },
  higiene: { emoji: '🧼', label: 'Higiene', color: '#14b8a6' },
  descanso: { emoji: '😴', label: 'Descanso', color: '#8b5cf6' },
}

export const STAT_KEYS = Object.keys(STATS) as StatKey[]

/** Nombres por defecto bonitos para las mascotas */
export const PET_NAMES: Record<string, string[]> = {
  dog: ['Max', 'Luna', 'Rocky', 'Toby'],
  cat: ['Misi', 'Mia', 'Pelusa', 'Simba'],
  rabbit: ['Copito', 'Nube', 'Canela', 'Bola'],
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
): WorldObject {
  return { id: uid(), catalogId, name, x, y, size, hue, speed }
}

/** Proyecto de bienvenida: un pequeño mundo de ejemplo con reglas demo */
export function makeDemoProject(): { objects: WorldObject[]; rules: Rule[] } {
  const objects = [
    mk('house', 'Casa', 12, 26, 2.3),
    mk('clinic', 'Clínica', 87, 24, 2.1, 120),
    mk('tree', 'Árbol', 71, 62, 1.9),
    mk('flowers', 'Flores', 30, 40, 1, 300),
    mk('pond', 'Estanque', 58, 84, 1.4, 180),
    mk('mushroom', 'Honguito', 44, 30, 0.9, 0),
    mk('bowl', 'Comedero', 38, 72),
    mk('bed', 'Cama', 16, 76, 1.1),
    mk('toy', 'Juguete', 52, 48),
    mk('dog', 'Max', 47, 56, 1.3, 0, 8),
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
