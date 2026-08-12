// ── ROE v35: Observatório (sub-separador da Análise) ──
// As quatro peças visuais sobre dados REAIS do histórico. Sem IA, sem rede.
import React, { useMemo, useState, useRef } from 'react'
import { curvaEnergia, fluxoTempo, evolucaoSemanal, correlacoes, insightsDestaque } from '../lib/observatorio.js'
import { fmtMin } from '../utils/formato.js'

// Rede de segurança: se um painel rebentar no browser, mostra o motivo em vez de
// desaparecer silenciosamente (foi o que aconteceu — peças invisíveis sem pista).
class PainelSafe extends React.Component {
  constructor(p) { super(p); this.state = { erro: null } }
  static getDerivedStateFromError(e) { return { erro: e } }
  render() {
    if (this.state.erro) {
      return (
        <div className="panel obs-panel obs-espera">
          <div className="oe-t">⚠️ {this.props.nome}</div>
          <div className="oe-s">Este gráfico não conseguiu desenhar-se: {String(this.state.erro && this.state.erro.message || this.state.erro)}</div>
        </div>
      )
    }
    return this.props.children
  }
}

const NODE_META = {
  urg:   { lab: 'Urgente cedo',    sub: '1ª do dia',    x: 150, y: 80,  c: 'var(--red)' },
  manha: { lab: 'Manhã',           sub: '09–12h30',     x: 150, y: 250, c: 'var(--mustard)' },
  prod:  { lab: 'Dia produtivo',   sub: '+ concluído',  x: 450, y: 55,  c: 'var(--forest)' },
  fila:  { lab: 'Parada na fila',  sub: '+ tempo',      x: 450, y: 180, c: 'var(--soft)' },
  multi: { lab: 'Muitas tags',     sub: '≥3 etiquetas', x: 450, y: 300, c: 'var(--sky)' },
  morte: { lab: 'Feita a tempo',   sub: 'primeiros 2d', x: 750, y: 180, c: 'var(--forest)' },
  lento: { lab: 'Estoura previsto',sub: '+50%',         x: 750, y: 300, c: 'var(--sky)' },
  foco:  { lab: 'Foco profundo',   sub: 'sessão longa', x: 750, y: 55,  c: 'var(--forest)' },
}

export default function Observatorio({ feitas }) {
  const en = useMemo(() => curvaEnergia(feitas), [feitas])
  const fl = useMemo(() => fluxoTempo(feitas), [feitas])
  const ev = useMemo(() => evolucaoSemanal(feitas), [feitas])
  const co = useMemo(() => correlacoes(feitas), [feitas])
  const ins = useMemo(() => insightsDestaque(feitas), [feitas])

  const comHist = feitas.filter((t) => t.feitaEm)
  // precisa de um mínimo de história para valer a pena
  if (comHist.length < 8) {
    return (
      <div className="obs-jovem">
        <div className="oj-ic">🔭</div>
        <div className="oj-t">O teu observatório está a nascer.</div>
        <div className="oj-s">
          Faltam-te <b>{8 - comHist.length}</b> {8 - comHist.length === 1 ? 'tarefa concluída' : 'tarefas concluídas'} para
          revelar os primeiros padrões. Continua a fechar trabalho — as correntes aparecem sozinhas.
        </div>
        <div className="oj-bar"><div className="oj-fill" style={{ width: Math.round(comHist.length / 8 * 100) + '%' }} /></div>
        <div className="oj-n">{comHist.length} de 8</div>
      </div>
    )
  }

  return (
    <div className="obs">
      {/* insights de destaque */}
      {ins.length > 0 && (
        <div className="obs-insights">
          {ins.map((c, i) => (
            <div key={i} className={'obs-ins ac-' + c.accent}>
              <span className="oi-ic">{c.ic}</span>
              <div className="oi-big">{c.big}</div>
              <div className="oi-cap">{c.cap}</div>
              <div className="oi-note">{c.note}</div>
            </div>
          ))}
        </div>
      )}

      {/* 1 · correlações */}
      {co ? <PainelSafe nome="Correntes invisíveis"><PainelCorrelacoes co={co} /></PainelSafe> : (
        <div className="panel obs-panel obs-espera">
          <div className="oe-t">🔗 Correntes ainda a formar-se</div>
          <div className="oe-s">Precisam de mais dias distintos de trabalho para revelarem padrões fiáveis.</div>
        </div>
      )}

      <div className="obs-grid2">
        {/* 2 · energia */}
        {en ? <PainelSafe nome="A tua energia real"><PainelEnergia en={en} /></PainelSafe> : (
          <div className="panel obs-panel obs-espera">
            <div className="oe-t">⚡ Curva de energia a nascer</div>
            <div className="oe-s">Conclui tarefas ao longo do dia para veres o teu ritmo real.</div>
          </div>
        )}
        {/* 3 · fluxo */}
        {fl ? <PainelSafe nome="O fluxo do teu tempo"><PainelFluxo fl={fl} /></PainelSafe> : (
          <div className="panel obs-panel obs-espera">
            <div className="oe-t">🌊 Fluxo do tempo a nascer</div>
            <div className="oe-s">Falta duração real registada nas tarefas para repartir o tempo.</div>
          </div>
        )}
      </div>

      {/* 4 · evolução — aparece assim que houver 2+ semanas com dados */}
      {ev && ev.semDados >= 2 ? <PainelSafe nome="A tua evolução"><PainelEvolucao ev={ev} /></PainelSafe> : (
        <div className="panel obs-panel obs-espera">
          <div className="oe-t">📈 Evolução por semana</div>
          <div className="oe-s">Aparece a partir de duas semanas distintas com trabalho fechado{ev && ev.semDados === 1 ? ' — já tens uma, falta a próxima.' : '.'}</div>
        </div>
      )}
    </div>
  )
}

