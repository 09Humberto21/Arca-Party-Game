import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGame } from '../../context/GameContext'
import { useNet } from '../../context/NetContext'
import { goFullscreen } from '../../fullscreen'
import { useIsTouch } from '../../hooks/useDevice'
import PartyBackground from '../PartyBackground'
import WoodButton from '../WoodButton'
import { playSound } from '../../sound'

/**
 * OnlineMenu — Puerta de entrada al multijugador.
 * Elige apodo + skin (precargados del perfil) y o bien CREA una sala o se UNE
 * con un código de 4 letras. Al conectar, la app salta al flujo online.
 */

const SKINS = ['🦁', '🐘', '🦒', '🐵', '🦓', '🐯', '🐼', '🦛', '🦊', '🐶', '🐱', '🐸']

export default function OnlineMenu() {
  const { nickname: savedNick, skin: savedSkin, goTo } = useGame()
  const { create, join, status, error } = useNet()
  const isTouch = useIsTouch()

  const [nickname, setNickname] = useState(savedNick || '')
  const [skin, setSkin] = useState(savedSkin || '🦁')
  const [mode, setMode] = useState(null) // null | 'join'
  const [code, setCode] = useState('')
  const connecting = status === 'connecting'

  const nick = () => (nickname.trim() ? nickname.trim().slice(0, 16) : 'Invitado')

  const doCreate = async () => {
    if (isTouch) goFullscreen()
    playSound('start')
    try {
      await create({ nickname: nick(), skin, rounds: 4 })
    } catch {
      /* el error se muestra abajo */
    }
  }

  const doJoin = async () => {
    if (isTouch) goFullscreen()
    playSound('start')
    try {
      await join(code, { nickname: nick(), skin })
    } catch {
      /* el error se muestra abajo */
    }
  }

  return (
    <PartyBackground>
      <div className="relative flex h-full w-full flex-col items-center justify-center gap-[2cqh] px-[5cqw] py-[3cqh]">
        <motion.h1
          className="gold-text font-display text-[8cqh] text-stroke-lg"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 14 }}
        >
          🌐 JUGAR ONLINE
        </motion.h1>

        {/* Panel de madera */}
        <motion.div
          className="wood-3d flex w-full max-w-[70cqw] flex-col items-center gap-[1.6cqh] rounded-[2.4cqh] px-[4cqw] py-[2.6cqh]"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 16 }}
        >
          {/* Apodo */}
          <label className="flex w-full flex-col items-center gap-[0.6cqh]">
            <span className="font-display text-[2.6cqh] text-white text-stroke">Tu apodo</span>
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={16}
              placeholder="Invitado"
              className="parchment w-full rounded-[1.4cqh] px-[2cqw] py-[1cqh] text-center font-display text-[3cqh] text-wood-dark outline-none"
            />
          </label>

          {/* Selector de skin */}
          <div className="flex w-full flex-col items-center gap-[0.6cqh]">
            <span className="font-display text-[2.4cqh] text-white text-stroke">Tu personaje</span>
            <div className="flex max-w-full flex-wrap justify-center gap-[0.8cqw]">
              {SKINS.map((s) => (
                <motion.button
                  key={s}
                  onClick={() => {
                    setSkin(s)
                    playSound('click')
                  }}
                  whileTap={{ scale: 0.85 }}
                  className={`flex h-[6cqh] w-[6cqh] items-center justify-center rounded-full text-[3.6cqh] ${
                    skin === s ? 'ring-[0.5cqh] ring-gold' : 'opacity-70'
                  }`}
                  style={{ background: skin === s ? 'radial-gradient(circle at 50% 35%, #ffeebb, #e0a85a)' : 'rgba(0,0,0,0.2)' }}
                >
                  {s}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Acciones */}
          {mode !== 'join' ? (
            <div className="mt-[0.6cqh] flex flex-col items-center gap-[1.2cqh]">
              <WoodButton size="lg" variant="leaf" glow onClick={doCreate} disabled={connecting}>
                ➕ CREAR SALA
              </WoodButton>
              <WoodButton size="md" variant="ocean" onClick={() => setMode('join')} disabled={connecting}>
                🔑 UNIRSE CON CÓDIGO
              </WoodButton>
            </div>
          ) : (
            <div className="mt-[0.6cqh] flex flex-col items-center gap-[1.2cqh]">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4))}
                placeholder="ABCD"
                className="parchment w-[34cqw] rounded-[1.4cqh] px-[2cqw] py-[1cqh] text-center font-display text-[5cqh] tracking-[0.5em] text-wood-dark outline-none"
              />
              <div className="flex items-center gap-[1.5cqw]">
                <WoodButton size="md" variant="wood" onClick={() => setMode(null)} disabled={connecting}>
                  ← Volver
                </WoodButton>
                <WoodButton size="md" variant="leaf" glow onClick={doJoin} disabled={connecting || code.length !== 4}>
                  ✅ ENTRAR
                </WoodButton>
              </div>
            </div>
          )}

          {/* Estado / error */}
          {connecting && <p className="font-display text-[2.4cqh] text-white text-stroke">Conectando… 🛶</p>}
          {status === 'error' && (
            <p className="font-display text-[2.2cqh] text-coral text-stroke">{errorText(error)}</p>
          )}
        </motion.div>

        {/* Volver al menú */}
        <WoodButton size="sm" variant="wood" onClick={() => goTo('MENU')} disabled={connecting}>
          🏠 Menú principal
        </WoodButton>
      </div>
    </PartyBackground>
  )
}

function errorText(err) {
  if (err === 'room_not_found') return 'No existe una sala con ese código 😕'
  if (err === 'room_full') return 'Esa sala está llena 🙈'
  if (err === 'bad_code') return 'El código son 4 letras'
  return 'No se pudo conectar. ¿El servidor está encendido?'
}
