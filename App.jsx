import React, { useRef, useEffect, useState } from 'react'
import { useRoe } from '../state/RoeContext.jsx'

// Cidade 3D persistente: o iframe carrega UMA vez (em fundo, pouco após o arranque)
// e mantém-se vivo entre aberturas — abrir passa a ser instantâneo e a grua
// dispara logo. A sincronização é incremental: só as obras novas são enviadas.
export default function Cidade3D({ visible, onClose }) {
  const { feitas } = useRoe()
  const iframeRef = useRef(null)
  const enviadas = useRef(0)      // nº de obras já refletidas na cidade
  const aquecida = useRef(false)  // shaders compilados em fundo (1x por carregamento)
  const [src, setSrc] = useState(null)

  // pré-carregar em fundo, sem atrasar o arranque da app
  useEffect(() => {
    const t = setTimeout(() => setSrc('./cidade-v41.html'), 2500)
    return () => clearTimeout(t)
  }, [])
  // se o utilizador abrir antes do pré-carregamento, carrega já
  useEffect(() => { if (visible && !src) setSrc('./cidade-v41.html') }, [visible, src])

  // ao mostrar: recalcular tamanho do canvas; pausar o render 3D quando escondida (poupa CPU)
  useEffect(() => {
    const win = iframeRef.current && iframeRef.current.contentWindow
    try {
      if (win) {
        win._roePaused = !visible
        if (visible) setTimeout(() => win.dispatchEvent(new win.Event('resize')), 60)
      }
    } catch { /* */ }
  }, [visible, src])

  // sincronização incremental das obras
  useEffect(() => {
    if (!src) return
    let stop = false
    const sync = () => {
      if (stop) return
      const win = iframeRef.current && iframeRef.current.contentWindow
      let ready = false
      try { ready = !!(win && win._roeReady) } catch { ready = false }
      if (!ready) { setTimeout(sync, 400); return }
      try {
        const total = feitas.length
        if (total > enviadas.current) {
          const novas = total - enviadas.current
          const ultima = feitas.reduce((a, b) => ((b.feitaEm || 0) > ((a && a.feitaEm) || 0) ? b : a), null)
          const recente = ultima && ultima.feitaEm && (Date.now() - ultima.feitaEm < 30000)
          if (recente && !visible) { setTimeout(sync, 400); return } // espera o overlay abrir p/ veres a grua
          if (recente) {
            // intermédias em silêncio; a última com grua (cinema)
            if (novas > 1 && typeof win.restoreProgress === 'function') win.restoreProgress(enviadas.current + novas - 1)
            if (typeof win.completeTask === 'function') setTimeout(() => { try { win.completeTask(ultima.texto) } catch { /* */ } }, visible ? 600 : 0)
          } else if (typeof win.restoreProgress === 'function') {
            win.restoreProgress(total)
          }
          enviadas.current = total
        }
        // aquecer a GPU em fundo (escondida) — a 1ª abertura deixa de ter solavanco
        if (!visible && !aquecida.current && typeof win.roeWarmup === 'function') {
          win.roeWarmup()
          aquecida.current = true
        }
      } catch { /* silencioso */ }
    }
    sync()
    return () => { stop = true }
  }, [feitas, src, visible])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100, background: '#0a0812',
      display: visible ? 'flex' : 'none', flexDirection: 'column',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px', background: '#141207', flex: 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <svg width="30" height="30" viewBox="0 0 100 100" style={{ flex: 'none' }}>
            <rect x="6" y="6" width="88" height="88" rx="26" fill="#1d1a10" />
            <circle cx="50" cy="50" r="27" fill="none" stroke="#FFCE0A" strokeWidth="8" />
            <circle cx="50" cy="50" r="13" fill="none" stroke="#00C865" strokeWidth="7" />
            <circle cx="50" cy="50" r="6" fill="#FF1F3D" />
          </svg>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: '#F4EEE0', fontSize: 15 }}>
            ROE City <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#8a8272', marginLeft: 8 }}>em 3D · a tua recompensa</span>
          </div>
        </div>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,.08)', border: '1px solid #2a2618', color: '#F4EEE0',
          fontFamily: 'var(--font-mono)', fontSize: 12, padding: '9px 18px', borderRadius: 12,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
        }}>← voltar à app</button>
      </div>
      {src ? (
        <iframe
          ref={iframeRef}
          src={src}
          title="ROE City 3D"
          allow="geolocation; fullscreen; autoplay"
          style={{ flex: 1, width: '100%', border: 'none' }}
        />
      ) : <div style={{ flex: 1 }} />}
    </div>
  )
}
