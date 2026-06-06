import { motion } from 'framer-motion'
import { useGame } from '../../context/GameContext'
import { useNet, MINIGAME_META } from '../../context/NetContext'
import { useIsTouch } from '../../hooks/useDevice'
import Stage from '../Stage'
import ErrorBoundary from '../ErrorBoundary'
import SoundToggle from '../SoundToggle'
import TouchControls from '../TouchControls'
import PartyBackground from '../PartyBackground'
import LobbyScreen from './LobbyScreen'
import OnlineGameLoop from './OnlineGameLoop'
import RoundResults from './RoundResults'
import FinalPodium from './FinalPodium'

/**
 * OnlineApp — Flujo de la partida online, enrutado por la FASE de la sala
 * (servidor). Se monta en lugar del flujo offline cuando hay sesión activa.
 *
 *   lobby     → sala de espera (código + jugadores)
 *   countdown → intro del minijuego de la ronda (3·2·1, lo marca el servidor)
 *   playing   → OnlineGameLoop (minijuego + marcador en vivo)
 *   results   → tabla de la ronda
 *   final     → podio 🏆
 */
export default function OnlineApp() {
  const { goTo } = useGame()
  const { phase, leave } = useNet()
  const isTouch = useIsTouch()
  const playing = phase === 'playing'

  const exit = () => {
    leave()
    goTo('MENU')
  }

  return (
    <>
      <Stage>
        <ErrorBoundary>
          <PartyBackground lite={playing}>
            {phase === 'lobby' && <LobbyScreen />}
            {phase === 'countdown' && <RoundIntro />}
            {phase === 'playing' && <OnlineGameLoop />}
            {phase === 'results' && <RoundResults />}
            {phase === 'final' && <FinalPodium />}
          </PartyBackground>

          {/* Salir (excepto durante el juego y el podio, que tienen sus botones) */}
          {phase !== 'final' && !playing && (
            <motion.button
              onClick={exit}
              whileTap={{ scale: 0.9 }}
              className="wood-3d absolute left-[1.5cqw] top-[2cqmin] z-50 flex h-[6cqmin] w-[6cqmin] items-center justify-center rounded-full text-[3cqmin]"
              aria-label="Salir de la sala"
            >
              🚪
            </motion.button>
          )}
        </ErrorBoundary>
        <SoundToggle />
      </Stage>
      {isTouch && playing && <TouchControls />}
    </>
  )
}

/** Intro de cada ronda: presenta el minijuego mientras corre la cuenta atrás. */
function RoundIntro() {
  const { currentMinigame, round, totalRounds } = useNet()
  const meta = MINIGAME_META[currentMinigame] || { name: currentMinigame, emoji: '🎮', hint: '' }

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-[2cqmin]">
      <motion.span
        className="font-display text-[3.2cqmin] text-white text-stroke"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Ronda {round} de {totalRounds}
      </motion.span>

      <motion.div
        key={currentMinigame}
        className="anim-float text-[20cqmin]"
        initial={{ scale: 0.3, opacity: 0, rotate: -20 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 14 }}
      >
        {meta.emoji}
      </motion.div>

      <motion.span
        className="gold-text font-display text-[6cqmin] text-stroke-lg"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15 }}
      >
        {meta.name}
      </motion.span>

      <motion.span
        className="font-display text-[2.8cqmin] text-white/90 text-stroke"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {meta.hint}
      </motion.span>

      <motion.span
        className="anim-float font-display text-[3.4cqmin] text-leaf-bright text-stroke"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        ¡Prepárate! 🛶
      </motion.span>
    </div>
  )
}
