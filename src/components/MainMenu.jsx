import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGame } from '../context/GameContext'
import { useIsTouch } from '../hooks/useDevice'
import { goFullscreen } from '../fullscreen'
import PartyBackground from './PartyBackground'
import WoodButton from './WoodButton'
import InstructionsModal from './InstructionsModal'

/**
 * MainMenu — Pantalla inicial 16:9, dirección de arte "madera + océano".
 * Título saltarín, BARCO DE MADERA con animales (🦁🐘🦒🐵), botón gigante
 * "PLAY!" jugoso (rebote al hover) y acceso al pergamino HOW TO PLAY.
 */
const TITLE = 'ARCA PARTY'

export default function MainMenu() {
  const { nickname, goTo } = useGame()
  const isTouch = useIsTouch()
  const [showHelp, setShowHelp] = useState(false)

  // Si ya hay perfil → directo al selector; si no, a crear el tripulante.
  // En móvil aprovecha el gesto para pantalla completa + horizontal.
  const enter = () => {
    if (isTouch) goFullscreen()
    goTo(nickname ? 'SELECT' : 'PROFILE')
  }

  return (
    <PartyBackground>
      <div className="relative flex h-full w-full flex-col items-center justify-between px-[4cqw] pb-[3cqmin] pt-[5cqmin]">
        {/* ---------- Título ---------- */}
        <motion.header
          className="flex flex-col items-center"
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          <div className="anim-float gpu mb-[-1cqmin] text-[6cqmin] drop-shadow-lg">⚓</div>
          <h1 className="flex select-none font-display leading-none text-stroke-lg">
            {TITLE.split('').map((ch, i) => {
              const rot = (i % 2 === 0 ? -1 : 1) * (3 + (i % 3))
              return (
                <span
                  key={i}
                  className="gold-text gpu inline-block text-[11cqmin]"
                  style={{
                    ['--rot']: `${rot}deg`,
                    animation: `letter-bounce 1.9s ease-in-out ${i * 0.08}s infinite`,
                    transform: `rotate(${rot}deg)`,
                    width: ch === ' ' ? '2.5cqw' : undefined,
                  }}
                >
                  {ch === ' ' ? ' ' : ch}
                </span>
              )
            })}
          </h1>
        </motion.header>

        {/* ---------- Barco de madera con animales ---------- */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 170, damping: 16 }}
          className="relative"
        >
          <WoodBoat />
        </motion.div>

        {/* ---------- Botones ---------- */}
        <motion.div
          className="flex flex-col items-center gap-[1.6cqmin]"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 220, damping: 12 }}
        >
          {/* PLAY! gigante y jugoso */}
          <motion.div
            className="gpu"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <PlayButton onClick={enter} />
          </motion.div>

          <div className="flex items-center gap-[1.5cqw]">
            <WoodButton size="md" variant="ocean" glow onClick={() => goTo('ONLINE')}>
              🌐 JUGAR ONLINE
            </WoodButton>
            <WoodButton size="md" variant="wood" onClick={() => setShowHelp(true)}>
              📜 ¿CÓMO JUGAR?
            </WoodButton>
          </div>
        </motion.div>
      </div>

      {/* ---------- Modal de instrucciones ---------- */}
      <AnimatePresence>
        {showHelp && (
          <InstructionsModal
            onClose={() => setShowHelp(false)}
            onPlay={() => {
              setShowHelp(false)
              enter()
            }}
          />
        )}
      </AnimatePresence>
    </PartyBackground>
  )
}

/* ===================================================================
   Botón PLAY! — gigante, jugoso, 3D, rebote al hover.
   =================================================================== */
function PlayButton({ onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.12, y: -6, rotate: -1 }}
      whileTap={{ scale: 0.92, y: 4 }}
      transition={{ type: 'spring', stiffness: 500, damping: 14 }}
      className="gpu gloss relative inline-flex items-center justify-center gap-[1.2cqw] overflow-hidden rounded-[3.5cqmin] border-[0.6cqmin] border-white/80 px-[8cqw] py-[3cqmin] font-display"
      style={{
        background: 'linear-gradient(to bottom, #ff9a3d 0%, var(--color-tangerine) 35%, #ff5e7e 100%)',
        boxShadow:
          'inset 0 0.6cqmin 0 rgba(255,255,255,0.6), inset 0 -1cqmin 1.6cqmin rgba(120,20,40,0.5), 0 1.4cqmin 0 #b8344f, 0 2.4cqmin 3.4cqmin rgba(0,0,0,0.45), 0 0 4cqmin rgba(255,158,61,0.7)',
      }}
    >
      {/* sheen cruzando */}
      <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
        <span className="absolute inset-y-0 left-0 w-1/4 bg-white/50" style={{ animation: 'sheen-x 3s ease-in-out infinite' }} />
      </span>
      <span className="relative z-10 text-[8cqmin] text-white text-stroke-lg" style={{ letterSpacing: '0.05em' }}>
        PLAY!
      </span>
      <span className="relative z-10 text-[7cqmin]">🚀</span>
    </motion.button>
  )
}

