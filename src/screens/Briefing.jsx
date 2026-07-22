import React, { useState, useMemo, useRef } from 'react'
import './Briefing.css'
import { dataLonga, saudacao, semanaUtil } from '../utils/datas.js'
import { useRoe, PRI_PESO } from '../state/RoeContext.jsx'

const CAP = 420, SCALE = 480  // dia de trabalho: 7h; barra até 8h
const TIPO_META = {
  interno:  { ic: '👤', cls: 'chefe',  nome: 'interno' },
  telefone: { ic: '✆',  cls: 'tel',    nome: 'telefone' },
  obra:     { ic: '🏗', cls: 'obra',   nome: 'obra' },
  outros:   { ic: '📌', cls: 'ideia',  nome: 'outros' },
  ficheiro: { ic: '📧', cls: 'email',  nome: 'email' },
}

import { fmtMin as fmt } from '../utils/formato.js'

const fmtEntrada = (ts) => {
  const d = new Date(ts), agora = new Date()
  const hm = d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
  if (d.toDateString() === agora.toDateString()) return 'hoje ' + hm
  const ontem = new Date(agora); ontem.setDate(ontem.getDate() - 1)
  if (d.toDateString() === ontem.toDateString()) return 'ontem ' + hm
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' }) + ' ' + hm
}
const diasDesde = (ts) => Math.floor((Date.now() - ts) / 86400000)

