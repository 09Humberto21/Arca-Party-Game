import { motion } from 'framer-motion'
import { useNet, MINIGAME_META } from '../../context/NetContext'

/**
 * RoundResults — Tabla entre rondas. Ordena por puntaje TOTAL acumulado y
 * muestra cuánto sumó cada quién en esta ronda (+roundScore). El servidor pasa
 * solo a la siguiente ronda tras unos segundos.
 */
export default function RoundResults() {
  const { players, me, round, totalRounds, currentMinigame } = useNet()
  const ranked = [...players].sort((a, b) => b.score - a.score)
  const meta = MINIGAME_META[currentMinigame] || { name: currentMinigame, emoji: '🎮' }

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-[2cqh] px-[6cqw] py-[3cqh]">
      <motion.div
        className="flex flex-col items-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span className="font-display text-[3cqh] text-white text-stroke">
          Ronda {round} de {totalRounds} · {meta.emoji} {meta.name}
        </span>
        <span className="gold-text font-display text-[6cqh] text-stroke-lg">📊 Resultados</span>
      </motion.div>

      <div className="flex w-full max-w-[70cqw] flex-col gap-[1cqh]">
        {ranked.map((p, i) => (
          <motion.div
            key={p.id}
            layout
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08, type: 'spring', stiffness: 260, damping: 20 }}
            className="wood-3d flex items-center gap-[1.5cqw] rounded-[1.6cqh] px-[2cqw] py-[1cqh]"
            style={{ outline: p.id === me ? '0.4cqh solid var(--color-gold)' : 'none' }}
          >
            <span className="w-[5cqh] text-center font-display text-[3.6cqh] text-gold text-stroke">
              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
            </span>
            <span className="text-[4cqh]">{p.skin}</span>
            <span className="flex-1 truncate font-display text-[3cqh] text-white text-stroke">
              {p.nickname}
              {p.id === me && ' (tú)'}
            </span>
            <span className="font-display text-[2.6cqh] text-leaf-bright text-stroke">+{p.roundScore}</span>
            <span className="w-[14cqh] text-right font-display text-[3.4cqh] text-gold text-stroke">{p.score} ⭐</span>
          </motion.div>
        ))}
      </div>

      <motion.span
        className="anim-float font-display text-[2.6cqh] text-white text-stroke"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {round >= totalRounds ? 'Calculando al campeón… 🏆' : 'Siguiente ronda en breve… 🛶'}
      </motion.span>
    </div>
  )
}
