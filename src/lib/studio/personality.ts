import type { WorldObject } from './types'

const profiles: Record<string, { label: string; speed: number; pause: number; greeting: string }> = {
  dog: {label:'Curioso y sociable',speed:8,pause:1400,greeting:'¡Aquí voy! ¿Jugamos juntos? 🐶'},
  cat: {label:'Independiente y ágil',speed:9,pause:2600,greeting:'¡Aquí voy! Después exploraré un poquito 🐱'},
  mouse: {label:'Tímido y veloz',speed:11,pause:1000,greeting:'¡Aquí voy! Te escuché desde mi rincón 🐭'},
  rabbit: {label:'Juguetón y atento',speed:10,pause:1500,greeting:'¡Aquí voy! ¡Demos unos saltitos! 🐰'},
  turtle: {label:'Tranquila y paciente',speed:4,pause:3200,greeting:'¡Aquí voy, a mi ritmo! 🐢'},
  bird: {label:'Alegre y explorador',speed:12,pause:1100,greeting:'¡Aquí voy! ¡Pío, pío! 🐦'},
}

export function petPersonality(pet: Pick<WorldObject, 'catalogId' | 'id'>) {
  const profile = profiles[pet.catalogId] ?? {label:'Aventurero y cariñoso',speed:8,pause:1800,greeting:'¡Aquí voy! Qué alegría verte 🐾'}
  // Individual pauses and routes distinguish even animals of the same species.
  const variation = Array.from(pet.id).reduce((n,c) => n + c.charCodeAt(0),0) % 700
  return {...profile,pause:profile.pause+variation}
}
