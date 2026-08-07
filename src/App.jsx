import { useCallback, useEffect, useState } from 'react'
import { fetchAll } from './lib/store'
import { SEMANAS, semanaAtual } from './data/curso'
import Dashboard from './components/Dashboard'
import Aula from './components/Aula'
import PaginaBraco from './components/Fretboard'
import EarTrainer from './components/EarTrainer'
import Metronome from './components/Metronome'
import Progresso from './components/Progresso'
import AulaGuiada from './components/AulaGuiada'
import { LogoLockup } from './components/Logo'

const NAV = [
  { id: 'dashboard', nome: 'Dashboard' },
  { id: 'aula', nome: 'Aula da semana' },
  { id: 'braco', nome: 'Braço' },
  { id: 'ouvido', nome: 'Treino auditivo' },
  { id: 'metronomo', nome: 'Metrónomo' },
  { id: 'progresso', nome: 'Progresso' },
]

const ICONES = {
  dashboard: <><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>,
  aula: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></>,
  braco: <><path d="M3 7h18M3 12h18M3 17h18" /><path d="M8 4v16M16 4v16" /></>,
  ouvido: <path d="M3 10v4M7 6v12M11 3v18M15 8v8M19 5v14" />,
  metronomo: <><path d="M12 3 5 21h14L12 3z" /><path d="M12 13l4-6" /></>,
  progresso: <><path d="M3 17l6-6 4 4 8-8" /><path d="M15 7h6v6" /></>,
}

export default function App() {
  const [pronto, setPronto] = useState(false)
  const [vista, setVista] = useState('dashboard')
  const [dados, setDados] = useState({ progresso: [], tarefas: [], quizes: [], metro: [], desafios: [] })

  useEffect(() => { setPronto(true) }, [])

  const refresh = useCallback(() => {
    fetchAll().then(setDados).catch(console.error)
  }, [])

  useEffect(() => { refresh() }, [refresh])
  useEffect(() => {
    const h = () => refresh()
    window.addEventListener('roe-dados', h)
    return () => window.removeEventListener('roe-dados', h)
  }, [refresh])

  if (!pronto) return <div className="login-wrap"><div className="logo" style={{ fontSize: 30 }}>ROE<span> GUITAR</span></div></div>

  const uid = 'local'

  const nAtual = Math.min(semanaAtual(dados.progresso), SEMANAS[SEMANAS.length - 1].n)
  const semana = SEMANAS.find((s) => s.n === nAtual) ?? SEMANAS[SEMANAS.length - 1]
  const pctCurso = (dados.progresso.filter((p) => p.concluida).length / 48) * 100

  return (
    <div className="app">
      <aside className="sidebar">
        <LogoLockup />
        <div className="logo-sub">Curso de guitarra · 48 semanas</div>
        {NAV.map((n) => (
          <div key={n.id} className={`nav-item ${vista === n.id ? 'active' : ''}`} onClick={() => setVista(n.id)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{ICONES[n.id]}</svg>
            {n.nome}
          </div>
        ))}
        <div className="side-bottom">
          <div className="side-week"><span>SEMANA</span><b>{String(nAtual).padStart(2, '0')} / 48</b></div>
          <div className="side-bar"><i style={{ width: `${Math.max(2, pctCurso)}%` }} /></div>
        </div>
      </aside>

      <main className="main">
        {vista === 'guiada' && <AulaGuiada semana={semana} uid={uid} dados={dados} refresh={refresh} sair={() => setVista('dashboard')} />}
        {vista === 'dashboard' && <Dashboard semana={semana} uid={uid} dados={dados} refresh={refresh} irPara={setVista} />}
        {vista === 'aula' && <Aula semana={semana} uid={uid} dados={dados} refresh={refresh} />}
        {vista === 'braco' && <PaginaBraco semana={semana} />}
        {vista === 'ouvido' && (
          <div className="scr">
            <div className="scr-particles" aria-hidden="true">
              {['♪', '♫', '♩', '♬', '♪', '♫'].map((n, i) => (
                <span key={i} className={`gg-particle p${i}`} style={{ color: ['#00E0FF', '#FF2D95', '#CCFF00', '#FFB020'][i % 4] }}>{n}</span>
              ))}
            </div>
            <img src="/img/heroi-ouvido.png" alt="" className="scr-hero-img scr-hero-ouvido" aria-hidden="true" />
            <div className="scr-top"><div>
              <div className="scr-kick" style={{ color: '#00E0FF' }}>◆ Pilar Ouvido</div>
              <h1 className="scr-title">Treino auditivo</h1>
              <p className="scr-sub">O quiz muda com a semana. Regra inegociável: canta as notas antes de responder — é o canto que liga o ouvido ao braço.</p>
            </div></div>
            <div className="scr-ouvido-grid">
              <EarTrainer semana={semana} uid={uid} onSaved={refresh} />
              <div className="scr-glass">
                <div className="scr-glass-h"><h3>Histórico de sessões</h3>
                  <span className="scr-badge">{dados.quizes.length} SESSÕES</span></div>
                {dados.quizes.length === 0
                  ? <p className="scr-legenda">Sem sessões ainda. Cada sessão são poucas rondas — menos de 5 minutos.</p>
                  : dados.quizes.slice(-10).reverse().map((q, i) => (
                    <div className="scr-hist-row" key={i}>
                      <span className="scr-hist-data">{q.data} · S{String(q.semana).padStart(2, '0')}</span>
                      <span className={`scr-hist-pct ${q.corretas / q.total >= 0.8 ? 'ok' : 'low'}`}>
                        {Math.round((q.corretas / q.total) * 100)}%</span>
                    </div>
                  ))}
                {/* as 5 notas da pentatónica, pulsantes */}
                <div className="scr-notas-viz">
                  <div className="scr-notas-label">AS 5 NOTAS · LÁ MENOR</div>
                  <div className="scr-notas-row">
                    {[{ n: 'A', c: '#CCFF00', l: 'tónica' }, { n: 'C', c: '#FF5C8A', l: '3ª m' }, { n: 'D', c: '#00E0FF', l: '4ª' }, { n: 'E', c: '#00E0FF', l: '5ª' }, { n: 'G', c: '#00E0FF', l: '7ª m' }].map((x, i) => (
                      <div className="scr-nota-orb" key={i} style={{ '--nc': x.c, animationDelay: `${i * 0.25}s` }}>
                        <span className="scr-nota-n">{x.n}</span>
                        <span className="scr-nota-l">{x.l}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* visualização de onda sonora grande e animada */}
            <div className="scr-glass scr-wave-card">
              <div className="scr-glass-h"><h3>O som que estás a treinar</h3>
                <span className="scr-badge">CANTA ANTES DE RESPONDER</span></div>
              <div className="scr-soundwave">
                {Array.from({ length: 60 }, (_, i) => (
                  <span className="scr-bar" key={i} style={{ animationDelay: `${(i % 12) * 0.08}s`,
                    background: i % 3 === 0 ? '#00E0FF' : i % 3 === 1 ? '#FF2D95' : '#CCFF00' }} />
                ))}
              </div>
              <p className="scr-legenda">Cada intervalo tem uma cor própria no ouvido. Com o tempo, deixas de contar e passas a reconhecer — como reconheces uma voz ao telefone.</p>
            </div>
          </div>
        )}
        {vista === 'metronomo' && <Metronome uid={uid} sessoes={dados.metro} onSaved={refresh} />}
        {vista === 'progresso' && <Progresso dados={dados} />}
      </main>
    </div>
  )
}
