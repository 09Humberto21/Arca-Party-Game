import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { createRoom, joinRoomByCode } from '../net/colyseus'

/**
 * NetContext — Estado de la sesión multijugador (espejo reactivo de la sala
 * Colyseus). Convierte el estado sincronizado del servidor en un "snapshot"
 * de JS plano que React puede renderizar, y expone acciones (crear/unirse,
 * listo, empezar, puntaje, terminar ronda...).
 *
 * `active` es true cuando estamos dentro de una sala → la app cambia al
 * flujo online.
 */

const NetContext = createContext(null)

/** Convierte el estado sincronizado de la sala en un objeto JS plano. */
function snapshot(room) {
  const s = room.state
  return {
    code: s.code,
    phase: s.phase,
    hostId: s.hostId,
    currentMinigame: s.currentMinigame,
    round: s.round,
    totalRounds: s.totalRounds,
    roundEndsAt: s.roundEndsAt,
    players: [...s.players.values()].map((p) => ({
      id: p.id,
      nickname: p.nickname,
      skin: p.skin,
      score: p.score,
      roundScore: p.roundScore,
      ready: p.ready,
      finished: p.finished,
      connected: p.connected,
      isHost: p.isHost,
    })),
  }
}

export function NetProvider({ children }) {
  const roomRef = useRef(null)
  const [status, setStatus] = useState('idle') // idle | connecting | connected | error
  const [error, setError] = useState('')
  const [snap, setSnap] = useState(null)
  const [me, setMe] = useState('')

  // Conecta los listeners de una sala recién creada/unida.
  const attach = useCallback((room) => {
    roomRef.current = room
    setMe(room.sessionId)
    setSnap(snapshot(room))
    setStatus('connected')
    setError('')

    room.onStateChange(() => setSnap(snapshot(room)))
    room.onError((code, message) => setError(message || `error_${code}`))
    room.onLeave(() => {
      roomRef.current = null
      setStatus('idle')
      setSnap(null)
      setMe('')
    })
  }, [])

  const create = useCallback(
    async ({ nickname, skin, rounds }) => {
      setStatus('connecting')
      setError('')
      try {
        const room = await createRoom({ nickname, skin, rounds })
        await new Promise((res) => room.onStateChange.once(res)) // 1er patch
        attach(room)
      } catch (e) {
        setStatus('error')
        setError(e?.message || 'no_connection')
        throw e
      }
    },
    [attach],
  )

  const join = useCallback(
    async (code, { nickname, skin }) => {
      setStatus('connecting')
      setError('')
      try {
        const room = await joinRoomByCode(code, { nickname, skin })
        await new Promise((res) => room.onStateChange.once(res))
        attach(room)
      } catch (e) {
        setStatus('error')
        setError(e?.message || 'room_not_found')
        throw e
      }
    },
    [attach],
  )

  const leave = useCallback(() => {
    const room = roomRef.current
    if (room) room.leave()
    roomRef.current = null
    setStatus('idle')
    setSnap(null)
    setMe('')
    setError('')
  }, [])

  // Helper para enviar mensajes con seguridad.
  const send = useCallback((type, payload) => {
    roomRef.current?.send(type, payload)
  }, [])

  // Limpieza al desmontar.
  useEffect(() => () => roomRef.current?.leave(), [])

  const value = {
    active: status === 'connected' && !!snap,
    status,
    error,
    me,
    ...(snap || {}),
    players: snap?.players || [],
    create,
    join,
    leave,
    // Acciones de juego
    setReady: (r) => send('setReady', r),
    setRounds: (n) => send('setRounds', n),
    startMatch: () => send('startMatch'),
    sendScore: (v) => send('score', v),
    finishRound: (v) => send('finishRound', v),
    backToLobby: () => send('backToLobby'),
  }

  return <NetContext.Provider value={value}>{children}</NetContext.Provider>
}

export function useNet() {
  const ctx = useContext(NetContext)
  if (!ctx) throw new Error('useNet() debe usarse dentro de <NetProvider>')
  return ctx
}

/** Metadatos de presentación de cada minijuego (nombre + emoji). */
export const MINIGAME_META = {
  acomoda: { name: 'Acomoda la Barca', emoji: '🧩', hint: 'Arrastra cada animal a su silueta' },
  ola: { name: 'Salta la Ola', emoji: '🌊', hint: 'Toca para saltar las olas' },
  sombra: { name: 'Sopa de la Sombra', emoji: '🔤', hint: 'Encuentra el nombre del animal' },
  snake: { name: 'Serpiente del Arca', emoji: '🐍', hint: 'Come y crece con el D-pad' },
  bomba: { name: 'Bomba Arca', emoji: '💣', hint: 'Pon bombas y elimina enemigos' },
  memoria: { name: 'Memoria del Arca', emoji: '🧠', hint: 'Encuentra las parejas de animales' },
  atrapa: { name: 'Atrapa la Fruta', emoji: '🧺', hint: 'Toca frutas, evita la bomba 💣' },
}
