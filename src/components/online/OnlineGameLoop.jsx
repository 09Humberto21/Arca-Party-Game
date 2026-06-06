import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useGame } from '../../context/GameContext'
import { useNet, MINIGAME_META } from '../../context/NetContext'
import AcomodaBarca from '../AcomodaBarca'
import SaltaLaOla from '../SaltaLaOla'
import DesafioSombra from '../DesafioSombra'
import SerpienteArca from '../SerpienteArca'
import BombaArca from '../BombaArca'
import MemoriaArca from '../MemoriaArca'
import AtrapaFruta from '../AtrapaFruta'
import LiveScoreboard from './LiveScoreboard'

/**
 * OnlineGameLoop — Juega la ronda actual de la sala con el MISMO minijuego para
 * todos. Reusa los componentes existentes (cero cambios en su lógica): traduce
 * sus eventos (onCorrect/onWin/onLose) a un PUNTAJE de ronda que se envía al
 * servidor en vivo. Muestra el cronómetro de la ronda y el marcador en vivo.
 *
 * Puntuación:
 *   acierto      → +100
 *   gema ⭐      → +mitad de las monedas
 *   ¡completado! → +500 + bonus por tiempo restante (termina la ronda)
 *   derrota      → termina la ronda (conserva lo acumulado)
 */
const MINIGAMES = {
  acomoda: AcomodaBarca,
  ola: SaltaLaOla,
  sombra: DesafioSombra,
  snake: SerpienteArca,
  bomba: BombaArca,
  memoria: MemoriaArca,
  atrapa: AtrapaFruta,
}
const ROUND_MS = 30000

export default function OnlineGameLoop() {
  const { selectMinigame } = useGame()
  const { currentMinigame, round, roundEndsAt, sendScore, finishRound } = useNet()

  const [prepared, setPrepared] = useState(false)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const [remaining, setRemaining] = useState(ROUND_MS)

  const scoreRef = useRef(0)
  const doneRef = useRef(false)

  // Reinicia el contexto (nivel 1, sin pausa) para una ronda justa y monta limpio.
  useEffect(() => {
    selectMinigame(currentMinigame)
    scoreRef.current = 0
    doneRef.current = false
    setScore(0)
    setDone(false)
    setPrepared(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMinigame, round])

  // Cronómetro de la ronda (lo marca el servidor con roundEndsAt).
  useEffect(() => {
    if (!roundEndsAt) return
    const tick = () => {
      const left = Math.max(0, roundEndsAt - Date.now())
      setRemaining(left)
      if (left <= 0 && !doneRef.current) finish()
    }
    tick()
    const id = setInterval(tick, 100)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundEndsAt])

  const bump = (delta) => {
    if (doneRef.current) return
    scoreRef.current += delta
    setScore(scoreRef.current)
    sendScore(scoreRef.current)
  }

  const finish = () => {
    if (doneRef.current) return
    doneRef.current = true
    setDone(true)
    finishRound(scoreRef.current)
  }

  const Minigame = MINIGAMES[currentMinigame]
  if (!Minigame || !prepared) return null

  const secondsLeft = Math.ceil(remaining / 1000)
  const pct = Math.max(0, Math.min(100, (remaining / ROUND_MS) * 100))
  const meta = MINIGAME_META[currentMinigame] || { name: currentMinigame, emoji: '🎮' }

  return (
    <>
      {/* Barra superior: minijuego + puntaje + cronómetro */}
      <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-[2cqw] pt-[1cqmin]">
        <div className="wood-3d flex items-center gap-[1cqw] rounded-[1.4cqmin] px-[1.5cqw] py-[0.6cqmin]">
          <span className="text-[3cqmin]">{meta.emoji}</span>
          <span className="font-display text-[2.4cqmin] text-white text-stroke">{meta.name}</span>
        </div>
        <div className="wood-3d flex items-center gap-[0.8cqw] rounded-[1.4cqmin] px-[1.5cqw] py-[0.6cqmin]">
          <span className="text-[2.6cqmin]">⭐</span>
          <span className="font-display text-[3cqmin] text-leaf-bright text-stroke">{score}</span>
        </div>
      </div>

      {/* Cronómetro de la ronda */}
      <div className="absolute inset-x-[2cqw] top-[6.5cqmin] z-30 flex items-center gap-[1cqw]">
        <span className="font-display text-[2.6cqmin] text-white text-stroke">⏱️ {secondsLeft}s</span>
        <div className="wood-inset h-[1.6cqmin] flex-1 overflow-hidden rounded-full">
          <motion.div
            className="h-full rounded-full"
            style={{ width: `${pct}%`, background: pct < 25 ? 'var(--color-coral)' : 'var(--color-leaf-bright)' }}
          />
        </div>
      </div>

      {/* Marcador en vivo de los amigos */}
      <LiveScoreboard />

      {/* El minijuego, intacto. Sus eventos → puntaje de la ronda. */}
      <Minigame
        key={`${currentMinigame}-${round}`}
        onCorrect={() => bump(100)}
        onCoins={(amount) => bump(Math.round((amount || 0) / 2))}
        onWin={() => {
          bump(500 + secondsLeft * 20)
          finish()
        }}
        onLose={() => finish()}
      />

      {/* Esperando a los demás cuando ya terminaste */}
      {done && (
        <motion.div
          className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-[1.5cqmin]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="absolute inset-0 bg-black/55 backdrop-blur-[1px]" />
          <motion.div
            className="relative z-10 flex flex-col items-center gap-[1cqmin]"
            initial={{ scale: 0.7 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 16 }}
          >
            <span className="gold-text font-display text-[7cqmin] text-stroke-lg">¡Terminaste!</span>
            <span className="font-display text-[4cqmin] text-leaf-bright text-stroke">⭐ {score} puntos</span>
            <span className="anim-float font-display text-[3cqmin] text-white text-stroke">Esperando a los demás… 🛶</span>
          </motion.div>
        </motion.div>
      )}
    </>
  )
}