/* ═══ 1 · CORRELAÇÕES ═══ */
function PainelCorrelacoes({ co }) {
  const [pop, setPop] = useState(null) // {x,y,tipo,texto}
  const svgRef = useRef(null)
  const NS = 'http://www.w3.org/2000/svg'
  const col = (t) => t === 'good' ? 'var(--forest)' : t === 'bad' ? 'var(--red)' : 'var(--faint)'
  const strokeW = (f) => 2 + f * 9

  // só os nós que aparecem em alguma ligação
  const usados = new Set()
  co.links.forEach((l) => { usados.add(l.de); usados.add(l.para) })

  const onEnter = (l, evt) => {
    const A = NODE_META[l.de], B = NODE_META[l.para]
    const r = svgRef.current.getBoundingClientRect()
    const mx = (A.x + B.x) / 2 / 900 * r.width
    const my = (A.y + B.y) / 2 / 340 * r.height
    setPop({ left: Math.min(Math.max(mx - 105, 4), r.width - 214), top: my + 8, tipo: l.tipo, texto: l.texto })
  }

  return (
    <div className="panel obs-panel obs-corr">
      <div className="op-lab"><span className="op-dot" />REVELAÇÃO PRINCIPAL</div>
      <div className="op-tit">Correntes invisíveis</div>
      <div className="op-hint">Relações ocultas entre os teus hábitos. Quanto mais grossa e acesa a ligação, mais forte o padrão. Passa o rato por cima para a leres.</div>
      <div className="corr-wrap">
        <svg ref={svgRef} className="corr-svg" viewBox="0 0 900 340">
          {co.links.map((l, i) => {
            const A = NODE_META[l.de], B = NODE_META[l.para]
            return (
              <path key={i}
                d={`M ${A.x} ${A.y} C ${(A.x + B.x) / 2} ${A.y}, ${(A.x + B.x) / 2} ${B.y}, ${B.x} ${B.y}`}
                fill="none" stroke={col(l.tipo)} strokeWidth={strokeW(l.forca)} strokeLinecap="round"
                opacity={l.tipo === 'weak' ? 0.35 : 0.55}
                strokeDasharray={l.tipo === 'weak' ? '2 7' : 'none'}
                className="corr-link"
                onMouseEnter={(e) => onEnter(l, e)}
                onMouseLeave={() => setPop(null)}
              />
            )
          })}
          {[...usados].map((k) => {
            const n = NODE_META[k]; if (!n) return null
            const anchor = n.x < 300 ? 'end' : n.x > 600 ? 'start' : 'middle'
            const dx = n.x < 300 ? -20 : n.x > 600 ? 20 : 0
            const dy = n.x >= 300 && n.x <= 600 ? -24 : 4
            return (
              <g key={k}>
                <circle cx={n.x} cy={n.y} r="13" fill="none" stroke={n.c} strokeWidth="1.5" opacity="0.3" />
                <circle cx={n.x} cy={n.y} r="7" fill={n.c} stroke="#fff" strokeWidth="2.5" />
                <text x={n.x + dx} y={n.y + dy} textAnchor={anchor} className="corr-node-lbl">{n.lab}</text>
                <text x={n.x + dx} y={n.y + dy + 13} textAnchor={anchor} className="corr-node-sub">{n.sub}</text>
              </g>
            )
          })}
        </svg>
        {pop && (
          <div className="corr-pop on" style={{ left: pop.left, top: pop.top }}>
            <div className="cp-k">{pop.tipo === 'good' ? 'IMPULSIONA' : pop.tipo === 'bad' ? 'CUSTA-TE' : 'LIGAÇÃO FRACA'}</div>
            <div className="cp-v" dangerouslySetInnerHTML={{ __html: pop.texto }} />
          </div>
        )}
      </div>
      <div className="corr-legend">
        <span className="cl"><span className="cl-ln" style={{ borderColor: 'var(--forest)' }} />impulsiona</span>
        <span className="cl"><span className="cl-ln" style={{ borderColor: 'var(--red)' }} />custa-te</span>
        <span className="cl"><span className="cl-ln dash" style={{ borderColor: 'var(--faint)' }} />ligação fraca</span>
      </div>
    </div>
  )
}

