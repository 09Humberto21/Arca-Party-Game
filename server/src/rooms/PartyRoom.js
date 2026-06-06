import { Room } from '@colyseus/core'
import { PartyState, Player } from './schema/PartyState.js'

/**
 * PartyRoom — Sala multijugador estilo Mario Party.
 *
 * El servidor NO simula los minijuegos (cada cliente juega en local y reporta
 * su puntaje); el servidor es la autoridad del FLUJO: quién está en la sala,
 * qué minijuego toca, cuándo empieza/termina la ronda y el marcador acumulado.
 * Esto mantiene el tráfico bajo y aguanta muchos jugadores en el tier gratis.
 */

// Pool de minijuegos disponibles (ids iguales a los del cliente / GameLoop).
const MINIGAME_POOL = ['acomoda', 'ola', 'sombra', 'snake', 'bomba', 'memoria', 'atrapa']

const COUNTDOWN_MS = 3500 // 3·2·1·¡YA!
const ROUND_MS = 30000 // duración de cada ronda
const RESULTS_MS = 6500 // tiempo viendo la tabla de resultados
const MAX_CLIENTS = 12 // muchos amigos en una sala
const RECONNECT_SECONDS = 30 // ventana para reconectar si se cae la red

/** Código de sala legible de 4 letras (sin caracteres ambiguos). */
function makeCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ' // sin I ni O
  let code = ''
  for (let i = 0; i < 4; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)]
  return code
}

