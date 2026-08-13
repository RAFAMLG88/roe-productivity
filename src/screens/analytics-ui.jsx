// ── ROE: componentes visuais reutilizáveis das Análises ──
// Harmonia de números: barra + % = tempo total (absoluto); selo ⏱ = média por tarefa.
import React from 'react'
import { TAG_POR_KEY, metaTag } from '../lib/tags.js'
import { corTag } from '../lib/categorias.js'
import { fmtDur, KEY_SCAT } from '../lib/analytics.js'

const labTag = (k) => (k === KEY_SCAT ? 'Por catalogar' : (metaTag(k) ? metaTag(k).lab : k))
const icTag = (k) => (k === KEY_SCAT ? '🏷️' : (metaTag(k) ? metaTag(k).ic : '📌'))

// legenda-chave da leitura dupla (barra vs. selo)
export function LegendaChave({ comMarca }) {
  return (
    <div className="lk-bar-wrap">
      <div className="lk-item"><span className="lk-barra" /><b>Barra + %</b> tempo total</div>
      <div className="lk-item"><span className="lk-selo-mini">⏱ méd</span><b>Selo</b> média por tarefa</div>
      {comMarca && <div className="lk-item"><span className="lk-marca" /><b>Marca</b> média histórica</div>}
    </div>
  )
}

// barra de uma tag: ícone · nome · (total em N tarefas) · selo média · barra + %
export function BarraTag({ item, max }) {
  const cor = corTag(item.key)
  const largura = max > 0 ? (item.min / max * 100) : 0
  return (
    <div className="tagbar">
      <span className="tb-ic" style={{ background: cor + '22' }}>{icTag(item.key)}</span>
      <div className="tb-body">
        <div className="tb-top">
          <span className="tb-lab">{labTag(item.key)}</span>
          <span className="tb-right">
            <span className="tb-abs"><b>{fmtDur(item.min)}</b> em {item.n} {item.n === 1 ? 'tarefa' : 'tarefas'}</span>
            <span className="tb-selo"><span className="clock">⏱</span>{fmtDur(item.media)}/tarefa</span>
          </span>
        </div>
        <div className="tb-botrow">
          <div className="tb-track"><div className="tb-fill" style={{ width: largura + '%', background: cor }} /></div>
          <span className="tb-pct" style={{ color: cor }}>{Math.round(item.pct)}%</span>
        </div>
      </div>
    </div>
  )
}

// cartão de categoria-mãe
export function CartaoCategoria({ c, max }) {
  const largura = max > 0 ? (c.min / max * 100) : 0
  return (
    <div className={'catcard ' + c.key}>
      <div className="cc-top"><span className="cc-dot" style={{ background: c.cor }} /><span className="cc-lab">{c.lab}</span></div>
      <div className="cc-abs" style={{ color: c.corInk }}>{fmtDur(c.min)}</div>
      <div className="cc-abs-l">tempo total · {c.n} {c.n === 1 ? 'tarefa' : 'tarefas'}</div>
      <div className="cc-mini-track"><div className="cc-mini-fill" style={{ width: largura + '%', background: c.cor }} /></div>
      <div className="cc-foot">
        <span className="cc-pct" style={{ color: c.corInk }}>{Math.round(c.pct)}%</span>
        <span className="cc-selo"><span className="clock">⏱</span>{fmtDur(c.media)}/tarefa</span>
      </div>
    </div>
  )
}

// linha de cruzamento: barra empilhada das tags dentro de uma categoria
export function LinhaCruzamento({ c }) {
  if (!c.n) {
    return (
      <div className="cruz-row">
        <div className="cruz-head"><span className={'cruz-badge ' + c.key}>{c.lab}</span><span className="cruz-abs">sem dados ainda</span></div>
        <div className="cruz-bar vazia" />
      </div>
    )
  }
  return (
    <div className="cruz-row">
      <div className="cruz-head">
        <span className={'cruz-badge ' + c.key}>{c.lab}</span>
        <span className="cruz-abs"><b>{fmtDur(c.totalMin)}</b> total</span>
        <span className="cruz-selo"><span className="clock">⏱</span>{fmtDur(c.media)}</span>
      </div>
      <div className="cruz-bar">
        {c.tags.filter((t) => t.pctCat >= 1).map((t) => (
          <div key={t.key} className="cruz-seg" style={{ width: t.pctCat + '%', background: corTag(t.key) }}
            title={labTag(t.key) + ' ' + Math.round(t.pctCat) + '%'}>
            {t.pctCat >= 12 ? Math.round(t.pctCat) + '%' : ''}
          </div>
        ))}
      </div>
    </div>
  )
}

