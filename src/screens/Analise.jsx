import React from 'react'
import './Analise.css'
import { useRoe } from '../state/RoeContext.jsx'
import { fmtMin, desvioMedio } from '../utils/formato.js'

export default function Analise({ onNavigate }) {
  const { feitas, eleitas, fila } = useRoe()
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
      </div>
    </div>
  )
}
