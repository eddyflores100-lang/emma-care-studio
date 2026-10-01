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
  const getVis = () => [...document.querySelectorAll('[aria-label=\"Biblioteca de objetos\"]')].find(a => a.offsetParent !== null);
  const vis = getVis();
  const press = (tab) => {
    tab.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1 }));
    tab.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    tab.click();
  };
  const check = (names) => {
    const t = getVis().innerText;
    return names.filter(n => t.includes(n)).length;
  };
  const tabs = () => [...getVis().querySelectorAll('[role=tab]')];
  return new Promise(r => {
    press(tabs()[1]);
    setTimeout(() => {
      const casa = check(['Caja','Casita','Estantería','Sofá']);
      press(tabs()[2]);
      setTimeout(() => {
        const nat = check(['Arbusto','Tienda','Piedra','Árbol','Pino']);
        press(tabs()[0]);
        setTimeout(() => r('BIBLIOTECA → casa: ' + casa + '/4 | naturaleza: ' + nat + '/5 (mousedown+click)'), 250);
      }, 250);
    }, 250);
  });
})()
" 2>&1 | head -3
kill $SRV 2>/dev/null
echo FIN
