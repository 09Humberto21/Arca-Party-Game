import { motion } from 'framer-motion'

/**
 * RotateHint — Aviso a pantalla completa "gira tu teléfono". Se muestra en
 * móviles en vertical, porque los tableros del juego son apaisados (16:9) y se
 * disfrutan mejor en horizontal.
 */
export default function RotateHint() {
  return (
    <div className="absolute inset-0 z-[80] flex flex-col items-center justify-center gap-[3cqh] bg-gradient-to-br from-sky-top via-grape to-ocean-deep px-[8cqw] text-center">
      <motion.div
        className="text-[18cqh]"
        animate={{ rotate: [0, 90, 90, 0], scale: [1, 1.05, 1.05, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', times: [0, 0.4, 0.7, 1] }}
      >
        📱
      </motion.div>
      <h2 className="gold-text font-display text-[7cqh] leading-tight">¡Gira tu teléfono!</h2>
      <p className="font-display text-[3.4cqh] text-white text-stroke">
        Arca Party se juega mejor en horizontal 🌊
      </p>
    </div>
  )
}
