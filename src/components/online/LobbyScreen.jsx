import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNet } from '../../context/NetContext'
import WoodButton from '../WoodButton'
import { playSound } from '../../sound'

/**
 * LobbyScreen — Sala de espera. Muestra el CÓDIGO grande para compartir, las
 * tarjetas de los jugadores (con corona 👑 para el anfitrión y ✓ listo), y los
 * controles: todos pueden marcarse "Listo"; el anfitrión elige rondas y empieza.
 */
export default function LobbyScreen() {
  const { code, players, me, hostId, totalRounds, setReady, setRounds, startMatch } = useNet()
  const [copied, setCopied] = useState(false)

  const isHost = me === hostId
  const myPlayer = players.find((p) => p.id === me)
  const everyoneReady = players.length >= 1 && players.every((p) => p.ready || p.id === hostId)

  const copyCode = async () => {
    playSound('click')
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* sin portapapeles: el usuario lee el código */
    }
  }

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-between px-[4cqw] py-[3cqh]">
      {/* Código de sala para compartir */}
      <motion.div
        className="flex flex-col items-center gap-[0.6cqh]"
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 14 }}
      >
        <span className="font-display text-[2.6cqh] text-white text-stroke">Código de la sala</span>
        <motion.button
          onClick={copyCode}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="wood-3d flex items-center gap-[1.5cqw] rounded-[2cqh] px-[4cqw] py-[1.2cqh]"
        >
          <span className="gold-text font-display text-[10cqh] tracking-[0.3em] text-stroke-lg">{code}</span>
          <span className="text-[4cqh]">{copied ? '✅' : '📋'}</span>
        </motion.button>
        <span className="font-display text-[2cqh] text-white/80 text-stroke">
          {copied ? '¡Copiado!' : 'Tócalo para copiar y compartir'}
        </span>
      </motion.div>

      {/* Jugadores */}
      <div className="flex max-h-[42cqh] w-full flex-wrap items-start justify-center gap-[1.5cqw] overflow-y-auto py-[1cqh]">
        <AnimatePresence>
          {players.map((p) => (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: p.connected ? 1 : 0.4, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18 }}
              className="wood-3d relative flex w-[18cqw] min-w-[20cqh] flex-col items-center gap-[0.4cqh] rounded-[2cqh] px-[1.5cqw] py-[1.4cqh]"
            >
              {p.isHost && <span className="absolute -top-[2.2cqh] text-[4cqh]">👑</span>}
              <div
                className="flex h-[9cqh] w-[9cqh] items-center justify-center rounded-full text-[5.5cqh]"
                style={{ background: 'radial-gradient(circle at 50% 35%, #ffeebb, #e0a85a)', border: '0.4cqh solid var(--color-wood-edge)' }}
              >
                {p.skin}
              </div>
              <span className="max-w-full truncate font-display text-[2.6cqh] text-white text-stroke">
                {p.nickname}
                {p.id === me && ' (tú)'}
              </span>
              {p.isHost ? (
                <span className="font-display text-[2cqh] text-gold text-stroke">Anfitrión</span>
              ) : (
                <span className={`font-display text-[2.2cqh] text-stroke ${p.ready ? 'text-leaf-bright' : 'text-white/60'}`}>
                  {p.ready ? '✓ Listo' : 'Esperando…'}
                </span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Controles */}
      <div className="flex flex-col items-center gap-[1.2cqh]">
        {isHost && (
          <div className="flex items-center gap-[1.5cqw]">
            <span className="font-display text-[2.4cqh] text-white text-stroke">Rondas:</span>
            {[3, 4, 6].map((n) => (
              <motion.button
                key={n}
                onClick={() => {
                  setRounds(n)
                  playSound('click')
                }}
                whileTap={{ scale: 0.9 }}
                className={`wood-3d flex h-[6cqh] w-[6cqh] items-center justify-center rounded-[1.2cqh] font-display text-[3cqh] text-white text-stroke ${
                  totalRounds === n ? 'ring-[0.5cqh] ring-gold' : 'opacity-70'
                }`}
              >
                {n}
              </motion.button>
            ))}
          </div>
        )}

        {isHost ? (
          <WoodButton size="lg" variant="leaf" glow onClick={startMatch} disabled={players.length < 1}>
            🚀 ¡EMPEZAR! ({players.length} {players.length === 1 ? 'jugador' : 'jugadores'})
          </WoodButton>
        ) : (
          <WoodButton
            size="lg"
            variant={myPlayer?.ready ? 'wood' : 'leaf'}
            glow={!myPlayer?.ready}
            onClick={() => {
              setReady(!myPlayer?.ready)
              playSound('click')
            }}
          >
            {myPlayer?.ready ? '✓ ¡Estoy listo!' : '¿Listo?'}
          </WoodButton>
        )}

        {isHost && !everyoneReady && players.length > 1 && (
          <span className="font-display text-[2cqh] text-white/70 text-stroke">Puedes empezar cuando quieras 😉</span>
        )}
      </div>
    </div>
  )
}
