import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useGame } from '../context/GameContext'
import { playSound } from '../sound'
import WoodButton from './WoodButton'

/**
 * VictoryScreen — Final épico (MASTER_PLAN): arcoíris 🌈, paloma 🕊️, confeti
 * y "¡VICTORIA!". Se llega al ganar la ronda del nivel meta (WIN_LEVEL).
 */
const CONFETTI = Array.from({ length: 40 }, (_, i) => {
  const colors = ['#ff5e7e', '#ffd700', '#38e08a', '#2be6d6', '#b06bff', '#ff9f43']
  return {
    color: colors[i % colors.length],
    left: (i * 41) % 100,
    drift: ((i * 53) % 100) - 50,
    dur: 3 + ((i * 7) % 30) / 10,
    delay: ((i * 13) % 40) / 10,
    round: i % 2 === 0,
  }
})

export default function VictoryScreen() {
  const { nickname, coins, diamonds, selectMinigame, currentMinigame, goTo } = useGame()

  useEffect(() => {
    playSound('win')
    const t = setTimeout(() => playSound('win'), 700)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Cielo radiante */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, #ffe27a 0%, #7ad7ff 55%, #2e8bff 100%)' }} />

      {/* Arcoíris */}
      <div
        aria-hidden
        className="absolute left-1/2 top-[58%] -translate-x-1/2 -translate-y-1/2"
        style={{
          width: '120cqmin',
          height: '120cqmin',
          borderRadius: '50%',
          background:
            'conic-gradient(from 180deg at 50% 50%, transparent 0deg, transparent 200deg, #ff5e7e 205deg, #ff9f43 215deg, #ffd700 225deg, #38e08a 235deg, #2be6d6 245deg, #2e8bff 255deg, #b06bff 265deg, transparent 270deg, transparent 360deg)',
          maskImage: 'radial-gradient(circle, transparent 38%, #000 39%, #000 50%, transparent 51%)',
          WebkitMaskImage: 'radial-gradient(circle, transparent 38%, #000 39%, #000 50%, transparent 51%)',
          opacity: 0.85,
        }}
      />

      {/* Confeti */}
      {CONFETTI.map((c, i) => (
        <span
          key={i}
          aria-hidden
          className="absolute top-0"
          style={{
            left: `${c.left}%`,
            width: '0.9cqw',
            height: '1.5cqmin',
            background: c.color,
            borderRadius: c.round ? '50%' : '2px',
            ['--drift']: `${c.drift}px`,
            animation: `confetti-fall ${c.dur}s linear ${c.delay}s infinite`,
          }}
        />
      ))}

      {/* Paloma + arca */}
      <motion.div
        className="absolute left-[18%] top-[26%] text-[10cqmin]"
        animate={{ y: [0, -16, 0], x: [0, 10, 0], rotate: [-6, 6, -6] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        🕊️
      </motion.div>
      <motion.div
        className="absolute right-[16%] top-[30%] text-[8cqmin]"
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        🌈
      </motion.div>

      {/* Contenido */}
      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-[2cqmin] px-[6cqw]">
        <motion.div
          className="anim-bob gpu text-[14cqmin] drop-shadow-[0_8px_0_rgba(0,0,0,0.2)]"
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 12 }}
        >
          🛶
        </motion.div>

        <motion.h1
          className="gold-text font-display text-stroke-lg text-[10cqmin] leading-none"
          initial={{ scale: 0.4, opacity: 0, y: -30 }}
          animate={{ scale: 1, opacity: 1, y: 0, rotate: [-2, 2, -2] }}
          transition={{ scale: { type: 'spring', stiffness: 220, damping: 12 }, rotate: { duration: 2.5, repeat: Infinity } }}
        >
          ¡VICTORIA!
        </motion.h1>
        <motion.p
          className="font-display text-[4cqmin] text-white text-stroke-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          🎉 ¡FINISH! {nickname || 'Capitán'} salvó el arca 🎉
        </motion.p>

        {/* Botín */}
        <motion.div
          className="flex items-center gap-[2cqw]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Stat emoji="🪙" value={coins} color="var(--color-coin)" />
          <Stat emoji="💎" value={diamonds} color="var(--color-diamond)" />
        </motion.div>

        <motion.div
          className="mt-[1cqmin] flex items-center gap-[2cqw]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <WoodButton size="lg" variant="leaf" glow onClick={() => selectMinigame(currentMinigame)}>
            🔁 Jugar otra vez
          </WoodButton>
          <WoodButton size="lg" variant="gold" onClick={() => goTo('SELECT')}>
            🏠 Minijuegos
          </WoodButton>
        </motion.div>
      </div>
    </div>
  )
}

function Stat({ emoji, value, color }) {
  return (
    <div className="wood-3d flex items-center gap-[1cqw] rounded-full px-[2.2cqw] py-[1cqmin]">
      <span className="text-[4cqmin]">{emoji}</span>
      <span className="font-display text-[4cqmin] tabular-nums" style={{ color, textShadow: '0 0.3cqmin 0 rgba(0,0,0,0.5)' }}>
        {value.toLocaleString('es')}
      </span>
    </div>
  )
}
