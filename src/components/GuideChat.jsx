import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { playSound } from '../sound'

/**
 * GuideChat — Chat-guía dentro del juego. Un asistente (la paloma "Coo" 🕊️)
 * explica cómo funciona el juego mediante temas con botones y respuestas en
 * burbujas. Es 100% local (sin red): un guion de temas → respuesta + opciones.
 *
 * Botón flotante abajo-derecha (oculto durante el juego, se monta solo en
 * menús desde App). Estilo madera/pergamino, animado y con sonidos.
 */

// Guion: cada tema tiene el texto del guía y las opciones siguientes.
const ROOT_OPTIONS = [
  { id: 'como', label: '🎮 ¿Cómo se juega?' },
  { id: 'minijuegos', label: '🕹️ Los minijuegos' },
  { id: 'controles', label: '🎯 Controles' },
  { id: 'tienda', label: '🛒 La tienda' },
  { id: 'vidas', label: '❤️ Vidas y versículos' },
  { id: 'ganar', label: '🏆 ¿Cómo gano?' },
]

const BACK = { id: 'root', label: '↩️ Otra pregunta' }

const TOPICS = {
  como: {
    text: '¡Es fácil! Pulsa PLAY!, crea tu tripulante (nombre + animalito), elige un minijuego y, tras la cuenta atrás 3·2·1, ¡a jugar! Si ganas, subes de nivel (más difícil). Si pierdes, te animo con un versículo. 🌊',
    options: [{ id: 'minijuegos', label: '🕹️ Ver minijuegos' }, BACK],
  },
  minijuegos: {
    text: 'Hay 5 desafíos. ¿Cuál te explico? 👇',
    options: [
      { id: 'acomoda', label: '🧩 Acomoda la Barca' },
      { id: 'ola', label: '🌊 Salta la Ola' },
      { id: 'sombra', label: '🔤 Sopa de la Sombra' },
      { id: 'snake', label: '🐍 Serpiente del Arca' },
      { id: 'bomba', label: '💣 Bombas del Arca' },
      BACK,
    ],
  },
  acomoda: {
    text: '🧩 Acomoda la Barca: arrastra cada animal hasta su silueta correcta en la cubierta antes de que se acabe el tiempo. ¡Encaja los 4 (¡y más en niveles altos!) para ganar!',
    options: [{ id: 'minijuegos', label: '🕹️ Otro minijuego' }, BACK],
  },
  ola: {
    text: '🌊 Salta la Ola: toca la pantalla o pulsa ESPACIO para saltar las olas. ¡Cuidado! Los pájaros 🦅 vuelan a la altura del salto: con ellos NO saltes. Agarra poderes: 🪽 doble salto, 🛡️ escudo, ⭐ monedas.',
    options: [{ id: 'minijuegos', label: '🕹️ Otro minijuego' }, BACK],
  },
  sombra: {
    text: '🔤 Sopa de la Sombra: mira la silueta y su nombre. Arrastra una línea recta sobre las letras (horizontal, vertical o diagonal, en cualquier sentido) para marcar el nombre del animal antes del tiempo.',
    options: [{ id: 'minijuegos', label: '🕹️ Otro minijuego' }, BACK],
  },
  snake: {
    text: '🐍 Serpiente del Arca: muévete con las FLECHAS y come animales para crecer. ¡No choques con el borde ni contigo mismo! Come los que pide el objetivo para ganar.',
    options: [{ id: 'minijuegos', label: '🕹️ Otro minijuego' }, BACK],
  },
  bomba: {
    text: '💣 Bombas del Arca (¡estilo Bomberman!): FLECHAS para moverte, ESPACIO para poner bomba y X para detonar (con detonador). Vuela cajas 📦 para soltar power-ups (💣🔥👟🦵🎮🧱🛡️) y elimina a todos los enemigos. ¡No te atrape tu propia explosión!',
    options: [{ id: 'minijuegos', label: '🕹️ Otro minijuego' }, BACK],
  },
  controles: {
    text: '🎯 Controles: Acomoda y Sopa se juegan arrastrando con el ratón o el dedo. Salta la Ola: ESPACIO o tocar. Serpiente y Bombas: FLECHAS (o WASD); en Bombas, ESPACIO pone bomba y X detona. Arriba a la izquierda, 🔊 silencia/activa el sonido.',
    options: [BACK],
  },
  tienda: {
    text: '🛒 La tienda: ganas 🪙 monedas y 💎 diamantes jugando. Cánjealos por personajes (skins) y por desbloquear minijuegos. ¡Tu progreso se guarda solo! Entra desde el botón TIENDA del selector.',
    options: [BACK],
  },
  vidas: {
    text: '❤️ Tienes 1 vida por partida: un fallo y el arca se hunde... pero no te preocupes, ¡te regalo un versículo bíblico de ánimo para volver a intentarlo! 🕊️',
    options: [BACK],
  },
  ganar: {
    text: '🏆 Para el gran final debes ganar 3 rondas seguidas (¡sin perder!). Cada victoria sube el nivel y la dificultad. ¡Al lograrlo verás la pantalla de VICTORIA con arcoíris 🌈 y paloma 🕊️!',
    options: [BACK],
  },
}

