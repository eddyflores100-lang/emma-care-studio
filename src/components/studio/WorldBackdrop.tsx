import { memo } from 'react'
import type { LevelId } from '@/lib/studio/types'

const COLORS = {
  parque:['#e3edff','#d1f1e4','#a2d6be'], bosque:['#e3e5fc','#c5e9db','#95c9bd'],
  granja:['#fff0fa','#dfefd2','#bad7af'], montana:['#e8e8ff','#def0f5','#b5d6e4'],
  jardin: ['#e3f2ff', '#d2f0dc', '#abdcbc'],
  casa: ['#fff0f8', '#f5e4f2', '#dfc7e1'],
  hospital: ['#e4f3f0', '#d6e9e1', '#b5d4c9'],
  playa: ['#d8f2fb', '#fff0dc', '#efd9ca'],
} as const

function Cloud({ x, y, small = false }: { x: number; y: number; small?: boolean }) {
  return <g transform={`translate(${x} ${y}) scale(${small ? 0.7 : 1})`}>
    <path d="M0 30 Q-7 7 17 9 Q25-15 48 3 Q72-8 78 15 Q105 15 96 35H8Z" fill="#fffdf7" opacity=".9" />
  </g>
}

export const WorldBackdrop = memo(function WorldBackdrop({ level, raining }: { level: LevelId; raining: boolean }) {
  const [sky, ground, shade] = COLORS[level]
  const outdoors = !['casa','hospital'].includes(level)
  return <div className={`world-backdrop world-${level}${raining ? ' world-rainy' : ''}`} aria-hidden="true">
    <svg viewBox="0 0 1000 600" preserveAspectRatio="none" className="world-art">
      <rect width="1000" height="600" fill={ground} />
      <rect width="1000" height="118" fill={sky} />
      {outdoors ? <>
        {!raining && <g className="scene-sun"><circle cx="900" cy="43" r="31" fill="#fff4c4" opacity=".5" /><circle cx="900" cy="43" r="21" fill="#ffe3a1" /><path d="M890 42v2M909 42v2M896 49q4 4 8 0" stroke="#9d7d96" strokeWidth="2" fill="none" strokeLinecap="round" /></g>}
        <g className="scene-cloud"><Cloud x={85} y={28} /><Cloud x={625} y={20} small /></g>
        {level !== 'playa' ? <>
          {level==='montana' && <path d="M0 118L130 8 220 91 350 12 480 113 650 2 790 106 900 17 1000 110V180H0Z" fill="#b9badd" />}
          <path d="M0 95 Q120 40 260 90 T520 83 T790 90 T1000 65V160H0Z" fill="#c4e3d7" />
          <path d="M0 122 Q180 80 345 128 T680 110 T1000 125V184H0Z" fill="#b4dccc" />
          {!['bosque','montana'].includes(level) && <>
          <path d="M0 146H1000" stroke="#f8f3dc" strokeWidth="7" />
          {Array.from({ length: 22 }, (_, i) => <path key={i} d={`M${i * 48} 118v54`} stroke="#f8f3dc" strokeWidth="7" strokeLinecap="round" />)}
          </>}
          {level==='bosque' && Array.from({length:10},(_,i)=><path key={i} d={`M${i*110} 164l35-98 35 98Z`} fill="#9dcebf" opacity=".75" />)}
          {level==='parque' && <g stroke="#87aa82" fill="none" strokeWidth="4"><circle cx="450" cy="81" r="46"/><path d="M450 35v92M404 81h92M417 48l66 66M417 114l66-66M450 81l-27 89M450 81l27 89"/></g>}
          <path d="M0 185 Q300 161 560 188 T1000 176V600H0Z" fill={ground} />
          <path d="M430 600 Q350 475 520 370 Q680 262 564 187H635Q755 320 594 417 Q443 498 531 600Z" fill="#fff1e7" opacity=".65" />
          {level==='granja' && <g stroke="#b2bb7a" strokeWidth="6" opacity=".35">{Array.from({length:6},(_,i)=><path key={i} d={`M660 ${320+i*30}h220`} />)}</g>}
          {level==='montana' && <path d="M88 406l30-32 34 35H88M823 331l25-25 27 28Z" fill="#a4b4a4" />}
          <ellipse cx="176" cy="332" rx="126" ry="32" fill="#c2e7d4" />
          <ellipse cx="835" cy="487" rx="105" ry="26" fill="#bce4d0" />
          {Array.from({length: 24}, (_, i) => <g key={i} transform={`translate(${35+(i*137)%930} ${230+(i*67)%315})`}>
            <path d="M-4 3L0-4L3 3M3 3L7-2" fill="none" stroke={shade} strokeWidth="2" strokeLinecap="round" />
            {i%4===0 && <><path d="M0 0v-9" stroke="#75a273" strokeWidth="2" /><circle cy="-11" r="4" fill={i%8===0?'#fff6df':'#e7a7a4'} /><circle cy="-11" r="1.4" fill="#e8c271" /></>}
          </g>)}
        </> : <>
          <rect y="89" width="1000" height="92" fill="#76c6d1" />
          <path d="M0 155Q150 121 300 150T600 150T1000 153V223H0Z" fill="#a0deda" />
          <g className="scene-wave"><path d="M-50 190Q100 163 250 190T550 190T850 190T1150 190" fill="none" stroke="#f6faf0" strokeWidth="12" strokeLinecap="round" /></g>
          <path d="M0 218Q280 245 510 218T1000 223V600H0Z" fill={ground} />
          <path d="M0 234Q280 260 510 234T1000 239" fill="none" stroke="#fff3d7" strokeWidth="8" />
          <g transform="translate(786 93)"><path d="M0 0h65l-14 15H13Z" fill="#ba836a" /><path d="M30-51V0H4Z" fill="#fff8e8" /><path d="M35-40V-3H57Z" fill="#e5ab9d" /></g>
          {Array.from({length: 30}, (_,i)=><ellipse key={i} cx={30+(i*173)%940} cy={300+(i*71)%260} rx={i%3+1} ry="1.3" fill={shade} opacity=".6" />)}
          <path d="M83 491q10-15 20 0l-10 8Z" fill="#e7b3a4" stroke="#d29688" strokeWidth="2" />
          <path d="M908 363l5 8 9 1-7 6 2 9-9-5-9 5 2-9-7-6 9-1Z" fill="#e0b077" />
        </>}
      </> : <>
        {/* A clear wall/floor boundary; furnishings below remain interactive objects. */}
        <rect y="110" width="1000" height="13" fill={shade} opacity=".55" />
        <rect y="106" width="1000" height="6" fill="#fffcf1" />
        <g transform="translate(710 18)">
          <rect width="142" height="76" rx="9" fill="#fffdf3" stroke={shade} strokeWidth="5" />
          <rect x="8" y="8" width="126" height="60" rx="5" fill="#b7dfdf" />
          <path d="M8 52q32-33 62-9t64-8v33H8Z" fill="#97bfa0" />
          <path d="M71 8v60M8 38h126" stroke="#fffdf3" strokeWidth="5" />
        </g>
        {level === 'casa' ? <>
          {Array.from({length: 10},(_,i)=><g key={i}><path d={`M0 ${155+i*48}H1000`} stroke={shade} opacity=".42" strokeWidth="2" />
            <path d={`M${i%2?260:530} ${155+i*48}v48M${i%2?760:40} ${155+i*48}v48`} stroke={shade} opacity=".35" strokeWidth="2" /></g>)}
          <g transform="translate(120 18)"><rect width="96" height="71" rx="8" fill="#cda9d0" /><rect x="7" y="7" width="82" height="57" rx="4" fill="#f7e4be" /><path d="M15 55l24-31 17 20 13-12 16 23Z" fill="#97bfa0" /><circle cx="71" cy="20" r="7" fill="#eac373" /></g>
          <ellipse cx="510" cy="423" rx="214" ry="73" fill="#cdaecb" opacity=".13" />
          <ellipse cx="510" cy="416" rx="214" ry="73" fill="#f3cce6" />
          <ellipse cx="510" cy="416" rx="197" ry="60" fill="none" stroke="#fff6fc" strokeWidth="4" />
          <path d="M910 123L720 380H945L1000 123Z" fill="#fff9db" opacity=".17" />
        </> : <>
          {Array.from({length: 9},(_,i)=><path key={i} d={`M0 ${160+i*55}H1000M${i*125} 123V600`} stroke={shade} opacity=".35" strokeWidth="2" />)}
          <g transform="translate(120 23)"><rect width="90" height="66" rx="14" fill="#fffdf4" stroke="#b4cfc3" strokeWidth="3" /><path d="M45 15v36M27 33h36" stroke="#77ae9e" strokeWidth="13" strokeLinecap="round" /></g>
          <rect x="360" y="310" width="280" height="150" rx="55" fill="#b7d5c9" opacity=".45" />
          <path d="M483 353h34v25h25v34h-25v25h-34v-25h-25v-34h25Z" fill="#eef7e9" opacity=".7" />
          <path d="M905 123L740 370H955L1000 123Z" fill="#fffdf1" opacity=".24" />
        </>}
      </>}
    </svg>
    {['parque','bosque','granja','montana'].includes(level) && <span className="scene-location">{level==='parque'?'🎡 Parque de aventuras':level==='bosque'?'🌲 Sendero de huellas':level==='granja'?'🌾 Granja de amigos':'🏔️ Camino de la montaña'}</span>}
    <div className="scene-light" />
  </div>
})
