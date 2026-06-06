import { motion } from 'framer-motion'
import { useGame } from '../context/GameContext'
import WoodButton from './WoodButton'

/**
 * PauseOverlay — Panel de pausa de madera. Aparece cuando game.paused.
 * Botones: Reanudar y Volver al menú.
 */
export default function PauseOverlay() {
  const { togglePause, goTo } = useGame()

  return (
    <motion.div
      className="absolute inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Fondo oscuro (clic = reanudar) */}
      <button aria-label="Reanudar" onClick={togglePause} className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" />

      {/* Panel de madera */}
      <motion.div
        className="wood-3d relative z-10 flex flex-col items-center gap-[2.2cqmin] rounded-[3cqmin] px-[7cqw] py-[4.5cqmin]"
        initial={{ scale: 0.6, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.7, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 240, damping: 18 }}
      >
        <div className="anim-float gpu text-[8cqmin]">⏸️</div>
        <h2 className="gold-text font-display text-[6cqmin]">PAUSA</h2>

        <div className="mt-[0.5cqmin] flex flex-col items-center gap-[1.4cqmin]">
          <WoodButton size="lg" variant="leaf" glow onClick={togglePause}>
            ▶️ Reanudar
          </WoodButton>
          <WoodButton size="md" variant="gold" onClick={() => goTo('SELECT')}>
            🏠 Elegir minijuego
          </WoodButton>
        </div>
      </motion.div>
    </motion.div>
  )
}
