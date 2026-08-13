import React, { useState, useEffect, useMemo } from 'react'
import './Analise.css'
import { useRoe } from '../state/RoeContext.jsx'
import { supabase } from '../lib/supabase.js'
import { fmtMin } from '../utils/formato.js'
import {
  tempoPorTag, porCategoria, cruzamento, porPrioridade,
  precisaoPorTag, delegacaoPorTag, trabalhoReativo, fmtDur,
} from '../lib/analytics.js'
import { TAG_POR_KEY } from '../lib/tags.js'
import { corTag, catCor, CATEGORIAS } from '../lib/categorias.js'
import { LegendaChave, BarraTag, CartaoCategoria, LinhaCruzamento, LegendaTags } from './analytics-ui.jsx'
import Observatorio from './Observatorio.jsx'
import Historico from './Historico.jsx'

const labTag = (k) => (TAG_POR_KEY[k] ? TAG_POR_KEY[k].lab : k)
const icTag = (k) => (TAG_POR_KEY[k] ? TAG_POR_KEY[k].ic : '📌')

export default function Analise({ onNavigate }) {
  const { feitas, perfil } = useRoe()
  const [aba, setAba] = useState('resumo') // 'resumo' | 'observatorio' | 'historico'

  const temDados = feitas.length > 0

  // ── cálculos do Resumo (memoizados) ──
  const porTag = useMemo(() => tempoPorTag(feitas), [feitas])
  const cats = useMemo(() => porCategoria(feitas), [feitas])
  const cruz = useMemo(() => cruzamento(feitas), [feitas])
  const prio = useMemo(() => porPrioridade(feitas), [feitas])
  const precisao = useMemo(() => precisaoPorTag(feitas), [feitas])
  const deleg = useMemo(() => delegacaoPorTag(feitas, perfil?.id), [feitas, perfil?.id])
  const reativo = useMemo(() => trabalhoReativo(feitas), [feitas])

  const maxTagMin = porTag.length ? porTag[0].min : 1
  const maxCatMin = Math.max(...cats.map((c) => c.min), 1)
  const totalMin = feitas.reduce((s, t) => s + (t.realMin || t.min || 0), 0)
  const chavesTags = [...new Set(cruz.flatMap((c) => c.tags.map((t) => t.key)))]

  if (!temDados) {
    return (
      <div className="analise">
        <div className="topbar">
          <div><div className="l2">A tua análise</div></div>
          <div className="ana-abas">
            <button className="ana-aba on">Resumo</button>
            <button className="ana-aba" onClick={() => {}}>Observatório</button>
            <button className="ana-aba" onClick={() => {}}>Histórico</button>
          </div>
        </div>
        <div className="canvas cheia">
          <div className="empty-analise">
            <div className="ea-ic">
              <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
                <rect x="10" y="42" width="12" height="20" rx="3" fill="#E8DECB" />
                <rect x="30" y="30" width="12" height="32" rx="3" fill="#E8DECB" />
                <rect x="50" y="20" width="12" height="42" rx="3" fill="#E8DECB" />
              </svg>
            </div>
            <div className="ea-t">Ainda não há nada para analisar.</div>
            <div className="ea-s">A tua análise constrói-se à medida que concluis tarefas.</div>
            <button className="ea-cta" onClick={() => onNavigate && onNavigate('briefing')}>Ir ao Escritório organizar o dia →</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="analise">
      <div className="topbar">
        <div><div className="l2">A tua análise</div></div>
        <div className="ana-abas">
          <button className={'ana-aba ' + (aba === 'resumo' ? 'on' : '')} onClick={() => setAba('resumo')}>Resumo</button>
          <button className={'ana-aba ' + (aba === 'observatorio' ? 'on' : '')} onClick={() => setAba('observatorio')}>Observatório</button>
          <button className={'ana-aba ' + (aba === 'historico' ? 'on' : '')} onClick={() => setAba('historico')}>Histórico</button>
        </div>
      </div>

      {aba === 'observatorio' && <div className="canvas cheia"><Observatorio feitas={feitas} meuId={perfil?.id} /></div>}
      {aba === 'historico' && <div className="canvas cheia"><Historico feitas={feitas} /></div>}

      {aba === 'resumo' && (
        <div className="canvas cheia">
          <LegendaChave />

          {/* ── 1 · tempo por tipo ── */}
          <div className="sec-tit">Onde vai o teu tempo, por tipo</div>
          <div className="pgrid">
            <div className="painel-simples panel wide">
              <div className="pt"><span className="pico" style={{ background: 'var(--sky-soft)' }}>🧭</span>Tempo por tipo de trabalho<span className="pt-tag">total {fmtDur(totalMin)}</span></div>
              {porTag.length === 0 && <div className="vazio-nota">Ainda sem tarefas com tipo atribuído.</div>}
              {porTag.map((item) => <BarraTag key={item.key} item={item} max={maxTagMin} />)}
            </div>
          </div>

          {/* ── 2 · categorias-mãe ── */}
          <div className="sec-tit">Tempo por natureza de trabalho</div>
          <div className="pgrid">
            <div className="painel-simples panel wide">
              <div className="pt"><span className="pico" style={{ background: 'var(--forest-soft)' }}>🗂</span>As três naturezas</div>
              <div className="cat3">
                {cats.map((c) => <CartaoCategoria key={c.key} c={c} max={maxCatMin} />)}
              </div>
            </div>
          </div>

          {/* ── 3 · cruzamento ── */}
          <div className="sec-tit">Dentro de cada natureza, como se reparte o tempo</div>
          <div className="pgrid">
            <div className="painel-simples panel wide">
              <div className="pt"><span className="pico" style={{ background: 'var(--violet)' }}>🔀</span>Repartição por tipo, dentro de cada natureza</div>
              {cruz.map((c) => <LinhaCruzamento key={c.key} c={c} />)}
              <LegendaTags chaves={chavesTags} />
            </div>
          </div>

          {/* ── 4 · precisão + delegação ── */}
          <div className="sec-tit">Precisão da estimativa & delegação</div>
          <div className="pgrid">
            <div className="painel-simples panel">
              <div className="pt"><span className="pico" style={{ background: 'var(--mustard-soft)' }}>🎯</span>Precisão da estimativa, por tipo</div>
              {precisao.length === 0 && <div className="vazio-nota">Precisa de tarefas com tempo real e estimado.</div>}
              {precisao.slice(0, 6).map((p) => {
                const cor = corTag(p.key)
                const dm = Math.round(p.desvioMedio)
                const txt = Math.abs(dm) <= 5 ? 'no ponto · ±' + Math.abs(dm) + '%' : (dm > 0 ? 'subestimas +' + dm + '%' : 'sobrestimas ' + dm + '%')
                const larg = Math.min(100, Math.abs(dm) * 2 + 20)
                return (
                  <div key={p.key} className="tagbar">
                    <span className="tb-ic" style={{ background: cor + '22' }}>{icTag(p.key)}</span>
                    <div className="tb-body">
                      <div className="tb-top"><span className="tb-lab">{labTag(p.key)}</span><span className="tb-abs" style={{ color: cor }}>{txt}</span></div>
                      <div className="tb-track"><div className="tb-fill" style={{ width: larg + '%', background: cor }} /></div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="painel-simples panel">
              <div className="pt"><span className="pico" style={{ background: '#F3EEFE' }}>👥</span>% delegado, por tipo</div>
              {deleg.length === 0 && <div className="vazio-nota">Ainda sem tarefas delegadas registadas.</div>}
              {deleg.slice(0, 6).map((d) => {
                const cor = corTag(d.key)
                return (
                  <div key={d.key} className="tagbar">
                    <span className="tb-ic" style={{ background: cor + '22' }}>{icTag(d.key)}</span>
                    <div className="tb-body">
                      <div className="tb-top"><span className="tb-lab">{labTag(d.key)}</span><span className="tb-pct" style={{ color: cor }}>{Math.round(d.pct)}%</span></div>
                      <div className="tb-track"><div className="tb-fill" style={{ width: d.pct + '%', background: cor }} /></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── 5 · trabalho reativo ── */}
          <div className="sec-tit">Ângulos de otimização</div>
          <div className="pgrid">
            <div className="painel-simples panel">
              <div className="pt"><span className="pico" style={{ background: 'var(--red-soft)' }}>🧨</span>Peso do trabalho reativo</div>
              <div className="reativo-box">
                <div className="reativo-ring">
                  <svg viewBox="0 0 42 42" width="110" height="110">
                    <circle cx="21" cy="21" r="15.9" fill="none" stroke="var(--forest)" strokeWidth="7" />
                    <circle cx="21" cy="21" r="15.9" fill="none" stroke="var(--red)" strokeWidth="7"
                      strokeDasharray={`${Math.round(reativo.pctReativo)} ${100 - Math.round(reativo.pctReativo)}`} strokeDashoffset="25" strokeLinecap="round" />
                  </svg>
                  <div className="reativo-c"><div className="rc-v" style={{ color: 'var(--red-ink)' }}>{Math.round(reativo.pctReativo)}%</div><div className="rc-l">REATIVO</div></div>
                </div>
                <div className="reativo-txt">
                  <b>{Math.round(reativo.pctReativo)}%</b> do teu tempo foi urgências e concorrência. <b style={{ color: 'var(--forest-ink)' }}>{Math.round(reativo.pctPlaneado)}%</b> foi trabalho planeado.
                </div>
              </div>
            </div>
            <div className="painel-simples panel">
              <div className="pt"><span className="pico" style={{ background: 'var(--sky-soft)' }}>🎯</span>Tempo por natureza · fatia</div>
              <div className="risco-bar">
                {cats.filter((c) => c.min > 0).map((c) => (
                  <div key={c.key} className="risco-seg" style={{ width: c.pct + '%', background: c.cor }} title={c.lab + ' ' + Math.round(c.pct) + '%'}>
                    {c.pct >= 14 ? Math.round(c.pct) + '%' : ''}
                  </div>
                ))}
              </div>
              <div className="cruz-leg">
                {cats.filter((c) => c.min > 0).map((c) => (
                  <span key={c.key} className="cl-chip"><span className="cl-dot" style={{ background: c.cor }} />{c.lab}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
