import { useEffect, useRef, useState } from 'react'
import { createMetronome } from '../lib/audio'
import { saveMetro } from '../lib/store'

export default function Metronome({ uid, sessoes, onSaved }) {
  const [bpm, setBpm] = useState(() => sessoes.length ? sessoes[sessoes.length - 1].bpm : 80)
  const [aTocar, setATocar] = useState(false)
  const [beat, setBeat] = useState(-1)
  const [guardado, setGuardado] = useState(false)
  const metro = useRef(null)

  useEffect(() => {
    metro.current = createMetronome((b) => setBeat(b))
    return () => metro.current?.stop()
  }, [])
  useEffect(() => { metro.current?.setBpm(bpm) }, [bpm])

  const toggle = () => {
    if (aTocar) { metro.current.stop(); setATocar(false); setBeat(-1) }
    else { metro.current.start(); setATocar(true) }
  }
  const guardar = async () => {
    try {
      await saveMetro(uid, bpm, 'palhetada')
      setGuardado(true); setTimeout(() => setGuardado(false), 1800)
      onSaved?.()
    } catch (e) { console.error(e) }
  }

  const ultimas = sessoes.slice(-12)
  const maxB = Math.max(100, ...ultimas.map((s) => s.bpm))
  const minB = Math.min(60, ...ultimas.map((s) => s.bpm))
  // duração do swing do pêndulo em função do bpm
  const swingDur = (60 / bpm).toFixed(3)

  return (
    <div className="scr">
      <div className="scr-particles" aria-hidden="true">
        {['♪', '♫', '♩', '♬', '♪', '♫'].map((n, i) => (
          <span key={i} className={`gg-particle p${i}`} style={{ color: ['#FFB020', '#FF2D95', '#00E0FF', '#CCFF00'][i % 4] }}>{n}</span>
        ))}
      </div>
      <img src="/img/heroi-metronomo.png" alt="" className="scr-hero-img scr-hero-metro" aria-hidden="true" />

      <div className="scr-top"><div>
        <div className="scr-kick" style={{ color: '#FFB020' }}>◆ Pilar Técnica</div>
        <h1 className="scr-title">Metrónomo</h1>
        <p className="scr-sub">Só sobes 4 BPM quando o tempo atual sai LIMPO três dias seguidos. Guarda a sessão no fim — o histórico conta a tua história.</p>
      </div></div>

      <div className="mt-grid">
        {/* PÊNDULO + controlo */}
        <div className="scr-glass mt-main">
          <div className="scr-glass-h"><h3>Tempo</h3><span className="scr-badge">4/4 · ACENTO NO 1</span></div>

          {/* pêndulo animado */}
          <div className="mt-pendulo">
            <svg width="200" height="180" viewBox="0 0 200 180">
              <defs>
                <linearGradient id="mtGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#FFB020" /><stop offset="1" stopColor="#FF2D95" />
                </linearGradient>
              </defs>
              {/* corpo triangular */}
              <path d="M100,20 L150,160 L50,160 Z" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="2" />
              <line x1="50" y1="160" x2="150" y2="160" stroke="rgba(255,255,255,.15)" strokeWidth="2" />
              {/* haste do pêndulo (anima) */}
              <g className={aTocar ? 'mt-swing' : ''} style={{ transformOrigin: '100px 160px', animationDuration: `${swingDur}s` }}>
                <line x1="100" y1="160" x2="100" y2="45" stroke="url(#mtGrad)" strokeWidth="3" strokeLinecap="round"
                  style={{ filter: 'drop-shadow(0 0 6px #FFB020)' }} />
                <circle cx="100" cy="70" r="9" fill="#FFB020" style={{ filter: 'drop-shadow(0 0 8px #FFB020)' }} />
              </g>
              <circle cx="100" cy="160" r="5" fill="#FF2D95" />
            </svg>
          </div>

          <div className="mt-bpm">{bpm}<small>BPM</small></div>
          <div className="mt-beats">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={`mt-beat ${beat === i ? 'on' : ''} ${i === 0 ? 'accent' : ''}`} />
            ))}
          </div>
          <input type="range" min="40" max="208" value={bpm} onChange={(e) => setBpm(Number(e.target.value))} className="mt-slider" />
          <div className="mt-controls">
            <button className="mt-mini" onClick={() => setBpm((b) => Math.max(40, b - 4))}>−4</button>
            <button className="mt-play" onClick={toggle}>{aTocar ? '❚❚ Parar' : '▶ Iniciar'}</button>
            <button className="mt-mini" onClick={() => setBpm((b) => Math.min(208, b + 4))}>+4</button>
          </div>
          <button className="mt-save" onClick={guardar}>{guardado ? '✓ Sessão guardada' : '↓ Guardar esta sessão'}</button>
        </div>

        {/* HISTÓRICO com gráfico */}
        <div className="scr-glass mt-hist">
          <div className="scr-glass-h"><h3>Evolução do tempo</h3><span className="scr-badge">{sessoes.length} SESSÕES</span></div>
          {ultimas.length === 0 ? (
            <p className="scr-legenda">Sem sessões guardadas. Toca no teu tempo confortável, guarda, e vê a linha subir ao longo das semanas.</p>
          ) : (
            <>
              <div className="mt-chart">
                {ultimas.map((s, i) => {
                  const h = ((s.bpm - minB) / (maxB - minB)) * 100
                  return (
                    <div className="mt-chart-col" key={i}>
                      <div className="mt-chart-bar" style={{ height: `${Math.max(8, h)}%` }} title={`${s.bpm} BPM`}>
                        <span className="mt-chart-val">{s.bpm}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-chart-axis"><span>{minB}</span><span>{maxB} BPM</span></div>
            </>
          )}
          <div className="mt-tip">
            <b style={{ color: '#FFB020' }}>Limpeza &gt; velocidade.</b> Um tempo lento tocado sem falha vale mais do que um rápido com ruído. A velocidade é consequência, não objetivo.
          </div>
        </div>
      </div>

      {/* faixa: barras rítmicas animadas */}
      <div className="scr-glass mt-rhythm-card">
        <div className="scr-glass-h"><h3>Sente a pulsação</h3><span className="scr-badge">ACENTO A CADA 4</span></div>
        <div className="mt-rhythm">
          {Array.from({ length: 16 }, (_, i) => (
            <span key={i} className={`mt-rhythm-bar ${i % 4 === 0 ? 'accent' : ''}`} style={{ animationDelay: `${i * 0.12}s` }} />
          ))}
        </div>
        <p className="scr-legenda">A barra alta é o tempo 1 de cada compasso. Bate o pé nela — é a âncora do ritmo.</p>
      </div>
    </div>
  )
}
