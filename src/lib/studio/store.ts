// Emma Care Studio — store principal (zustand)
// Incluye: estado del editor, mundos/niveles con desbloqueo, reglas mágicas,
// motor de juego (IA de mascotas, necesidades, monedas, partículas, VOCES)
// y persistencia en localStorage.

import { create } from 'zustand'
import { toast } from 'sonner'
import {
  Ball,
  Command,
  EventKind,
  GameEvent,
  LevelId,
  Mood,
  Particle,
  PetRuntime,
  PlayerAction,
  Rule,
  SavedProject,
  ShopItemId,
  SpecialKind,
  StatKey,
  WorldObject,
} from './types'
import {
  LEVELS,
  PET_NAMES,
  RIVALS,
  STATS,
  VOICES,
  catalogById,
  makeBlankProject,
  makeDemoProject,
  makeLevelStarters,
  uid,
} from './catalog'
import { petVoice, setMuted, sfx } from './sound'

const SAVE_KEY = 'emma-care-studio-v1'

const clamp = (v: number) => Math.max(0, Math.min(100, v))
const clampPct = (v: number) => Math.max(3, Math.min(97, v))
const rand = (a: number, b: number) => a + Math.random() * (b - a)

/** duración de una persecución (ms): ¡ahora cruzan TODA la pantalla! */
const CHASE_MS = 7800

/** vibra el teléfono (Android Chrome; en iPhone no está disponible y no pasa nada) */
function vib(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern)
    } catch {
      // algunos navegadores lo bloquean sin interacción: no pasa nada
    }
  }
}

/** catálogo de sorpresas aleatorias */
const EVENT_INFO: Record<EventKind, { emoji: string; dur: number; msg: string }> = {
  lluvia: {
    emoji: '🌧️',
    dur: 30000,
    msg: '🌧️ ¡Está lloviendo! Lleva a tus mascotas a un refugio (🏠 ⛺ 🌳 ⛱️)',
  },
  escasez: {
    emoji: '🥣',
    dur: 20000,
    msg: '🥣 ¡Se acabó la comida! Sus barras de comida bajan más rápido',
  },
  mariposa: {
    emoji: '🦋',
    dur: 16000,
    msg: '🦋 ¡Una mariposa visita el mundo! Las mascotas la siguen encantadas',
  },
  regalo: {
    emoji: '🎁',
    dur: 25000,
    msg: '🎁 ¡Ha aparecido una caja sorpresa! Tócala antes de que se vaya',
  },
}

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
    lvl: 1,
    xp: 0,
    hideSpot: null,
    wanderAt: 0,
    eatUntil: 0,
    drinkUntil: 0,
    facing: 1,
    sick: false,
    toyAt: 0,
    voiceAt: 0,
    pairCd: {},
    chaseUntil: 0,
    chaseRole: null,
    chasePartner: null,
    fleeAt: 0,
    hiding: null,
    onTopOf: null,
    obey: null,
  }
}

/** Ánimo actual de una mascota: decide su voz y su cara */
function moodOf(rt: PetRuntime): Mood {
  if (rt.sick) return 'triste'
  if (rt.chaseUntil > Date.now()) return rt.chaseRole === 'chase' ? 'enojado' : 'miedo'
  if (rt.stats.comida < 30) return 'hambre'
  if (rt.stats.descanso < 30) return 'sueno'
  if (rt.stats.felicidad < 25) return 'triste'
  if (rt.stats.felicidad >= 85) return 'feliz'
  return 'normal'
}

/** Suma XP a la mascota. Si sube de nivel devuelve el nuevo nivel (0 = no subió).
 *  Al subir: fiesta, +6 en todas sus barras y +10 monedas (las suma el llamador). */
function gainXp(rt: PetRuntime, amount: number): number {
  if (rt.lvl >= 9) return 0
  rt.xp += amount
  if (rt.xp < 100) return 0
  rt.xp -= 100
  rt.lvl += 1
  for (const k of Object.keys(rt.stats) as StatKey[]) rt.stats[k] = clamp(rt.stats[k] + 6)
  return rt.lvl
}

/** Fiesta de subida de nivel (partículas + sonido + voz + aviso) */
function celebrateLevel(set: StoreSet, get: StoreGet, pet: WorldObject, lvl: number) {
  get().spawnParticles('🎉', pet.x, pet.y - 7, 3)
  get().spawnParticles('⭐', pet.x, pet.y - 3, 2)
  sfx.unlock()
  speak(set, get, pet, 'feliz')
  toast(`🌟 ¡¡${pet.name} subió al nivel ${lvl}!! +10 🪙 y barras felices`, { duration: 3500 })
}

/** busca el escondite o trepadera más cercano (para escapar de un rival) */
function nearestEscapeSpot(levelObjs: WorldObject[], from: WorldObject) {
  let best: WorldObject | null = null
  let bestD = 38
  for (const o of levelObjs) {
    if (isPetObj(o)) continue
    const it = catalogById[o.catalogId]
    if (!it || (!it.hide && !it.climb)) continue
    const d = Math.hypot(o.x - from.x, o.y - from.y)
    if (d < bestD) {
      bestD = d
      best = o
    }
  }
  return best
}

export type MobileTab = 'objetos' | 'ajustes' | 'reglas'

interface StudioState {
  hydrated: boolean
  mode: 'edit' | 'play'
  objects: WorldObject[]
  rules: Rule[]
  selectedId: string | null
  /** pestaña activa del editor en móvil (pantallas < lg) */
  mobileTab: MobileTab
  coins: number
  muted: boolean
  /** mundo actual y mundos desbloqueados */
  currentLevel: LevelId
  unlockedLevels: LevelId[]
  /** runtime de mascotas (solo modo juego) */
  pets: Record<string, PetRuntime>
  particles: Particle[]
  /** globos de voz activos por mascota (¡Guau!, ¡Miau...) */
  say: Record<string, SayBubbleText>
  ruleAcc: Record<string, number>
  actionCd: Record<string, number>
  lastBonusAt: number
  // ===== caos divertido =====
  /** sorpresa activa (lluvia, escasez, mariposa, regalo) */
  event: GameEvent | null
  /** momento del próximo evento sorpresa */
  nextEventAt: number
  /** pelota en juego (la lanzó el dueño) */
  ball: Ball | null
  /** modo lanzar pelota: el próximo toque en el mundo la lanza */
  ballPending: boolean
  /** mientras now < shakeUntil, el lienzo tiembla (¡persecuciones!) */
  shakeUntil: number
  // ===== autoguardado =====
  /** momento del último autoguardado (0 = aún no) — para el indicador ✓ */
  lastSavedAt: number

