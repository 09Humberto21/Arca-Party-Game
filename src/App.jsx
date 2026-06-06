import { AnimatePresence, motion } from 'framer-motion'
import { GameProvider, SCREENS, useGame } from './context/GameContext'
import { NetProvider, useNet } from './context/NetContext'
import Stage from './components/Stage'
import ErrorBoundary from './components/ErrorBoundary'
import SoundToggle from './components/SoundToggle'
import GuideChat from './components/GuideChat'
import TouchControls from './components/TouchControls'
import { useIsTouch } from './hooks/useDevice'
import MainMenu from './components/MainMenu'
import ProfileScreen from './components/ProfileScreen'
import SelectScreen from './components/SelectScreen'
import ShopScreen from './components/ShopScreen'
import GameHUD from './components/GameHUD'
import GameLoop from './components/GameLoop'
import PauseOverlay from './components/PauseOverlay'
import DefeatScreen from './components/DefeatScreen'
import VictoryScreen from './components/VictoryScreen'
import PartyBackground from './components/PartyBackground'
import OnlineMenu from './components/online/OnlineMenu'
import OnlineApp from './components/online/OnlineApp'

/**
 * App — Orquestador del flujo de pantallas (game loop) dentro del Stage 16:9.
 *
 *   MENU     → MainMenu (botón ¡ZARPAR! / PLAY!)
 *   PLAYING  → GameHUD fijo arriba + GameLoop (carga el minijuego activo)
 *   VICTORY / DEFEAT → se enchufarán aquí más adelante.
 *
 * `game.screen` actúa como el "isPlaying": cuando vale PLAYING, el menú
 * desaparece (AnimatePresence) y entra la zona de juego.
 */
function Screens() {
  const game = useGame()
  const isTouch = useIsTouch()

  return (
    <>
    <Stage>
      <ErrorBoundary>
      <AnimatePresence>
        {game.screen === SCREENS.MENU && (
          <motion.div
            key="menu"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 0.35 }}
          >
            <MainMenu />
          </motion.div>
        )}

        {game.screen === SCREENS.PROFILE && (
          <motion.div
            key="profile"
            className="absolute inset-0"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
          >
            <ProfileScreen />
          </motion.div>
        )}

        {game.screen === SCREENS.SELECT && (
          <motion.div
            key="select"
            className="absolute inset-0"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
          >
            <SelectScreen />
          </motion.div>
        )}

        {game.screen === SCREENS.ONLINE && (
          <motion.div
            key="online"
            className="absolute inset-0"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.3 }}
          >
            <OnlineMenu />
          </motion.div>
        )}

        {game.screen === SCREENS.SHOP && (
          <motion.div
            key="shop"
            className="absolute inset-0"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.3 }}
          >
            <ShopScreen />
          </motion.div>
        )}

        {game.screen === SCREENS.PLAYING && (
          <motion.div
            key="playing"
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <PartyBackground lite>
              {/* HUD fijo siempre arriba */}
              <GameHUD />
              {/* Minijuego activo */}
              <GameLoop />
              {/* Pausa por encima de todo */}
              <AnimatePresence>{game.paused && <PauseOverlay />}</AnimatePresence>
            </PartyBackground>
          </motion.div>
        )}

        {game.screen === SCREENS.DEFEAT && (
          <motion.div
            key="defeat"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <DefeatScreen />
          </motion.div>
        )}

        {game.screen === SCREENS.VICTORY && (
          <motion.div
            key="victory"
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <VictoryScreen />
          </motion.div>
        )}
      </AnimatePresence>
      </ErrorBoundary>
      {/* Control de sonido visible en todas las pantallas */}
      <SoundToggle />
      {/* Chat-guía (oculto durante la partida para no estorbar) */}
      {game.screen !== SCREENS.PLAYING && <GuideChat />}
      </Stage>
      {/* Controles táctiles a nivel de viewport (solo móvil; se autogestiona) */}
      {isTouch && <TouchControls />}
    </>
  )
}

/** Cambia entre el flujo offline y el online según haya sesión multijugador. */
function Root() {
  const net = useNet()
  return net.active ? <OnlineApp /> : <Screens />
}

export default function App() {
  return (
    <GameProvider>
      <NetProvider>
        <Root />
      </NetProvider>
    </GameProvider>
  )
}
