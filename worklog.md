# Worklog

---
Task ID: 1
Agent: Super Z (main)
Task: Construir Emma Care Studio v0.1 — editor visual de juegos para niños (prototipo web funcional, en español)

Work Log:
- Inicializado entorno fullstack Next.js 16 (init-fullstack.sh) y explorada estructura base
- Definido modelo de datos en src/lib/studio/types.ts (WorldObject, Rule, PetRuntime, SavedProject)
- Creado catálogo de 15 objetos con "mágicos" (comedero, cama, juguete, bañera) + proyecto demo en catalog.ts
- Motor de sonido WebAudio sin archivos externos (sound.ts): pop, coin, happy, sad, magic, eat, wake
- Store zustand (store.ts) con: editor (add/update/remove/select), reglas mágicas, motor de juego (IA de mascotas: deambular, comer, dormir; decaimiento de 5 necesidades; enfermedad y cura; monedas; bonus todas-felices; partículas), reglas CUANDO (cerca/acariciar/cada) y persistencia localStorage + export JSON
- Componentes: WorldCanvas (drag&drop HTML5 + pointer events táctil), LibraryPanel (3 pestañas), PropertiesPanel (nombre/tamaño/color hue/velocidad), RulesPanel (bloques-frase con selects píldora), PlayHUD (chips + 5 barras + 6 acciones con cooldown), HeaderBar (guardar/exportar/nuevo/JUGAR/tienda/mute)
- Página principal con bucle de juego (rAF para movimiento + setInterval 1s para necesidades) y layout responsive
- Estilos: globals.css con césped, partículas flotantes, slider arcoíris, scrollbars; layout.tsx en español con Toaster sonner
- Verificación con agent-browser: editor renderiza, añadir objeto (conejo Copito), propiedades, modo JUGAR, alimentar (+3 monedas), cooldowns, tienda (4 items), nueva regla (3 reglas), guardado en localStorage verificado, vista móvil 390px correcta, cero errores JS/hidratación, lint limpio

Stage Summary:
- App Next.js 16 lista en / (única ruta), todo en cliente, sin base de datos necesaria
- Loop completo probado: crear mundo → reglas → jugar → ganar monedas → tienda → adoptar mascotas
- Capturas en /home/z/my-project/download/: emma-editor.png, emma-play.png, emma-tienda.png, emma-mobile.png
- Siguientes pasos sugeridos: exportar a Roblox (v0.2), importar assets (v0.3), asistente IA (v1)

---
Task ID: 2
Agent: Super Z (main)
Task: Hacer Emma Care Studio fully responsive (página web + móvil)

Work Log:
- store.ts: añadido mobileTab ('objetos'|'ajustes'|'reglas') + selectForEdit() que salta a Ajustes al tocar un objeto
- WorldCanvas: usa selectForEdit en modo edición (auto-navega a propiedades en móvil)
- page.tsx reescrito: móvil/tablet (<lg) = lienzo 42vh + Tabs (Objetos/Ajustes/Reglas); escritorio (lg+) = 3 columnas + reglas abajo (ambos layouts por CSS, sin JS de media queries)
- RulesPanel: props className/fill para modo pestaña (h-full) o bloque inferior (max-h-34vh + safe-area)
- PlayHUD móvil: etiquetas de stats solo-emoji en <sm, botones h-14/sm:h-16, safe-b, hint oculto en móvil
- HeaderBar: subtítulo oculto <lg, botones 🆕/⬇️ ocultos <sm, gaps y paddings reducidos
- globals.css: touch-action manipulation en botones/selects, overscroll-behavior none, .safe-b (env safe-area-inset-bottom)
- Verificado con agent-browser: 390px (editor tabs, tap→Ajustes, juego, alimentar, cooldown, bonus +2🪙), 820px tablet, 1280px escritorio intacto; lint limpio; cero errores JS

Stage Summary:
- App 100% responsive: móvil con pestañas táctiles, tablet con lienzo grande, escritorio con columnas
- Capturas en /home/z/my-project/download/: m1-editor.png, m2-ajustes.png, m3-reglas.png, m4-play.png, m5-play-pet.png, m6-desktop.png, m7b-tablet.png

