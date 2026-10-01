#!/bin/bash
# Prueba integral de Emma Care Studio v0.3 "¡Caos divertido!"
# Arranca el servidor y ejecuta todas las verificaciones en una sola sesión.
set -u
cd /home/z/my-project
DL=/home/z/my-project/download

# ── 1. servidor ──────────────────────────────────────────────
./node_modules/.bin/next dev -p 3000 > dev.log 2>&1 &
SRV=$!
for i in $(seq 1 20); do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null)
  [ "$code" = "200" ] && break
  sleep 2
done
echo "== servidor: $code =="

AB="agent-browser"

# ── 2. portada ───────────────────────────────────────────────
$AB open http://localhost:3000 >/dev/null 2>&1
$AB wait --load networkidle >/dev/null 2>&1
sleep 2
echo "== errores consola tras abrir: =="
$AB errors 2>&1 | tail -3
$AB screenshot $DL/emma3-portada.png >/dev/null 2>&1
echo "portada ok"

# ── 3. entrar al juego (portada → JUGAR AHORA) ──────────────
$AB find text "¡JUGAR AHORA!" click >/dev/null 2>&1 || $AB find role button click --name "▶️ ¡JUGAR AHORA!" >/dev/null 2>&1
sleep 2
echo "== textos del modo juego: =="
$AB eval "document.body.innerText.slice(0,400)" 2>&1 | head -12

# ── 4. mascotas del demo (perro+gato+ratón) y estado del motor ──
$AB eval "
(() => {
  const s = window.__emma.getState();
  const pets = s.objects.filter(o => ['dog','cat','mouse'].includes(o.catalogId));
  return 'mascotas demo: ' + pets.map(p=>p.name+':'+p.catalogId).join(', ') + ' | monedas: ' + s.coins;
})()
" 2>&1 | head -4

# ── 5. ¡FORZAR PERSECUCIÓN! colocar al gato al lado del perro ──
$AB eval "
(() => {
  const st = window.__emma;
  const s = st.getState();
  const dog = s.objects.find(o => o.catalogId==='dog');
  const cat = s.objects.find(o => o.catalogId==='cat');
  st.setState({ objects: s.objects.map(o => o.id===cat.id ? {...o, x: dog.x+6, y: dog.y+2} : o) });
  return 'gato colocado junto al perro';
})()
" 2>&1 | head -3
sleep 1.5
$AB eval "
(() => {
  const s = window.__emma.getState();
  const chasers = Object.entries(s.pets).filter(([,rt]) => rt.chaseUntil > Date.now());
  return 'persecución activa: ' + chasers.map(([id,rt]) => id+'→'+rt.chaseRole).join(', ') + ' | shake: ' + (Date.now() < s.shakeUntil);
})()
" 2>&1 | head -4
$AB screenshot $DL/emma3-persecucion.png >/dev/null 2>&1
echo "captura persecución"

# ── 6. dar la orden ¡QUIETO! a la presa (selección por chip) ──
$AB eval "
(() => {
  const st = window.__emma;
  const s = st.getState();
  const prey = Object.entries(s.pets).find(([,rt]) => rt.chaseRole==='flee');
  if (prey) { st.setState({ selectedId: prey[0] }); return 'presa seleccionada: ' + prey[0]; }
  return 'no hay persecución activa';
})()
" 2>&1 | head -3
$AB find text "¡Quieto!" click >/dev/null 2>&1
sleep 0.8
$AB eval "
(() => {
  const s = window.__emma.getState();
  const sel = s.pets[s.selectedId];
  return 'obey: ' + (sel?.obey ? sel.obey.cmd : 'ninguno') + ' | monedas: ' + s.coins;
})()
" 2>&1 | head -3

# ── 7. pelota: activar modo y lanzar ─────────────────────────
$AB find text "Pelota" click >/dev/null 2>&1
sleep 0.5
$AB eval "
(() => {
  const s = window.__emma.getState();
  return 'ballPending: ' + s.ballPending;
})()
" 2>&1 | head -2
# clic en el lienzo (área vacía abajo a la izquierda)
$AB eval "
(() => {
  const cv = document.querySelector('[role=application]');
  const r = cv.getBoundingClientRect();
  cv.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: r.left + r.width*0.35, clientY: r.top + r.height*0.75 }));
  return 'lanzada';
})()
" 2>&1 | head -2
sleep 0.7
$AB eval "
(() => {
  const s = window.__emma.getState();
  return 'pelota en juego: ' + (s.ball ? ('x='+s.ball.x.toFixed(0)+' y='+s.ball.y.toFixed(0)) : 'ninguna') + ' | pending: ' + s.ballPending;
})()
" 2>&1 | head -3
sleep 4
$AB eval "
(() => {
  const s = window.__emma.getState();
  return 'tras 4s, pelota recogida: ' + (!s.ball) + ' | monedas: ' + s.coins;
})()
" 2>&1 | head -3

