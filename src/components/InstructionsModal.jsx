import { motion } from 'framer-motion'
import WoodButton from './WoodButton'

/**
 * InstructionsModal — Pergamino antiguo con bordes/rollos de madera.
 * Título "HOW TO PLAY" arqueado y dorado brillante + los 3 iconos de juego:
 *   👟 Saltar   ⏰ Timing   🦁🐘 Coleccionar
 *
 * props: onClose(), onPlay()
 */

const TITLE = 'HOW TO PLAY'

// Arco del título: las letras del centro suben, las de los extremos bajan/giran.
function archStyle(i, len) {
  const center = (len - 1) / 2
  const t = (i - center) / center // -1 .. 1
  const y = t * t * 2.6 // cae en los extremos (cqh)
  const rot = t * 16 // gira hacia afuera
  return {
    transform: `translateY(${y}cqh) rotate(${rot}deg)`,
    animation: `letter-bounce 2.2s ease-in-out ${i * 0.06}s infinite`,
    ['--rot']: `${rot}deg`,
  }
}

const STEPS = [
  { icon: '👟', title: '¡SALTA!', desc: 'Toca o pulsa ESPACIO para esquivar las olas.', tint: 'var(--color-aqua)' },
  { icon: '⏰', title: '¡RÁPIDO!', desc: 'Acomoda el arca antes de que acabe el tiempo.', tint: 'var(--color-coral)' },
  { icon: '🦁', title: '¡COLECCIONA!', desc: 'Adivina la sombra y suma animales al barco.', tint: 'var(--color-leaf)' },
]

export default function InstructionsModal({ onClose, onPlay }) {
  return (
    <motion.div
      className="absolute inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Backdrop oscuro */}
      <button
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
      />

      {/* Pergamino */}
      <motion.div
        className="relative z-10 w-[78cqw] max-w-[120cqh]"
        initial={{ scale: 0.6, y: 40, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.7, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 240, damping: 18 }}
      >
        {/* Rollo de madera superior */}
        <WoodRoll className="-mb-[1.5cqh]" />

        {/* Hoja de pergamino */}
        <div className="parchment relative mx-[1.5cqw] rounded-[1cqh] px-[5cqw] py-[4cqh]">
          {/* Botón cerrar */}
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.15, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Cerrar"
            className="wood-3d absolute right-[2cqw] top-[2cqh] flex h-[5cqh] w-[5cqh] items-center justify-center rounded-full !border-[0.4cqh] text-[2.6cqh] text-white"
          >
            ✕
          </motion.button>

          {/* Título arqueado */}
          <h2 className="mb-[3cqh] flex justify-center font-display leading-none">
            {TITLE.split('').map((ch, i) => (
              <span
                key={i}
                className="gold-text gpu inline-block text-[7cqh]"
                style={{ ...archStyle(i, TITLE.length), width: ch === ' ' ? '2cqw' : undefined }}
              >
                {ch === ' ' ? ' ' : ch}
              </span>
            ))}
          </h2>

          {/* 3 pasos con iconos */}
          <div className="flex items-stretch justify-center gap-[2.5cqw]">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.12, type: 'spring', stiffness: 260, damping: 16 }}
                className="flex w-[22cqw] flex-col items-center text-center"
              >
                {/* Disco con icono */}
                <div
                  className="relative mb-[1.4cqh] flex h-[14cqh] w-[14cqh] items-center justify-center rounded-full"
                  style={{
                    background: `radial-gradient(circle at 50% 35%, #fff, ${s.tint} 70%)`,
                    boxShadow: `inset 0 -1cqh 1.5cqh rgba(0,0,0,0.25), 0 0.8cqh 0 rgba(120,80,25,0.45), 0 1.4cqh 2cqh rgba(0,0,0,0.3)`,
                    border: '0.5cqh solid rgba(255,255,255,0.8)',
                  }}
                >
                  <span className="anim-float gpu text-[8cqh]" style={{ animationDelay: `${i * 0.3}s` }}>
                    {s.icon}
                  </span>
                  {/* Segundo animal en el paso de coleccionar */}
                  {i === 2 && (
                    <span className="absolute -bottom-[1cqh] -right-[1cqh] text-[5cqh] drop-shadow">🐘</span>
                  )}
                  {/* número del paso */}
                  <span className="wood-3d absolute -left-[1cqh] -top-[1cqh] flex h-[5cqh] w-[5cqh] items-center justify-center rounded-full !border-[0.35cqh] font-display text-[2.6cqh] text-white">
                    {i + 1}
                  </span>
                </div>

                <h3 className="font-display text-[3cqh] text-wood-grain" style={{ textShadow: '0 1px 0 rgba(255,255,255,0.6)' }}>
                  {s.title}
                </h3>
                <p className="mt-[0.5cqh] font-body text-[2cqh] font-semibold leading-tight text-[#7a531f]">
                  {s.desc}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Botón de acción */}
          <div className="mt-[3.5cqh] flex justify-center">
            <WoodButton size="lg" variant="leaf" glow onClick={onPlay}>
              🚢 ¡ZARPAR!
            </WoodButton>
          </div>
        </div>

        {/* Rollo de madera inferior */}
        <WoodRoll className="-mt-[1.5cqh]" />
      </motion.div>
    </motion.div>
  )
}

/** Rollo de madera (cilindro) para los extremos del pergamino. */
function WoodRoll({ className = '' }) {
  return (
    <div
      className={`relative h-[5cqh] rounded-full ${className}`}
      style={{
        background:
          'linear-gradient(to bottom, var(--color-wood-light) 0%, var(--color-wood-rich) 45%, var(--color-wood-grain) 78%, var(--color-wood-deep) 100%)',
        boxShadow:
          'inset 0 1cqh 0 rgba(255,235,190,0.5), inset 0 -1cqh 1cqh rgba(0,0,0,0.5), 0 0.6cqh 1.6cqh rgba(0,0,0,0.4)',
        border: '0.4cqh solid var(--color-wood-edge)',
      }}
    >
      {/* topes laterales */}
      <span className="absolute -left-[1.2cqw] top-1/2 h-[6.5cqh] w-[3cqw] -translate-y-1/2 rounded-full" style={{ background: 'radial-gradient(circle at 40% 35%, var(--color-wood-light), var(--color-wood-deep) 75%)', border: '0.4cqh solid var(--color-wood-edge)' }} />
      <span className="absolute -right-[1.2cqw] top-1/2 h-[6.5cqh] w-[3cqw] -translate-y-1/2 rounded-full" style={{ background: 'radial-gradient(circle at 40% 35%, var(--color-wood-light), var(--color-wood-deep) 75%)', border: '0.4cqh solid var(--color-wood-edge)' }} />
    </div>
  )
}
