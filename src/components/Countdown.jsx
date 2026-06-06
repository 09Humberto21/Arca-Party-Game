import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { playSound } from '../sound'

/**
 * Countdown — Cuenta atrás 3..2..1..¡YA! antes de empezar un minijuego.
 * Llama onDone() al terminar. Suena un tic en cada número y un "start" en YA.
 *
 * Cada número se remonta por `key` (sin AnimatePresence mode="wait", que
 * "aplastaba" el 2): así cada paso se ve su tiempo completo. onDone va por
 * ref para que el temporizador nunca se reinicie por un re-render del padre.
 */
const STEPS = ['3', '2', '1', '¡YA!']

export default function Countdown({ onDone }) {
  const [i, setI] = useState(0)
  const doneRef = useRef(onDone)
  doneRef.current = onDone

  useEffect(() => {
    const last = i >= STEPS.length - 1
    playSound(last ? 'start' : 'click')
    const t = setTimeout(() => {
      if (last) doneRef.current?.()
      else setI((v) => v + 1)
    }, last ? 600 : 800)
    return () => clearTimeout(t)
  }, [i])

  const isGo = i === STEPS.length - 1

  return (
    <div className="absolute inset-0 z-[55] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px]" />
      <motion.div
        key={i}
        initial={{ scale: 0.3, opacity: 0, rotate: -15 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
        className="relative flex items-center justify-center"
      >
        {/* anillo pulsante */}
        <motion.div
          className="absolute rounded-full"
          style={{ width: '34cqh', height: '34cqh', border: '0.8cqh solid rgba(255,255,255,0.5)' }}
          initial={{ scale: 0.6, opacity: 0.8 }}
          animate={{ scale: 1.4, opacity: 0 }}
          transition={{ duration: 0.7 }}
        />
        <span className={`gold-text font-display ${isGo ? 'text-[16cqh]' : 'text-[26cqh]'}`} style={{ display: 'block', lineHeight: 1 }}>
          {STEPS[i]}
        </span>
      </motion.div>
    </div>
  )
}
