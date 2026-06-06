import { memo, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGame } from '../context/GameContext'
import { playSound } from '../sound'
import WoodButton from './WoodButton'

/**
 * BombaArca — Minijuego #5 (estilo BOMBERMAN) con TODOS los modificadores
 * clásicos. Los power-ups salen al destruir cajas 📦 y se recogen al pasar:
 *   💣 Bomba+   🔥 Fuego+   👟 Velocidad+   🦵 Patada
 *   🎮 Detonador (tecla X)   🧱 Atraviesa-cajas   🛡️ Escudo
 *
 * Muévete con FLECHAS/WASD, pon bomba con ESPACIO, detona con X (si tienes
 * detonador). Elimina a todos los enemigos para ganar.
 *
 * Movimiento por celdas interpolado con CSS (fluido). Bucle setInterval con
 * timestamps. props: onWin(), onLose(), onCorrect()
 */

const COLS = 13
const ROWS = 9
const CELL = 6 // cqh
const FUSE = 2000
const BLAST_MS = 500
const SLIDE_MS = 85 // ms por celda al patear una bomba

const ENEMY_EMOJIS = ['👾', '🦠', '🐛', '👿']
const DIRS = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
]

const ITEM_INFO = {
  bomb: { emoji: '💣', tint: '#ff5e7e', label: 'Bomba+' },
  fire: { emoji: '🔥', tint: '#ff9f43', label: 'Fuego+' },
  speed: { emoji: '👟', tint: '#2be6d6', label: 'Veloz+' },
  kick: { emoji: '🦵', tint: '#b06bff', label: 'Patada' },
  remote: { emoji: '🎮', tint: '#38e08a', label: 'Detonador' },
  wall: { emoji: '🧱', tint: '#ffd700', label: 'Atraviesa' },
  shield: { emoji: '🛡️', tint: '#56ccf2', label: 'Escudo' },
}
const ITEM_WEIGHTS = [
  ['bomb', 26], ['fire', 26], ['speed', 18],
  ['kick', 8], ['remote', 6], ['wall', 8], ['shield', 8],
]