  hydrate: () => void
  addObject: (catalogId: string, x?: number, y?: number) => void
  updateObject: (id: string, patch: Partial<WorldObject>) => void
  removeObject: (id: string) => void
  select: (id: string | null) => void
  /** selecciona y (en móvil) salta a la pestaña de ajustes */
  selectForEdit: (id: string) => void
  setMobileTab: (tab: MobileTab) => void
  /** viaja a un mundo; si está cerrado, intenta desbloquearlo con monedas */
  setLevel: (id: LevelId) => void
  startPlay: () => void
  stopPlay: () => void
  addRule: () => void
  updateRule: (id: string, patch: Partial<Rule>) => void
  removeRule: (id: string) => void
  saveProject: () => void
  /** autoguardado silencioso: igual que guardar pero sin toast (lo dispara el juego) */
  saveSilent: () => void
  exportProject: () => void
  newProject: () => void
  toggleMute: () => void
  buyShopItem: (itemId: ShopItemId) => void
  playerAction: (action: PlayerAction) => void
  /** acariciar con el dedo: frotar la mascota en pantalla */
  petPet: (id: string) => void
  /** dar una orden de obediencia a la mascota seleccionada */
  giveCommand: (cmd: Command) => void
  /** el dueño toca la pantalla: ¡se acaban las persecuciones! Devuelve true si calmió algo */
  calmAll: (x: number, y: number) => boolean
  /** activar/desactivar el modo lanzar pelota */
  toggleBallMode: () => void
  /** lanzar la pelota a un punto del mundo */
  throwBallAt: (x: number, y: number) => void
  /** abrir la caja sorpresa (evento regalo) */
  claimGift: () => void
  moveTick: (dtMs: number) => void
  gameTick: () => void
  spawnParticles: (emoji: string, x: number, y: number, n?: number) => void
}

/** texto del globo de voz */
type SayBubbleText = { text: string; until: number }

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

