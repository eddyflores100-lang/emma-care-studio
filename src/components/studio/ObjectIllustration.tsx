import { memo } from 'react'
const DRAWINGS: Record<string, React.ReactNode> = {
  house: <><path d="M16 50L50 18 84 50v43H16Z" fill="#fff0f8" /><path d="M9 50L50 12l41 38-8 8-33-30-33 30Z" fill="#e9b2d6" /><path d="M40 93V63h20v30" fill="#bbe1d8" /><rect x="23" y="59" width="12" height="13" rx="2" fill="#b6d6d5" /><circle cx="54" cy="79" r="2" fill="#655674" stroke="none" /></>,
  bed: <><path d="M12 83V41h76v42" fill="#dac5e8" /><rect x="15" y="52" width="70" height="26" rx="8" fill="#f6e7d0" /><path d="M16 65h69v19H16Z" fill="#c2b9ee" /><rect x="21" y="49" width="24" height="14" rx="5" fill="#fff9ec" /><path d="M18 84v10M83 84v10" /></>,
  bowl: <><ellipse cx="50" cy="58" rx="35" ry="12" fill="#d5b5d0" /><path d="M15 57l8 28q27 12 54 0l8-28q-35 19-70 0Z" fill="#efb9d9" /><ellipse cx="50" cy="57" rx="27" ry="7" fill="#b28ca7" /><path d="M30 54l7-4 6 6 8-4 8 4 7-5" fill="none" stroke="#ddbf8a" strokeWidth="4" /><path d="M42 77q8-7 16 0q-8 10-16 0Z" fill="#fff1db" stroke="none" /></>,
  water: <><path d="M16 59l8 26q26 12 52 0l8-26" fill="#a1c8c9" /><ellipse cx="50" cy="59" rx="34" ry="11" fill="#c4e5e2" /><ellipse cx="50" cy="59" rx="26" ry="6" fill="#87bfc8" /><path d="M50 15q-18 22-12 29q12 12 24 0q6-7-12-29Z" fill="#9dcdd4" /><path d="M44 33q-5 8 0 9" stroke="#e8f7ef" strokeWidth="3" /></>,
  bath: <><path d="M14 55h72l-8 26q-28 14-56 0Z" fill="#fff5df" /><rect x="10" y="51" width="80" height="9" rx="4" fill="#c7dbce" /><path d="M25 85l-4 8M75 85l4 8M72 50V32q-12-13-15 0" fill="none" /><circle cx="34" cy="44" r="8" fill="#cce6e2" /><circle cx="49" cy="45" r="11" fill="#eaf7f0" /><circle cx="44" cy="30" r="5" fill="#eaf7f0" /></>,
  sofa: <><rect x="20" y="38" width="60" height="37" rx="12" fill="#c8bce8" /><rect x="12" y="56" width="76" height="30" rx="9" fill="#c8bce8" /><path d="M25 65h50M50 43v21M22 86v8M78 86v8" /><rect x="9" y="55" width="14" height="24" rx="6" fill="#b1a0d7" /><rect x="77" y="55" width="14" height="24" rx="6" fill="#b1a0d7" /><rect x="31" y="47" width="17" height="15" rx="4" fill="#efd4b3" /></>,
  box: <><path d="M16 42L50 30l34 12v44L50 98 16 86Z" fill="#d9b182" /><path d="M50 53v45M16 42l34 11 34-11" fill="none" /><path d="M16 42L7 28l32-11 11 13 11-13 32 11-9 14-34 11Z" fill="#ead0a3" /><path d="M66 62v12M60 69h12" stroke="#a07d57" /></>,
  tree: <><path d="M43 60h14l5 38H38Z" fill="#d3b9cc" /><path d="M50 5q25 0 26 19q26 3 17 28q-4 18-30 16q-13 11-28 0Q5 72 8 49q-9-21 18-25Q27 5 50 5Z" fill="#a2dac1" /><path d="M25 41q6-13 17-11M62 49q12 5 20-5" stroke="#b4cf9e" fill="none" strokeWidth="4" /></>,
  pine: <><path d="M45 78h10v20H45Z" fill="#d3b9cc" /><path d="M50 7L22 43h13L13 71h16L9 90h82L71 71h16L65 43h13Z" fill="#99d2bf" /><path d="M35 44h26M29 71h39" stroke="#b2c99d" /></>,
  palm: <><path d="M43 97q13-36 5-65l11 2q11 35-2 63Z" fill="#bd9a6d" /><path d="M51 31Q20 1 4 34q29-15 47 0Q22 19 10 59q22-23 43-24q17 15 34 39q9-32-29-42q19-14 39-5q-8-29-37-10Q63 0 82 4Q55-11 51 31Z" fill="#a7ddc4" /><path d="M46 74l13 2M49 56l12 2" /></>,
  bush: <><path d="M10 82Q0 57 22 53q-3-28 22-24q19-21 33 10q25-1 15 28q18 26-22 27H27Q14 93 10 82Z" fill="#b9e3cd" /><path d="M25 69q0-13 12-11M56 74q9-13 20-10" fill="none" stroke="#bdd1a0" strokeWidth="4" /></>,
  pond: <><ellipse cx="50" cy="73" rx="44" ry="24" fill="#b2c796" /><ellipse cx="50" cy="71" rx="36" ry="18" fill="#94c8ca" /><path d="M27 72q8-5 15 0M54 78q8 4 17-1" fill="none" stroke="#d8eae1" strokeWidth="3" /><path d="M55 61q14-17 25 0q-12 8-25 0Z" fill="#88ad87" /></>,
  toy: <><circle cx="27" cy="24" r="12" fill="#e0c3ef" /><circle cx="73" cy="24" r="12" fill="#e0c3ef" /><ellipse cx="50" cy="73" rx="25" ry="25" fill="#e0c3ef" /><ellipse cx="23" cy="74" rx="12" ry="15" fill="#e0c3ef" /><ellipse cx="77" cy="74" rx="12" ry="15" fill="#e0c3ef" /><ellipse cx="32" cy="97" rx="13" ry="8" fill="#e0c3ef" /><ellipse cx="68" cy="97" rx="13" ry="8" fill="#e0c3ef" /><circle cx="50" cy="40" r="28" fill="#e0c3ef" /><ellipse cx="50" cy="51" rx="13" ry="10" fill="#ecd4b0" /><path d="M46 48h8l-4 4Z" fill="#655674" /><path d="M37 37h0M63 37h0" strokeWidth="5" /><path d="M35 70l15 7-15 7ZM65 70L50 77l15 7Z" fill="#f1b3d5" /></>,
}
export const ObjectIllustration = memo(function ObjectIllustration({ species, fallback }: { species: string; fallback: string }) {
  const drawing = DRAWINGS[species]
  if (!drawing) return <>{fallback}</>
  return <svg className="object-illustration" viewBox="0 0 100 108" aria-hidden="true" focusable="false">
    <g stroke="#655674" strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round">{drawing}</g>
  </svg>
})
