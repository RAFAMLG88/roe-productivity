import React, { useState, useEffect, useRef } from 'react'
import './Foco.css'
import { useRoe } from '../state/RoeContext.jsx'

const C = { much: '#00C865', half: '#FFCE0A', low: '#FF1F3D' }
const CIRC = 829, R = 132

const SOURCES = {
  spotify: { ic: '🎧', art: 'conic-gradient(from 0deg,#1DB954,#159c44,#1DB954)', accentBar: '#1DB954', accentPlay: '#1DB954', via: 'via Spotify · no teu PC',
    list: [{ t: 'Weightless', a: 'Marconi Union', len: 489, cur: 0 }, { t: 'An Ending (Ascent)', a: 'Brian Eno', len: 263, cur: 0 }] },
  youtube: { ic: '▶️', art: 'conic-gradient(from 0deg,#FF0000,#c50000,#FF0000)', accentBar: '#FF0000', accentPlay: '#FF0000', via: 'via YouTube · separador do PC',
    list: [{ t: 'lofi hip hop radio', a: 'Lofi Girl', len: 0, cur: 0, live: true }] },
  sistema: { ic: '🖥️', art: 'conic-gradient(from 0deg,#1FB8E0,#1496C4,#1FB8E0)', accentBar: '#1FB8E0', accentPlay: '#141207', via: 'áudio do sistema · qualquer app',
    list: [{ t: 'Sem áudio a tocar', a: 'inicia música no teu PC', len: 1, cur: 0 }] },
}
const fmtS = (s) => s <= 0 ? 'AO VIVO' : Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0')

