import { Client } from 'colyseus.js'

/**
 * Capa de red — conexión con el servidor Colyseus de Arca Party.
 *
 * La URL del servidor sale de `VITE_SERVER_URL` (en producción apunta al
 * servidor de Render, p. ej. `wss://arca-party-server.onrender.com`). En
 * desarrollo, por defecto usa el mismo host que sirve la web en el puerto 2567
 * → así funciona tanto en tu PC (`localhost`) como en el celular por WiFi
 * (`192.168.x.x`), sin configurar nada.
 */

function resolveBases() {
  let ws = (import.meta.env.VITE_SERVER_URL || '').trim()
  if (!ws) {
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
    ws = `${proto}://${window.location.hostname}:2567`
  }
  ws = ws.replace(/^http/, 'ws') // acepta también http(s):// y lo normaliza
  const http = ws.replace(/^ws/, 'http')
  return { ws, http }
}

export const SERVER = resolveBases()
export const client = new Client(SERVER.ws)

/** Crea una sala nueva (el creador será el anfitrión). */
export function createRoom(options) {
  return client.create('party', options)
}

/** Une a una sala existente por su código de 4 letras. */
export async function joinRoomByCode(code, options) {
  const clean = String(code || '').trim().toUpperCase()
  if (clean.length !== 4) throw new Error('bad_code')

  const res = await fetch(`${SERVER.http}/rooms/${clean}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || 'room_not_found')
  }
  const { roomId } = await res.json()
  return client.joinById(roomId, options)
}
