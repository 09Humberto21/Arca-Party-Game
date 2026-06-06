/**
 * fullscreen.js — Pantalla completa inmersiva (móvil). Sin bloqueo de
 * orientación: el juego se disfruta en VERTICAL en el celular.
 * Debe llamarse desde un gesto del usuario (p. ej. el botón PLAY).
 * En try/catch: iOS Safari no soporta la Fullscreen API.
 */
export async function goFullscreen() {
  try {
    const el = document.documentElement
    if (el.requestFullscreen && !document.fullscreenElement) await el.requestFullscreen()
  } catch {
    /* no soportado: se ignora */
  }
}
