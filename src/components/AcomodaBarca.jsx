import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, animate, motion, useMotionValue } from 'framer-motion'
import { useGame } from '../context/GameContext'
import { playSound } from '../sound'
import WoodButton from './WoodButton'

/**
 * AcomodaBarca — Minijuego #1 (Drag & Drop) con DIFICULTAD ESCALABLE.
 *
 * Reto que crece con el nivel:
 *  - Más animales (4 → hasta 8) y subconjunto ALEATORIO cada ronda.
 *  - Menos tiempo (15s → mínimo 7s).
 *  - Los animales NADAN en el agua (blancos móviles) cada vez más rápido.
 *  - Siluetas en orden aleatorio respecto a la bandeja.
 *
 * props: onWin(), onLose(), onCorrect()
 */

// Pool de animales disponibles
const POOL = [
  { id: 'lion', emoji: '🦁' },
  { id: 'elephant', emoji: '🐘' },
  { id: 'giraffe', emoji: '🦒' },
  { id: 'monkey', emoji: '🐵' },
  { id: 'zebra', emoji: '🦓' },
  { id: 'tiger', emoji: '🐯' },
  { id: 'panda', emoji: '🐼' },
  { id: 'hippo', emoji: '🦛' },
]

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Configuración de la ronda según el nivel. */
function buildConfig(level) {
  const count = Math.min(POOL.length, 3 + level) // L1=4, L2=5, ... cap 8
  const time = Math.max(7, 17 - level * 2) // L1=15, L2=13, ... mín 7
  const animals = shuffle(POOL).slice(0, count) // subconjunto aleatorio
  let slots = shuffle(animals.map((a) => a.id))
  // Evita que las siluetas queden en el mismo orden que la bandeja
  if (slots.every((id, i) => id === animals[i].id) && count > 1) {
    slots = [...slots.slice(1), slots[0]]
  }
  const swim = Math.min(22, 7 + level * 2.5) // amplitud px del nado
  const swimDur = Math.max(1.6, 3.6 - level * 0.3) // s (más rápido al subir)
  // Tamaños según cuántos animales hay (para que quepan en 16:9)
  const size = count <= 4 ? 14 : count <= 6 ? 11 : 8.8 // cqh
  const emoji = count <= 4 ? 9 : count <= 6 ? 7 : 5.6 // cqh
  const gap = count <= 4 ? 3 : count <= 6 ? 2 : 1.3 // cqw
  return { count, time, animals, slots, swim, swimDur, size, emoji, gap }
}

const EMOJI = Object.fromEntries(POOL.map((a) => [a.id, a.emoji]))