/* ═══ 2 · CURVA DE ENERGIA ═══ */
function PainelEnergia({ en }) {
  const W = 440, H = 220, padL = 8, padR = 8, padT = 16, padB = 30
  const pts = en.pts
  const n = pts.length, gx = (W - padL - padR) / (n - 1)
  const X = (i) => padL + i * gx
  const Y = (v) => padT + (1 - v) * (H - padT - padB)

  // segmentos contínuos (parte no almoço)
  const segs = []
  let cur = []
  pts.forEach((p, i) => {
    if (p.almoco || p.n === 0 && cur.length === 0) { if (cur.length > 1) segs.push(cur); cur = []; return }
    cur.push(i)
  })
  if (cur.length > 1) segs.push(cur)

  const path = (idxs) => {
    let d = `M ${X(idxs[0])} ${Y(pts[idxs[0]].v)}`
    for (let j = 1; j < idxs.length; j++) {
      const i = idxs[j], p = idxs[j - 1]
      const cx = (X(p) + X(i)) / 2
      d += ` C ${cx} ${Y(pts[p].v)}, ${cx} ${Y(pts[i].v)}, ${X(i)} ${Y(pts[i].v)}`
    }
    return d
  }
  const peakIdx = en.peak ? pts.findIndex((p) => p.h === en.peak.h) : -1
  const hLabels = [9, 10, 11, 12, 14, 15, 16, 17, 18]

  return (
    <div className="panel obs-panel">
      <div className="op-lab"><span className="op-dot" />RITMO CIRCADIANO</div>
      <div className="op-tit">A tua energia real</div>
      <div className="op-hint">Velocidade a que fechas trabalho ao longo do dia — medida, não teórica.</div>
      <svg className="obs-svg" viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <linearGradient id="egGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--mustard)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--mustard)" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {/* banda almoço */}
        {(() => {
          const aL = pts.findIndex((p) => p.almoco)
          const aR = pts.length - 1 - [...pts].reverse().findIndex((p) => p.almoco)
          if (aL < 0) return null
          return <>
            <rect x={X(aL) - gx / 2} y={padT} width={gx * (aR - aL + 1)} height={H - padT - padB} className="obs-pausa" rx="6" />
            <text x={(X(aL) + X(aR)) / 2} y={H - padB + 18} textAnchor="middle" className="obs-pausa-lbl">ALMOÇO</text>
          </>
        })()}
        {segs.map((idxs, k) => (
          <g key={k}>
            <path d={`${path(idxs)} L ${X(idxs[idxs.length - 1])} ${H - padB} L ${X(idxs[0])} ${H - padB} Z`} fill="url(#egGrad)" />
            <path d={path(idxs)} fill="none" stroke="var(--mustard)" strokeWidth="3" strokeLinecap="round" />
          </g>
        ))}
        {peakIdx >= 0 && <>
          <circle cx={X(peakIdx)} cy={Y(pts[peakIdx].v)} r="11" fill="none" stroke="var(--mustard)" strokeWidth="1.5" opacity="0.4" />
          <circle cx={X(peakIdx)} cy={Y(pts[peakIdx].v)} r="6" fill="var(--mustard)" stroke="#fff" strokeWidth="2" />
          <text x={X(peakIdx)} y={Y(pts[peakIdx].v) - 16} textAnchor="middle" className="obs-peak-lbl">PICO {Math.floor(pts[peakIdx].h)}h</text>
        </>}
        {hLabels.map((h) => {
          const i = pts.findIndex((p) => Math.abs(p.h - h) < 0.01)
          if (i < 0) return null
          return <text key={h} x={X(i)} y={H - padB + 14} textAnchor="middle" className="obs-hour">{h}</text>
        })}
      </svg>
    </div>
  )
}

