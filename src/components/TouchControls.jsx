import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useGame } from '../context/GameContext'
import { playSound } from '../sound'

/**
 * TouchControls — Controles táctiles para móvil. NO toca la lógica de los
 * minijuegos: sintetiza eventos de teclado sobre `window`, que Snake, Bombas
 * y Salta la Ola ya escuchan. Acomoda y Sopa se juegan por arrastre (no
 * necesitan controles).
 *
 * D-pad abajo-izquierda, botones de acción abajo-derecha. El contenedor deja
 * pasar los toques (pointer-events-none) salvo los propios botones.
 */

const CODE = {
  ArrowUp: 'ArrowUp', ArrowDown: 'ArrowDown', ArrowLeft: 'ArrowLeft', ArrowRight: 'ArrowRight',
  ' ': 'Space', x: 'KeyX',
}

function fireKey(key) {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, code: CODE[key] || '', bubbles: true }))
}

/** Botón que, al mantenerse pulsado, repite la tecla (para moverse). */
function HoldButton({ keyName, repeatMs = 90, className, style, children, label }) {
  const timer = useRef(null)
  const stop = () => {
    if (timer.current) {
      clearInterval(timer.current)
      timer.current = null
    }
  }
  const start = (e) => {
    e.preventDefault()
    e.stopPropagation()
    fireKey(keyName)
    if (repeatMs) timer.current = setInterval(() => fireKey(keyName), repeatMs)
  }
  useEffect(() => stop, [])
  return (
    <motion.button
      aria-label={label}
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      whileTap={{ scale: 0.88 }}
      className={`pointer-events-auto gpu select-none ${className}`}
      style={{ touchAction: 'none', ...style }}
    >
      {children}
    </motion.button>
  )
}

/** Botón de acción de un solo disparo (saltar / bomba / detonar). */
function TapButton({ keyName, className, style, children, label }) {
  const onDown = (e) => {
    e.preventDefault()
    e.stopPropagation()
    fireKey(keyName)
    playSound('click')
  }
  return (
    <motion.button
      aria-label={label}
      onPointerDown={onDown}
      whileTap={{ scale: 0.86 }}
      className={`pointer-events-auto gpu select-none ${className}`}
      style={{ touchAction: 'none', ...style }}
    >
      {children}
    </motion.button>
  )
}

const dpadCell =
  'wood-3d flex items-center justify-center rounded-[1.6cqh] !border-[0.4cqh] text-[4cqh] text-white h-[11cqh] w-[11cqh]'
const actionBtn =
  'wood-3d flex items-center justify-center rounded-full !border-[0.5cqh] font-display text-white text-stroke'

export default function TouchControls() {
  const { currentMinigame } = useGame()

  const needsDpad = currentMinigame === 'snake' || currentMinigame === 'bomba'
  const needsJump = currentMinigame === 'ola'
  const needsBomb = currentMinigame === 'bomba'

  if (!needsDpad && !needsJump && !needsBomb) return null

  return (
    <div
      className="pointer-events-none absolute inset-0 z-40"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)', paddingLeft: 'env(safe-area-inset-left)', paddingRight: 'env(safe-area-inset-right)' }}
    >
      {/* D-pad abajo-izquierda */}
      {needsDpad && (
        <div className="absolute bottom-[3cqh] left-[2.5cqw] grid grid-cols-3 grid-rows-3 gap-[0.6cqh] opacity-90">
          <span />
          <HoldButton keyName="ArrowUp" label="Arriba" className={dpadCell}>⬆️</HoldButton>
          <span />
          <HoldButton keyName="ArrowLeft" label="Izquierda" className={dpadCell}>⬅️</HoldButton>
          <span />
          <HoldButton keyName="ArrowRight" label="Derecha" className={dpadCell}>➡️</HoldButton>
          <span />
          <HoldButton keyName="ArrowDown" label="Abajo" className={dpadCell}>⬇️</HoldButton>
          <span />
        </div>
      )}

      {/* Botones de acción abajo-derecha */}
      <div className="absolute bottom-[3cqh] right-[2.5cqw] flex items-end gap-[1.5cqw]">
        {needsBomb && (
          <TapButton keyName="x" label="Detonar" className={`${actionBtn} h-[11cqh] w-[11cqh] text-[4cqh]`} style={{ background: 'linear-gradient(to bottom, #b06bff, #7b2ff7)', boxShadow: '0 6px 0 #5a1fb0' }}>
            💥
          </TapButton>
        )}
        {(needsBomb || needsJump) && (
          <TapButton keyName=" " label={needsJump ? 'Saltar' : 'Poner bomba'} className={`${actionBtn} h-[15cqh] w-[15cqh] text-[6cqh]`} style={{ background: 'linear-gradient(to bottom, var(--color-tangerine), #ff5e7e)', boxShadow: '0 7px 0 #b8344f' }}>
            {needsJump ? '⬆️' : '💣'}
          </TapButton>
        )}
      </div>
    </div>
  )
}
