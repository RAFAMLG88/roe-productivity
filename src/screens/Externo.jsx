import React, { useState, useMemo } from 'react'
import { useRoe } from '../state/RoeContext.jsx'
import './Externo.css'

const iso = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
const chaveSemana = (d) => { const x = new Date(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return iso(x) }
const minutos = (h) => parseInt(h.slice(0, 2), 10) * 60 + parseInt(h.slice(3, 5), 10)

export default function Externo() {
  const { agenda, marcarExterno, apagarExterno, perfil, equipaPorId } = useRoe()
  const hoje = new Date()
  const hojeISO = iso(hoje)
  const [mesVista, setMesVista] = useState(() => new Date(hoje.getFullYear(), hoje.getMonth(), 1))
  const [diaSel, setDiaSel] = useState(hojeISO)
  const [fTexto, setFTexto] = useState('')
  const [fData, setFData] = useState(hojeISO)
  const [fIni, setFIni] = useState('14:00')
  const [fFim, setFFim] = useState('16:00')
  const [fErro, setFErro] = useState('')

  const porDia = useMemo(() => {
    const m = {}
    for (const b of agenda) { (m[b.dia] = m[b.dia] || []).push(b) }
    for (const k of Object.keys(m)) m[k].sort((a, b) => a.inicio.localeCompare(b.inicio))
    return m
  }, [agenda])

  const pessoa = (id) => equipaPorId[id] || { nome: '?', cor: 'var(--faint)' }
  const semanaHoje = chaveSemana(hoje)
  const agoraMin = hoje.getHours() * 60 + hoje.getMinutes()
  const deHoje = porDia[hojeISO] || []
  const aDecorrer = deHoje.filter((b) => minutos(b.inicio) <= agoraMin && agoraMin < minutos(b.fim))
  const proximo = deHoje.filter((b) => minutos(b.inicio) > agoraMin).slice(0, 1)
  const meus = agenda.filter((b) => b.userId === perfil?.id && b.dia >= hojeISO)
    .sort((a, b) => (a.dia + a.inicio).localeCompare(b.dia + b.inicio))

  const marcar = () => {
    setFErro('')
    if (!fTexto.trim()) { setFErro('Diz o que vais fazer — é o que a equipa vai ler.'); return }
    if (!fData || !fIni || !fFim || fFim <= fIni) { setFErro('O intervalo precisa de um fim depois do início.'); return }
    marcarExterno({ dia: fData, inicio: fIni, fim: fFim, texto: fTexto.trim() })
    setFTexto(''); setDiaSel(fData)
    if (fData.slice(0, 7) !== iso(mesVista).slice(0, 7)) setMesVista(new Date(fData + 'T12:00'))
  }

  // grelha do mês (6 semanas, seg→dom)
  const celulas = useMemo(() => {
    const primeiro = new Date(mesVista)
    const inicio = new Date(primeiro); inicio.setDate(inicio.getDate() - ((primeiro.getDay() + 6) % 7))
    return Array.from({ length: 42 }, (_, i) => { const d = new Date(inicio); d.setDate(d.getDate() + i); return d })
  }, [mesVista])

  const evsSel = porDia[diaSel] || []
  const dSel = new Date(diaSel + 'T12:00')

  return (
    <div className="externo">
      <div className="ext-head">
        <span className="ext-ic">🧭</span>
        <div>
          <h1>Trabalho externo</h1>
          <div className="ext-sub">o que se passa fora do escritório — reuniões, obras, clientes</div>
        </div>
        <div className="hoje-pill">hoje é <b>{hoje.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}</b></div>
      </div>

      <div className="ext-canvas">
        <div className="ext-col esq">
          <div className="panel p-sky">
            <div className="pt"><span className="pico" style={{ background: 'var(--sky-soft)' }}>📡</span>Agora fora do escritório</div>
            {aDecorrer.length === 0 && proximo.length === 0 && (
              <div className="ext-vazio">toda a equipa está no escritório neste momento 🏢</div>
            )}
            {aDecorrer.map((b) => (
              <div key={b.id} className="fora-card viva">
                <span className="fc-av" style={{ background: pessoa(b.userId).cor }}>{pessoa(b.userId).nome.trim().charAt(0).toUpperCase()}</span>
                <div className="fc-b">
                  <div className="fc-n">{pessoa(b.userId).nome.split(' ')[0]}<span className="fc-pill">externo</span></div>
                  <div className="fc-t">{b.texto}</div>
                  <div className="fc-h"><span className="fc-dot" />{b.inicio} – {b.fim} · a decorrer</div>
                </div>
              </div>
            ))}
            {proximo.map((b) => (
              <div key={b.id} className="fora-card prox">
                <span className="fc-av" style={{ background: pessoa(b.userId).cor }}>{pessoa(b.userId).nome.trim().charAt(0).toUpperCase()}</span>
                <div className="fc-b">
                  <div className="fc-n">{pessoa(b.userId).nome.split(' ')[0]}<span className="fc-pill cinza">às {b.inicio}</span></div>
                  <div className="fc-t">{b.texto}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="panel p-mustard">
            <div className="pt"><span className="pico" style={{ background: 'var(--mustard-soft)' }}>✈️</span>Marcar trabalho externo</div>
            <div className="f-lab">O que vais fazer</div>
            <input type="text" value={fTexto} onChange={(e) => setFTexto(e.target.value)}
              placeholder="ex.: reunião com gabinete de Arquitectura" />
            <div className="f-lab">Quando</div>
            <input type="date" value={fData} min={hojeISO} onChange={(e) => setFData(e.target.value)} />
            <div className="f-lab">Das · Até</div>
            <div className="f-row">
              <input type="time" value={fIni} onChange={(e) => setFIni(e.target.value)} />
              <input type="time" value={fFim} onChange={(e) => setFFim(e.target.value)} />
            </div>
            {fErro && <div className="f-erro">{fErro}</div>}
            <button className="marcar" onClick={marcar}>Marcar <span className="aviao">✈</span></button>
          </div>

          <div className="panel p-forest">
            <div className="pt"><span className="pico" style={{ background: 'var(--forest-soft)' }}>🗓</span>Os teus próximos blocos</div>
            {meus.length === 0 ? (
              <div className="ext-vazio">nada marcado — o teu próximo trabalho externo aparece aqui</div>
            ) : meus.map((b) => (
              <div key={b.id} className="bl">
                <span className="bl-h">{b.inicio}–{b.fim}</span>
                <span className="bl-t">{b.texto}</span>
                <span className="bl-d">{new Date(b.dia + 'T12:00').toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' })}</span>
                <button className="bl-x" title="apagar" onClick={() => apagarExterno(b.id)}>✕</button>
              </div>
            ))}
            
          </div>
        </div>

        <div className="ext-col dir">
          <div className="panel p-mustard cal-panel">
            <div className="cal-head">
              <span className="pico" style={{ background: 'var(--mustard-soft)' }}>📅</span>
              <span className="cal-mes">{mesVista.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}</span>
              <span className="sem-tag">◈ semana em vigor</span>
              <div className="cal-nav">
                <button onClick={() => setMesVista(new Date(mesVista.getFullYear(), mesVista.getMonth() - 1, 1))}>‹</button>
                <button onClick={() => setMesVista(new Date(mesVista.getFullYear(), mesVista.getMonth() + 1, 1))}>›</button>
              </div>
            </div>
            <div className="dias-sem">{['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'].map((d) => <span key={d}>{d}</span>)}</div>
            <div className="cal-grid">
              {celulas.map((d, i) => {
                const dISO = iso(d)
                const evs = porDia[dISO] || []
                const cls = ['dia',
                  d.getMonth() !== mesVista.getMonth() ? 'fora-mes' : '',
                  chaveSemana(d) === semanaHoje ? 'semana-atual' : '',
                  dISO === hojeISO ? 'hoje' : '',
                  dISO === diaSel ? 'sel' : ''].filter(Boolean).join(' ')
                return (
                  <div key={dISO} className={cls} style={{ animationDelay: (i * 9) + 'ms' }} onClick={() => setDiaSel(dISO)}>
                    <div className="d-num">{d.getDate()}</div>
                    <div className="d-evs">
                      {evs.slice(0, 2).map((e) => (
                        <span key={e.id} className="ev" style={{ background: pessoa(e.userId).cor + '1c' }}>
                          <i style={{ background: pessoa(e.userId).cor }} />{e.inicio} {pessoa(e.userId).nome.split(' ')[0]}
                        </span>
                      ))}
                      {evs.length > 2 && <span className="ev-mais">+{evs.length - 2} mais</span>}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="dia-det">
              <div className="dd-t">agenda de {dSel.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
              <div className="dd-list">
                {evsSel.length === 0
                  ? <div className="ext-vazio">ninguém tem trabalho externo neste dia</div>
                  : evsSel.map((e, ix) => (
                    <div key={e.id} className="dd-item" style={{ animationDelay: (ix * 60) + 'ms', borderLeft: '3px solid ' + pessoa(e.userId).cor }}>
                      <span className="dd-av" style={{ background: pessoa(e.userId).cor }}>{pessoa(e.userId).nome.trim().charAt(0).toUpperCase()}</span>
                      <span className="dd-tx">{e.texto}</span>
                      <span className="dd-h">{e.inicio}–{e.fim}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
