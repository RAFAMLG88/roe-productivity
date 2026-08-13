// ── ROE: Análise de EQUIPA — espelho neutro do grupo (sem expor pessoas) ──
// Carrega on-demand todas as feitas de toda a gente e mostra o grupo como um todo:
// volume, no que gasta o tempo, pulso semanal, saúde e equilíbrio de carga.
import React, { useState, useEffect, useMemo } from 'react'
import { useRoe } from '../state/RoeContext.jsx'
import {
  equipaPanorama, equipaPulso, equipaCarga, equipaSaude, equipaEquilibrio, fmtDur,
} from '../lib/analytics.js'
import { LegendaChave, BarraTag, DonutNaturezas } from './analytics-ui.jsx'

export default function EquipaAnalise() {
  const { feitasEquipa, equipa } = useRoe()
  const [estado, setEstado] = useState({ carregando: true, feitas: [], erro: false })

  useEffect(() => {
    let vivo = true
    setEstado({ carregando: true, feitas: [], erro: false })
    feitasEquipa().then((fs) => {
      if (!vivo) return
      if (fs == null) setEstado({ carregando: false, feitas: [], erro: true })
      else setEstado({ carregando: false, feitas: fs, erro: false })
    })
    return () => { vivo = false }
  }, [feitasEquipa])

  const { carregando, feitas, erro } = estado

  const pan = useMemo(() => feitas.length ? equipaPanorama(feitas) : null, [feitas])
  const pulso = useMemo(() => feitas.length ? equipaPulso(feitas) : null, [feitas])
  const carga = useMemo(() => feitas.length ? equipaCarga(feitas) : null, [feitas])
  const saude = useMemo(() => feitas.length ? equipaSaude(feitas) : null, [feitas])
  const equil = useMemo(() => feitas.length ? equipaEquilibrio(feitas) : null, [feitas])

  if (carregando) {
    return <div className="eq-loading"><div className="eq-spin" />A reunir o trabalho de toda a equipa…</div>
  }
  if (erro) {
    return <div className="eq-vazio">Não consegui carregar os dados da equipa agora. Tenta atualizar daqui a pouco.</div>
  }
  if (!feitas.length) {
    return <div className="eq-vazio">Ainda não há tarefas concluídas na equipa. Assim que o grupo começar a fechar tarefas, o retrato coletivo aparece aqui.</div>
  }

  const maxTipoMin = carga.porTipo.length ? carga.porTipo[0].min : 1
  const nEq = equipa?.length || pan.nPessoas

  // faixa de equilíbrio → rótulo neutro
  const eqLabel = equil.equilibrio >= 80 ? 'muito equilibrada' : equil.equilibrio >= 60 ? 'equilibrada' : equil.equilibrio >= 40 ? 'alguma dispersão' : 'carga desigual'
  const eqCor = equil.equilibrio >= 60 ? 'var(--forest-ink)' : equil.equilibrio >= 40 ? 'var(--mustard-ink)' : 'var(--red-ink)'

  return (
    <div className="eq2">
      {/* panorama do grupo */}
      <div className="eq-hero">
        <div className="eq-hero-t">O grupo como um todo</div>
        <div className="eq-kpis">
          <div className="eq-k"><div className="eq-k-v">{pan.nPessoas}</div><div className="eq-k-l">pessoas ativas</div></div>
          <div className="eq-k"><div className="eq-k-v">{pan.totalTarefas}</div><div className="eq-k-l">tarefas concluídas</div></div>
          <div className="eq-k"><div className="eq-k-v">{fmtDur(pan.totalMin)}</div><div className="eq-k-l">foco somado</div></div>
          <div className="eq-k"><div className="eq-k-v">{fmtDur(pan.mediaTarefa)}</div><div className="eq-k-l">média por tarefa</div></div>
        </div>
      </div>

      <LegendaChave />

      {/* no que a equipa gasta o tempo */}
      <div className="sec-tit">No que a equipa gasta o tempo</div>
      <div className="pgrid">
        <div className="painel-simples panel">
          <div className="pt"><span className="pico" style={{ background: 'var(--sky-soft)' }}>🗂</span>Repartição por natureza</div>
          <DonutNaturezas fatias={carga.porNatureza} />
        </div>
        <div className="painel-simples panel">
          <div className="pt"><span className="pico" style={{ background: 'var(--forest-soft)' }}>🧭</span>Por tipo de trabalho</div>
          {carga.porTipo.slice(0, 6).map((item) => <BarraTag key={item.key} item={item} max={maxTipoMin} />)}
        </div>
      </div>

      {/* pulso semanal do grupo */}
      <div className="sec-tit">O pulso do grupo</div>
      <div className="pgrid">
        <div className="painel-simples panel">
          <div className="pt"><span className="pico" style={{ background: 'var(--mustard-soft)' }}>📈</span>Esta semana</div>
          <div className="eq-pulso">
            <div className="eq-p"><div className="eq-p-v">{fmtDur(pulso.foco.atual)}</div><div className="eq-p-l">foco do grupo</div><div className={'eq-p-d ' + (pulso.foco.atual >= pulso.foco.anterior ? 'up' : 'dn')}>{pulso.foco.atual >= pulso.foco.anterior ? '▲' : '▼'} vs. {fmtDur(pulso.foco.anterior)} antes</div></div>
            <div className="eq-p"><div className="eq-p-v">{pulso.tarefas.atual}</div><div className="eq-p-l">tarefas fechadas</div><div className={'eq-p-d ' + (pulso.tarefas.atual >= pulso.tarefas.anterior ? 'up' : 'dn')}>{pulso.tarefas.atual >= pulso.tarefas.anterior ? '▲' : '▼'} vs. {pulso.tarefas.anterior} antes</div></div>
            <div className="eq-p"><div className="eq-p-v">{Math.round(pulso.reativo.atual)}%</div><div className="eq-p-l">trabalho reativo</div><div className={'eq-p-d ' + (pulso.reativo.atual <= pulso.reativo.anterior ? 'up' : 'dn')}>{pulso.reativo.atual <= pulso.reativo.anterior ? '▼' : '▲'} vs. {Math.round(pulso.reativo.anterior)}% antes</div></div>
          </div>
        </div>
        <div className="painel-simples panel">
          <div className="pt"><span className="pico" style={{ background: 'var(--forest-soft)' }}>🔥</span>Ritmo coletivo · 14 dias</div>
          <div className="heat">
            {saude.consist.cels.map((n, i) => (
              <div key={i} className="heat-cell" style={n > 0 ? { background: 'var(--forest)', opacity: 0.25 + Math.min(0.75, n / saude.consist.max * 0.75) } : {}} />
            ))}
          </div>
          <div className="heat-lbls"><span>há 14 dias</span><span>hoje</span></div>
          <div className="heat-stats">
            <div><div className="hs-v" style={{ color: 'var(--forest-ink)' }}>{saude.consist.ativos}</div><div className="hs-l">dias com atividade</div></div>
            <div><div className="hs-v">{saude.pvr ? Math.round(saude.pvr.pctDentro) + '%' : '—'}</div><div className="hs-l">dentro da estimativa</div></div>
          </div>
        </div>
      </div>

      {/* equilíbrio de carga — SEM nomes */}
      <div className="sec-tit">Equilíbrio de carga</div>
      <div className="pgrid">
        <div className="painel-simples panel wide">
          <div className="pt"><span className="pico" style={{ background: 'var(--violet)' }}>⚖️</span>Como o esforço se distribui pelo grupo</div>
          <div className="eq-bal">
            <div className="eq-bal-gauge">
              <div className="eq-bal-v" style={{ color: eqCor }}>{Math.round(equil.equilibrio)}</div>
              <div className="eq-bal-l">índice de equilíbrio · <b style={{ color: eqCor }}>{eqLabel}</b></div>
              <div className="eq-bal-track"><div className="eq-bal-fill" style={{ width: equil.equilibrio + '%', background: eqCor }} /></div>
            </div>
            <div className="eq-bal-info">
              <div className="eq-bal-row"><span className="eq-bal-k">média por pessoa</span><span className="eq-bal-x">{fmtDur(equil.media)}</span></div>
              <div className="eq-bal-row"><span className="eq-bal-k">quem fez menos</span><span className="eq-bal-x">{fmtDur(equil.min)}</span></div>
              <div className="eq-bal-row"><span className="eq-bal-k">quem fez mais</span><span className="eq-bal-x">{fmtDur(equil.max)}</span></div>
            </div>
          </div>
          <div className="eq-nota-neutra">Sem nomes, de propósito — isto mostra o equilíbrio do grupo, não compara pessoas.</div>
        </div>
      </div>
    </div>
  )
}
