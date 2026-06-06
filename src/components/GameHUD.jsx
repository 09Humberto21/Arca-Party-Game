import { motion } from 'framer-motion'
import { useGame } from '../context/GameContext'

/**
 * GameHUD — Barra superior de MADERA TALLADA 3D (estilo Mario Party).
 *
 *  [ Nivel ]  [=== barra verde de progreso + ⭐ ===]  [🪙 monedas] [💎 diamantes] [⏸️]
 *
 * Todo escala con el escenario 16:9 (unidades cqmin/cqw). Las texturas de
 * madera/relieve son estáticas (.wood-3d / .wood-inset) → no afectan fps.
 */
export default function GameHUD() {
  const { level, lives, maxLives, coins, diamonds, progress, progressGoal, paused, togglePause } = useGame()
  const pct = Math.round((progress / progressGoal) * 100)

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-30 px-[2.5cqw] pt-[2cqmin]">
      <div className="wood-3d pointer-events-auto mx-auto flex max-w-[150cqmin] items-center gap-[2cqw] rounded-[3cqmin] px-[2.5cqw] py-[1.6cqmin]">
        {/* ---- Medallón de Nivel ---- */}
        <div className="relative flex shrink-0 flex-col items-center">
          <div className="wood-inset relative flex h-[8cqmin] w-[8cqmin] items-center justify-center rounded-full">
            <span className="anim-spin-slow gpu absolute text-[5.5cqmin] opacity-90 drop-shadow">⭐</span>
            <motion.span
              key={level}
              initial={{ scale: 1.6, rotate: -12 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 12 }}
              className="relative font-display text-[3.4cqmin] text-wood-edge"
              style={{ textShadow: '0 1px 0 rgba(255,240,200,0.6)' }}
            >
              {level}
            </motion.span>
          </div>
          <span className="mt-[0.3cqmin] font-display text-[1.5cqmin] tracking-widest text-wood-edge/90">
            NIVEL
          </span>
        </div>

        {/* ---- Barra de progreso verde con estrella dorada ---- */}
        <div className="flex min-w-0 flex-1 flex-col gap-[0.6cqmin]">
          <div className="flex items-center justify-between px-[0.5cqw]">
            <span className="font-display text-[1.8cqmin] uppercase tracking-wider text-[#fff3d0] text-stroke">
              Progreso
            </span>
            <span className="font-display text-[1.8cqmin] text-[#fff3d0] text-stroke">{pct}%</span>
          </div>

          <div className="wood-inset relative h-[3.4cqmin] w-full rounded-full">
            {/* Relleno verde brillante */}
            <motion.div
              className="gloss relative h-full overflow-hidden rounded-full"
              style={{
                background:
                  'linear-gradient(to bottom, #69ffae, var(--color-leaf-bright) 55%, #00b85a)',
                boxShadow:
                  'inset 0 0.4cqmin 0 rgba(255,255,255,0.55), 0 0 1.4cqmin rgba(0,230,118,0.7)',
              }}
              initial={false}
              animate={{ width: `${Math.max(pct, 6)}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 18 }}
            >
              {/* rayas diagonales animadas dentro del relleno */}
              <div
                className="absolute inset-0 opacity-25"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(45deg, #fff 0 0.8cqmin, transparent 0.8cqmin 1.8cqmin)',
                }}
              />
            </motion.div>

            {/* Estrella dorada al final (meta del nivel) */}
            <motion.div
              className="absolute top-1/2 right-[-1.2cqmin] -translate-y-1/2"
              animate={{ scale: pct >= 100 ? [1, 1.35, 1] : [1, 1.12, 1], rotate: [-8, 8, -8] }}
              transition={{ duration: pct >= 100 ? 0.6 : 2.4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <span className="text-[5.5cqmin] drop-shadow-[0_0.4cqmin_0_rgba(120,70,10,0.5)]">⭐</span>
            </motion.div>
          </div>
        </div>

        {/* ---- Vidas ---- */}
        <div className="wood-inset flex shrink-0 items-center gap-[0.3cqw] rounded-full px-[1.1cqw] py-[0.8cqmin]">
          {Array.from({ length: maxLives }).map((_, i) => {
            const alive = i < lives
            return (
              <motion.span
                key={i}
                className="text-[2.7cqmin]"
                animate={{ scale: alive ? [1, 1.2, 1] : 0.85, opacity: alive ? 1 : 0.35 }}
                transition={{ duration: alive ? 1.4 : 0.3, repeat: alive ? Infinity : 0, repeatDelay: 0.8, delay: i * 0.08 }}
              >
                {alive ? '❤️' : '🤍'}
              </motion.span>
            )
          })}
        </div>

        {/* ---- Contadores: Monedas / Diamantes ---- */}
        <Counter
          emoji="🪙"
          value={coins}
          color="var(--color-coin)"
          glow="rgba(251,192,45,0.8)"
        />
        <Counter
          emoji="💎"
          value={diamonds}
          color="var(--color-diamond)"
          glow="rgba(3,169,244,0.85)"
        />

        {/* ---- Botón de pausa de madera ---- */}
        <motion.button
          onClick={togglePause}
          whileHover={{ scale: 1.1, rotate: 3 }}
          whileTap={{ scale: 0.88 }}
          aria-label={paused ? 'Reanudar' : 'Pausar'}
          className="wood-3d gpu flex h-[8cqmin] w-[8cqmin] shrink-0 items-center justify-center rounded-full !border-[0.5cqmin] text-[3.6cqmin]"
        >
          {paused ? '▶️' : '⏸️'}
        </motion.button>
      </div>
    </header>
  )
}

/** Contador de recurso (moneda/diamante) en marco de madera hundida. */
function Counter({ emoji, value, color, glow }) {
  return (
    <div className="wood-inset flex shrink-0 items-center gap-[0.8cqw] rounded-full px-[1.4cqw] py-[0.8cqmin]">
      <motion.span
        key={`${emoji}-${value}`}
        initial={{ scale: 1.5, rotate: -15 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 11 }}
        className="text-[4cqmin]"
        style={{ filter: `drop-shadow(0 0 0.8cqmin ${glow})` }}
      >
        {emoji}
      </motion.span>
      <span
        className="font-display text-[3.2cqmin] tabular-nums"
        style={{ color, textShadow: '0 0.25cqmin 0 rgba(0,0,0,0.55)' }}
      >
        {value.toLocaleString('es')}
      </span>
    </div>
  )
}