export default function Briefing({ onNavigate }) {
  const { fila, eleitas, eleger, paraFila, diaComecou, setDiaComecou, colegas, delegadas, delegar, equipaPorId, perfil, ultimaVisita, pedirNotificacoes, agenda } = useRoe()
  const [novidadesFechadas, setNovidadesFechadas] = useState(false)
  const delegadasFeitasDesde = ultimaVisita ? delegadas.filter((t) => t.estado === 'feita' && (t.feitaEm || 0) > ultimaVisita) : []
  const [permNotif, setPermNotif] = useState(() => (typeof Notification !== 'undefined' ? Notification.permission : 'default'))
  const [delegAberta, setDelegAberta] = useState(null) // tarefa da fila com o seletor de colega aberto
  const now = new Date()
  const week = useMemo(() => semanaUtil(now), [])
  const [showSunrise, setShowSunrise] = useState(false)
  const sunriseRef = useRef(null)

  const n = eleitas.length
  const min = eleitas.reduce((s, t) => s + t.min, 0)

  const verdict = useMemo(() => {
    if (min === 0) return { fill: 'var(--forest)', color: 'var(--soft)', text: 'Elege tarefas da fila para veres se cabem nas tuas 7h de trabalho.' }
    if (min <= 300) return { fill: 'var(--forest)', color: 'var(--forest-ink)', text: <><b>Vai dar.</b> Dia com espaço para respirar e absorver imprevistos.</> }
    if (min <= CAP) return { fill: 'var(--mustard)', color: 'var(--mustard-ink)', text: <><b>No limite das 7h.</b> Dá, mas sem margem para imprevistos.</> }
    return { fill: 'var(--red)', color: 'var(--red-ink)', text: <><b>Acima das 7h de trabalho.</b> Corta ou devolve à fila — o importante merece espaço.</>, warn: true }
  }, [min])

  // ── SUGESTÃO ROE: organizar o dia nas 7h por prioridade ──
  const sugestao = useMemo(() => {
    const pool = [...eleitas, ...fila]
    if (pool.length === 0) return null
    const ord = [...pool].sort((a, b) => {
      const pa = PRI_PESO[a.prioridade || 'normal'], pb = PRI_PESO[b.prioridade || 'normal']
      if (pa !== pb) return pa - pb
      return a.criadaEm - b.criadaEm
    })
    const dentro = [], fora = []
    let acc = 0
    ord.forEach((t) => { if (acc + t.min <= CAP) { dentro.push(t); acc += t.min } else fora.push(t) })
    return { dentro, fora, total: acc }
  }, [eleitas, fila])

  const aplicarSugestao = () => {
    if (!sugestao) return
    const ids = new Set(sugestao.dentro.map((t) => t.id))
    eleitas.forEach((t) => { if (!ids.has(t.id)) paraFila(t.id) })
    sugestao.dentro.forEach((t) => { if (t.estado !== 'eleita') eleger(t.id) })
  }

  const startDay = () => {
    if (diaComecou) { if (onNavigate) onNavigate('foco'); return }
    setDiaComecou(true)
    if (n === 0) return
    setShowSunrise(true)
    setTimeout(() => spawnRays(), 50)
    // depois do ritual, direto ao Foco
    setTimeout(() => { setShowSunrise(false); if (onNavigate) onNavigate('foco') }, 2600)
  }
  const spawnRays = () => {
    const el = sunriseRef.current; if (!el) return
    const cx = window.innerWidth / 2, cy = window.innerHeight / 2
    for (let i = 0; i < 16; i++) {
      const r = document.createElement('div')
      r.style.cssText = `position:absolute;width:4px;height:60px;background:linear-gradient(var(--mustard),transparent);opacity:0;transform-origin:bottom center;left:${cx}px;top:${cy - 60}px;z-index:-1`
      const ang = (i / 16) * 360; el.appendChild(r)
      r.animate([{ opacity: 0, transform: `translateX(-50%) rotate(${ang}deg) scaleY(.3)` }, { opacity: .7, transform: `translateX(-50%) rotate(${ang}deg) scaleY(1)` }, { opacity: 0, transform: `translateX(-50%) rotate(${ang}deg) scaleY(1.3)` }], { duration: 1700, delay: 600, easing: 'ease-out' })
      setTimeout(() => r.remove(), 2400)
    }
  }

  return (
    <div className="briefing">
      <div className="topbar">
        <div>
          <div className="l1">{dataLonga(now)} · {saudacao(now)}</div>
          <div className="l2">Escritório</div>
        </div>
        <div className="week">
          {week.map((w, i) => (
            <div key={i} className={`wd ${w.today ? 'today' : ''}`}>
              <div className="d1">{w.d1}</div><div className="d2">{w.d2}</div><div className="dd" />
            </div>
          ))}
        </div>
      </div>

      <div className="canvas">
        <div className="col">
          {(() => {
            if (novidadesFechadas || !ultimaVisita) return null
            const recebidas = fila.filter((t) => (t.delegadaPor || t.criadaPor) !== perfil?.id && (t.delegadaEm || t.criadaEm) > ultimaVisita)
            const d0 = new Date(); const hojeI = d0.getFullYear() + '-' + String(d0.getMonth() + 1).padStart(2, '0') + '-' + String(d0.getDate()).padStart(2, '0')
            const d1 = new Date(d0); d1.setDate(d1.getDate() + 1)
            const amanhaI = d1.getFullYear() + '-' + String(d1.getMonth() + 1).padStart(2, '0') + '-' + String(d1.getDate()).padStart(2, '0')
            const externosNovos = (agenda || []).filter((b) => b.userId !== perfil?.id && (b.dia === hojeI || b.dia === amanhaI))
            const concluidas = delegadasFeitasDesde
            const nR = recebidas.length, nC = concluidas.length
            const nE = externosNovos.length
            if (nR === 0 && nC === 0 && nE === 0) return null
            const horas = Math.round((Date.now() - ultimaVisita) / 3600000)
            const ausencia = horas < 1 ? 'na última hora' : horas < 24 ? 'desde há ' + horas + 'h' : 'desde há ' + Math.round(horas / 24) + ' dia' + (horas >= 48 ? 's' : '')
            return (
              <div className="panel novidades enter">
                <div className="pt">
                  <span className="pico" style={{ background: 'var(--mustard-soft)' }}>🔔</span>
                  Enquanto estiveste fora
                  <span className="nv-quando">{ausencia}</span>
                  <button className="nv-x" title="dispensar" onClick={() => setNovidadesFechadas(true)}>✕</button>
                </div>
                {nR > 0 && (
                  <div className="nv-linha">
                    <span className="nv-n">{nR}</span>
                    <div className="nv-b">
                      <div className="nv-t">tarefa{nR > 1 ? 's' : ''} delegada{nR > 1 ? 's' : ''} para ti</div>
                      <div className="nv-s">{recebidas.slice(0, 3).map((t) => ((equipaPorId[t.delegadaPor || t.criadaPor] || {}).nome || 'colega').split(' ')[0]).filter((v, i, a) => a.indexOf(v) === i).join(', ')}</div>
                    </div>
                  </div>
                )}
                {nC > 0 && (
                  <div className="nv-linha">
                    <span className="nv-n verde">{nC}</span>
                    <div className="nv-b">
                      <div className="nv-t">que delegaste, concluída{nC > 1 ? 's' : ''} ✓</div>
                      <div className="nv-s">{concluidas.slice(0, 3).map((t) => ((equipaPorId[t.ownerId] || {}).nome || 'colega').split(' ')[0]).filter((v, i, a) => a.indexOf(v) === i).join(', ')}</div>
                    </div>
                  </div>
                )}
                {nE > 0 && (
                  <div className="nv-linha">
                    <span className="nv-n sky">{nE}</span>
                    <div className="nv-b">
                      <div className="nv-t">colega{nE > 1 ? 's' : ''} em trabalho externo hoje/amanhã</div>
                      <div className="nv-s">{externosNovos.slice(0, 3).map((b) => ((equipaPorId[b.userId] || {}).nome || 'colega').split(' ')[0] + ' ' + (b.dia === hojeI ? '' : 'amanhã ') + b.inicio).join(' · ')}</div>
                    </div>
                  </div>
                )}
                {permNotif === 'default' && (
                  <button className="nv-perm" onClick={async () => setPermNotif(await pedirNotificacoes())}>
                    🔔 avisar-me no Windows quando me delegarem algo
                  </button>
                )}
              </div>
            )
          })()}
          <div className="panel load enter">
            <div className="pt"><span className="pico" style={{ background: 'var(--forest-soft)' }}>⚖️</span>Peso do dia</div>
            <div className="lt">
              <span className="big" style={{ color: min === 0 ? 'var(--soft)' : verdict.color }}>{fmt(min)}</span>
              <span className="u">de 7h eleitos</span>
            </div>
            <div className="track">
              <div className="inner"><div className="fill" style={{ width: Math.min(min / SCALE * 100, 100) + '%', background: verdict.fill }} /></div>
              <div className="cap" />
            </div>
            <div className="verdict" style={{ color: verdict.color }}>{verdict.text}</div>
          </div>

          <div className="bloco-eleicao">
            <div className="lab"><span className="lab-t">Eleição de hoje</span><span className="cnt">{n} escolhida{n === 1 ? '' : 's'} · {fmt(min)}</span></div>
            {eleitas.length === 0 ? (
              <div className="empty grande">
                <svg width="54" height="54" viewBox="0 0 100 100" style={{ opacity: .35 }}>
                  <circle cx="50" cy="50" r="34" fill="none" stroke="#ADA590" strokeWidth="6" strokeDasharray="10 9" />
                  <circle cx="50" cy="50" r="8" fill="#ADA590" />
                </svg>
                <div className="empty-t">O teu dia ainda está em branco.</div>
                <div className="empty-s">Elege da fila em baixo, ou captura algo novo.</div>
              </div>
            ) : (
              <div className="picks">
                {eleitas.map((p) => {
                  const m = TIPO_META[p.tipo] || TIPO_META.outros
                  return (
                    <div key={p.id} className={`pick tp-${m.cls}`}>
                      <div className="pk-ic">{m.ic}</div>
                      <div className="body">
                        <div className="a">{p.texto}</div>
                        <div className="b">
                          <span className={`badge-pri ${p.prioridade || 'normal'}`}>{(p.prioridade || 'normal')}</span>
                          <span className="badge-tipo">{m.nome}</span>
                          <span className="badge-min">~{p.min} min</span>
                        </div>
                      </div>
                      <button className="pk-back" title="Devolver à fila" onClick={() => paraFila(p.id)}>↓ fila</button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="panel waiting enter" style={{ animationDelay: '.15s' }}>
            <div className="pt">
              <span className="pico" style={{ background: 'var(--sky-soft)' }}>🕰</span>Na fila
              {fila.length > 0 && <span className="fila-count">{fila.length} em espera</span>}
            </div>
            {fila.length === 0 ? (
              <div className="empty small">
                <div className="empty-s">Nada em espera. O que capturares aparece aqui, pronto a eleger.</div>
              </div>
            ) : (
              <div className="wait-list">
                {fila.map((q) => {
                  const m = TIPO_META[q.tipo] || TIPO_META.outros
                  return (
                    <div key={q.id} className={`wt tp-${m.cls} ${delegAberta === q.id ? 'com-deleg' : ''} ${diasDesde(q.criadaEm) >= 3 ? 'antiga' : ''}`}>
                      <div className="wt-linha">
                        <div className="wt-ic">{m.ic}</div>
                        <div className="wt-body">
                          <div className="wt-t">{q.texto}</div>
                          <div className="wt-meta">
                            <span className={`badge-pri ${q.prioridade || 'normal'}`}>{(q.prioridade || 'normal')}</span>
                            <span className="badge-tipo">{m.nome}</span>
                            <span className="badge-min">~{q.min} min</span>
                            {(() => { const de = q.delegadaPor || q.criadaPor; return de && perfil && de !== perfil.id ? (
                              <span className="badge-de" style={{ background: (equipaPorId[de] || {}).cor || 'var(--soft)' }}>
                                de {((equipaPorId[de] || {}).nome || 'colega').split(' ')[0]}
                              </span>
                            ) : null })()}
                            <span className="badge-idade" title="entrada na fila">{fmtEntrada(q.criadaEm)}</span>
                            {diasDesde(q.criadaEm) >= 3 && <span className="badge-velha">⚠ há {diasDesde(q.criadaEm)} dias</span>}
                          </div>
                        </div>
                        {colegas.length > 0 && (
                          <button className={'dgm ' + (delegAberta === q.id ? 'on' : '')} title="delegar a um colega"
                            onClick={() => setDelegAberta(delegAberta === q.id ? null : q.id)}>🤝</button>
                        )}
                        <button className="up" onClick={() => eleger(q.id)}>↑ eleger</button>
                      </div>
                      {delegAberta === q.id && (
                        <div className="dg-exp">
                          <span className="dg-exp-lab">entregar a</span>
                          {colegas.map((c) => (
                            <button key={c.id} className="dg-exp-chip" onClick={() => { delegar(q.id, c.id); setDelegAberta(null) }}>
                              <span className="dg-exp-av" style={{ background: c.cor }}>{c.nome.trim().charAt(0).toUpperCase()}</span>
                              {c.nome.split(' ')[0]}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="col">

          <button className={`ricta topo ${verdict.warn ? 'warn' : ''}`} disabled={n === 0 && !diaComecou} onClick={startDay}>
            {diaComecou ? 'Continuar dia →' : 'Começar o dia'}
            <span className="s">{diaComecou ? 'de volta ao foco' : n === 0 ? 'elege ao menos uma' : `${n} importante${n > 1 ? 's' : ''} · ~${fmt(min)}${min > CAP ? ' · demasiado' : ''}`}</span>
          </button>

          <div className="panel sugestao enter" style={{ animationDelay: '.1s' }}>
            <div className="pt"><span className="pico" style={{ background: 'var(--mustard-soft)' }}>✨</span>Sugestão ROE</div>
            {!sugestao ? (
              <div className="sug-empty">Captura tarefas e eu organizo-te o dia — urgentes primeiro, dentro das 7h.</div>
            ) : (
              <>
                <div className="sug-head">Nas tuas 7h cabem <b>{sugestao.dentro.length}</b> de {sugestao.dentro.length + sugestao.fora.length} tarefas ({fmt(sugestao.total)}):</div>
                <div className="sug-list">
                  {sugestao.dentro.slice(0, 6).map((t, i) => (
                    <div key={t.id} className={`sug-item pri-${t.prioridade || 'normal'}`}>
                      <span className="sg-n">{i + 1}</span>
                      <span className="sg-t">{t.texto}</span>
                      <span className="sg-m">~{t.min}m</span>
                    </div>
                  ))}
                  {sugestao.dentro.length > 6 && <div className="sug-mais">+ {sugestao.dentro.length - 6} mais</div>}
                </div>
                {sugestao.fora.length > 0 && <div className="sug-fora">{sugestao.fora.length} fica{sugestao.fora.length > 1 ? 'm' : ''} na fila para outro dia — o dia não estica.</div>}
                <button className="sug-aplicar" onClick={aplicarSugestao}>Aplicar sugestão ✨</button>
              </>
            )}
          </div>

          <div className="panel delega enter" style={{ animationDelay: '.22s' }}>
            <div className="pt"><span className="pico" style={{ background: 'var(--mustard-soft)' }}>🤝</span>Tarefas delegadas{(() => { const a = delegadas.filter((t) => t.estado !== 'feita'); return a.length > 0 ? <span className="dl-cnt">{a.length} ativa{a.length === 1 ? '' : 's'}</span> : null })()}</div>
            {(() => {
              const ativas = delegadas.filter((t) => t.estado !== 'feita')
                .sort((a, b) => (b.delegadaEm || 0) - (a.delegadaEm || 0))
              if (ativas.length === 0) return (
                <div className="dg-note">nada delegado em aberto — usa o 🤝 em qualquer tarefa da fila para entregar a um colega</div>
              )
              return (
                <div className="dl-list">
                  {ativas.map((t) => {
                    const dono = equipaPorId[t.ownerId] || {}
                    return (
                      <div key={t.id} className="dl-item">
                        <span className="dl-av" style={{ background: dono.cor || 'var(--faint)' }}>{(dono.nome || '?').trim().charAt(0).toUpperCase()}</span>
                        <div className="dl-corpo">
                          <div className="dl-tx">{t.texto}</div>
                          <div className="dl-meta">
                            <span className="dl-nome" style={{ background: dono.cor || 'var(--faint)' }}>{(dono.nome || 'colega').split(' ')[0]}</span>
                            <span className="dl-quando">{t.delegadaEm ? fmtEntrada(t.delegadaEm) : '—'}</span>
                          </div>
                        </div>
                        <span className={'dl-est ' + t.estado}>{t.estado === 'eleita' ? 'no dia' : 'na fila'}</span>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>
        </div>
      </div>

      <div className={`sunrise ${showSunrise ? 'show' : ''}`} ref={sunriseRef}>
        <div className="sky" />
        <div className="sun" />
        <div className="ct">O teu dia está montado.</div>
        <div className="cs">{n} importante{n > 1 ? 's' : ''} · ~{fmt(min)}</div>
        <div className="cs" style={{marginTop:14,opacity:.7}}>a abrir o Foco…</div>
      </div>
    </div>
  )
}
