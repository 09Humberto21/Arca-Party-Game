import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useAnimation } from 'framer-motion'
import { useGame } from '../context/GameContext'
import { playSound } from '../sound'
import WoodButton from './WoodButton'

/**
 * DesafioSombra — Minijuego #3 (SOPA DE LETRAS).
 *
 * Aparece la SILUETA de un animal; debes ENCONTRAR su nombre en la sopa de
 * letras arrastrando una línea recta (horizontal, vertical o diagonal, en
 * cualquier sentido) antes de que acabe el tiempo.
 *
 * Es un minijuego NORMAL (como los otros):
 *  - Encontrar la palabra → onWin (diamante + sube de nivel) + onCorrect.
 *  - Se acaba el tiempo → onLose (pierde vida → DefeatScreen con versículo).
 *
 * La dificultad sube con el nivel: menos tiempo y más orientaciones donde
 * esconder la palabra (diagonales y al revés).
 *
 * props: onWin(), onLose(), onCorrect()
 */

// Animales con nombre NORMALIZADO (sin tildes/ñ) para la cuadrícula.
const ANIMALS = [
  { emoji: '🦁', word: 'LEON' },
  { emoji: '🐵', word: 'MONO' },
  { emoji: '🦉', word: 'BUHO' },
  { emoji: '🐱', word: 'GATO' },
  { emoji: '🦓', word: 'CEBRA' },
  { emoji: '🐯', word: 'TIGRE' },
  { emoji: '🐼', word: 'PANDA' },
  { emoji: '🦊', word: 'ZORRO' },
  { emoji: '🐨', word: 'KOALA' },
  { emoji: '🐶', word: 'PERRO' },
  { emoji: '🦒', word: 'JIRAFA' },
  { emoji: '🐲', word: 'DRAGON' },
  { emoji: '🐰', word: 'CONEJO' },
  { emoji: '🐬', word: 'DELFIN' },
]

const SIZE = 9
const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}
const key = (r, c) => `${r}-${c}`

function buildPuzzle(level) {
  const item = pick(ANIMALS)
  let dirs = [[0, 1], [1, 0]] // E, S
  if (level >= 3) dirs.push([1, 1], [1, -1]) // diagonales
  const word = level >= 5 && Math.random() < 0.5 ? [...item.word].reverse().join('') : item.word
  const len = word.length

  const grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(''))

  // Coloca la palabra en una dirección/posición válida
  let placed = null
  for (let tries = 0; tries < 200 && !placed; tries++) {
    const [dr, dc] = pick(dirs)
    const rowMin = dr > 0 ? 0 : 0
    const rowMax = dr > 0 ? SIZE - len : SIZE - 1
    const colMin = dc < 0 ? len - 1 : 0
    const colMax = dc > 0 ? SIZE - len : SIZE - 1
    const r0 = rowMin + Math.floor(Math.random() * (rowMax - rowMin + 1))
    const c0 = colMin + Math.floor(Math.random() * (colMax - colMin + 1))
    const cells = []
    for (let i = 0; i < len; i++) cells.push([r0 + dr * i, c0 + dc * i])
    if (cells.every(([r, c]) => r >= 0 && r < SIZE && c >= 0 && c < SIZE)) {
      cells.forEach(([r, c], i) => (grid[r][c] = word[i]))
      placed = cells
    }
  }

  // Respaldo garantizado: si tras 200 intentos no se colocó, ponla horizontal
  if (!placed) {
    const r0 = Math.floor(Math.random() * SIZE)
    const c0 = Math.floor(Math.random() * (SIZE - len + 1))
    for (let i = 0; i < len; i++) grid[r0][c0 + i] = word[i]
  }

  // Rellena el resto con letras aleatorias
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (!grid[r][c]) grid[r][c] = ALPHA[Math.floor(Math.random() * 26)]

  const time = Math.max(8, 26 - level * 2)
  return { item, target: item.word, grid, time }
}

// Línea recta de celdas entre a y b (o null si no están alineadas)
function lineBetween(a, b) {
  const dr = b.r - a.r
  const dc = b.c - a.c
  const adr = Math.abs(dr)
  const adc = Math.abs(dc)
  if (!(dr === 0 || dc === 0 || adr === adc)) return null
  const steps = Math.max(adr, adc)
  const sr = Math.sign(dr)
  const sc = Math.sign(dc)
  const cells = []
  for (let i = 0; i <= steps; i++) cells.push({ r: a.r + sr * i, c: a.c + sc * i })
  return cells
}

