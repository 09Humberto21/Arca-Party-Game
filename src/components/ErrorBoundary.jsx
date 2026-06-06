import { Component } from 'react'

/**
 * ErrorBoundary — Red de seguridad: si algún componente lanza un error en
 * runtime, en vez de dejar la pantalla en blanco muestra el mensaje (útil
 * para diagnosticar) y un botón para recargar.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('💥 ErrorBoundary capturó un error:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-[#1b2540] p-8 text-center text-white">
          <div className="text-6xl">🛟</div>
          <h2 className="font-display text-3xl">¡Ups! Algo se mojó en el arca</h2>
          <pre className="max-w-[80%] overflow-auto rounded-lg bg-black/40 p-4 text-left text-sm text-coral">
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="rounded-xl bg-gold px-6 py-3 font-display text-xl text-wood-dark"
          >
            🔄 Recargar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
