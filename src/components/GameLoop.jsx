import { useEffect, useState } from 'react'
import { useGame } from '../context/GameContext'
import Countdown from './Countdown'
import AcomodaBarca from './AcomodaBarca'
import SaltaLaOla from './SaltaLaOla'
import DesafioSombra from './DesafioSombra'
import SerpienteArca from './SerpienteArca'
import BombaArca from './BombaArca'

/**
 * GameLoop — Orquestador de minijuegos (MASTER_PLAN).
 * Antes de montar (y arrancar) el minijuego muestra una cuenta atrás 3-2-1,
 * para que el jugador esté listo. Conecta los resultados con el estado global.
 */
const MINIGAMES = {
  acomoda: AcomodaBarca,
  ola: SaltaLaOla,
  sombra: DesafioSombra,
  snake: SerpienteArca,
  bomba: BombaArca,
}

export default function GameLoop() {
  const { currentMinigame, addCoins, addDiamonds, addProgress, nextLevel, loseLife } = useGame()
  const [ready, setReady] = useState(false)

  // Reinicia la cuenta atrás cada vez que se entra a un minijuego
  useEffect(() => {
    setReady(false)
  }, [currentMinigame])

  const Minigame = MINIGAMES[currentMinigame]
  if (!Minigame) return null

  return (
    <>
      {ready && (
        <Minigame
          // Acierto individual: +monedas y avanza la barra de progreso
          onCorrect={() => {
            addCoins(50)
            addProgress(25)
          }}
          // Nivel superado: bonus de diamante y SUBE de nivel (más reto)
          onWin={() => {
            addDiamonds(1)
            nextLevel()
          }}
          // Sin tiempo / golpe: pierde una vida (a 0 → DerrotaScreen con versículo)
          onLose={() => loseLife()}
          // Power-up ⭐ de "Salta la Ola": monedas bonus
          onCoins={(amount) => addCoins(amount)}
        />
      )}
      {!ready && <Countdown onDone={() => setReady(true)} />}
    </>
  )
}
