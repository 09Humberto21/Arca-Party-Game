import { AnimatePresence, motion } from 'framer-motion'
import { useNet } from '../../context/NetContext'

/**
 * LiveScoreboard — Marcador EN VIVO durante la ronda (esquina superior derecha).
 * Ordena a los jugadores por su puntaje de la ronda en tiempo real; las
 * tarjetas se reordenan con animación `layout` → se ve quién va ganando.
 */
export default function LiveScoreboard() {
  const { players, me } = useNet()
  const ranked = [...players].sort((a, b) => b.roundScore - a.roundScore)

  return (
    <div className="pointer-events-none absolute right-[1.5cqw] top-[2cqh] z-30 flex w-[24cqw] flex-col gap-[0.5cqh]">
      <AnimatePresence>
        {ranked.map((p, i) => (
          <motion.div
            key={p.id}
            layout
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: p.connected ? 1 : 0.4, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="wood-inset flex items-center gap-[0.8cqw] rounded-[1.2cqh] px-[1cqw] py-[0.5cqh]"
            style={{ outline: p.id === me ? '0.4cqh solid var(--color-gold)' : 'none' }}
          >
            <span className="w-[2.4cqh] text-center font-display text-[2.2cqh] text-gold text-stroke">
              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
            </span>
            <span className="text-[2.8cqh]">{p.skin}</span>
            <span className="flex-1 truncate font-display text-[2cqh] text-white text-stroke">{p.nickname}</span>
            {p.finished && <span className="text-[2cqh]">🏁</span>}
            <span className="font-display text-[2.4cqh] text-leaf-bright text-stroke">{p.roundScore}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
