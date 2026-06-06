/**
 * fullscreen.js — Pantalla completa + bloqueo de orientación (móvil).
 * Debe llamarse desde un gesto del usuario (p. ej. el botón PLAY).
 * Todo va en try/catch: iOS Safari no soporta Fullscreen API ni orientation.lock.
 */
export async function goFullscreenLandscape() {
  try {
    const el = document.documentElement
    if (el.requestFullscreen && !document.fullscreenElement) await el.requestFullscreen()
  } catch {
    /* no soportado: se ignora */
  }
  try {
    if (screen.orientation?.lock) await screen.orientation.lock('landscape')
  } catch {
    /* no soportado: se ignora */
  }
}
