import { useIsTouch, useIsPortrait } from '../hooks/useDevice'
import RotateHint from './RotateHint'

/**
 * Stage — Escenario de juego en formato 16:9 a pantalla completa.
 *
 * Mantiene SIEMPRE la proporción 16:9 (como una consola/Mario Party),
 * centrado y escalado al máximo que quepa en la ventana. Las "barras"
 * sobrantes se pintan con un degradado festivo.
 *
 * La unidad interna es `cqw`/`cqh` (container query). En móvil usa `dvh`/`dvw`
 * (evita saltos por la barra del navegador) y, en vertical, muestra el aviso
 * "gira tu teléfono" (los tableros son apaisados).
 */
export default function Stage({ children }) {
  const isTouch = useIsTouch()
  const isPortrait = useIsPortrait()
  const showRotate = isTouch && isPortrait

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-gradient-to-br from-sky-top via-grape to-ocean-deep">
      <div
        className="relative aspect-[16/9] w-full overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.55)]"
        style={{ containerType: 'size', maxHeight: '100dvh', maxWidth: '177.78dvh' }}
      >
        {children}
        {showRotate && <RotateHint />}
      </div>
    </div>
  )
}
