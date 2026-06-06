import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGame } from '../context/GameContext'
import { SKINS } from '../data/catalog'
import PartyBackground from './PartyBackground'
import WoodButton from './WoodButton'

/**
 * ProfileScreen — El jugador escribe su nickname y elige su skin entre las
 * que tiene DESBLOQUEADAS. Para más personajes, la tienda.
 */
export default function ProfileScreen() {
  const { nickname, skin, unlockedSkins, setProfile, goTo } = useGame()
  const [name, setName] = useState(nickname)
  const [pick, setPick] = useState(skin)

  // Solo las skins que el jugador posee
  const owned = SKINS.filter((s) => unlockedSkins.includes(s.id))

  const confirm = () => {
    setProfile(name.trim() || 'Capitán', pick)
    goTo('SELECT')
  }

  return (
    <PartyBackground>
      <div className="flex h-full w-full flex-col items-center justify-center px-[4cqw]">
        <motion.div
          className="parchment relative flex w-[78cqw] max-w-[120cqmin] flex-col items-center gap-[2cqmin] rounded-[2cqmin] px-[5cqw] py-[3.5cqmin]"
          initial={{ opacity: 0, scale: 0.7, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 18 }}
        >
          {/* Avatar grande seleccionado */}
          <motion.div
            key={pick}
            className="flex h-[16cqmin] w-[16cqmin] items-center justify-center rounded-full text-[10cqmin]"
            initial={{ scale: 0.6, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 12 }}
            style={{
              background: 'radial-gradient(circle at 50% 35%, #fff7df, #f2b84b 78%)',
              border: '0.6cqmin solid var(--color-wood-edge)',
              boxShadow: 'inset 0 -0.8cqmin 1.2cqmin rgba(0,0,0,0.3), 0 1cqmin 1.6cqmin rgba(0,0,0,0.3)',
            }}
          >
            {pick}
          </motion.div>

          <h2 className="gold-text font-display text-[5cqmin]">¡ARMA TU TRIPULANTE!</h2>

          {/* Input de nickname */}
          <div className="flex w-full flex-col items-center gap-[0.8cqmin]">
            <label className="font-display text-[2.4cqmin] text-wood-grain" style={{ textShadow: '0 1px 0 rgba(255,255,255,0.5)' }}>
              Tu nombre de capitán
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && confirm()}
              maxLength={14}
              placeholder="Capitán..."
              autoFocus
              className="wood-inset w-[60cqw] max-w-[80cqmin] rounded-[1.6cqmin] px-[3cqw] py-[1.2cqmin] text-center font-display text-[3.4cqmin] text-white outline-none placeholder:text-white/50"
              style={{ textShadow: '0 0.2cqmin 0 rgba(0,0,0,0.5)' }}
            />
          </div>

          {/* Grid de skins */}
          <div className="flex flex-col items-center gap-[0.8cqmin]">
            <span className="font-display text-[2.4cqmin] text-wood-grain" style={{ textShadow: '0 1px 0 rgba(255,255,255,0.5)' }}>
              Elige tu animalito
            </span>
            <div className="grid grid-cols-6 gap-[1.2cqw]">
              {owned.map((s) => {
                const active = s.emoji === pick
                return (
                  <motion.button
                    key={s.id}
                    onClick={() => setPick(s.emoji)}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    className="flex h-[8cqmin] w-[8cqmin] items-center justify-center rounded-full text-[5cqmin]"
                    style={{
                      background: active
                        ? 'radial-gradient(circle at 50% 35%, #d8ffe9, #00e676 78%)'
                        : 'radial-gradient(circle at 50% 35%, #fff, #e8c98a 80%)',
                      border: active ? '0.5cqmin solid #00b85a' : '0.4cqmin solid var(--color-wood-edge)',
                      boxShadow: active
                        ? '0 0 2cqmin rgba(0,230,118,0.8)'
                        : 'inset 0 -0.4cqmin 0.6cqmin rgba(0,0,0,0.25)',
                    }}
                  >
                    {s.emoji}
                  </motion.button>
                )
              })}
            </div>
            <button
              onClick={() => goTo('SHOP')}
              className="mt-[0.5cqmin] font-body text-[1.9cqmin] font-bold text-wood-grain underline"
            >
              🛒 ¿Quieres más personajes? Visita la tienda
            </button>
          </div>

          {/* Acciones */}
          <div className="mt-[1cqmin] flex items-center gap-[2cqw]">
            <WoodButton size="md" variant="wood" onClick={() => goTo('MENU')}>
              ⬅ Atrás
            </WoodButton>
            <WoodButton size="lg" variant="leaf" glow onClick={confirm}>
              ¡LISTO! ➡️
            </WoodButton>
          </div>
        </motion.div>
      </div>
    </PartyBackground>
  )
}
