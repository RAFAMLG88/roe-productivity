// ── ROE: Histórico — memória de longo prazo (mensal e anual) ──
// Anos em acordeão: o atual aberto, anteriores recolhidos. Cada ano tem box-resumo
// + grelha de meses (só os com dados). Cada mês: valores, natureza-mãe, tags, prioridade.
import React, { useState, useMemo } from 'react'
import { historico, fmtDur, KEY_SCAT } from '../lib/analytics.js'
import { TAG_POR_KEY, metaTag, TAGS } from '../lib/tags.js'
import { corTag } from '../lib/categorias.js'

const labTag = (k) => (k === KEY_SCAT ? 'Por catalogar' : (metaTag(k) ? metaTag(k).lab : k))

// mini-barra de naturezas (recebe cats já ordenadas com pct)
function NatMini({ cats }) {
  const total = cats.reduce((s, c) => s + c.min, 0) || 1
  return (
    <div className="mes-natmini">
      {cats.map((c) => <span key={c.key} style={{ width: (c.min / total * 100) + '%', background: c.cor }} />)}
    </div>
  )
}

// bloco de prioridade compacto
function PrioMini({ prio }) {
  const total = (prio.urgente.n + prio.importante.n + prio.normal.n) || 1
  return (
    <>
      <div className="prio-mini">
        <span style={{ width: (prio.urgente.n / total * 100) + '%', background: 'var(--red)' }} />
        <span style={{ width: (prio.importante.n / total * 100) + '%', background: 'var(--mustard)' }} />
        <span style={{ width: (prio.normal.n / total * 100) + '%', background: 'var(--faint)' }} />
      </div>
      <div className="prio-chips">
        <span className="pchip"><span className="pchip-dot" style={{ background: 'var(--red)' }} /><b>{prio.urgente.n}</b> urg · {Math.round(prio.urgente.pct)}%</span>
        <span className="pchip"><span className="pchip-dot" style={{ background: 'var(--mustard)' }} /><b>{prio.importante.n}</b> imp · {Math.round(prio.importante.pct)}%</span>
        <span className="pchip"><span className="pchip-dot" style={{ background: 'var(--faint)' }} /><b>{prio.normal.n}</b> norm · {Math.round(prio.normal.pct)}%</span>
      </div>
    </>
  )
}

// todas as tags do sistema — as usadas com o seu %, as não usadas a 0%
function TagsTop({ tags, total }) {
  const usadasPorKey = Object.fromEntries(tags.map((t) => [t.key, t]))
  // completa com as tags do sistema que não apareceram este mês (pct 0)
  const doSistema = TAGS.map((def) => usadasPorKey[def.key] || { key: def.key, pct: 0, min: 0, n: 0 })
  // "Por catalogar" não é tag do sistema mas deve aparecer se existir
  const scat = usadasPorKey[KEY_SCAT] ? [usadasPorKey[KEY_SCAT]] : []
  const todas = [...doSistema, ...scat]
  // ordena: mais tempo primeiro; as de 0% ficam no fim
  todas.sort((a, b) => b.pct - a.pct)
  return (
    <div className="tags-mini">
      {todas.map((t) => (
        <div key={t.key} className={'tagm' + (t.pct === 0 ? ' zero' : '')}>
          <span className="tagm-dot" style={{ background: t.pct === 0 ? 'var(--faint)' : corTag(t.key) }} />
          <span className="tagm-lab">{labTag(t.key)}</span>
          <span className="tagm-pct">{Math.round(t.pct)}%</span>
        </div>
      ))}
    </div>
  )
}

function BoxMes({ mes }) {
  const cor = mes.dominante ? mes.dominante.cor : 'var(--faint)'
  const intensLab = { alta: 'agitado', media: 'média', baixa: 'calmo', curso: 'a decorrer' }[mes.intensidade]
  const intensCls = mes.intensidade === 'curso' ? '' : mes.intensidade
  return (
    <div className={'mes' + (mes.emCurso ? ' em-curso' : '')} style={{ '--cc': cor }}>
      <div className="mes-top">
        <span className="mes-nome">{mes.nome}</span>
        <span className={'mes-intens ' + intensCls}>{intensLab}</span>
      </div>
      <div className="mes-nums">
        <div className="mn"><div className="mn-v">{fmtDur(mes.min)}</div><div className="mn-l">foco</div><div className="mes-selo">⏱ {fmtDur(mes.media)}/tarefa</div></div>
        <div className="mn"><div className="mn-v">{mes.n}</div><div className="mn-l">tarefas</div></div>
      </div>
      {mes.dominante && (
        <div className="mes-bloco">
          <div className="mb-tit">natureza-mãe</div>
          <NatMini cats={mes.cats} />
          <div className="mes-dom"><span className="mes-dom-dot" style={{ background: mes.dominante.cor }} /><span className="mes-dom-tx">{mes.dominante.lab} domina</span><span className="mes-dom-pct">{Math.round(mes.dominante.pct)}%</span></div>
        </div>
      )}
      {mes.tags.length > 0 && (
        <div className="mes-bloco">
          <div className="mb-tit">tags de tipo</div>
          <TagsTop tags={mes.tags} total={mes.n} />
        </div>
      )}
      <div className="mes-bloco">
        <div className="mb-tit">prioridade</div>
        <PrioMini prio={mes.prio} />
      </div>
    </div>
  )
}

