import { createContext, useContext, useEffect, useReducer, useCallback } from 'react'
import { DEFAULT_SKINS, DEFAULT_MINIGAMES } from '../data/catalog'

/**
 * GameContext — Estado centralizado del juego (Regla de Oro #3).
 *
 * Separa dos tipos de estado:
 *  - PERSISTENTE (cartera + desbloqueos + perfil): monedas, diamantes,
 *    skins/minijuegos comprados, nickname y skin. Se guarda en localStorage.
 *  - DE PARTIDA (freshRun): nivel, vidas, progreso... se reinicia cada ronda.
 */

const GameContext = createContext(null)

export const SCREENS = {
  MENU: 'MENU',
  PROFILE: 'PROFILE',
  SELECT: 'SELECT',
  SHOP: 'SHOP', // tienda para canjear monedas/diamantes
  PLAYING: 'PLAYING',
  VICTORY: 'VICTORY',
  DEFEAT: 'DEFEAT',
}

const START_LIVES = 1 // 1 vida → desde la 1ª derrota se muestra el versículo
const MAX_LIVES = 1 // coherente con el HUD (sin corazones vacíos imposibles)
const PROGRESS_GOAL = 100
const WIN_LEVEL = 3 // ganar la ronda en este nivel → ¡VICTORIA final!
const SAVE_KEY = 'arca_party_save_v1'

// Estadísticas de una partida (se reinician al elegir un minijuego)
const freshRun = {
  level: 1,
  lives: START_LIVES,
  score: 0,
  progress: 0,
  paused: false,
}

// Cartera/desbloqueos/perfil por defecto (cartera inicial para poder probar
// la tienda desde el arranque).
const defaultPersistent = {
  coins: 300, // 🪙
  diamonds: 5, // 💎
  unlockedSkins: DEFAULT_SKINS,
  unlockedMinigames: DEFAULT_MINIGAMES,
  nickname: '',
  skin: '🦁',
}

/** Carga la parte persistente desde localStorage (con tolerancia a fallos). */
function loadPersistent() {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return defaultPersistent
    const saved = JSON.parse(raw)
    return {
      ...defaultPersistent,
      ...saved,
      // arrays seguros
      unlockedSkins: Array.isArray(saved.unlockedSkins) ? saved.unlockedSkins : DEFAULT_SKINS,
      unlockedMinigames: Array.isArray(saved.unlockedMinigames) ? saved.unlockedMinigames : DEFAULT_MINIGAMES,
    }
  } catch {
    return defaultPersistent
  }
}

