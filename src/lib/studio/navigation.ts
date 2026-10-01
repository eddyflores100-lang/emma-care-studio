import type { WorldObject } from './types'

const solids = new Set(['house','tree','pine','palm','rock','cactus','sofa','shelf','tv'])
export function stepAround(pet: WorldObject, goal: {x:number;y:number}, step: number, objects: WorldObject[]) {
  const dx=goal.x-pet.x,dy=goal.y-pet.y,distance=Math.hypot(dx,dy)
  if (!distance) return {x:pet.x,y:pet.y}
  let x=pet.x+dx/distance*Math.min(step,distance),y=pet.y+dy/distance*Math.min(step,distance)
  for (const obstacle of objects) {
    if (!solids.has(obstacle.catalogId) || obstacle.level !== pet.level) continue
    const radius=4+obstacle.size*1.5
    // A shelter/tree explicitly selected as a destination must remain accessible.
    if (Math.hypot(goal.x-obstacle.x,goal.y-obstacle.y)<radius+1.5) continue
    if (Math.hypot(x-obstacle.x,y-obstacle.y)>=radius) continue
    const angle=Math.atan2(pet.y-obstacle.y,pet.x-obstacle.x)+Math.min(0.3,step/radius*1.8)
    x=obstacle.x+Math.cos(angle)*(radius+0.1)
    y=obstacle.y+Math.sin(angle)*(radius+0.1)
  }
  return {x:Math.max(3,Math.min(97,x)),y:Math.max(3,Math.min(97,y))}
}
