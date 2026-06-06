# Arca Party — Servidor multijugador

Servidor de salas estilo **Mario Party** hecho con [Colyseus](https://colyseus.io) (Node.js).
El servidor es la autoridad del **flujo** (quién está en la sala, qué minijuego toca,
cuándo empieza/termina la ronda y el marcador). Cada cliente juega los minijuegos en
local y reporta su puntaje → poco tráfico, aguanta muchos jugadores en el tier gratis.

## Correr en local

> En esta máquina `npm run` está roto (ComSpec). Usa node directo:

```bash
cd server
npm install --ignore-scripts
node src/index.js          # escucha en :2567
```

Prueba: `curl http://localhost:2567/health` → `{"ok":true}`

## Arquitectura

```
server/src/
├── index.js                  Bootstrap + endpoint GET /rooms/:code (código → roomId)
└── rooms/
    ├── PartyRoom.js          La sala: lobby → countdown → playing → results → final
    └── schema/PartyState.js  Estado sincronizado (jugadores, fase, puntajes)
```

### Flujo de una partida

1. **lobby** — el 1er jugador es el anfitrión; los demás entran con el código de 4 letras.
2. **countdown** — 3·2·1 antes de cada ronda.
3. **playing** — todos juegan el mismo minijuego (30 s); envían `score` en vivo y `finishRound` al acabar.
4. **results** — tabla de la ronda; se acumula al total.
5. Repite por cada ronda → **final** con el 🏆 campeón.

### Mensajes (cliente → servidor)

| Mensaje        | Quién   | Efecto                                  |
| -------------- | ------- | --------------------------------------- |
| `startMatch`   | host    | Arranca la partida                      |
| `setRounds` n  | host    | Nº de rondas (1–8), solo en lobby       |
| `setReady` b   | todos   | Marcarse listo en el lobby              |
| `score` n      | todos   | Puntaje de la ronda en vivo             |
| `finishRound`  | todos   | Termina su ronda (ganó/perdió/sin tiempo) |
| `backToLobby`  | host    | Volver al lobby tras el podio           |

## Deploy gratis (Render)

Usa `render.yaml` en la raíz del repo (Blueprint). El servicio free puede "dormir"
tras inactividad; la primera conexión lo despierta (~30 s). La URL pública (algo como
`wss://arca-party-server.onrender.com`) va en el cliente como `VITE_SERVER_URL`.
