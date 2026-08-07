import { useEffect, useRef, useState } from 'react'
import { PILARES, MESTRES } from '../data/curso'
import { FretSVG } from './Fretboard'
import EarTrainer from './EarTrainer'
import Diagrama from './Diagrama'
import { createMetronome, playChime } from '../lib/audio'
import { toggleTarefa, saveMetro, saveDesafio, saveProgresso } from '../lib/store'

// cor néon por pilar (estética híbrida)
const NEON = { A: '#FF2D95', B: '#00E0FF', C: '#FFB020', D: '#CCFF00' }

function TimerRing({ total, restam, cor }) {
  const R = 76, C = 2 * Math.PI * R
  const frac = total > 0 ? restam / total : 0
  const mm = String(Math.floor(restam / 60)).padStart(2, '0')
  const ss = String(restam % 60).padStart(2, '0')
  const feito = restam === 0
  return (
    <div className="gg-ring">
      <svg width="180" height="180" viewBox="0 0 180 180">
        <defs>
          <linearGradient id="ggGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={cor} /><stop offset="1" stopColor="#FF2D95" />
          </linearGradient>
          <filter id="ggGlow"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <circle cx="90" cy="90" r={R} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="10" />
        <circle cx="90" cy="90" r={R} fill="none" stroke={feito ? '#CCFF00' : 'url(#ggGrad)'} strokeWidth="10"
          strokeLinecap="round" filter="url(#ggGlow)" strokeDasharray={C} strokeDashoffset={C * (1 - frac)}
          transform="rotate(-90 90 90)" style={{ transition: 'stroke-dashoffset 1s linear' }} />
      </svg>
      <div className={`gg-ring-num ${feito ? 'done' : ''}`}>
        {feito ? '✓' : <>{mm}:{ss}<span>restam</span></>}
      </div>
    </div>
  )
}

function MetroMini({ bpmInicial, onBpm }) {
  const [bpm, setBpm] = useState(bpmInicial)
  const [aTocar, setATocar] = useState(false)
  const [beat, setBeat] = useState(-1)
  const metro = useRef(null)
  useEffect(() => {
    metro.current = createMetronome((b) => setBeat(b))
    return () => metro.current?.stop()
  }, [])
  useEffect(() => { metro.current?.setBpm(bpm); onBpm(bpm) }, [bpm, onBpm])
  const toggle = () => {
    if (aTocar) { metro.current.stop(); setATocar(false); setBeat(-1) }
    else { metro.current.start(); setATocar(true) }
  }
  return (
    <div className="gg-metro">
      <div className="gg-bpm">{bpm}<small>BPM</small></div>
      <div className="gg-beats">{[0, 1, 2, 3].map((i) => (
        <span key={i} className={`gg-beat ${beat === i ? 'on' : ''} ${i === 0 ? 'accent' : ''}`} />
      ))}</div>
      <input type="range" min="40" max="208" value={bpm} onChange={(e) => setBpm(Number(e.target.value))} className="gg-slider" />
      <div className="gg-metro-btns">
        <button className="gg-mini-btn" onClick={() => setBpm((b) => Math.max(40, b - 4))}>−4</button>
        <button className="gg-play-btn" onClick={toggle}>{aTocar ? '❚❚ Parar' : '▶ Metrónomo'}</button>
        <button className="gg-mini-btn" onClick={() => setBpm((b) => Math.min(208, b + 4))}>+4</button>
      </div>
    </div>
  )
}