/** Mezcla (Fisher-Yates) sin mutar el original. */
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export class PartyRoom extends Room {
  onCreate(options) {
    this.maxClients = MAX_CLIENTS
    this.roundTimer = null

    const state = new PartyState()
    state.code = (options?.code || makeCode()).toUpperCase()
    state.totalRounds = Math.min(8, Math.max(1, Number(options?.rounds) || 4))
    this.setState(state)

    // El código va en metadata para que el cliente pueda buscar la sala por él.
    this.setMetadata({ code: state.code })

    // ---- Mensajes del cliente ----

    // El anfitrión arranca la partida.
    this.onMessage('startMatch', (client) => {
      if (client.sessionId !== this.state.hostId) return
      if (this.state.phase !== 'lobby' && this.state.phase !== 'final') return
      this.startMatch()
    })

    // El anfitrión cambia el nº de rondas (solo en lobby).
    this.onMessage('setRounds', (client, n) => {
      if (client.sessionId !== this.state.hostId || this.state.phase !== 'lobby') return
      this.state.totalRounds = Math.min(8, Math.max(1, Number(n) || 4))
    })

    // Marcarse listo / no listo en el lobby.
    this.onMessage('setReady', (client, ready) => {
      const p = this.state.players.get(client.sessionId)
      if (p) p.ready = !!ready
    })

    // Puntaje en vivo durante la ronda (el cliente manda su total de la ronda).
    this.onMessage('score', (client, value) => {
      if (this.state.phase !== 'playing') return
      const p = this.state.players.get(client.sessionId)
      if (p && !p.finished) p.roundScore = Math.max(0, Math.floor(Number(value) || 0))
    })

    // El jugador terminó su ronda (ganó, perdió o se quedó sin tiempo local).
    this.onMessage('finishRound', (client, value) => {
      if (this.state.phase !== 'playing') return
      const p = this.state.players.get(client.sessionId)
      if (!p || p.finished) return
      if (value != null) p.roundScore = Math.max(p.roundScore, Math.floor(Number(value) || 0))
      p.finished = true
      this.maybeEndRoundEarly()
    })

    // Volver al lobby tras el podio final (anfitrión).
    this.onMessage('backToLobby', (client) => {
      if (client.sessionId !== this.state.hostId) return
      this.resetToLobby()
    })
  }

  onJoin(client, options) {
    const p = new Player()
    p.id = client.sessionId
    p.nickname = (options?.nickname || 'Invitado').slice(0, 16)
    p.skin = options?.skin || '🦁'
    // El primer jugador en entrar es el anfitrión.
    if (!this.state.hostId) {
      this.state.hostId = client.sessionId
      p.isHost = true
    }
    this.state.players.set(client.sessionId, p)
  }

  async onLeave(client, consented) {
    const p = this.state.players.get(client.sessionId)
    if (p) p.connected = false

    try {
      if (consented) throw new Error('consented')
      // Espera una posible reconexión (cambio de red / pantalla bloqueada).
      await this.allowReconnection(client, RECONNECT_SECONDS)
      const back = this.state.players.get(client.sessionId)
      if (back) back.connected = true
    } catch {
      this.removePlayer(client.sessionId)
    }
  }

  removePlayer(sessionId) {
    const wasHost = this.state.hostId === sessionId
    this.state.players.delete(sessionId)

    // Reasigna anfitrión si se fue el host.
    if (wasHost) {
      const next = this.state.players.values().next().value
      this.state.hostId = next ? next.id : ''
      if (next) next.isHost = true
    }

    // Si estábamos jugando y se va gente, quizá ya terminaron todos.
    if (this.state.phase === 'playing') this.maybeEndRoundEarly()
  }

  // ---- Flujo de la partida ----

  startMatch() {
    // Cola de minijuegos (mezclada; rellena si hay más rondas que minijuegos).
    const queue = []
    while (queue.length < this.state.totalRounds) {
      queue.push(...shuffle(MINIGAME_POOL))
    }
    this.state.minigameQueue.clear()
    queue.slice(0, this.state.totalRounds).forEach((id) => this.state.minigameQueue.push(id))

    // Reinicia marcador total.
    this.state.players.forEach((p) => {
      p.score = 0
      p.roundScore = 0
      p.finished = false
    })
    this.state.round = 0
    this.nextRound()
  }

  nextRound() {
    this.clearRoundTimer()
    this.state.round += 1

    if (this.state.round > this.state.totalRounds) {
      this.state.phase = 'final'
      this.state.roundEndsAt = 0
      return
    }

    this.state.currentMinigame = this.state.minigameQueue[this.state.round - 1]
    this.state.players.forEach((p) => {
      p.roundScore = 0
      p.finished = false
    })

    // Cuenta atrás, luego empieza el juego.
    this.state.phase = 'countdown'
    this.state.roundEndsAt = 0
    this.roundTimer = this.clock.setTimeout(() => this.beginPlay(), COUNTDOWN_MS)
  }

  beginPlay() {
    this.state.phase = 'playing'
    this.state.roundEndsAt = Date.now() + ROUND_MS
    this.roundTimer = this.clock.setTimeout(() => this.endRound(), ROUND_MS)
  }

  maybeEndRoundEarly() {
    const players = [...this.state.players.values()].filter((p) => p.connected)
    if (players.length > 0 && players.every((p) => p.finished)) {
      this.endRound()
    }
  }

  endRound() {
    if (this.state.phase !== 'playing' && this.state.phase !== 'countdown') return
    this.clearRoundTimer()

    // Acumula el puntaje de la ronda al total.
    this.state.players.forEach((p) => {
      p.score += p.roundScore
    })

    this.state.phase = 'results'
    this.state.roundEndsAt = 0

    // Tras unos segundos viendo la tabla → siguiente ronda (o podio final).
    this.roundTimer = this.clock.setTimeout(() => this.nextRound(), RESULTS_MS)
  }

  resetToLobby() {
    this.clearRoundTimer()
    this.state.phase = 'lobby'
    this.state.round = 0
    this.state.currentMinigame = ''
    this.state.roundEndsAt = 0
    this.state.minigameQueue.clear()
    this.state.players.forEach((p) => {
      p.score = 0
      p.roundScore = 0
      p.finished = false
      p.ready = false
    })
  }

  clearRoundTimer() {
    if (this.roundTimer) {
      this.roundTimer.clear()
      this.roundTimer = null
    }
  }

  onDispose() {
    this.clearRoundTimer()
  }
}