/** Haz que una mascota "hable": sonido de su especie + globo con la onomatopeya */
function speak(set: StoreSet, get: StoreGet, pet: WorldObject, mood: Mood) {
  petVoice(pet.catalogId, mood)
  const text = VOICES[pet.catalogId]?.[mood]
  if (!text) return
  set({ say: { ...get().say, [pet.id]: { text, until: Date.now() + 2400 } } })
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
    mobileTab: 'objetos',
    coins: 0,
    muted: false,
    currentLevel: 'jardin',
    unlockedLevels: ['jardin'],
    pets: {},
    particles: [],
    say: {},
    ruleAcc: {},
    actionCd: {},
    lastBonusAt: 0,
    event: null,
    nextEventAt: 0,
    ball: null,
    ballPending: false,
    shakeUntil: 0,
    lastSavedAt: 0,

    hydrate: () => {
      if (get().hydrated) return
      let next: Partial<StudioState> = {}
      try {
        const raw = typeof window !== 'undefined' ? localStorage.getItem(SAVE_KEY) : null
        if (raw) {
          const data = JSON.parse(raw) as SavedProject
          const valid = data && Array.isArray(data.objects)
          if (valid) {
            // migración v1 → v2: los objetos sin mundo van al jardín
            const objects = data.objects
              .filter((o) => catalogById[o.catalogId])
              .map((o) => ({ ...o, level: o.level ?? 'jardin' }))
            const unlocked = (data.unlockedLevels ?? ['jardin']).filter((id) =>
              LEVELS.some((l) => l.id === id),
            )
            next = {
              objects,
              rules: Array.isArray(data.rules) ? data.rules : [],
              coins: typeof data.coins === 'number' ? data.coins : 0,
              unlockedLevels: unlocked.length ? unlocked : ['jardin'],
              currentLevel:
                data.currentLevel && unlocked.includes(data.currentLevel)
                  ? data.currentLevel
                  : 'jardin',
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
        level: s.currentLevel,
      }
      if (s.mode === 'play' && item.kind === 'pet') {
        const rt = makeRuntime()
        rt.voiceAt = Date.now() + rand(1200, 4000)
        set({ objects: [...s.objects, obj], pets: { ...s.pets, [obj.id]: rt } })
      } else {
        set({
          objects: [...s.objects, obj],
          selectedId: s.mode === 'edit' ? obj.id : s.selectedId,
        })
      }
      sfx.pop()
      toast(`${item.emoji} ¡${name} se unió al mundo!`)
      if (item.kind === 'pet') {
        // la mascota recién llegada saluda con su voz
        speak(set, get, obj, 'feliz')
      }
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
        pets:
          obj && isPetObj(obj)
            ? Object.fromEntries(Object.entries(s.pets).filter(([k]) => k !== id))
            : s.pets,
      })
      sfx.click()
    },

    select: (id) => set({ selectedId: id }),

    selectForEdit: (id) => set({ selectedId: id, mobileTab: 'ajustes' }),

    setMobileTab: (tab) => set({ mobileTab: tab }),

    setLevel: (id) => {
      const s = get()
      const def = LEVELS.find((l) => l.id === id)
      if (!def) return
      if (s.unlockedLevels.includes(id)) {
        if (s.currentLevel === id) return
        set({ currentLevel: id, selectedId: null, say: {} })
        sfx.pop()
        toast(`${def.emoji} ¡Bienvenido/a a ${def.name}!`)
        return
      }
      if (s.coins < def.cost) {
        toast(`🔒 Te faltan ${def.cost - s.coins} 🪙 para abrir ${def.name}. ¡Cuida mascotas!`)
        sfx.sad()
        return
      }
      const starters = makeLevelStarters(id)
      set({
        coins: s.coins - def.cost,
        unlockedLevels: [...s.unlockedLevels, id],
        currentLevel: id,
        objects: [...s.objects, ...starters],
        selectedId: null,
        say: {},
      })
      sfx.unlock()
      get().spawnParticles('🎉', 50, 28, 2)
      get().spawnParticles('✨', 38, 45, 2)
      get().spawnParticles('⭐', 62, 45, 2)
      toast(`🎉 ¡Nuevo mundo desbloqueado: ${def.emoji} ${def.name}!`, { duration: 5000 })
    },

    startPlay: () => {
      const s = get()
      const now = Date.now()
      const pets: Record<string, PetRuntime> = {}
      for (const o of s.objects) {
        if (isPetObj(o)) {
          const rt = makeRuntime()
          // cada mascota empieza a "hablar" en un momento distinto
          rt.voiceAt = now + rand(1200, 6000)
          pets[o.id] = rt
        }
      }
      set({
        mode: 'play',
        pets,
        particles: [],
        say: {},
        ruleAcc: {},
        actionCd: {},
        lastBonusAt: now,
        event: null,
        nextEventAt: now + rand(35000, 60000),
        ball: null,
        ballPending: false,
        shakeUntil: 0,
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
      set({
        mode: 'edit',
        pets: {},
        particles: [],
        say: {},
        selectedId: null,
        event: null,
        ball: null,
        ballPending: false,
        shakeUntil: 0,
      }),

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
        version: 2,
        objects: s.objects,
        rules: s.rules,
        coins: s.coins,
        savedAt: new Date().toISOString(),
        unlockedLevels: s.unlockedLevels,
        currentLevel: s.currentLevel,
      }
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(data))
        toast('💾 ¡Proyecto guardado!')
        sfx.magic()
      } catch {
        toast('😅 No se pudo guardar el proyecto')
      }
    },

    saveSilent: () => {
      const s = get()
      const data: SavedProject = {
        version: 2,
        objects: s.objects,
        rules: s.rules,
        coins: s.coins,
        savedAt: new Date().toISOString(),
        unlockedLevels: s.unlockedLevels,
        currentLevel: s.currentLevel,
      }
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(data))
        set({ lastSavedAt: Date.now() })
      } catch {
        // almacenamiento lleno o bloqueado: se reintenta en el próximo cambio
      }
    },

    exportProject: () => {
      const s = get()
      const data: SavedProject = {
        version: 2,
        objects: s.objects,
        rules: s.rules,
        coins: s.coins,
        savedAt: new Date().toISOString(),
        unlockedLevels: s.unlockedLevels,
        currentLevel: s.currentLevel,
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
        say: {},
        mode: 'edit',
        currentLevel: 'jardin',
        unlockedLevels: ['jardin'],
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
      const prices: Record<ShopItemId, number> = {
        cake: 15,
        toy: 30,
        mouse: 20,
        bird: 30,
        cat: 40,
        chicken: 45,
        rabbit: 60,
        hamster: 55,
        duck: 70,
        fox: 80,
        pig: 90,
        monkey: 100,
        panda: 120,
        turtle: 110,
        bear: 140,
        lion: 180,
      }
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
        speak(set, get, sel, 'feliz')
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
          level: s.currentLevel,
        }
        set({ coins: s.coins - price, objects: [...s.objects, obj] })
      } else {
        // adoptar mascota nueva
        get().addObject(itemId, rand(35, 65), rand(50, 70))
        set({ coins: get().coins - price })
      }
      sfx.coin()
      if (itemId !== 'cake') toast(`✨ ¡Compra feliz! −${price} 🪙`)
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

      // feedback de voz según la acción
      if (action === 'dormir') {
        if (rt.state === 'sleep') speak(set, get, pet, 'sueno')
        else speak(set, get, pet, 'normal')
      } else if (action === 'curar') {
        speak(set, get, pet, 'feliz')
      } else {
        speak(set, get, pet, 'feliz')
      }

      // cada cuidado bien hecho da experiencia: ¡así sube de nivel!
      const xpForAction: Partial<Record<PlayerAction, number>> = {
        alimentar: 5,
        acariciar: 4,
        jugar: 6,
        banar: 5,
        curar: 7,
      }
      const xpGain = xpForAction[action]
      if (xpGain) {
        const lvAct = gainXp(rt, xpGain)
        if (lvAct) {
          coins += 10
          celebrateLevel(set, get, pet, lvAct)
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

    /** acariciar con el dedo: frotar la mascota en la pantalla */
    petPet: (id) => {
      const s = get()
      if (s.mode !== 'play') return
      const pet = s.objects.find((o) => o.id === id && isPetObj(o))
      if (!pet) return
      const rt0 = s.pets[id]
      if (!rt0) return
      const now = Date.now()
      if (now - (s.actionCd[`${id}:caricia`] ?? 0) < 3000) return
      const rt: PetRuntime = { ...rt0, stats: { ...rt0.stats } }
      rt.stats.felicidad = clamp(rt.stats.felicidad + 7)
      // caricia con el dedo también da experiencia
      const lvPet = gainXp(rt, 4)
      let coins = s.coins
      if (lvPet) {
        coins += 10
        celebrateLevel(set, get, pet, lvPet)
      }
      set({
        pets: { ...s.pets, [id]: rt },
        actionCd: { ...s.actionCd, [`${id}:caricia`]: now },
        ...(coins !== s.coins ? { coins } : {}),
      })
      get().spawnParticles('❤️', pet.x, pet.y - 3, 2)
      get().spawnParticles('✨', pet.x, pet.y - 1, 1)
      sfx.happy()
      speak(set, get, pet, 'feliz')
      // reglas del tipo "CUANDO la acaricies..."
      for (const rule of s.rules) {
        if (rule.trigger !== 'acariciar') continue
        if (rule.petId !== 'cualquiera' && rule.petId !== pet.id) continue
        const cur = get().pets[pet.id]
        if (!cur) continue
        const delta = rule.effect === 'aumentar' ? rule.amount : -rule.amount
        set({
          pets: {
            ...get().pets,
            [pet.id]: {
              ...cur,
              stats: { ...cur.stats, [rule.stat]: clamp(cur.stats[rule.stat] + delta) },
            },
          },
        })
        get().spawnParticles(delta > 0 ? STATS[rule.stat].emoji : '💨', pet.x, pet.y - 5, 1)
      }
    },

    /** dar una orden al dueño: ¡sentado! ¡quieto! ¡ven! (premio por obediencia) */
    giveCommand: (cmd) => {
      const s = get()
      if (s.mode !== 'play') return
      const pet = s.objects.find((o) => o.id === s.selectedId && isPetObj(o))
      if (!pet) {
        toast('👆 Primero toca una mascota para darle la orden')
        return
      }
      const rt0 = s.pets[pet.id]
      if (!rt0) return
      const now = Date.now()
      const cdKey = `${pet.id}:cmd`
      if (now - (s.actionCd[cdKey] ?? 0) < 2500) {
        toast('⏳ ¡Un poquito de espera!')
        return
      }
      const rt: PetRuntime = { ...rt0, stats: { ...rt0.stats }, pairCd: { ...rt0.pairCd } }
      let coins = s.coins
      const actionCd = { ...s.actionCd, [cdKey]: now }
      const newPets = { ...s.pets }

      // ¡la obediencia salva! si lo están persiguiendo, se acaba la persecución
      let stoppedChase = false
      if (rt.chaseUntil > now && rt.chasePartner) {
        stoppedChase = true
        const partner = s.objects.find((o) => o.id === rt.chasePartner)
        const prt = partner ? s.pets[partner.id] : null
        rt.chaseUntil = 0
        rt.chaseRole = null
        rt.chasePartner = null
        rt.hiding = null
        rt.onTopOf = null
        if (partner && prt) {
          newPets[partner.id] = {
            ...prt,
            chaseUntil: 0,
            chaseRole: null,
            chasePartner: null,
            pairCd: {
              ...prt.pairCd,
              [`rival:${partner.id}:${pet.id}`]: now,
            },
          }
          speak(set, get, partner, 'triste')
        }
      }

      rt.obey = {
        cmd,
        until: now + (cmd === 'sit' ? 6000 : cmd === 'stay' ? 8000 : cmd === 'hide' ? 7000 : 5000),
      }
      rt.state = 'idle'
      rt.wanderAt = now + 10000

      const cmdMsg =
        cmd === 'sit'
          ? '🪑 ¡Sentado!'
          : cmd === 'stay'
            ? '✋ ¡Quieto!'
            : cmd === 'hide'
              ? '🙈 ¡Escondeos!'
              : '👉 ¡Ven aquí!'
      get().spawnParticles(
        cmd === 'sit' ? '🪑' : cmd === 'stay' ? '✋' : cmd === 'hide' ? '🙈' : '👉',
        pet.x,
        pet.y - 4,
        1,
      )

      // premio por buen comportamiento (+XP: ¡así sube de nivel!)
      if (!rt.sick) {
        coins += 2
        const lv = gainXp(rt, 6)
        if (lv) {
          coins += 10
          celebrateLevel(set, get, pet, lv)
        }
        if (Math.random() < 0.45) get().spawnParticles('🦴', pet.x, pet.y - 2, 1)
      }
      speak(set, get, pet, 'normal')
      sfx.treat()
      toast(
        `${cmdMsg} — ¡${pet.name} obedeció! +2 🪙${stoppedChase ? ' 😎 ¡escapó del rival!' : ''}`,
        { duration: 3000 },
      )
      set({ pets: { ...newPets, [pet.id]: rt }, coins, actionCd })
    },

    toggleBallMode: () => {
      const next = !get().ballPending
      set({ ballPending: next })
      if (next) {
        toast('🎾 ¡Toca el mundo donde quieras lanzar la pelota!', { duration: 3500 })
        sfx.click()
      }
    },

    throwBallAt: (x, y) => {
      const s = get()
      if (s.mode !== 'play') return
      const ball: Ball = { id: uid(), x, y, until: Date.now() + 12000 }
      set({ ball, ballPending: false })
      sfx.whoosh()
      setTimeout(() => sfx.boing(), 350)
      get().spawnParticles('💨', x, y - 6, 1)
    },

    claimGift: () => {
      const s = get()
      if (s.mode !== 'play' || !s.event || s.event.kind !== 'regalo') return
      const now = Date.now()
      const gx = s.event.x ?? 50
      const gy = s.event.y ?? 50
      const roll = Math.random()
      if (roll < 0.55) {
        const prize = Math.floor(rand(8, 16))
        set({ coins: s.coins + prize, event: { ...s.event, until: now } })
        get().spawnParticles('🪙', gx, gy - 4, 4)
        toast(`🎁 ¡${prize} monedas de sorpresa! +${prize} 🪙`)
        sfx.coin()
      } else if (roll < 0.85) {
        const pets = { ...s.pets }
        for (const id of Object.keys(pets)) {
          const rt = pets[id]
          pets[id] = {
            ...rt,
            stats: { ...rt.stats, felicidad: clamp(rt.stats.felicidad + 15) },
          }
        }
        set({ pets, event: { ...s.event, until: now } })
        get().spawnParticles('🎉', gx, gy - 4, 4)
        toast('🎁 ¡FIESTA SORPRESA! Todas las mascotas felices ❤️')
        sfx.unlock()
      } else {
        set({ coins: s.coins + 25, event: { ...s.event, until: now } })
        get().spawnParticles('💎', gx, gy - 4, 4)
        toast('🎁 ¡Un diamante escondido! +25 🪙')
        sfx.coin()
      }
      vib(80)
    },

    /** El dueño toca la pantalla: ¡aplauso calmante! Termina TODAS las persecuciones */
    calmAll: (x, y) => {
      const s = get()
      if (s.mode !== 'play') return false
      const now = Date.now()
      const chasing = Object.values(s.pets).filter((rt) => rt.chaseUntil > now)
      if (!chasing.length) return false
      const pets = { ...s.pets }
      for (const rt of chasing) {
        // cooldown para que el par no vuelva a pelear enseguida
        if (rt.chasePartner) {
          const predId = rt.chaseRole === 'chase' ? rt.id : rt.chasePartner
          const preyId = rt.chaseRole === 'chase' ? rt.chasePartner : rt.id
          const prt = pets[predId]
          if (prt)
            pets[predId] = {
              ...prt,
              pairCd: { ...prt.pairCd, [`rival:${predId}:${preyId}`]: now },
            }
        }
        // chaseUntil = ahora → el motor la termina con su lógica normal (premios incluidos)
        const cur = pets[rt.id]
        if (cur) pets[rt.id] = { ...cur, chaseUntil: now }
      }
      set({ pets, shakeUntil: 0 })
      get().spawnParticles('👏', x, y, 2)
      get().spawnParticles('💙', x, y - 5, 1)
      sfx.happy()
      toast('👏 ¡Aplaudiste fuerte! Todos se calmaron 💙', { duration: 2600 })
      return true
    },

    moveTick: (dtMs) => {
      const s = get()
      if (s.mode !== 'play') return
      const now = Date.now()
      const dt = Math.min(dtMs, 120) / 1000
      let moved = false
      let coins = s.coins
      let ballCaught = false
      let shakeUntil = s.shakeUntil
      const objects = s.objects.map((o) => ({ ...o }))
      const pets: Record<string, PetRuntime> = { ...s.pets }
      // solo se simula el mundo visible; las mascotas de otros mundos descansan
      const levelObjs = objects.filter((o) => o.level === s.currentLevel)
      const petObjs = levelObjs.filter(isPetObj)
      const food = findSpecial(levelObjs, 'food')
      const bed = findSpecial(levelObjs, 'bed')
      const toy = findSpecial(levelObjs, 'toy')
      const bath = findSpecial(levelObjs, 'bath')
      const water = findSpecial(levelObjs, 'water')
      const raining = s.event?.kind === 'lluvia' && s.event.until > now
      const shelters = raining
        ? levelObjs.filter((o) => catalogById[o.catalogId]?.shelter)
        : []
      const ball = s.ball && s.ball.until > now ? s.ball : null

      for (const obj of petObjs) {
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
            // comer solito en el comedero también da experiencia
            const lvEat = gainXp(rt, 4)
            if (lvEat) {
              coins += 10
              celebrateLevel(set, get, obj, lvEat)
            }
          }
          pets[obj.id] = rt
          continue
        }

        // ===== BEBER AGUA: recupera energía (¡se cansan corriendo!) =====
        if (rt.state === 'drink') {
          if (now >= rt.drinkUntil) {
            rt.stats = {
              ...rt.stats,
              energia: clamp(rt.stats.energia + 22),
              felicidad: clamp(rt.stats.felicidad + 4),
            }
            rt.state = 'idle'
            rt.wanderAt = now + 1200
            get().spawnParticles('💧', obj.x, obj.y - 3, 2)
            get().spawnParticles('⚡', obj.x, obj.y - 5, 1)
            sfx.pop()
            const lvDrink = gainXp(rt, 4)
            if (lvDrink) {
              coins += 10
              celebrateLevel(set, get, obj, lvDrink)
            }
          }
          pets[obj.id] = rt
          continue
        }

        // ===== ¿acaba de terminar una persecución? =====
        if (rt.chaseUntil && now >= rt.chaseUntil) {
          const escaped = rt.chaseRole === 'flee' && (rt.hiding || rt.onTopOf)
          rt.chaseUntil = 0
          rt.chaseRole = null
          rt.chasePartner = null
          rt.hiding = null
          rt.onTopOf = null
          rt.stats.energia = clamp(rt.stats.energia - 6)
          rt.wanderAt = now + 1500
          // correr cansa: XP por el esfuerzo (más si se escapó)
          const lvRun = gainXp(rt, escaped ? 8 : 4)
          if (lvRun) {
            coins += 10
            celebrateLevel(set, get, obj, lvRun)
          }
          if (escaped && now - (rt.pairCd['escapePrize'] ?? 0) > 25000) {
            rt.pairCd['escapePrize'] = now
            coins += 2
            get().spawnParticles('⭐', obj.x, obj.y - 5, 2)
            toast(`😆 ¡${obj.name} escapó de la persecución! +2 🪙`, { duration: 2500 })
            sfx.treat()
            speak(set, get, obj, 'feliz')
          }
        }

        // ===== ÓRDENES DEL DUEÑO: ¡sentado, quieto, ven, escondeos! =====
        if (rt.obey && now >= rt.obey.until) {
          // si se escondió por la orden, al expirar sale del escondite
          if (rt.hideSpot) {
            rt.hiding = null
            rt.hideSpot = null
            rt.wanderAt = now
          }
          rt.obey = null
        }
        if (rt.obey) {
          if (rt.obey.cmd === 'come') {
            const dx = 50 - obj.x
            const dy = 84 - obj.y
            const dist = Math.hypot(dx, dy)
            const step = (obj.speed ?? 8) * 1.7 * dt
            if (dist <= Math.max(1.5, step)) {
              rt.state = 'idle'
              rt.wanderAt = now + 2500
              get().spawnParticles('⭐', obj.x, obj.y - 4, 1)
            } else {
              obj.x = clampPct(obj.x + (dx / dist) * step)
              obj.y = clampPct(obj.y + (dy / dist) * step)
              if (Math.abs(dx) > 0.5) rt.facing = dx > 0 ? 1 : -1
              rt.state = 'walk'
              moved = true
            }
          } else if (rt.obey.cmd === 'hide') {
            // ¡Escondeos!: corre al escondite/trepadera más cercano y se oculta
            if (!rt.hideSpot) {
              const spot = nearestEscapeSpot(levelObjs, obj)
              if (spot) {
                rt.hideSpot = spot.id
                rt.tx = spot.x
                rt.ty = clampPct(spot.y + 4)
              } else {
                rt.hideSpot = 'agachado' // sin escondite cerca: se agacha en su sitio
              }
            }
            const spotObj =
              rt.hideSpot && rt.hideSpot !== 'agachado'
                ? levelObjs.find((o) => o.id === rt.hideSpot)
                : null
            if (spotObj) {
              const dx = spotObj.x - obj.x
              const dy = spotObj.y - obj.y
              const dist = Math.hypot(dx, dy)
              const step = (obj.speed ?? 8) * 1.9 * dt
              if (dist > 2.5) {
                obj.x = clampPct(obj.x + (dx / dist) * step)
                obj.y = clampPct(obj.y + (dy / dist) * step)
                if (Math.abs(dx) > 0.5) rt.facing = dx > 0 ? 1 : -1
                rt.state = 'walk'
                moved = true
              } else {
                if (!rt.hiding) sfx.pop()
                rt.hiding = spotObj.id
                rt.state = 'idle'
              }
            } else {
              // se agacha donde está (encoge un poquito el cuello)
              rt.state = 'idle'
            }
          } else {
            // sentado o quieto: no se mueve de ahí
            rt.state = 'idle'
          }
          pets[obj.id] = rt
          continue
        }

        // ===== PERSECUCIÓN: el que persigue detrás, el que huye delante =====
        if (rt.chaseUntil > now && rt.chaseRole && rt.chasePartner) {
          const partner = petObjs.find((o) => o.id === rt.chasePartner)
          if (!partner) {
            rt.chaseUntil = 0
            rt.chaseRole = null
            rt.chasePartner = null
            rt.hiding = null
            rt.onTopOf = null
          } else {
            rt.state = 'walk'
            let speedMul = 1.95
            if (rt.chaseRole === 'chase') {
              const yrt = pets[partner.id]
              const preyGone = !!(yrt && (yrt.hiding || yrt.onTopOf))
              if (preyGone) {
                // la presa escapó: da vueltas un momento y se rinde
                if (!rt.pairCd['giveup']) rt.pairCd['giveup'] = now + 1700
                if (now >= rt.pairCd['giveup']) {
                  rt.chaseUntil = now
                  speak(set, get, obj, 'triste')
                } else if (now >= rt.fleeAt) {
                  rt.fleeAt = now + 600
                  rt.tx = clampPct(partner.x + rand(-9, 9))
                  rt.ty = clampPct(partner.y + rand(-7, 7))
                }
                speedMul = 1.1
              } else {
                rt.tx = partner.x
                rt.ty = partner.y
              }
            } else {
              // ¡huir cruzando TODA la pantalla, como en la vida real!
              // la presa se compromete con un rumbo lejano: solo cambia de
              // dirección al LLEGAR a su meta, o si el rival se le pega
              if (now >= rt.fleeAt) {
                rt.fleeAt = now + 380
                const spot = nearestEscapeSpot(levelObjs, obj)
                const dPred = Math.hypot(partner.x - obj.x, partner.y - obj.y)
                const llego = Math.hypot(rt.tx - obj.x, rt.ty - obj.y) < 5
                if ((llego || dPred < 9) && spot && Math.hypot(spot.x - obj.x, spot.y - obj.y) < 34) {
                  // escondite a la vista: ¡corre hacia él!
                  rt.tx = spot.x
                  rt.ty = clampPct(spot.y + 3)
                } else if (llego || dPred < 9) {
                  // meta nueva: el lado opuesto del perseguidor, de punta a
                  // punta del mundo (a veces un amague burlón hacia él)
                  if (Math.random() < 0.15) {
                    rt.tx = clampPct(partner.x + rand(-14, 14))
                    rt.ty = clampPct(partner.y + rand(-10, 10))
                  } else {
                    rt.tx = obj.x < partner.x ? rand(58, 93) : rand(7, 42)
                    rt.ty = obj.y < partner.y ? rand(58, 91) : rand(13, 50)
                  }
                }
              }
              speedMul = 2.45
            }
            const dx = rt.tx - obj.x
            const dy = rt.ty - obj.y
            const dist = Math.hypot(dx, dy)
            const step = (obj.speed ?? 8) * speedMul * dt
            if (dist > 1.2) {
              obj.x = clampPct(obj.x + (dx / dist) * step)
              obj.y = clampPct(obj.y + (dy / dist) * step)
              if (Math.abs(dx) > 0.5) rt.facing = dx > 0 ? 1 : -1
              moved = true
            }
            // ¿la presa alcanzó un escondite o trepadera? (tras 1.1 s de carrera)
            if (
              rt.chaseRole === 'flee' &&
              !rt.hiding &&
              !rt.onTopOf &&
              now > rt.chaseUntil - CHASE_MS + 1100
            ) {
              const near = levelObjs.find((o) => {
                const it = catalogById[o.catalogId]
                return (
                  !isPetObj(o) &&
                  it &&
                  (it.hide || it.climb) &&
                  Math.hypot(o.x - obj.x, o.y - obj.y) < 8
                )
              })
              if (near) {
                const it = catalogById[near.catalogId]
                if (it.climb && Math.random() < 0.6) {
                  rt.onTopOf = near.id
                  get().spawnParticles('💨', obj.x, obj.y - 6, 2)
                } else {
                  rt.hiding = near.id
                  get().spawnParticles('💨', obj.x, obj.y - 2, 2)
                }
                sfx.pop()
              }
            }
          }
          pets[obj.id] = rt
          continue
        }

        // ===== ¡A POR LA PELOTA! (el perro y el zorro la traen) =====
        if (
          ball &&
          (obj.catalogId === 'dog' || obj.catalogId === 'fox') &&
          !rt.chaseUntil
        ) {
          const dx = ball.x - obj.x
          const dy = ball.y - obj.y
          const dist = Math.hypot(dx, dy)
          const step = (obj.speed ?? 8) * 1.65 * dt
          if (dist <= Math.max(2.5, step)) {
            ballCaught = true
            rt.stats.felicidad = clamp(rt.stats.felicidad + 14)
            rt.stats.energia = clamp(rt.stats.energia - 6)
            coins += 3
            get().spawnParticles('🎾', obj.x, obj.y - 5, 3)
            get().spawnParticles('⭐', obj.x, obj.y - 2, 1)
            toast(`🎾 ¡${obj.name} atrapó la pelota! +3 🪙`, { duration: 2500 })
            sfx.treat()
            speak(set, get, obj, 'feliz')
            const lvBall = gainXp(rt, 8)
            if (lvBall) {
              coins += 10
              celebrateLevel(set, get, obj, lvBall)
            }
            rt.state = 'idle'
            rt.wanderAt = now + 1200
          } else {
            rt.state = 'walk'
            obj.x = clampPct(obj.x + (dx / dist) * step)
            obj.y = clampPct(obj.y + (dy / dist) * step)
            if (Math.abs(dx) > 0.5) rt.facing = dx > 0 ? 1 : -1
            moved = true
          }
          pets[obj.id] = rt
          continue
        }

        // decidir nuevo destino (con hambre, sueño, sed o refugio)
        if (rt.state !== 'walk' && now >= rt.wanderAt) {
          if (rt.stats.comida < 50 && food) {
            rt.tx = food.x
            rt.ty = Math.min(95, food.y + 6)
            rt.targetKind = 'food'
            rt.state = 'walk'
          } else if (rt.stats.energia < 32 && water) {
            // ¡sed/cansancio! va solito a buscar agua fresca
            rt.tx = water.x
            rt.ty = Math.min(95, water.y + 6)
            rt.targetKind = 'water'
            rt.state = 'walk'
          } else if (rt.stats.descanso < 32 && bed) {
            rt.tx = bed.x
            rt.ty = Math.min(95, bed.y + 6)
            rt.targetKind = 'bed'
            rt.state = 'walk'
          } else if (raining && shelters.length) {
            // ¡que no se mojen! corren al refugio más cercano
            let best = shelters[0]
            let bestD = Infinity
            for (const sh of shelters) {
              const d = Math.hypot(sh.x - obj.x, sh.y - obj.y)
              if (d < bestD) {
                bestD = d
                best = sh
              }
            }
            rt.tx = best.x
            rt.ty = Math.min(95, best.y + 5)
            rt.targetKind = 'random'
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
            } else if (rt.targetKind === 'water') {
              rt.state = 'drink'
              rt.drinkUntil = now + 1700
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
        if (toy && now >= rt.toyAt && Math.hypot(toy.x - obj.x, toy.y - obj.y) < 9) {
          rt.stats = { ...rt.stats, felicidad: clamp(rt.stats.felicidad + 3) }
          rt.toyAt = now + 6000
          get().spawnParticles('✨', toy.x, toy.y - 3, 1)
        }

        // magia incorporada: bañera = higiene
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

        // curiosidad por la pelota (las demás mascotas también juegan)
        if (
          ball &&
          now >= (rt.pairCd['ball'] ?? 0) &&
          Math.hypot(ball.x - obj.x, ball.y - obj.y) < 9
        ) {
          rt.stats = { ...rt.stats, felicidad: clamp(rt.stats.felicidad + 2) }
          rt.pairCd['ball'] = now + 6000
          get().spawnParticles('🎾', ball.x, ball.y - 3, 1)
        }

        pets[obj.id] = rt
      }

      // ===== ¡RIVALES CERCA! → empieza la persecución (vibra y tiembla) =====
      for (const pred of petObjs) {
        const preys = RIVALS[pred.catalogId]
        if (!preys) continue
        const prt = pets[pred.id]
        if (
          !prt ||
          prt.state === 'sleep' ||
          prt.state === 'eat' ||
          prt.chaseUntil > now ||
          prt.obey ||
          prt.sick ||
          prt.stats.energia < 12
        )
          continue
        for (const prey of petObjs) {
          if (!preys.includes(prey.catalogId)) continue
          const yrt = pets[prey.id]
          if (
            !yrt ||
            yrt.state === 'sleep' ||
            yrt.state === 'eat' ||
            yrt.chaseUntil > now ||
            yrt.obey ||
            yrt.sick ||
            yrt.hiding ||
            yrt.onTopOf
          )
            continue
          const key = `rival:${pred.id}:${prey.id}`
          if (now - (prt.pairCd[key] ?? 0) < 30000) continue
          const dist = Math.hypot(pred.x - prey.x, pred.y - prey.y)
          if (dist > 11) continue
          // ¡EMPIEZA LA PERSECUCIÓN!
          prt.pairCd[key] = now
          prt.chaseRole = 'chase'
          prt.chasePartner = prey.id
          prt.chaseUntil = now + CHASE_MS
          prt.state = 'walk'
          yrt.chaseRole = 'flee'
          yrt.chasePartner = pred.id
          yrt.chaseUntil = now + CHASE_MS
          yrt.fleeAt = 0
          yrt.state = 'walk'
          shakeUntil = now + 1300
          vib([120, 60, 120, 60, 220])
          speak(set, get, pred, 'enojado')
          speak(set, get, prey, 'miedo')
          get().spawnParticles('💢', pred.x, pred.y - 4, 2)
          get().spawnParticles('❗', prey.x, prey.y - 4, 2)
          toast(`😈 ¡${pred.name} persigue a ${prey.name}!`, { duration: 3000 })
          break
        }
      }

      // reglas del tipo "CUANDO se acerque a..." (misma mascota y mismo mundo)
      const fired: Array<[Rule, WorldObject]> = []
      for (const rule of s.rules) {
        if (rule.trigger !== 'cerca') continue
        const petTargets =
          rule.petId === 'cualquiera' ? petObjs : petObjs.filter((o) => o.id === rule.petId)
        for (const pet of petTargets) {
          const rt = pets[pet.id]
          if (!rt) continue
          const objTargets = levelObjs.filter(
            (o) =>
              !isPetObj(o) &&
              (rule.targetId === 'cualquiera' || o.id === rule.targetId),
          )
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

      const patch: Partial<StudioState> = { pets }
      if (moved) patch.objects = objects
      if (coins !== s.coins) patch.coins = coins
      if (ballCaught) patch.ball = null
      if (shakeUntil !== s.shakeUntil) patch.shakeUntil = shakeUntil
      set(patch)
      for (const [rule, pet] of fired) fireRule(set, get, rule, pet)
    },

    gameTick: () => {
      const s = get()
      if (s.mode !== 'play') return
      const now = Date.now()
      const pets: Record<string, PetRuntime> = { ...s.pets }
      let coins = s.coins
      let lastBonusAt = s.lastBonusAt

      // solo decaen las mascotas del mundo actual (las demás descansan)
      const activePets = s.objects.filter(
        (o) => isPetObj(o) && o.level === s.currentLevel && s.pets[o.id],
      )

      // ===== SORPRESAS: lluvia, escasez, mariposa, regalo =====
      let event = s.event
      let nextEventAt = s.nextEventAt
      if (event && now >= event.until) {
        if (event.kind === 'lluvia') {
          get().spawnParticles('🌈', 50, 16, 2)
          get().spawnParticles('☀️', 78, 14, 1)
          toast('🌈 ¡Dejó de llover! ¡Salió un arcoíris!')
          sfx.happy()
          for (const id of Object.keys(pets)) {
            const rt = pets[id]
            pets[id] = {
              ...rt,
              stats: { ...rt.stats, felicidad: clamp(rt.stats.felicidad + 5) },
            }
          }
        } else if (event.kind === 'regalo') {
          toast('👋 La caja sorpresa se fue… ¡más rápido la próxima vez!')
        }
        event = null
        nextEventAt = now + rand(45000, 85000)
      }
      if (!event && now >= nextEventAt && activePets.length > 0) {
        const kinds: EventKind[] = ['lluvia', 'escasez', 'mariposa', 'regalo']
        const kind = kinds[Math.floor(Math.random() * kinds.length)]
        const info = EVENT_INFO[kind]
        event = {
          kind,
          until: now + info.dur,
          x: rand(22, 78),
          y: rand(32, 68),
        }
        toast(info.msg, { duration: 5000 })
        sfx.alarm()
        if (kind === 'lluvia') sfx.rain()
        if (kind === 'lluvia' || kind === 'regalo') vib(60)
      }

      const raining = event?.kind === 'lluvia'
      const hungryDays = event?.kind === 'escasez'
      const butterfly = event?.kind === 'mariposa'
      const shelters = s.objects.filter(
        (o) => o.level === s.currentLevel && catalogById[o.catalogId]?.shelter,
      )

      // ¡hay una persecución en marcha! el móvil vibra cada segundo y el
      // lienzo tiembla un poquito hasta que se calmen o los calmemos
      let shakeUntil = s.shakeUntil
      if (activePets.some((o) => s.pets[o.id]?.chaseUntil > now)) {
        vib(45)
        shakeUntil = Math.max(shakeUntil, now + 320)
      }

      for (const obj of activePets) {
        const rt0 = s.pets[obj.id]
        const rt: PetRuntime = { ...rt0, stats: { ...rt0.stats } }
        const running = rt.chaseUntil > now // ¡corriendo en una persecución!

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
          rt.stats.comida = clamp(
            rt.stats.comida - 0.7 - (hungryDays ? 0.6 : 0) - (running ? 0.4 : 0),
          )
          // correr mucho cansa: pierde energía el doble mientras persigue o huye
          rt.stats.energia = clamp(rt.stats.energia - (running ? 1.15 : 0.4))
          rt.stats.higiene = clamp(rt.stats.higiene - 0.35)
          rt.stats.descanso = clamp(rt.stats.descanso - 0.45)
          let decay = 0.25
          if (rt.stats.comida < 20) decay += 0.8
          if (rt.stats.higiene < 20) decay += 0.5
          if (rt.stats.descanso < 20) decay += 0.4
          if (rt.sick) decay += 0.8
          if (raining) {
            // ¿está a cubierto? agustito; si no, se moja y se pone triste
            const cozy = shelters.some(
              (sh) => Math.hypot(sh.x - obj.x, sh.y - obj.y) < 11,
            )
            if (cozy) rt.stats.felicidad = clamp(rt.stats.felicidad + 0.15)
            else {
              rt.stats.higiene = clamp(rt.stats.higiene - 0.3)
              rt.stats.felicidad = clamp(rt.stats.felicidad - 0.25)
            }
          }
          if (butterfly) rt.stats.felicidad = clamp(rt.stats.felicidad + 0.4)
          rt.stats.felicidad = clamp(rt.stats.felicidad - decay)
        }

        if (!rt.sick && (rt.stats.comida <= 0.5 || rt.stats.higiene <= 0.5)) {
          rt.sick = true
          get().spawnParticles('🤒', obj.x, obj.y - 5, 2)
          toast(`🤒 ¡${obj.name} se puso enfermo/a! Tócalo/a y usa 🏥 Curar`, { duration: 5000 })
          sfx.sad()
          speak(set, get, obj, 'triste')
        }

        // ===== VOCES: cada mascota suena con su voz según su ánimo =====
        if (now >= rt.voiceAt && rt.state !== 'sleep') {
          speak(set, get, obj, moodOf(rt))
          // cuantas más mascotas haya, más espaciadas las voces (sin cacofonía)
          const spacing = Math.min(3, Math.max(1, activePets.length / 2))
          rt.voiceAt = now + rand(9000, 17000) * spacing
        }

        pets[obj.id] = rt
      }

      // bonus: todas las mascotas del mundo están felices
      const allPets = activePets.map((o) => pets[o.id]).filter(Boolean)
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

      // limpiar globos de voz caducados (después de hablar: speak() pudo añadir)
      const say: Record<string, SayBubbleText> = {}
      for (const [pid, b] of Object.entries(get().say)) {
        if (b.until > now) say[pid] = b
      }

      set({ pets, coins, lastBonusAt, say, event, nextEventAt, shakeUntil })

      // reglas del tipo "CADA X segundos..." (mascotas del mundo actual)
      const ruleAcc = { ...s.ruleAcc }
      let accChanged = false
      for (const rule of s.rules) {
        if (rule.trigger !== 'cada') continue
        const acc = (ruleAcc[rule.id] ?? 0) + 1
        if (acc >= Math.max(5, rule.intervalSec)) {
          ruleAcc[rule.id] = 0
          accChanged = true
          const targets = activePets.filter(
            (o) => rule.petId === 'cualquiera' || o.id === rule.petId,
          )
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
