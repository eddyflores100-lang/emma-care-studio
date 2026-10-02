/** One illustrated family of pets: stable artwork across Android, iOS and desktop. */
const PALETTES: Record<string, [string, string]> = {
  dog:['#d5a476','#8f654f'], cat:['#ebbc81','#bf8d5c'], rabbit:['#f6e7db','#e9b7b0'],
  mouse:['#b5c4ca','#dfb3b4'], hamster:['#e4b77e','#ba875e'], bird:['#94c6ca','#5f999e'],
  chicken:['#fff1d8','#e0b66f'], duck:['#e5d498','#b3a268'], fox:['#db9466','#a96248'],
  bear:['#b88f72','#8b654f'], panda:['#f7f0df','#647675'], lion:['#e4be79','#bc8754'],
  pig:['#e7aaa4','#bd817e'], monkey:['#b18d70','#86644f'], turtle:['#a6be83','#77946d'],
}
export function PetIllustration({ species, sleeping = false, happy = false }: {species: string; sleeping?: boolean; happy?: boolean}) {
  const [fur, accent] = PALETTES[species] ?? PALETTES.dog
  const bird = ['bird','chicken','duck'].includes(species)
  const roundEars = ['mouse','hamster','bear','panda','pig','monkey'].includes(species)
  const pointed = ['cat','fox'].includes(species)
  return <svg className="pet-illustration" viewBox="0 0 100 108" aria-hidden="true" focusable="false">
    <g stroke="#62584d" strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round">
      {/* Tails, body and feet stay consistent with the face of each species. */}
      {!bird && !['turtle','rabbit','hamster','bear','panda','fox','mouse'].includes(species) && <path d="M75 76q22-12 16-27q-4-5-8 1q6 12-11 12" fill={fur} />}
      {['rabbit','hamster','bear','panda'].includes(species) && <circle cx="77" cy="77" r="8" fill={fur} />}
      {species === 'mouse' && <path d="M72 84q28 11 21-11" fill="none" stroke="#d7aaa5" strokeWidth="4" />}
      {species === 'fox' && <path d="M70 84q28 8 21-43q-25 13-21 43Z" fill={accent} />}
      {species === 'fox' && <path d="M85 64q8-9 6-23q-12 5-17 14Z" fill="#fff1db" />}
      {species === 'lion' && <circle cx="50" cy="42" r="36" fill={accent} />}
      {species === 'turtle' ? <>
        <ellipse cx="50" cy="77" rx="31" ry="24" fill={accent} />
        <path d="M50 56l13 12-4 17H41l-4-17Z M20 72l17-4M63 68l17 4M41 85l-9 12M59 85l9 12" fill="none" stroke="#afc395" />
      </> : <ellipse cx="50" cy="76" rx="25" ry="26" fill={fur} />}
      <ellipse cx="34" cy="98" rx="13" ry="7" fill={bird ? '#d8ac6d' : fur} />
      <ellipse cx="67" cy="98" rx="13" ry="7" fill={bird ? '#d8ac6d' : fur} />
      {!bird && species !== 'turtle' && <ellipse cx="50" cy="80" rx="14" ry="16" fill="#fff1db" stroke="none" opacity=".8" />}
      {roundEars && <>
        <circle cx="23" cy="23" r={species === 'mouse' ? 17 : 13} fill={species === 'panda' ? accent : fur} />
        <circle cx="77" cy="23" r={species === 'mouse' ? 17 : 13} fill={species === 'panda' ? accent : fur} />
        {species !== 'panda' && <><circle cx="23" cy="23" r="7" fill={species === 'bear' ? accent : '#e8b6ab'} stroke="none" /><circle cx="77" cy="23" r="7" fill={species === 'bear' ? accent : '#e8b6ab'} stroke="none" /></>}
      </>}
      {pointed && <><path d="M21 36L18 6l26 20M56 26L82 6l-3 30" fill={fur} /><path d="M25 27l-2-12 12 10M65 25l12-10-2 12" stroke="#dfaea1" strokeWidth="4" /></>}
      {species === 'rabbit' && <><ellipse cx="33" cy="22" rx="10" ry="21" fill={fur} /><ellipse cx="67" cy="22" rx="10" ry="21" fill={fur} /><path d="M33 9v24M67 9v24" stroke={accent} strokeWidth="5" /></>}
      {species === 'dog' && <><path d="M26 20Q5 16 7 49Q12 60 22 50L34 24Z" fill={accent} /><path d="M74 20Q95 16 93 49Q88 60 78 50L66 24Z" fill={accent} /></>}
      {species === 'chicken' && <path d="M37 22q-5-13 5-14q8-12 14-1q11-5 11 11l-5 9Z" fill="#d6877a" />}
      {bird && <><path d="M26 62q-16 0-14 21q9 6 19-9M74 62q16 0 14 21q-9 6-19-9" fill={accent} /><path d="M42 24q-4-13 6-14l4 10 9-5 2 12" fill={accent} /></>}
      <ellipse cx="50" cy="44" rx={species==='turtle'?25:31} ry="28" fill={fur} />
      {species==='fox' && <path d="M20 48q6 26 30 24q24 2 30-24L60 55 50 48 40 55Z" fill="#fff1db" stroke="none" />}
      {species==='panda' && <><ellipse cx="36" cy="42" rx="11" ry="13" fill={accent} stroke="none" /><ellipse cx="64" cy="42" rx="11" ry="13" fill={accent} stroke="none" /></>}
      {species==='monkey' && <path d="M50 32q-24-19-26 14q-1 24 26 25q27-1 26-25q-2-33-26-14Z" fill="#e7c49d" stroke="none" />}
      <ellipse cx="27" cy="53" rx="6" ry="3.5" fill="#e39b91" stroke="none" opacity=".65" />
      <ellipse cx="73" cy="53" rx="6" ry="3.5" fill="#e39b91" stroke="none" opacity=".65" />
      <g className={sleeping ? '' : 'pet-eyes'}>
        {sleeping || happy ? <path d={!sleeping && happy?'M32 43q4-7 8 0M60 43q4-7 8 0':'M31 43q5 6 10 0M59 43q5 6 10 0'} fill="none" stroke={species==='panda'?'#fff1db':'#62584d'} /> : <>
          <ellipse cx="36" cy="42" rx="3.4" ry="4.5" fill={species==='panda'?'#fff1db':'#62584d'} stroke="none" />
          <ellipse cx="64" cy="42" rx="3.4" ry="4.5" fill={species==='panda'?'#fff1db':'#62584d'} stroke="none" />
          <circle cx="37" cy="40" r="1" fill="#fff" stroke="none" /><circle cx="65" cy="40" r="1" fill="#fff" stroke="none" />
        </>}
      </g>
      {bird ? <path d={species==='duck'?'M37 51q13-6 26 0q1 10-13 10q-14 0-13-10Z':'M42 50h16l-8 10Z'} fill="#d8ac6d" /> : species==='pig' ? <>
        <ellipse cx="50" cy="56" rx="13" ry="9" fill={accent} /><path d="M46 54v3M54 54v3" stroke="#795753" />
      </> : <><path d="M46 51q4-3 8 0l-4 4Z" fill={accent} /><path d="M50 56v3m-8 0q8 8 16 0" fill="none" strokeWidth="2" /></>}
      {['cat','mouse','rabbit','hamster'].includes(species) && <path d="M24 54l-10-2M24 59l-10 2M76 54l10-2M76 59l10 2" fill="none" strokeWidth="1.5" />}
    </g>
  </svg>
}
