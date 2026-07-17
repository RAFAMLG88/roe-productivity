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

// ═══ A TUA EQUIPA AGORA — presença real (Fase 2 · Etapa 5) ═══
function EquipaAgora({ colegas, presencas }) {
  const [, setTick] = useState(0)
  const alguemEmFoco = Object.values(presencas).some((q) => q && q.estado === 'foco')
  useEffect(() => {
    if (!alguemEmFoco) return
    const t = setInterval(() => setTick((x) => x + 1), 1000)
    return () => clearInterval(t)
  }, [alguemEmFoco])

  const ORD = { foco: 0, pausa: 1, livre: 2, off: 3 }
  const linhas = colegas.map((c) => {
    const q = presencas[c.id] || null
    const estado = q ? q.estado : 'off'
    let restante = null, prog = 0
    if (q && q.restante != null) {
      restante = q.estado === 'foco'
        ? Math.max(0, Math.round(q.restante - (Date.now() - q.em) / 1000))
        : Math.round(q.restante)
      const tot = Math.max(60, (q.min || 1) * 60)
      prog = Math.max(0, Math.min(1, 1 - restante / tot))
    }
    return { ...c, q, estado, restante, prog }
  }).sort((a, b) => (ORD[a.estado] ?? 3) - (ORD[b.estado] ?? 3) || a.nome.localeCompare(b.nome))

  const fmtT = (sg) => Math.floor(sg / 60) + ':' + String(sg % 60).padStart(2, '0')
  const nFoco = linhas.filter((l) => l.estado === 'foco').length
  const nOn = linhas.filter((l) => l.estado !== 'off').length

  if (colegas.length === 0) return (
    <>
      <div className="eq-vazio">Ainda estás sozinho na ROE — partilha o link e o código de convite, e a tua equipa aparece aqui, ao vivo.</div>
    </>
  )
  return (
    <>
      <div className="eq-list">
        {linhas.map((u) => (
          <div key={u.id} className={'eq-row ' + u.estado}>
            <span className="eq-av" style={{ background: u.cor }}>{u.nome.trim().charAt(0).toUpperCase()}</span>
            <div className="eq-b">
              <div className="eq-n">{u.nome.split(' ')[0]}</div>
              <div className="eq-t">
                {u.estado === 'foco' ? (u.q.tarefa || 'em foco')
                  : u.estado === 'pausa' ? 'em pausa ☕' + (u.q && u.q.tarefa ? ' · ' + u.q.tarefa : '')
                  : u.estado === 'livre' ? 'disponível'
                  : 'fora da app'}
              </div>
            </div>
            {u.estado === 'foco' && u.restante != null ? (
              <div className="eq-timer">
                <svg viewBox="0 0 30 30"><circle cx="15" cy="15" r="12" className="eqt-bg" /><circle cx="15" cy="15" r="12" className="eqt-fg" style={{ strokeDashoffset: 75.4 - 75.4 * u.prog }} /></svg>
                <span>{fmtT(u.restante)}</span>
              </div>
            ) : <span className={'eq-dot ' + u.estado} />}
          </div>
        ))}
      </div>
      <div className="eq-note">{nOn === 0 ? 'ninguém online agora' : nFoco > 0 ? nFoco + ' em foco · ' + nOn + ' online — em tempo real' : nOn + ' online — em tempo real'}</div>
    </>
  )
}