export default function AcomodaBarca({ onWin, onLose, onCorrect }) {
  const { level, paused } = useGame()
  const fieldRef = useRef(null)
  const slotRefs = useRef({})

  const [config, setConfig] = useState(() => buildConfig(level))
  const [placed, setPlaced] = useState({})
  const [timeLeft, setTimeLeft] = useState(config.time)
  const [status, setStatus] = useState('playing') // 'playing' | 'won' | 'lost'
  const [round, setRound] = useState(0)

  const placedCount = Object.values(placed).filter(Boolean).length

  // pausa via ref: el intervalo NO se recrea al pausar (evita regalar tiempo)
  const pausedRef = useRef(paused)
  pausedRef.current = paused

  // --- Temporizador (congelado en pausa / fin de ronda) ---
  useEffect(() => {
    if (status !== 'playing') return
    const id = setInterval(() => {
      if (pausedRef.current) return
      setTimeLeft((t) => (t <= 1 ? 0 : t - 1))
    }, 1000)
    return () => clearInterval(id)
  }, [status, round])

  // --- Derrota por tiempo ---
  useEffect(() => {
    if (timeLeft === 0 && status === 'playing') {
      setStatus('lost')
      onLose?.()
    }
  }, [timeLeft, status, onLose])

  // --- Victoria: todos colocados ---
  useEffect(() => {
    if (placedCount === config.count && status === 'playing') {
      setStatus('won')
      console.log('🎉 ¡Nivel Superado!')
      playSound('win')
      onWin?.()
    }
  }, [placedCount, config.count, status, onWin])

  const handlePlace = (id) => {
    setPlaced((p) => (p[id] ? p : { ...p, [id]: true }))
    playSound('place')
    onCorrect?.()
  }

  const restart = () => {
    const next = buildConfig(level) // usa el nivel actual (ya pudo subir)
    setConfig(next)
    setPlaced({})
    setTimeLeft(next.time)
    setStatus('playing')
    setRound((r) => r + 1)
  }

  const danger = timeLeft <= 5
  const pct = (timeLeft / config.time) * 100

  return (
    <div ref={fieldRef} className="absolute inset-0 overflow-hidden">
      {/* ---------- Encabezado: instrucción + temporizador ---------- */}
      <div className="absolute inset-x-0 top-[12.5cqh] z-20 flex flex-col items-center gap-[1.4cqh]">
        <div
          className="anim-sway gpu rounded-[1.6cqh] border-[0.5cqh] border-wood-dark bg-gradient-to-b from-wood-light to-wood px-[3cqw] py-[0.7cqh] font-display text-[2.4cqh] text-white text-stroke"
          style={{ boxShadow: '0 5px 0 var(--color-wood-dark), 0 10px 16px rgba(0,0,0,0.3)' }}
        >
          🧩 Nivel {level} · ¡acomoda {config.count} animales!
        </div>

        <div className="flex items-center gap-[1.2cqw]">
          <motion.span
            className="text-[4.2cqh]"
            animate={danger ? { rotate: [-12, 12, -12], scale: [1, 1.15, 1] } : { rotate: 0 }}
            transition={{ duration: 0.5, repeat: danger ? Infinity : 0 }}
          >
            ⏰
          </motion.span>
          <div className="wood-inset relative h-[3cqh] w-[32cqw] overflow-hidden rounded-full">
            <motion.div
              className="gloss h-full rounded-full"
              animate={{ width: `${pct}%` }}
              transition={{ ease: 'linear', duration: 0.4 }}
              style={{
                background: danger
                  ? 'linear-gradient(to bottom, #ff8a8a, #e53935 60%, #b71c1c)'
                  : 'linear-gradient(to bottom, #7be3ff, var(--color-ocean) 55%, var(--color-ocean-deep))',
                boxShadow: 'inset 0 0.4cqh 0 rgba(255,255,255,0.5)',
              }}
            />
          </div>
          <span
            className="font-display text-[3.4cqh] tabular-nums text-stroke"
            style={{ color: danger ? '#ff5252' : '#fff' }}
          >
            {timeLeft}s
          </span>
        </div>
      </div>

      {/* ---------- Cubierta del arca con siluetas ---------- */}
      <div className="absolute inset-x-0 top-[28cqh] z-10 flex justify-center px-[3cqw]">
        <div
          className="wood-3d flex max-w-[92cqw] flex-wrap items-center justify-center rounded-[3cqh] px-[3cqw] py-[2.4cqh]"
          style={{ gap: `${config.gap}cqw` }}
        >
          {config.slots.map((id) => (
            <Slot
              key={id}
              emoji={EMOJI[id]}
              placed={!!placed[id]}
              size={config.size}
              emojiSize={config.emoji}
              refCb={(el) => (slotRefs.current[id] = el)}
            />
          ))}
        </div>
      </div>

      {/* ---------- Bandeja de animales nadando en el agua ---------- */}
      <div
        className="absolute inset-x-0 bottom-[5cqh] z-30 flex max-w-[94cqw] flex-wrap justify-center"
        style={{ gap: `${config.gap}cqw`, margin: '0 auto' }}
      >
        {config.animals.map((a, i) => (
          <DraggableAnimal
            key={`${round}-${a.id}`}
            animal={a}
            index={i}
            config={config}
            fieldRef={fieldRef}
            slotRef={{ get current() { return slotRefs.current[a.id] } }}
            placed={!!placed[a.id]}
            paused={paused || status !== 'playing'}
            onPlace={handlePlace}
          />
        ))}
      </div>

      {/* ---------- Overlay de victoria (la derrota va a la DefeatScreen) ---------- */}
      <AnimatePresence>
        {status === 'won' && <ResultOverlay status={status} onRestart={restart} />}
      </AnimatePresence>
    </div>
  )
}

/* ===================================================================
   Slot — silueta en la cubierta.
   =================================================================== */