export default function AulaGuiada({ semana, uid, dados, refresh, sair }) {
  const [idx, setIdx] = useState(0)
  const [fase, setFase] = useState('tarefas')
  const tarefa = semana.rotina[idx]
  const total = tarefa ? tarefa.min * 60 : 0
  const [restam, setRestam] = useState(total)
  const bpmRef = useRef(dados.metro.length ? dados.metro[dados.metro.length - 1].bpm : 80)
  const desafioGuardado = dados.desafios.find((d) => d.semana === semana.n)
  const [texto, setTexto] = useState(desafioGuardado?.texto ?? '')
  const prog = dados.progresso.find((p) => p.semana === semana.n)
  const [criterios, setCriterios] = useState(prog?.criterios ?? semana.criterios.map(() => false))
  const chimed = useRef(false)

  useEffect(() => {
    setRestam(total); chimed.current = false
    if (fase !== 'tarefas') return
    const t = setInterval(() => {
      setRestam((r) => {
        if (r <= 1) { if (!chimed.current) { chimed.current = true; playChime() } return 0 }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [idx, fase, total])

  const avancar = async () => {
    try {
      await toggleTarefa(uid, semana.n, idx, true)
      if (tarefa.pilar === 'C') await saveMetro(uid, bpmRef.current, 'aula guiada')
      if (tarefa.pilar === 'D' && texto.trim()) await saveDesafio(uid, semana.n, texto.trim())
    } catch (e) { console.error(e) }
    if (idx + 1 < semana.rotina.length) setIdx(idx + 1)
    else { setFase('avaliacao'); refresh() }
  }

  const toggleCriterio = async (i) => {
    const novos = criterios.map((c, j) => (j === i ? !c : c))
    setCriterios(novos)
    try { await saveProgresso(uid, semana.n, novos, novos.every(Boolean)) } catch (e) { console.error(e) }
  }

  const terminar = () => { playChime(); setFase('fim'); refresh() }

  // ---- FASE FIM ----
  if (fase === 'fim') {
    const todas = criterios.every(Boolean)
    return (
      <div className="gg">
        <div className="gg-fim">
          <div className="gg-fim-ico">🎸</div>
          <h2>Aula de hoje concluída</h2>
          <p>{todas
            ? `Todos os critérios acesos — a Semana ${String(semana.n + 1).padStart(2, '0')} está desbloqueada.`
            : 'Tarefas feitas. Os critérios que faltam vão amadurecendo ao longo da semana — volta amanhã.'}</p>
          <button className="gg-btn" onClick={sair}>Voltar ao Dashboard</button>
        </div>
      </div>
    )
  }

  // ---- FASE AVALIAÇÃO ----
  if (fase === 'avaliacao') {
    return (
      <div className="gg">
        <div className="gg-top">
          <div>
            <div className="gg-kick" style={{ color: '#CCFF00' }}>◆ Aula guiada · Semana {String(semana.n).padStart(2, '0')}</div>
            <h2 className="gg-title">Autoavaliação</h2>
            <p className="gg-sub">Sê honesto — repetir uma semana é progresso, não falhanço. Toca nos critérios que já dominas.</p>
          </div>
        </div>
        <div className="gg-glass" style={{ marginTop: 20 }}>
          {semana.criterios.map((c, i) => (
            <div key={i} className={`gg-crit ${criterios[i] ? 'on' : ''}`} onClick={() => toggleCriterio(i)}>
              <div className="gg-crit-chk">{criterios[i] ? '✓' : ''}</div>
              <span>{c}</span>
            </div>
          ))}
          <button className="gg-btn" style={{ marginTop: 16, width: '100%' }} onClick={terminar}>Terminar aula</button>
        </div>
      </div>
    )
  }

  // ---- FASE TAREFAS ----
  const cor = NEON[tarefa.pilar]
  return (
    <div className="gg">
      {/* partículas de notas a flutuar no fundo */}
      <div className="gg-particles" aria-hidden="true">
        {['♪', '♫', '♩', '♬', '♪', '♫', '♩', '♬'].map((n, i) => (
          <span key={i} className={`gg-particle p${i}`} style={{ color: NEON[['A', 'B', 'C', 'D'][i % 4]] }}>{n}</span>
        ))}
      </div>
      {/* número da tarefa gigante, marca-d'água */}
      <div className="gg-bignum" aria-hidden="true" style={{ color: cor }}>{idx + 1}</div>

      <div className="gg-top">
        <div>
          <div className="gg-kick" style={{ color: cor }}>
            ◆ Aula guiada · Tarefa {idx + 1} de {semana.rotina.length} · Pilar {PILARES[tarefa.pilar].nome}
          </div>
          <h2 className="gg-title">{tarefa.nome}</h2>
          <p className="gg-sub">{tarefa.sub}</p>
        </div>
        <button className="gg-exit" onClick={sair}>✕ Sair da aula</button>
      </div>

      {/* barra de progresso das tarefas */}
      <div className="gg-steps">
        {semana.rotina.map((t, i) => (
          <div key={i} className={`gg-step ${i < idx ? 'done' : ''} ${i === idx ? 'active' : ''}`}
            style={{ '--c': NEON[t.pilar] }}>
            {i === idx && <i />}
          </div>
        ))}
      </div>

      <div className="gg-body">
        {/* TIMER */}
        <div className="gg-timer-card">
          <div className="gg-timer-pilar" style={{ color: cor }}>● {PILARES[tarefa.pilar].nome}</div>
          <TimerRing total={total} restam={restam} cor={cor} />
          <div className="gg-dots">
            {semana.rotina.map((t, i) => (
              <span key={i} className={`gg-dot ${i < idx ? 'done' : ''} ${i === idx ? 'on' : ''}`}
                style={{ background: i <= idx ? NEON[t.pilar] : 'rgba(255,255,255,.1)',
                  boxShadow: i === idx ? `0 0 10px ${NEON[t.pilar]}` : 'none' }} />
            ))}
          </div>
          <button className={`gg-btn full ${restam === 0 ? 'pulse' : ''}`} onClick={avancar}>
            {idx + 1 < semana.rotina.length ? 'Concluir e avançar →' : 'Concluir → autoavaliação'}
          </button>
          {restam > 0 && <p className="gg-hint">Podes avançar antes do tempo — o timer é guia, não polícia.</p>}
        </div>

        {/* FERRAMENTA */}
        <div className="gg-tool" key={idx}>
          {tarefa.pilar === 'A' && (
            <>
              <div className="gg-tool-h"><h3>Braço — {semana.braco.titulo}</h3><span className="gg-badge" style={{ color: cor, borderColor: cor + '55' }}>CLICA PARA OUVIR</span></div>
              <FretSVG notas={semana.braco.notas} altura={185} />
              <div className="gg-fret-leg">
                <span><i style={{ background: '#CCFF00', boxShadow: '0 0 8px #CCFF00' }} />Tónica</span>
                <span><i style={{ background: '#FF5C8A' }} />3.ª menor</span>
                <span><i style={{ background: '#3EE08F' }} />Nota-cor</span>
                <span><i style={{ border: '2px solid #00E0FF' }} />Escala</span>
              </div>
              <Diagrama n={semana.n} />
            </>
          )}
          {tarefa.pilar === 'B' && <EarTrainer semana={semana} uid={uid} onSaved={refresh} />}
          {tarefa.pilar === 'C' && (
            <>
              <div className="gg-tool-h"><h3>Metrónomo</h3><span className="gg-badge" style={{ color: cor, borderColor: cor + '55' }}>SESSÃO GUARDADA AO AVANÇAR</span></div>
              <MetroMini bpmInicial={bpmRef.current} onBpm={(b) => (bpmRef.current = b)} />
            </>
          )}
          {tarefa.pilar === 'D' && (
            <>
              <div className="gg-tool-h"><h3>Desafio criativo</h3><span className="gg-badge" style={{ color: cor, borderColor: cor + '55' }}>PILAR CRIAÇÃO</span></div>
              <p className="gg-desafio">{semana.desafio}</p>
              <textarea className="gg-textarea" rows="4" value={texto} onChange={(e) => setTexto(e.target.value)}
                placeholder="Escreve aqui (notas, tom, ritmo...) — guarda-se ao avançar" />
            </>
          )}
        </div>
      </div>

      {/* FAIXA ILUSTRADA E ANIMADA */}
      <div className="gg-faixa">
        {/* onda sonora animada, colorida com o pilar */}
        <div className="gg-wave" style={{ '--wc': cor }}>
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" width="100%" height="120">
            <defs>
              <linearGradient id="waveGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#FF2D95" stopOpacity=".2" />
                <stop offset="0.5" stopColor={cor} />
                <stop offset="1" stopColor="#00E0FF" stopOpacity=".2" />
              </linearGradient>
              <filter id="waveGlow"><feGaussianBlur stdDeviation="2" /></filter>
            </defs>
            <path className="gg-wave-path" fill="none" stroke="url(#waveGrad)" strokeWidth="2.5" strokeLinecap="round"
              d="M0,60 Q50,20 100,60 T200,60 T300,60 T400,60 T500,60 T600,60 T700,60 T800,60 T900,60 T1000,60 T1100,60 T1200,60" />
            <path className="gg-wave-path gg-wave-2" fill="none" stroke={cor} strokeWidth="1.5" strokeLinecap="round" opacity=".4"
              d="M0,60 Q60,90 120,60 T240,60 T360,60 T480,60 T600,60 T720,60 T840,60 T960,60 T1080,60 T1200,60" />
          </svg>
        </div>

        {/* os três mestres acompanham sempre */}
        <div className="gg-mestres-faixa">
          <div className="gg-tres-mestres">
            <span className="gg-tres-label">Os três mestres, contigo em cada tarefa</span>
            <div className="gg-tres-imgs">
              {Object.values(MESTRES).map((m) => (
                <img key={m.nome} src={m.img} alt={m.nome} className="gg-tres-img" style={{ filter: `drop-shadow(0 0 10px ${m.cor}55)` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
