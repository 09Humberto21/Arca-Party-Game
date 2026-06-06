import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGame } from '../context/GameContext'
import { playSound } from '../sound'
import WoodButton from './WoodButton'

/**
 * SaltaLaOla — Minijuego #2 (Timing) con DIFICULTAD POR NIVEL.
 *
 * Obstáculos (aparecen más variados al subir de nivel):
 *  - 🌊 ola / 🦈 tiburón / 🪨 roca (suelo): hay que SALTAR.
 *  - 🌊 ola GRANDE (nivel 4+): salto más preciso (o doble salto).
 *  - 🦅 pájaro (nivel 2+, TRAMPA): vuela a la altura del salto → NO saltes.
 *
 * Power-ups (agárralos saltando):
 *  - 🪽 alas: DOBLE SALTO por 8s.
 *  - 🛡️ escudo: aguanta un golpe.
 *  - ⭐ estrella: +100 monedas.
 *
 * Bucle en requestAnimationFrame con refs estables (los callbacks no
 * reinician el bucle). props: onWin(), onLose(), onCorrect(), onCoins()
 */

const PX = 22 // posición horizontal del jugador (%)
const OVERLAP = 6 // solape horizontal (%)
const CLEAR_PY = 0.38 // altura mínima para librar obstáculo de suelo
const BIG_CLEAR_PY = 0.62 // ola grande: exige más altura
const BIRD_HIT_PY = 0.12 // pájaro: si estás por encima de esto → te toca
const JUMP_MS = 720
const JUMP_CQH = 32
const WAVE_CQH = 10
const BIG_CQH = 15
const DOUBLE_MS = 8000 // duración del doble salto
const PU_HEIGHT = 14 // altura (cqmin) a la que flotan los power-ups

const GEM_BONUS = 100

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function buildConfig(level) {
  return {
    speed: 30 + level * 5,
    spawn: Math.max(0.9, 1.8 - level * 0.08),
    target: 8 + level * 2,
    birdChance: level >= 2 ? Math.min(0.4, 0.14 + (level - 2) * 0.07) : 0,
    bigChance: level >= 4 ? 0.2 : 0,
    groundEmojis: level >= 3 ? ['🌊', '🦈', '🪨'] : ['🌊'],
  }
}

function spawnObstacle(cfg) {
  const r = Math.random()
  if (r < cfg.birdChance) return { type: 'bird', emoji: '🦅' }
  if (r < cfg.birdChance + cfg.bigChance) return { type: 'big', emoji: pick(cfg.groundEmojis) }
  return { type: 'wave', emoji: pick(cfg.groundEmojis) }
}

function spawnPowerup() {
  const r = Math.random()
  if (r < 0.5) return 'wings'
  if (r < 0.8) return 'shield'
  return 'gem'
}

