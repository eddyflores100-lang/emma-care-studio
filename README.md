# 🎮 Emma Care Studio

**El estudio de juegos de mascotas para niñas y niños** — "Canva + LEGO + Roblox", pero simple: monta tu mundo, crea reglas mágicas y juega a cuidar a tus mascotas. Todo en español, todo en el navegador, todo gratis.

🌐 **Web oficial: [emmacare.alicelabs.site](https://emmacare.alicelabs.site)**

---

## ✨ ¿Qué se puede hacer?

### 🛠️ Modo EDITAR
- **Arrastra y suelta** 16 mascotas y 34 objetos en el mundo: 🐶🐱🐰🐭🐦🐹🐔🦆🦊🐻🐼🦁🐷🐵🐢 + casas, comederos, bebederos, árboles, estanques…
- Cambia **nombre, tamaño, color arcoíris y velocidad** de cada cosa.
- Crea **reglas mágicas**: *"CUANDO Max esté cerca del juguete ENTONCES aumenta su felicidad"*.
- 4 **mundos por desbloquear**: Jardín → Casa (60🪙) → Hospital (120🪙) → Playa (200🪙).

### 🕹️ Modo JUGAR
- Las mascotas **viven solas**: deambulan, comen del comedero, beben agua del bebedero/estanque/fuente, duermen en su cama y se ponen enfermas si no las cuidas.
- **Cinco necesidades**: ❤️ Felicidad · 🍖 Comida · ⚡ Energía · 🧼 Higiene · 😴 Descanso.
- **Gana monedas** cuidándolas bien y gástalas en la 🛍️ Tienda (adopciones, pastel, juguete).

### 😼 ¡Caos divertido!
- **Rivalidades reales**: el perro persigue al gato, el gato al ratón, el zorro a la gallina…
  - Se acercan → **¡el móvil VIBRA** y la pantalla tiembla 😠😱
  - ¡Corren por TODA la pantalla! El gato delante, el perro detrás, con amagues burlones.
  - Escapan **escondiéndose** (📦 arbustos, cajas, casitas) o **trepando** (🌳 árboles, sofás).
  - **Toca la pantalla** para aplaudir y calmarlos 👏 — o diles "¡Quieto!".
- **Sorpresas aleatorias**: 🌧️ lluvia (¡busca refugio!), 🥣 escasez de comida, 🦋 mariposas, 🎁 cajas sorpresa.
- **Cuidado real con el dedo**: acaríciala frotando la pantalla, lanza la 🎾 pelota, dale órdenes.

### 🐾 Adiestramiento y niveles
- **Órdenes**: 🪑 ¡Sentado! · ✋ ¡Quieto! · 👉 ¡Ven! · 🙈 ¡Escondeos! — obedecer da premios 🦴 +2🪙.
- **Niveles de mascota** (Nv.1 → Nv.9): cada cuidado bien hecho da XP. Al subir de nivel: fiesta 🎉, +10🪙 y todas sus barras se llenan un poco.
- Cuando corren mucho **se cansan** ⚡ y van solitas a buscar **agua** 💧 o **comida** 🍖.

### 🔊 Voces propias
Cada animal tiene su **voz sintetizada** (WebAudio, sin archivos): el perro ladra, el gato maúlla, el ratón hace *pi-pi*… y cambia según su ánimo: contento, hambriento, dormido, enfadado (¡GRRR!) o asustado.

---

## 🚀 Cómo publicar tu propia copia

### 1. Subir a GitHub
```bash
# con GitHub CLI
gh repo create emma-care-studio --public --source=. --push

# o a mano: crea el repo en github.com/new y luego:
git remote add origin git@github.com:TU-USUARIO/emma-care-studio.git
git push -u origin main
```

### 2. Activar GitHub Pages
- En el repo: **Settings → Pages → Source: GitHub Actions**.
- El workflow `.github/workflows/deploy.yml` compila y publica solo en cada push.

### 3. Dominio propio (emmacare.alicelabs.site)
- El archivo `public/CNAME` ya contiene el dominio.
- En tu gestor de DNS de `alicelabs.site`, añade un registro **CNAME**:

| Tipo | Nombre | Valor |
|------|--------|-------|
| CNAME | `emmacare` | `TU-USUARIO.github.io` |

- En **Settings → Pages → Custom domain**, escribe `emmacare.alicelabs.site` y activa *Enforce HTTPS*.

¡Listo! En unos minutos el juego estará en `https://emmacare.alicelabs.site` 🎉

---

## 🧑‍💻 Desarrollo

```bash
bun install        # instalar dependencias
bun run dev        # servidor de desarrollo (http://localhost:3000)
bun run lint       # comprobar el código
bun run build:export   # build estático para Pages (carpeta out/)
```

**Tecnologías**: Next.js 16 · TypeScript · Tailwind CSS 4 · shadcn/ui · Zustand · WebAudio API. Sin base de datos: el proyecto se guarda en `localStorage` y se puede exportar a JSON.

## 🗺️ Hoja de ruta
- **v0.5** — Exportar el mundo a Roblox Studio (JSON → Lua)
- **v0.6** — Biblioteca de sonidos y sprites propios
- **v1.0** — Asistente IA que construye el mundo contándole un cuento

---

Hecho con 💛 para que las niñas creen juegos, no solo los jueguen.