---
Task ID: 3
Agent: Super Z (main)
Task: Ampliar Emma Care Studio: 9 mascotas, 32 objetos, 4 niveles/mundos, voces por animal, expresiones y portada web lista para compartir

Work Log:
- types.ts: LevelId (jardin/casa/hospital/playa), Mood, WorldObject.level, PetRuntime.voiceAt, SayBubble, SavedProject v2 (unlockedLevels/currentLevel), ShopItemId x10
- catalog.ts: 9 mascotas (🐶🐱🐰🦊🐻🐼🦁🐷🐵), 13 objetos nuevos (sofá, lámpara, TV, silla, puerta, medicina, pino, girasol, cactus, arbusto, fuente, palmera, sombrilla, concha), LEVELS con costes (0/60/120/200), VOICES onomatopeyas por ánimo, PET_NAMES nuevos, makeLevelStarters()
- sound.ts: motor de voces WebAudio por especie × 5 ánimos (ladrido, maullido, purr, squeak, yip, gruñido, rugido, oink, parloteo, balido, ronquido, bostezo, lamento) + helpers slide/noise + sfx.unlock()
- store.ts: setLevel (viajar/desbloquear con monedas + starters + fanfarria), speak() (voz + globo), voces ambientales en gameTick con espaciado según nº mascotas, migración v1→v2, simulación solo del mundo visible (otros pausan), reglas cerca/cada filtradas por nivel, tienda 10 artículos, bugfix: set final de gameTick sobrescribía say
- WorldCanvas: fondo por mundo (grass/floor-casa/floor-hospital/floor-playa), decoración por nivel, caras de ánimo (😊😟🥱😪🤢😢🤒😋), globos de voz .say-pop, filtro de objetos por nivel
- Nuevos componentes: LevelBar (chips de mundos con candado+coste), IntroSplash (portada 1ª visita con desfile de mascotas + JUGAR AHORA)
- HeaderBar tienda ampliada; PlayHUD filtra mascotas por nivel; page.tsx añade LevelBar+IntroSplash; layout.tsx metadata OG para compartir
- globals.css: fondos madera/menta checker/playa con mar, animación emma-say
- Verificado con agent-browser: portada→JUGAR OK, 9 mascotas en biblioteca, alimentar→"¡Guau guau! 🎉"+3🪙, voces ambientales ("¡Miau!"), desbloqueo Casa/Hospital/Playa con fondos y muebles iniciales correctos, juego en Playa (Luna), caras de ánimo visibles, tienda 10 artículos, móvil 390px editor+juego, splash→modo juego, lint limpio, cero errores JS
- Capturas en /home/z/my-project/download/: emma2-portada, emma2-casa, emma2-hospital, emma2-playa, emma2-playa-juego, emma2-final, emma2-movil-editor, emma2-movil-juego, emma2-tienda

Stage Summary:
- Emma Care Studio v0.2: 9 mascotas con voz y carácter, 4 mundos progresivos, economía→desbloqueo, portada compartible
- Fix crítico: globos de voz se sobrescribían en gameTick (set final usaba copia antigua)

---
Task ID: 4
Agent: Super Z (main)
Task: "¡Caos divertido!" — rivalidades con persecuciones y vibración, escondites/trepaderas, ratón y 5 mascotas más, sorpresas (lluvia/escasez/mariposa/regalo), caricia con el dedo, pelota lanzable y órdenes de obediencia

