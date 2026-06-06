/**
 * Stage — Escenario de juego en formato 16:9, responsivo.
 *
 * Mantiene SIEMPRE la proporción 16:9 internamente (así el cálculo en
 * `cqh`/`cqw` de los minijuegos no se rompe), escalado al máximo que quepa,
 * centrado. Usa `dvh`/`dvw` para no saltar con la barra del navegador móvil.
 * Se juega tanto en horizontal como en VERTICAL (en vertical el área queda
 * centrada y los controles táctiles se dibujan abajo, a nivel de viewport).
 */
export default function Stage({ children }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-gradient-to-br from-sky-top via-grape to-ocean-deep">
      <div
        className="relative aspect-[16/9] w-full overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.55)]"
        style={{ containerType: 'size', maxHeight: '100dvh', maxWidth: '177.78dvh' }}
      >
        {children}
      </div>
    </div>
  )
}
