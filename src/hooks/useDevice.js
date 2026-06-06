import { useEffect, useState } from 'react'

/**
 * Hooks de dispositivo para la versión móvil.
 *  - useIsTouch: true en pantallas táctiles (no rompe escritorio).
 *  - useIsPortrait: true cuando la ventana está en vertical.
 */

function mq(query) {
  return typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query) : null
}

export function useIsTouch() {
  const detect = () =>
    typeof window !== 'undefined' &&
    ((mq('(pointer: coarse)')?.matches ?? false) || 'ontouchstart' in window || navigator.maxTouchPoints > 0)

  const [touch, setTouch] = useState(detect)

  useEffect(() => {
    const m = mq('(pointer: coarse)')
    if (!m) return
    const on = () => setTouch(detect())
    m.addEventListener?.('change', on)
    return () => m.removeEventListener?.('change', on)
  }, [])

  return touch
}

export function useIsPortrait() {
  const detect = () => (mq('(orientation: portrait)')?.matches ?? false)
  const [portrait, setPortrait] = useState(detect)

  useEffect(() => {
    const m = mq('(orientation: portrait)')
    if (!m) return
    const on = () => setPortrait(detect())
    m.addEventListener?.('change', on)
    return () => m.removeEventListener?.('change', on)
  }, [])

  return portrait
}
