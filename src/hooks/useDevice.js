import { useEffect, useState } from 'react'

/**
 * Hooks de dispositivo para la versión móvil.
 *  - useIsTouch: true en pantallas táctiles (no rompe escritorio).
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
