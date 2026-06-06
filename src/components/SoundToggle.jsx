import { useState } from 'react'
import { motion } from 'framer-motion'
import { isSoundOn, toggleSound } from '../sound'

/**
 * SoundToggle — Botón flotante 🔊/🔇 (esquina del Stage, en todas las
 * pantallas) para activar/silenciar los efectos de sonido.
 */
export default function SoundToggle() {
  const [on, setOn] = useState(isSoundOn())
  return (
    <motion.button
      onClick={() => setOn(toggleSound())}
      whileHover={{ scale: 1.12 }}
      whileTap={{ scale: 0.9 }}
      aria-label={on ? 'Silenciar' : 'Activar sonido'}
      className="wood-3d gpu absolute left-[1.5cqw] top-[2cqmin] z-[60] flex h-[6cqmin] w-[6cqmin] items-center justify-center rounded-full !border-[0.4cqmin] text-[3cqmin]"
    >
      {on ? '🔊' : '🔇'}
    </motion.button>
  )
}