function BoxAno({ ano, aberto, onToggle }) {
  return (
    <div className="ano-bloco">
      <div className={'ano-head' + (aberto ? ' aberto' : '')} onClick={onToggle}>
        <span className="ano-chv">▶</span>
        <span className="ano-num">{ano.ano}</span>
        {ano.emCurso && <span className="ano-badge">ano em curso</span>}
        <div className="ano-mini">
          <div className="am"><div className="am-v">{fmtDur(ano.min)}</div><div className="am-l">foco total</div></div>
          <div className="am"><div className="am-v">{ano.n}</div><div className="am-l">tarefas</div></div>
          <div className="am"><div className="am-v">{ano.nMeses}</div><div className="am-l">meses c/ dados</div></div>
        </div>
        {!aberto && <span className="ano-fecho">tocar para abrir ▾</span>}
      </div>

      {aberto && (
        <div className="ano-corpo">
          {/* box-resumo do ano */}
          <div className="ano-resumo">
            <div className="ar-tit">📅 Retrato de {ano.ano}{ano.emCurso ? ' (até agora)' : ''}</div>
            <div className="ar-grid">
              <div className="ar-kpi"><div className="v">{fmtDur(ano.min)}</div><div className="l">tempo de foco</div><div className="ar-selo"><span className="clock">⏱</span>{fmtDur(ano.media)}/tarefa</div></div>
              <div className="ar-kpi"><div className="v">{ano.n}</div><div className="l">tarefas fechadas</div><div className="ar-selo">~{Math.round(ano.n / (ano.nMeses || 1))}/mês</div></div>
              <div className="ar-kpi"><div className="v">{ano.dominante ? Math.round(ano.dominante.pct) + '%' : '—'}</div><div className="l">{ano.dominante ? ano.dominante.lab.toLowerCase() : 'sem natureza'}</div></div>
              <div className="ar-kpi"><div className="v">{ano.prio.urgente.n + ano.prio.importante.n}</div><div className="l">urgentes + importantes</div></div>
            </div>
            <div className="ar-cols">
              <div>
                <div className="ar-sub">naturezas-mãe</div>
                <div className="ar-natbar">
                  {ano.cats.filter((c) => c.min > 0).map((c) => (
                    <div key={c.key} className="ar-natseg" style={{ width: c.pct + '%', background: c.cor }} title={c.lab}>{c.pct >= 14 ? c.lab.split(' ')[c.lab.split(' ').length - 1] + ' ' + Math.round(c.pct) + '%' : ''}</div>
                  ))}
                </div>
                <div className="ar-sub" style={{ marginTop: 14 }}>tags de tipo — o ano todo</div>
                <div className="tags-mini">
                  {ano.tags.slice(0, 7).map((t) => (
                    <div key={t.key} className="tagm"><span className="tagm-dot" style={{ background: corTag(t.key) }} /><span className="tagm-lab">{labTag(t.key)}</span><span className="tagm-pct">{Math.round(t.pct)}%</span></div>
                  ))}
                </div>
              </div>
              <div>
                <div className="ar-sub">prioridade — número e %</div>
                <div className="prio-row">
                  <div className="prio"><span className="prio-dot" style={{ background: 'var(--red)' }} /><span className="prio-lab">Urgentes</span><div className="prio-track"><div className="prio-fill" style={{ width: ano.prio.urgente.pct + '%', background: 'var(--red)' }} /></div><span className="prio-val"><b>{ano.prio.urgente.n}</b> · {Math.round(ano.prio.urgente.pct)}%</span></div>
                  <div className="prio"><span className="prio-dot" style={{ background: 'var(--mustard)' }} /><span className="prio-lab">Importantes</span><div className="prio-track"><div className="prio-fill" style={{ width: ano.prio.importante.pct + '%', background: 'var(--mustard)' }} /></div><span className="prio-val"><b>{ano.prio.importante.n}</b> · {Math.round(ano.prio.importante.pct)}%</span></div>
                  <div className="prio"><span className="prio-dot" style={{ background: 'var(--faint)' }} /><span className="prio-lab">Normais</span><div className="prio-track"><div className="prio-fill" style={{ width: ano.prio.normal.pct + '%', background: 'var(--faint)' }} /></div><span className="prio-val"><b>{ano.prio.normal.n}</b> · {Math.round(ano.prio.normal.pct)}%</span></div>
                </div>
                {(ano.maisAgitado || ano.maisCalmo) && (
                  <div className="ar-extremos">
                    {ano.maisAgitado && <><div className="ar-sub" style={{ marginBottom: 6 }}>mês mais agitado</div><div className="ar-ext-v">{ano.maisAgitado.nome} <span>· {ano.maisAgitado.n} tarefas</span></div></>}
                    {ano.maisCalmo && ano.maisCalmo !== ano.maisAgitado && <><div className="ar-sub" style={{ margin: '10px 0 6px' }}>mês mais calmo</div><div className="ar-ext-v">{ano.maisCalmo.nome} <span>· {ano.maisCalmo.n} tarefas</span></div></>}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* grelha de meses */}
          <div className="meses-tit">os meses de {ano.ano}</div>
          <div className="meses-grid">
            {ano.meses.map((m) => <BoxMes key={m.idx} mes={m} />)}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Historico({ feitas }) {
  const { anos, anoAtual } = useMemo(() => historico(feitas), [feitas])
  const [abertos, setAbertos] = useState(() => new Set([anoAtual]))
  const toggle = (ano) => setAbertos((s) => { const n = new Set(s); n.has(ano) ? n.delete(ano) : n.add(ano); return n })

  if (!anos.length) {
    return <div className="hist-vazio">O histórico começa a preencher-se assim que fechares tarefas. Cada mês ganha a sua box.</div>
  }

  return (
    <div className="historico">
      {anos.map((ano) => (
        <BoxAno key={ano.ano} ano={ano} aberto={abertos.has(ano.ano)} onToggle={() => toggle(ano.ano)} />
      ))}
    </div>
  )
}
