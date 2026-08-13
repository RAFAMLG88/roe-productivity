// ── ROE: Observatório — evolução no tempo + padrões profundos ──
// Reconstruído do zero: tendências (semana vs. anterior vs. média histórica),
// ritmo & hábitos, comparativos. Sem grafos de inferência — só tempos e %.
import React, { useMemo } from 'react'
import {
  tendenciaSemanal, serieSemanas, horasDeOuro, porDiaSemana,
  consistencia, planeadoVsReal, precisaoSemanas, tuVsEquipa, fmtDur,
} from '../lib/analytics.js'
import { LegendaChave } from './analytics-ui.jsx'
import { catCor } from '../lib/categorias.js'

// KPI com barra da semana + marca da média histórica
function KpiTendencia({ lab, valorTxt, atual, anterior, media, antTxt, corBarra, inverso }) {
  // escala: max entre atual, anterior e média, com folga
  const escala = Math.max(atual, anterior, media, 1) * 1.15
  const largAtual = Math.min(100, atual / escala * 100)
  const posMarca = Math.min(100, media / escala * 100)
  // acima/abaixo da média (inverso: menos é melhor, ex. reativo)
  const acima = atual >= media
  const bom = inverso ? !acima : acima
  const delta = media > 0 ? Math.round((atual - media) / media * 100) : 0
  const seta = acima ? '▲' : '▼'
  return (
    <div className="trend">
      <div className="tr-lab">{lab}</div>
      <div className="tr-val">{valorTxt}</div>
      <div className="tr-track">
        <div className="tr-fill" style={{ width: largAtual + '%', background: corBarra }} />
        <div className="tr-mark" style={{ left: posMarca + '%' }} />
      </div>
      <div className="tr-foot">
        <span className="tr-vs-sem">sem. ant. {antTxt}</span>
        <span className={'tr-vs-med ' + (bom ? 'acima' : 'abaixo')}>{seta} {Math.abs(delta)}% vs. média</span>
      </div>
    </div>
  )
}