Work Log:
- types.ts: Mood + enojado/miedo; CatalogItem + hide/climb/shelter; PetRuntime + chaseUntil/chaseRole/chasePartner/fleeAt/hiding/onTopOf/obey; tipos Command, EventKind, GameEvent, Ball; ShopItemId +6 mascotas
- catalog.ts: 15 mascotas (nuevos: 🐭 ratón, 🐦 pajarito, 🐔 gallina, 🐹 hámster, 🦆 pato, 🐢 tortuga); RIVALS (perro→gato/ratón/gallina, gato→ratón/pájaro/hámster, zorro→conejo/ratón/gallina/pato, león→mono) + FLEE_FROM inverso; objetos escondite (📦 caja, ⛺ tienda, 🏠 casita, 🌿 arbusto, 🪨 piedra) y trepaderas (🌳🌲🌴 árbol/pino/palmera, 🛋️ sofá, 🗄️ estantería nueva, 🪑 silla) + shelters (lluvia); VOICES 15×7 ánimos; PET_NAMES nuevos; demo con perro+gato+ratón+arbusto+caja (¡persecución instantánea!); fix bug: 'house' no existía en catálogo y la casita del demo era invisible
- sound.ts: voces nuevas (pi-pi, pío, coc-coc, cuac, plop, trinos…) + enojado (growl/siseo/cacareo de alarma) y miedo (yelp, panicSqueak, squeal, chirrido) para TODAS las especies + sfx boing/whoosh/rain/alarm/treat
- store.ts: motor de persecuciones — detección de rivales cerca (<11%), chase 5.2s con roles (presa ×1.95 velocidad delante, depredador ×1.55 detrás), vibración navigator.vibrate + shakeUntil (temblor del lienzo), caras 😠/😱, partículas 💢❗; escape: escondite (hiding, tras 1.1s de carrera) o trepar (onTopOf), depredador se rinde con "¡uf!", premio +2🪙 por escapar, cooldown 30s por pareja; órdenes giveCommand (sit/stay/come, +2🪙 premio, ¡la obediencia corta la persecución!); pelota throwBallAt + fetch (perro/zorro van a por ella, +3🪙, boing); eventos aleatorios cada 45-85s: lluvia (30s, mascotas buscan refugio, se mojan si no, arcoíris final), escasez de comida, mariposa (felicidad+), regalo clickable (monedas/fiesta/diamante); petPet (caricia frotando el dedo, +7 felicidad, dispara reglas de acariciar)
- WorldCanvas.tsx: caras de persecución 😠/😱, clase pet-hop (saltitos), escondidos con 👀 y zIndex tras el objeto, trepados elevados con ✨, gesto de caricia (pointer stroke >42px), pelota con rebote ball-drop, caja 🎁 clickable, mariposa con vuelo CSS, 26 gotas de lluvia, aviso del evento, banner de modo pelota, cursor-crosshair, canvas-shake
- PlayHUD.tsx: fila ÓRDENES (🪑 ¡Sentado! / ✋ ¡Quieto! / 👉 ¡Ven! / 🎾 Pelota)
- HeaderBar.tsx: tienda con 16 artículos (6 adopciones nuevas con descripciones de rivalidad), lista con scroll
- IntroSplash: desfile de 15 mascotas + nuevas características (SEEN_KEY v3)
- globals.css: emma-shake, emma-hop (respeta --face), emma-rain, emma-fly, emma-ball-drop, emma-gift
- page.tsx: window.__emma para depurar
- Pruebas (5 rondas agent-browser): persecución auto en el demo ✓ (roles chase/flee, 😠/😱, voces de enojo/miedo, shake en DOM), escondite ✓ (hiding + 👀), trepar ✓ (onTopOf), ¡Quieto! ✓ (obey=stay +2🪙), ¡Ven! ✓ (perro llegó al dueño, dist 1), pelota ✓ (lanzada, perro la trajo +3🪙), caricia frotada ✓ (98→100 felicidad), lluvia ✓ (26 gotas + aviso), regalo ✓ (+15🪙), biblioteca 15/15 mascotas + casa 4/4 + naturaleza 5/5, móvil 390px con ÓRDENES y Pelota ✓, cero errores JS, lint limpio
- Nota técnica: Radix Tabs necesita mousedown (los .click() sintéticos no las cambian); los usuarios reales no lo notan

Stage Summary:
- Emma Care Studio v0.3 "¡Caos divertido!": 15 mascotas con rivalidades reales (persecuciones con vibración y temblor, gato delante/perro detrás), escondites y trepaderas para escapar, 6 animales nuevos con voz propia, sorpresas aleatorias, cuidado con el dedo (acariciar), pelota con fetch y adiestramiento con premios
- Capturas en /home/z/my-project/download/: emma3-portada, emma3-persecucion, emma3-escondite, emma3-trepar, emma3-lluvia, emma3-editor, emma3-movil-juego, emma3-final

