/**
 * Stage — Escenario de juego en formato 16:9 a pantalla completa.
 *
 * Mantiene SIEMPRE la proporción 16:9 (como una consola/Mario Party),
 * centrado y escalado al máximo que quepa en la ventana. Las "barras"
 * sobrantes se pintan con un degradado festivo para que se sienta
 * extendido en toda la pantalla, sin importar el monitor.
 *
 * La unidad de medida interna es `cqw`/`cqh` vía container query, así
 * los tamaños (fuentes, elementos) escalan con el escenario y todo se
 * ve idéntico en cualquier resolución.
 */
export default function Stage({ children }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-gradient-to-br from-sky-top via-grape to-ocean-deep">
      <div
        className="relative aspect-[16/9] w-full max-h-screen max-w-[177.78vh] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.55)]"
        style={{ containerType: 'size' }}
      >
        {children}
      </div>
    </div>
  )
}
