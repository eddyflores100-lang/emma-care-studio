#!/bin/bash
# Ronda 2: órdenes, pelota con fetch, escondites/trepar, pestañas editor, móvil
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
sleep 2

# clic JS genérico por texto de botón
CLICKJS='(txt) => { const b=[...document.querySelectorAll("button")].find(x=>x.innerText.includes(txt)); if(b){b.click();return "clic: "+txt;} return "NO encontrado: "+txt; }'

# entrar al juego desde la portada
$AB eval "(() => { const b=[...document.querySelectorAll('button')].find(x=>x.innerText.includes('JUGAR AHORA')); if(b){b.click();return 'portada→juego';} return 'sin portada'; })()" 2>&1 | head -2
sleep 1.5

# ── A. ORDEN ¡QUIETO! al perro ───────────────────────────────
$AB eval "
(() => {
  const st = window.__emma;
  const s = st.getState();
  const dog = s.objects.find(o => o.catalogId==='dog');
  st.setState({ selectedId: dog.id });
  const b=[...document.querySelectorAll('button')].find(x=>x.innerText.includes('¡Quieto!'));
  if(!b) return 'botón ¡Quieto! NO existe';
  b.click();
  return '¡Quieto! pulsado a: '+dog.name;
})()
" 2>&1 | head -3
sleep 0.8
$AB eval "
(() => {
  const s = window.__emma.getState();
  const sel = s.pets[s.selectedId];
  return 'obey: ' + (sel?.obey ? sel.obey.cmd : 'NINGUNO') + ' | monedas: ' + s.coins + ' | HUD chip: ' + document.body.innerText.includes('¡Quieto!');
})()
" 2>&1 | head -3

# ── B. ORDEN ¡VEN! ───────────────────────────────────────────
$AB eval "
(() => {
  const b=[...document.querySelectorAll('button')].find(x=>x.innerText.includes('¡Ven!'));
  if(!b) return 'NO existe ¡Ven!';
  b.click(); return '¡Ven! pulsado';
})()
" 2>&1 | head -2
$AB eval "
(() => {
  const s = window.__emma.getState();
  const dog = s.objects.find(o => o.catalogId==='dog');
  const rt = s.pets[dog.id];
  return 'obey: ' + (rt?.obey ? rt.obey.cmd : 'NINGUNO') + ' | perro en x=' + dog.x.toFixed(0) + ' y=' + dog.y.toFixed(0) + ' (va hacia 50,84)';
})()
" 2>&1 | head -3
sleep 3
$AB eval "
(() => {
  const s = window.__emma.getState();
  const dog = s.objects.find(o => o.catalogId==='dog');
  return 'tras 3s perro en x=' + dog.x.toFixed(0) + ' y=' + dog.y.toFixed(0) + (Math.hypot(dog.x-50, dog.y-84) < 12 ? ' ✓ ¡vino!' : ' ?');
})()
" 2>&1 | head -3

# ── C. PELOTA con fetch del perro ────────────────────────────
$AB eval "
(() => {
  const b=[...document.querySelectorAll('button')].find(x=>x.innerText.includes('Pelota'));
  if(!b) return 'NO existe Pelota';
  b.click(); return 'modo pelota: ' + window.__emma.getState().ballPending;
})()
" 2>&1 | head -2
$AB eval "
(() => {
  const st = window.__emma;
  const s = st.getState();
  const dog = s.objects.find(o => o.catalogId==='dog');
  // lanzar la pelota cerca del perro (para ver el fetch rápido)
  const cv = document.querySelector('[role=application]');
  const r = cv.getBoundingClientRect();
  const bx = Math.max(5, Math.min(95, dog.x + 25));
  const by = Math.max(10, Math.min(90, dog.y));
  st.getState(); // noop
  window.__emma.setState({ ball: null });
  // usar la acción real: throwBallAt
  window.__emma.getState().throwBallAt(bx, by);
  window.__ballx = bx;
  return 'pelota lanzada en x=' + bx.toFixed(0);
})()
" 2>&1 | head -3
sleep 0.5
$AB eval "
(() => {
  const s = window.__emma.getState();
  return 'pelota: ' + (s.ball ? 'en juego ✓' : 'NO apareció ✗') + ' | pending: ' + s.ballPending;
})()
" 2>&1 | head -2
sleep 3.5
$AB eval "
(() => {
  const s = window.__emma.getState();
  const dog = s.objects.find(o => o.catalogId==='dog');
  return 'tras 4s: pelota recogida: ' + (!s.ball) + ' | monedas: ' + s.coins;
})()
" 2>&1 | head -2

