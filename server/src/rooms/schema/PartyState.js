import { Schema, MapSchema, ArraySchema, type } from '@colyseus/schema'

/**
 * PartyState — Estado SINCRONIZADO de una sala (Colyseus 0.15).
 *
 * Colyseus replica automáticamente este estado a todos los clientes y solo
 * envía los cambios (deltas). El cliente lo recibe reactivo en NetContext.
 *
 * Fases de la sala:
 *   lobby     → esperando jugadores; el anfitrión configura y arranca.
 *   countdown → 3·2·1 antes de cada ronda.
 *   playing   → todos juegan el mismo minijuego; envían su puntaje en vivo.
 *   results   → tabla de la ronda; se acumula al total.
 *   final     → 🏆 podio con el campeón.
 */

export class Player extends Schema {
  constructor() {
    super()
    this.id = ''
    this.nickname = 'Invitado'
    this.skin = '🦁'
    this.score = 0 // puntaje TOTAL acumulado en la partida
    this.roundScore = 0 // puntaje de la ronda actual (en vivo)
    this.ready = false // listo en el lobby
    this.finished = false // ya terminó su ronda actual
    this.connected = true
    this.isHost = false
  }
}
type('string')(Player.prototype, 'id')
type('string')(Player.prototype, 'nickname')
type('string')(Player.prototype, 'skin')
type('number')(Player.prototype, 'score')
type('number')(Player.prototype, 'roundScore')
type('boolean')(Player.prototype, 'ready')
type('boolean')(Player.prototype, 'finished')
type('boolean')(Player.prototype, 'connected')
type('boolean')(Player.prototype, 'isHost')

export class PartyState extends Schema {
  constructor() {
    super()
    this.code = '' // código de 4 letras de la sala
    this.phase = 'lobby' // lobby | countdown | playing | results | final
    this.hostId = '' // sessionId del anfitrión
    this.currentMinigame = '' // id del minijuego de la ronda actual
    this.round = 0 // ronda actual (1..totalRounds)
    this.totalRounds = 4
    this.roundEndsAt = 0 // timestamp (ms) en que termina la ronda (0 = sin límite)
    this.players = new MapSchema()
    this.minigameQueue = new ArraySchema() // ids de minijuegos de la partida
  }
}
type('string')(PartyState.prototype, 'code')
type('string')(PartyState.prototype, 'phase')
type('string')(PartyState.prototype, 'hostId')
type('string')(PartyState.prototype, 'currentMinigame')
type('number')(PartyState.prototype, 'round')
type('number')(PartyState.prototype, 'totalRounds')
type('number')(PartyState.prototype, 'roundEndsAt')
type({ map: Player })(PartyState.prototype, 'players')
type(['string'])(PartyState.prototype, 'minigameQueue')
