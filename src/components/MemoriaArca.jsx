import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGame } from '../context/GameContext'
import { playSound } from '../sound'
import WoodButton from './WoodButton'

/**
 * MemoriaArca — Minijuego de MEMORIA (parejas). Voltea dos cartas; si los dos
 * animales coinciden, se quedan descubiertas. Encuentra todas las parejas antes
 * de que acabe el tiempo. Dificultad escalable con el nivel (más parejas, menos
 * tiempo). 100% por toque → ideal para móvil.
 *
 * props: onWin(), onLose(), onCorrect()
 */
const POOL = ['🦁', '🐘', '🦒', '🐵', '🦓', '🐯', '🐼', '🦛', '🦊', '🐨', '🐧', '🦉']

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildConfig(level) {
  const pairs = Math.min(POOL.length, 4 + level) // L1=5 parejas … cap 12
  const time = Math.max(18, 42 - level * 3) // L1=39s … mín 18
  const animals = shuffle(POOL).slice(0, pairs)
  const deck = shuffle(animals.concat(animals)).map((emoji, i) => ({ key: i, emoji }))
  const cols = Math.min(6, Math.ceil(Math.sqrt(deck.length * 1.6)))
  const rows = Math.ceil(deck.length / cols)
  const size = Math.min(15, Math.floor(62 / rows)) // cqmin por carta
  return { pairs, time, deck, cols, size }
}

export default function MemoriaArca({ onWin, onLose, onCorrect }) {
  const { level, paused } = useGame()

  const [config, setConfig] = useState(() => buildConfig(level))
  const [flipped, setFlipped] = useState([]) // keys boca arriba (máx 2)
  const [matched, setMatched] = useState([]) // emojis ya emparejados
  const [timeLeft, setTimeLeft] = useState(config.time)
  const [status, setStatus] = useState('playing')
  const [round, setRound] = useState(0)
  const lockRef = useRef(false)

  const pausedRef = useRef(paused)
  pausedRef.current = paused

  // Temporizador (congelado en pausa).
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
      setStatus('lost')
      playSound('lose')
      onLose?.()
    }
  }, [timeLeft, status, onLose])

  // Victoria: todas las parejas encontradas.
  useEffect(() => {
    if (status === 'playing' && matched.length === config.pairs && config.pairs > 0) {
      setStatus('won')
      playSound('win')
      onWin?.()
    }
  }, [matched, config.pairs, status, onWin])

  const tap = (card) => {
    if (lockRef.current || status !== 'playing' || pausedRef.current) return
    if (flipped.includes(card.key) || matched.includes(card.emoji)) return
    playSound('click')

    const next = [...flipped, card.key]
    setFlipped(next)
    if (next.length < 2) return

    // Segunda carta → comparar.
    lockRef.current = true
    const [a, b] = next.map((k) => config.deck.find((c) => c.key === k))
    if (a.emoji === b.emoji) {
      setTimeout(() => {
        setMatched((m) => [...m, a.emoji])
        setFlipped([])
        lockRef.current = false
        playSound('correct')
        onCorrect?.()
      }, 350)
    } else {
      setTimeout(() => {
        setFlipped([])
        lockRef.current = false
        playSound('error')
      }, 800)
    }
  }

  const restart = () => {
    const next = buildConfig(level)
    setConfig(next)
    setFlipped([])
    setMatched([])
    setTimeLeft(next.time)
    setStatus('playing')
    setRound((r) => r + 1)
    lockRef.current = false
  }

  const danger = timeLeft <= 5
  const pct = (timeLeft / config.time) * 100

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Encabezado */}
      <div className="absolute inset-x-0 top-[11cqmin] z-20 flex flex-col items-center gap-[1.2cqmin]">
        <div className="wood-3d rounded-[1.6cqmin] px-[3cqw] py-[0.7cqmin] font-display text-[2.4cqmin] text-white text-stroke">
          🧠 Nivel {level} · {matched.length}/{config.pairs} parejas
        </div>
        <div className="flex items-center gap-[1.2cqw]">
          <span className="text-[3.4cqmin]">⏰</span>
          <div className="wood-inset h-[2.6cqmin] w-[30cqw] overflow-hidden rounded-full">
            <motion.div
              className="h-full rounded-full"
              animate={{ width: `${pct}%` }}
              transition={{ ease: 'linear', duration: 0.4 }}
              style={{ background: danger ? 'var(--color-coral)' : 'var(--color-leaf-bright)' }}
            />
          </div>
          <span className="font-display text-[3cqmin] tabular-nums text-stroke" style={{ color: danger ? '#ff5252' : '#fff' }}>
            {timeLeft}s
          </span>
        </div>
      </div>

      {/* Tablero de cartas */}
      <div className="absolute inset-x-0 top-[24cqmin] z-10 flex justify-center px-[2cqw]">
        <div
          className="grid"
          style={{ gridTemplateColumns: `repeat(${config.cols}, ${config.size}cqmin)`, gap: `${Math.max(1, config.size * 0.12)}cqmin` }}
        >
          {config.deck.map((card) => {
            const up = flipped.includes(card.key) || matched.includes(card.emoji)
            const done = matched.includes(card.emoji)
            return (
              <motion.button
                key={card.key}
                onClick={() => tap(card)}
                whileTap={{ scale: 0.92 }}
                animate={{ rotateY: up ? 180 : 0, opacity: done ? 0.75 : 1 }}
                transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                className="gpu relative flex items-center justify-center rounded-[1.4cqmin]"
                style={{ width: `${config.size}cqmin`, height: `${config.size}cqmin`, transformStyle: 'preserve-3d' }}
              >
                {/* Reverso (madera) */}
                <span
                  className="wood-3d absolute inset-0 flex items-center justify-center rounded-[1.4cqmin] text-[3.4cqmin]"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  ⚓
                </span>
                {/* Frente (animal) */}
                <span
                  className="parchment absolute inset-0 flex items-center justify-center rounded-[1.4cqmin]"
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', fontSize: `${config.size * 0.55}cqmin` }}
                >
                  {card.emoji}
                </span>
              </motion.button>
            )
          })}
        </div>
      </div>

      <AnimatePresence>
        {status !== 'playing' && (
          <ResultOverlay won={status === 'won'} onReplay={restart} />
        )}
      </AnimatePresence>
    </div>
  )
}

function ResultOverlay({ won, onReplay }) {
  return (
    <motion.div
      className="absolute inset-0 z-40 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/55" />
      <motion.div
        className="parchment relative z-10 flex flex-col items-center gap-[1.4cqmin] rounded-[2.4cqmin] px-[6cqw] py-[3cqmin]"
        initial={{ scale: 0.7, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 16 }}
      >
        <span className="gold-text font-display text-[6cqmin] text-stroke-lg">{won ? '🎉 ¡Genial!' : '⏰ ¡Tiempo!'}</span>
        <WoodButton size="md" variant="leaf" glow onClick={onReplay}>
          🔁 Jugar de nuevo
        </WoodButton>
      </motion.div>
    </motion.div>
  )
}
