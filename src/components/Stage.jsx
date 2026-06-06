/**
 * Stage — Escenario del juego.
 *
 * Dos modos:
 *  - 16:9 (por defecto): para los MINIJUEGOS, cuyos tableros se calculan en
 *    `cqh`/`cqw` asumiendo proporción apaisada. Se centra y se letterboxea.
 *  - `fill`: para las PANTALLAS DE UI (menús, lobby, resultados, podio). Llena
 *    TODA la pantalla y aplica `containerType: size` sobre el viewport completo,
 *    así `cqh`/`cqw` se miden contra la pantalla real → se ve grande también en
 *    un celular en vertical (no queda como una franja pequeña 16:9).
 *
 * Usa `dvh`/`dvw` para no saltar con la barra del navegador móvil.
 */
export default function Stage({ children, fill = false }) {
  if (fill) {
    return (
      <div className="fixed inset-0 overflow-hidden bg-gradient-to-br from-sky-top via-grape to-ocean-deep">
        <div
          className="relative overflow-hidden"
          style={{ containerType: 'size', width: '100dvw', height: '100dvh' }}
        >
          {children}
        </div>
      </div>
    )
  }

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
