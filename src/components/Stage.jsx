import { useIsTouch } from '../hooks/useDevice'

/**
 * Stage — Lienzo del juego con proporción según el dispositivo:
 *   - Escritorio (ratón): 16:9 apaisado.
 *   - Móvil (táctil): 9:16 VERTICAL (formato app de celular).
 *
 * Siempre centrado y escalado al máximo que quepa, letterboxeado con un
 * degradado festivo. Usa `containerType: size` → todas las medidas internas en
 * `cqw`/`cqmin` se escalan al lienzo. `dvh`/`dvw` evitan saltos por la barra del
 * navegador móvil.
 *
 * Importante: los minijuegos y pantallas leen el lienzo vía container queries,
 * así que ESTE componente decide la forma; el contenido se adapta con clases
 * `portrait:` / `landscape:` (ver index.css).
 */
export default function Stage({ children }) {
  const isTouch = useIsTouch()
  const portrait = isTouch

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-gradient-to-br from-sky-top via-grape to-ocean-deep">
      <div
        className={`relative overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.55)] ${
          portrait ? 'aspect-[9/16] h-full' : 'aspect-[16/9] w-full'
        }`}
        style={
          portrait
            ? { containerType: 'size', maxHeight: '100dvh', maxWidth: '100dvw' }
            : { containerType: 'size', maxHeight: '100dvh', maxWidth: '177.78dvh' }
        }
      >
        {children}
      </div>
    </div>
  )
}
