import React, { useState, useMemo, useRef } from 'react'
import './Briefing.css'
import { dataLonga, saudacao, semanaUtil } from '../utils/datas.js'
import { useRoe } from '../state/RoeContext.jsx'

const CAP = 120, SCALE = 160
const SRCMAP = { interno: 'chefe', telefone: 'tel', obra: 'email', outros: 'email', ficheiro: 'email' }

function fmt(min) {
  const h = Math.floor(min / 60), m = min % 60
  return (h > 0 ? h + 'h' : '') + (m > 0 ? (h > 0 ? String(m).padStart(2, '0') : m) + 'min' : (h > 0 ? '' : '0 min'))
}

export default function Briefing() {
  const { fila, eleitas, adicionarEleita, eleger, paraFila, apagar, intencao, setIntencao } = useRoe()
  const now = new Date()
  const week = useMemo(() => semanaUtil(now), [])
  const [novaTarefa, setNovaTarefa] = useState('')
  const [novoMin, setNovoMin] = useState(30)
  const [showSunrise, setShowSunrise] = useState(false)
  const sunriseRef = useRef(null)

  const n = eleitas.length
  const min = eleitas.reduce((s, t) => s + t.min, 0)

  const verdict = useMemo(() => {
    if (min === 0) return { fill: 'var(--forest)', color: 'var(--soft)', text: 'Elege tarefas para veres se o dia cabe no teu tempo.' }
    if (min <= 90) return { fill: 'var(--forest)', color: 'var(--forest-ink)', text: <><b>Vai dar.</b> Dia com espaço para respirar e absorver imprevistos.</> }
    if (min <= CAP) return { fill: 'var(--mustard)', color: 'var(--mustard-ink)', text: <><b>No limite.</b> Dá, mas sem margem para imprevistos.</> }
    return { fill: 'var(--red)', color: 'var(--red-ink)', text: <><b>Sobrecarregado.</b> Corta uma — o importante merece espaço, não pressa.</>, warn: true }
  }, [min])

  const addTarefa = (comoEleita) => {
    const txt = novaTarefa.trim()
    if (!txt) return
    if (comoEleita) adicionarEleita({ texto: txt, min: novoMin })
    else adicionarEleita({ texto: txt, min: novoMin, importante: false }) // vai para eleita; para fila usamos capturar
    setNovaTarefa(''); setNovoMin(30)
  }

  const startDay = () => {
    if (n === 0) return
    setShowSunrise(true)
    setTimeout(() => spawnRays(), 50)
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
    for (let i = 0; i < 22; i++) {
      const m = document.createElement('div')
      m.style.cssText = `position:absolute;width:6px;height:6px;border-radius:50%;background:var(--mustard);opacity:0;left:${30 + Math.random() * 40}%;top:${55 + Math.random() * 30}%`
      el.appendChild(m)
      m.animate([{ opacity: 0, transform: 'translateY(0) scale(.5)' }, { opacity: .8, offset: .3 }, { opacity: 0, transform: `translateY(-${80 + Math.random() * 120}px) scale(1)` }], { duration: 2400 + Math.random() * 1600, delay: 400 + Math.random() * 900, easing: 'ease-out' })
      setTimeout(() => m.remove(), 5000)
    }
  }

  return (
    <div className="briefing">
      <div className="topbar">
        <div>
          <div className="l1">{dataLonga(now)} · {saudacao(now)}</div>
          <div className="l2">O que importa hoje?</div>
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
            <div>
              <div className="q">Começa por capturar o que tens em mente.</div>
              <div className="h">Adiciona abaixo ou vai a <b>Capturar</b> — depois elege as poucas que merecem hoje.</div>
            </div>
          </div>

          <div className="panel addbar enter" style={{ animationDelay: '.08s' }}>
            <div className="pt"><span className="pico" style={{ background: 'var(--forest-soft)' }}>＋</span>Adicionar tarefa</div>
            <div className="add-row">
              <input type="text" value={novaTarefa} placeholder="O que precisas de fazer?"
                onChange={(e) => setNovaTarefa(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addTarefa(true) }} />
              <div className="min-pick"><label>~</label><input type="number" min="5" step="5" value={novoMin} onChange={(e) => setNovoMin(e.target.value)} /><span>min</span></div>
              <button className="add-btn eleger" onClick={() => addTarefa(true)}>Eleger hoje</button>
            </div>
          </div>

          <div>
            <div className="lab"><span>Eleição de hoje · toca para devolver à fila</span><span className="cnt">{n} escolhida{n === 1 ? '' : 's'}</span></div>
            {eleitas.length === 0 ? (
              <div className="empty">
                <div className="empty-ic">◎</div>
                <div className="empty-t">Ainda não elegeste nada para hoje.</div>
                <div className="empty-s">Adiciona acima, ou promove algo da fila em baixo.</div>
              </div>
            ) : (
              <div className="picks">
                {eleitas.map((p) => (
                  <div key={p.id} className={`pick src-${SRCMAP[p.tipo] || 'email'} on`}>
                    <div className="st" onClick={() => paraFila(p.id)} title="Devolver à fila"><span>✓</span></div>
                    <div className="body">
                      <div className="a">{p.texto}</div>
                      <div className="b"><span className={`src-dot dot-${SRCMAP[p.tipo] || 'email'}`} />{p.importante ? 'importante · ' : ''}~{p.min} min</div>
                    </div>
                    <button className="pick-del" title="Apagar" onClick={() => apagar(p.id)}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="panel waiting enter" style={{ animationDelay: '.15s' }}>
            <div className="pt">
              <span className="pico" style={{ background: 'var(--sky-soft)' }}>🕰</span>Na fila
              {fila.length > 0 && <span style={{ marginLeft: 'auto', fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--faint)' }}>{fila.length} em espera</span>}
            </div>
            {fila.length === 0 ? (
              <div className="empty small">
                <div className="empty-s">Nada em espera. O que capturares aparece aqui.</div>
              </div>
            ) : (
              <div className="wait-list">
                {fila.map((q) => (
                  <div key={q.id} className="wt">
                    <span className="wi">{q.tipo === 'ficheiro' ? '📧' : '＋'}</span>
                    <span className="t">{q.texto}</span>
                    <span className="e">~{q.min} min</span>
                    <button className="up" onClick={() => eleger(q.id)}>↑ eleger</button>
                    <button className="wt-del" title="Apagar" onClick={() => apagar(q.id)}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="col">
          <div className="panel load enter">
            <div className="pt"><span className="pico" style={{ background: 'var(--forest-soft)' }}>⚖️</span>Peso do dia</div>
            <div className="lt">
              <span className="big" style={{ color: min === 0 ? 'var(--soft)' : verdict.color }}>{min}</span>
              <span className="u">min eleitos · {fmt(min)}</span>
            </div>
            <div className="track">
              <div className="inner"><div className="fill" style={{ width: Math.min(min / SCALE * 100, 100) + '%', background: verdict.fill }} /></div>
              <div className="cap" />
            </div>
            <div className="verdict" style={{ color: verdict.color }}>{verdict.text}</div>
          </div>

          <div className="panel intent enter" style={{ animationDelay: '.1s' }}>
            <div className="pt"><span className="pico" style={{ background: 'var(--mustard-soft)' }}>✍️</span>Intenção do dia</div>
            <textarea value={intencao} onChange={(e) => setIntencao(e.target.value)} placeholder="Uma frase para ti. Ex: hoje fecho o orçamento sem interrupções." />
            <div className="ihint">aparece-te no ecrã de Foco, como lembrete silencioso</div>
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
        <button className="reset" onClick={() => setShowSunrise(false)}>↻ voltar</button>
      </div>
    </div>
  )
}
