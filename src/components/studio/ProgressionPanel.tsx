'use client'
import { memo, useState } from 'react'
import { useStudio } from '@/lib/studio/store'
import { QUESTS, ACCESSORIES, ABILITIES, rollProgress, UNLOCK_REQUIREMENTS } from '@/lib/studio/progression'
import { LEVELS, catalogById } from '@/lib/studio/catalog'

export const ProgressionPanel = memo(function ProgressionPanel() {
  const progression=useStudio(s=>s.progression),coins=useStudio(s=>s.coins),currentLevel=useStudio(s=>s.currentLevel)
  const selectedId=useStudio(s=>s.selectedId),hasChallenge=useStudio(s=>!!s.challenge)
  const petName=useStudio(s=>s.objects.find(o=>o.id===s.selectedId&&o.level===s.currentLevel&&catalogById[o.catalogId]?.kind==='pet')?.name)
  const species=useStudio(s=>s.objects.find(o=>o.id===s.selectedId&&o.level===s.currentLevel&&catalogById[o.catalogId]?.kind==='pet')?.catalogId)
  const hospitalStatus=useStudio(s=>s.pets[s.selectedId??'']?.hospitalStatus)
  const state={...useStudio.getState(),progression,coins,currentLevel},p=rollProgress(progression)
  const [name,setName]=useState(p.nickname)
  const pet=selectedId&&petName&&species?{id:selectedId,name:petName,catalogId:species}:null
  const story:Record<string,string>={jardin:'Aquí comienza tu equipo: conoce y cuida a tus mascotas.',casa:'Prepara un hogar cómodo y descubre sus rincones.',hospital:'Ayuda a los pacientes y prepara suministros.',playa:'Recoge residuos y cuida la costa.',parque:'Nube te espera para explorar y completar circuitos.',bosque:'Ámbar conoce las huellas del bosque.',granja:'Pepita necesita ayuda para preparar la granja.',montana:'Musgo te enseña a explorar con paciencia.'}
  const quests=QUESTS.filter(q=>q.level===state.currentLevel)
  return <div className="adventure-panel space-y-4 text-xs text-slate-700">
    <p className="font-bold">🎯 {p.claimed.length}/24 misiones · {p.weekPoints} puntos esta semana</p>
    <p className="rounded-xl bg-emerald-50 p-2 font-bold">{story[state.currentLevel]}</p>
    <p>Cuida, explora y cobra los premios para abrir mundos nuevos. No se pierden premios por dejar de jugar.</p>
    <div className="space-y-2">{quests.map(q=>{
      const count=Math.min(q.goal,p.counters[q.event]??0),done=p.claimed.includes(q.id)
      return <div key={q.id} className="rounded-xl border border-amber-100 bg-amber-50 p-3">
        <p className="font-black">{q.title} · {count}/{q.goal}</p>
        <progress value={count} max={q.goal} className="my-2 w-full" aria-label={q.title}/>
        <p>{q.coins} 🪙 · {q.points} puntos{q.prize?` · ${q.prize}`:''}</p>
        <button type="button" disabled={done||count<q.goal} onClick={()=>state.claimMission(q.id)} className="adventure-button">{done?'✓ Premio cobrado':'Cobrar premio'}</button>
      </div>
    })}</div>
    <section><h3 className="font-black">Juega con {pet?.name??'una mascota'}</h3>
      <p className="my-1">{pet?ABILITIES[pet.catalogId]?.label:'Selecciona una mascota en el mundo o en Controles.'}</p>
      <div className="flex flex-wrap gap-2">{(['buscar','circuito'] as const).map(kind=><button key={kind} type="button" disabled={!pet||hasChallenge} className="adventure-button" onClick={()=>{state.startChallenge(kind);if(useStudio.getState().challenge)window.dispatchEvent(new CustomEvent('emma-drawer-close'))}}>{kind==='buscar'?'🔎 Búsqueda':'🏁 Recorrido'}</button>)}</div>
      <p className="mt-2">Cinco objetivos, 30 segundos más la habilidad de tu mascota. El recorrido se toca del 1 al 5. Al completarse consume energía. Mejorar tu récord semanal también da monedas: una por cada diez puntos de mejora.</p>
    </section>
    <section className="rounded-xl bg-teal-50 p-3"><h3 className="font-black">🤝 Ayuda para el hospital</h3><p>Si tienes menos de 15 monedas, recoge cinco suministros y recibe 20 monedas. Una vez al día. Después, los pacientes en espera pueden preparar suministros que pagan su tratamiento directamente.</p>
      <button type="button" disabled={!pet||state.coins>=15||(p.aidDay===p.dailyDay&&hospitalStatus!=='waiting')||hasChallenge} className="adventure-button" onClick={()=>{state.startChallenge('ayuda');if(useStudio.getState().challenge)window.dispatchEvent(new CustomEvent('emma-drawer-close'))}}>Preparar suministros</button></section>
    <section><h3 className="font-black">☀️ Cuidado diario</h3><p>Cuida tres mascotas diferentes: {Math.min(3,p.dailyPets.length)}/3 · 12 monedas y 20 puntos.</p><button type="button" disabled={p.dailyClaimed||p.dailyPets.length<3} className="adventure-button" onClick={state.claimDaily}>{p.dailyClaimed?'✓ Cobrado hoy':'Cobrar premio diario'}</button><p className="mt-1 text-slate-500">Los primeros 30 cuidados del día dan monedas base. Después siguen mejorando el bienestar y las misiones.</p></section>
    <section><h3 className="font-black">🎁 Armario · para todas tus mascotas</h3><div className="flex flex-wrap gap-2"><button type="button" className="adventure-button" aria-pressed={!p.equipped} onClick={()=>state.equipPrize(null)}>Sin accesorio</button>{ACCESSORIES.map(prize=><button key={prize} type="button" disabled={!p.accessories.includes(prize)} className="adventure-button" aria-pressed={p.equipped===prize} onClick={()=>state.equipPrize(prize)}>{prize} {p.accessories.includes(prize)?'':'🔒'}</button>)}</div></section>
    <section><h3 className="font-black">🗺️ Próximos mundos</h3>{LEVELS.filter(l=>UNLOCK_REQUIREMENTS[l.id]).map(l=><p key={l.id}>{l.emoji} {l.name}: {l.cost} monedas · {UNLOCK_REQUIREMENTS[l.id]} misiones cobradas</p>)}</section>
    <section><h3 className="font-black">🏆 Récords personales y temporadas locales</h3><p>Guardados en este dispositivo. No es una clasificación online. Los puntos de desafíos se ganan al mejorar el mejor resultado de la semana; gastar monedas no da puntos.</p>
      <form className="my-2 flex gap-1" onSubmit={e=>{e.preventDefault();state.setNickname(name)}}><input className="min-w-0 flex-1 rounded-lg border p-2" aria-label="Apodo del cuidador" maxLength={20} value={name} onChange={e=>setName(e.target.value)}/><button className="adventure-button" type="submit">Guardar</button></form>
      <p className="font-bold">{p.nickname} · semana {p.week}: {p.weekPoints} puntos</p>
      {Object.entries(p.best).map(([key,score])=><p key={key}>{key.replace(':',' · ')}: {score} puntos</p>)}
      <ol className="mt-2 space-y-1">{[...p.history].sort((a,b)=>b.points-a.points).map((season,i)=><li key={season.week}>{i+1}. Semana {season.week}: {season.points} puntos</li>)}</ol>
    </section>
  </div>
})
