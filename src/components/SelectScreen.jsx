import { motion } from 'framer-motion'
import { useGame } from '../context/GameContext'
import { MINIGAMES } from '../data/catalog'
import { playSound } from '../sound'
import PartyBackground from './PartyBackground'
import WoodButton from './WoodButton'

/**
 * SelectScreen — Hub de selección de minijuegos. Saluda con skin+nickname,
 * muestra la cartera y da acceso a la Tienda. Las tarjetas reflejan el
 * estado de desbloqueo (jugar / comprar en tienda / próximamente).
 */
export default function SelectScreen() {
  const { nickname, skin, coins, diamonds, unlockedMinigames, selectMinigame, goTo } = useGame()

  return (
    <PartyBackground>
      <div className="flex h-full w-full flex-col items-center justify-center gap-[2.5cqh] px-[4cqw] pt-[1cqh]">
        {/* Cartera arriba a la derecha */}
        <div className="absolute right-[3cqw] top-[2cqh] flex items-center gap-[1.2cqw]">
          <Coin emoji="🪙" value={coins} color="var(--color-coin)" />
          <Coin emoji="💎" value={diamonds} color="var(--color-diamond)" />
        </div>

        {/* Saludo */}
        <motion.div
          className="flex items-center gap-[1.5cqw]"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 16 }}
        >
          <div
            className="anim-float gpu flex h-[10cqh] w-[10cqh] items-center justify-center rounded-full text-[6cqh]"
            style={{
              background: 'radial-gradient(circle at 50% 35%, #fff7df, #f2b84b 78%)',
              border: '0.5cqh solid var(--color-wood-edge)',
              boxShadow: 'inset 0 -0.6cqh 1cqh rgba(0,0,0,0.3)',
            }}
          >
            {skin}
          </div>
          <div className="flex flex-col">
            <span className="font-display text-[2.4cqh] text-white text-stroke">¡Hola,</span>
            <span className="gold-text font-display text-[5cqh] leading-none">{nickname || 'Capitán'}!</span>
          </div>
        </motion.div>

        <motion.h2
          className="font-display text-[3.6cqh] text-white text-stroke-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Elige tu desafío 🎮
        </motion.h2>

        {/* Tarjetas (deslizables horizontalmente — caben todas en cualquier pantalla) */}
        <div
          className="flex w-full snap-x snap-mandatory items-stretch gap-[2.5cqw] overflow-x-auto px-[4cqw] py-[1cqh]"
          style={{ scrollbarWidth: 'none' }}
        >
          {MINIGAMES.map((g, i) => {
            const unlocked = unlockedMinigames.includes(g.id)
            return (
              <GameCard
                key={g.id}
                game={g}
                index={i}
                unlocked={unlocked}
                onPlay={() => {
                  if (unlocked) {
                    playSound('start')
                    selectMinigame(g.id)
                  }
                }}
                onShop={() => goTo('SHOP')}
              />
            )
          })}
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-[1.6cqw]">
          <WoodButton size="md" variant="wood" onClick={() => goTo('MENU')}>
            ⬅ Menú
          </WoodButton>
          <WoodButton size="md" variant="ocean" onClick={() => goTo('PROFILE')}>
            ✏️ Perfil
          </WoodButton>
          <WoodButton size="lg" variant="gold" glow onClick={() => goTo('SHOP')}>
            🛒 TIENDA
          </WoodButton>
        </div>
      </div>
    </PartyBackground>
  )
}

function Coin({ emoji, value, color }) {
  return (
    <div className="wood-inset flex items-center gap-[0.5cqw] rounded-full px-[1.2cqw] py-[0.6cqh]">
      <span className="text-[2.6cqh]">{emoji}</span>
      <span className="font-display text-[2.4cqh] tabular-nums" style={{ color, textShadow: '0 0.2cqh 0 rgba(0,0,0,0.5)' }}>
        {value.toLocaleString('es')}
      </span>
    </div>
  )
}

function GameCard({ game, index, unlocked, onPlay, onShop }) {
  const { emoji, title, desc, tint, available, cost, currency } = game
  const locked = available && !unlocked
  const disabled = !available

  const handle = () => {
    if (unlocked) onPlay()
    else if (locked) onShop()
  }

  return (
    <motion.button
      onClick={handle}
      disabled={disabled}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 + index * 0.12, type: 'spring', stiffness: 240, damping: 16 }}
      whileHover={disabled ? { x: [0, -4, 4, -4, 0] } : { scale: 1.06, y: -6 }}
      whileTap={disabled ? undefined : { scale: 0.95 }}
      className="wood-3d relative flex w-[24cqw] shrink-0 snap-center flex-col items-center gap-[1cqh] rounded-[2.4cqh] px-[2cqw] py-[2.5cqh] text-center"
      style={{ cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.92 : 1 }}
    >
      <div
        className="flex h-[12cqh] w-[12cqh] items-center justify-center rounded-full"
        style={{
          background: `radial-gradient(circle at 50% 35%, #fff, ${tint} 72%)`,
          border: '0.5cqh solid rgba(255,255,255,0.8)',
          boxShadow: 'inset 0 -0.8cqh 1.2cqh rgba(0,0,0,0.25)',
          filter: unlocked ? 'none' : 'grayscale(0.7)',
        }}
      >
        <span className="text-[7cqh]">{emoji}</span>
      </div>

      <h3 className="font-display text-[2.6cqh] text-white text-stroke leading-tight">{title}</h3>
      <p className="font-body text-[1.7cqh] font-semibold leading-tight text-[#fff0d2]">{desc}</p>

      {disabled ? (
        <span className="mt-[0.4cqh] rounded-full bg-black/40 px-[1.5cqw] py-[0.4cqh] font-display text-[1.8cqh] text-white">
          🔒 Próximamente
        </span>
      ) : unlocked ? (
        <span className="anim-heartbeat gpu mt-[0.4cqh] rounded-full bg-leaf-bright px-[1.8cqw] py-[0.4cqh] font-display text-[2cqh] text-white text-stroke">
          ▶ JUGAR
        </span>
      ) : (
        <span className="mt-[0.4cqh] rounded-full bg-gold-deep px-[1.4cqw] py-[0.4cqh] font-display text-[1.9cqh] text-white text-stroke">
          🛒 {currency === 'diamond' ? '💎' : '🪙'} {cost}
        </span>
      )}
    </motion.button>
  )
}
