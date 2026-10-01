#!/bin/bash
set -u
cd /home/z/my-project
./node_modules/.bin/next dev -p 3000 > dev.log 2>&1 &
SRV=$!
for i in $(seq 1 20); do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null)
  [ "$code" = "200" ] && break
  sleep 2
done
AB="agent-browser"
$AB set viewport 1280 800 >/dev/null 2>&1
$AB open http://localhost:3000 >/dev/null 2>&1
$AB wait --load networkidle >/dev/null 2>&1
sleep 1.5
$AB eval "
(() => {
  [...document.querySelectorAll('button')].find(x=>x.innerText.includes('PRIMERO'))?.click();
  return 'cerrada';
})()
" >/dev/null 2>&1
sleep 0.8
$AB eval "
(() => {
  const vis = [...document.querySelectorAll('[aria-label=\"Biblioteca de objetos\"]')].find(a => a.offsetParent !== null);
  if (!vis) return 'sin aside visible';
  const tabs = [...vis.querySelectorAll('[role=tab]')];
  const info0 = tabs.map(t => t.getAttribute('data-state') + ':' + (t.getAttribute('aria-label')||t.innerText)).join(' | ');
  tabs[1].click();
  return new Promise(r => setTimeout(() => {
    const states = [...vis.querySelectorAll('[role=tab]')].map(t => t.getAttribute('data-state')).join(',');
    const txt = vis.innerText.replace(/\n/g, ' ').slice(0, 200);
    r('ANTES: ' + info0 + ' || DESPUÉS click tab1: estados=' + states + ' || texto=' + txt);
  }, 400));
})()
" 2>&1 | head -4
kill $SRV 2>/dev/null
echo FIN
