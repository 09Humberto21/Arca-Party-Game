import { Server, matchMaker } from '@colyseus/core'
import { WebSocketTransport } from '@colyseus/ws-transport'
import { createServer } from 'http'
import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { PartyRoom } from './rooms/PartyRoom.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Servidor Arca Party Online (Colyseus 0.15).
 *
 * - Define la sala "party" (lobby + partida por rondas).
 * - Expone un endpoint HTTP para resolver un CÓDIGO de sala (4 letras) al
 *   roomId interno de Colyseus, así el cliente puede "unirse con código".
 * - /health para que Render sepa que está vivo.
 */

const PORT = Number(process.env.PORT) || 2567

const app = express()
app.use(cors())
app.use(express.json())

// Salud (Render / monitoreo).
app.get('/health', (_req, res) => res.json({ ok: true }))

// Resolver: código de sala → roomId. El cliente luego hace joinById(roomId).
app.get('/rooms/:code', async (req, res) => {
  const code = String(req.params.code || '').toUpperCase()
  try {
    const rooms = await matchMaker.query({ name: 'party' })
    const found = rooms.find((r) => r.metadata?.code === code)
    if (!found) return res.status(404).json({ error: 'room_not_found' })
    if (found.locked || found.clients >= found.maxClients) {
      return res.status(409).json({ error: 'room_full' })
    }
    res.json({ roomId: found.roomId, code })
  } catch (err) {
    res.status(500).json({ error: 'server_error' })
  }
})

// En producción, este mismo servicio sirve el JUEGO compilado (dist/) → un solo
// deploy gratis sirve la web y el multijugador en el mismo origen. En desarrollo
// no existe dist/ (el juego lo sirve Vite aparte) → responde un saludo simple.
const clientDist = path.join(__dirname, '..', '..', 'dist')
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist))
  app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')))
} else {
  app.get('/', (_req, res) => res.json({ name: 'arca-party-server', status: 'ok' }))
}

const httpServer = createServer(app)
const gameServer = new Server({
  transport: new WebSocketTransport({ server: httpServer }),
})

gameServer.define('party', PartyRoom)

gameServer
  .listen(PORT)
  .then(() => console.log(`🛶 Arca Party server escuchando en :${PORT}`))
  .catch((err) => {
    console.error('No se pudo iniciar el servidor:', err)
    process.exit(1)
  })
