#!/bin/bash
# Ronda 6: capturas limpias de juego móvil y persecución en escritorio
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
AB="agent-browser"

$AB set viewport 390 844 >/dev/null 2>&1
$AB open http://localhost:3000 >/dev/null 2>&1
$AB wait --load networkidle >/dev/null 2>&1
sleep 1.5
$AB storage local clear >/dev/null 2>&1
$AB reload >/dev/null 2>&1
$AB wait --load networkidle >/dev/null 2>&1
sleep 2.2
# cerrar portada con JUGAR AHORA (clic real)
$AB eval "
(() => {
  const b=[...document.querySelectorAll('button')].find(x=>x.innerText.toUpperCase().includes('JUGAR AHORA'));
  b?.click(); return 'a jugar';
})()
" >/dev/null 2>&1
sleep 1.6
# tocar al perro
$AB eval "
(() => {
  const st = window.__emma;
  const s = st.getState();
  const dog = s.objects.find(o => o.catalogId==='dog');
  const cv = document.querySelector('[role=application]');
  const r = cv.getBoundingClientRect();
  const px = r.left + (dog.x/100)*r.width, py = r.top + (dog.y/100)*r.height;
  let target = null;
  document.querySelectorAll('[role=application] > div').forEach(d => {
    const b = d.getBoundingClientRect();
    if (px >= b.left-8 && px <= b.right+8 && py >= b.top-8 && py <= b.bottom+30) target = d;
  });
  target?.click();
  return 'tocado ' + dog.name;
})()
" >/dev/null 2>&1
sleep 1
$AB screenshot $DL/emma3-movil-juego.png >/dev/null 2>&1
echo "captura móvil lista"

# escritorio: persecución con ratón
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
  return 'persecución lista';
})()
" 2>&1 | head -2
sleep 1
$AB screenshot $DL/emma3-final.png >/dev/null 2>&1
echo "captura final lista"
$AB errors 2>&1 | tail -3
kill $SRV 2>/dev/null
echo FIN
