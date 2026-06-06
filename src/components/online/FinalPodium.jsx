import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useGame } from '../../context/GameContext'
import { useNet } from '../../context/NetContext'
import WoodButton from '../WoodButton'
import { playSound } from '../../sound'

/**
 * FinalPodium — 🏆 Cierre de la partida. Podio 🥇🥈🥉 con confeti, campeón
 * coronado, y botones: el anfitrión puede "Otra vez" (volver al lobby), todos
 * pueden salir al menú.
 */
const CONFETTI = Array.from({ length: 28 })
const COLORS = ['#ffd24a', '#ff5e7e', '#00e676', '#03a9f4', '#b06bff', '#ff9a3d']

export default function FinalPodium() {
  const { goTo } = useGame()
  const { players, me, hostId, backToLobby, leave } = useNet()
  const isHost = me === hostId
  const ranked = [...players].sort((a, b) => b.score - a.score)
  const champ = ranked[0]
  const podium = [ranked[1], ranked[0], ranked[2]] // izq, centro, der
  const heights = [22, 32, 16] // cqh
  const medals = ['🥈', '🥇', '🥉']

  const playedRef = useRef(false)
  useEffect(() => {
    if (playedRef.current) return
    playedRef.current = true
    playSound('win')
    setTimeout(() => playSound('win'), 320)
  }, [])

  const exitToMenu = () => {
    leave()
    goTo('MENU')
  }

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-between overflow-hidden px-[5cqw] py-[3cqh]">
      {/* Confeti (solo transform/opacity) */}
      {CONFETTI.map((_, i) => {
        const left = (i * 37) % 100
        const dur = 2.6 + ((i * 7) % 10) * 0.18
        const delay = (i % 9) * 0.18
        return (
          <span
            key={i}
            className="pointer-events-none absolute top-[-6cqh] h-[1.6cqh] w-[1.6cqh]"
            style={{
              left: `${left}%`,
              background: COLORS[i % COLORS.length],
              borderRadius: i % 2 ? '50%' : '0',
              animation: `confetti-fall ${dur}s linear ${delay}s infinite`,
            }}
          />
        )
      })}

      {/* Título + campeón */}
      <motion.div
        className="z-10 flex flex-col items-center"
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 14 }}
      >
        <span className="gold-text font-display text-[8cqh] text-stroke-lg">🏆 ¡CAMPEÓN!</span>
        {champ && (
          <span className="font-display text-[4.4cqh] text-white text-stroke">
            {champ.skin} {champ.nickname} · {champ.score} ⭐
          </span>
        )}
      </motion.div>

      {/* Podio */}
      <div className="z-10 flex items-end justify-center gap-[2cqw]">
        {podium.map((p, i) =>
          p ? (
            <motion.div
              key={p.id}
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.18, type: 'spring', stiffness: 200, damping: 16 }}
            >
              <span className="text-[5cqh]">{medals[i]}</span>
              <span
                className="anim-float flex h-[10cqh] w-[10cqh] items-center justify-center rounded-full text-[6cqh]"
                style={{ background: 'radial-gradient(circle at 50% 35%, #ffeebb, #e0a85a)', border: '0.5cqh solid var(--color-wood-edge)' }}
              >
                {p.skin}
              </span>
              <span className="max-w-[18cqw] truncate font-display text-[2.8cqh] text-white text-stroke">{p.nickname}</span>
              <span className="font-display text-[2.6cqh] text-gold text-stroke">{p.score} ⭐</span>
              <div
                className="wood-3d mt-[0.6cqh] flex w-[16cqw] items-start justify-center rounded-t-[1.4cqh] pt-[1cqh] font-display text-[4cqh] text-white text-stroke"
                style={{ height: `${heights[i]}cqh` }}
              >
                {i === 0 ? 2 : i === 1 ? 1 : 3}
              </div>
            </motion.div>
          ) : (
            <div key={`empty-${i}`} className="w-[16cqw]" />
          ),
        )}
      </div>

      {/* Resto de la clasificación */}
      {ranked.length > 3 && (
        <div className="z-10 flex max-w-[70cqw] flex-wrap justify-center gap-[1cqw]">
          {ranked.slice(3).map((p, i) => (
            <span key={p.id} className="wood-inset rounded-[1cqh] px-[1.5cqw] py-[0.4cqh] font-display text-[2.2cqh] text-white text-stroke">
              {i + 4}. {p.skin} {p.nickname} · {p.score}
            </span>
          ))}
        </div>
      )}

      {/* Botones */}
      <div className="z-10 flex items-center gap-[2cqw]">
        {isHost && (
          <WoodButton size="lg" variant="leaf" glow onClick={backToLobby}>
            🔁 ¡Otra vez!
          </WoodButton>
        )}
        <WoodButton size="md" variant="wood" onClick={exitToMenu}>
          🏠 Salir
        </WoodButton>
      </div>
    </div>
  )
}