/* ===================================================================
   WoodBoat — Arca de madera con cabina, animales y casco de tablones.
   =================================================================== */
function WoodBoat() {
  return (
    <div className="anim-bob gpu relative flex flex-col items-center" style={{ width: '40cqw' }}>
      {/* Bandera + mástil */}
      <div className="relative z-20 flex flex-col items-center">
        <div className="anim-sway gpu h-[3cqmin] w-[5cqw] origin-left" style={{ background: 'var(--color-coral)', clipPath: 'polygon(0 0, 100% 25%, 0 50%)', marginLeft: '0.6cqw' }} />
        <div className="h-[5cqmin] w-[0.8cqw] bg-wood-grain" />
      </div>

      {/* Cabina del arca con animales asomados */}
      <div className="relative z-10 -mb-[1cqmin] w-[26cqw]">
        {/* techo */}
        <div
          className="mx-auto h-[5cqmin] w-[28cqw]"
          style={{
            background: 'linear-gradient(to bottom, var(--color-coral), #c0392b)',
            clipPath: 'polygon(8% 100%, 50% 0, 92% 100%)',
            filter: 'drop-shadow(0 0.4cqmin 0.4cqmin rgba(0,0,0,0.3))',
          }}
        />
        {/* cuerpo de la cabina con ventanas */}
        <div
          className="relative flex items-end justify-center gap-[1.4cqw] rounded-t-[1.5cqmin] px-[2cqw] pb-[1cqmin] pt-[2cqmin]"
          style={{
            background:
              'repeating-linear-gradient(to bottom, var(--color-wood-rich) 0 2.4cqmin, var(--color-wood-grain) 2.4cqmin 2.8cqmin)',
            border: '0.5cqmin solid var(--color-wood-edge)',
            boxShadow: 'inset 0 0.5cqmin 0 rgba(255,230,180,0.35), inset 0 -0.8cqmin 1cqmin rgba(0,0,0,0.4)',
          }}
        >
          {['🦁', '🐘'].map((a, i) => (
            <span
              key={a}
              className="anim-float gpu flex h-[7cqmin] w-[7cqmin] items-center justify-center rounded-full text-[5cqmin]"
              style={{
                background: 'radial-gradient(circle at 50% 35%, #ffeebb, #e0a85a)',
                border: '0.4cqmin solid var(--color-wood-edge)',
                boxShadow: 'inset 0 -0.5cqmin 0.8cqmin rgba(0,0,0,0.3)',
                animationDelay: `${i * 0.4}s`,
              }}
            >
              {a}
            </span>
          ))}
        </div>
      </div>

      {/* Animales en cubierta */}
      <div className="relative z-10 -mb-[2cqmin] flex items-end justify-center gap-[1cqw] text-[6.5cqmin]">
        {['🦒', '🐵'].map((a, i) => (
          <span key={a} className="anim-float gpu" style={{ animationDelay: `${0.2 + i * 0.35}s`, animationDuration: '2.4s' }}>
            {a}
          </span>
        ))}
      </div>

      {/* Casco de tablones */}
      <div
        className="relative h-[12cqmin] w-[40cqw]"
        style={{
          background:
            'repeating-linear-gradient(to bottom, var(--color-wood-light) 0 1.6cqmin, var(--color-wood-rich) 1.6cqmin 3cqmin, var(--color-wood-grain) 3cqmin 3.4cqmin)',
          borderRadius: '8% 8% 48% 48% / 12% 12% 100% 100%',
          border: '0.6cqmin solid var(--color-wood-edge)',
          boxShadow:
            'inset 0 1cqmin 0 rgba(255,235,190,0.4), inset 0 -1.5cqmin 2cqmin rgba(0,0,0,0.5), 0 1.4cqmin 2.6cqmin rgba(0,0,0,0.4)',
        }}
      >
        {/* franja decorativa + ojo de buey */}
        <div className="absolute inset-x-0 top-[2cqmin] h-[2cqmin]" style={{ background: 'var(--color-gold)', boxShadow: '0 0.3cqmin 0 rgba(0,0,0,0.3)' }} />
        <div className="absolute left-1/2 top-[5.5cqmin] h-[4cqmin] w-[4cqmin] -translate-x-1/2 rounded-full" style={{ background: 'radial-gradient(circle at 40% 35%, #bfe9ff, #2e8bff 70%)', border: '0.5cqmin solid var(--color-wood-edge)' }} />
      </div>

      {/* Reflejo en el agua */}
      <div className="absolute -bottom-[2.5cqmin] left-1/2 h-[2.5cqmin] w-[34cqw] -translate-x-1/2 rounded-full bg-white/25 blur-md" />
    </div>
  )
}
