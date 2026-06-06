import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGame } from '../context/GameContext'
import { playSound } from '../sound'
import WoodButton from './WoodButton'

/**
 * AtrapaFruta — Minijuego de REFLEJOS. Caen/aparecen frutas: tócalas para
 * cosecharlas (+puntos). ¡Cuidado con la 💣 bomba (te elimina) y deja que las
 * frutas no se escapen! Sobrevive hasta que acabe el tiempo para ganar.
 * Dificultad escalable (aparecen más rápido, más bombas, menos vida útil).
 * 100% por toque → ideal para móvil.
 *
 * props: onWin(), onLose(), onCorrect(), onCoins()
 */
const FRUITS = ['🍎', '🍌', '🍇', '🍓', '🍊', '🥝', '🍉', '🥥']
const BOMB = '💣'

function buildConfig(level) {
  return {
    duration: Math.max(18, 26 - level), // s de la ronda
    spawnEvery: Math.max(420, 1050 - level * 110), // ms entre apariciones
    life: Math.max(800, 1600 - level * 120), // ms que dura cada objeto
    bombChance: Math.min(0.34, 0.1 + level * 0.04),
  }
}

export default function AtrapaFruta({ onWin, onLose, onCorrect, onCoins }) {
  const { level, paused } = useGame()

  const [config, setConfig] = useState(() => buildConfig(level))
  const [items, setItems] = useState([])
  const [timeLeft, setTimeLeft] = useState(config.duration)
  const [score, setScore] = useState(0)
  const [status, setStatus] = useState('playing')
  const [round, setRound] = useState(0)

  const pausedRef = useRef(paused)
  pausedRef.current = paused
  const statusRef = useRef(status)
  statusRef.current = status
  const idRef = useRef(1)

  // Bucle de aparición + limpieza de objetos caducados.
  useEffect(() => {
    if (status !== 'playing') return
    const spawn = setInterval(() => {
      if (pausedRef.current) return
      const isBomb = Math.random() < config.bombChance
      const item = {
        id: idRef.current++,
        emoji: isBomb ? BOMB : FRUITS[Math.floor(Math.random() * FRUITS.length)],
        bomb: isBomb,
        x: 8 + Math.random() * 84, // %
        y: 22 + Math.random() * 64, // %
        born: Date.now(),
      }
      setItems((arr) => [...arr, item])
    }, config.spawnEvery)

    const prune = setInterval(() => {
      if (pausedRef.current) return
      const now = Date.now()
      setItems((arr) => arr.filter((it) => now - it.born < config.life))
    }, 120)

    return () => {
      clearInterval(spawn)
      clearInterval(prune)
    }
  }, [status, round, config])

  // Temporizador de la ronda.
  useEffect(() => {
    if (status !== 'playing') return
    const id = setInterval(() => {
      if (pausedRef.current) return
      setTimeLeft((t) => (t <= 1 ? 0 : t - 1))
    }, 1000)
    return () => clearInterval(id)
  }, [status, round])

  useEffect(() => {
    if (timeLeft === 0 && status === 'playing') {
      setStatus('won')
      playSound('win')
      onWin?.()
    }
  }, [timeLeft, status, onWin])

  const tap = (item) => {
    if (statusRef.current !== 'playing' || pausedRef.current) return
    if (item.bomb) {
      setStatus('lost')
      playSound('lose')
      onLose?.()
      return
    }
    setItems((arr) => arr.filter((it) => it.id !== item.id))
    setScore((s) => s + 1)
    playSound('coin')
    onCorrect?.()
    onCoins?.(10)
  }

  const restart = () => {
    const next = buildConfig(level)
    setConfig(next)
    setItems([])
    setTimeLeft(next.duration)
    setScore(0)
    setStatus('playing')
    setRound((r) => r + 1)
  }

  const danger = timeLeft <= 5
  const pct = (timeLeft / config.duration) * 100

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Encabezado */}
      <div className="absolute inset-x-0 top-[3cqh] z-20 flex items-center justify-between px-[3cqw]">
        <div className="wood-3d rounded-[1.4cqh] px-[2cqw] py-[0.6cqh] font-display text-[2.4cqh] text-white text-stroke">
          🧺 {score}
        </div>
        <div className="flex items-center gap-[1cqw]">
          <span className="text-[3cqh]">⏰</span>
          <div className="wood-inset h-[2.4cqh] w-[26cqw] overflow-hidden rounded-full">
            <motion.div
              className="h-full rounded-full"
              animate={{ width: `${pct}%` }}
              transition={{ ease: 'linear', duration: 0.4 }}
              style={{ background: danger ? 'var(--color-coral)' : 'var(--color-leaf-bright)' }}
            />
          </div>
          <span className="font-display text-[2.8cqh] tabular-nums text-stroke" style={{ color: danger ? '#ff5252' : '#fff' }}>
            {timeLeft}s
          </span>
        </div>
      </div>

      {/* Instrucción */}
      <div className="absolute inset-x-0 top-[9cqh] z-10 flex justify-center">
        <span className="font-display text-[2.2cqh] text-white/85 text-stroke">¡Toca las frutas, evita la 💣!</span>
      </div>

      {/* Objetos */}
      <AnimatePresence>
        {items.map((item) => (
          <motion.button
            key={item.id}
            onPointerDown={(e) => {
              e.preventDefault()
              tap(item)
            }}
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 16 }}
            className="gpu absolute z-10 flex items-center justify-center rounded-full"
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              width: '13cqh',
              height: '13cqh',
              fontSize: '8cqh',
              transform: 'translate(-50%, -50%)',
              touchAction: 'none',
              background: item.bomb ? 'radial-gradient(circle at 50% 35%, #ffb3b3, #c0392b)' : 'radial-gradient(circle at 50% 35%, #fff6cf, #f6c453)',
              border: '0.4cqh solid var(--color-wood-edge)',
              boxShadow: '0 0.6cqh 1cqh rgba(0,0,0,0.35)',
            }}
          >
            {item.emoji}
          </motion.button>
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {status !== 'playing' && <ResultOverlay won={status === 'won'} score={score} onReplay={restart} />}
      </AnimatePresence>
    </div>
  )
}

function ResultOverlay({ won, score, onReplay }) {
  return (
    <motion.div
      className="absolute inset-0 z-40 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/55" />
      <motion.div
        className="parchment relative z-10 flex flex-col items-center gap-[1.2cqh] rounded-[2.4cqh] px-[6cqw] py-[3cqh]"
        initial={{ scale: 0.7, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 16 }}
      >
        <span className="gold-text font-display text-[5.5cqh] text-stroke-lg">{won ? '🎉 ¡Cosecha lista!' : '💥 ¡Bomba!'}</span>
        <span className="font-display text-[3.4cqh] text-wood-dark">🧺 {score} frutas</span>
        <WoodButton size="md" variant="leaf" glow onClick={onReplay}>
          🔁 Jugar de nuevo
        </WoodButton>
      </motion.div>
    </motion.div>
  )
}
