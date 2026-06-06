import { motion } from 'framer-motion'
import { useGame } from '../context/GameContext'
import { SKINS, MINIGAMES } from '../data/catalog'
import { playSound } from '../sound'
import PartyBackground from './PartyBackground'
import WoodButton from './WoodButton'

/**
 * ShopScreen — Tienda. Canjea 🪙 monedas y 💎 diamantes por personajes
 * (skins) y por desbloquear minijuegos. La cartera es persistente.
 */
export default function ShopScreen() {
  const game = useGame()
  const { coins, diamonds, skin, unlockedSkins, unlockedMinigames, buySkin, buyMinigame, equipSkin, goTo } = game

  const afford = (cost, currency) => (currency === 'diamond' ? diamonds : coins) >= cost

  return (
    <PartyBackground>
      <div className="flex h-full w-full flex-col px-[3cqw] pb-[2cqmin] pt-[2cqmin]">
        {/* ---------- Cabecera: título + cartera ---------- */}
        <div className="flex shrink-0 items-center justify-between gap-[2cqw] pl-[8cqw]">
          <h1 className="gold-text font-display text-[5cqmin]">🛒 TIENDA</h1>
          <div className="flex items-center gap-[1.5cqw]">
            <Wallet emoji="🪙" value={coins} color="var(--color-coin)" />
            <Wallet emoji="💎" value={diamonds} color="var(--color-diamond)" />
            <WoodButton size="sm" variant="wood" onClick={() => goTo('SELECT')}>
              ⬅ Volver
            </WoodButton>
          </div>
        </div>

        {/* ---------- Contenido scrollable ---------- */}
        <div className="mt-[1.5cqmin] min-h-0 flex-1 overflow-y-auto pr-[1cqw]">
          {/* Personajes */}
          <SectionTitle>🐾 Personajes</SectionTitle>
          <div className="grid grid-cols-7 gap-[1.4cqw]">
            {SKINS.map((s) => {
              const owned = unlockedSkins.includes(s.id)
              const equipped = owned && skin === s.emoji
              const canBuy = !owned && afford(s.cost, s.currency)
              return (
                <SkinCard
                  key={s.id}
                  skin={s}
                  owned={owned}
                  equipped={equipped}
                  canBuy={canBuy}
                  onClick={() => {
                    if (equipped) return
                    if (owned) {
                      playSound('click')
                      equipSkin(s.emoji)
                    } else if (canBuy) {
                      playSound('buy')
                      buySkin(s)
                    } else {
                      playSound('error')
                    }
                  }}
                />
              )
            })}
          </div>

          {/* Minijuegos */}
          <SectionTitle className="mt-[2.5cqmin]">🎮 Desbloquear minijuegos</SectionTitle>
          <div className="grid grid-cols-3 gap-[2cqw] pb-[2cqmin]">
            {MINIGAMES.map((m) => {
              const owned = unlockedMinigames.includes(m.id)
              const canBuy = m.available && !owned && afford(m.cost, m.currency)
              return (
                <MinigameCard
                  key={m.id}
                  game={m}
                  owned={owned}
                  canBuy={canBuy}
                  onBuy={() => {
                    if (canBuy) {
                      playSound('buy')
                      buyMinigame(m)
                    } else playSound('error')
                  }}
                  onPlay={() => goTo('SELECT')}
                />
              )
            })}
          </div>
        </div>
      </div>
    </PartyBackground>
  )
}

function Wallet({ emoji, value, color }) {
  return (
    <div className="wood-inset flex items-center gap-[0.6cqw] rounded-full px-[1.6cqw] py-[0.7cqmin]">
      <span className="text-[3cqmin]">{emoji}</span>
      <span className="font-display text-[2.8cqmin] tabular-nums" style={{ color, textShadow: '0 0.2cqmin 0 rgba(0,0,0,0.5)' }}>
        {value.toLocaleString('es')}
      </span>
    </div>
  )
}

function SectionTitle({ children, className = '' }) {
  return (
    <h2 className={`mb-[1cqmin] font-display text-[3cqmin] text-white text-stroke ${className}`}>{children}</h2>
  )
}

