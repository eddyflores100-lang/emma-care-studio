// Emma Care Studio — store principal (zustand)
// Incluye: estado del editor, reglas mágicas, motor de juego (IA de mascotas,
// necesidades, monedas, partículas) y persistencia en localStorage.

import { create } from 'zustand'
import { toast } from 'sonner'
import {
  Particle,
  PetRuntime,
  PlayerAction,
  Rule,
  SavedProject,
  ShopItemId,
  SpecialKind,
  WorldObject,
} from './types'
import {
  PET_NAMES,
  STATS,
  catalogById,
  makeBlankProject,
  makeDemoProject,
  uid,
} from './catalog'
import { setMuted, sfx } from './sound'

const SAVE_KEY = 'emma-care-studio-v1'

const clamp = (v: number) => Math.max(0, Math.min(100, v))
const clampPct = (v: number) => Math.max(3, Math.min(97, v))
const rand = (a: number, b: number) => a + Math.random() * (b - a)

const isPetObj = (o: WorldObject) => catalogById[o.catalogId]?.kind === 'pet'

function findSpecial(objects: WorldObject[], special: SpecialKind) {
  return objects.find((o) => catalogById[o.catalogId]?.special === special)
}

function makeRuntime(): PetRuntime {
  return {
    stats: {
      felicidad: Math.round(rand(70, 85)),
      comida: Math.round(rand(55, 75)),
      energia: Math.round(rand(60, 85)),
      higiene: Math.round(rand(70, 90)),
      descanso: Math.round(rand(65, 85)),
    },
    state: 'idle',
    tx: 50,
    ty: 50,
    targetKind: 'random',
    wanderAt: 0,
    eatUntil: 0,
    facing: 1,
    sick: false,
    toyAt: 0,
    pairCd: {},
  }
}

interface StudioState {
  hydrated: boolean
  mode: 'edit' | 'play'
  objects: WorldObject[]
  rules: Rule[]
  selectedId: string | null
  coins: number
  muted: boolean
  /** runtime de mascotas (solo modo juego) */
  pets: Record<string, PetRuntime>
  particles: Particle[]
  ruleAcc: Record<string, number>
  actionCd: Record<string, number>
  lastBonusAt: number

  hydrate: () => void
  addObject: (catalogId: string, x?: number, y?: number) => void
  updateObject: (id: string, patch: Partial<WorldObject>) => void
  removeObject: (id: string) => void
  select: (id: string | null) => void
  startPlay: () => void
  stopPlay: () => void
  addRule: () => void
  updateRule: (id: string, patch: Partial<Rule>) => void
  removeRule: (id: string) => void
  saveProject: () => void
  exportProject: () => void
  newProject: () => void
  toggleMute: () => void
  buyShopItem: (itemId: ShopItemId) => void
  playerAction: (action: PlayerAction) => void
  moveTick: (dtMs: number) => void
  gameTick: () => void
  spawnParticles: (emoji: string, x: number, y: number, n?: number) => void
}

type StoreSet = (partial: Partial<StudioState>) => void
type StoreGet = () => StudioState

/** Aplica el efecto de una regla a una mascota (con partícula y sonido) */
function fireRule(set: StoreSet, get: StoreGet, rule: Rule, pet: WorldObject) {
  const s = get()
  const rt0 = s.pets[pet.id]
  if (!rt0) return
  const rt: PetRuntime = { ...rt0, stats: { ...rt0.stats } }
  const delta = rule.effect === 'aumentar' ? rule.amount : -rule.amount
  rt.stats[rule.stat] = clamp(rt.stats[rule.stat] + delta)
  set({ pets: { ...get().pets, [pet.id]: rt } })
  get().spawnParticles(delta > 0 ? STATS[rule.stat].emoji : '💨', pet.x, pet.y - 3, 1)
  sfx.pop()
}

