import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useGame } from '../context/GameContext'
import { randomVerse } from '../data/bibleVerses'
import { playSound } from '../sound'
import WoodButton from './WoodButton'

/**
 * DefeatScreen — Game Over. Lluvia, oscuridad y un pergamino con un
 * versículo bíblico aleatorio para motivar (MASTER_PLAN).
 */
const RAIN = Array.from({ length: 36 }, (_, i) => ({
  left: (i * 2.8 + (i % 5)) % 100,
  dur: 0.5 + ((i * 7) % 10) / 10,
  delay: ((i * 13) % 20) / 10,
  h: 6 + ((i * 3) % 8),
}))

export default function DefeatScreen() {
  const { currentMinigame, nickname, selectMinigame, goTo } = useGame()
  const [verse] = useState(randomVerse)
  useEffect(() => {
    playSound('lose')
  }, [])

  return (
    <div className="absolute inset-0 z-40 overflow-hidden">
      {/* Cielo de tormenta */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0b1026] via-[#1b2540] to-[#2a3a5e]" />

      {/* Lluvia */}
      {RAIN.map((r, i) => (
        <span
          key={i}
          aria-hidden
          className="gpu absolute top-0 w-[0.25cqw] rounded-full bg-white/50"
          style={{
            left: `${r.left}%`,
            height: `${r.h}cqmin`,
            animation: `rain-fall ${r.dur}s linear ${r.delay}s infinite`,
          }}
        />
      ))}

      {/* Relámpago tenue ocasional */}
      <motion.div
        aria-hidden
        className="absolute inset-0 bg-white"
        animate={{ opacity: [0, 0, 0, 0.18, 0, 0.1, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Contenido */}
      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-[2.5cqmin] px-[6cqw]">
        <motion.div
          className="text-[11cqmin]"
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0, y: [0, -8, 0] }}
          transition={{ scale: { type: 'spring', stiffness: 200, damping: 12 }, y: { duration: 2.5, repeat: Infinity } }}
        >
          🕊️
        </motion.div>

        <motion.h2
          className="font-display text-[6cqmin] text-white text-stroke-lg"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          ¡Ánimo, {nickname || 'Capitán'}!
        </motion.h2>

        {/* Pergamino con el versículo */}
        <motion.div
          className="parchment relative w-[70cqw] max-w-[110cqmin] rounded-[1.5cqmin] px-[5cqw] py-[3.5cqmin] text-center"
          initial={{ opacity: 0, scale: 0.7, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 220, damping: 18 }}
        >
          <div className="mb-[1cqmin] text-[4cqmin]">📜</div>
          <p className="font-body text-[3cqmin] font-bold italic leading-snug text-[#5b3d12]">
            “{verse.text}”
          </p>
          <p className="mt-[1.5cqmin] font-display text-[3.2cqmin] text-wood-grain" style={{ textShadow: '0 1px 0 rgba(255,255,255,0.5)' }}>
            — {verse.ref}
          </p>
        </motion.div>

        {/* Botones */}
        <motion.div
          className="mt-[1cqmin] flex items-center gap-[2cqw]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <WoodButton size="lg" variant="leaf" glow onClick={() => selectMinigame(currentMinigame)}>
            🔁 Reintentar
          </WoodButton>
          <WoodButton size="lg" variant="wood" onClick={() => goTo('SELECT')}>
            🏠 Menú
          </WoodButton>
        </motion.div>
      </div>
    </div>
  )
}
