import { z } from 'zod'
import type { LevelId } from './types'

export type ChallengeKind = 'buscar' | 'circuito' | 'ayuda'
export const WORLD_IDS = ['jardin','casa','hospital','playa','parque','bosque','granja','montana'] as const
export const ACCESSORIES = ['pañuelo','corona','sombrero','estrellas'] as const
export type Accessory = typeof ACCESSORIES[number]
export const progressionSchema = z.object({
  nickname:z.string().trim().min(1).max(20).default('Cuidador'),
  counters:z.record(z.string().max(60),z.number().int().min(0).max(100000)).default({}),
  claimed:z.array(z.string().max(60)).max(100).default([]),
  accessories:z.array(z.enum(ACCESSORIES)).max(4).default([]),
  equipped:z.enum(ACCESSORIES).nullable().default(null),
  best:z.record(z.string().max(60),z.number().int().min(0).max(1000)).default({}),
  weekBest:z.record(z.string().max(60),z.number().int().min(0).max(1000)).default({}),
  wellnessRewards:z.number().int().min(0).max(10).default(0),
  careRewards:z.number().int().min(0).max(100000).default(0),
  week:z.string().max(20).default(''), weekPoints:z.number().int().min(0).max(1000000).default(0),
  history:z.array(z.object({week:z.string().max(20),points:z.number().int().min(0).max(1000000)})).max(12).default([]),
  aidDay:z.string().max(20).default(''), dailyDay:z.string().max(20).default(''),
  dailyPets:z.array(z.string().max(100)).max(500).default([]), dailyClaimed:z.boolean().default(false),
})
export type Progression = z.infer<typeof progressionSchema>
export function freshProgression():Progression { return progressionSchema.parse({}) }
export function dayKey(now=Date.now()) { const d=new Date(now);return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}` }
export function weekKey(now=Date.now()) { const d=new Date(now);const monday=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()));monday.setUTCDate(monday.getUTCDate()-(monday.getUTCDay()+6)%7);return monday.toISOString().slice(0,10) }
export function rollProgress(p:Progression,now=Date.now()):Progression {
  const week=weekKey(now),day=dayKey(now)
  return {...p,week,wellnessRewards:p.dailyDay===day?p.wellnessRewards:0,weekBest:p.week===week?p.weekBest:{},careRewards:p.dailyDay===day?p.careRewards:0,weekPoints:p.week===week?p.weekPoints:0,
    history:p.week && p.week!==week?[{week:p.week,points:p.weekPoints},...p.history].slice(0,12):p.history,
    dailyDay:day,dailyPets:p.dailyDay===day?p.dailyPets:[],dailyClaimed:p.dailyDay===day?p.dailyClaimed:false}
}
export const QUESTS = WORLD_IDS.flatMap((level,index)=>[
  {id:`${level}-cuidado`,level,title:'Cuida tres veces',event:`care:${level}`,goal:3,coins:8,points:25,prize:index%2===0?'pañuelo' as Accessory:null},
  {id:`${level}-buscar`,level,title:level==='playa'?'Limpia la playa':level==='bosque'?'Sigue las huellas':'Encuentra cinco objetos',event:`buscar:${level}`,goal:1,coins:15,points:50,prize:index%3===0?'sombrero' as Accessory:null},
  {id:`${level}-circuito`,level,title:'Completa el recorrido en orden',event:`circuito:${level}`,goal:1,coins:18,points:60,prize:index%2===1?'corona' as Accessory:'estrellas' as Accessory},
])
export function recordProgress(p:Progression,event:string,petId?:string,now=Date.now()):Progression {
  const next=rollProgress(p,now)
  const counters={...next.counters,[event]:Math.min(100000,(next.counters[event]??0)+1)}
  const dailyPets=event.startsWith('care:')&&petId?[...new Set([...next.dailyPets,petId])]:next.dailyPets
  return {...next,counters,dailyPets}
}
export function claimQuest(p:Progression,id:string,now=Date.now()) {
  const quest=QUESTS.find(q=>q.id===id), next=rollProgress(p,now)
  if(!quest || next.claimed.includes(id) || (next.counters[quest.event]??0)<quest.goal)return null
  return {coins:quest.coins,progress:{...next,claimed:[...next.claimed,id],weekPoints:next.weekPoints+quest.points,
    accessories:quest.prize?[...new Set([...next.accessories,quest.prize])]:next.accessories} as Progression}
}
export const UNLOCK_REQUIREMENTS:Partial<Record<LevelId,number>>={parque:2,bosque:5,granja:8,montana:12}
export const ABILITIES:Record<string,{label:string;seconds:number;hint:boolean}>={
  dog:{label:'Olfato: destaca las pistas',seconds:0,hint:true}, cat:{label:'Agilidad: +8 segundos',seconds:8,hint:false},
  mouse:{label:'Explorador: destaca las pistas',seconds:0,hint:true}, rabbit:{label:'Saltos: +6 segundos',seconds:6,hint:false},
  turtle:{label:'Paciencia: +15 segundos',seconds:15,hint:false}, bird:{label:'Vista aérea: destaca las pistas',seconds:0,hint:true},
  fox:{label:'Rastreador: destaca las pistas',seconds:0,hint:true}, bear:{label:'Resistencia: +10 segundos',seconds:10,hint:false},
  panda:{label:'Calma: +10 segundos',seconds:10,hint:false}, lion:{label:'Coraje: +8 segundos',seconds:8,hint:false},
  pig:{label:'Buen olfato: destaca las pistas',seconds:0,hint:true}, monkey:{label:'Acrobacia: +8 segundos',seconds:8,hint:false},
  hamster:{label:'Curiosidad: destaca las pistas',seconds:0,hint:true}, chicken:{label:'Atención: destaca las pistas',seconds:0,hint:true},
  duck:{label:'Resistencia: +6 segundos',seconds:6,hint:false},
}
export interface Challenge { kind:ChallengeKind;level:LevelId;petId:string;started:number;deadline:number;mistakes:number;hint:boolean;targets:{id:number;x:number;y:number;found:boolean}[] }
export function newChallenge(kind:ChallengeKind,level:LevelId,petId:string,species:string,now=Date.now()):Challenge {
  const ability=ABILITIES[species]??{seconds:0,hint:false}
  return {kind,level,petId,started:now,deadline:now+(30+ability.seconds)*1000,mistakes:0,hint:ability.hint,
    targets:Array.from({length:5},(_,id)=>({id,x:17+(id*19)%70,y:28+(id*23)%54,found:false}))}
}
export function challengeScore(round:Challenge,now=Date.now()){return Math.max(10,100-Math.floor((now-round.started)/1000)-round.mistakes*10)}
