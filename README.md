## v0.13 — juego inmersivo y mascotas kawaii

Jugar solicita pantalla completa desde el toque inicial cuando el navegador lo permite. El escenario llena toda la ventana sin marco ni barras reservadas; micrófono y Controles flotan en una esquina. Tienda, mapa de mundos, sonido, editar y pantalla completa están dentro de Controles.

Mascotas con ojos grandes, mejillas rosadas y colores pastel; escenarios y objetos comparten la paleta. Las rivalidades siguen activas aunque aumente el vínculo, con más tiempo entre persecuciones para amigos. Mascotas sanas corren hacia los juguetes por iniciativa propia. Se mantienen órdenes individuales, quieto hasta libre, refugios, cansancio y reposo hospitalario. Llamadas naturales como «oye Max» y «Max ven por aquí» conservan la selección por nombre.

# 🎮 Emma Care Studio

**El estudio de juegos de mascotas para niñas y niños** — "Canva + LEGO + Roblox", pero simple: monta tu mundo, crea reglas mágicas y juega a cuidar a tus mascotas. Todo en español, todo en el navegador, todo gratis.

🌐 **Web oficial: [emmacare.alicelabs.site](https://emmacare.alicelabs.site)**

---

## v0.8.1 — voz y partidas reparadas

- Llama por el **nombre que hayas puesto**: «Max» responde con el sonido de su especie y un globo; «Max ven» viene hacia ti.
- «Max quieto» solo detiene a Max hasta decir «Max libre» o darle otra orden. «Quietos» separa a los rivales y cancela la pelea sin causar una herida adicional.
- «Max a la casa» cambia su ubicación al **mundo Casa**. También: «al patio», «a la playa», «al hospital». Debes desbloquear primero el destino; la voz no gasta monedas. Al abrir el mundo, encontrarás allí a quienes enviaste.
- «A la casita» busca el objeto casita del mundo actual; se distingue del viaje al mundo Casa.
- Los nombres se leen de la configuración en cada orden: al renombrar a Edgar como Lucía, responde inmediatamente a Lucía. Los nombres de varias palabras y con tildes también funcionan.
- Sonidos adicionales al viajar, saltar, bailar, beber y bañarse; respetan el botón de silencio.
- Nuevas órdenes: **corre, pasea, salta, baila, libre, descansa, despierta, báñate**; además de comer, beber, dormir y esconderse.
- Las órdenes se ejecutan al terminar la frase. Las alternativas del reconocimiento no ejecutan varias órdenes simultáneamente.
- En móvil, tocar un objeto abre sus ajustes; la mochila desplaza todas sus secciones sin recortar propiedades ni reglas.
- Mientras juegas, solicita **Screen Wake Lock** para mantener la pantalla despierta. Lo libera al editar/salir y lo solicita de nuevo al volver a la pestaña; el sistema puede rechazarlo por ahorro de batería o falta de soporte.
- La voz requiere permiso de micrófono y soporte Web Speech del navegador; puede usar el servicio de reconocimiento del navegador y necesitar conexión. No se garantiza reconocimiento en todos los dispositivos. El botón ⌨️ permite escribir las mismas órdenes.
- **Guardado v3** conserva nivel, XP, necesidades, heridas y ubicación. Los archivos v1/v2 migran; no pueden recuperar progreso que esas versiones nunca guardaron.
- 📂 permite **descargar, importar y recuperar el mundo anterior**. «Nuevo mundo» y la importación crean una copia previa; si no hay espacio para esa copia, conservan el mundo actual.
- El autoguardado ocurre como máximo 1,2 s después del primer cambio pendiente, aunque las mascotas sigan moviéndose. Si falla, muestra un aviso.
- Las persecuciones cruzan el campo, activan temblor visual y vibración en dispositivos compatibles. Las mascotas se cansan, reducen velocidad y paran cuando les falta energía. El hospital es una zona segura.

### Verificación

```bash
bun install --frozen-lockfile
bun run test        # pruebas de comandos, viajes, progreso, importación y autoguardado
bun run typecheck
bun run lint
bun run build:export
```

El despliegue exige esas comprobaciones. También se ejecutan en las pull requests. Los ejemplos de WebSocket y el helper de Prisma del proyecto inicial no forman parte de la aplicación estática y quedan fuera de su comprobación de tipos.

## ✨ ¿Qué se puede hacer?

### 🛠️ Modo EDITAR
- **Arrastra y suelta** 15 mascotas y 28 objetos en el mundo: 🐶🐱🐰🐭🐦🐹🐔🦆🦊🐻🐼🦁🐷🐵🐢 + casas, comederos, bebederos, árboles, estanques…
- Cambia **nombre, tamaño, color arcoíris y velocidad** de cada cosa.
- Crea **reglas mágicas**: *"CUANDO Max esté cerca del juguete ENTONCES aumenta su felicidad"*.
- 4 **mundos por desbloquear**: Jardín → Casa (60🪙) → Hospital (120🪙) → Playa (200🪙).
- **Autoguardado**: todo se guarda solo (1,2 s después de cada cambio y al cerrar la pestaña) — verás el sello "✓ guardado".

### 🕹️ Modo JUGAR
- Las mascotas **viven solas**: deambulan, comen del comedero, beben agua del bebedero/estanque/fuente, duermen en su cama y se ponen enfermas si no las cuidas.
- **Cinco necesidades**: ❤️ Felicidad · 🍖 Comida · ⚡ Energía · 🧼 Higiene · 😴 Descanso.
- **Gana monedas** cuidándolas bien y gástalas en la 🛍️ Tienda (adopciones, pastel, juguete).

### 😼 ¡Caos divertido!
- **Rivalidades reales**: el perro persigue al gato, el gato al ratón, el zorro a la gallina…
  - Se acercan → **¡el móvil VIBRA** y la pantalla tiembla 😠😱
  - ¡Corren por TODA la pantalla! El gato delante, el perro detrás, con amagues burlones.
  - Si el rival los alcanza → **¡PELEA!** 💥 y pueden salir **heridos** 🩹 (cojean, no juegan).
  - Escapan **escondiéndose** (📦 arbustos, cajas, casitas) o **trepando** (🌳 árboles, sofás).
  - **Toca la pantalla** para aplaudir y calmarlos 👏 — o diles "¡Quieto!".
- **Heridos y hospital**: los heridos se van solos a descansar a la casita (cura lenta)…
  o llévalos en **🚑 ambulancia al hospital** (desbloquéalo con 120🪙): allí **nadie pelea**,
  los pacientes esperan un tratamiento de **15 🪙** que dura **25 segundos**. Al sanar, permanecen allí hasta que les ordenes volver.
- **Sorpresas aleatorias**: 🌧️ lluvia (¡busca refugio!), 🥣 escasez de comida, 🦋 mariposas, 🎁 cajas sorpresa.
- **Cuidado real con el dedo**: acaríciala frotando la pantalla, lanza la 🎾 pelota, dale órdenes.

### 🐾 Adiestramiento y niveles
- **Órdenes**: 🪑 ¡Sentado! · ✋ ¡Quieto! · 👉 ¡Ven! · 🙈 ¡Escondeos! — cada orden usa el nombre de la mascota seleccionada; cuidar y completar misiones da monedas.
- **Niveles de mascota** (Nv.1 → Nv.9): cada cuidado bien hecho da XP. Al subir de nivel: fiesta 🎉, +10🪙 y todas sus barras se llenan un poco.
- Cuando corren mucho **se cansan** ⚡ y van solitas a buscar **agua** 💧 o **comida** 🍖.

### 🎙️ ¡Órdenes por VOZ!
Pulsa el botón **🎤 Voz** (en las ÓRDENES del HUD) y **háblales de verdad**:
- **"¡Quietos!"** → se acaban las peleas al instante y todos se quedan quietecitos.
- **"¡Escondeos!"** / **"¡a esconderse!"** / **"¡refugio!"** → corren a esconderse.
- **"¡Ven!"** / **"¡Aquí!"** → vienen corriendo hacia la dueña.
- **"¡Sentado!"** → se sientan todos.
- **Su nombre** ("¡Max!", "¡Misi!") → **te contestan** con su voz y vienen; si lo dices con una orden, solo esa mascota obedece.
- **"¡Hospital!"** / **"¡ambulancia!"** → las mascotas indicadas viajan al hospital si está abierto.
- **"¡Pelota!"** → prepara el lanzamiento.
Entiende aunque la escucha no sea perfecta ("Maz" = "Max" 😉). Funciona en Chrome/Edge/Samsung Internet y Safari modernos, pidiendo permiso de micrófono una vez.

### 📱 Pensado para el móvil
- **Pantalla completa ⛶** (botón arriba): el juego llena TODA la pantalla y, en Android, se pone **horizontal** solo.
- **En horizontal** todo se reorganiza: mundo a un lado, panel de cuidado al otro, cabecera y mundos compactos — nada se sale de la pantalla.
- En vertical te recuerda amablemente girar el móvil 🔄.
- **Alertas pequeñitas** abajo a la derecha: nunca tapan el título ni el juego.

### 🔊 Voces propias
Cada animal tiene su **voz sintetizada** (WebAudio, sin archivos): el perro ladra, el gato maúlla, el ratón hace *pi-pi*… y cambia según su ánimo: contento, hambriento, dormido, enfadado (¡GRRR!) o asustado.

---

## 🚀 Publicación (¡ya está en marcha!)

- **Repositorio**: [github.com/eddyflores100-lang/emma-care-studio](https://github.com/eddyflores100-lang/emma-care-studio)
- **Deploy**: GitHub Actions compila y publica automáticamente en cada push a `main`.
- **URL de Pages**: <https://eddyflores100-lang.github.io/emma-care-studio/>

### Dominio propio (emmacare.alicelabs.site)
El DNS **ya apunta bien** (`emmacare` → `eddyflores100-lang.github.io` ✓ comprobado).
El juego funciona 100% en la URL de Pages de arriba; para activar el dominio bonito solo falta
el permiso en GitHub (la API no lo permite en deploys con Actions):

1. Entra en **Settings → Pages** del repositorio.
2. En **Custom domain** escribe `emmacare.alicelabs.site` y pulsa **Save**.
3. Espera 5–30 min a que GitHub emita el certificado HTTPS y marca **Enforce HTTPS**.

El build ya está preparado para **los dos sitios a la vez** (raíz y subruta), así que
no hay que tocar nada más: cuando el dominio se active, funcionará al primer momento.

> Si GitHub ya muestra el dominio en Settings → Pages pero el navegador dice "tu conexión no es privada",
> es solo el certificado emitiéndose: espera unos minutos y recarga.

---

## 🧑‍💻 Desarrollo

```bash
bun install        # instalar dependencias
bun run dev        # servidor de desarrollo (http://localhost:3000)
bun run lint       # comprobar el código
bun run build:export   # build estático para Pages (carpeta out/)
```

**Tecnologías**: Next.js 16 · TypeScript · Tailwind CSS 4 · shadcn/ui · Zustand · WebAudio API. Sin base de datos: el proyecto se guarda en `localStorage` y se puede exportar a JSON.

## v0.10 — mascotas individuales y mundos persistentes

- «Max» responde con su sonido y un saludo; «gato» selecciona al único gato. Si hay nombres o especies ambiguos, usa un nombre único.
- «Max quieto» afecta solo a Max hasta «Max libre». «Quietos» separa a los rivales sin provocar heridas al cancelar la pelea.
- «Max a la casa» viaja al mundo Casa desbloqueado. «Max a la casita» entra en el refugio del escenario actual; «Max fuera» lo libera. Los ocupantes, estadísticas, monedas, XP y ubicaciones se conservan al recargar.
- «Max sígueme»: toca el suelo para guiarlo. Órdenes adicionales: hola, corre, pasea, salta, baila, descansa, despierta, come, bebe y báñate.
- Misiones repetibles: tres cuidados del mismo tipo dan 5 monedas extra. El cuidado compartido crea amistades persistentes; los amigos dejan de perseguirse.
- El mapa 🗺️ muestra todas las mascotas y permite visitar su ubicación, incluyendo el estado hospitalario.
- En el hospital, los pacientes esperan un tratamiento de **15 monedas**, de **25 segundos**. No se curan gratis ni vuelven automáticamente. Tras el alta puedes ordenarles ir al patio, casa o playa. Alimentar (+3), acariciar (+2) y bañar (+3) permite reunir monedas incluso si están enfermos. El tratamiento avanza también al visitar otro mundo.
- Animales sanos exploran zonas distintas de cada mundo; especies y animales tienen recorridos, pausas y saludos propios. El cansancio interrumpe las persecuciones.
- Al jugar se solicita mantener la pantalla encendida mediante Screen Wake Lock; se recupera al volver a la pestaña y se libera al salir. El navegador o el ahorro de batería pueden rechazarlo.
- La voz ejecuta una sola frase final. Hay entrada por teclado cuando el micrófono no está disponible; los sonidos son sintetizados y los textos se muestran en globos.

### Verificación

```bash
npm run test
npm run typecheck
npm run lint
PAGES_BASE_PATH=/emma-care-studio npm run build:export
```

La integración continua exige pruebas, tipos, lint y exportación antes del despliegue. La prueba del reconocimiento usa eventos simulados; micrófono y suspensión deben comprobarse en un teléfono físico.

Hecho con 💛 para que las niñas creen juegos, no solo los jueguen.


## Recuperación móvil y respuestas sonoras (v0.10.1)

- Al volver a la pestaña, se recupera el bloqueo horizontal si sigue en pantalla completa. Si el sistema salió de ella, toca **Volver a horizontal**. En navegadores sin bloqueo de orientación, gira el teléfono y desactiva el bloqueo de rotación del sistema.
- La escucha se pausa fuera del juego y vuelve con una sesión nueva. Las frases finales repetidas no ejecutan dos veces una orden.
- «Max», «Maks ven aquí», «gato maúlla» y «Misi trae la pelota» tienen respuestas de su especie y señales sonoras para saludar, moverse o quedarse quietos. Las llamadas alternan saludos.
- El audio se reactiva al volver y al tocar la pantalla; las respuestas esperan a que el audio esté disponible. El botón de silencio sigue aplicándose.
- Las frases con palabras desconocidas, órdenes contradictorias o movimientos negados se rechazan para evitar obediencias accidentales. Da una orden por frase y usa nombres distintos.

Verificación automática: 61 pruebas del motor, TypeScript, ESLint y exportación estática. El reconocimiento depende del navegador, permiso de micrófono, conexión y ruido ambiental; conviene comprobarlo en el teléfono real.


## v0.11 — mundos ilustrados y animaciones coherentes

Los cuatro escenarios usan ilustraciones vectoriales propias: jardín con colinas y sendero, casa con madera y alfombra, clínica con azulejos suaves y playa con olas. Las 15 especies comparten trazo, proporciones y paleta; sus retratos coinciden en el mundo, biblioteca, propiedades y selector. Los principales objetos de cuidado, refugios y árboles también tienen ilustraciones propias.

Las mascotas caminan, respiran al descansar, comen y saludan con movimientos diferenciados. Las sombras y el orden por profundidad anclan los personajes al suelo; sus nombres permanecen visibles. Nubes y olas se mueven suavemente, y la lluvia cambia la iluminación solo mientras dura el evento. Dentro de casa o del hospital no cae lluvia ni penaliza la higiene de las mascotas.

Las animaciones respetan la preferencia del dispositivo de reducir movimiento. El botón de recuperación horizontal permanece visible en vertical. No requiere descargas de imágenes ni paquetes nuevos. Validación: 62 pruebas del motor, TypeScript, ESLint, exportación estática y revisión de los SVG renderizados.


## v0.11.1 — controles que dejan ver el juego

La barra inferior reserva su propio espacio fuera del lienzo: 50 px, o 46 px en móviles horizontales, más el área segura del sistema. Solo muestra la mascota seleccionada, micrófono, entrada escrita y **Controles**. El selector de animales, cuidados, mapa y mochila aparecen al abrir el panel, con desplazamiento propio. Se cierra al tocar el mundo, pulsar Escape, lanzar la pelota o abrir mapa/mochila. La escucha sigue activa mientras el panel está cerrado. Las transcripciones aparecen brevemente y no capturan toques.

Validación: 62 pruebas del motor, TypeScript, ESLint y exportación estática.


## v0.12 — aventuras, economía y premios

- Ocho mundos: Jardín, Casa, Hospital, Playa, Parque, Bosque, Granja y Montaña. Los cuatro nuevos exigen monedas y 2/5/8/12 misiones cobradas; cada uno añade un residente con runtime listo y suministros de cuidado.
- 24 misiones con progreso persistente y premios que se cobran una sola vez. Cada mundo tiene cuidados, búsqueda de cinco objetos y recorrido de cinco puntos en orden.
- Desafíos sobre el lienzo, temporizador, errores de orden y cancelación. Las habilidades de las 15 especies aportan pistas o tiempo. Se necesita una mascota sana, despierta y con energía, salvo en ayuda hospitalaria.
- Armario con pañuelo, corona, sombrero y estrellas. Los accesorios se desbloquean con misiones y se aplican a las mascotas; no hay compras con dinero real.
- Premio diario al cuidar tres mascotas distintas. Las caricias con el dedo también cuentan. Los primeros 30 cuidados entregan monedas base, y el bonus de bienestar se limita a diez al día; se puede seguir cuidando después.
- Ayuda diaria de 20 monedas para saldos inferiores a 15. Si ya se usó, un paciente hospitalizado en espera puede preparar suministros que pagan el tratamiento directamente, sin entregar saldo libre.
- Récords por desafío, puntos semanales solo por mejorar el récord de esa semana, monedas por cada nuevo tramo de diez puntos y hasta doce temporadas guardadas. Las misiones y el premio diario aportan puntos; las compras no.
- Ranking **local de temporadas del mismo cuidador**, con apodo. No hay jugadores ficticios ni clasificación online. GitHub Pages es estático: el ranking público sigue pendiente de un servidor con identidad y validación de resultados; no se confía en puntos enviados por el navegador.
- Guardado v3 ampliado de forma compatible; los archivos antiguos reciben progresión vacía. Misiones, armario, premios diarios y récords se exportan/importan. Un desafío en curso no se reanuda al importar.

Uso: pulsa Jugar, selecciona una mascota y abre **Controles → 🎯 Aventuras**. Inicia una búsqueda o recorrido; al completarlo vuelve a Aventuras y cobra la misión. Para viajar por voz puedes decir «Nube al bosque», «al parque», «a la granja» o «a la montaña», una vez desbloqueados.

Verificación: 76 pruebas del motor, TypeScript, ESLint y exportación estática. Las pruebas cubren a progresión, premios repetidos, temporizador, orden, ayuda hospitalaria, guardado, cambio semanal, desbloqueos y límites de premios. Las habilidades se agrupan en pistas o tiempo adicional; todavía no hay física de trepar/saltar exclusiva por especie, tienda de pago, temporadas online ni monetización real. Las reglas económicas necesitan ajuste tras partidas en dispositivos reales.
