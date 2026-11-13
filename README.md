# Emma Care Studio

**Crea un mundo de mascotas, juega con ellas y enséñales a responder a sus nombres y órdenes.**

Emma Care Studio es un juego web en español. Puedes diseñar escenarios, personalizar animales y objetos, cuidar a tus mascotas y dirigirlas con controles táctiles, texto o voz cuando el navegador lo admite.

- **Jugar:** https://emmacare.alicelabs.site
- **Repositorio:** https://github.com/eddyflores100-lang/emma-care-studio
- **Versión del proyecto:** 0.13.0
- **Plataforma:** aplicación web Next.js con exportación estática para GitHub Pages.

## Qué puedes hacer

### Crear y personalizar
- Colocar mascotas y objetos en el escenario.
- Cambiar nombres y propiedades de los elementos.
- Organizar el mundo y configurar reglas de interacción.
- Guardar el proyecto en el navegador y exportarlo o importarlo como JSON.

### Jugar y cuidar
- Las mascotas se mueven e interactúan con el entorno.
- Atiende sus necesidades, acompaña su descanso y sigue su progreso.
- Desbloquea mundos y traslada mascotas entre ubicaciones disponibles.
- Las mascotas conservan su progreso y ubicación al guardar la partida.

### Dar órdenes
- Selecciona una mascota por su nombre y dale una orden individual.
- Usa órdenes de movimiento, descanso, cuidado y viaje.
- El reconocimiento de voz depende de Web Speech, los permisos del micrófono y el soporte del navegador. También puedes escribir órdenes desde los controles del juego.
- La voz se procesa mediante las capacidades del navegador; el reconocimiento puede requerir conexión y no está disponible de forma uniforme en todos los dispositivos.

### Jugar en móvil
La interfaz se adapta a pantallas táctiles y puede solicitar pantalla completa y Screen Wake Lock. El navegador y el sistema operativo pueden limitar estas funciones; no se garantiza que todos los dispositivos mantengan la pantalla activa o cambien automáticamente la orientación.

## Primeros pasos

1. Abre el [juego](https://emmacare.alicelabs.site).
2. Entra al mundo de demostración y explora los controles.
3. Cambia el nombre de una mascota para probar las órdenes personalizadas.
4. Prueba guardar, recargar y recuperar la partida.
5. En móvil, concede permisos solo si deseas usar el micrófono.

No necesitas crear una cuenta para jugar. El estado de juego se guarda localmente en el navegador. Borrar los datos del sitio puede eliminar partidas guardadas; exporta una copia JSON si quieres conservarla fuera del dispositivo.

## Desarrollo local

### Requisitos
- [Bun](https://bun.sh/) compatible con el lockfile del repositorio.
- Node.js y TypeScript para las herramientas de comprobación.

### Instalar y ejecutar

```bash
bun install --frozen-lockfile
bun run dev
```

Abre http://localhost:3000.

### Comprobaciones antes de publicar

```bash
bun run test
bun run typecheck
bun run lint
bun run build:export
```

Los comandos corresponden a los scripts definidos en `package.json`:

| Comando | Qué comprueba |
| --- | --- |
| `bun run test` | Regresiones de lógica del juego, órdenes, progreso, guardado e importación |
| `bun run typecheck` | Tipos TypeScript |
| `bun run lint` | Reglas ESLint |
| `bun run build:export` | Genera el sitio estático en `out/` |

El workflow de CI ejecuta estas cuatro comprobaciones en las pull requests y en los pushes a `main`. El workflow de despliegue vuelve a comprobar el proyecto antes de publicar en GitHub Pages.

## Estructura del proyecto

```text
src/
  app/                 Entrada Next.js y estilos globales
  components/studio/   Interfaz del editor y del juego
  lib/studio/          Estado, catálogo, voz, sonido,
                       persistencia, progresión y navegación
tests/
  game.test.cjs        Pruebas de regresión de la lógica
.github/workflows/
  ci.yml               Pruebas, tipos, lint y build
  deploy.yml           Exportación y publicación
```

## Arquitectura y límites

- **Interfaz:** Next.js, React, TypeScript y Tailwind CSS.
- **Estado del juego:** Zustand.
- **Persistencia:** almacenamiento local del navegador; no requiere una base de datos para la partida local.
- **Audio:** Web Audio para sonidos generados por la aplicación.
- **Voz:** Web Speech del navegador cuando está disponible.
- **Publicación:** exportación estática y GitHub Pages.

El proyecto incluye dependencias de Prisma y una ruta API en el árbol de código, pero el flujo de publicación estática y el guardado local descritos aquí no implican que exista un backend de partidas en producción. No introduzcas credenciales ni datos privados en archivos exportados.

## Pruebas y validación

Las pruebas automatizadas cubren, entre otros casos, selección por nombre, órdenes individuales, viajes a mundos desbloqueados, alimentación dirigida, persistencia de progreso, copias de respaldo e importaciones inválidas. Estas pruebas no sustituyen una sesión de prueba física en teléfonos y tablets. La voz, vibración, pantalla completa, orientación y permisos deben validarse en cada navegador y dispositivo objetivo.

## Privacidad y seguridad

El juego necesita permisos del navegador para funciones como el micrófono. No concedas permisos si no vas a utilizar esas funciones. La partida se almacena localmente; protege los archivos JSON exportados porque contienen el estado de tu mundo.

Consulta [SECURITY.md](SECURITY.md) para reportar problemas de seguridad y [CONTRIBUTING.md](CONTRIBUTING.md) para colaborar.

## Licencia

Consulta [LICENSE](LICENSE) para conocer los términos aplicables a este repositorio.
