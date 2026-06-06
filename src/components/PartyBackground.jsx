/**
 * PartyBackground — Fondo festivo estilo Mario Party (100% CSS/GPU).
 *
 * prop `lite`: versión LIGERA para usar DURANTE los minijuegos. Mantiene el
 * ambiente (cielo, sol, mar) pero apaga las animaciones costosas (confeti,
 * banderines, globos, destellos, rotación de rayos) para que el juego corra
 * a 60fps sin competir por el hilo principal.
 *
 * Todo se anima con transform/opacity. Arrays constantes a nivel de módulo.
 */

const SUNBURST = '#ffe9a8'

// Confeti reducido (16) para menos capas/repintados.
const CONFETTI = Array.from({ length: 16 }, (_, i) => {
  const colors = ['#ff5e7e', '#ffd700', '#38e08a', '#2be6d6', '#b06bff', '#ff9f43']
  return {
    color: colors[i % colors.length],
    left: (i * 61) % 100,
    drift: ((i * 53) % 80) - 40,
    dur: 4 + ((i * 7) % 30) / 10,
    delay: ((i * 13) % 50) / 10,
    round: i % 3 === 0,
  }
})

const BALLOONS = [
  { emoji: '🎈', left: 6, drift: 30, dur: 14, delay: 0 },
  { emoji: '🎈', left: 74, drift: 25, dur: 15, delay: 2 },
  { emoji: '🎈', left: 90, drift: -30, dur: 18, delay: 6 },
]

const TWINKLES = Array.from({ length: 8 }, (_, i) => ({
  left: (i * 53 + 7) % 100,
  top: (i * 29 + 5) % 50,
  size: 9 + ((i * 11) % 12),
  dur: 1.8 + ((i * 5) % 20) / 10,
  delay: ((i * 9) % 24) / 10,
}))

const BUNTING = ['#ff5e7e', '#ffd700', '#38e08a', '#2be6d6', '#b06bff', '#ff9f43']

export default function PartyBackground({ children, lite = false }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-sky-top via-sky-mid to-sky-low">
      {/* Rayos de sol (giran solo en modo completo) */}
      <div
        aria-hidden
        className={`${lite ? '' : 'anim-spin-slow'} gpu absolute left-1/2 top-[26%] h-[140cqh] w-[140cqh] -translate-x-1/2 -translate-y-1/2 opacity-40`}
        style={{
          background: `repeating-conic-gradient(from 0deg, ${SUNBURST} 0deg 9deg, transparent 9deg 18deg)`,
          maskImage: 'radial-gradient(circle, #000 30%, transparent 68%)',
          WebkitMaskImage: 'radial-gradient(circle, #000 30%, transparent 68%)',
        }}
      />
      {/* Halo del sol (estático) */}
      <div
        aria-hidden
        className="absolute left-1/2 top-[26%] h-[42cqh] w-[42cqh] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70"
        style={{ background: 'radial-gradient(circle, rgba(255,236,168,0.95) 0%, rgba(255,210,120,0.5) 45%, transparent 70%)' }}
      />

      {/* Capas animadas SOLO en modo completo (menús) */}
      {!lite && (
        <>
          {/* Destellos */}
          {TWINKLES.map((t, i) => (
            <span
              key={`tw-${i}`}
              aria-hidden
              className="anim-twinkle absolute rounded-full bg-white"
              style={{ left: `${t.left}%`, top: `${t.top}%`, width: t.size, height: t.size, animationDuration: `${t.dur}s`, animationDelay: `${t.delay}s`, boxShadow: '0 0 8px rgba(255,255,255,0.9)' }}
            />
          ))}

          {/* Banderines */}
          <div aria-hidden className="absolute inset-x-0 top-0 z-10">
            <div className="anim-sway flex justify-center gap-[0.6cqw] pt-[1cqh]">
              {Array.from({ length: 16 }).map((_, i) => (
                <span
                  key={`flag-${i}`}
                  className="block h-[3.4cqh] w-[2.4cqw]"
                  style={{ background: BUNTING[i % BUNTING.length], clipPath: 'polygon(0 0, 100% 0, 50% 100%)', animationDelay: `${i * 0.05}s` }}
                />
              ))}
            </div>
            <div className="absolute top-[1cqh] h-[2px] w-full bg-black/25" />
          </div>

          {/* Globos */}
          {BALLOONS.map((b, i) => (
            <span
              key={`bl-${i}`}
              aria-hidden
              className="gpu absolute bottom-0 text-[6cqh]"
              style={{ left: `${b.left}%`, ['--drift']: `${b.drift}px`, animation: `balloon-rise ${b.dur}s linear ${b.delay}s infinite` }}
            >
              {b.emoji}
            </span>
          ))}

          {/* Confeti */}
          {CONFETTI.map((c, i) => (
            <span
              key={`cf-${i}`}
              aria-hidden
              className="absolute top-0"
              style={{ left: `${c.left}%`, width: '0.9cqw', height: '1.4cqh', background: c.color, borderRadius: c.round ? '50%' : '2px', ['--drift']: `${c.drift}px`, animation: `confetti-fall ${c.dur}s linear ${c.delay}s infinite` }}
            />
          ))}
        </>
      )}

      {/* Mar (olas se mueven solo en modo completo) */}
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-[34cqh]">
        <div className="absolute inset-0 bg-gradient-to-b from-ocean-light to-ocean-deep" />
        <WaveLayer color="rgba(0,100,177,0.45)" dur={11} bottom={'8cqh'} height={'14cqh'} animate={!lite} />
        <WaveLayer color="rgba(86,204,242,0.6)" dur={8} bottom={'4cqh'} height={'13cqh'} animate={!lite} />
        <WaveLayer color="var(--color-foam)" dur={6} bottom={'0'} height={'10cqh'} animate={!lite} />
        <div className="absolute inset-x-0 top-0 h-[2px] bg-white/60" />
      </div>

      <div className="relative z-20 h-full w-full">{children}</div>
    </div>
  )
}

function WaveLayer({ color, dur, bottom, height, animate = true }) {
  return (
    <div
      className={animate ? 'gpu absolute left-0 w-[200%]' : 'absolute left-0 w-[200%]'}
      style={{ bottom, height, animation: animate ? `wave-x ${dur}s linear infinite` : 'none' }}
    >
      <svg className="h-full w-full" viewBox="0 0 1440 120" preserveAspectRatio="none" fill={color}>
        <path d="M0,50 C120,90 240,10 360,50 C480,90 600,10 720,50 C840,90 960,10 1080,50 C1200,90 1320,10 1440,50 L1440,120 L0,120 Z" />
      </svg>
    </div>
  )
}
