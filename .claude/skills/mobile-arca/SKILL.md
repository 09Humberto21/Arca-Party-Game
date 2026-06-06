---
name: mobile-arca
description: Adapta el juego "Arca Party" a estilo MOBILE (controles táctiles + layout responsivo/retrato) sin romper la versión de escritorio. Úsala cuando el usuario quiera una versión para móvil/celular, controles táctiles, D-pad en pantalla, jugar con el dedo, soporte vertical/portrait, o "que se vea como app móvil".
argument-hint: "[touch | portrait | fullscreen | all]"
allowed-tools: Read, Grep, Glob, Edit, Write, Bash(node node_modules/vite/bin/vite.js*), Bash(git*)
---

# Mobile Arca — adaptar Arca Party a móvil

Convierte Arca Party (React + Vite + Tailwind v4 + Framer Motion) en una
experiencia jugable en celular **sin romper escritorio**. La estrategia clave
es **reusar la lógica existente** de los minijuegos (que escuchan teclado y
eventos de puntero) en vez de reescribirla.

`$ARGUMENTS` indica el alcance: `touch` (solo controles táctiles), `portrait`
(layout vertical), `fullscreen` (pantalla completa), o `all` (todo). Si está
vacío, asume `all`.

> **Enfoque actual (decidido por el usuario): el juego se disfruta en VERTICAL
> en el celular.** No se fuerza horizontal ni se muestra el aviso "gira tu
> teléfono". El área de juego mantiene 16:9 internamente (para no romper los
> cálculos `cqh`/`cqw` de los tableros) y se centra; los controles táctiles se
> dibujan a nivel de viewport, abajo, en unidades `vmin` (grandes y usables en
> retrato).

## Antes de empezar (contexto del proyecto)

Lee estos archivos para no romper convenciones:
- `src/components/Stage.jsx` — escenario FIJO 16:9, usa `containerType: size` y
  todas las medidas internas en `cqh`/`cqw` (container queries). NO cambies a px.
- `src/App.jsx` — enruta por `game.screen`; en `PLAYING` monta
  `PartyBackground(lite)` + `GameHUD` + `GameLoop` + `PauseOverlay`.
- `src/components/GameLoop.jsx` — registro `MINIGAMES` y `currentMinigame` del contexto.
- `src/context/GameContext.jsx` — estado (`currentMinigame`, `paused`, `screen`).
- Minijuegos y cómo reciben input (CLAVE para los controles táctiles):
  - `AcomodaBarca.jsx`, `DesafioSombra.jsx` → ratón/táctil con **pointer events**
    (`onPointerDown/Move/Up`, `document.elementFromPoint`). **Ya funcionan al tacto.**
  - `SaltaLaOla.jsx` → `onPointerDown` en el campo (salta al tocar) **+** tecla `Space`.
  - `SerpienteArca.jsx` → `window` keydown: flechas / WASD.
  - `BombaArca.jsx` → `window` keydown: flechas/WASD (mover), `Space` (bomba), `X` (detonar).

Regla de oro del repo: **modularidad** (componentes en `/components`), estado
centralizado en `GameContext`, animaciones solo con `transform`/`opacity`
(rendimiento), y trabajar en la rama `dev`.

## Plan de implementación

### 1. Detección de dispositivo táctil (no romper escritorio)
Crea un hook `src/hooks/useIsTouch.js`:
- `const coarse = window.matchMedia('(pointer: coarse)').matches`
- `const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0`
- Devuelve `coarse || hasTouch`. Escucha cambios de `matchMedia`.
Los controles táctiles **solo** se muestran cuando esto es `true` (o con un
toggle manual de override guardado en localStorage).

### 2. Controles táctiles reusando el teclado (núcleo de la solución)
Crea `src/components/TouchControls.jsx`. En vez de tocar la lógica de cada
minijuego, **sintetiza eventos de teclado** sobre `window`, que los juegos ya
escuchan:

```jsx
import { useEffect, useRef } from 'react'
import { useGame } from '../context/GameContext'

function fireKey(key) {
  const code =
    { ArrowUp: 'ArrowUp', ArrowDown: 'ArrowDown', ArrowLeft: 'ArrowLeft', ArrowRight: 'ArrowRight', ' ': 'Space', x: 'KeyX' }[key] || ''
  window.dispatchEvent(new KeyboardEvent('keydown', { key, code, bubbles: true }))
}

// Botón "holdable": al mantener pulsado repite la tecla (para mover en Snake/Bomba)
function HoldButton({ onFire, repeatMs = 90, className, children, ...rest }) {
  const t = useRef(null)
  const start = (e) => {
    e.preventDefault()
    onFire()
    if (repeatMs) t.current = setInterval(onFire, repeatMs)
  }
  const stop = () => { if (t.current) { clearInterval(t.current); t.current = null } }
  useEffect(() => stop, [])
  return (
    <button onPointerDown={start} onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop}
      className={className} style={{ touchAction: 'none', userSelect: 'none' }} {...rest}>
      {children}
    </button>
  )
}

export default function TouchControls() {
  const { currentMinigame } = useGame()
  // Esquema por minijuego:
  const needsDpad = currentMinigame === 'snake' || currentMinigame === 'bomba'
  const needsJump = currentMinigame === 'ola'      // (además ya salta al tocar el campo)
  const needsBomb = currentMinigame === 'bomba'
  // Acomoda/Sombra: no renderizar nada (ya son táctiles por arrastre).
  if (!needsDpad && !needsJump && !needsBomb) return null
  // ... render D-pad (flechas) abajo-izquierda y botones A/B abajo-derecha ...
}
```

