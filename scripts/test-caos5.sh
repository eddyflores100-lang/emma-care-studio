#!/bin/bash
# Ronda 5 (cierre): biblioteca con aside VISIBLE + móvil con mascota seleccionada
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

$AB set viewport 1280 800 >/dev/null 2>&1
$AB open http://localhost:3000 >/dev/null 2>&1
$AB wait --load networkidle >/dev/null 2>&1
sleep 1.5
$AB storage local clear >/dev/null 2>&1
$AB reload >/dev/null 2>&1
$AB wait --load networkidle >/dev/null 2>&1
sleep 2
$AB eval "
(() => {
  [...document.querySelectorAll('button')].find(x=>x.innerText.includes('PRIMERO'))?.click();
  return 'portada cerrada (construir)';
})()
" 2>&1 | head -2
sleep 1

# ── A. biblioteca en el aside VISIBLE (escritorio) ───────────
$AB eval "
(() => {
  const vis = [...document.querySelectorAll('[aria-label=\"Biblioteca de objetos\"]')].find(a => a.offsetParent !== null);
  if (!vis) return 'ningún aside visible';
  const tabs = [...vis.querySelectorAll('[role=tab]')];
  const check = (names) => {
    const a = [...document.querySelectorAll('[aria-label=\"Biblioteca de objetos\"]')].find(x => x.offsetParent !== null);
    return names.filter(n => a.innerText.includes(n)).length;
  };
  return new Promise(r => {
    tabs[1]?.click();
    setTimeout(() => {
      const casa = check(['Caja','Casita','Estantería','Sofá']);
      const t2 = [...document.querySelectorAll('[aria-label=\"Biblioteca de objetos\"]')].find(x => x.offsetParent !== null).querySelectorAll('[role=tab]');
      t2[2]?.click();
      setTimeout(() => {
        const nat = check(['Arbusto','Tienda','Piedra','Árbol','Pino']);
        const t3 = [...document.querySelectorAll('[aria-label=\"Biblioteca de objetos\"]')].find(x => x.offsetParent !== null).querySelectorAll('[role=tab]');
        t3[0]?.click();
        setTimeout(() => r('BIBLIOTECA → casa: ' + casa + '/4 | naturaleza: ' + nat + '/5'), 250);
      }, 250);
    }, 250);
  });
})()
" 2>&1 | head -3

# ── B. móvil: seleccionar mascota → ÓRDENES visibles ─────────
$AB set viewport 390 844 >/dev/null 2>&1
sleep 0.8
$AB eval "
(() => {
  const b=[...document.querySelectorAll('button')].find(x=>x.innerText.includes('¡JUGAR!'));
  b?.click(); return 'móvil jugando';
})()
" 2>&1 | head -2
sleep 1.3
$AB eval "
(() => {
  const st = window.__emma;
  const s = st.getState();
  const dog = s.objects.find(o => o.catalogId==='dog');
  // tocar la mascota en el lienzo (como lo haría Emma)
  const cv = document.querySelector('[role=application]');
  const r = cv.getBoundingClientRect();
  const px = r.left + (dog.x/100)*r.width, py = r.top + (dog.y/100)*r.height;
  let target = null;
  document.querySelectorAll('[role=application] > div').forEach(d => {
    const b = d.getBoundingClientRect();
    if (px >= b.left-8 && px <= b.right+8 && py >= b.top-8 && py <= b.bottom+30) target = d;
  });
  target?.dispatchEvent(new PointerEvent('pointerdown', { bubbles:true, pointerId:1, clientX:px, clientY:py }));
  target?.dispatchEvent(new PointerEvent('pointerup', { bubbles:true, pointerId:1, clientX:px, clientY:py }));
  target?.click();
  return 'tocado: ' + (target ? (target.textContent||'').slice(0,10) : 'no encontrado');
})()
" 2>&1 | head -2
sleep 0.7
$AB eval "
(() => {
  const s = window.__emma.getState();
  const t = document.body.innerText;
  return 'seleccionado: ' + (s.selectedId ? '✓' : 'no') + ' | ÓRDENES: ' + t.includes('ÓRDENES') + ' | 🎾 Pelota: ' + t.includes('Pelota') + ' | ¡Sentado!: ' + t.includes('¡Sentado!');
})()
" 2>&1 | head -3
$AB screenshot $DL/emma3-movil-juego.png >/dev/null 2>&1

# ── C. captura final de escritorio en juego ──────────────────
$AB set viewport 1280 800 >/dev/null 2>&1
sleep 0.8
$AB eval "
(() => {
  const st = window.__emma;
  const s = st.getState();
  const dog = s.objects.find(o => o.catalogId==='dog');
  const mouse = s.objects.find(o => o.catalogId==='mouse');
  st.setState({
    objects: s.objects.map(o => o.id===mouse.id ? {...o, x: dog.x+7, y: dog.y+1} : o),
    pets: {...s.pets, [dog.id]: {...s.pets[dog.id], pairCd: {}}},
  });
  return 'persecución final para captura';
})()
" 2>&1 | head -2
sleep 1
$AB screenshot $DL/emma3-final.png >/dev/null 2>&1

echo "== errores JS: =="
$AB errors 2>&1 | tail -5
kill $SRV 2>/dev/null
echo "== FIN R5 =="
