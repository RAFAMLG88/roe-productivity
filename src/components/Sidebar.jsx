import React from 'react'
import { useRoe } from '../state/RoeContext.jsx'

const NAV = [
  { id: 'briefing', ic: '◎', label: 'Briefing' },
  { id: 'foco', ic: '◉', label: 'Foco' },
  { id: 'capturar', ic: '＋', label: 'Capturar' },
  { id: 'cidade', ic: '▲', label: 'Cidade' },
  { id: 'analise', ic: '∿', label: 'Análise' },
]
const FOOT = {
  briefing: 'o teu santuário', foco: 'em foco', capturar: 'entrada do dia',
  cidade: 'a tua recompensa', analise: 'a tua análise',
}

// O anel de foco — símbolo da marca
function AnelLogo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ flex: 'none' }}>
      <rect x="6" y="6" width="88" height="88" rx="26" fill="#1d1a10" />
      <circle cx="50" cy="50" r="27" fill="none" stroke="#FFCE0A" strokeWidth="7" />
      <circle cx="50" cy="50" r="14" fill="none" stroke="#00C865" strokeWidth="6" />
      <circle cx="50" cy="50" r="6" fill="#FF1F3D" />
    </svg>
  )
}

export default function Sidebar({ current, onNavigate }) {
  const { fila } = useRoe()
  const porTriar = fila.length

  return (
    <nav className="side">
      <div className="brand">
        <AnelLogo size={40} />
        <div><div className="bt">ROE</div><div className="bs">Productivity</div></div>
      </div>
      <div className="nav">
        {NAV.map((n) => (
          <button key={n.id} className={current === n.id ? 'on' : ''} onClick={() => onNavigate(n.id)}>
            <span className="ic">{n.ic}</span>{n.label}
            {n.id === 'briefing' && porTriar > 0 && <span className="num">{porTriar}</span>}
          </button>
        ))}
      </div>
      <div className="foot">
        <div className="av">R</div>
        <div><div className="fn">Rafael</div><div className="fs">{FOOT[current]}</div></div>
      </div>
    </nav>
  )
}