# ── 8. caricia con el dedo (frotar al perro) ─────────────────
$AB eval "
(() => {
  const st = window.__emma;
  const s = st.getState();
  const dog = s.objects.find(o => o.catalogId==='dog');
  st.setState({ selectedId: dog.id });
  window.__f0 = s.pets[dog.id].stats.felicidad;
  const cv = document.querySelector('[role=application]');
  const r = cv.getBoundingClientRect();
  const px = r.left + (dog.x/100)*r.width, py = r.top + (dog.y/100)*r.height;
  let target = null;
  document.querySelectorAll('[role=application] > div').forEach(d => {
    const b = d.getBoundingClientRect();
    if (px >= b.left-6 && px <= b.right+6 && py >= b.top-6 && py <= b.bottom+28) target = d;
  });
  if (!target) return 'no encontré la mascota';
  target.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1, clientX: px-30, clientY: py }));
  for (let i=1; i<=8; i++) {
    target.dispatchEvent(new PointerEvent('pointermove', { bubbles:true, pointerId:1, clientX: px-30+i*9, clientY: py }));
  }
  target.dispatchEvent(new PointerEvent('pointerup', { bubbles:true, pointerId:1, clientX: px+42, clientY: py }));
  return 'caricia frotada sobre: ' + (target.textContent||'').slice(0,14);
})()
" 2>&1 | head -3
sleep 0.6
$AB eval "
(() => {
  const s = window.__emma.getState();
  const dog = s.objects.find(o => o.catalogId==='dog');
  const f1 = s.pets[dog.id].stats.felicidad;
  return 'felicidad del perro: ' + Math.round(window.__f0) + ' → ' + Math.round(f1) + (f1 > window.__f0 ? ' ✓ caricia funcionó' : ' ✗');
})()
" 2>&1 | head -3

# ── 9. eventos: lluvia forzada + regalo ──────────────────────
$AB eval "
(() => {
  const st = window.__emma;
  st.setState({ event: { kind: 'lluvia', until: Date.now() + 30000 } });
  return 'lluvia activada';
})()
" 2>&1 | head -2
sleep 0.8
$AB eval "
(() => {
  const drops = document.querySelectorAll('.rain-drop').length;
  const banner = document.body.innerText.includes('¡Lluvia!');
  return 'gotas de lluvia: ' + drops + ' | aviso visible: ' + banner;
})()
" 2>&1 | head -3
$AB screenshot $DL/emma3-lluvia.png >/dev/null 2>&1
$AB eval "
(() => {
  const st = window.__emma;
  const c0 = st.getState().coins;
  window.__c0 = c0;
  st.setState({ event: { kind: 'regalo', until: Date.now() + 25000, x: 50, y: 50 } });
  return 'regalo activado, monedas antes: ' + c0;
})()
" 2>&1 | head -2
sleep 0.8
$AB eval "
(() => {
  const btn = document.querySelector('[aria-label=\"Abrir la caja sorpresa\"]');
  if (!btn) return 'regalo NO visible';
  btn.click();
  return 'regalo pulsado';
})()
" 2>&1 | head -2
sleep 0.6
$AB eval "
(() => {
  const s = window.__emma.getState();
  return 'monedas tras regalo: ' + s.coins + (s.coins > window.__c0 ? ' ✓ premio' : ' (fiesta)');
})()
" 2>&1 | head -3

# ── 10. biblioteca: 15 mascotas en el editor ─────────────────
$AB find text "Editar" click >/dev/null 2>&1
sleep 1.2
$AB eval "
(() => {
  const tab = document.querySelectorAll('[role=tab]')[0];
  if (tab) tab.click();
  return 'pestaña mascotas';
})()
" 2>&1 | head -2
sleep 0.8
$AB eval "
(() => {
  const aside = document.querySelector('[aria-label=\"Biblioteca de objetos\"]');
  const names = aside ? aside.innerText : '';
  const pets = ['Perro','Gato','Conejo','Ratón','Pajarito','Hámster','Gallina','Pato','Zorro','Oso','Panda','León','Cerdito','Monito','Tortuga'];
  const found = pets.filter(p => names.includes(p));
  const spots = ['Caja','Casita','Estantería','Tienda','Arbusto'].filter(p => names.includes(p));
  return 'mascotas en biblioteca: ' + found.length + '/15 | escondites: ' + spots.length + '/5';
})()
" 2>&1 | head -3
$AB screenshot $DL/emma3-editor.png >/dev/null 2>&1

# ── 11. vista móvil 390px: juego completo ────────────────────
$AB set viewport 390 844 >/dev/null 2>&1
sleep 0.8
$AB find text "¡JUGAR!" click >/dev/null 2>&1
sleep 1.5
$AB eval "
(() => {
  const s = window.__emma.getState();
  return 'modo: ' + s.mode + ' | HUD órdenes: ' + document.body.innerText.includes('ÓRDENES:');
})()
" 2>&1 | head -3
$AB screenshot $DL/emma3-movil-juego.png >/dev/null 2>&1
echo "captura móvil"

# ── 12. errores finales ──────────────────────────────────────
echo "== errores JS finales: =="
$AB errors 2>&1 | tail -6

kill $SRV 2>/dev/null
echo "== FIN =="
