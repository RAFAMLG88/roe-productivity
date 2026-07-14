import React, { useState, useEffect, useRef } from 'react'
import './Foco.css'
import { useRoe } from '../state/RoeContext.jsx'

const C = { much: '#00C865', half: '#FFCE0A', low: '#FF1F3D' }
const CIRC = 829, R = 132

const IcoOlho = () => (
  <svg viewBox="0 0 48 48" fill="none" className="care-svg">
    <path className="eye-lid" d="M6 24 C13 13, 35 13, 42 24 C35 35, 13 35, 6 24 Z" stroke="#FF1F3D" strokeWidth="3" fill="#FFF0F2"/>
    <circle className="eye-iris" cx="24" cy="24" r="7.5" fill="#FF1F3D"/>
    <circle cx="26.5" cy="21.5" r="2.2" fill="#fff"/>
  </svg>
)
const IcoRespira = () => (
  <svg viewBox="0 0 48 48" fill="none" className="care-svg">
    <circle className="br-ring r1" cx="24" cy="24" r="9" stroke="#1FB8E0" strokeWidth="3"/>
    <circle className="br-ring r2" cx="24" cy="24" r="15" stroke="#1FB8E0" strokeWidth="2" opacity=".45"/>
    <circle className="br-ring r3" cx="24" cy="24" r="20" stroke="#1FB8E0" strokeWidth="1.5" opacity=".2"/>
    <circle cx="24" cy="24" r="3.5" fill="#1FB8E0"/>
  </svg>
)
const IcoPostura = () => (
  <svg viewBox="0 0 48 48" fill="none" className="care-svg">
    <circle cx="24" cy="10" r="5" fill="#FFCE0A"/>
    <path className="spine" d="M24 16 L24 32" stroke="#FFCE0A" strokeWidth="4" strokeLinecap="round"/>
    <path d="M24 20 L15 26 M24 20 L33 26" stroke="#FFCE0A" strokeWidth="3.5" strokeLinecap="round"/>
    <path d="M24 32 L17 42 M24 32 L31 42" stroke="#FFCE0A" strokeWidth="3.5" strokeLinecap="round"/>
  </svg>
)
const IcoGota = ({ nivel }) => (
  <svg viewBox="0 0 48 48" fill="none" className="care-svg">
    <defs><clipPath id="gclip"><path d="M24 5 C24 5, 38 22, 38 31 A14 14 0 0 1 10 31 C10 22, 24 5, 24 5 Z"/></clipPath></defs>
    <path d="M24 5 C24 5, 38 22, 38 31 A14 14 0 0 1 10 31 C10 22, 24 5, 24 5 Z" stroke="#00C865" strokeWidth="3" fill="#EBFCF3"/>
    <rect className="water-fill" x="8" y={45 - nivel * 4.5} width="32" height="40" fill="#00C865" opacity=".75" clipPath="url(#gclip)"/>
  </svg>
)

// converter URL colada em URL de embed oficial
function ytEmbed(url) {
  try {
    const u = new URL(url.trim())
    let id = '', list = u.searchParams.get('list') || ''
    if (u.hostname.includes('youtu.be')) id = u.pathname.slice(1)
    else if (u.pathname.startsWith('/watch')) id = u.searchParams.get('v') || ''
    else if (u.pathname.startsWith('/embed/')) id = u.pathname.split('/embed/')[1]
    else if (u.pathname.startsWith('/playlist') && list) return `https://www.youtube-nocookie.com/embed/videoseries?list=${list}`
    if (!id) return null
    return `https://www.youtube-nocookie.com/embed/${id}${list ? `?list=${list}` : ''}`
  } catch { return null }
}
function spEmbed(url) {
  try {
    const u = new URL(url.trim())
    if (!u.hostname.includes('spotify.com')) return null
    const parts = u.pathname.split('/').filter(Boolean) // [tipo, id]
    const tipos = ['track', 'playlist', 'album', 'artist', 'show', 'episode']
    let tipo = parts[0] === 'intl-pt' ? parts[1] : parts[0]
    let id = parts[0] === 'intl-pt' ? parts[2] : parts[1]
    if (!tipos.includes(tipo) || !id) return null
    return `https://open.spotify.com/embed/${tipo}/${id}`
  } catch { return null }
}