export default function SaltaLaOla({ onWin, onLose, onCorrect, onCoins }) {
  const { skin, level, paused } = useGame()

  const [config, setConfig] = useState(() => buildConfig(level))
  const [status, setStatus] = useState('playing')
  const [dodged, setDodged] = useState(0)
  const [round, setRound] = useState(0)
  const [view, setView] = useState({ obstacles: [], powerups: [], py: 0, double: 0, shield: false })

  const sim = useRef(null)
  const statusRef = useRef(status)
  const pausedRef = useRef(paused)
  const cbs = useRef({})
  statusRef.current = status
  pausedRef.current = paused
  cbs.current = { onWin, onLose, onCorrect, onCoins }

  const jump = () => {
    if (statusRef.current !== 'playing' || pausedRef.current) return
    const s = sim.current
    if (!s) return
    const grounded = s.py <= 0.02 || s.now - s.jumpStart >= JUMP_MS
    const doubleActive = s.now < s.doubleUntil
    if (grounded) {
      s.jumpStart = s.now
      s.jumpsUsed = 1
      playSound('jump')
    } else if (doubleActive && s.jumpsUsed < 2) {
      s.jumpStart = s.now // re-impulso (doble salto)
      s.jumpsUsed = 2
      playSound('jump')
    }
  }

  useEffect(() => {
    const s = {
      obstacles: [],
      powerups: [],
      spawnT: 0.7,
      puT: 6,
      id: 0,
      jumpStart: -9999,
      jumpsUsed: 0,
      py: 0,
      now: 0,
      last: 0,
      dodged: 0,
      doubleUntil: 0,
      shield: false,
      ended: false,
    }
    sim.current = s
    let raf

    const loop = (now) => {
      s.now = now
      if (s.last === 0) s.last = now
      let dt = (now - s.last) / 1000
      s.last = now
      if (dt > 0.05) dt = 0.05

      if (!s.ended && statusRef.current === 'playing' && !pausedRef.current) {
        // --- Salto (altura) ---
        const elapsed = now - s.jumpStart
        const py = elapsed < JUMP_MS ? Math.sin((Math.PI * elapsed) / JUMP_MS) : 0
        s.py = py
        if (py <= 0.001) s.jumpsUsed = 0
        const ph = py * JUMP_CQH // altura del jugador (cqmin)

        // --- Spawns ---
        s.spawnT -= dt
        if (s.spawnT <= 0) {
          s.obstacles.push({ id: s.id++, x: 110, scored: false, safe: false, ...spawnObstacle(config) })
          s.spawnT = config.spawn
        }
        s.puT -= dt
        if (s.puT <= 0) {
          s.powerups.push({ id: s.id++, x: 110, type: spawnPowerup(), got: false })
          s.puT = 6 + Math.random() * 4
        }

        // --- Movimiento + colisión obstáculos ---
        for (const o of s.obstacles) {
          o.x -= config.speed * dt
          if (o.safe) continue
          const overlap = Math.abs(o.x - PX) < OVERLAP
          if (overlap) {
            const clear = o.type === 'big' ? BIG_CLEAR_PY : CLEAR_PY
            const hit = o.type === 'bird' ? py > BIRD_HIT_PY : py < clear
            if (hit) {
              if (s.shield) {
                s.shield = false
                o.safe = true // escudo absorbe este obstáculo
              } else {
                s.ended = true
                setStatus('lost')
                cbs.current.onLose?.()
                break
              }
            }
          }
          if (!o.scored && o.x < PX - OVERLAP) {
            o.scored = true
            s.dodged += 1
            cbs.current.onCorrect?.()
            setDodged(s.dodged)
            if (s.dodged >= config.target) {
              s.ended = true
              playSound('win')
              setStatus('won')
              cbs.current.onWin?.()
              break
            }
          }
        }
        s.obstacles = s.obstacles.filter((o) => o.x > -15)

        // --- Movimiento + recogida power-ups ---
        for (const p of s.powerups) {
          p.x -= config.speed * dt
          if (!p.got && Math.abs(p.x - PX) < 7 && Math.abs(ph - PU_HEIGHT) < 7) {
            p.got = true
            if (p.type === 'wings') {
              s.doubleUntil = now + DOUBLE_MS
              playSound('power')
            } else if (p.type === 'shield') {
              s.shield = true
              playSound('power')
            } else if (p.type === 'gem') {
              cbs.current.onCoins?.(GEM_BONUS)
              playSound('coin')
            }
          }
        }
        s.powerups = s.powerups.filter((p) => p.x > -15 && !p.got)

        setView({
          obstacles: s.obstacles.map((o) => ({ id: o.id, x: o.x, type: o.type, emoji: o.emoji })),
          powerups: s.powerups.map((p) => ({ id: p.id, x: p.x, type: p.type })),
          py,
          double: s.now < s.doubleUntil ? Math.ceil((s.doubleUntil - s.now) / 1000) : 0,
          shield: s.shield,
        })
      }

      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [round, config])

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault()
        jump()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const restart = () => {
    const next = buildConfig(level)
    setConfig(next)
    setDodged(0)
    setStatus('playing')
    setView({ obstacles: [], powerups: [], py: 0, double: 0, shield: false })
    setRound((r) => r + 1)
  }

  const pct = Math.min(100, (dodged / config.target) * 100)

  return (
    <div className="absolute inset-0 overflow-hidden" onPointerDown={jump} style={{ touchAction: 'none', cursor: 'pointer' }}>
      {/* ---------- Encabezado ---------- */}
      <div className="pointer-events-none absolute inset-x-0 top-[12.5cqmin] z-20 flex flex-col items-center gap-[1cqmin]">
        <div
          className="anim-sway gpu rounded-[1.6cqmin] border-[0.5cqmin] border-wood-dark bg-gradient-to-b from-wood-light to-wood px-[3cqw] py-[0.7cqmin] font-display text-[2.2cqmin] text-white text-stroke"
          style={{ boxShadow: '0 5px 0 var(--color-wood-dark), 0 10px 16px rgba(0,0,0,0.3)' }}
        >
          🌊 Nivel {level} · salta {config.target} · 🦅 ¡NO saltes! · 🪽 agarra poderes
        </div>
        <div className="flex items-center gap-[1.2cqw]">
          <div className="wood-inset relative h-[3cqmin] w-[34cqw] overflow-hidden rounded-full">
            <motion.div
              className="gloss h-full rounded-full"
              animate={{ width: `${pct}%` }}
              transition={{ ease: 'linear', duration: 0.2 }}
              style={{ background: 'linear-gradient(to bottom, #69ffae, var(--color-leaf-bright) 55%, #00b85a)', boxShadow: 'inset 0 0.4cqmin 0 rgba(255,255,255,0.5)' }}
            />
          </div>
          <span className="font-display text-[3cqmin] tabular-nums text-white text-stroke">{dodged}/{config.target}</span>
        </div>

        {/* Chips de poderes activos */}
        <div className="flex items-center gap-[1cqw]">
          {view.double > 0 && (
            <span className="rounded-full bg-grape px-[1.2cqw] py-[0.3cqmin] font-display text-[1.9cqmin] text-white text-stroke">🪽 Doble salto {view.double}s</span>
          )}
          {view.shield && (
            <span className="rounded-full bg-ocean px-[1.2cqw] py-[0.3cqmin] font-display text-[1.9cqmin] text-white text-stroke">🛡️ Escudo</span>
          )}
        </div>
      </div>

      {/* ---------- Cubierta ---------- */}
      <div
        className="absolute inset-x-0 bottom-0 h-[18cqmin]"
        style={{
          background: 'repeating-linear-gradient(to bottom, var(--color-wood-light) 0 1.4cqmin, var(--color-wood-rich) 1.4cqmin 2.8cqmin, var(--color-wood-grain) 2.8cqmin 3.2cqmin)',
          borderTop: '0.6cqmin solid var(--color-wood-edge)',
          boxShadow: 'inset 0 1cqmin 0 rgba(255,235,190,0.4), inset 0 -1cqmin 2cqmin rgba(0,0,0,0.45)',
        }}
      />

      {/* ---------- Obstáculos ---------- */}
      {view.obstacles.map((o) => (
        <Obstacle key={o.id} x={o.x} type={o.type} emoji={o.emoji} />
      ))}

      {/* ---------- Power-ups ---------- */}
      {view.powerups.map((p) => (
        <Powerup key={p.id} x={p.x} type={p.type} />
      ))}

      {/* ---------- Jugador ---------- */}
      <div className="absolute z-10" style={{ left: `${PX}%`, bottom: '17cqmin', transform: 'translateX(-50%)' }}>
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-full bg-black/30 blur-sm"
          style={{ bottom: `${-2 - view.py * 1.5}cqmin`, width: `${10 - view.py * 5}cqmin`, height: '2cqmin' }}
        />
        {/* aura de escudo */}
        {view.shield && (
          <div className="absolute inset-[-1.5cqmin] rounded-full" style={{ border: '0.6cqmin solid #56ccf2', boxShadow: '0 0 2.5cqmin rgba(86,204,242,0.9)' }} />
        )}
        {/* alas si doble salto activo */}
        {view.double > 0 && (
          <span className="absolute -left-[3cqmin] top-[2cqmin] text-[5cqmin]" style={{ transform: `translateY(${-view.py * JUMP_CQH}cqmin)` }}>🪽</span>
        )}
        <div
          className="gpu flex h-[12cqmin] w-[12cqmin] items-center justify-center rounded-full"
          style={{
            transform: `translateY(${-view.py * JUMP_CQH}cqmin) rotate(${view.py * -12}deg)`,
            background: 'radial-gradient(circle at 50% 35%, #fff7df, #f2b84b 78%)',
            border: '0.5cqmin solid var(--color-wood-edge)',
            boxShadow: 'inset 0 -0.6cqmin 1cqmin rgba(0,0,0,0.3), 0 0.8cqmin 1.2cqmin rgba(0,0,0,0.3)',
          }}
        >
          <span className="text-[8cqmin] drop-shadow">{skin}</span>
        </div>
      </div>

      <AnimatePresence>{status === 'won' && <WinOverlay onRestart={restart} />}</AnimatePresence>
    </div>
  )
}

/** Obstáculo: ola/roca/tiburón (suelo) o pájaro (vuela). */
function Obstacle({ x, type, emoji }) {
  if (type === 'bird') {
    return (
      <div className="gpu absolute z-[6]" style={{ left: `${x}%`, bottom: '30cqmin', transform: 'translateX(-50%)' }}>
        <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 0.5, repeat: Infinity }} className="text-[8cqmin] drop-shadow-[0_4px_4px_rgba(0,0,0,0.35)]">
          {emoji}
        </motion.div>
      </div>
    )
  }
  const big = type === 'big'
  const h = big ? BIG_CQH : WAVE_CQH
  return (
    <div className="gpu absolute bottom-[16cqmin] z-[5]" style={{ left: `${x}%`, transform: 'translateX(-50%)' }}>
      <div
        className="relative flex items-end justify-center"
        style={{
          width: big ? '12cqmin' : '9cqmin',
          height: `${h}cqmin`,
          background: big
            ? 'linear-gradient(to bottom, #7fd0ff, #0077c2 45%, #004e85)'
            : 'linear-gradient(to bottom, #9be7ff, var(--color-ocean) 45%, var(--color-ocean-deep))',
          borderRadius: '50% 50% 30% 30% / 60% 60% 40% 40%',
          border: '0.5cqmin solid #2a86c9',
          boxShadow: 'inset 0 1cqmin 0 rgba(255,255,255,0.5), 0 0.6cqmin 1.2cqmin rgba(0,0,0,0.3)',
        }}
      >
        <div className="absolute -top-[1.5cqmin] left-1/2 h-[2.5cqmin] w-[7cqmin] -translate-x-1/2 rounded-full bg-white/80" />
        <span className="mb-[0.5cqmin] text-[4.5cqmin]">{emoji}</span>
      </div>
    </div>
  )
}

