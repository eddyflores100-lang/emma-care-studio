'use client'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useStudio } from '@/lib/studio/store'

export function ChallengeOverlay() {
  const round=useStudio(s=>s.challenge),hit=useStudio(s=>s.hitChallenge),cancel=useStudio(s=>s.cancelChallenge)
  const [now,setNow]=useState(()=>Date.now())
  useEffect(()=>{
    if(!round)return
    const timer=window.setInterval(()=>{
      const time=Date.now();setNow(time)
      if(time>round.deadline){cancel();toast('⏱️ Tiempo cumplido. Descansa y vuelve a intentarlo.')}
    },200)
    return ()=>window.clearInterval(timer)
  },[round,cancel])
  if(!round)return null
  const remaining=Math.max(0,Math.ceil((round.deadline-Math.max(now,round.started))/1000)),found=round.targets.filter(t=>t.found).length
  return <>
    <div className="challenge-status"><span role="status">{round.kind==='circuito'?'🏁 Toca en orden':round.kind==='ayuda'?'🤝 Recoge suministros':'🔎 Encuentra los objetos'} · {found}/5 · {remaining}s</span><button type="button" onClick={cancel} aria-label="Cancelar desafío">✕</button></div>
    {round.targets.filter(t=>!t.found).map(target=><button key={target.id} type="button" className={`challenge-target${round.hint?' challenge-hint':''}`} style={{left:`${target.x}%`,top:`${target.y}%`}} aria-label={`Recoger objetivo ${target.id+1}`} onClick={e=>{e.stopPropagation();hit(target.id)}}>{round.kind==='circuito'?target.id+1:round.kind==='ayuda'?'📦':round.level==='playa'?'♻️':round.level==='bosque'?'🐾':'⭐'}</button>)}
  </>
}