function priceLabel(cost, currency) {
  return `${currency === 'diamond' ? '💎' : '🪙'} ${cost}`
}

function SkinCard({ skin, owned, equipped, canBuy, onClick }) {
  const disabled = !owned && !canBuy
  return (
    <motion.button
      onClick={onClick}
      whileHover={disabled ? undefined : { scale: 1.06, y: -3 }}
      whileTap={disabled ? undefined : { scale: 0.93 }}
      className="wood-3d relative flex flex-col items-center gap-[0.6cqmin] rounded-[1.8cqmin] px-[0.6cqw] py-[1.2cqmin]"
      style={{ cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.55 : 1 }}
    >
      {/* Disco con la skin */}
      <div
        className="flex h-[8.5cqmin] w-[8.5cqmin] items-center justify-center rounded-full"
        style={{
          background: equipped
            ? 'radial-gradient(circle at 50% 35%, #d8ffe9, #00e676 78%)'
            : 'radial-gradient(circle at 50% 35%, #fff7df, #f2b84b 80%)',
          border: equipped ? '0.4cqmin solid #00b85a' : '0.4cqmin solid var(--color-wood-edge)',
          boxShadow: 'inset 0 -0.5cqmin 0.8cqmin rgba(0,0,0,0.25)',
        }}
      >
        <span className="text-[5.2cqmin]">{skin.emoji}</span>
      </div>
      <span className="font-display text-[1.7cqmin] text-white text-stroke leading-none">{skin.name}</span>

      {/* Estado */}
      {equipped ? (
        <span className="rounded-full bg-leaf-bright px-[0.8cqw] py-[0.2cqmin] font-display text-[1.5cqmin] text-white text-stroke">
          ✓ Equipado
        </span>
      ) : owned ? (
        <span className="rounded-full bg-ocean px-[0.8cqw] py-[0.2cqmin] font-display text-[1.5cqmin] text-white text-stroke">
          Equipar
        </span>
      ) : (
        <span
          className="rounded-full px-[0.8cqw] py-[0.2cqmin] font-display text-[1.7cqmin] text-white text-stroke"
          style={{ background: canBuy ? 'var(--color-gold-deep)' : 'rgba(0,0,0,0.4)' }}
        >
          {priceLabel(skin.cost, skin.currency)}
        </span>
      )}
    </motion.button>
  )
}

function MinigameCard({ game, owned, canBuy, onBuy, onPlay }) {
  const { emoji, title, desc, tint, cost, currency, available } = game
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="wood-3d flex flex-col items-center gap-[0.8cqmin] rounded-[2.2cqmin] px-[1.5cqw] py-[1.6cqmin] text-center"
    >
      <div
        className="flex h-[10cqmin] w-[10cqmin] items-center justify-center rounded-full"
        style={{
          background: `radial-gradient(circle at 50% 35%, #fff, ${tint} 72%)`,
          border: '0.4cqmin solid rgba(255,255,255,0.8)',
          filter: available ? 'none' : 'grayscale(0.85)',
        }}
      >
        <span className="text-[6cqmin]">{emoji}</span>
      </div>
      <h3 className="font-display text-[2.3cqmin] text-white text-stroke leading-tight">{title}</h3>
      <p className="font-body text-[1.5cqmin] font-semibold leading-tight text-[#fff0d2]">{desc}</p>

      {!available ? (
        <span className="rounded-full bg-black/40 px-[1.2cqw] py-[0.3cqmin] font-display text-[1.7cqmin] text-white">🔒 Próximamente</span>
      ) : owned ? (
        <WoodButton size="sm" variant="leaf" onClick={onPlay}>
          ✓ Desbloqueado · Jugar
        </WoodButton>
      ) : (
        <WoodButton size="sm" variant={canBuy ? 'gold' : 'wood'} onClick={onBuy} className={canBuy ? '' : 'opacity-60'}>
          Comprar {priceLabel(cost, currency)}
        </WoodButton>
      )}
    </motion.div>
  )
}
