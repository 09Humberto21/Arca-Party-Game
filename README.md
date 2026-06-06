# ⚓ Arca Party

Mini-juego web 2D con temática del Arca de Noé, inspirado en el estilo vibrante y frenético de *Mario Party*. Sobrevive a minijuegos rápidos, gana monedas y diamantes, canjéalos en la tienda por personajes y minijuegos, ¡y salva el arca! Todo a 60fps, con estilo madera/pergamino y efectos de sonido.

## ✨ Características

- 🎮 **5 minijuegos** con dificultad escalable por nivel:
  - 🧩 **Acomoda la Barca** — arrastra cada animal a su silueta (drag & drop) antes de que acabe el tiempo.
  - 🌊 **Salta la Ola** — esquiva olas y trampas (pájaros) con timing; agarra power-ups (🪽 doble salto, 🛡️ escudo, ⭐ monedas).
  - 🔤 **Sopa de la Sombra** — encuentra el nombre del animal en una sopa de letras contrarreloj.
  - 🐍 **Serpiente del Arca** — clásico Snake con las flechas, come animales y crece.
  - 💣 **Bombas del Arca** — estilo Bomberman con todos los modificadores clásicos (bomba+, fuego+, velocidad, patada, detonador, atraviesa-cajas, escudo).
- 🛒 **Tienda** para canjear 🪙 monedas y 💎 diamantes por personajes (skins) y desbloquear minijuegos. Cartera **persistente** (localStorage).
- 🐾 **Perfil** con nickname y skin de animal.
- 🎨 **UI premium**: madera tallada 3D, pergamino, paleta vibrante, animaciones aceleradas por GPU.
- 🔊 **Efectos de sonido** sintetizados (Web Audio API, sin archivos) con interruptor global.
- ⏱️ **Cuenta atrás** 3·2·1 antes de cada partida.
- 📖 **Pantalla de derrota** con versículos bíblicos motivacionales y **victoria final** épica (🌈🕊️).
- 📺 Formato **16:9** a pantalla completa, responsivo a cualquier monitor.

## 🛠️ Tech Stack

- **React 18** + **Vite 5**
- **Tailwind CSS v4** (plugin oficial de Vite, tokens de tema y unidades de _container query_)
- **Framer Motion 11** para animaciones e interacciones
- **Web Audio API** para los efectos de sonido

## 🚀 Empezar

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`.

### Build de producción

```bash
npm run build
npm run preview
```

## 📂 Estructura

```
src/
├── App.jsx                 # Orquestador de pantallas (flujo del juego)
├── context/GameContext.jsx # Estado centralizado (cartera, perfil, nivel, vidas…)
├── data/                   # Catálogo de tienda + versículos
├── sound.js                # Motor de efectos de sonido (Web Audio)
└── components/
    ├── MainMenu, ProfileScreen, SelectScreen, ShopScreen
    ├── GameHUD, GameLoop, Countdown, PauseOverlay
    ├── DefeatScreen, VictoryScreen
    ├── AcomodaBarca, SaltaLaOla, DesafioSombra, SerpienteArca, BombaArca
    └── PartyBackground, Stage, WoodButton, ...
```

## 🎯 Controles

- **Acomoda la Barca / Sopa:** ratón / táctil (arrastrar).
- **Salta la Ola:** `Espacio` o clic para saltar.
- **Serpiente / Bombas:** flechas o `WASD`. En Bombas: `Espacio` pone bomba, `X` detona (con detonador).

---

Hecho con ⚓ y mucho ☕.
