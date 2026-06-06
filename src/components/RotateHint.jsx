import { motion } from 'framer-motion'

/**
 * RotateHint — Aviso a pantalla completa "gira tu teléfono". Se muestra cuando
 * el dispositivo es táctil y está en VERTICAL, porque el juego se juega en
 * horizontal (16:9). Usa `fixed` + unidades `vmin` para cubrir TODO el viewport
 * (no el lienzo 16:9, que en vertical queda pequeño).
 */
export default function RotateHint() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-[4vmin] bg-gradient-to-br from-sky-top via-grape to-ocean-deep px-[8vmin] text-center">
      <motion.div
        className="text-[26vmin]"
        animate={{ rotate: [0, 90, 90, 0], scale: [1, 1, 1.05, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', times: [0, 0.4, 0.6, 1] }}
      >
        📱
      </motion.div>
      <h2 className="gold-text font-display text-[8vmin] text-stroke-lg" style={{ lineHeight: 1.1 }}>
        Gira tu teléfono
      </h2>
      <p className="font-display text-[5vmin] text-white text-stroke">
        Arca Party se juega en horizontal 🛶
      </p>
      <div className="text-[7vmin]">↻</div>
    </div>
  )
}