/** Power-up flotante que se agarra saltando. */
function Powerup({ x, type }) {
  const data = {
    wings: { emoji: '🪽', tint: 'var(--color-grape)' },
    shield: { emoji: '🛡️', tint: 'var(--color-ocean)' },
    gem: { emoji: '⭐', tint: 'var(--color-gold)' },
  }[type]
  return (
    <div className="gpu absolute z-[7]" style={{ left: `${x}%`, bottom: `${17 + PU_HEIGHT}cqmin`, transform: 'translateX(-50%)' }}>
      <motion.div
        animate={{ y: [0, -6, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
        className="flex h-[8cqmin] w-[8cqmin] items-center justify-center rounded-full"
        style={{
          background: `radial-gradient(circle at 50% 35%, #fff, ${data.tint} 75%)`,
          border: '0.4cqmin solid rgba(255,255,255,0.9)',
          boxShadow: `0 0 2.5cqmin ${data.tint}`,
        }}
      >
        <span className="text-[4.5cqmin]">{data.emoji}</span>
      </motion.div>
    </div>
  )
}

function WinOverlay({ onRestart }) {
  return (
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
          🌊
        </motion.div>
        <h2 className="gold-text font-display text-[6cqmin]">¡OLAS ESQUIVADAS!</h2>
        <p className="font-body text-[2.6cqmin] font-bold text-[#7a531f]">¡Gran equilibrio! El reto sube de nivel 🚢</p>
        <WoodButton size="lg" variant="leaf" glow onClick={onRestart}>
          ➡️ Siguiente reto
        </WoodButton>
      </motion.div>
    </motion.div>
  )
}