function Slot({ emoji, placed, size, emojiSize, refCb }) {
  return (
    <div
      ref={refCb}
      className="wood-inset relative flex items-center justify-center rounded-full"
      style={{ height: `${size}cqh`, width: `${size}cqh` }}
    >
      <span
        className="transition-opacity duration-300"
        style={{ fontSize: `${emojiSize}cqh`, filter: 'brightness(0)', opacity: placed ? 0 : 0.28 }}
      >
        {emoji}
      </span>
      <AnimatePresence>
        {placed && (
          <motion.span
            className="absolute inset-[-0.6cqh] rounded-full"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ boxShadow: '0 0 2.5cqh rgba(0,230,118,0.9), inset 0 0 1.5cqh rgba(0,230,118,0.6)', border: '0.5cqh solid #00e676' }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

/* ===================================================================
   DraggableAnimal — arrastrable con snap. Nada (swim) cuando está libre.
   =================================================================== */
function DraggableAnimal({ animal, index, config, fieldRef, slotRef, placed, paused, onPlace }) {
  const ref = useRef(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const [dragging, setDragging] = useState(false)

  const handleDragEnd = () => {
    setDragging(false)
    const el = ref.current
    const slot = slotRef.current
    if (!el || !slot) return

    const a = el.getBoundingClientRect()
    const s = slot.getBoundingClientRect()
    const acx = a.left + a.width / 2
    const acy = a.top + a.height / 2
    const scx = s.left + s.width / 2
    const scy = s.top + s.height / 2
    const dist = Math.hypot(acx - scx, acy - scy)

    if (dist < s.width * 0.8) {
      x.set(x.get() + (scx - acx))
      y.set(y.get() + (scy - acy))
      onPlace(animal.id)
    } else {
      animate(x, 0, { type: 'spring', stiffness: 300, damping: 22 })
      animate(y, 0, { type: 'spring', stiffness: 300, damping: 22 })
    }
  }

  const idle = !dragging && !placed
  const sign = index % 2 === 0 ? 1 : -1

  return (
    <motion.div
      ref={ref}
      className={`gpu cursor-grab active:cursor-grabbing ${dragging || placed ? 'z-50' : 'z-30'}`}
      style={{ x, y }}
      drag={!placed && !paused}
      dragConstraints={fieldRef}
      dragElastic={0.15}
      dragMomentum={false}
      onDragStart={() => setDragging(true)}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.2 }}
      whileHover={!placed ? { scale: 1.1 } : undefined}
    >
      <div
        className={`relative flex items-center justify-center rounded-full ${idle ? 'anim-swim' : ''}`}
        style={{
          height: `${config.size}cqh`,
          width: `${config.size}cqh`,
          ['--ax']: `${config.swim * sign}px`,
          ['--ay']: `${config.swim * 0.7}px`,
          ['--swim-dur']: `${config.swimDur + index * 0.15}s`,
          background: placed
            ? 'radial-gradient(circle at 50% 35%, #d8ffe9, #00e676 75%)'
            : 'radial-gradient(circle at 50% 35%, #fff7df, #f2b84b 78%)',
          border: '0.5cqh solid var(--color-wood-edge)',
          boxShadow: dragging
            ? '0 2cqh 2.5cqh rgba(0,0,0,0.45), 0 0 3cqh rgba(255,215,0,0.7)'
            : 'inset 0 -0.6cqh 1cqh rgba(0,0,0,0.3), 0 0.8cqh 1.2cqh rgba(0,0,0,0.3)',
        }}
      >
        <span style={{ fontSize: `${config.emoji}cqh` }} className="drop-shadow">
          {animal.emoji}
        </span>
        {placed && (
          <motion.span
            className="absolute -right-[0.5cqh] -top-[0.5cqh] text-[3.4cqh]"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 12 }}
          >
            ✅
          </motion.span>
        )}
      </div>
    </motion.div>
  )
}

/* ===================================================================
   ResultOverlay — banner de victoria / derrota.
   =================================================================== */
function ResultOverlay({ status, onRestart }) {
  const won = status === 'won'
  return (
    <motion.div
      className="absolute inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/55" />
      <motion.div
        className="parchment relative z-10 flex flex-col items-center gap-[2cqh] rounded-[2cqh] px-[8cqw] py-[5cqh]"
        initial={{ scale: 0.5, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.6, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 240, damping: 16 }}
      >
        <motion.div
          className="text-[12cqh]"
          animate={{ rotate: won ? [-10, 10, -10] : 0, y: won ? [0, -10, 0] : 0 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          {won ? '🎉' : '⏳'}
        </motion.div>
        <h2 className="gold-text font-display text-[6cqh]">
          {won ? '¡NIVEL SUPERADO!' : '¡SE ACABÓ EL TIEMPO!'}
        </h2>
        <p className="font-body text-[2.6cqh] font-bold text-[#7a531f]">
          {won ? '¡Todos a bordo! El reto sube de nivel 🚢' : 'Perdiste una vida ❤️'}
        </p>
        <WoodButton size="lg" variant={won ? 'leaf' : 'gold'} glow onClick={onRestart}>
          {won ? '➡️ Siguiente reto' : '🔁 Jugar de nuevo'}
        </WoodButton>
      </motion.div>
    </motion.div>
  )
}
