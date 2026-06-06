/**
 * catalog.js — Catálogo de la TIENDA: personajes (skins) y minijuegos.
 * Las monedas 🪙 y diamantes 💎 ganados se canjean aquí.
 */

// --- Personajes (skins) ---
// currency: 'coin' | 'diamond'. cost 0 = gratis (desbloqueado de inicio).
export const SKINS = [
  { id: 'lion', emoji: '🦁', name: 'León', cost: 0, currency: 'coin' },
  { id: 'elephant', emoji: '🐘', name: 'Elefante', cost: 0, currency: 'coin' },
  { id: 'giraffe', emoji: '🦒', name: 'Jirafa', cost: 0, currency: 'coin' },
  { id: 'monkey', emoji: '🐵', name: 'Mono', cost: 0, currency: 'coin' },
  { id: 'zebra', emoji: '🦓', name: 'Cebra', cost: 150, currency: 'coin' },
  { id: 'tiger', emoji: '🐯', name: 'Tigre', cost: 250, currency: 'coin' },
  { id: 'panda', emoji: '🐼', name: 'Panda', cost: 400, currency: 'coin' },
  { id: 'hippo', emoji: '🦛', name: 'Hipopótamo', cost: 600, currency: 'coin' },
  { id: 'fox', emoji: '🦊', name: 'Zorro', cost: 2, currency: 'diamond' },
  { id: 'koala', emoji: '🐨', name: 'Koala', cost: 3, currency: 'diamond' },
  { id: 'penguin', emoji: '🐧', name: 'Pingüino', cost: 3, currency: 'diamond' },
  { id: 'owl', emoji: '🦉', name: 'Búho', cost: 4, currency: 'diamond' },
  { id: 'unicorn', emoji: '🦄', name: 'Unicornio', cost: 6, currency: 'diamond' },
  { id: 'dragon', emoji: '🐲', name: 'Dragón', cost: 10, currency: 'diamond' },
]

// --- Minijuegos ---
// available: si ya está implementado (si no → "Próximamente", no comprable).
export const MINIGAMES = [
  {
    id: 'acomoda',
    emoji: '🧩',
    title: 'Acomoda la Barca',
    desc: 'Arrastra cada animal a su silueta antes de que acabe el tiempo.',
    tint: 'var(--color-leaf)',
    cost: 0,
    currency: 'diamond',
    available: true,
  },
  {
    id: 'ola',
    emoji: '🌊',
    title: 'Salta la Ola',
    desc: 'Salta en el momento justo para esquivar las olas.',
    tint: 'var(--color-ocean)',
    cost: 3,
    currency: 'diamond',
    available: true,
  },
  {
    id: 'sombra',
    emoji: '🔤',
    title: 'Sopa de la Sombra',
    desc: 'Encuentra el nombre del animal en la sopa de letras a tiempo.',
    tint: 'var(--color-grape)',
    cost: 5,
    currency: 'diamond',
    available: true,
  },
  {
    id: 'snake',
    emoji: '🐍',
    title: 'Serpiente del Arca',
    desc: 'Come animales con las flechas y crece. ¡No choques!',
    tint: 'var(--color-leaf-bright)',
    cost: 4,
    currency: 'diamond',
    available: true,
  },
  {
    id: 'bomba',
    emoji: '💣',
    title: 'Bombas del Arca',
    desc: 'Pon bombas, vuela cajas y elimina enemigos. ¡Estilo Bomberman!',
    tint: 'var(--color-coral)',
    cost: 500,
    currency: 'coin',
    available: true,
  },
]

// Desbloqueados de inicio
export const DEFAULT_SKINS = SKINS.filter((s) => s.cost === 0).map((s) => s.id)
export const DEFAULT_MINIGAMES = ['acomoda']

export const SKIN_BY_ID = Object.fromEntries(SKINS.map((s) => [s.id, s]))
export const MINIGAME_BY_ID = Object.fromEntries(MINIGAMES.map((m) => [m.id, m]))