# ── D. ESCONDITE: gato huye al arbusto ──────────────────────
$AB eval "
(() => {
  const st = window.__emma;
  const s = st.getState();
  const cat = s.objects.find(o => o.catalogId==='cat');
  const bush = s.objects.find(o => o.catalogId==='bush');
  const dog = s.objects.find(o => o.catalogId==='dog');
  if (!bush) return 'no hay arbusto';
  // gato pegado al perro, arbusto a 12 de distancia
  st.setState({
    objects: s.objects.map(o => {
      if (o.id===cat.id) return {...o, x: dog.x+5, y: dog.y};
      if (o.id===bush.id) return {...o, x: Math.min(94, dog.x+30), y: dog.y+8};
      return o;
    }),
  });
  return 'trampa preparada: perro+gato juntos, arbusto cerca';
})()
" 2>&1 | head -2
sleep 2.5
$AB eval "
(() => {
  const s = window.__emma.getState();
  const cat = s.objects.find(o => o.catalogId==='cat');
  const rt = s.pets[cat.id];
  const chasing = rt.chaseUntil > Date.now();
  return 'gato: chasing=' + chasing + ' hiding=' + (rt.hiding ? '✓ escondido' : 'no') + ' onTop=' + (rt.onTopOf ? '✓ trepado' : 'no') + ' | ojos 👀 en pantalla: ' + document.body.innerText.includes('👀');
})()
" 2>&1 | head -3
$AB screenshot $DL/emma3-escondite.png >/dev/null 2>&1

# ── E. TREPAR: gato al sofá (en casa no hay; en jardín el ÁRBOL) ──
$AB eval "
(() => {
  const st = window.__emma;
  const s = st.getState();
  const cat = s.objects.find(o => o.catalogId==='cat');
  const tree = s.objects.find(o => o.catalogId==='tree');
  const dog = s.objects.find(o => o.catalogId==='dog');
  if (!tree) return 'no hay árbol';
  st.setState({
    objects: s.objects.map(o => {
      if (o.id===tree.id) return {...o, x: Math.max(6, dog.x-30), y: Math.max(20, dog.y-6)};
      return o;
    }),
  });
  // quitar arbustos para forzar que elija el árbol (trepadera)
  const bush = s.objects.find(o => o.catalogId==='bush');
  if (bush) {
    st.setState({ objects: st.getState().objects.filter(o => o.id!==bush.id) });
  }
  return 'árbol colocado lejos del arbusto… esperando nueva persecución';
})()
" 2>&1 | head -2
sleep 2.5
$AB eval "
(() => {
  const s = window.__emma.getState();
  const cat = s.objects.find(o => o.catalogId==='cat');
  const rt = s.pets[cat.id];
  return 'gato: hiding=' + (rt.hiding?'sí':'no') + ' onTopOf=' + (rt.onTopOf?'✓ TREPADO':'no') + ' | chase: ' + (rt.chaseUntil>Date.now());
})()
" 2>&1 | head -3

# ── F. pestañas del editor: escondites en Casa/Naturaleza ────
$AB eval "
(() => {
  const b=[...document.querySelectorAll('button')].find(x=>x.innerText.includes('Editar'));
  if(b) b.click();
  return 'modo edición';
})()
" 2>&1 | head -2
sleep 1
$AB eval "
(() => {
  // escritorio: biblioteca visible con pestañas 🐾🏠🌳
  const tabs = [...document.querySelectorAll('[role=tab]')];
  const res = [];
  for (const t of tabs) {
    t.click();
    // esperar tick
  }
  return 'pestañas: ' + tabs.length;
})()
" 2>&1 | head -2
$AB eval "
(() => {
  const tabs = [...document.querySelectorAll('[role=tab]')];
  const results = [];
  const check = (names) => {
    const aside = document.querySelector('[aria-label=\"Biblioteca de objetos\"]');
    const txt = aside ? aside.innerText : '';
    return names.filter(n => txt.includes(n)).length;
  };
  // casa (tab 🏠)
  tabs[1]?.click();
  return new Promise(r => setTimeout(() => {
    results.push('casa: ' + check(['Caja','Casita','Estantería','Sofá']) + '/4');
    tabs[2]?.click();
    setTimeout(() => {
      results.push('naturaleza: ' + check(['Arbusto','Tienda','Piedra','Árbol']) + '/4');
      r(results.join(' | '));
    }, 300);
  }, 300));
})()
" 2>&1 | head -3

# ── G. móvil 390px con juego ─────────────────────────────────
$AB set viewport 390 844 >/dev/null 2>&1
sleep 0.8
$AB eval "
(() => {
  const b=[...document.querySelectorAll('button')].find(x=>x.innerText.includes('¡JUGAR!'));
  if(!b) return 'NO botón jugar';
  b.click(); return 'jugando en móvil';
})()
" 2>&1 | head -2
sleep 1.5
$AB eval "
(() => {
  const s = window.__emma.getState();
  return 'modo: ' + s.mode + ' | ÓRDENES visibles: ' + document.body.innerText.includes('ÓRDENES') + ' | Pelota: ' + document.body.innerText.includes('Pelota');
})()
" 2>&1 | head -3
$AB screenshot $DL/emma3-movil-juego.png >/dev/null 2>&1

echo "== errores JS: =="
$AB errors 2>&1 | tail -6
kill $SRV 2>/dev/null
echo "== FIN R2 =="
