#!/bin/bash
# Ronda 4: escondite 👀, órdenes con timing correcto, biblioteca escritorio, móvil
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
  const b=[...document.querySelectorAll('button')].find(x=>x.innerText.includes('JUGAR AHORA'));
  b?.click(); return 'juego (demo fresco)';
})()
" 2>&1 | head -2
sleep 1.5

# ── A. ESCONDITE: arbusto pegado al gato, gato pegado al perro ──
$AB eval "
(() => {
  const st = window.__emma;
  const s = st.getState();
  const dog = s.objects.find(o => o.catalogId==='dog');
  const cat = s.objects.find(o => o.catalogId==='cat');
  const bush = s.objects.find(o => o.catalogId==='bush');
  if (!bush) return 'SIN arbusto';
  st.setState({
    objects: s.objects.map(o => {
      if (o.id===cat.id) return {...o, x: dog.x+5, y: dog.y};
      if (o.id===bush.id) return {...o, x: dog.x+13, y: dog.y+3};
      return o;
    }),
    pets: {
      ...s.pets,
      [dog.id]: {...s.pets[dog.id], pairCd: {}},
      [cat.id]: {...s.pets[cat.id], pairCd: {}},
    },
  });
  return 'trampa lista (cooldowns limpiados)';
})()
" 2>&1 | head -2
sleep 2.2
$AB eval "
(() => {
  const s = window.__emma.getState();
  const cat = s.objects.find(o => o.catalogId==='cat');
  const rt = s.pets[cat.id];
  return 'GATO: hiding=' + (rt.hiding ? '✓ ESCONDIDO' : 'no') + ' onTop=' + (rt.onTopOf ? 'sí' : 'no') + ' | ojos 👀: ' + document.body.innerText.includes('👀');
})()
" 2>&1 | head -3
$AB screenshot $DL/emma3-escondite.png >/dev/null 2>&1

# ── B. ORDEN ¡QUIETO! (seleccionar → esperar render → pulsar) ──
$AB eval "
(() => {
  const st = window.__emma;
  const s = st.getState();
  const cat = s.objects.find(o => o.catalogId==='cat');
  st.setState({ selectedId: cat.id });
  return 'gato seleccionado';
})()
" 2>&1 | head -2
sleep 0.6
$AB eval "
(() => {
  window.__c0 = window.__emma.getState().coins;
  const b=[...document.querySelectorAll('button')].find(x=>x.innerText.includes('¡Quieto!'));
  if(!b) return '¡Quieto! NO encontrado';
  b.click(); return 'pulsado ¡Quieto!';
})()
" 2>&1 | head -2
sleep 0.7
$AB eval "
(() => {
  const s = window.__emma.getState();
  const rt = s.pets[s.selectedId];
  return 'obey: ' + (rt?.obey ? rt.obey.cmd : 'NINGUNO') + ' | monedas: ' + window.__c0 + '→' + s.coins;
})()
" 2>&1 | head -3

# ── C. ORDEN ¡VEN! con el perro ──────────────────────────────
$AB eval "
(() => {
  const st = window.__emma;
  const s = st.getState();
  const dog = s.objects.find(o => o.catalogId==='dog');
  st.setState({ selectedId: dog.id });
  return 'perro seleccionado, está en x=' + dog.x.toFixed(0) + ' y=' + dog.y.toFixed(0);
})()
" 2>&1 | head -2
sleep 0.5
$AB eval "
(() => {
  const b=[...document.querySelectorAll('button')].find(x=>x.innerText.includes('¡Ven!'));
  if(!b) return 'NO ¡Ven!';
  b.click(); return 'pulsado ¡Ven!';
})()
" 2>&1 | head -2
sleep 3
$AB eval "
(() => {
  const s = window.__emma.getState();
  const dog = s.objects.find(o => o.catalogId==='dog');
  const d = Math.hypot(dog.x-50, dog.y-84);
  return 'perro tras ¡Ven!: x=' + dog.x.toFixed(0) + ' y=' + dog.y.toFixed(0) + ' → distancia al dueño: ' + d.toFixed(0) + (d < 14 ? ' ✓ ¡vino!' : ' ✗');
})()
" 2>&1 | head -3

