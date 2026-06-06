import { useIsTouch, useIsPortrait } from '../hooks/useDevice'
import RotateHint from './RotateHint'

/**
 * Stage — Lienzo del juego SIEMPRE en 16:9 apaisado (los minijuegos se diseñan
 * para horizontal). Centrado y escalado al máximo que quepa, letterboxeado con
 * un degradado festivo. Usa `containerType: size` → las medidas internas
 * (`cqmin`/`cqw`) se escalan al lienzo. `dvh`/`dvw` evitan saltos por la barra
 * del navegador móvil.
 *
 * En móvil, el juego se juega en HORIZONTAL: si el teléfono está en vertical se
 * muestra el aviso "gira tu teléfono".
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
      </div>
      {showRotate && <RotateHint />}
    </div>
  )
}