export default function Foco() {
  const { eleitas, concluir, agua, addAgua, removeAgua, intencao } = useRoe()

  // tarefa em foco: escolhida das eleitas
  const [taskId, setTaskId] = useState(null)
  const task = eleitas.find((t) => t.id === taskId) || null
  const [secs, setSecs] = useState(0)
  const [total, setTotal] = useState(0)
  const [running, setRunning] = useState(false)

  // se a tarefa em foco desaparece (concluída/apagada noutro ecrã), limpa
  useEffect(() => { if (taskId && !eleitas.find((t) => t.id === taskId)) { setTaskId(null); setRunning(false); setSecs(0); setTotal(0) } }, [eleitas, taskId])

  const frac = total > 0 ? secs / total : 1
  const col = frac > 0.5 ? C.much : frac > 0.2 ? C.half : C.low
  const nowTxt = !task ? 'sem tarefa' : frac > 0.5 ? 'muito tempo' : frac > 0.2 ? 'a meio' : 'quase a acabar!'
  const timeCol = col === C.half ? '#B89400' : col === C.low ? '#D81030' : 'var(--ink)'

  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setSecs((s) => (s > 0 ? s - 1 : s)), 1000)
    return () => clearInterval(t)
  }, [running])

  const iniciar = (t) => {
    const m = t.min * 60
    setTaskId(t.id); setSecs(m); setTotal(m); setRunning(true)
  }
  const concluirTask = () => {
    if (!task) return
    setCelebrate(true); setTimeout(spawnSparks, 30)
    const id = task.id
    setTimeout(() => { setCelebrate(false); concluir(id); setRunning(false); setSecs(0); setTotal(0) }, 3400)
  }

  // MODO SANTUÁRIO
  const [dim, setDim] = useState(false)
  useEffect(() => {
    if (!task) { setDim(false); return }
    let t
    const arm = () => { clearTimeout(t); setDim(false); t = setTimeout(() => setDim(true), 12000) }
    const evs = ['pointermove', 'keydown', 'click']
    evs.forEach((e) => window.addEventListener(e, arm)); arm()
    return () => { clearTimeout(t); evs.forEach((e) => window.removeEventListener(e, arm)) }
  }, [task])

  // CUIDAR DE TI
  const [eyeShow, setEyeShow] = useState(false)
  const [eyeCnt, setEyeCnt] = useState(20)
  const [vistaMsg, setVistaMsg] = useState('quando precisares')
  const eyeTimer = useRef(null)
  const endEye = () => { clearInterval(eyeTimer.current); setEyeShow(false); setVistaMsg('feito ✓'); setTimeout(() => setVistaMsg('quando precisares'), 3000) }
  const startEye = () => { let n = 20; setEyeCnt(20); setEyeShow(true); clearInterval(eyeTimer.current); eyeTimer.current = setInterval(() => { n--; setEyeCnt(n); if (n <= 0) endEye() }, 1000) }

  // respiração guiada
  const [breathShow, setBreathShow] = useState(false)
  const [breathPhase, setBreathPhase] = useState('inspira')
  const breathTimer = useRef(null)
  const startBreath = () => {
    setBreathShow(true)
    const cycle = ['inspira', 'segura', 'expira', 'segura']
    let i = 0
    setBreathPhase(cycle[0])
    clearInterval(breathTimer.current)
    breathTimer.current = setInterval(() => { i = (i + 1) % 4; setBreathPhase(cycle[i]) }, 4000)
  }
  const endBreath = () => { clearInterval(breathTimer.current); setBreathShow(false) }

  // postura (lembrete simples)
  const [postura, setPostura] = useState(false)

  // CONTROLADOR DE MEDIA
  const [curSrc, setCurSrc] = useState('spotify')
  const [ti, setTi] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [prog, setProg] = useState(0)
  const S = SOURCES[curSrc]; const tr = S.list[ti]
  useEffect(() => {
    if (!playing) return
    const t = setInterval(() => { setProg((p) => { if (tr.live) return p + 1; const np = p + 1; if (np >= tr.len) { setTi((i) => (i + 1) % S.list.length); return 0 } return np }) }, 1000)
    return () => clearInterval(t)
  }, [playing, curSrc, ti, tr, S])
  const switchSource = (src) => { setCurSrc(src); setTi(0); setProg(0); setPlaying(false) }
  const nextTrack = () => { setTi((i) => (i + 1) % S.list.length); setProg(0) }

  // CELEBRAÇÃO
  const [celebrate, setCelebrate] = useState(false)
  const celRef = useRef(null)
  const spawnSparks = () => {
    const el = celRef.current; if (!el) return
    const cols = [C.much, C.half, C.low, '#1FB8E0']
    const cx = window.innerWidth * 0.53, cy = window.innerHeight * 0.42
    for (let i = 0; i < 30; i++) {
      const sp = document.createElement('div')
      sp.style.cssText = `position:absolute;width:11px;height:11px;border-radius:2px;background:${cols[i % cols.length]};left:${cx}px;top:${cy}px`
      el.appendChild(sp)
      const a = Math.random() * Math.PI * 2, d = 90 + Math.random() * 160
      sp.animate([{ transform: 'translate(-50%,-50%) scale(1)', opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(a) * d}px),calc(-50% + ${Math.sin(a) * d}px)) scale(0)`, opacity: 0 }], { duration: 800 + Math.random() * 400, easing: 'cubic-bezier(.1,.7,.3,1)' })
      setTimeout(() => sp.remove(), 1250)
    }
  }

  const ticks = []
  for (let i = 0; i < 30; i++) {
    const a = i / 30 * Math.PI * 2
    const x1 = 155 + Math.cos(a) * 150, y1 = 155 + Math.sin(a) * 150
    const x2 = 155 + Math.cos(a) * (i % 5 === 0 ? 143 : 146), y2 = 155 + Math.sin(a) * (i % 5 === 0 ? 143 : 146)
    ticks.push(<line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className="tick" />)
  }
  const orbitAng = (1 - frac) * Math.PI * 2 - Math.PI / 2
  const timeStr = String(Math.floor(secs / 60)).padStart(2, '0') + ':' + String(secs % 60).padStart(2, '0')
  const porFocar = eleitas.filter((t) => t.id !== taskId)

  return (
    <div className={`foco ${dim ? 'dim' : ''}`}>
      <div className="aurora" style={{ background: task ? col : 'var(--faint)', opacity: dim ? 0.3 : (task ? undefined : 0.08) }} />
      <div className="topbar">
        <div><div className="l1">{task ? 'Em foco · a decorrer' : 'Foco · pronto quando estiveres'}</div><div className="l2">{task ? 'Em foco' : 'Foco'}</div></div>
        <div className="now" style={{ color: task ? col : 'var(--soft)' }}><span className="pulse" style={{ background: task ? col : 'var(--faint)' }} /><span>{nowTxt}</span></div>
      </div>

      <div className="canvas">
        {/* ESQUERDA */}
        <div className="col left">
          {task ? (
            <div className="panel task enter">
              <span className="tsrc">em foco agora</span>
              <div className="tt">{task.texto}</div>
              {intencao && <div className="intent-note">✍️ {intencao}</div>}
              <div className="tmeta"><span>⏱ ~{task.min} min</span></div>
            </div>
          ) : (
            <div className="panel start-card enter">
              <div className="pt"><span className="pico" style={{ background: 'var(--forest-soft)' }}>◉</span>Escolhe o que focar</div>
              {porFocar.length === 0 ? (
                <div className="foco-empty">
                  <div className="fe-ic">◎</div>
                  <div className="fe-t">Nada eleito para hoje.</div>
                  <div className="fe-s">Vai ao Briefing eleger tarefas — aparecem aqui para focares.</div>
                </div>
              ) : (
                <div className="foco-list">
                  {porFocar.map((t) => (
                    <button key={t.id} className="foco-pick" onClick={() => iniciar(t)}>
                      <div className="fp-body"><div className="fp-t">{t.texto}</div><div className="fp-s">~{t.min} min{t.importante ? ' · importante' : ''}</div></div>
                      <span className="fp-go">▶</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="panel care enter" style={{ animationDelay: '.12s' }}>
            <div className="pt"><span className="pico" style={{ background: 'var(--forest-soft)' }}>🌿</span>Cuidar de ti</div>
            <div className="care-grid">
              <button className="care-tile vista" onClick={startEye}>
                <div className="ct-ic">👁️</div>
                <div className="ct-t">Descanso de vista</div>
                <div className="ct-s">{vistaMsg}</div>
              </button>
              <button className="care-tile breath" onClick={startBreath}>
                <div className="ct-ic">🫁</div>
                <div className="ct-t">Respirar</div>
                <div className="ct-s">1 min · acalma</div>
              </button>
              <button className={`care-tile postura ${postura ? 'done' : ''}`} onClick={() => setPostura((v) => !v)}>
                <div className="ct-ic">🪑</div>
                <div className="ct-t">Postura</div>
                <div className="ct-s">{postura ? 'endireitado ✓' : 'endireita-te'}</div>
              </button>
              <div className="care-tile agua">
                <div className="ct-ic">💧</div>
                <div className="ct-t">Hidratação</div>
                <div className="ct-agua">
                  <button className="agua-btn" onClick={removeAgua} disabled={agua === 0}>−</button>
                  <div className="agua-dots">{[0,1,2,3,4,5,6,7].map((i) => <b key={i} className={i < agua ? 'on' : ''} />)}</div>
                  <button className="agua-btn" onClick={addAgua} disabled={agua === 8}>+</button>
                </div>
                <div className="ct-s">{agua} de 8 copos hoje</div>
              </div>
            </div>
          </div>
        </div>

        {/* CENTRO */}
        <div className="col mid">
          <div className="ring-zone">
            <div className="ring-wrap">
              <svg width="310" height="310" viewBox="0 0 310 310">
                <g>{ticks}</g>
                <circle cx="155" cy="155" r="132" fill="none" stroke="#E6DCC8" strokeWidth="17" />
                {task && <circle className="ring-prog" cx="155" cy="155" r="132" fill="none" stroke={col} strokeWidth="17" strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - frac)} style={{ color: col }} />}
              </svg>
              {task && <div className="orbit" style={{ left: 'calc(50% - 6px)', top: 'calc(50% - 6px)', transform: `translate(${Math.cos(orbitAng) * R}px,${Math.sin(orbitAng) * R}px)`, background: col }} />}
              <div className="ring-center">
                {task ? (<><div className="time" style={{ color: timeCol }}>{timeStr}</div><div className="est">de ~{task.min} min</div></>)
                       : (<><div className="time idle">--:--</div><div className="est">escolhe uma tarefa à esquerda</div></>)}
              </div>
            </div>
          </div>
          {task && (
            <div className="mid-cta">
              <button className="cta ghost" onClick={() => setRunning((r) => !r)}>{running ? 'Pausar' : 'Retomar'}</button>
              <button className="cta primary" onClick={concluirTask}>Concluir ✓</button>
            </div>
          )}
        </div>

        {/* DIREITA */}
        <div className="col right">
          <div className="panel media enter">
            <div className="pt"><span className="pico">🎵</span>A tocar agora <span style={{ marginLeft: 'auto', fontSize: 8, fontFamily: 'var(--font-mono)', color: 'var(--faint)' }}>CONTROLA O TEU PC</span></div>
            <div className="source-tabs">
              {Object.keys(SOURCES).map((k) => (
                <div key={k} className={`stab ${curSrc === k ? 'on' : ''}`} onClick={() => switchSource(k)}>
                  <span className="si2">{k === 'spotify' ? '🟢' : k === 'youtube' ? '🔴' : '🖥️'}</span>
                  <span className="sn">{k[0].toUpperCase() + k.slice(1)}</span>
                </div>
              ))}
            </div>
            <div className={`np ${playing ? '' : 'paused'}`}>
              <div className="cover"><div className="art" style={{ background: S.art }} /><span className="ci2">{S.ic}</span></div>
              <div className="meta"><div className="trk">{tr.t}</div><div className="art-n">{tr.a}</div><div className="via"><span className="livedot" />{S.via}</div></div>
            </div>
            <div className="m-bar"><i style={{ width: (tr.live ? 100 : (tr.len > 1 ? prog / tr.len * 100 : 0)) + '%', background: S.accentBar }} /></div>
            <div className="m-time"><span>{tr.live ? '• ao vivo' : fmtS(prog)}</span><span>{tr.live ? 'AO VIVO' : (tr.len > 1 ? fmtS(tr.len) : '--:--')}</span></div>
            <div className="m-ctrl">
              <button onClick={() => setProg(0)}>⏮</button>
              <button className="play" style={{ background: S.accentPlay }} onClick={() => setPlaying((p) => !p)}>{playing ? '⏸' : '▶'}</button>
              <button onClick={nextTrack}>⏭</button>
            </div>
            <div className="hint"><b>Controla o que já tocas</b> no PC — Spotify, YouTube ou o áudio do sistema. Sem contas, sem Premium.</div>
          </div>

          {eleitas.length > 0 && (
            <div className="panel enter" style={{ animationDelay: '.1s' }}>
              <div className="pt"><span className="pico" style={{ background: 'var(--sky-soft)' }}>📋</span>Eleitas para hoje</div>
              <div className="sess-count">{eleitas.length} tarefa{eleitas.length > 1 ? 's' : ''} · {eleitas.reduce((s,t)=>s+t.min,0)} min no total</div>
            </div>
          )}
        </div>
      </div>

      {dim && <div className="sanct-hint">modo santuário · move o rato para voltar</div>}

      <div className={`eyerest ${eyeShow ? 'show' : ''}`}>
        <div className="circ" />
        <div className="t1">Olha para longe.</div>
        <div className="t2">20 segundos · uma janela, o horizonte</div>
        <div className="cnt">{eyeCnt}</div>
        <button className="skip" onClick={endEye}>saltar</button>
      </div>

      <div className={`breathe ${breathShow ? 'show' : ''}`}>
        <div className={`breath-circle ${breathPhase}`} />
        <div className="breath-word">{breathPhase === 'inspira' ? 'Inspira…' : breathPhase === 'expira' ? 'Expira…' : 'Segura…'}</div>
        <div className="breath-hint">segue o círculo · 4 segundos cada</div>
        <button className="skip" onClick={endBreath}>terminar</button>
      </div>

      <div className={`celebrate ${celebrate ? 'show' : ''}`} ref={celRef}>
        <div className="bigcheck"><svg viewBox="0 0 50 50" fill="none"><path d="M14 25l7 7 15-15" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
        <div className="bld"><svg width="150" height="90" viewBox="0 0 150 90">
          <rect className="body-rect" x="58" y="6" width="34" height="84" rx="2" fill="#141207" />
          <g fill="#FFCE0A">{[[64,16],[80,16],[64,34],[80,34],[64,52],[80,52]].map(([x,y],i)=>(<rect key={i} className="win" style={{transitionDelay:(1.15+i*0.15)+'s'}} x={x} y={y} width="7" height="8" />))}</g>
          <rect className="body-rect" x="28" y="50" width="22" height="40" fill="#211E14" />
          <rect className="body-rect" x="100" y="60" width="20" height="30" fill="#211E14" />
        </svg></div>
        <div className="mt">Tarefa concluída!</div>
        <div className="ms">+1 edifício na tua ROE City</div>
      </div>
    </div>
  )
}