// legenda de cores das tags (chave de leitura, não tutorial)
export function LegendaTags({ chaves }) {
  return (
    <div className="cruz-leg">
      {chaves.map((k) => (
        <span key={k} className="cl-chip"><span className="cl-dot" style={{ background: corTag(k) }} />{labTag(k)}</span>
      ))}
    </div>
  )
}

// donut de fatias para as naturezas-mãe (recebe [{lab, cor, pct, min}])
// Desenha um anel dividido em arcos proporcionais ao tempo, com legenda ao lado.
export function DonutNaturezas({ fatias, titulo }) {
  const ativas = fatias.filter((f) => f.min > 0)
  const total = ativas.reduce((s, f) => s + f.min, 0)
  if (!total) return <div className="vazio-nota">Sem tempo registado por natureza ainda.</div>

  const R = 15.9155, C = 2 * Math.PI * R // circunferência ≈ 100
  let offset = 0
  const arcos = ativas.map((f) => {
    const frac = f.min / total
    const dash = frac * C
    const arco = { ...f, dash, gap: C - dash, dashOffset: -offset * C, pct: frac * 100 }
    offset += frac
    return arco
  })

  return (
    <div className="donut-box">
      <div className="donut-svg-wrap">
        <svg viewBox="0 0 42 42" className="donut-svg">
          <circle cx="21" cy="21" r={R} fill="none" stroke="var(--cream-2)" strokeWidth="5.5" />
          {arcos.map((a) => (
            <circle key={a.key} cx="21" cy="21" r={R} fill="none" stroke={a.cor} strokeWidth="5.5"
              strokeDasharray={`${a.dash} ${a.gap}`} strokeDashoffset={a.dashOffset}
              transform="rotate(-90 21 21)" strokeLinecap="butt" />
          ))}
        </svg>
        <div className="donut-centro">
          <div className="donut-c-v">{fmtDur(total)}</div>
          <div className="donut-c-l">total</div>
        </div>
      </div>
      <div className="donut-leg">
        {arcos.map((a) => (
          <div key={a.key} className="donut-li">
            <span className="donut-dot" style={{ background: a.cor }} />
            <span className="donut-nome">{a.lab}</span>
            <span className="donut-pct">{Math.round(a.pct)}%</span>
            <span className="donut-min">{fmtDur(a.min)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// donut compacto da repartição INTERNA de uma natureza (as suas tags).
// Usado no cruzamento: um destes por natureza-mãe.
function DonutInterno({ nat }) {
  const R = 15.9155, C = 2 * Math.PI * R
  if (!nat.n) {
    return (
      <div className="dci vazio">
        <div className="dci-head"><span className={'cruz-badge ' + nat.key}>{nat.lab}</span></div>
        <div className="dci-vazio">sem dados ainda</div>
      </div>
    )
  }
  const tags = nat.tags.filter((t) => t.pctCat >= 1)
  let offset = 0
  const arcos = tags.map((t) => {
    const frac = t.pctCat / 100
    const dash = frac * C
    const a = { ...t, dash, gap: C - dash, dashOffset: -offset * C }
    offset += frac
    return a
  })
  return (
    <div className="dci">
      <div className="dci-head">
        <span className={'cruz-badge ' + nat.key}>{nat.lab}</span>
        <span className="dci-tot"><b>{fmtDur(nat.totalMin)}</b> · <span className="clock">⏱</span>{fmtDur(nat.media)}</span>
      </div>
      <div className="dci-body">
        <div className="dci-svg-wrap">
          <svg viewBox="0 0 42 42" className="dci-svg">
            <circle cx="21" cy="21" r={R} fill="none" stroke="var(--cream-2)" strokeWidth="6" />
            {arcos.map((a) => (
              <circle key={a.key} cx="21" cy="21" r={R} fill="none" stroke={corTag(a.key)} strokeWidth="6"
                strokeDasharray={`${a.dash} ${a.gap}`} strokeDashoffset={a.dashOffset}
                transform="rotate(-90 21 21)" />
            ))}
          </svg>
        </div>
        <div className="dci-leg">
          {arcos.map((a) => (
            <div key={a.key} className="dci-li">
              <span className="dci-dot" style={{ background: corTag(a.key) }} />
              <span className="dci-nome">{labTag(a.key)}</span>
              <span className="dci-pct">{Math.round(a.pctCat)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// grelha dos donuts internos, um por natureza
export function DonutCruzamento({ naturezas }) {
  return (
    <div className="dci-grid">
      {naturezas.map((n) => <DonutInterno key={n.key} nat={n} />)}
    </div>
  )
}