# ── D. biblioteca escritorio: escondites por pestaña ─────────
$AB eval "
(() => {
  const b=[...document.querySelectorAll('button')].find(x=>x.innerText.includes('Editar'));
  b?.click(); return 'editar (escritorio)';
})()
" 2>&1 | head -2
sleep 1.2
$AB eval "
(() => {
  const aside = document.querySelector('[aria-label=\"Biblioteca de objetos\"]');
  if (!aside) return 'SIN biblioteca';
  const tabs = [...aside.querySelectorAll('[role=tab]')];
  const check = (names) => {
    const t = document.querySelector('[aria-label=\"Biblioteca de objetos\"]').innerText;
    return names.filter(n => t.includes(n)).length;
  };
  return new Promise(r => {
    tabs[1]?.click();
    setTimeout(() => {
      const casa = check(['Caja','Casita','Estantería','Sofá']);
      const tabs2 = [...document.querySelectorAll('[aria-label=\"Biblioteca de objetos\"] [role=tab]')];
      tabs2[2]?.click();
      setTimeout(() => {
        const nat = check(['Arbusto','Tienda','Piedra','Árbol','Pino']);
        const tabs3 = [...document.querySelectorAll('[aria-label=\"Biblioteca de objetos\"] [role=tab]')];
        tabs3[0]?.click();
        setTimeout(() => {
          const pets = check(['Perro','Gato','Ratón','Tortuga']);
          r('casa: ' + casa + '/4 | naturaleza: ' + nat + '/5 | mascotas: ' + pets + '/4');
        }, 250);
      }, 250);
    }, 250);
  });
})()
" 2>&1 | head -3
$AB screenshot $DL/emma3-editor.png >/dev/null 2>&1

# ── E. móvil 390 ─────────────────────────────────────────────
$AB set viewport 390 844 >/dev/null 2>&1
sleep 0.8
$AB eval "
(() => {
  const b=[...document.querySelectorAll('button')].find(x=>x.innerText.includes('¡JUGAR!'));
  if(!b) return 'NO ¡JUGAR!';
  b.click(); return 'móvil jugando';
})()
" 2>&1 | head -2
sleep 1.5
$AB eval "
(() => {
  const s = window.__emma.getState();
  const t = document.body.innerText;
  return 'modo: ' + s.mode + ' | ÓRDENES: ' + t.includes('ÓRDENES') + ' | Pelota: ' + t.includes('Pelota');
})()
" 2>&1 | head -3
$AB screenshot $DL/emma3-movil-juego.png >/dev/null 2>&1

# ── F. de vuelta a escritorio para captura de persecución ────
$AB set viewport 1280 800 >/dev/null 2>&1
sleep 0.8
$AB eval "
(() => {
  const st = window.__emma;
  const s = st.getState();
  const dog = s.objects.find(o => o.catalogId==='dog');
  const mouse = s.objects.find(o => o.catalogId==='mouse');
  st.setState({
    objects: s.objects.map(o => o.id===mouse.id ? {...o, x: dog.x+6, y: dog.y+1} : o),
    pets: {...s.pets, [dog.id]: {...s.pets[dog.id], pairCd: {}}},
  });
  return 'ratón junto al perro (nueva persecución)';
})()
" 2>&1 | head -2
sleep 0.9
$AB screenshot $DL/emma3-persecucion.png >/dev/null 2>&1
$AB eval "
(() => {
  const s = window.__emma.getState();
  const mouse = s.objects.find(o => o.catalogId==='mouse');
  const rt = s.pets[mouse.id];
  return 'ratón: chase=' + (rt.chaseUntil > Date.now()) + ' rol=' + rt.chaseRole + ' | 😠 en DOM: ' + document.body.innerText.includes('😠');
})()
" 2>&1 | head -2

echo "== errores JS: =="
$AB errors 2>&1 | tail -5
kill $SRV 2>/dev/null
echo "== FIN R4 =="