const GREETING = '¡Hola! Soy Coo 🕊️, tu guía del Arca. ¿Qué te gustaría saber?'

export default function GuideChat() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([{ from: 'guide', text: GREETING }])
  const [options, setOptions] = useState(ROOT_OPTIONS)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, open])

  const choose = (opt) => {
    playSound('click')
    if (opt.id === 'root') {
      setMessages((m) => [...m, { from: 'user', text: opt.label }, { from: 'guide', text: GREETING }])
      setOptions(ROOT_OPTIONS)
      return
    }
    const topic = TOPICS[opt.id]
    if (!topic) return
    setMessages((m) => [...m, { from: 'user', text: opt.label }, { from: 'guide', text: topic.text }])
    setOptions(topic.options)
  }

  const reset = () => {
    setMessages([{ from: 'guide', text: GREETING }])
    setOptions(ROOT_OPTIONS)
  }

  return (
    <>
      {/* Botón flotante */}
      <motion.button
        onClick={() => {
          playSound('click')
          setOpen(true)
        }}
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.9 }}
        aria-label="Guía del juego"
        className="wood-3d gpu absolute bottom-[2cqh] right-[1.5cqw] z-[60] flex h-[7cqh] w-[7cqh] items-center justify-center rounded-full !border-[0.4cqh] text-[3.4cqh]"
      >
        🕊️
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute inset-0 z-[70] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button aria-label="Cerrar" onClick={() => setOpen(false)} className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" />

            {/* Ventana del chat */}
            <motion.div
              className="relative z-10 flex w-[72cqw] max-w-[120cqh] flex-col overflow-hidden rounded-[2.4cqh]"
              style={{ height: '78cqh' }}
              initial={{ scale: 0.7, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 240, damping: 20 }}
            >
              {/* Cabecera de madera */}
              <div className="wood-3d flex shrink-0 items-center gap-[1.5cqw] rounded-b-none px-[2.5cqw] py-[1.4cqh]">
                <span className="anim-float gpu text-[5cqh]">🕊️</span>
                <div className="flex flex-col leading-tight">
                  <span className="gold-text font-display text-[3.2cqh]">Coo, tu guía</span>
                  <span className="font-body text-[1.8cqh] font-bold text-[#fff0d2]">Te explico el Arca Party</span>
                </div>
                <div className="ml-auto flex items-center gap-[0.8cqw]">
                  <button onClick={reset} aria-label="Reiniciar" className="wood-inset flex h-[5cqh] w-[5cqh] items-center justify-center rounded-full text-[2.4cqh] text-white">
                    🔄
                  </button>
                  <button onClick={() => setOpen(false)} aria-label="Cerrar" className="wood-inset flex h-[5cqh] w-[5cqh] items-center justify-center rounded-full text-[2.4cqh] text-white">
                    ✕
                  </button>
                </div>
              </div>

              {/* Mensajes (pergamino) */}
              <div ref={scrollRef} className="parchment min-h-0 flex-1 overflow-y-auto px-[3cqw] py-[2cqh]">
                <div className="flex flex-col gap-[1.4cqh]">
                  {messages.map((msg, i) => (
                    <Bubble key={i} from={msg.from} text={msg.text} />
                  ))}
                </div>
              </div>

              {/* Opciones (respuestas rápidas) */}
              <div className="wood-3d flex shrink-0 flex-wrap justify-center gap-[1cqw] rounded-t-none px-[2.5cqw] py-[1.6cqh]">
                {options.map((opt) => (
                  <motion.button
                    key={opt.id}
                    onClick={() => choose(opt)}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.94 }}
                    className="gpu rounded-[1.6cqh] border-[0.35cqh] border-white/70 bg-gradient-to-b from-gold to-gold-deep px-[2cqw] py-[0.9cqh] font-display text-[2.2cqh] text-wood-dark text-stroke"
                    style={{ boxShadow: '0 4px 0 var(--color-gold-deep)' }}
                  >
                    {opt.label}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function Bubble({ from, text }) {
  const isGuide = from === 'guide'
  return (
    <motion.div
      className={`flex ${isGuide ? 'justify-start' : 'justify-end'}`}
      initial={{ opacity: 0, y: 12, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div
        className="max-w-[78%] rounded-[1.8cqh] px-[2cqw] py-[1.2cqh] font-body text-[2.2cqh] font-semibold leading-snug"
        style={
          isGuide
            ? { background: 'linear-gradient(to bottom, #fffdf3, #f3e3b8)', color: '#5b3d12', border: '0.3cqh solid #cda861', borderBottomLeftRadius: '0.4cqh' }
            : { background: 'linear-gradient(to bottom, var(--color-ocean-light), var(--color-ocean))', color: '#fff', border: '0.3cqh solid var(--color-ocean-deep)', borderBottomRightRadius: '0.4cqh' }
        }
      >
        {isGuide && <span className="mr-[0.6cqw]">🕊️</span>}
        {text}
      </div>
    </motion.div>
  )
}