function rollItem() {
  if (Math.random() > 0.42) return null // 42% de soltar algo
  const total = ITEM_WEIGHTS.reduce((a, [, w]) => a + w, 0)
  let r = Math.random() * total
  for (const [type, w] of ITEM_WEIGHTS) {
    if ((r -= w) <= 0) return type
  }
  return 'bomb'
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildLevel(level) {
  const grid = Array.from({ length: ROWS }, (_, y) =>
    Array.from({ length: COLS }, (_, x) => {
      if (x === 0 || y === 0 || x === COLS - 1 || y === ROWS - 1) return 1
      if (x % 2 === 0 && y % 2 === 0) return 1
      return 0
    }),
  )
  const safe = new Set(['1,1', '1,2', '2,1', '1,3', '3,1'])
  for (let y = 1; y < ROWS - 1; y++)
    for (let x = 1; x < COLS - 1; x++)
      if (grid[y][x] === 0 && !safe.has(`${x},${y}`) && Math.random() < 0.58) grid[y][x] = 2

  const enemyCount = Math.min(7, 2 + level)
  const enemies = []
  let id = 1
  let guard = 0
  while (enemies.length < enemyCount && guard < 500) {
    guard++
    const x = 1 + Math.floor(Math.random() * (COLS - 2))
    const y = 1 + Math.floor(Math.random() * (ROWS - 2))
    if (grid[y][x] !== 0 || x + y < 6 || enemies.some((e) => e.x === x && e.y === y)) continue
    enemies.push({ id: id++, x, y, alive: true, dir: DIRS[Math.floor(Math.random() * 4)] })
  }
  const enemyStep = Math.max(260, 440 - level * 32)
  return { grid, enemies, enemyStep }
}

export default function BombaArca({ onWin, onLose, onCorrect }) {
  const { skin, level, paused } = useGame()

  const [status, setStatus] = useState('playing')
  const [round, setRound] = useState(0)
  const [remaining, setRemaining] = useState(0)
  const [view, setView] = useState(null)
  // Tablero (muros/cajas) en su propio estado: solo cambia al destruir una caja,
  // NO en cada tick → las 117 casillas no se re-renderizan siempre (evita el lag).
  const [grid, setGrid] = useState(null)

  const sim = useRef(null)
  const statusRef = useRef(status)
  const pausedRef = useRef(paused)
  const cbs = useRef({})
  statusRef.current = status
  pausedRef.current = paused
  cbs.current = { onWin, onLose, onCorrect }

  useEffect(() => {
    const { grid, enemies, enemyStep } = buildLevel(level)
    sim.current = {
      grid,
      enemies,
      enemyStep,
      items: [],
      bombs: [],
      blasts: [],
      player: { x: 1, y: 1, alive: true, maxBombs: 1, range: 2, moveMs: 150, kick: false, remote: false, wallPass: false, shield: false, invulnUntil: 0 },
      nextId: 1000,
      lastMove: 0,
      lastEnemyMove: 0,
      gridDirty: false,
      ended: false,
    }
    setRemaining(enemies.length)
    setGrid(grid.map((r) => [...r]))
    snapshot()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round])

  const snapshot = () => {
    const s = sim.current
    if (!s) return
    setView({
      player: { ...s.player },
      enemies: s.enemies.map((e) => ({ ...e })),
      bombs: s.bombs.map((b) => ({ ...b })),
      blasts: s.blasts.map((b) => ({ ...b })),
      items: s.items.map((i) => ({ ...i })),
    })
  }

  const die = () => {
    const s = sim.current
    const p = s.player
    const now = performance.now()
    if (s.ended || now < p.invulnUntil) return
    if (p.shield) {
      p.shield = false
      p.invulnUntil = now + 900
      playSound('error')
      return
    }
    s.ended = true
    p.alive = false
    playSound('lose')
    setStatus('lost')
    cbs.current.onLose?.()
  }

  const explode = (bomb, now) => {
    const s = sim.current
    const p = s.player
    const cells = [{ x: bomb.x, y: bomb.y }]
    const crateCells = []
    for (const d of DIRS) {
      for (let r = 1; r <= p.range; r++) {
        const x = bomb.x + d.x * r
        const y = bomb.y + d.y * r
        const cell = s.grid[y]?.[x]
        if (cell === 1) break
        cells.push({ x, y })
        if (cell === 2) {
          s.grid[y][x] = 0
          s.gridDirty = true
          cbs.current.onCorrect?.()
          crateCells.push({ x, y })
          break
        }
      }
    }
    playSound('eat')
    const clearAt = now + BLAST_MS
    for (const c of cells) {
      s.blasts.push({ id: s.nextId++, x: c.x, y: c.y, bornAt: now, clearAt })
      s.enemies.forEach((e) => {
        if (e.alive && e.x === c.x && e.y === c.y) e.alive = false
      })
      if (p.alive && p.x === c.x && p.y === c.y) die()
      s.bombs.forEach((b) => {
        if (b !== bomb && !b.gone && b.x === c.x && b.y === c.y) b.explodeAt = now
      })
      // destruye power-ups previos (no los recién revelados)
      s.items = s.items.filter((it) => !(it.x === c.x && it.y === c.y && it.bornAt < now))
    }
    // suelta nuevos power-ups de las cajas destruidas
    for (const c of crateCells) {
      const t = rollItem()
      if (t) s.items.push({ id: s.nextId++, x: c.x, y: c.y, type: t, bornAt: now })
    }
    bomb.gone = true
  }

  // Bucle de juego
  useEffect(() => {
    const id = setInterval(() => {
      const s = sim.current
      if (!s || s.ended) return
      if (statusRef.current !== 'playing' || pausedRef.current) return
      const now = performance.now()

      s.bombs.forEach((b) => {
        if (!b.gone && now >= b.explodeAt) explode(b, now)
      })
      s.bombs = s.bombs.filter((b) => !b.gone)
      s.blasts = s.blasts.filter((b) => now < b.clearAt)

      // bombas pateadas que se deslizan
      s.bombs.forEach((b) => {
        if (!b.slideDir || now < (b.slideAt || 0)) return
        const nx = b.x + b.slideDir.x
        const ny = b.y + b.slideDir.y
        const blocked =
          s.grid[ny]?.[nx] !== 0 ||
          s.bombs.some((o) => o !== b && !o.gone && o.x === nx && o.y === ny) ||
          s.enemies.some((e) => e.alive && e.x === nx && e.y === ny) ||
          (s.player.x === nx && s.player.y === ny)
        if (blocked) b.slideDir = null
        else {
          b.x = nx
          b.y = ny
          b.slideAt = now + SLIDE_MS
        }
      })

      // enemigos
      if (now - s.lastEnemyMove >= s.enemyStep) {
        s.lastEnemyMove = now
        s.enemies.forEach((e) => {
          if (!e.alive) return
          const tryDirs = Math.random() < 0.75 ? [e.dir, ...shuffle(DIRS)] : shuffle(DIRS)
          for (const d of tryDirs) {
            const nx = e.x + d.x
            const ny = e.y + d.y
            if (
              s.grid[ny]?.[nx] === 0 &&
              !s.bombs.some((b) => !b.gone && b.x === nx && b.y === ny) &&
              !s.enemies.some((o) => o.alive && o !== e && o.x === nx && o.y === ny)
            ) {
              e.x = nx
              e.y = ny
              e.dir = d
              break
            }
          }
          if (s.blasts.some((bl) => bl.x === e.x && bl.y === e.y)) e.alive = false
          if (e.alive && e.x === s.player.x && e.y === s.player.y) die()
        })
      }

      if (s.player.alive && s.blasts.some((bl) => bl.x === s.player.x && bl.y === s.player.y)) die()

      const aliveEnemies = s.enemies.filter((e) => e.alive).length
      setRemaining(aliveEnemies)
      if (!s.ended && aliveEnemies === 0) {
        s.ended = true
        playSound('win')
        setStatus('won')
        cbs.current.onWin?.()
      }

      // El tablero solo se actualiza cuando cambió (caja destruida)
      if (s.gridDirty) {
        setGrid(s.grid.map((r) => [...r]))
        s.gridDirty = false
      }
      snapshot()
    }, 70)
    return () => clearInterval(id)
  }, [round])

  // Controles
  useEffect(() => {
    const pickup = (s, x, y) => {
      const it = s.items.find((i) => i.x === x && i.y === y)
      if (!it) return
      const p = s.player
      if (it.type === 'bomb') p.maxBombs = Math.min(8, p.maxBombs + 1)
      else if (it.type === 'fire') p.range = Math.min(8, p.range + 1)
      else if (it.type === 'speed') p.moveMs = Math.max(70, p.moveMs - 22)
      else if (it.type === 'kick') p.kick = true
      else if (it.type === 'remote') p.remote = true
      else if (it.type === 'wall') p.wallPass = true
      else if (it.type === 'shield') p.shield = true
      s.items = s.items.filter((i) => i !== it)
      playSound('power')
    }

    const move = (dx, dy) => {
      const s = sim.current
      if (!s || s.ended || statusRef.current !== 'playing' || pausedRef.current) return
      const now = performance.now()
      if (now - s.lastMove < s.player.moveMs) return
      const p = s.player
      const nx = p.x + dx
      const ny = p.y + dy
      const cell = s.grid[ny]?.[nx]
      const bombHere = s.bombs.find((b) => !b.gone && b.x === nx && b.y === ny)
      if (bombHere) {
        if (p.kick) {
          // patear: la bomba se desliza, el jugador no avanza
          bombHere.slideDir = { x: dx, y: dy }
          bombHere.slideAt = now
          s.lastMove = now
          playSound('click')
          snapshot()
        }
        return
      }
      if (cell === 1) return
      if (cell === 2 && !p.wallPass) return
      s.lastMove = now
      p.x = nx
      p.y = ny
      pickup(s, nx, ny)
      if (s.blasts.some((bl) => bl.x === nx && bl.y === ny)) die()
      const enemy = s.enemies.find((e) => e.alive && e.x === nx && e.y === ny)
      if (enemy) die()
      snapshot()
    }

    const placeBomb = () => {
      const s = sim.current
      if (!s || s.ended || statusRef.current !== 'playing' || pausedRef.current) return
      const p = s.player
      const active = s.bombs.filter((b) => !b.gone)
      if (active.length >= p.maxBombs) return
      if (active.some((b) => b.x === p.x && b.y === p.y)) return
      s.bombs.push({ id: s.nextId++, x: p.x, y: p.y, explodeAt: p.remote ? Infinity : performance.now() + FUSE, remote: p.remote })
      playSound('place')
      snapshot()
    }

    const detonate = () => {
      const s = sim.current
      if (!s || s.ended) return
      const now = performance.now()
      s.bombs.forEach((b) => {
        if (!b.gone) b.explodeAt = now
      })
    }

    const onKey = (e) => {
      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W': e.preventDefault(); move(0, -1); break
        case 'ArrowDown': case 's': case 'S': e.preventDefault(); move(0, 1); break
        case 'ArrowLeft': case 'a': case 'A': e.preventDefault(); move(-1, 0); break
        case 'ArrowRight': case 'd': case 'D': e.preventDefault(); move(1, 0); break
        case ' ': case 'Spacebar': e.preventDefault(); placeBomb(); break
        case 'x': case 'X': e.preventDefault(); detonate(); break
        default: break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const restart = () => {
    setStatus('playing')
    setRound((r) => r + 1)
  }

  const boardW = COLS * CELL
  const boardH = ROWS * CELL
  const won = status === 'won'
  const p = view?.player

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Encabezado + power-ups activos */}
      <div className="absolute inset-x-0 top-[11.5cqh] z-20 flex flex-col items-center gap-[0.7cqh]">
        <div
          className="anim-sway gpu rounded-[1.6cqh] border-[0.5cqh] border-wood-dark bg-gradient-to-b from-wood-light to-wood px-[3cqw] py-[0.5cqh] font-display text-[2.1cqh] text-white text-stroke"
          style={{ boxShadow: '0 5px 0 var(--color-wood-dark), 0 8px 14px rgba(0,0,0,0.3)' }}
        >
          💣 Flechas + ESPACIO · enemigos: {remaining}{p?.remote ? ' · X = detonar' : ''}
        </div>
        {p && (
          <div className="flex items-center gap-[0.8cqw]">
            <Chip>💣 {p.maxBombs}</Chip>
            <Chip>🔥 {p.range}</Chip>
            <Chip>👟 {Math.round((150 - p.moveMs) / 22) + 1}</Chip>
            {p.kick && <Chip>🦵</Chip>}
            {p.remote && <Chip>🎮</Chip>}
            {p.wallPass && <Chip>🧱</Chip>}
            {p.shield && <Chip>🛡️</Chip>}
          </div>
        )}
      </div>

      {/* Tablero */}
      <div className="absolute inset-x-0 top-[22.5cqh] z-10 flex justify-center">
        <div className="wood-3d relative rounded-[1.6cqh] p-[0.8cqh]" style={{ width: `${boardW + 1.6}cqh`, height: `${boardH + 1.6}cqh` }}>
          <div className="relative overflow-hidden rounded-[1cqh]" style={{ width: `${boardW}cqh`, height: `${boardH}cqh`, background: '#3a7d44' }}>
            <BoardTiles grid={grid} />
            {view && (
              <>
                {/* Power-ups */}
                {view.items.map((it) => (
                  <Entity key={`i-${it.id}`} x={it.x} y={it.y} z={5}>
                    <motion.span
                      className="flex items-center justify-center rounded-full"
                      style={{ width: `${CELL * 0.8}cqh`, height: `${CELL * 0.8}cqh`, background: `radial-gradient(circle at 50% 35%, #fff, ${ITEM_INFO[it.type].tint} 80%)`, border: '0.3cqh solid rgba(255,255,255,0.9)', boxShadow: `0 0 1.4cqh ${ITEM_INFO[it.type].tint}`, fontSize: `${CELL * 0.45}cqh` }}
                      animate={{ scale: [1, 1.12, 1] }}
                      transition={{ duration: 0.9, repeat: Infinity }}
                    >
                      {ITEM_INFO[it.type].emoji}
                    </motion.span>
                  </Entity>
                ))}

                {/* Bombas (se deslizan suave al patear) */}
                {view.bombs.map((b) => (
                  <div
                    key={`b-${b.id}`}
                    className="absolute flex items-center justify-center"
                    style={{ width: `${CELL}cqh`, height: `${CELL}cqh`, transform: `translate(${b.x * CELL}cqh, ${b.y * CELL}cqh)`, transition: 'transform 0.08s linear', zIndex: 6 }}
                  >
                    <motion.span style={{ fontSize: `${CELL * 0.7}cqh` }} animate={{ scale: [1, 1.22, 1] }} transition={{ duration: 0.45, repeat: Infinity }}>
                      💣
                    </motion.span>
                  </div>
                ))}

                {/* Explosiones */}
                {view.blasts.map((b) => (
                  <div
                    key={`x-${b.id}`}
                    className="absolute flex items-center justify-center"
                    style={{ width: `${CELL}cqh`, height: `${CELL}cqh`, transform: `translate(${b.x * CELL}cqh, ${b.y * CELL}cqh)`, zIndex: 8, background: 'radial-gradient(circle, rgba(255,240,150,0.95), rgba(255,140,40,0.85) 55%, rgba(255,80,20,0.3) 80%)', borderRadius: '20%', boxShadow: '0 0 2cqh rgba(255,160,40,0.9)' }}
                  >
                    <span style={{ fontSize: `${CELL * 0.6}cqh` }}>💥</span>
                  </div>
                ))}

                {/* Enemigos */}
                {view.enemies.filter((e) => e.alive).map((e) => (
                  <Entity key={`e-${e.id}`} x={e.x} y={e.y} z={7} smooth>
                    <span style={{ fontSize: `${CELL * 0.72}cqh` }}>{ENEMY_EMOJIS[e.id % ENEMY_EMOJIS.length]}</span>
                  </Entity>
                ))}

                {/* Jugador */}
                {view.player.alive && (
                  <Entity x={view.player.x} y={view.player.y} z={9} smooth>
                    <span className="drop-shadow" style={{ fontSize: `${CELL * 0.74}cqh`, filter: view.player.shield ? 'drop-shadow(0 0 0.6cqh #56ccf2)' : 'none' }}>{skin}</span>
                  </Entity>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {won && (
          <motion.div className="absolute inset-0 z-50 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/55" />
            <motion.div
              className="parchment relative z-10 flex flex-col items-center gap-[2cqh] rounded-[2cqh] px-[8cqw] py-[5cqh]"
              initial={{ scale: 0.5, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 240, damping: 16 }}
            >
              <motion.div className="text-[12cqh]" animate={{ rotate: [-10, 10, -10], y: [0, -10, 0] }} transition={{ duration: 1.2, repeat: Infinity }}>
                💣
              </motion.div>
              <h2 className="gold-text font-display text-[6cqh]">¡ZONA DESPEJADA!</h2>
              <p className="font-body text-[2.6cqh] font-bold text-[#7a531f]">¡Enemigos eliminados! Sube de nivel 🚢</p>
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

function Chip({ children }) {
  return (
    <span className="wood-inset rounded-full px-[1.1cqw] py-[0.3cqh] font-display text-[1.9cqh] text-white text-stroke tabular-nums">
      {children}
    </span>
  )
}

/** Casillas estáticas memoizadas: solo se re-renderizan cuando cambia el grid. */
const BoardTiles = memo(function BoardTiles({ grid }) {
  if (!grid) return null
  return grid.map((row, y) => row.map((cell, x) => <Tile key={`${x}-${y}`} x={x} y={y} cell={cell} />))
})

function Tile({ x, y, cell }) {
  const base = { position: 'absolute', width: `${CELL}cqh`, height: `${CELL}cqh`, transform: `translate(${x * CELL}cqh, ${y * CELL}cqh)` }
  if (cell === 1)
    return <div style={{ ...base, zIndex: 2, background: 'linear-gradient(145deg, #8a98a6, #4a5a68)', border: '0.3cqh solid #2f3b46', borderRadius: '12%', boxShadow: 'inset 0 0.4cqh 0 rgba(255,255,255,0.3), inset 0 -0.5cqh 0.6cqh rgba(0,0,0,0.4)' }} />
  if (cell === 2)
    return <div style={{ ...base, zIndex: 3, background: 'repeating-linear-gradient(45deg, #d6973f 0 0.8cqh, #b5781f 0.8cqh 1.6cqh)', border: '0.35cqh solid #7a4f12', borderRadius: '14%', boxShadow: 'inset 0 0.4cqh 0 rgba(255,230,180,0.4), inset 0 -0.5cqh 0.6cqh rgba(0,0,0,0.35)' }} />
  return <div style={{ ...base, zIndex: 1, background: (x + y) % 2 === 0 ? '#3f8a4a' : '#368040' }} />
}

function Entity({ x, y, z, smooth = false, children }) {
  return (
    <div
      className="absolute flex items-center justify-center"
      style={{ width: `${CELL}cqh`, height: `${CELL}cqh`, transform: `translate(${x * CELL}cqh, ${y * CELL}cqh)`, transition: smooth ? 'transform 0.09s linear' : 'none', zIndex: z }}
    >
      {children}
    </div>
  )
}