const SUGESTOES = {
  yt: [
    { n: 'Lofi radio', u: 'https://www.youtube.com/watch?v=jfKfPfyJRdk' },
    { n: 'Piano calmo', u: 'https://www.youtube.com/watch?v=sAcj8me7wGI' },
  ],
  sp: [
    { n: 'Deep Focus', u: 'https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ' },
    { n: 'Peaceful Piano', u: 'https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO' },
  ],
}

export default function Foco({ onNavigate }) {
  const { eleitas, concluir, agua, addAgua, removeAgua, intencao, media, setMediaUrl, mediaTitle, setMediaTitulo } = useRoe()

  const [taskId, setTaskId] = useState(null)
  const task = eleitas.find((t) => t.id === taskId) || null
  const [secs, setSecs] = useState(0)
  const [total, setTotal] = useState(0)
  const [running, setRunning] = useState(false)

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

  const iniciar = (t) => { const m = t.min * 60; setTaskId(t.id); setSecs(m); setTotal(m); setRunning(true) }
  const concluirTask = () => {
    if (!task) return
    setCelebrate(true); setTimeout(spawnSparks, 30)
    const id = task.id
    setTimeout(() => {
      setCelebrate(false); concluir(id); setRunning(false); setSecs(0); setTotal(0)
      if (onNavigate) onNavigate('cidade3d') // direto à cidade 3D: a grua ergue o edifício
    }, 2600)
  }

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
  const [vistaFeito, setVistaFeito] = useState(false)
  const eyeTimer = useRef(null)
  const endEye = () => { clearInterval(eyeTimer.current); setEyeShow(false); setVistaFeito(true); setTimeout(() => setVistaFeito(false), 4000) }
  const startEye = () => { let n = 20; setEyeCnt(20); setEyeShow(true); clearInterval(eyeTimer.current); eyeTimer.current = setInterval(() => { n--; setEyeCnt(n); if (n <= 0) endEye() }, 1000) }

  const [breathShow, setBreathShow] = useState(false)
  const [breathPhase, setBreathPhase] = useState('inspira')
  const breathTimer = useRef(null)
  const startBreath = () => {
    setBreathShow(true)
    const cycle = ['inspira', 'segura', 'expira', 'segura']
    let i = 0; setBreathPhase(cycle[0])
    clearInterval(breathTimer.current)
    breathTimer.current = setInterval(() => { i = (i + 1) % 4; setBreathPhase(cycle[i]) }, 4000)
  }
  const endBreath = () => { clearInterval(breathTimer.current); setBreathShow(false) }

  const [postura, setPostura] = useState(false)
  const togglePostura = () => { setPostura(true); setTimeout(() => setPostura(false), 4000) }

  // PLAYER DE MÚSICA (embed oficial dentro da app)
  const [fonte, setFonte] = useState('yt')
  const [urlInput, setUrlInput] = useState('')
  const [urlErro, setUrlErro] = useState('')
  const embedUrl = fonte === 'yt' ? (media.yt ? ytEmbed(media.yt) : null) : fonte === 'sp' ? (media.sp ? spEmbed(media.sp) : null) : null

  const carregar = (url) => {
    const u = url !== undefined ? url : urlInput
    const emb = fonte === 'yt' ? ytEmbed(u) : spEmbed(u)
    if (!emb) { setUrlErro(fonte === 'yt' ? 'Cola um link válido do YouTube.' : 'Cola um link válido do Spotify.'); return }
    setUrlErro('')
    setMediaUrl(fonte, u)
    setUrlInput('')
    // título via oEmbed oficial (sem contas); se falhar, fica o nome da fonte
    const sug = SUGESTOES[fonte].find((x) => x.u === u)
    if (sug) { setMediaTitulo(fonte, sug.n); return }
    const oe = fonte === 'yt'
      ? `https://www.youtube.com/oembed?url=${encodeURIComponent(u)}&format=json`
      : `https://open.spotify.com/oembed?url=${encodeURIComponent(u)}`
    fetch(oe).then((r) => r.json()).then((j) => { if (j && j.title) setMediaTitulo(fonte, j.title) }).catch(() => {})
  }
  const limpar = () => { setMediaUrl(fonte, ''); setUrlErro('') }

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
  const auraCol = task ? col : '#ADA590'

  return (
    <div className={`foco ${dim ? 'dim' : ''}`}>
      <div className="aurora" style={{ background: `radial-gradient(circle, ${auraCol} 0%, rgba(0,0,0,0) 62%)`, opacity: dim ? 0.22 : (task ? 0.15 : 0.05) }} />
      <div className="topbar">
        <div><div className="l1">{task ? 'Em foco · a decorrer' : 'Foco · pronto quando estiveres'}</div><div className="l2">{task ? 'Em foco' : 'Foco'}</div></div>
        <div className="now" style={{ color: task ? col : 'var(--soft)' }}><span className="pulse" style={{ background: task ? col : 'var(--faint)' }} /><span>{nowTxt}</span></div>
      </div>

      <div className="canvas">
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
                  <div className="fe-t">Nada eleito para hoje.</div>
                  <div className="fe-s">Vai ao Escritório eleger tarefas — aparecem aqui para focares.</div>
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
            <div className="pt" style={{ marginBottom: 9 }}><span className="pico" style={{ background: 'var(--forest-soft)' }}>🌿</span>Cuidar de ti</div>
            <div className="care-grid">
              <button className={`care-tile vista ${vistaFeito ? 'ok' : ''}`} onClick={startEye}>
                <IcoOlho />
                <div className="ct-body">
                  <div className="ct-t">Descanso de vista</div>
                  <div className="ct-s">{vistaFeito ? 'feito ✓' : '20-20-20 · 20 seg'}</div>
                </div>
              </button>
              <button className="care-tile breath" onClick={startBreath}>
                <IcoRespira />
                <div className="ct-body">
                  <div className="ct-t">Respirar</div>
                  <div className="ct-s">caixa 4-4-4</div>
                </div>
              </button>
              <button className={`care-tile postura ${postura ? 'ok' : ''}`} onClick={togglePostura}>
                <IcoPostura />
                <div className="ct-body">
                  <div className="ct-t">Postura</div>
                  <div className="ct-s">{postura ? 'endireitado ✓' : 'costas direitas'}</div>
                </div>
              </button>
              <div className="care-tile agua">
                <IcoGota nivel={agua} />
                <div className="ct-body">
                  <div className="ct-t">Hidratação</div>
                  <div className="ct-agua">
                    <button className="agua-btn" onClick={removeAgua} disabled={agua === 0}>−</button>
                    <span className="agua-n">{agua}<small>/8</small></span>
                    <button className="agua-btn mais" onClick={addAgua} disabled={agua === 8}>+</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col mid">
          <div className="ring-zone" style={{ position: "relative" }}>
          {task && [0,1,2,3,4,5].map((i) => (
            <span key={i} className="fx-dot" style={{ background: col, left: `${18 + i * 13}%`, bottom: '18%', animationDelay: `${i * 0.9}s` }} />
          ))}

            <div className="ring-wrap">
              <svg width="310" height="310" viewBox="0 0 310 310">
                <g>{ticks}</g>
                <circle cx="155" cy="155" r="132" fill="none" stroke="#E6DCC8" strokeWidth="17" />
                {task && <circle className="ring-glow" cx="155" cy="155" r="132" fill="none" stroke={col} strokeWidth="30" strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - frac)} />}
                {task && <circle className="ring-prog" cx="155" cy="155" r="132" fill="none" stroke={col} strokeWidth="17" strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - frac)} style={{ color: col }} />}
              </svg>
              {task && <div className="orbit" style={{ left: 'calc(50% - 6px)', top: 'calc(50% - 6px)', transform: `translate(${Math.cos(orbitAng) * R}px,${Math.sin(orbitAng) * R}px)`, background: col }} />}
              <div className="ring-center">
                {task ? (<><div className="time" style={{ color: timeCol }}>{timeStr}</div><div className="est">de ~{task.min} min</div></>)
                       : (<><div className="time idle">--:--</div><div className="est">escolhe uma tarefa à esquerda</div></>)}
              </div>
            </div>
          </div>
          {(mediaTitle.yt || mediaTitle.sp || media.yt || media.sp) && (
            <div className="now-playing">
              <span className="eq"><b /><b /><b /></span>
              <span className="np-t">{mediaTitle.yt || mediaTitle.sp || 'A tua música'}</span>
              <span className="np-s">· {media.yt ? 'YouTube' : 'Spotify'}</span>
            </div>
          )}
          {task && (
            <div className="mid-cta">
              <button className="cta ghost" onClick={() => setRunning((r) => !r)}>{running ? 'Pausar' : 'Retomar'}</button>
              <button className="cta primary" onClick={concluirTask}>Concluir ✓</button>
            </div>
          )}
        </div>

        <div className="col right">
          <div className="panel player enter">
            <div className="pt"><span className="pico" style={{ background: 'var(--mustard-soft)' }}>🎵</span>A tocar agora <span style={{ marginLeft: 'auto', fontSize: 8, fontFamily: 'var(--font-mono)', color: 'var(--faint)' }}>TOCA AQUI DENTRO</span></div>
            <div className="src-tabs">
              <button className={`srct ${fonte === 'yt' ? 'on' : ''}`} onClick={() => { setFonte('yt'); setUrlErro('') }}><span className="si">🔴</span>YouTube</button>
              <button className={`srct ${fonte === 'sp' ? 'on' : ''}`} onClick={() => { setFonte('sp'); setUrlErro('') }}><span className="si">🟢</span>Spotify</button>
              <button className={`srct off ${fonte === 'sys' ? 'on' : ''}`} onClick={() => { setFonte('sys'); setUrlErro('') }}><span className="si">🖥️</span>Sistema</button>
            </div>

            {fonte === 'sys' ? (
              <div className="sys-note">
                <div className="sn-t">Controlo do áudio do PC</div>
                <div className="sn-s">Os browsers não deixam uma página web controlar o som do sistema — é uma proteção deles. Chega na <b>Fase 2</b>, com a app de desktop. Usa YouTube ou Spotify aqui dentro.</div>
              </div>
            ) : embedUrl ? (
              <div className="player-live">
                <iframe
                  key={embedUrl}
                  src={embedUrl}
                  title="Player de música"
                  className={fonte === 'yt' ? 'pl-yt' : 'pl-sp'}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  frameBorder="0"
                />
                <button className="pl-trocar" onClick={limpar}>↻ trocar música</button>
              </div>
            ) : (
              <div className="player-setup">
                <input
                  className="pl-input" type="text" value={urlInput}
                  placeholder={fonte === 'yt' ? 'Cola um link do YouTube (vídeo ou playlist)' : 'Cola um link do Spotify (playlist, álbum…)'}
                  onChange={(e) => { setUrlInput(e.target.value); setUrlErro('') }}
                  onKeyDown={(e) => { if (e.key === 'Enter') carregar() }}
                />
                <button className="pl-btn" onClick={() => carregar()}>Tocar ▶</button>
                {urlErro && <div className="pl-erro">{urlErro}</div>}
                <div className="pl-sug">
                  <span>ou experimenta:</span>
                  {SUGESTOES[fonte].map((s) => (
                    <button key={s.n} className="pl-chip" onClick={() => carregar(s.u)}>{s.n}</button>
                  ))}
                </div>
              </div>
            )}
            <div className="hint">A tua música, o teu gosto — cola o link e ela <b>toca dentro da app</b>, com os controlos oficiais do player.</div>
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
        <div className="mt">Tarefa concluída!</div>
        <div className="ms">a caminho da ROE City — vê o teu edifício a nascer</div>
      </div>
    </div>
  )
}