// sparkline simples a partir de valores (null = sem dados)
function Sparkline({ valores, media, cor, metaLabel, altura = 150 }) {
  const vals = valores.filter((v) => v != null)
  if (vals.length < 2) return <div className="spark-vazio">Aparece com mais semanas de dados.</div>
  const max = Math.max(...vals, media || 0) * 1.1 || 1
  const W = 400, H = altura
  const pts = valores.map((v, i) => {
    const x = 10 + i / (valores.length - 1) * (W - 20)
    const y = v == null ? null : H - 15 - (v / max) * (H - 40)
    return { x, y }
  }).filter((p) => p.y != null)
  const linha = pts.map((p) => `${p.x},${p.y}`).join(' ')
  const yMedia = media != null ? H - 15 - (media / max) * (H - 40) : null
  const ultimo = pts[pts.length - 1]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%' }}>
      {yMedia != null && <line x1="10" y1={yMedia} x2={W - 10} y2={yMedia} stroke="var(--ink)" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.5" />}
      {yMedia != null && metaLabel && <text x="14" y={yMedia - 4} fontSize="8" fontFamily="monospace" fill="var(--soft)">{metaLabel}</text>}
      <polyline points={linha} fill="none" stroke={cor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {ultimo && <circle cx={ultimo.x} cy={ultimo.y} r="5" fill={cor} />}
    </svg>
  )
}

export default function Observatorio({ feitas, meuId }) {
  const tend = useMemo(() => tendenciaSemanal(feitas), [feitas])
  const serie = useMemo(() => serieSemanas(feitas, 8), [feitas])
  const horas = useMemo(() => horasDeOuro(feitas), [feitas])
  const dias = useMemo(() => porDiaSemana(feitas), [feitas])
  const consist = useMemo(() => consistencia(feitas, 14), [feitas])
  const pvr = useMemo(() => planeadoVsReal(feitas), [feitas])
  const precSem = useMemo(() => precisaoSemanas(feitas, 8), [feitas])

  const maxNat = Math.max(...tend.porNatureza.flatMap((n) => [n.atual, n.anterior]), 1)

  return (
    <div className="obs2">
      <LegendaChave comMarca />

      {/* ═══ Família 1 · Tendências ═══ */}
      <div className="fam-tit"><span className="fam-ic" style={{ background: 'var(--sky-soft)' }}>📈</span><span className="tt">Tendências no tempo</span></div>

      <div className="pgrid">
        <div className="panel wide">
          <div className="pt"><span className="pico" style={{ background: 'var(--sky-soft)' }}>🔀</span>Esta semana — face à anterior e à tua média</div>
          <div className="trend-grid">
            <KpiTendencia lab="Tempo de foco" valorTxt={fmtDur(tend.foco.atual)} atual={tend.foco.atual} anterior={tend.foco.anterior} media={tend.foco.media} antTxt={fmtDur(tend.foco.anterior)} corBarra="var(--sky)" />
            <KpiTendencia lab="Tarefas fechadas" valorTxt={tend.tarefas.atual} atual={tend.tarefas.atual} anterior={tend.tarefas.anterior} media={tend.tarefas.media} antTxt={tend.tarefas.anterior} corBarra="var(--forest)" />
            <KpiTendencia lab="Média / tarefa" valorTxt={fmtDur(tend.mediaTarefa.atual)} atual={tend.mediaTarefa.atual} anterior={tend.mediaTarefa.anterior} media={tend.mediaTarefa.media} antTxt={fmtDur(tend.mediaTarefa.anterior)} corBarra="var(--mustard)" inverso />
            <KpiTendencia lab="Trabalho reativo" valorTxt={Math.round(tend.reativo.atual) + '%'} atual={tend.reativo.atual} anterior={tend.reativo.anterior} media={tend.reativo.media} antTxt={Math.round(tend.reativo.anterior) + '%'} corBarra="var(--red)" inverso />
          </div>
        </div>
      </div>

      <div className="pgrid" style={{ marginTop: 14 }}>
        <div className="panel">
          <div className="pt"><span className="pico" style={{ background: 'var(--forest-soft)' }}>📊</span>Tempo por natureza — semana vs. anterior</div>
          {tend.porNatureza.map((n) => (
            <div key={n.key} className="cmp-row">
              <span className="cmp-lab">{n.lab}</span>
              <div className="cmp-bars">
                <div className="cmp-b"><span className="cmp-tag">agora</span><div className="cmp-b-track"><div className="cmp-b-fill" style={{ width: (n.atual / maxNat * 100) + '%', background: n.cor }} /></div><span className="cmp-b-val">{fmtDur(n.atual)}</span></div>
                <div className="cmp-b"><span className="cmp-tag">sem. ant.</span><div className="cmp-b-track"><div className="cmp-b-fill" style={{ width: (n.anterior / maxNat * 100) + '%', background: n.cor, opacity: 0.4 }} /></div><span className="cmp-b-val">{fmtDur(n.anterior)}</span></div>
              </div>
            </div>
          ))}
        </div>
        <div className="panel">
          <div className="pt"><span className="pico" style={{ background: 'var(--mustard-soft)' }}>🗓</span>Últimas 8 semanas · foco</div>
          <div className="spark-wrap">
            <Sparkline valores={serie.pontos.map((p) => p.min)} media={serie.media} cor="var(--sky)" metaLabel={'média ' + fmtDur(serie.media)} />
          </div>
          <div className="spark-lbls"><span>−7sem</span><span>−5</span><span>−3</span><span>−1</span><span>agora</span></div>
        </div>
      </div>

      {/* ═══ Família 2 · Ritmo & hábitos ═══ */}
      <div className="fam-tit"><span className="fam-ic" style={{ background: 'var(--mustard-soft)' }}>⚡</span><span className="tt">Ritmo & hábitos</span></div>

      <div className="pgrid">
        <div className="panel">
          <div className="pt"><span className="pico" style={{ background: 'var(--mustard-soft)' }}>🕐</span>As tuas horas de ouro</div>
          {!horas.temDados ? <div className="vazio-nota">Conclui tarefas ao longo do dia para veres o teu pico.</div> : (
            <>
              <div className="horas">
                {horas.bins.slice(horas.de, horas.ate + 1).map((v, i) => {
                  const h = horas.de + i
                  const alt = horas.max > 0 ? (v / horas.max * 100) : 0
                  const cor = h === horas.pico ? 'var(--forest)' : (v >= horas.max * 0.75 ? 'var(--amber)' : 'var(--mustard)')
                  return <div key={h} className="hora-col"><div className="hora-bar"><div className="hora-fill" style={{ height: alt + '%', background: cor }} /></div><div className="hora-h">{h}</div></div>
                })}
              </div>
              <div className="obs-nota">Pico às <b style={{ color: 'var(--forest-ink)' }}>{horas.pico}h</b></div>
            </>
          )}
        </div>
        <div className="panel">
          <div className="pt"><span className="pico" style={{ background: 'var(--forest-soft)' }}>🔥</span>Consistência · últimos 14 dias</div>
          <div className="heat">
            {consist.cels.map((n, i) => (
              <div key={i} className="heat-cell" style={n > 0 ? { background: 'var(--forest)', opacity: 0.25 + Math.min(0.75, n / consist.max * 0.75) } : {}} />
            ))}
          </div>
          <div className="heat-lbls"><span>há 14 dias</span><span>hoje</span></div>
          <div className="heat-stats">
            <div><div className="hs-v" style={{ color: 'var(--forest-ink)' }}>{consist.ativos}</div><div className="hs-l">dias ativos de {consist.nDias}</div></div>
            <div><div className="hs-v">{consist.streak}</div><div className="hs-l">dias seguidos</div></div>
            <div><div className="hs-v">{consist.mediaAtivo.toFixed(1)}</div><div className="hs-l">tarefas/dia ativo</div></div>
          </div>
        </div>
      </div>

      <div className="pgrid" style={{ marginTop: 14 }}>
        <div className="panel">
          <div className="pt"><span className="pico" style={{ background: 'var(--sky-soft)' }}>📅</span>Rendimento por dia da semana</div>
          {!dias.temDados ? <div className="vazio-nota">Sem dados suficientes ainda.</div> : (
            <>
              <div className="horas" style={{ height: 100 }}>
                {dias.dias.slice(0, 5).map((v, i) => {
                  const alt = dias.max > 0 ? (v / dias.max * 100) : 0
                  const cor = dias.nomes[i] === dias.melhor ? 'var(--forest)' : 'var(--sky)'
                  return <div key={i} className="hora-col"><div className="hora-bar"><div className="hora-fill" style={{ height: alt + '%', background: cor }} /></div><div className="hora-h">{dias.nomes[i]}</div></div>
                })}
              </div>
              <div className="obs-nota">Mais forte à <b style={{ color: 'var(--forest-ink)' }}>{dias.melhor === '4ª' ? 'quarta' : dias.melhor}</b></div>
            </>
          )}
        </div>
        <div className="panel">
          <div className="pt"><span className="pico" style={{ background: 'var(--red-soft)' }}>⚖️</span>Planeado vs. real</div>
          {!pvr ? <div className="vazio-nota">Precisa de tarefas com tempo estimado e real.</div> : (
            <div className="ring-duo">
              <div className="ring">
                <svg viewBox="0 0 42 42" width="110" height="110">
                  <circle cx="21" cy="21" r="15.9" fill="none" stroke="var(--cream-2)" strokeWidth="7" />
                  <circle cx="21" cy="21" r="15.9" fill="none" stroke="var(--forest)" strokeWidth="7" strokeDasharray={`${Math.round(pvr.pctDentro)} ${100 - Math.round(pvr.pctDentro)}`} strokeDashoffset="25" strokeLinecap="round" />
                </svg>
                <div className="ring-c"><div className="ring-big" style={{ color: 'var(--forest-ink)' }}>{Math.round(pvr.pctDentro)}%</div><div className="ring-l">NO ALVO</div></div>
              </div>
              <div className="ring-info">
                <b>{Math.round(pvr.pctDentro)}%</b> dentro da estimativa · {pvr.desvioMin >= 0 ? 'excedes' : 'poupas'} <b style={{ color: pvr.desvioMin >= 0 ? 'var(--red-ink)' : 'var(--forest-ink)' }}>{fmtDur(Math.abs(pvr.desvioMin))}</b>/tarefa
                <div style={{ marginTop: 8 }}><span className="selo"><span className="clock">⏱</span>estimado {fmtDur(pvr.estMedia)}/tarefa</span></div>
                <div style={{ marginTop: 6 }}><span className="selo"><span className="clock">⏱</span>real {fmtDur(pvr.realMedia)}/tarefa</span></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ Família 3 · Comparativos ═══ */}
      <div className="fam-tit"><span className="fam-ic" style={{ background: '#F3EEFE' }}>🆚</span><span className="tt">Comparativos</span></div>

      <div className="pgrid">
        <div className="panel">
          <div className="pt"><span className="pico" style={{ background: 'var(--forest-soft)' }}>📉</span>Precisão da estimativa · 8 semanas</div>
          <div className="spark-wrap" style={{ height: 120 }}>
            <Sparkline valores={precSem} media={85} cor="var(--forest)" metaLabel="meta 85%" altura={120} />
          </div>
          <div className="spark-lbls"><span>−7sem</span><span>−5</span><span>−3</span><span>−1</span><span>agora</span></div>
        </div>
        <div className="panel">
          <div className="pt"><span className="pico" style={{ background: '#F3EEFE' }}>👥</span>Tu vs. a média da equipa</div>
          <div className="vazio-nota">Este espelho aparece quando a equipa registar tempos nas tarefas. Sem ranking — só a tua posição face à média.</div>
        </div>
      </div>
    </div>
  )
}
