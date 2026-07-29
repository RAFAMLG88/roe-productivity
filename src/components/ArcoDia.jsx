// ── ROE v33: "O teu dia" ──
// Faixa marfim-e-ouro no topo do Escritório: o dia das 07 às 20 em três fases
// coloridas (ERGUER · CONSTRUIR · FECHAR), o percorrido aceso com brilho a fluir,
// o sol na hora atual, e um marco dourado por cada tarefa concluída hoje
// (feitaEm real — nada de adornos inventados). O fecho cerimonial fica para a v34.
import React, { useState, useEffect } from 'react'
import { useRoe } from '../state/RoeContext.jsx'

const H0 = 7, H1 = 20
const pos = (h) => Math.min(1, Math.max(0, (h - H0) / (H1 - H0))) * 100
const pad = (n) => String(n).padStart(2, '0')

export default function ArcoDia() {
  const { feitas } = useRoe()
  const [, tick] = useState(0)
  useEffect(() => { const t = setInterval(() => tick((x) => x + 1), 30000); return () => clearInterval(t) }, [])

  const agora = new Date()
  const hoje0 = new Date(agora); hoje0.setHours(0, 0, 0, 0)
  const marcos = feitas
    .filter((t) => (t.feitaEm || 0) >= hoje0.getTime())
    .sort((a, b) => (a.feitaEm || 0) - (b.feitaEm || 0))

  const hf = agora.getHours() + agora.getMinutes() / 60
  const p = pos(hf)

  return (
    <div className="arco enter">
      <div className="arco-cab">
        <span className="arco-t">O teu dia</span>
        <span className="arco-n">{marcos.length} marco{marcos.length === 1 ? '' : 's'} erguido{marcos.length === 1 ? '' : 's'}</span>
      </div>
      <div className="arco-trilho">
        <div className="arco-cor" />
        <div className="arco-feito" style={{ width: p + '%' }}>
          <i style={{ width: (p > 0 ? 10000 / p : 0) + '%' }} />
        </div>
        {Array.from({ length: H1 - H0 + 1 }, (_, i) => H0 + i).map((h) => (
          <React.Fragment key={h}>
            <span className={'arco-tick' + (h === 10 || h === 17 ? ' g' : '')} style={{ left: pos(h) + '%' }} />
            {[7, 10, 13, 17, 20].includes(h) && <span className="arco-hl" style={{ left: pos(h) + '%' }}>{pad(h)}</span>}
          </React.Fragment>
        ))}
        <span className="arco-fase f-erg" style={{ left: pos(8.5) + '%' }}>ERGUER</span>
        <span className="arco-fase f-con" style={{ left: pos(13.5) + '%' }}>CONSTRUIR</span>
        <span className="arco-fase f-fec" style={{ left: pos(18.5) + '%' }}>FECHAR</span>
        {marcos.map((m) => {
          const d = new Date(m.feitaEm)
          const mh = d.getHours() + d.getMinutes() / 60
          return (
            <span key={m.id} className="arco-marco" style={{ left: pos(mh) + '%' }}
              title={m.texto + ' · ' + pad(d.getHours()) + ':' + pad(d.getMinutes())} />
          )
        })}
        <span className="arco-agora-lbl" style={{ left: p + '%' }}>{pad(agora.getHours())}:{pad(agora.getMinutes())}</span>
        <span className="arco-agora" style={{ left: p + '%' }} title="agora" />
      </div>
    </div>
  )
}
