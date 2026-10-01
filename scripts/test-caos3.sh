#!/bin/bash
# Ronda 3: mundo demo limpio → persecución, escondite, trepar, órdenes, pelota
set -u
cd /home/z/my-project
DL=/home/z/my-project/download

./node_modules/.bin/next dev -p 3000 > dev.log 2>&1 &
SRV=$!
for i in $(seq 1 20); do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null)
  [ "$code" = "200" ] && break
  sleep 2
done
echo "== servidor: $code =="
AB="agent-browser"

$AB open http://localhost:3000 >/dev/null 2>&1
$AB wait --load networkidle >/dev/null 2>&1
sleep 1.5

# ── 0. limpiar localStorage y recargar → proyecto demo fresco ──
$AB storage local clear >/dev/null 2>&1
$AB reload >/dev/null 2>&1
$AB wait --load networkidle >/dev/null 2>&1
sleep 2

$AB eval "
(() => {
  const b=[...document.querySelectorAll('button')].find(x=>x.innerText.includes('JUGAR AHORA'));
  if(b){ b.click(); return 'portada → ¡JUGAR AHORA!'; }
  return 'sin portada';
})()
" 2>&1 | head -2
sleep 1.5

$AB eval "
(() => {
  const s = window.__emma.getState();
  const pets = s.objects.filter(o => ['dog','cat','mouse'].includes(o.catalogId));
  const spots = s.objects.filter(o => ['bush','box','tree'].includes(o.catalogId));
  return 'mundo demo → mascotas: ' + pets.map(p=>p.catalogId).join(',') + ' | escondites/trepaderas: ' + spots.length + ' | modo: ' + s.mode;
})()
" 2>&1 | head -3

# ── A. PERSECUCIÓN + temblor (medir en el momento) ──────────
$AB eval "
(() => {
  const st = window.__emma;
  const s = st.getState();
  const dog = s.objects.find(o => o.catalogId==='dog');
  const cat = s.objects.find(o => o.catalogId==='cat');
  st.setState({ objects: s.objects.map(o => o.id===cat.id ? {...o, x: dog.x+6, y: dog.y+2} : o) });
  return 'gato junto al perro';
})()
" 2>&1 | head -2
sleep 0.6
$AB eval "
(() => {
  const s = window.__emma.getState();
  const cat = s.objects.find(o => o.catalogId==='cat');
  const rt = s.pets[cat.id];
  return 'PERSECUCIÓN: gato chaseUntil activo=' + (rt.chaseUntil > Date.now()) + ' rol=' + rt.chaseRole + ' | pantalla tiembla=' + (Date.now() < s.shakeUntil) + ' | clase shake en DOM=' + !!document.querySelector('.canvas-shake') + ' | cara 😱=' + document.body.innerText.includes('¡Miaaaau!');
})()
" 2>&1 | head -3
$AB screenshot $DL/emma3-persecucion.png >/dev/null 2>&1

# ── B. ESCONDITE: arbusto cerca del gato ─────────────────────
$AB eval "
(() => {
  const st = window.__emma;
  const s = st.getState();
  const cat = s.objects.find(o => o.catalogId==='cat');
  const bush = s.objects.find(o => o.catalogId==='bush');
  const dog = s.objects.find(o => o.catalogId==='dog');
  if (!bush) return 'SIN arbusto en el mundo';
  st.setState({
    objects: s.objects.map(o => {
      if (o.id===bush.id) return {...o, x: Math.min(92, dog.x+22), y: Math.min(90, dog.y+14)};
      return o;
    }),
  });
  // nueva persecución: pegar gato al perro de nuevo (cooldown 30s por pareja… usaré al RATÓN)
  const mouse = s.objects.find(o => o.catalogId==='mouse');
  if (mouse) st.setState({ objects: st.getState().objects.map(o => o.id===mouse.id ? {...o, x: dog.x+4, y: dog.y} : o) });
  return 'ratón soltado junto al perro, arbusto cerca';
})()
" 2>&1 | head -3
sleep 2.5
$AB eval "
(() => {
  const s = window.__emma.getState();
  const mouse = s.objects.find(o => o.catalogId==='mouse');
  const rt = mouse ? s.pets[mouse.id] : null;
  const cat = s.objects.find(o => o.catalogId==='cat');
  const rtc = cat ? s.pets[cat.id] : null;
  return 'ratón: hiding=' + (rt?.hiding ? '✓' : 'no') + ' | gato: hiding=' + (rtc?.hiding ? '✓' : 'no') + ' onTop=' + (rtc?.onTopOf ? '✓' : 'no') + ' | 👀 DOM: ' + document.body.innerText.includes('👀');
})()
" 2>&1 | head -3
$AB screenshot $DL/emma3-escondite.png >/dev/null 2>&1

