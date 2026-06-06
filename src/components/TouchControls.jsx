import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useGame, SCREENS } from '../context/GameContext'
import { playSound } from '../sound'

/**
 * TouchControls — Controles táctiles para móvil. NO toca la lógica de los
 * minijuegos: sintetiza eventos de teclado sobre `window`, que Snake, Bombas
 * y Salta la Ola ya escuchan. Acomoda y Sopa se juegan por arrastre.
 *
 * Se dibuja a nivel de VIEWPORT (fuera del contenedor 16:9), con unidades
 * `vmin` → botones grandes y usables también en VERTICAL. El contenedor deja
 * pasar los toques (pointer-events-none); solo los botones los capturan, así
 * el centro (botones de overlays) sigue siendo pulsable.
 */

const CODE = { ArrowUp: 'ArrowUp', ArrowDown: 'ArrowDown', ArrowLeft: 'ArrowLeft', ArrowRight: 'ArrowRight', ' ': 'Space', x: 'KeyX' }
const fireKey = (key) => window.dispatchEvent(new KeyboardEvent('keydown', { key, code: CODE[key] || '', bubbles: true }))

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
    <motion.button aria-label={label} onPointerDown={start} onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop}
      whileTap={{ scale: 0.88 }} className={`pointer-events-auto gpu select-none ${className}`} style={{ touchAction: 'none', ...style }}>
      {children}
    </motion.button>
  )
}

function TapButton({ keyName, className, style, children, label }) {
  const onDown = (e) => {
    e.preventDefault()
    e.stopPropagation()
    fireKey(keyName)
    playSound('click')
  }
  return (
    <motion.button aria-label={label} onPointerDown={onDown} whileTap={{ scale: 0.86 }}
      className={`pointer-events-auto gpu select-none ${className}`} style={{ touchAction: 'none', ...style }}>
      {children}
    </motion.button>
  )
}

const dpadCell = 'wood-3d flex items-center justify-center rounded-[2.5vmin] !border-[0.6vmin] text-[6vmin] text-white h-[14vmin] w-[14vmin]'
const actionBtn = 'wood-3d flex items-center justify-center rounded-full !border-[0.8vmin] font-display text-white text-stroke'

export default function TouchControls() {
  const { currentMinigame, screen, paused } = useGame()

  // Solo durante la partida (no en overlays de pausa)
  if (screen !== SCREENS.PLAYING || paused) return null

  const needsDpad = currentMinigame === 'snake' || currentMinigame === 'bomba'
  const needsJump = currentMinigame === 'ola'
  const needsBomb = currentMinigame === 'bomba'
  if (!needsDpad && !needsJump && !needsBomb) return null

  const bottom = 'calc(env(safe-area-inset-bottom, 0px) + 3vmin)'

  return (
    <div className="pointer-events-none fixed inset-0 z-[45]">
      {/* D-pad abajo-izquierda */}
      {needsDpad && (
        <div className="absolute grid grid-cols-3 grid-rows-3 gap-[1.4vmin] opacity-95" style={{ bottom, left: 'calc(env(safe-area-inset-left, 0px) + 4vmin)' }}>
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
      <div className="absolute flex items-end gap-[3vmin]" style={{ bottom, right: 'calc(env(safe-area-inset-right, 0px) + 4vmin)' }}>
        {needsBomb && (
          <TapButton keyName="x" label="Detonar" className={`${actionBtn} h-[14vmin] w-[14vmin] text-[7vmin]`} style={{ background: 'linear-gradient(to bottom, #b06bff, #7b2ff7)', boxShadow: '0 1.4vmin 0 #5a1fb0' }}>
            💥
          </TapButton>
        )}
        {(needsBomb || needsJump) && (
          <TapButton keyName=" " label={needsJump ? 'Saltar' : 'Poner bomba'} className={`${actionBtn} h-[20vmin] w-[20vmin] text-[10vmin]`} style={{ background: 'linear-gradient(to bottom, var(--color-tangerine), #ff5e7e)', boxShadow: '0 1.6vmin 0 #b8344f' }}>
            {needsJump ? '⬆️' : '💣'}
          </TapButton>
        )}
      </div>
    </div>
  )
}