export default function Foco({ onNavigate }) {
  const { eleitas, concluir, atualizar, agua, addAgua, removeAgua, intencao, media, setMediaUrl, mediaTitle, setMediaTitulo, setPlayerAnchor, colegas, presencas, setPresenca } = useRoe()

  const [taskId, setTaskId] = useState(null)
  const task = eleitas.find((t) => t.id === taskId) || null
  const [secs, setSecs] = useState(0)
  const [esgotado, setEsgotado] = useState(false)
  const [total, setTotal] = useState(0)
  const [running, setRunning] = useState(false)

  useEffect(() => { if (taskId && !eleitas.find((t) => t.id === taskId)) { setTaskId(null); setRunning(false); setSecs(0); setTotal(0) } }, [eleitas, taskId])

  const frac = total > 0 ? secs / total : 1
  const col = frac > 0.5 ? C.much : frac > 0.2 ? C.half : C.low
  const nowTxt = !task ? 'sem tarefa' : frac > 0.5 ? 'muito tempo' : frac > 0.2 ? 'a meio' : 'quase a acabar!'
  const timeCol = col === C.half ? '#B89400' : col === C.low ? '#D81030' : 'var(--ink)'

  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setSecs((s) => {
      if (s === 1) { setEsgotado(true); setTimeout(() => playChime(), 50) }
      return s > 0 ? s - 1 : s
    }), 1000)
    return () => clearInterval(t)
  }, [running])

  // presença: publica só nas transições (iniciar/pausar/estender/concluir), nunca a cada segundo —
  // quem vê calcula o tempo localmente a partir de {restante, em}
  const secsRef = useRef(0)
  useEffect(() => { secsRef.current = secs }, [secs])
  useEffect(() => {
    if (task && running) setPresenca({ estado: 'foco', tarefa: task.texto, min: Math.round(total / 60) || task.min, restante: secsRef.current })
    else if (task) setPresenca({ estado: 'pausa', tarefa: task.texto, min: Math.round(total / 60) || task.min, restante: secsRef.current })
    else setPresenca({ estado: 'livre', tarefa: null, min: null, restante: null })
  }, [task?.id, running, total, setPresenca]) // total nas deps: +5/+15 min republicam o restante certo
  useEffect(() => () => setPresenca({ estado: 'livre', tarefa: null, min: null, restante: null }), [setPresenca])

  const iniciar = (t) => { const m = t.min * 60; setTaskId(t.id); setSecs(m); setTotal(m); setRunning(true); setEsgotado(false) }
  const concluirTask = () => {
    if (!task) return
    setCelebrate(true); setTimeout(spawnSparks, 30)
    const id = task.id
    const realMin = Math.max(1, Math.round((total - secs) / 60)) // tempo efetivamente focado
    setTimeout(() => {
      setCelebrate(false); concluir(id, realMin); setRunning(false); setSecs(0); setTotal(0); setEsgotado(false)
      if (onNavigate) onNavigate('cidade3d') // direto à cidade 3D: a grua ergue o edifício
    }, 2600)
  }
  // 6) o previsto é uma estimativa — dá para esticar sem sair do foco
  const maisTempo = (m) => {
    if (!task) return
    setSecs((x) => x + m * 60); setTotal((x) => x + m * 60)
    atualizar(task.id, { min: task.min + m })
    setEsgotado(false)
  }

  const [dim, setDim] = useState(false)
  useEffect(() => {
    document.body.classList.toggle('zen-mode', dim)
    return () => document.body.classList.remove('zen-mode')
  }, [dim])

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
  const [carePlay, setCarePlay] = useState(null) // animação do ato: 'postura' | 'agua'
  const togglePostura = () => {
    setPostura(true); setCarePlay('postura')
    setTimeout(() => setCarePlay(null), 2600)
    setTimeout(() => setPostura(false), 4000)
  }
  const beberAgua = () => { addAgua(); setCarePlay('agua'); setTimeout(() => setCarePlay(null), 2400) }

  // ===== LEMBRETES DE CUIDADO (com som) =====
  // intervalos racionais durante foco ATIVO: vista 20 min (regra 20-20-20),
  // água 45 min (rumo aos ~2 L/dia da OMS), postura 60 min.
  const CARE_IV = { vista: 1200, agua: 2700, postura: 3600 }
  const focoSecs = useRef(0)
  const careNext = useRef({ vista: CARE_IV.vista, agua: CARE_IV.agua, postura: CARE_IV.postura })
  const [lembrete, setLembrete] = useState(null)
  const [, setCareTick] = useState(0)

  const playChime = () => {
    try {
      const AC = window.AudioContext || window.webkitAudioContext
      const ctx = playChime._ctx || (playChime._ctx = new AC())
      if (ctx.state === 'suspended') ctx.resume()
      const t0 = ctx.currentTime
      ;[[880, 0.16], [1318.5, 0.1]].forEach(([f, g], i) => {
        const o = ctx.createOscillator(); const gn = ctx.createGain()
        o.type = 'sine'; o.frequency.value = f
        gn.gain.setValueAtTime(0, t0)
        gn.gain.linearRampToValueAtTime(g, t0 + 0.02 + i * 0.06)
        gn.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.4)
        o.connect(gn); gn.connect(ctx.destination)
        o.start(t0 + i * 0.06); o.stop(t0 + 1.5)
      })
      window._chimeOk = true
    } catch { /* sem áudio, sem drama */ }
  }

  const disparaLembrete = (tipo) => {
    setLembrete({ tipo, em: Date.now() })
    playChime()
  }
  useEffect(() => { window._careTrigger = disparaLembrete; return () => { delete window._careTrigger } }, [])

  useEffect(() => {
    if (!running) return
    const t = setInterval(() => {
      focoSecs.current += 1
      setCareTick((x) => x + 1)
      if (lembrete) return // um de cada vez; os próximos esperam a vez
      const fs = focoSecs.current
      if (fs >= careNext.current.vista) { careNext.current.vista = fs + CARE_IV.vista; disparaLembrete('vista'); return }
      if (fs >= careNext.current.agua && agua * 250 < 2000) { careNext.current.agua = fs + CARE_IV.agua; disparaLembrete('agua'); return }
      if (fs >= careNext.current.postura) { careNext.current.postura = fs + CARE_IV.postura; disparaLembrete('postura') }
    }, 1000)
    return () => clearInterval(t)
  }, [running, lembrete, agua])

  useEffect(() => {
    if (!lembrete) return
    const t = setTimeout(() => setLembrete(null), 16000)
    return () => clearTimeout(t)
  }, [lembrete])

  const minAte = (tipo) => Math.max(0, Math.ceil((careNext.current[tipo] - focoSecs.current) / 60))

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

  // palco do player: publica a posição da caixa para o iframe global aterrar nela
  const stageRef = useRef(null)
  const temEmbed = !!embedUrl
  useEffect(() => {
    if (!temEmbed || dim) { setPlayerAnchor(null); return }
    const pub = () => {
      const el = stageRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      if (r.width > 40) setPlayerAnchor({ x: r.left, y: r.top, w: r.width, h: r.height })
    }
    pub()
    const t1 = setTimeout(pub, 350); const t2 = setTimeout(pub, 900); const t3 = setTimeout(pub, 1400)
    const ro = new ResizeObserver(pub); if (stageRef.current) ro.observe(stageRef.current)
    window.addEventListener('resize', pub)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); ro.disconnect(); window.removeEventListener('resize', pub); setPlayerAnchor(null) }
  }, [temEmbed, dim, fonte])

  // CELEBRAÇÃO
  const [celebrate, setCelebrate] = useState(false)
  // o santuário É o modo de trabalho: entra ao iniciar, sai ao pausar ou concluir
  useEffect(() => { setDim(!!task && running && !celebrate) }, [task, running, celebrate])
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
    <div className={`foco ${dim ? 'dim' : ''} ${celebrate ? 'celebrating' : ''}`}>
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
                    <span className="agua-n">{agua * 250}<small> ml</small></span>
                    <button className="agua-btn mais" onClick={beberAgua} disabled={agua === 8}>+</button>
                  </div>
                  <div className="agua-track"><i style={{ width: `${Math.min(100, agua * 250 / 2000 * 100)}%` }} /></div>
                </div>
              </div>
            </div>
            <div className="care-foot">
              <span>meta ~<b>2 L/dia</b> (OMS) · +250 ml por copo</span>
              {running && <span className="cf-next">🔔 vista {minAte('vista')}m · água {minAte('agua')}m</span>}
            </div>
          </div>
        </div>

        <div className="col mid">
          <div className="ring-zone" style={{ position: "relative" }}>

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
              <span className="np-zen-label">a tocar</span>
              <span className="eq"><b /><b /><b /></span>
              <span className="np-t">{mediaTitle.yt || mediaTitle.sp || 'A tua música'}</span>
              <span className="np-s">· {media.yt ? 'YouTube' : 'Spotify'}</span>
            </div>
          )}
          {task && (
            <div className="mais-tempo">
              <span className="mt-l">a precisar de mais?</span>
              <button className="mt-btn" onClick={() => maisTempo(5)}>＋5 min</button>
              <button className="mt-btn" onClick={() => maisTempo(15)}>＋15 min</button>
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
                <div ref={stageRef} className={`player-stage ${fonte === 'sp' ? 'sp' : ''}`} />
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
            <div className="hint">A tua música, o teu gosto — toca <b>aqui dentro</b> — e quando mudas de aba, segue contigo num leitor de bolso. Nunca pára.</div>
          </div>

          <div className="panel equipa enter" style={{ animationDelay: '.1s' }}>
            <div className="pt"><span className="pico" style={{ background: 'var(--mustard-soft)' }}>👥</span>A tua equipa agora<span className="eq-live">● ao vivo</span></div>
            <EquipaAgora colegas={colegas} presencas={presencas} />
          </div>
        </div>
      </div>

      {dim && task && (
        <div className="zen-bg" style={{ '--zc': col }}>
          <div className="zen-night" />
          <div className="zen-aur a" /><div className="zen-aur b" /><div className="zen-aur c" />
          {Array.from({ length: 70 }).map((_, i) => (
            <i key={`s${i}`} className="zen-star" style={{
              left: `${(i * 13.7 + 3) % 100}%`,
              top: `${(i * 7.9 + 2) % 62}%`,
              '--ss': `${1 + (i % 3)}px`,
              '--so': `${0.25 + (i % 5) * 0.14}`,
              animationDuration: `${2.6 + (i % 7) * 0.9}s`,
              animationDelay: `${-(i * 1.3) % 6}s`,
            }} />
          ))}
          <span className="zen-ripple" /><span className="zen-ripple r2" /><span className="zen-ripple r3" />
          {Array.from({ length: 14 }).map((_, i) => (
            <i key={`m${i}`} className="zen-mote" style={{
              left: `${(i * 7.1 + 5) % 94}%`,
              '--s': `${3 + (i % 4) * 2}px`,
              '--b': `${(i % 3) * 1.2}px`,
              '--o': `${0.2 + (i % 4) * 0.12}`,
              animationDuration: `${18 + (i % 5) * 7}s`,
              animationDelay: `${-(i * 3.1) % 22}s`,
            }} />
          ))}
          <svg className="zen-city" viewBox="0 0 1920 240" preserveAspectRatio="xMidYMax slice">
            <path className="zc-far" d="M0 240V150h60v-24h44v40h70V128h52v22h64v-46h18v-14h16v14h20v46h58v34h72V138h50v-30h46v30h50v42h66v-58h56v20h60v-40h14v-12h14v12h18v40h54v56h78V132h48v26h58v-34h62v52h70v-30h52v-40h16v-14h14v14h20v40h56v30h64v-48h50v20h58v46h74V142h52v28h64v-38h48v38h60v70z"/>
            <path className="zc-near" d="M0 240V186h88v-30h64v30h94v-52h20v-16h18v16h24v52h84v-24h72v24h96v-44h58v44h90v-64h22v-18h20v18h26v64h92v-28h76v28h98v-48h62v48h94v-58h24v-14h20v14h26v58h96v-26h78v26h100v-40h72v40h92v-30h60v30h74v54z"/>
            {[
              [120,196],[340,208],[560,178],[790,192],[930,166],[1150,200],[1290,182],[1490,210],[1660,190],[1830,204],
              [230,214],[680,216],[1050,212],[1390,216],[1760,214],
            ].map(([x, y], i) => (
              <rect key={i} className="zc-win" x={x} y={y} width="10" height="12" rx="1.5"
                style={{ animationDelay: `${(i * 1.7) % 12}s`, animationDuration: `${8 + (i % 4) * 3}s` }} />
            ))}
          </svg>
          <div className="zen-line">só tu e isto</div>
        </div>
      )}

      {carePlay && (
        <div className={`care-play ${carePlay}`}>
          {carePlay === 'postura' ? (
            <svg viewBox="0 0 120 120" className="cp-svg">
              <circle cx="60" cy="60" r="54" className="cp-halo" />
              <g className="cp-fig">
                <circle cx="60" cy="30" r="9" className="cp-head" />
                <path d="M60 39 Q56 58 60 78" className="cp-spine" />
                <path d="M60 48 Q47 55 42 64" className="cp-arm l" />
                <path d="M60 48 Q73 55 78 64" className="cp-arm r" />
                <path d="M60 78 L50 102" className="cp-leg" />
                <path d="M60 78 L70 102" className="cp-leg" />
              </g>
              <path d="M36 62 L52 78 L86 40" className="cp-check" />
            </svg>
          ) : (
            <svg viewBox="0 0 120 120" className="cp-svg">
              <circle cx="60" cy="60" r="54" className="cp-halo agua" />
              <path d="M42 34 h36 l-5 56 a8 8 0 0 1 -8 7 h-10 a8 8 0 0 1 -8 -7 z" className="cp-copo" />
              <clipPath id="cpc"><path d="M42 34 h36 l-5 56 a8 8 0 0 1 -8 7 h-10 a8 8 0 0 1 -8 -7 z" /></clipPath>
              <g clipPath="url(#cpc)"><rect x="38" y="34" width="44" height="66" className="cp-agua" /></g>
              <circle cx="60" cy="22" r="4" className="cp-gota" />
            </svg>
          )}
          <div className="cp-msg">{carePlay === 'postura' ? 'costas direitas · ombros para trás' : '+250 ml — bom trabalho'}</div>
        </div>
      )}
      {esgotado && task && (
        <div className="tempo-fim">
          <div className="tf-card">
            <div className="tf-ring">⏱</div>
            <div className="tf-t">O tempo previsto chegou ao fim</div>
            <div className="tf-s">«{task.texto}» — continuas ou dás por concluída?</div>
            <div className="tf-acts">
              <button className="tf-mais" onClick={() => maisTempo(5)}>＋5 min</button>
              <button className="tf-mais" onClick={() => maisTempo(15)}>＋15 min</button>
              <button className="tf-ok" onClick={() => { setEsgotado(false); concluirTask() }}>Concluir ✓</button>
            </div>
          </div>
        </div>
      )}
      {lembrete && (
        <div className={`care-toast ${lembrete.tipo}`}>
          <span className="cto-ic">{lembrete.tipo === 'vista' ? '👁' : lembrete.tipo === 'agua' ? '💧' : '🧍'}</span>
          <div className="cto-b">
            <div className="cto-t">{lembrete.tipo === 'vista' ? 'Descansa a vista' : lembrete.tipo === 'agua' ? 'Bebe um copo de água' : 'Endireita as costas'}</div>
            <div className="cto-s">{lembrete.tipo === 'vista' ? '20 segundos a olhar para longe — os teus olhos agradecem' : lembrete.tipo === 'agua' ? `vais em ${agua * 250} ml — a OMS sugere ~2 L/dia` : 'ombros para trás, queixo paralelo ao chão'}</div>
          </div>
          <button className="cto-go" onClick={() => { const tp = lembrete.tipo; setLembrete(null); if (tp === 'vista') startEye(); else if (tp === 'agua') beberAgua(); else togglePostura() }}>
            {lembrete.tipo === 'vista' ? 'iniciar 20s' : lembrete.tipo === 'agua' ? '+250 ml ✓' : 'feito ✓'}
          </button>
          <button className="cto-x" onClick={() => setLembrete(null)}>✕</button>
        </div>
      )}
      {dim && (
        <div className="zen-actions">
          <button className="za-btn" onClick={() => setRunning(false)}>⏸ pausar tarefa</button>
          <button className="za-btn" onClick={() => maisTempo(5)}>＋5 min</button>
          <button className="za-btn ok" onClick={concluirTask}>✓ concluir</button>
        </div>
      )}
      {dim && <div className="sanct-hint">santuário · pausa para voltar à app</div>}

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