# ── C. TREPAR al árbol (sin arbusto delante) ─────────────────
$AB eval "
(() => {
  const st = window.__emma;
  const s = st.getState();
  // quitar arbusto y caja para que la escapatoria sea el ÁRBOL
  st.setState({ objects: s.objects.filter(o => o.catalogId!=='bush' && o.catalogId!=='box') });
  const s2 = st.getState();
  const cat = s2.objects.find(o => o.catalogId==='cat');
  const tree = s2.objects.find(o => o.catalogId==='tree');
  const dog = s2.objects.find(o => o.catalogId==='dog');
  st.setState({
    objects: s2.objects.map(o => {
      if (o.id===tree.id) return {...o, x: Math.max(8, Math.min(92, dog.x+18)), y: Math.max(18, Math.min(90, dog.y-10))};
      if (o.id===cat.id) return {...o, x: Math.min(94, dog.x+4), y: dog.y+1};
      return o;
    }),
  });
  return 'solo el árbol como refugio, gato pegado al perro';
})()
" 2>&1 | head -2
sleep 3
$AB eval "
(() => {
  const s = window.__emma.getState();
  const cat = s.objects.find(o => o.catalogId==='cat');
  const rt = s.pets[cat.id];
  return 'gato: onTopOf=' + (rt.onTopOf ? '✓ TREPADO al árbol' : 'no') + ' | hiding=' + (rt.hiding ? 'sí' : 'no') + ' | ✨ DOM: ' + document.body.innerText.includes('✨');
})()
" 2>&1 | head -3
$AB screenshot $DL/emma3-trepar.png >/dev/null 2>&1

# ── D. ÓRDENES: seleccionar gato → ¡Quieto! ──────────────────
$AB eval "
(() => {
  const st = window.__emma;
  const s = st.getState();
  const cat = s.objects.find(o => o.catalogId==='cat');
  st.setState({ selectedId: cat.id });
  const b=[...document.querySelectorAll('button')].find(x=>x.innerText.includes('¡Quieto!'));
  if(!b) return 'botón NO existe (¿modo juego?) modo=' + s.mode;
  b.click();
  return '¡Quieto! → ' + cat.name;
})()
" 2>&1 | head -2
sleep 0.7
$AB eval "
(() => {
  const s = window.__emma.getState();
  const rt = s.pets[s.selectedId];
  return 'obey: ' + (rt?.obey ? rt.obey.cmd : 'NINGUNO') + ' | monedas: ' + s.coins + ' | chip ✋ DOM: ' + document.body.innerText.includes('✋');
})()
" 2>&1 | head -3

# ── E. PELOTA completa ───────────────────────────────────────
$AB eval "
(() => {
  const st = window.__emma;
  const b=[...document.querySelectorAll('button')].find(x=>x.innerText.includes('Pelota'));
  if(!b) return 'NO botón pelota';
  b.click();
  return 'ballPending: ' + st.getState().ballPending;
})()
" 2>&1 | head -2
$AB eval "
(() => {
  const st = window.__emma;
  const s = st.getState();
  const dog = s.objects.find(o => o.catalogId==='dog');
  // clic REAL en el lienzo donde está ballPending
  st.getState().throwBallAt(Math.max(6, Math.min(94, dog.x + 28)), Math.max(12, Math.min(88, dog.y + 6)));
  return 'throwBallAt lanzado';
})()
" 2>&1 | head -2
sleep 0.4
$AB eval "
(() => {
  const s = window.__emma.getState();
  return 'pelota: ' + (s.ball ? '✓ en juego' : '✗ no apareció');
})()
" 2>&1 | head -2
sleep 4
$AB eval "
(() => {
  const s = window.__emma.getState();
  const dog = s.objects.find(o => o.catalogId==='dog');
  return 'perro fue a por ella → pelota recogida: ' + (!s.ball) + ' | monedas: ' + s.coins;
})()
" 2>&1 | head -2

# ── F. editor: escondites en pestañas (biblioteca escritorio) ──
$AB eval "
(() => {
  const b=[...document.querySelectorAll('button')].find(x=>x.innerText.includes('Editar'));
  b?.click();
  return 'editar';
})()
" 2>&1 | head -2
sleep 1.2
$AB eval "
(() => {
  const aside = document.querySelector('[aria-label=\"Biblioteca de objetos\"]');
  if (!aside) return 'sin biblioteca visible (¿móvil?)';
  const tabs = [...aside.querySelectorAll('[role=tab]')];
  const grab = () => aside.innerText;
  const p1 = new Promise(r => {
    tabs[1]?.click();
    setTimeout(() => {
      const casa = ['Caja','Casita','Estantería','Sofá'].filter(n => grab().includes(n)).length;
      r(casa);
    }, 250);
  });
  return p1.then(async (casa) => {
    const tabs2 = [...document.querySelectorAll('[aria-label=\"Biblioteca de objetos\"] [role=tab]')];
    tabs2[2]?.click();
    await new Promise(r => setTimeout(r, 250));
    const aside2 = document.querySelector('[aria-label=\"Biblioteca de objetos\"]');
    const nat = ['Arbusto','Tienda','Piedra','Árbol','Pino'].filter(n => aside2.innerText.includes(n)).length;
    return 'casa: ' + casa + '/4 | naturaleza: ' + nat + '/5';
  });
})()
" 2>&1 | head -3

# ── G. móvil 390 ─────────────────────────────────────────────
$AB set viewport 390 844 >/dev/null 2>&1
sleep 0.8
$AB eval "
(() => {
  const b=[...document.querySelectorAll('button')].find(x=>x.innerText.includes('¡JUGAR!'));
  if(!b) return 'NO ¡JUGAR!';
  b.click();
  return 'móvil: jugando';
})()
" 2>&1 | head -2
sleep 1.5
$AB eval "
(() => {
  const s = window.__emma.getState();
  const t = document.body.innerText;
  return 'modo: ' + s.mode + ' | ÓRDENES: ' + t.includes('ÓRDENES') + ' | 🎾 Pelota: ' + t.includes('Pelota');
})()
" 2>&1 | head -3
$AB screenshot $DL/emma3-movil-juego.png >/dev/null 2>&1

echo "== errores JS: =="
$AB errors 2>&1 | tail -5
kill $SRV 2>/dev/null
echo "== FIN R3 =="