Detalles de diseño:
- **D-pad** (cruz de 4 botones) abajo a la IZQUIERDA. Cada botón es un
  `HoldButton` que dispara `ArrowUp/Down/Left/Right` con repetición (~90ms) →
  encaja con el throttle de Snake (`MOVE_MS`) y Bomba (`player.moveMs`).
- **Botones de acción** abajo a la DERECHA:
  - `A` = `Space` (bomba en Bomberman / salto en Salta la Ola) — sin repetición.
  - `B` = `x` (detonar, solo Bomberman) — sin repetición.
- Reusa el estilo del proyecto: clases `.wood-3d` / `.wood-inset`,
  `text-stroke`, y `playSound('click')` opcional al pulsar.
- Como los controles van a nivel de VIEWPORT (fuera del contenedor 16:9, para
  ser usables en vertical), usa unidades **`vmin`** (NO `cqh`/`cqw`, que solo
  valen dentro del Stage). Botones grandes para el dedo (~14–20vmin), con `gpu`
  y `whileTap`. Posiciónalos con `env(safe-area-inset-*)`.
- Renderiza `<TouchControls />` en `App.jsx` **fuera** del `<Stage>` (a nivel de
  viewport), envuelto en `{isTouch && <TouchControls/>}`. El propio componente se
  autogestiona: devuelve `null` salvo en `screen === PLAYING && !paused`, así no
  tapa los overlays de pausa/resultado.

> Ventaja: cero cambios en la lógica de los 5 minijuegos. Snake/Bomba/Ola
> funcionan igual con teclado (escritorio) y con los botones (móvil).

### 3. Stage responsivo en VERTICAL (alcance `portrait`/`all`)
`Stage.jsx` mantiene el área de juego en 16:9 internamente (para no romper el
cálculo `cqh`/`cqw` de los tableros), pero el juego se disfruta tanto en
horizontal como en **vertical** en el celular:
- El contenedor 16:9 se escala al máximo que quepa y se **centra** con
  `maxHeight: '100dvh'` y `maxWidth: '177.78dvh'` (usa `dvh` para no saltar con
  la barra del navegador móvil).
- En vertical, el área 16:9 queda centrada (con franjas arriba/abajo) y los
  controles táctiles se dibujan a nivel de viewport, en la franja inferior.
- **NO** se usa `RotateHint` ni aviso de "gira tu teléfono" (eliminado). Tampoco
  se reduce el número de columnas de los tableros: al escalar el 16:9 completo,
  Snake (COLS=15) y Bomba (COLS=13) caben sin tocar su lógica.

### 4. Pantalla completa inmersiva (alcance `fullscreen`/`all`)
- `src/fullscreen.js` exporta `goFullscreen()`:
  `document.documentElement.requestFullscreen()` (gesto del usuario requerido,
  se llama desde el botón PLAY). En try/catch (no soportado en iOS Safari).
- **Sin** `screen.orientation.lock`: el juego se juega en vertical, no se fuerza
  la orientación.
- `index.html` ya trae `viewport ... user-scalable=no` + `viewport-fit=cover`
  (evita zoom por doble tap y habilita `safe-area-inset`).

### 5. Pulido táctil
- En zonas interactivas de arrastre, confirma `touch-action: none` (Sopa y
  Acomoda; el body ya tiene `user-select:none`).
- Verifica que `DesafioSombra` (que usa `elementFromPoint`) funciona con el dedo
  (lo hace, pero prueba en móvil real).
- HUD y `SoundToggle` no deben taparse con los controles: en táctil, baja el
  D-pad y botones a la franja inferior; el HUD vive arriba.

## Verificación
1. `node node_modules/vite/bin/vite.js build` debe pasar sin errores.
2. Arranca `node node_modules/vite/bin/vite.js --host` y abre la **URL Network**
   en un celular real (misma wifi), o usa el **modo dispositivo** de Chrome DevTools.
3. Prueba los 5 minijuegos con el dedo **en vertical**: arrastre (Acomoda/Sopa),
   tocar para saltar + botón ⬆️ (Ola), D-pad (Snake), D-pad + 💣 + 💥 (Bomba).
4. Confirma que en **escritorio** todo sigue igual (los controles táctiles no
   aparecen con ratón).

## Cierre
- Mantén el trabajo en la rama `dev`. Al terminar:
  `git add -A && git commit -m "Mobile: controles tactiles + layout responsivo" && git push`
- Resume al usuario qué se añadió y cómo probarlo en su teléfono (URL Network).

## No hacer
- No reescribir la lógica de los minijuegos (usa la síntesis de teclado).
- No cambiar `cqh`/`cqw` por px ni romper el `containerType: size` del Stage
  (excepción: los `TouchControls`, que viven fuera del Stage y usan `vmin`).
- No volver a forzar horizontal ni reintroducir el aviso "gira tu teléfono":
  el juego se diseña para jugarse en VERTICAL.
- No animar `blur`/`filter`/`box-shadow` en bucle (regla de rendimiento del repo).