export const useStudio = create<StudioState>((set, get) => {
  // Mundo de bienvenida (se reemplaza por el proyecto guardado al hidratar)
  const demo = makeDemoProject()

  return {
    hydrated: false,
    mode: 'edit',
    objects: demo.objects,
    rules: demo.rules,
    selectedId: null,
    coins: 0,
    muted: false,
    pets: {},
    particles: [],
    ruleAcc: {},
    actionCd: {},
    lastBonusAt: 0,

    hydrate: () => {
      if (get().hydrated) return
      let next: Partial<StudioState> = {}
      try {
        const raw = typeof window !== 'undefined' ? localStorage.getItem(SAVE_KEY) : null
        if (raw) {
          const data = JSON.parse(raw) as SavedProject
          if (data && data.version === 1 && Array.isArray(data.objects)) {
            next = {
              objects: data.objects.filter((o) => catalogById[o.catalogId]),
              rules: Array.isArray(data.rules) ? data.rules : [],
              coins: typeof data.coins === 'number' ? data.coins : 0,
            }
          }
        } else {
          setTimeout(() => {
            toast('👋 ¡Hola! Añade objetos, crea reglas mágicas y pulsa ▶️ ¡JUGAR!', {
              duration: 6000,
            })
          }, 700)
        }
      } catch {
        // datos corruptos: se ignora y se usa el demo
      }
      setMuted(get().muted)
      set({ ...next, hydrated: true })
    },

    addObject: (catalogId, x, y) => {
      const item = catalogById[catalogId]
      if (!item) return
      const s = get()
      const sameCount = s.objects.filter((o) => o.catalogId === catalogId).length
      let name = item.name
      if (item.kind === 'pet') {
        const names = PET_NAMES[catalogId] ?? [item.name]
        name = names[sameCount % names.length]
      } else if (sameCount > 0) {
        name = `${item.name} ${sameCount + 1}`
      }
      const obj: WorldObject = {
        id: uid(),
        catalogId,
        name,
        x: clampPct(x ?? rand(30, 70)),
        y: clampPct(y ?? rand(30, 70)),
        size: item.kind === 'pet' ? 1.3 : item.kind === 'home' ? 1.4 : 1.1,
        hue: 0,
        speed: item.kind === 'pet' ? 8 : undefined,
      }
      if (s.mode === 'play' && item.kind === 'pet') {
        set({ objects: [...s.objects, obj], pets: { ...s.pets, [obj.id]: makeRuntime() } })
      } else {
        set({
          objects: [...s.objects, obj],
          selectedId: s.mode === 'edit' ? obj.id : s.selectedId,
        })
      }
      sfx.pop()
      toast(`${item.emoji} ¡${name} se unió al mundo!`)
    },

    updateObject: (id, patch) => {
      set({ objects: get().objects.map((o) => (o.id === id ? { ...o, ...patch } : o)) })
    },

    removeObject: (id) => {
      const s = get()
      const obj = s.objects.find((o) => o.id === id)
      set({
        objects: s.objects.filter((o) => o.id !== id),
        selectedId: s.selectedId === id ? null : s.selectedId,
        pets: obj && isPetObj(obj) ? Object.fromEntries(Object.entries(s.pets).filter(([k]) => k !== id)) : s.pets,
      })
      sfx.click()
    },

    select: (id) => set({ selectedId: id }),

    startPlay: () => {
      const s = get()
      const pets: Record<string, PetRuntime> = {}
      for (const o of s.objects) {
        if (isPetObj(o)) pets[o.id] = makeRuntime()
      }
      set({
        mode: 'play',
        pets,
        particles: [],
        ruleAcc: {},
        actionCd: {},
        lastBonusAt: Date.now(),
        selectedId: null,
      })
      sfx.happy()
      const petCount = Object.keys(pets).length
      setTimeout(() => {
        toast(
          petCount
            ? '▶️ ¡A jugar! Toca una mascota para cuidarla 🐾'
            : '🏡 No hay mascotas: vuelve a ✏️ Editar y añade una',
          { duration: 4500 },
        )
      }, 350)
    },

    stopPlay: () =>
      set({ mode: 'edit', pets: {}, particles: [], selectedId: null }),

    addRule: () => {
      const s = get()
      const firstPet = s.objects.find(isPetObj)
      const firstTarget = s.objects.find((o) => !isPetObj(o))
      const rule: Rule = {
        id: uid(),
        trigger: 'cerca',
        petId: firstPet?.id ?? 'cualquiera',
        targetId: firstTarget?.id ?? 'cualquiera',
        intervalSec: 20,
        effect: 'aumentar',
        stat: 'felicidad',
        amount: 10,
      }
      set({ rules: [...s.rules, rule] })
      sfx.magic()
    },

    updateRule: (id, patch) =>
      set({ rules: get().rules.map((r) => (r.id === id ? { ...r, ...patch } : r)) }),

    removeRule: (id) => {
      set({ rules: get().rules.filter((r) => r.id !== id) })
      sfx.click()
    },

    saveProject: () => {
      const s = get()
      const data: SavedProject = {
        version: 1,
        objects: s.objects,
        rules: s.rules,
        coins: s.coins,
        savedAt: new Date().toISOString(),
      }
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(data))
        toast('💾 ¡Proyecto guardado!')
        sfx.magic()
      } catch {
        toast('😅 No se pudo guardar el proyecto')
      }
    },

    exportProject: () => {
      const s = get()
      const data: SavedProject = {
        version: 1,
        objects: s.objects,
        rules: s.rules,
        coins: s.coins,
        savedAt: new Date().toISOString(),
      }
      try {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'emma-care-proyecto.json'
        a.click()
        URL.revokeObjectURL(url)
        toast('⬇️ ¡Proyecto descargado en JSON!')
      } catch {
        toast('😅 No se pudo descargar')
      }
    },

    newProject: () => {
      const blank = makeBlankProject()
      set({
        objects: blank.objects,
        rules: blank.rules,
        coins: 0,
        selectedId: null,
        pets: {},
        particles: [],
        mode: 'edit',
      })
      toast('🆕 ¡Mundo nuevo! Construye tu juego ✨')
      sfx.magic()
    },

    toggleMute: () => {
      const next = !get().muted
      setMuted(next)
      set({ muted: next })
      if (!next) sfx.click()
    },

    buyShopItem: (itemId) => {
      const s = get()
      const prices: Record<ShopItemId, number> = { cat: 40, rabbit: 60, toy: 30, cake: 15 }
      const price = prices[itemId]
      if (s.coins < price) {
        toast(`🪙 Te faltan ${price - s.coins} monedas. ¡Cuida a tus mascotas!`)
        sfx.sad()
        return
      }
      if (itemId === 'cake') {
        const sel = s.objects.find((o) => o.id === s.selectedId && isPetObj(o))
        if (!sel) {
          toast('👆 Primero toca una mascota y luego compra el pastel')
          return
        }
        const rt0 = s.pets[sel.id]
        if (!rt0) return
        const rt: PetRuntime = {
          ...rt0,
          stats: { ...rt0.stats, felicidad: clamp(rt0.stats.felicidad + 25) },
        }
        set({ coins: s.coins - price, pets: { ...s.pets, [sel.id]: rt } })
        get().spawnParticles('🎂', sel.x, sel.y - 3, 3)
      } else if (itemId === 'toy') {
        const obj: WorldObject = {
          id: uid(),
          catalogId: 'toy',
          name: 'Juguete',
          x: rand(25, 75),
          y: rand(40, 75),
          size: 1,
          hue: Math.floor(rand(0, 6)) * 60,
          speed: undefined,
        }
        set({ coins: s.coins - price, objects: [...s.objects, obj] })
      } else {
        get().addObject(itemId, rand(35, 65), rand(50, 70))
        set({ coins: get().coins - price })
      }
      sfx.coin()
      toast(`✨ ¡Compra feliz! −${price} 🪙`)
    },

    playerAction: (action) => {
      const s = get()
      if (s.mode !== 'play') return
      const pet = s.objects.find((o) => o.id === s.selectedId && isPetObj(o))
      if (!pet) {
        toast('👆 Primero toca una mascota')
        return
      }
      const rt0 = s.pets[pet.id]
      if (!rt0) return
      const now = Date.now()
      const cdKey = `${pet.id}:${action}`
      if (now - (s.actionCd[cdKey] ?? 0) < 3500) {
        toast('⏳ ¡Un poquito de espera!')
        return
      }
      const rt: PetRuntime = { ...rt0, stats: { ...rt0.stats }, pairCd: { ...rt0.pairCd } }
      let coins = s.coins
      const actionCd = { ...s.actionCd, [cdKey]: now }

      switch (action) {
        case 'alimentar':
          rt.stats.comida = clamp(rt.stats.comida + 25)
          get().spawnParticles('🍖', pet.x, pet.y - 3, 2)
          sfx.eat()
          break
        case 'acariciar':
          rt.stats.felicidad = clamp(rt.stats.felicidad + 8)
          get().spawnParticles('❤️', pet.x, pet.y - 3, 2)
          sfx.happy()
          break
        case 'jugar':
          if (rt.stats.energia < 10) {
            toast(`⚡ ${pet.name} está muy cansado/a para jugar`)
            return
          }
          rt.stats.felicidad = clamp(rt.stats.felicidad + 15)
          rt.stats.energia = clamp(rt.stats.energia - 8)
          get().spawnParticles('🎾', pet.x, pet.y - 3, 2)
          sfx.happy()
          break
        case 'banar':
          rt.stats.higiene = clamp(rt.stats.higiene + 30)
          get().spawnParticles('🫧', pet.x, pet.y - 3, 3)
          sfx.magic()
          break
        case 'dormir':
          if (rt.state === 'sleep') {
            rt.state = 'idle'
            rt.wanderAt = now
            sfx.wake()
          } else {
            rt.state = 'sleep'
            sfx.click()
          }
          break
        case 'curar':
          if (!rt.sick) {
            toast(`😊 ${pet.name} está sano/a`)
            return
          }
          rt.sick = false
          rt.stats.felicidad = clamp(rt.stats.felicidad + 10)
          get().spawnParticles('💊', pet.x, pet.y - 3, 3)
          sfx.magic()
          coins += 6
          break
      }

      // Reglas del tipo "CUANDO la acaricies..."
      if (action === 'acariciar') {
        for (const rule of s.rules) {
          if (rule.trigger !== 'acariciar') continue
          if (rule.petId !== 'cualquiera' && rule.petId !== pet.id) continue
          const delta = rule.effect === 'aumentar' ? rule.amount : -rule.amount
          rt.stats[rule.stat] = clamp(rt.stats[rule.stat] + delta)
          get().spawnParticles(delta > 0 ? STATS[rule.stat].emoji : '💨', pet.x, pet.y - 5, 1)
        }
      }

      if (action !== 'dormir' && action !== 'curar' && !rt.sick) {
        const rewards: Record<string, number> = {
          alimentar: 3,
          acariciar: 2,
          jugar: 4,
          banar: 3,
        }
        coins += rewards[action] ?? 0
      }

      set({ pets: { ...s.pets, [pet.id]: rt }, coins, actionCd })
    },

    moveTick: (dtMs) => {
      const s = get()
      if (s.mode !== 'play') return
      const now = Date.now()
      const dt = Math.min(dtMs, 120) / 1000
      let moved = false
      const objects = s.objects.map((o) => ({ ...o }))
      const pets: Record<string, PetRuntime> = {}
      const petObjs = objects.filter(isPetObj)

      for (const obj of objects) {
        if (!isPetObj(obj)) continue
        const rt0 = s.pets[obj.id]
        if (!rt0) continue
        const rt: PetRuntime = { ...rt0, pairCd: { ...rt0.pairCd } }

        if (rt.state === 'sleep') {
          pets[obj.id] = rt
          continue
        }

        if (rt.state === 'eat') {
          if (now >= rt.eatUntil) {
            rt.stats = { ...rt.stats, comida: clamp(rt.stats.comida + 18) }
            rt.state = 'idle'
            rt.wanderAt = now + 1200
            get().spawnParticles('🍖', obj.x, obj.y - 3, 2)
            sfx.eat()
          }
          pets[obj.id] = rt
          continue
        }

        // decidir nuevo destino
        if (rt.state !== 'walk' && now >= rt.wanderAt) {
          const food = findSpecial(objects, 'food')
          const bed = findSpecial(objects, 'bed')
          if (rt.stats.comida < 50 && food) {
            rt.tx = food.x
            rt.ty = Math.min(95, food.y + 6)
            rt.targetKind = 'food'
            rt.state = 'walk'
          } else if (rt.stats.descanso < 32 && bed) {
            rt.tx = bed.x
            rt.ty = Math.min(95, bed.y + 6)
            rt.targetKind = 'bed'
            rt.state = 'walk'
          } else {
            rt.tx = rand(8, 92)
            rt.ty = rand(15, 92)
            rt.targetKind = 'random'
            rt.state = 'walk'
          }
        }

        if (rt.state === 'walk') {
          const dx = rt.tx - obj.x
          const dy = rt.ty - obj.y
          const dist = Math.hypot(dx, dy)
          const step = (obj.speed ?? 8) * dt
          if (dist <= Math.max(1.5, step)) {
            if (rt.targetKind === 'food') {
              rt.state = 'eat'
              rt.eatUntil = now + 1600
            } else if (rt.targetKind === 'bed') {
              rt.state = 'sleep'
            } else {
              rt.state = 'idle'
              rt.wanderAt = now + rand(1500, 4500)
            }
          } else {
            obj.x = clampPct(obj.x + (dx / dist) * step)
            obj.y = clampPct(obj.y + (dy / dist) * step)
            if (Math.abs(dx) > 0.5) rt.facing = dx > 0 ? 1 : -1
            moved = true
          }
        }

        // magia incorporada: juguete = alegría
        const toy = findSpecial(objects, 'toy')
        if (toy && now >= rt.toyAt && Math.hypot(toy.x - obj.x, toy.y - obj.y) < 9) {
          rt.stats = { ...rt.stats, felicidad: clamp(rt.stats.felicidad + 3) }
          rt.toyAt = now + 6000
          get().spawnParticles('✨', toy.x, toy.y - 3, 1)
        }

        // magia incorporada: bañera = higiene
        const bath = findSpecial(objects, 'bath')
        if (
          bath &&
          now >= (rt.pairCd['bath'] ?? 0) &&
          Math.hypot(bath.x - obj.x, bath.y - obj.y) < 9 &&
          rt.stats.higiene < 90
        ) {
          rt.stats = { ...rt.stats, higiene: clamp(rt.stats.higiene + 10) }
          rt.pairCd['bath'] = now + 8000
          get().spawnParticles('🫧', bath.x, bath.y - 3, 2)
        }

        pets[obj.id] = rt
      }

      // reglas del tipo "CUANDO se acerque a..."
      const fired: Array<[Rule, WorldObject]> = []
      for (const rule of s.rules) {
        if (rule.trigger !== 'cerca') continue
        const petTargets =
          rule.petId === 'cualquiera' ? petObjs : petObjs.filter((o) => o.id === rule.petId)
        const objTargets =
          rule.targetId === 'cualquiera'
            ? objects.filter((o) => !isPetObj(o))
            : objects.filter((o) => o.id === rule.targetId && !isPetObj(o))
        for (const pet of petTargets) {
          const rt = pets[pet.id]
          if (!rt) continue
          for (const target of objTargets) {
            const key = `${rule.id}:${pet.id}:${target.id}`
            if (now - (rt.pairCd[key] ?? 0) < 4000) continue
            if (Math.hypot(target.x - pet.x, target.y - pet.y) < 9) {
              rt.pairCd[key] = now
              fired.push([rule, pet])
              break
            }
          }
        }
      }

      if (moved) set({ objects, pets })
      else set({ pets })
      for (const [rule, pet] of fired) fireRule(set, get, rule, pet)
    },

    gameTick: () => {
      const s = get()
      if (s.mode !== 'play') return
      const now = Date.now()
      const pets: Record<string, PetRuntime> = {}
      let coins = s.coins
      let lastBonusAt = s.lastBonusAt

      for (const obj of s.objects) {
        if (!isPetObj(obj)) continue
        const rt0 = s.pets[obj.id]
        if (!rt0) continue
        const rt: PetRuntime = { ...rt0, stats: { ...rt0.stats } }

        if (rt.state === 'sleep') {
          rt.stats.descanso = clamp(rt.stats.descanso + 2.5)
          rt.stats.energia = clamp(rt.stats.energia + 1)
          rt.stats.comida = clamp(rt.stats.comida - 0.15)
          rt.stats.felicidad = clamp(rt.stats.felicidad - 0.05)
          if (rt.stats.descanso >= 92) {
            rt.state = 'idle'
            rt.wanderAt = now
            sfx.wake()
          }
          if (Math.random() < 0.35) get().spawnParticles('💤', obj.x, obj.y - 5, 1)
        } else {
          rt.stats.comida = clamp(rt.stats.comida - 0.7)
          rt.stats.energia = clamp(rt.stats.energia - 0.4)
          rt.stats.higiene = clamp(rt.stats.higiene - 0.35)
          rt.stats.descanso = clamp(rt.stats.descanso - 0.45)
          let decay = 0.25
          if (rt.stats.comida < 20) decay += 0.8
          if (rt.stats.higiene < 20) decay += 0.5
          if (rt.stats.descanso < 20) decay += 0.4
          if (rt.sick) decay += 0.8
          rt.stats.felicidad = clamp(rt.stats.felicidad - decay)
        }

        if (!rt.sick && (rt.stats.comida <= 0.5 || rt.stats.higiene <= 0.5)) {
          rt.sick = true
          get().spawnParticles('🤒', obj.x, obj.y - 5, 2)
          toast(`🤒 ¡${obj.name} se puso enfermo/a! Tócalo/a y usa 🏥 Curar`, { duration: 5000 })
          sfx.sad()
        }

        pets[obj.id] = rt
      }

      // bonus: todas las mascotas felices
      const allPets = Object.values(pets)
      if (
        allPets.length > 0 &&
        allPets.every((rt) => rt.stats.felicidad >= 80) &&
        now - lastBonusAt > 12000
      ) {
        coins += 2
        lastBonusAt = now
        toast('🎉 ¡Todas las mascotas están felices! +2 🪙')
        sfx.coin()
      }

      set({ pets, coins, lastBonusAt })

      // reglas del tipo "CADA X segundos..."
      const ruleAcc = { ...s.ruleAcc }
      let accChanged = false
      for (const rule of s.rules) {
        if (rule.trigger !== 'cada') continue
        const acc = (ruleAcc[rule.id] ?? 0) + 1
        if (acc >= Math.max(5, rule.intervalSec)) {
          ruleAcc[rule.id] = 0
          accChanged = true
          const targets =
            rule.petId === 'cualquiera'
              ? s.objects.filter(isPetObj)
              : s.objects.filter((o) => o.id === rule.petId)
          for (const pet of targets) fireRule(set, get, rule, pet)
        } else {
          ruleAcc[rule.id] = acc
          accChanged = true
        }
      }
      if (accChanged) set({ ruleAcc })
    },

    spawnParticles: (emoji, x, y, n = 1) => {
      const parts: Particle[] = []
      for (let i = 0; i < n; i++) {
        parts.push({
          id: uid() + i,
          emoji,
          x: clampPct(x + rand(-4, 4)),
          y: clampPct(y + rand(-3, 3)),
        })
      }
      set({ particles: [...get().particles, ...parts] })
      const ids = parts.map((p) => p.id)
      setTimeout(() => {
        set({ particles: get().particles.filter((p) => !ids.includes(p.id)) })
      }, 1300)
    },
  }
})
