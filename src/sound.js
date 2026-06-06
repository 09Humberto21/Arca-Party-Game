/**
 * sound.js — Motor de efectos de sonido SINTETIZADOS (Web Audio API).
 * No usa archivos: genera los tonos en tiempo real → cero peso.
 *
 * El AudioContext se crea/reanuda en el primer gesto del usuario (política
 * de autoplay del navegador), cosa que ocurre al primer clic/tecla.
 *
 * Uso: import { playSound } from '../sound'; playSound('click')
 */

let ctx = null
let enabled = true
try {
  enabled = localStorage.getItem('arca_sound') !== 'off'
} catch {
  enabled = true
}

function getCtx() {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

/** Un "blip": oscilador con envolvente suave (evita clicks). */
function blip(ac, t0, { freq = 440, freq2, type = 'sine', dur = 0.12, vol = 0.2 }) {
  const osc = ac.createOscillator()
  const g = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (freq2) osc.frequency.exponentialRampToValueAtTime(Math.max(1, freq2), t0 + dur)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(g).connect(ac.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.03)
}

function seq(ac, t0, notes, base = {}) {
  notes.forEach((n, i) => blip(ac, t0 + (n.t ?? i * 0.08), { ...base, ...n }))
}

const RECIPES = {
  click: (ac, t) => blip(ac, t, { freq: 520, freq2: 380, type: 'square', dur: 0.06, vol: 0.12 }),
  hover: (ac, t) => blip(ac, t, { freq: 760, type: 'sine', dur: 0.04, vol: 0.05 }),
  navigate: (ac, t) => blip(ac, t, { freq: 480, freq2: 660, type: 'sine', dur: 0.09, vol: 0.1 }),
  jump: (ac, t) => blip(ac, t, { freq: 300, freq2: 780, type: 'sine', dur: 0.18, vol: 0.16 }),
  coin: (ac, t) => seq(ac, t, [{ freq: 880, t: 0 }, { freq: 1320, t: 0.07 }], { type: 'square', dur: 0.08, vol: 0.12 }),
  eat: (ac, t) => blip(ac, t, { freq: 520, freq2: 920, type: 'square', dur: 0.09, vol: 0.14 }),
  place: (ac, t) => blip(ac, t, { freq: 380, freq2: 620, type: 'triangle', dur: 0.1, vol: 0.16 }),
  power: (ac, t) => seq(ac, t, [{ freq: 523 }, { freq: 659 }, { freq: 784 }, { freq: 1046 }], { type: 'triangle', dur: 0.1, vol: 0.12, t: undefined }),
  correct: (ac, t) => seq(ac, t, [{ freq: 659 }, { freq: 988 }], { type: 'square', dur: 0.1, vol: 0.14 }),
  win: (ac, t) => seq(ac, t, [{ freq: 523, t: 0 }, { freq: 659, t: 0.1 }, { freq: 784, t: 0.2 }, { freq: 1046, t: 0.3 }, { freq: 1318, t: 0.42 }], { type: 'square', dur: 0.16, vol: 0.14 }),
  lose: (ac, t) => seq(ac, t, [{ freq: 440, freq2: 360, t: 0 }, { freq: 330, freq2: 270, t: 0.14 }, { freq: 220, freq2: 160, t: 0.3 }], { type: 'sawtooth', dur: 0.22, vol: 0.14 }),
  error: (ac, t) => blip(ac, t, { freq: 200, freq2: 120, type: 'sawtooth', dur: 0.18, vol: 0.14 }),
  buy: (ac, t) => seq(ac, t, [{ freq: 784 }, { freq: 1046 }, { freq: 1318 }], { type: 'square', dur: 0.1, vol: 0.13 }),
  start: (ac, t) => seq(ac, t, [{ freq: 392, t: 0 }, { freq: 587, t: 0.08 }, { freq: 784, t: 0.16 }], { type: 'triangle', dur: 0.12, vol: 0.13 }),
}

export function playSound(name) {
  if (!enabled) return
  const ac = getCtx()
  if (!ac) return
  const fn = RECIPES[name]
  if (!fn) return
  try {
    fn(ac, ac.currentTime + 0.001)
  } catch {
    /* ignora errores de audio */
  }
}

export function isSoundOn() {
  return enabled
}

export function toggleSound() {
  enabled = !enabled
  try {
    localStorage.setItem('arca_sound', enabled ? 'on' : 'off')
  } catch {
    /* ignore */
  }
  if (enabled) playSound('click')
  return enabled
}
