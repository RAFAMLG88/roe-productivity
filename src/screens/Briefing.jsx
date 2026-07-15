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

export default function Briefing({ onNavigate }) {
  const { fila, eleitas, eleger, paraFila } = useRoe()
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
          <div className="panel intro-card enter">
            <div className="sunny" />
            <div style={{ flex: 1 }}>
              <div className="q">Elege as poucas que merecem o teu dia.</div>
              <div className="h">O que capturares aparece na fila. <b>Toca em ↑ para eleger</b> as que contam hoje.</div>
            </div>
            <button className="go-capturar" onClick={() => onNavigate && onNavigate('capturar')}>＋ Capturar</button>
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
                    <div key={q.id} className={`wt tp-${m.cls}`}>
                      <div className="wt-ic">{m.ic}</div>
                      <div className="wt-body">
                        <div className="wt-t">{q.texto}</div>
                        <div className="wt-meta">
                          <span className={`badge-pri ${q.prioridade || 'normal'}`}>{(q.prioridade || 'normal')}</span>
                          <span className="badge-tipo">{m.nome}</span>
                          <span className="badge-min">~{q.min} min</span>
                        </div>
                      </div>
                      <button className="up" onClick={() => eleger(q.id)}>↑ eleger</button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="col">
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

          <button className={`ricta ${verdict.warn ? 'warn' : ''}`} disabled={n === 0} onClick={startDay}>
            Começar o dia
            <span className="s">{n === 0 ? 'elege ao menos uma' : `${n} importante${n > 1 ? 's' : ''} · ~${fmt(min)}${min > CAP ? ' · demasiado' : ''}`}</span>
          </button>
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