export default function DesafioSombra({ onWin, onLose, onCorrect }) {
  const { level, paused } = useGame()

  const [puzzle, setPuzzle] = useState(() => buildPuzzle(level))
  const [status, setStatus] = useState('playing') // playing | won | lost
  const [timeLeft, setTimeLeft] = useState(puzzle.time)
  const [round, setRound] = useState(0)
  const [sel, setSel] = useState([]) // selección actual (claves) — para render
  const [foundCells, setFoundCells] = useState(new Set())

  const dragging = useRef(null) // celda inicial mientras se arrastra
  const selRef = useRef([]) // selección actual (fuente de verdad, sin desfase)
  const gridRef = useRef(null)
  const shakeControls = useAnimation()
  const pausedRef = useRef(paused)
  pausedRef.current = paused

  const applySel = (keys) => {
    selRef.current = keys
    setSel(keys)
  }

  // Reloj (se congela en pausa via ref; el intervalo no se recrea al pausar)
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
      onLose?.()
    }
  }, [timeLeft, status, onLose])

  // ---- Selección por arrastre (con elementFromPoint para ratón y táctil) ----
  const cellFromPoint = (x, y) => {
    const el = document.elementFromPoint(x, y)
    const c = el && el.closest('[data-cell]')
    if (!c) return null
    return { r: Number(c.dataset.r), c: Number(c.dataset.c) }
  }

  const onDown = (e) => {
    if (status !== 'playing' || paused) return
    const cell = cellFromPoint(e.clientX, e.clientY)
    if (!cell) return
    dragging.current = cell
    applySel([key(cell.r, cell.c)])
  }
  const onMove = (e) => {
    if (!dragging.current) return
    const cur = cellFromPoint(e.clientX, e.clientY)
    if (!cur) return
    const line = lineBetween(dragging.current, cur)
    if (line) applySel(line.map((p) => key(p.r, p.c)))
  }
  const onUp = () => {
    if (!dragging.current) return
    dragging.current = null
    const current = selRef.current // sin desfase de estado
    if (current.length < 2) {
      applySel([])
      return
    }
    // Reconstruye las celdas desde las claves seleccionadas en orden
    const cells = current.map((k) => {
      const [r, c] = k.split('-').map(Number)
      return { r, c }
    })
    const letters = cells.map((p) => puzzle.grid[p.r][p.c]).join('')
    const rev = [...letters].reverse().join('')
    if (letters === puzzle.target || rev === puzzle.target) {
      setFoundCells(new Set(current))
      setStatus('won')
      playSound('win')
      onCorrect?.()
      onWin?.()
    } else {
      applySel([])
      playSound('error')
      shakeControls.start({ x: [0, -6, 6, -4, 0], transition: { duration: 0.25 } }) // error (sin penalización)
    }
  }

  const restart = () => {
    const next = buildPuzzle(level)
    setPuzzle(next)
    setTimeLeft(next.time)
    setStatus('playing')
    applySel([])
    setFoundCells(new Set())
    setRound((x) => x + 1)
  }

  const danger = status === 'playing' && timeLeft <= 4
  const pct = (timeLeft / puzzle.time) * 100
  const won = status === 'won'
  const selSet = new Set(sel)

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 45%, rgba(10,5,30,0.1) 0%, rgba(6,3,22,0.72) 78%)' }} />

      {/* ---------- Encabezado + reloj ---------- */}
      <div className="absolute inset-x-0 top-[12.5cqmin] z-20 flex flex-col items-center gap-[1.1cqmin]">
        <div
          className="anim-sway gpu rounded-[1.6cqmin] border-[0.5cqmin] border-grape bg-gradient-to-b from-[#b06bff] to-[#7b2ff7] px-[3cqw] py-[0.6cqmin] font-display text-[2.4cqmin] text-white text-stroke"
          style={{ boxShadow: '0 5px 0 #5a1fb0, 0 10px 16px rgba(0,0,0,0.4)' }}
        >
          🔤 ¡Encuentra el nombre del animal en la sopa de letras!
        </div>
        <div className="flex items-center gap-[1.2cqw]">
          <motion.span className="text-[3.6cqmin]" animate={danger ? { rotate: [-12, 12, -12], scale: [1, 1.15, 1] } : { rotate: 0 }} transition={{ duration: 0.5, repeat: danger ? Infinity : 0 }}>
            ⏰
          </motion.span>
          <div className="wood-inset relative h-[2.8cqmin] w-[28cqw] overflow-hidden rounded-full">
            <motion.div
              className="gloss h-full rounded-full"
              animate={{ width: `${pct}%` }}
              transition={{ ease: 'linear', duration: 0.4 }}
              style={{
                background: danger ? 'linear-gradient(to bottom, #ff8a8a, #e53935 60%, #b71c1c)' : 'linear-gradient(to bottom, #d3a8ff, var(--color-grape) 55%, #5a1fb0)',
                boxShadow: 'inset 0 0.4cqmin 0 rgba(255,255,255,0.5)',
              }}
            />
          </div>
          <span className="font-display text-[3.2cqmin] tabular-nums text-stroke" style={{ color: danger ? '#ff5252' : '#fff' }}>{timeLeft}s</span>
        </div>
      </div>

      {/* ---------- Zona principal: silueta + sopa ---------- */}
      <div className="absolute inset-x-0 top-[24cqmin] z-10 flex items-center justify-center gap-[4cqw] px-[4cqw]">
        {/* Silueta / animal a buscar */}
        <div className="flex flex-col items-center gap-[1.4cqmin]">
          <div className="relative flex h-[28cqmin] w-[28cqmin] items-center justify-center">
            {won && (
              <div className="absolute inset-[-8%] rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,236,168,0.9) 0%, rgba(255,215,0,0.2) 50%, transparent 70%)' }} />
            )}
            <motion.span
              className="relative"
              style={{ fontSize: '22cqmin' }}
              animate={won ? { filter: 'brightness(1)', scale: [1, 1.2, 1] } : { filter: 'brightness(0)', scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              {puzzle.item.emoji}
            </motion.span>
          </div>
          {/* Cartel con la palabra a buscar */}
          <div
            className="rounded-[1.4cqmin] border-[0.5cqmin] border-wood-dark bg-gradient-to-b from-wood-light to-wood px-[2.5cqw] py-[0.8cqmin] font-display text-[3cqmin] tracking-[0.3em] text-white text-stroke"
            style={{ boxShadow: '0 5px 0 var(--color-wood-dark)' }}
          >
            {won ? puzzle.target : puzzle.target.replace(/./g, '•')}
          </div>
          <span className="font-body text-[1.9cqmin] font-bold text-white/80">{won ? '¡Encontrado!' : `${puzzle.target.length} letras`}</span>
        </div>

        {/* Sopa de letras */}
        <motion.div
          ref={gridRef}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerLeave={onUp}
          animate={shakeControls}
          className="wood-3d grid touch-none rounded-[2cqmin] p-[1.2cqmin]"
          style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)`, gap: '0.5cqmin' }}
        >
          {puzzle.grid.map((row, r) =>
            row.map((ch, c) => {
              const k = key(r, c)
              const isFound = foundCells.has(k)
              const isSel = selSet.has(k)
              return (
                <div
                  key={k}
                  data-cell
                  data-r={r}
                  data-c={c}
                  className="flex h-[4.6cqmin] w-[4.6cqmin] select-none items-center justify-center rounded-[0.8cqmin] font-display text-[2.6cqmin]"
                  style={{
                    background: isFound
                      ? 'radial-gradient(circle at 50% 35%, #d8ffe9, #00e676 80%)'
                      : isSel
                      ? 'radial-gradient(circle at 50% 35%, #fff2c2, var(--color-gold) 85%)'
                      : 'linear-gradient(to bottom, #fff7e6, #f0d9a8)',
                    color: isFound ? '#0a5' : 'var(--color-wood-edge)',
                    border: '0.25cqmin solid rgba(120,70,25,0.4)',
                    boxShadow: isSel || isFound ? '0 0 1cqmin rgba(255,200,60,0.7)' : 'inset 0 -0.3cqmin 0.4cqmin rgba(0,0,0,0.15)',
                    cursor: 'pointer',
                  }}
                >
                  {ch}
                </div>
              )
            }),
          )}
        </motion.div>
      </div>

      {/* ---------- Overlay de victoria (la derrota va a DefeatScreen) ---------- */}
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
                {puzzle.item.emoji}
              </motion.div>
              <h2 className="gold-text font-display text-[6cqmin]">¡{puzzle.target}! 🎉</h2>
              <p className="font-body text-[2.6cqmin] font-bold text-[#7a531f]">¡Palabra encontrada! El reto sube de nivel 🚢</p>
              <WoodButton size="lg" variant="leaf" glow onClick={restart}>
                ➡️ Siguiente sopa
              </WoodButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