---
Task ID: 5
Agent: Super Z (main)
Task: Persecuciones por TODA la pantalla, calmar tocando la pantalla, ¡Escondeos!, cansancio + buscar agua/comida, niveles de mascota, y despliegue emmacare.alicelabs.site

Work Log:
- store.ts: CHASE_MS 5.2s→7.8s; presa se COMPROMETE con un rumbo lejano (lado opuesto del perseguidor, de punta a punta; solo cambia al llegar o si el rival se pega <9) + 15% amagues burlones; velocidad huida ×2.45 / caza ×1.95; gainXp()/celebrateLevel() (XP 0-100 → sube Nv, +6 en barras, +10🪙, fiesta 🎉⭐); gameTick: correr gasta energia ×2.9 y comida extra, vib(45)+tiemblito cada segundo mientras hay persecución; calmAll(x,y) — tocar el lienzo = aplauso 👏 que termina TODAS las persecuciones (respeta premios y cooldowns del par); giveCommand: nueva orden 'hide' ¡Escondeos! (corre al escondite/trepadera más cercano, se oculta 7s con 👀, al expirar sale) + XP por obedecer; nueva fuente de agua special:'water' (bebedero 🚰/estanque/fuente) — mascota con energia<32 va SOLA a beber (estado 'drink', +22⚡ +4❤️, XP); XP también por: comer en comedero, atrapar pelota (+8), escapar persecución (+8), cada acción de cuidado, caricia; moodOf devuelve enojado/miedo durante la persecución
- types.ts: PetState +drink; SpecialKind +water; Command +hide; PetRuntime +lvl/xp/hideSpot/drinkUntil/targetKind water|escape
- catalog.ts: bebedero 🚰 (casa), estanque/fuente marcados special water; bebedero en demo, blank y starters de los 4 mundos (suero en hospital, cubeta en playa)
- WorldCanvas.tsx: handleCanvasClick llama calmAll; pista "👋 ¡Toca la pantalla para calmarlos!" durante persecución; badge violeta Nv{n} en mascotas Nv2+; gotita 💧 al beber; burbuja 💧! con energia<22
- PlayHUD.tsx: barra ⭐ Nv. X + XP/100; botón 🙈 ¡Escondeos! (grid 5); chips con Nv{lvl}; hint con "si hay persecución toca la pantalla 👏"
- Despliegue: next.config.ts con EXPORT_MODE=1 (output export + distDir .next-export separado, no toca el dev server); api/route.ts con dynamic force-static; package.json v0.4 + script build:export (valida out/index.html); public/CNAME (emmacare.alicelabs.site); .github/workflows/deploy.yml (Pages con Bun, checkout→build:export→upload→deploy); README.md completo (features + guía GitHub + DNS CNAME emmacare→usuario.github.io); LICENSE MIT; .gitignore ampliado; commit 7ed238d
- Pruebas agent-browser: persecución cruza el mundo (X 27→88 = 61% del ancho, tracker 153 muestras) ✓; energías bajan por correr (95→67) y bloquean nuevas persecuciones <12 ✓; calmar con toque: 2 mascotas→0, cooldowns activos ✓; ¡Escondeos!: hideSpot elegido, escondido con 👀, sale al expirar ✓; buscar agua: energia 18→37 tras beber en el bebedero ✓; nivel: 96xp+alimentar → Nv2, +10🪙, badge Nv2 en canvas y HUD ✓; móvil 390px: botón Escondeos visible ✓; cero errores JS, lint limpio, build estático OK (out/ listo)
- Limitación del entorno: sin gh CLI ni credenciales GitHub → no se pudo crear el repo desde aquí; el repo git está 100% listo para push (commit hecho) con instrucciones exactas en README.md

Stage Summary:
- Emma Care Studio v0.4: persecuciones de punta a punta con vibración continua, toque calmante del dueño, orden ¡Escondeos!, mascotas que se cansan y van solas a beber agua o comer, y niveles de mascota con fiesta
- Despliegue empaquetado: GitHub Actions + CNAME → emmacare.alicelabs.site (faltan solo: crear repo y apuntar DNS, pasos en README)
- Capturas: /home/z/my-project/download/emma4-nivel.png, emma4-movil.png, emma4-final.png
