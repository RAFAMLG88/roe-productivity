import React, { useState, useEffect, useMemo } from 'react'
import './Analise.css'
import { useRoe } from '../state/RoeContext.jsx'
import { supabase } from '../lib/supabase.js'
import { fmtMin, desvioMedio } from '../utils/formato.js'

const DIAS_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
const diaISO = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')

export default function Analise({ onNavigate }) {
  const { feitas, eleitas, fila, perfil } = useRoe()
  const [hist, setHist] = useState({ carregando: true, agua: [] })

  // histórico de água (as tarefas já vêm todas do contexto)
  useEffect(() => {
    if (!perfil?.id) return
    let vivo = true
    supabase.from('agua').select('dia,ml').eq('user_id', perfil.id).order('dia', { ascending: false }).limit(30)
      .then(({ data, error }) => { if (vivo) setHist({ carregando: false, agua: error ? [] : (data || []) }) })
    return () => { vivo = false }
  }, [perfil?.id])
  const temDados = feitas.length > 0

  if (!temDados) {
    return (
      <div className="analise">
        <div className="topbar">
          <div><div className="l1">O que muda a tua próxima decisão</div><div className="l2">A tua análise</div></div>
        </div>
        <div className="canvas">
          <div className="empty-analise">
            <div className="ea-ic">
              <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
                <rect x="10" y="42" width="12" height="20" rx="3" fill="#E8DECB" />
                <rect x="30" y="30" width="12" height="32" rx="3" fill="#E8DECB" />
                <rect x="50" y="20" width="12" height="42" rx="3" fill="#E8DECB" />
              </svg>
            </div>
            <div className="ea-t">Ainda não há nada para analisar.</div>
            <div className="ea-s">
              A tua análise constrói-se sozinha à medida que concluis tarefas.<br />
              Elege no Escritório, foca-te e conclui — e aqui vais ver os teus padrões.
            </div>
            <div className="ea-preview">
              <div className="eap"><span className="eap-ic">🎯</span><div><div className="eap-t">Foco no importante</div><div className="eap-s">quanto do teu tempo vai ao que interessa</div></div></div>
              <div className="eap"><span className="eap-ic">✓</span><div><div className="eap-t">Tarefas concluídas</div><div className="eap-s">o que fechaste hoje</div></div></div>
              <div className="eap"><span className="eap-ic">🏢</span><div><div className="eap-t">Cidade a crescer</div><div className="eap-s">edifícios erguidos pelo teu foco</div></div></div>
            </div>
            <button className="ea-cta" onClick={() => onNavigate && onNavigate('briefing')}>Ir ao Escritório organizar o dia →</button>
          </div>
        </div>
      </div>
    )
  }

  // com dados reais desta sessão
  const totalMin = feitas.reduce((s, t) => s + (t.realMin || t.min), 0)
  const importantes = feitas.filter((t) => t.prioridade === 'urgente' || t.prioridade === 'importante').length
  const pctImp = feitas.length > 0 ? Math.round(importantes / feitas.length * 100) : 0
  const desvio = desvioMedio(feitas)

  return (
    <div className="analise">
      <div className="topbar">
        <div><div className="l1">O que fizeste nesta sessão</div><div className="l2">A tua análise</div></div>
      </div>
      <div className="canvas cheia">
        <div className="sgrid">
          <div className="sg b enter"><div className="v">{feitas.length}</div><div className="l">tarefas concluídas</div></div>
          <div className="sg a enter" style={{ animationDelay: '.1s' }}><div className="v">{pctImp}%</div><div className="l">eram importantes</div></div>
          <div className="sg c enter" style={{ animationDelay: '.2s' }}><div className="v">{fmtMin(totalMin)}</div><div className="l">de foco real</div></div>
          <div className="sg d enter" style={{ animationDelay: '.3s' }}><div className="v">{desvio.n > 0 ? (desvio.avg > 0 ? `+${desvio.avg}m` : desvio.avg < 0 ? `−${Math.abs(desvio.avg)}m` : '±0m') : '—'}</div><div className="l">desvio ao previsto</div></div>
        </div>

        <div className="painel-simples panel enter" style={{ animationDelay: '.3s' }}>
          <div className="pt"><span className="pico" style={{ background: 'var(--forest-soft)' }}>✓</span>Concluídas nesta sessão</div>
          <div className="feitas-list">
            {[...feitas].reverse().map((t) => (
              <div key={t.id} className="feita-row">
                <span className="fr-check">✓</span>
                <span className="fr-txt">{t.texto}</span>
                {(t.prioridade === 'urgente' || t.prioridade === 'importante') && <span className="fr-imp">{t.prioridade}</span>}
                <span className="fr-min">{t.realMin ? `${fmtMin(t.realMin)} · previa ${fmtMin(t.min)}` : `~${fmtMin(t.min)}`}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="painel-simples panel enter" style={{ animationDelay: '.4s' }}>
          <div className="pt"><span className="pico" style={{ background: 'var(--sky-soft)' }}>📊</span>Estado de hoje</div>
          <div className="estado-row"><span>Eleitas por fazer</span><b>{eleitas.length}</b></div>
          <div className="estado-row"><span>Na fila</span><b>{fila.length}</b></div>
          <div className="estado-row"><span>Concluídas</span><b style={{ color: 'var(--forest-ink)' }}>{feitas.length}</b></div>
        </div>

        {(() => {
          // ── HISTÓRICO: tudo o que já acumulaste na base de dados ──
          const comHora = feitas.filter((t) => t.feitaEm)
          if (comHora.length < 3) return (
            <div className="painel-simples panel enter" style={{ animationDelay: '.5s' }}>
              <div className="pt"><span className="pico" style={{ background: 'var(--mustard-soft)' }}>📈</span>Histórico</div>
              <div className="hist-vazio">Conclui mais algumas tarefas e aqui nascem os teus padrões: prime time, ritmo dos últimos 14 dias e onde vai o teu tempo.</div>
            </div>
          )

          // prime time: 4 faixas do dia
          const FAIXAS = [
            { k: 'manha', l: 'Manhã', h: '06–12', ini: 6, fim: 12, ic: '🌅' },
            { k: 'tarde', l: 'Tarde', h: '12–18', ini: 12, fim: 18, ic: '☀️' },
            { k: 'noite', l: 'Noite', h: '18–24', ini: 18, fim: 24, ic: '🌆' },
            { k: 'madrug', l: 'Madrugada', h: '00–06', ini: 0, fim: 6, ic: '🌙' },
          ]
          const porFaixa = FAIXAS.map((f) => ({
            ...f, n: comHora.filter((t) => { const h = new Date(t.feitaEm).getHours(); return h >= f.ini && h < f.fim }).length,
          }))
          const maxFaixa = Math.max(1, ...porFaixa.map((f) => f.n))
          const prime = [...porFaixa].sort((a, b) => b.n - a.n)[0]

          // últimos 14 dias
          const hoje = new Date()
          const dias = Array.from({ length: 14 }, (_, i) => {
            const d = new Date(hoje); d.setDate(d.getDate() - (13 - i))
            const iso = diaISO(d)
            const doDia = comHora.filter((t) => diaISO(new Date(t.feitaEm)) === iso)
            return { d, iso, n: doDia.length, min: doDia.reduce((s, t) => s + (t.realMin || t.min), 0) }
          })
          const maxDia = Math.max(1, ...dias.map((x) => x.n))
          const totalDias = dias.filter((x) => x.n > 0).length
          const mediaDia = totalDias > 0 ? (dias.reduce((s, x) => s + x.n, 0) / totalDias).toFixed(1) : '0'

          // onde vai o tempo (por tipo)
          const TIPO_L = { interno: 'Pedidos internos', telefone: 'Telefone', obra: 'Obra', outros: 'Outros', ficheiro: 'Email' }
          const porTipo = Object.entries(comHora.reduce((m, t) => { const k = t.tipo || 'outros'; m[k] = (m[k] || 0) + (t.realMin || t.min); return m }, {}))
            .sort((a, b) => b[1] - a[1])
          const totalTipo = porTipo.reduce((s, [, v]) => s + v, 0) || 1

          const aguaOk = hist.agua.filter((a) => (a.ml || 0) >= 2000).length

          return (
            <>
              <div className="painel-simples panel enter" style={{ animationDelay: '.5s' }}>
                <div className="pt"><span className="pico" style={{ background: 'var(--mustard-soft)' }}>⏰</span>O teu prime time
                  <span className="hist-tag">{prime.ic} {prime.l}</span>
                </div>
                <div className="pt-faixas">
                  {porFaixa.map((f) => (
                    <div key={f.k} className={'ptf ' + (f.k === prime.k ? 'on' : '')}>
                      <div className="ptf-bar"><div className="ptf-fill" style={{ height: Math.round(f.n / maxFaixa * 100) + '%' }} /></div>
                      <div className="ptf-n">{f.n}</div>
                      <div className="ptf-l">{f.l}</div>
                      <div className="ptf-h">{f.h}</div>
                    </div>
                  ))}
                </div>
                <div className="hist-nota">Concluis mais {prime.l.toLowerCase()} ({prime.h}h) — elege aí o que exige cabeça fresca.</div>
              </div>

              <div className="painel-simples panel enter" style={{ animationDelay: '.55s' }}>
                <div className="pt"><span className="pico" style={{ background: 'var(--forest-soft)' }}>📅</span>Últimos 14 dias
                  <span className="hist-tag">{mediaDia}/dia ativo</span>
                </div>
                <div className="hist-barras">
                  {dias.map((x) => (
                    <div key={x.iso} className="hb" title={x.n + ' tarefa' + (x.n === 1 ? '' : 's') + ' · ' + fmtMin(x.min)}>
                      <div className="hb-col"><div className="hb-fill" style={{ height: Math.max(x.n > 0 ? 8 : 2, Math.round(x.n / maxDia * 100)) + '%', opacity: x.n > 0 ? 1 : .3 }} /></div>
                      <div className="hb-d">{DIAS_SEMANA[x.d.getDay()]}</div>
                      <div className="hb-n">{x.d.getDate()}</div>
                    </div>
                  ))}
                </div>
                <div className="hist-nota">{totalDias} dia{totalDias === 1 ? '' : 's'} com trabalho fechado nas últimas duas semanas.</div>
              </div>

              <div className="painel-simples panel enter" style={{ animationDelay: '.6s' }}>
                <div className="pt"><span className="pico" style={{ background: 'var(--sky-soft)' }}>🧭</span>Onde vai o teu tempo</div>
                {porTipo.map(([k, v]) => (
                  <div key={k} className="tipo-row">
                    <span className="tr-l">{TIPO_L[k] || k}</span>
                    <span className="tr-bar"><span className="tr-fill" style={{ width: Math.round(v / totalTipo * 100) + '%' }} /></span>
                    <span className="tr-v">{fmtMin(v)}</span>
                  </div>
                ))}
                {hist.agua.length > 0 && (
                  <div className="hist-agua">💧 {aguaOk} de {hist.agua.length} dias registados com 2L ou mais</div>
                )}
              </div>
            </>
          )
        })()}
      </div>
    </div>
  )
}
