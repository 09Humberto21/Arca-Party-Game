import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGame } from '../context/GameContext'
import { playSound } from '../sound'
import WoodButton from './WoodButton'

/**
 * SerpienteArca — Minijuego #4 (estilo SNAKE).
 *
 * Guía a la serpiente con las FLECHAS (o WASD) para comer animales y crecer.
 * Cada animal = puntos (monedas + progreso). Choca con el borde o contigo
 * mismo → pierdes. Come el objetivo de animales → ganas y subes de nivel.
 * La velocidad sube con el nivel.
 *
 * props: onWin(), onLose(), onCorrect()
 */

const COLS = 15
const ROWS = 11
const CELL = 4.6 // cqmin por celda
const FOOD_SET = ['🐭', '🐰', '🐤', '🐟', '🍎', '🍇', '🥕', '🐞', '🦗']

function buildConfig(level) {
  return {
    tick: Math.max(95, 185 - level * 12), // ms por paso (arranque jugable, más rápido al subir)
    target: 8 + level * 2, // animales a comer para ganar
  }
}

const eq = (a, b) => a.x === b.x && a.y === b.y

function randFood(snake) {
  let p
  let guard = 0
  do {
    p = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) }
    guard++
  } while (snake.some((s) => eq(s, p)) && guard < 200)
  return { ...p, emoji: FOOD_SET[Math.floor(Math.random() * FOOD_SET.length)] }
}