/* ═══ 3 · FLUXO DO TEMPO ═══ */
function PainelFluxo({ fl }) {
  const W = 440, padL = 8, padR = 8, top = 6, rh = 44, gap = 6, barMax = W - padL - padR - 128
  const maxv = Math.max(...fl.rows.map((r) => Math.max(r.prev, r.real)), 1)
  const corVar = (cls) => cls === 'red' ? 'var(--red)' : cls === 'gold' ? 'var(--mustard)' : cls === 'sky' ? 'var(--sky)' : cls === 'forest' ? 'var(--forest)' : 'var(--soft)'
  const H = top + fl.rows.length * (rh + gap)

  return (
    <div className="panel obs-panel">
      <div className="op-lab"><span className="op-dot" />PARA ONDE VAI</div>
      <div className="op-tit">O fluxo do teu tempo</div>
      <div className="op-hint">Como as horas se repartem por tipo — e onde o previsto (ténue) e o real (sólido) divergem.</div>
      <svg className="obs-svg" viewBox={`0 0 ${W} ${H}`}>
        {fl.rows.map((r, i) => {
          const y = top + i * (rh + gap)
          const bx = padL + 128
          const c = corVar(r.cls)
          const wp = r.prev / maxv * barMax
          const wr = r.real / maxv * barMax
          return (
            <g key={r.key}>
              <text x={padL} y={y + 16} className="obs-flow-lbl">{r.lab.length > 16 ? r.lab.slice(0, 15) + '…' : r.lab}</text>
              <rect x={bx} y={y + 4} width={wp} height="11" rx="5" fill={c} opacity="0.22" />
              <rect x={bx} y={y + 18} width={wr} height="13" rx="6" fill={c} opacity="0.85" />
              <text x={bx + Math.max(wr, wp) + 8} y={y + 22} className="obs-flow-dev" fill={r.dev > 5 ? 'var(--red-ink)' : r.dev < -5 ? 'var(--forest-ink)' : 'var(--soft)'}>{r.dev > 0 ? '+' : ''}{r.dev}%</text>
              <text x={bx} y={y + 42} className="obs-flow-min">prev {Math.round(r.prev / 60 * 10) / 10}h · real {Math.round(r.real / 60 * 10) / 10}h</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

/* ═══ 4 · EVOLUÇÃO ═══ */
function PainelEvolucao({ ev }) {
  const W = 860, H = 200, padL = 30, padR = 20, padT = 24, padB = 28
  const wk = ev.wk, mm = ev.mm
  const maxv = Math.max(...wk.map((w) => w.n), 1) * 1.15
  const n = wk.length, gx = (W - padL - padR) / (n - 1)
  const X = (i) => padL + i * gx
  const Y = (v) => padT + (1 - v / maxv) * (H - padT - padB)

  let dm = `M ${X(0)} ${Y(mm[0])}`
  for (let i = 1; i < n; i++) { const cx = (X(i - 1) + X(i)) / 2; dm += ` C ${cx} ${Y(mm[i - 1])}, ${cx} ${Y(mm[i])}, ${X(i)} ${Y(mm[i])}` }

  const chip = ev.tendencia === 'sobe' ? { t: '▲ a subir', c: 'forest' } : ev.tendencia === 'desce' ? { t: '▼ a abrandar', c: 'red' } : { t: '● estável', c: 'soft' }

  return (
    <div className="panel obs-panel">
      <div className="op-lab"><span className="op-dot" />TRAJETÓRIA<span className={'obs-trend ' + chip.c}>{chip.t}</span></div>
      <div className="op-tit">A tua evolução</div>
      <div className="op-hint">Tarefas concluídas por semana. A linha ténue é a média móvel de 3 semanas.</div>
      <svg className="obs-svg" viewBox={`0 0 ${W} ${H}`}>
        {[0, 1, 2, 3].map((g) => { const yy = padT + g / 3 * (H - padT - padB); return <line key={g} x1={padL} y1={yy} x2={W - padR} y2={yy} stroke="var(--line)" strokeWidth="1" /> })}
        <path d={dm} fill="none" stroke="var(--faint)" strokeWidth="2" strokeDasharray="4 5" opacity="0.7" />
        {wk.map((w, i) => {
          const bw = Math.min(30, gx * 0.5), x = X(i) - bw / 2, y = Y(w.n)
          const up = i > 0 && w.n >= wk[i - 1].n
          return (
            <g key={i}>
              <rect x={x} y={y} width={bw} height={H - padB - y} rx="6" fill={up ? 'var(--forest)' : 'var(--mustard)'} opacity="0.9" />
              <text x={X(i)} y={y - 8} textAnchor="middle" className="obs-evo-val">{w.n}</text>
              <text x={X(i)} y={H - padB + 16} textAnchor="middle" className="obs-evo-wk">{w.lab}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
