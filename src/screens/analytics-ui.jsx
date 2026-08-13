// ── ROE: componentes visuais reutilizáveis das Análises ──
// Harmonia de números: barra + % = tempo total (absoluto); selo ⏱ = média por tarefa.
import React from 'react'
import { TAG_POR_KEY } from '../lib/tags.js'
import { corTag } from '../lib/categorias.js'
import { fmtDur } from '../lib/analytics.js'

const labTag = (k) => (TAG_POR_KEY[k] ? TAG_POR_KEY[k].lab : k)
const icTag = (k) => (TAG_POR_KEY[k] ? TAG_POR_KEY[k].ic : '📌')

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