export default function SerpienteArca({ onWin, onLose, onCorrect }) {
  const { skin, level, paused } = useGame()

  const [config, setConfig] = useState(() => buildConfig(level))
  const [status, setStatus] = useState('playing')
  const [score, setScore] = useState(0)
  const [round, setRound] = useState(0)
  const [view, setView] = useState(() => {
    const snake = [
      { x: 6, y: 5 },
      { x: 5, y: 5 },
      { x: 4, y: 5 },
    ]
    return { snake, food: randFood(snake) }
  })

  const sim = useRef(null)
  const statusRef = useRef(status)
  const pausedRef = useRef(paused)
  const cbs = useRef({})
  statusRef.current = status
  pausedRef.current = paused
  cbs.current = { onWin, onLose, onCorrect }

  // Inicializa/reinicia la simulación
  useEffect(() => {
    const snake = [
      { x: 6, y: 5 },
      { x: 5, y: 5 },
      { x: 4, y: 5 },
    ]
    sim.current = {
      snake,
      dir: { x: 1, y: 0 },
      next: { x: 1, y: 0 },
      food: randFood(snake),
      ended: false,
    }
    setView({ snake: [...snake], food: sim.current.food })
  }, [round])

  // Bucle de pasos (intervalo según velocidad). Congela en pausa.
  useEffect(() => {
    const id = setInterval(() => {
      const s = sim.current
      if (!s || s.ended) return
      if (statusRef.current !== 'playing' || pausedRef.current) return

      // aplica dirección (sin invertir 180°)
      if (s.next.x !== -s.dir.x || s.next.y !== -s.dir.y) s.dir = s.next
      const head = { x: s.snake[0].x + s.dir.x, y: s.snake[0].y + s.dir.y }

      // choque con borde
      if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
        s.ended = true
        playSound('lose')
        setStatus('lost')
        cbs.current.onLose?.()
        return
      }

      const willEat = eq(head, s.food)
      // choque consigo misma (la cola se moverá si no come)
      const body = willEat ? s.snake : s.snake.slice(0, -1)
      if (body.some((seg) => eq(seg, head))) {
        s.ended = true
        playSound('lose')
        setStatus('lost')
        cbs.current.onLose?.()
        return
      }

      s.snake.unshift(head)
      if (willEat) {
        playSound('eat')
        cbs.current.onCorrect?.()
        const newScore = s.snakeScore = (s.snakeScore || 0) + 1
        setScore(newScore)
        s.food = randFood(s.snake)
        if (newScore >= config.target) {
          s.ended = true
          playSound('win')
          setStatus('won')
          cbs.current.onWin?.()
        }
      } else {
        s.snake.pop()
      }
      setView({ snake: [...s.snake], food: s.food })
    }, config.tick)
    return () => clearInterval(id)
  }, [round, config])

  // Controles: flechas / WASD
  useEffect(() => {
    const map = {
      ArrowUp: { x: 0, y: -1 }, w: { x: 0, y: -1 }, W: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 }, s: { x: 0, y: 1 }, S: { x: 0, y: 1 },
      ArrowLeft: { x: -1, y: 0 }, a: { x: -1, y: 0 }, A: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 }, d: { x: 1, y: 0 }, D: { x: 1, y: 0 },
    }
    const onKey = (e) => {
      const d = map[e.key]
      if (!d) return
      e.preventDefault()
      const s = sim.current
      if (s) s.next = d
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const restart = () => {
    setConfig(buildConfig(level))
    setScore(0)
    setStatus('playing')
    setRound((r) => r + 1)
  }

  const boardW = COLS * CELL
  const boardH = ROWS * CELL
  const won = status === 'won'
  const pct = Math.min(100, (score / config.target) * 100)

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Encabezado */}
      <div className="absolute inset-x-0 top-[12.5cqmin] z-20 flex flex-col items-center gap-[1cqmin]">
        <div
          className="anim-sway gpu rounded-[1.6cqmin] border-[0.5cqmin] border-wood-dark bg-gradient-to-b from-wood-light to-wood px-[3cqw] py-[0.6cqmin] font-display text-[2.3cqmin] text-white text-stroke"
          style={{ boxShadow: '0 5px 0 var(--color-wood-dark), 0 10px 16px rgba(0,0,0,0.3)' }}
        >
          🐍 Nivel {level} · come {config.target} animales · usa las ⬆️⬅️⬇️➡️
        </div>
        <div className="flex items-center gap-[1.2cqw]">
          <div className="wood-inset relative h-[2.8cqmin] w-[30cqw] overflow-hidden rounded-full">
            <motion.div
              className="gloss h-full rounded-full"
              animate={{ width: `${pct}%` }}
              transition={{ ease: 'linear', duration: 0.15 }}
              style={{ background: 'linear-gradient(to bottom, #69ffae, var(--color-leaf-bright) 55%, #00b85a)', boxShadow: 'inset 0 0.4cqmin 0 rgba(255,255,255,0.5)' }}
            />
          </div>
          <span className="font-display text-[3cqmin] tabular-nums text-white text-stroke">{score}/{config.target}</span>
        </div>
      </div>

      {/* Tablero */}
      <div className="absolute inset-x-0 top-[26cqmin] z-10 flex justify-center">
        <div
          className="wood-3d relative rounded-[2cqmin] p-[1cqmin]"
          style={{ width: `${boardW + 2}cqmin`, height: `${boardH + 2}cqmin` }}
        >
          {/* playfield */}
          <div
            className="relative overflow-hidden rounded-[1.2cqmin]"
            style={{
              width: `${boardW}cqmin`,
              height: `${boardH}cqmin`,
              backgroundColor: '#06324f',
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.06) 0.1cqmin, transparent 0.1cqmin), linear-gradient(90deg, rgba(255,255,255,0.06) 0.1cqmin, transparent 0.1cqmin)',
              backgroundSize: `${CELL}cqmin ${CELL}cqmin`,
              boxShadow: 'inset 0 0 2cqmin rgba(0,0,0,0.55)',
            }}
          >
            {/* Comida */}
            <motion.div
              key={`${view.food.x}-${view.food.y}-${view.food.emoji}`}
              className="absolute flex items-center justify-center"
              style={{ left: `${view.food.x * CELL}cqmin`, top: `${view.food.y * CELL}cqmin`, width: `${CELL}cqmin`, height: `${CELL}cqmin`, zIndex: 3 }}
              initial={{ scale: 0.4 }}
              animate={{ scale: [1, 1.18, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <span style={{ fontSize: `${CELL * 0.7}cqmin` }}>{view.food.emoji}</span>
            </motion.div>

            {/* Serpiente */}
            {view.snake.map((seg, i) => {
              const isHead = i === 0
              return (
                <div
                  key={i}
                  className="absolute flex items-center justify-center"
                  style={{
                    left: `${seg.x * CELL + CELL * 0.04}cqmin`,
                    top: `${seg.y * CELL + CELL * 0.04}cqmin`,
                    width: `${CELL * 0.92}cqmin`,
                    height: `${CELL * 0.92}cqmin`,
                    borderRadius: isHead ? '40%' : '30%',
                    background: isHead
                      ? 'radial-gradient(circle at 50% 35%, #d9ffe9, #00c965 80%)'
                      : `linear-gradient(135deg, #34e08a, #16a35a)`,
                    border: '0.25cqmin solid rgba(0,80,40,0.6)',
                    boxShadow: isHead ? '0 0 1.5cqmin rgba(0,230,118,0.8)' : 'inset 0 -0.3cqmin 0.4cqmin rgba(0,0,0,0.25)',
                    zIndex: isHead ? 5 : 4,
                  }}
                >
                  {isHead && <span style={{ fontSize: `${CELL * 0.6}cqmin` }}>{skin}</span>}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Overlay de victoria (la derrota va a DefeatScreen) */}
      <AnimatePresence>
        {won && (
          <motion.div className="absolute inset-0 z-50 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/55" />
            <motion.div
              className="parchment relative z-10 flex flex-col items-center gap-[2cqmin] rounded-[2cqmin] px-[8cqw] py-[5cqmin]"
              initial={{ scale: 0.5, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 240, damping: 16 }}
            >
              <motion.div className="text-[12cqmin]" animate={{ rotate: [-10, 10, -10], y: [0, -10, 0] }} transition={{ duration: 1.2, repeat: Infinity }}>
                🐍
              </motion.div>
              <h2 className="gold-text font-display text-[6cqmin]">¡SERPIENTE LLENA!</h2>
              <p className="font-body text-[2.6cqmin] font-bold text-[#7a531f]">¡{config.target} animales a bordo! Sube de nivel 🚢</p>
              <WoodButton size="lg" variant="leaf" glow onClick={restart}>
                ➡️ Siguiente reto
              </WoodButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
