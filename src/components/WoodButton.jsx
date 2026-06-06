import { motion } from 'framer-motion'
import { playSound } from '../sound'

/**
 * WoodButton — Botón juguetón reutilizable, estilo madera/oro brillante.
 * Feedback táctil obligatorio del plan: whileTap scale 0.9.
 *
 * Optimizado: el brillo "sheen" usa solo transform/opacity (clase CSS),
 * sin blur ni box-shadow animados → no causa repaints por frame.
 *
 * props:
 *  - variant: 'gold' | 'wood' | 'ocean' | 'leaf' (default 'gold')
 *  - size: 'sm' | 'md' | 'lg' | 'xl'
 *  - glow: añade resplandor estático alrededor
 */
const VARIANTS = {
  gold: {
    base: 'bg-gradient-to-b from-gold to-gold-deep text-wood-dark',
    shadow: '0 7px 0 var(--color-gold-deep), 0 14px 22px rgba(0,0,0,0.3)',
    glow: '0 0 28px rgba(255,215,0,0.7)',
  },
  wood: {
    base: 'bg-gradient-to-b from-wood-light to-wood text-white',
    shadow: '0 7px 0 var(--color-wood-dark), 0 14px 22px rgba(0,0,0,0.3)',
    glow: '0 0 28px rgba(243,156,18,0.6)',
  },
  ocean: {
    base: 'bg-gradient-to-b from-ocean-light to-ocean text-white',
    shadow: '0 7px 0 var(--color-ocean-deep), 0 14px 22px rgba(0,0,0,0.3)',
    glow: '0 0 28px rgba(0,168,255,0.6)',
  },
  leaf: {
    base: 'bg-gradient-to-b from-leaf to-[#1fae6b] text-white',
    shadow: '0 7px 0 #178a55, 0 14px 22px rgba(0,0,0,0.3)',
    glow: '0 0 28px rgba(56,224,138,0.6)',
  },
}

const SIZES = {
  sm: 'text-[2.4cqh] px-[2.2cqw] py-[1cqh] rounded-[1.4cqh] gap-[0.6cqw]',
  md: 'text-[3.2cqh] px-[3cqw] py-[1.6cqh] rounded-[2cqh] gap-[0.8cqw]',
  lg: 'text-[4.4cqh] px-[4cqw] py-[2cqh] rounded-[2.4cqh] gap-[1cqw]',
  xl: 'text-[6cqh] px-[5.5cqw] py-[2.6cqh] rounded-[3cqh] gap-[1.2cqw]',
}

export default function WoodButton({
  children,
  onClick,
  variant = 'gold',
  size = 'md',
  glow = false,
  className = '',
  ...rest
}) {
  const v = VARIANTS[variant] ?? VARIANTS.gold

  return (
    <motion.button
      onClick={(e) => {
        playSound('click')
        onClick?.(e)
      }}
      whileHover={{ scale: 1.07, y: -3 }}
      whileTap={{ scale: 0.9, y: 3 }}
      transition={{ type: 'spring', stiffness: 600, damping: 17 }}
      style={{ boxShadow: glow ? `${v.shadow}, ${v.glow}` : v.shadow }}
      className={`gpu font-display ${v.base} ${SIZES[size]}
        relative inline-flex items-center justify-center overflow-hidden
        whitespace-nowrap tracking-wide text-stroke
        border-[0.4cqh] border-white/70 ${className}`}
      {...rest}
    >
      {/* Sheen que cruza el botón — solo transform/opacity */}
      <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
        <span
          className="absolute inset-y-0 left-0 w-1/4 bg-white/55"
          style={{ animation: 'sheen-x 3.2s ease-in-out infinite' }}
        />
      </span>
      {/* Brillo superior fijo (glossy) */}
      <span className="pointer-events-none absolute inset-x-1 top-1 h-1/3 rounded-full bg-white/30" />
      <span className="relative z-10 inline-flex items-center justify-center gap-[inherit]">
        {children}
      </span>
    </motion.button>
  )
}