function makeInitialState() {
  return {
    screen: SCREENS.MENU,
    currentMinigame: 'acomoda',
    ...freshRun,
    ...loadPersistent(),
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_PROFILE':
      return { ...state, nickname: action.nickname, skin: action.skin }

    case 'SELECT_MINIGAME':
      // Nueva partida (conserva cartera, desbloqueos y perfil)
      return { ...state, ...freshRun, currentMinigame: action.id, screen: SCREENS.PLAYING }

    case 'GAME_OVER':
      return { ...state, screen: SCREENS.DEFEAT, paused: false }

    case 'GO_TO':
      return { ...state, screen: action.screen, paused: false }

    case 'ADD_SCORE':
      return { ...state, score: Math.max(0, state.score + action.amount) }

    case 'ADD_COINS':
      return { ...state, coins: Math.max(0, state.coins + action.amount) }

    case 'ADD_DIAMONDS':
      return { ...state, diamonds: Math.max(0, state.diamonds + action.amount) }

    case 'ADD_PROGRESS':
      return { ...state, progress: Math.max(0, Math.min(PROGRESS_GOAL, state.progress + action.amount)) }

    case 'LOSE_LIFE': {
      const lives = state.lives - 1
      const dead = lives <= 0
      return { ...state, lives, paused: dead ? false : state.paused, screen: dead ? SCREENS.DEFEAT : state.screen }
    }

    case 'GAIN_LIFE':
      return { ...state, lives: Math.min(MAX_LIVES, state.lives + 1) }

    case 'NEXT_LEVEL': {
      // Si ya se ganó la ronda del nivel meta → pantalla de VICTORIA final
      if (state.level >= WIN_LEVEL) return { ...state, screen: SCREENS.VICTORY, paused: false }
      return { ...state, level: state.level + 1, progress: 0 }
    }

    case 'TOGGLE_PAUSE':
      return { ...state, paused: !state.paused }

    case 'EQUIP_SKIN':
      return { ...state, skin: action.emoji }

    case 'BUY_SKIN': {
      const { id, emoji, cost, currency } = action.skin
      if (state.unlockedSkins.includes(id)) return { ...state, skin: emoji } // ya comprado → equipar
      const wallet = currency === 'diamond' ? state.diamonds : state.coins
      if (wallet < cost) return state // no alcanza
      return {
        ...state,
        coins: currency === 'coin' ? state.coins - cost : state.coins,
        diamonds: currency === 'diamond' ? state.diamonds - cost : state.diamonds,
        unlockedSkins: [...state.unlockedSkins, id],
        skin: emoji, // equipar al comprar
      }
    }

    case 'BUY_MINIGAME': {
      const { id, cost, currency } = action.game
      if (state.unlockedMinigames.includes(id)) return state
      const wallet = currency === 'diamond' ? state.diamonds : state.coins
      if (wallet < cost) return state
      return {
        ...state,
        coins: currency === 'coin' ? state.coins - cost : state.coins,
        diamonds: currency === 'diamond' ? state.diamonds - cost : state.diamonds,
        unlockedMinigames: [...state.unlockedMinigames, id],
      }
    }

    case 'RESET':
      // Vuelve al menú conservando TODO lo persistente
      return {
        ...makeInitialState(),
        coins: state.coins,
        diamonds: state.diamonds,
        unlockedSkins: state.unlockedSkins,
        unlockedMinigames: state.unlockedMinigames,
        nickname: state.nickname,
        skin: state.skin,
        currentMinigame: state.currentMinigame,
      }

    default:
      return state
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, makeInitialState)

  // Persistencia con debounce: agrupa escrituras para no tocar localStorage
  // (operación síncrona) en cada cambio de monedas durante el juego.
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        localStorage.setItem(
          SAVE_KEY,
          JSON.stringify({
            coins: state.coins,
            diamonds: state.diamonds,
            unlockedSkins: state.unlockedSkins,
            unlockedMinigames: state.unlockedMinigames,
            nickname: state.nickname,
            skin: state.skin,
          }),
        )
      } catch {
        /* almacenamiento no disponible: se ignora */
      }
    }, 400)
    return () => clearTimeout(id)
  }, [state.coins, state.diamonds, state.unlockedSkins, state.unlockedMinigames, state.nickname, state.skin])

  const setProfile = useCallback((nickname, skin) => dispatch({ type: 'SET_PROFILE', nickname, skin }), [])
  const selectMinigame = useCallback((id) => dispatch({ type: 'SELECT_MINIGAME', id }), [])
  const gameOver = useCallback(() => dispatch({ type: 'GAME_OVER' }), [])
  const goTo = useCallback((screen) => dispatch({ type: 'GO_TO', screen }), [])
  const addScore = useCallback((amount) => dispatch({ type: 'ADD_SCORE', amount }), [])
  const addCoins = useCallback((amount) => dispatch({ type: 'ADD_COINS', amount }), [])
  const addDiamonds = useCallback((amount) => dispatch({ type: 'ADD_DIAMONDS', amount }), [])
  const addProgress = useCallback((amount) => dispatch({ type: 'ADD_PROGRESS', amount }), [])
  const loseLife = useCallback(() => dispatch({ type: 'LOSE_LIFE' }), [])
  const gainLife = useCallback(() => dispatch({ type: 'GAIN_LIFE' }), [])
  const nextLevel = useCallback(() => dispatch({ type: 'NEXT_LEVEL' }), [])
  const togglePause = useCallback(() => dispatch({ type: 'TOGGLE_PAUSE' }), [])
  const equipSkin = useCallback((emoji) => dispatch({ type: 'EQUIP_SKIN', emoji }), [])
  const buySkin = useCallback((skin) => dispatch({ type: 'BUY_SKIN', skin }), [])
  const buyMinigame = useCallback((game) => dispatch({ type: 'BUY_MINIGAME', game }), [])
  const reset = useCallback(() => dispatch({ type: 'RESET' }), [])

  const speedFactor = Math.max(0.45, 1 - (state.level - 1) * 0.12)

  const value = {
    ...state,
    speedFactor,
    maxLives: MAX_LIVES,
    progressGoal: PROGRESS_GOAL,
    winLevel: WIN_LEVEL,
    setProfile,
    selectMinigame,
    gameOver,
    goTo,
    addScore,
    addCoins,
    addDiamonds,
    addProgress,
    loseLife,
    gainLife,
    nextLevel,
    togglePause,
    equipSkin,
    buySkin,
    buyMinigame,
    reset,
  }

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame() debe usarse dentro de <GameProvider>')
  return ctx
}
