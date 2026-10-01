import { z } from 'zod'
import { catalogById } from './catalog'
import type { SavedProject, PetRuntime, WorldObject } from './types'

export const SAVE_KEY = 'emma-care-studio-v1'
export const BACKUP_KEY = 'emma-care-studio-backup'
export const MAX_PROJECT_BYTES = 2_000_000
const level = z.enum(['jardin', 'casa', 'hospital', 'playa'])
const id = z.string().min(1).max(100).refine(v => !['__proto__', 'constructor', 'prototype'].includes(v))
const number = (min: number, max: number) => z.number().finite().min(min).max(max)
const stats = z.object({ felicidad: number(0, 100), comida: number(0, 100),
  energia: number(0, 100), higiene: number(0, 100), descanso: number(0, 100) })
const savedPet = z.object({ stats, lvl: number(1, 9).int(), xp: number(0, 99).int(),
  injured: z.boolean(), sick: z.boolean(), state: z.enum(['idle', 'sleep', 'rest']),
  healRemaining: number(0, 120000), restRemaining: number(0, 120000), stay: z.boolean(),
  bonds: z.record(id,number(-100,100)).optional(),
  inside: id.nullable().optional(),
  hospitalStatus: z.enum(['waiting','treating','ready']).nullable().optional(),
  hold: z.object({cmd:z.enum(['stay','sit']),remaining:number(0,120000).nullable()}).nullable().optional() })
const schema = z.object({
  version: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  objects: z.array(z.object({
    id, catalogId: z.string().refine(v => Object.hasOwn(catalogById, v)),
    name: z.string().max(80), x: number(0, 100), y: number(0, 100),
    size: number(0.6, 2.4), hue: number(0, 360), speed: number(1, 30).optional(),
    level: level.default('jardin'), home: level.optional(),
  })).max(500),
  rules: z.array(z.object({ id, trigger: z.enum(['cerca', 'acariciar', 'cada']),
    petId: z.string().max(100), targetId: z.string().max(100), intervalSec: number(1, 3600),
    effect: z.enum(['aumentar', 'reducir']),
    stat: z.enum(['felicidad', 'comida', 'energia', 'higiene', 'descanso']), amount: number(0, 100),
  })).max(200).default([]),
  coins: number(0, 1_000_000_000).default(0), savedAt: z.string().max(100).default(''),
  unlockedLevels: z.array(level).max(4).default(['jardin']), currentLevel: level.default('jardin'),
  pets: z.record(id, savedPet).optional(),
  careMissions: z.object({alimentar:number(0,2).int(),acariciar:number(0,2).int(),banar:number(0,2).int()}).optional(),
})

export function decodeProject(raw: string): SavedProject {
  if (raw.length > MAX_PROJECT_BYTES) throw new Error('El archivo es demasiado grande')
  const data = schema.parse(JSON.parse(raw))
  if (new Set(data.objects.map(o => o.id)).size !== data.objects.length) throw new Error('IDs duplicados')
  data.unlockedLevels = [...new Set(['jardin' as const, ...data.unlockedLevels])]
  if (!data.unlockedLevels.includes(data.currentLevel)) data.currentLevel = 'jardin'
  if (data.objects.some(o => !data.unlockedLevels.includes(o.level))) throw new Error('Mundo bloqueado')
  const petIds = new Set(data.objects.filter(o => catalogById[o.catalogId].kind === 'pet').map(o => o.id))
  data.pets = Object.fromEntries(Object.entries(data.pets ?? {}).filter(([pid]) => petIds.has(pid)))
  for (const obj of data.objects) {
    const rt = data.pets[obj.id]
    if (rt?.bonds) rt.bonds = Object.fromEntries(Object.entries(rt.bonds).filter(([pid])=>petIds.has(pid)&&pid!==obj.id))
    if (rt?.inside && !data.objects.some(o => o.id === rt.inside && o.catalogId === 'house' && o.level === obj.level)) rt.inside = null
    if (rt?.hospitalStatus && obj.level !== 'hospital') rt.hospitalStatus = null
  }
  return data
}

export function snapshotProject(s: { objects: WorldObject[]; rules: SavedProject['rules']; coins: number;
  unlockedLevels: NonNullable<SavedProject['unlockedLevels']>; currentLevel: NonNullable<SavedProject['currentLevel']>;
  pets: Record<string, PetRuntime>; careMissions?: SavedProject['careMissions'] }): SavedProject {
  const now = Date.now()
  return { version: 3, careMissions:s.careMissions, objects: s.objects, rules: s.rules, coins: s.coins,
    unlockedLevels: s.unlockedLevels, currentLevel: s.currentLevel, savedAt: new Date().toISOString(),
    pets: Object.fromEntries(s.objects.filter(o => catalogById[o.catalogId]?.kind === 'pet' && s.pets[o.id])
      .map(o => { const rt = s.pets[o.id]; return [o.id, {
        stats: { ...rt.stats }, lvl: rt.lvl, xp: rt.xp, injured: rt.injured, sick: rt.sick,
        bonds:{...rt.bonds}, inside: rt.inside, hospitalStatus: rt.hospitalStatus,
        state: rt.state === 'sleep' || rt.state === 'rest' ? rt.state : 'idle',
        healRemaining: Math.max(0, Math.min(120000, rt.healAt - now)),
        restRemaining: Math.max(0, Math.min(120000, rt.restUntil - now)),
        stay: !!(rt.obey && ['stay', 'sit'].includes(rt.obey.cmd) && rt.obey.until === Infinity),
        hold: rt.obey && (rt.obey.cmd === 'stay' || rt.obey.cmd === 'sit') && rt.obey.until > now
          ? { cmd: rt.obey.cmd, remaining: rt.obey.until === Infinity ? null : Math.max(0, rt.obey.until - now) }
          : null,
      }] })),
  }
}
