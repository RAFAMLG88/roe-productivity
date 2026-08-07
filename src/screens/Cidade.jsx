import React, { useEffect, useRef } from 'react'
import './Cidade.css'
import { useRoe } from '../state/RoeContext.jsx'

const NS = 'http://www.w3.org/2000/svg'
const CORES_ED = ['#241830', '#2B1C38', '#1f1530']

// posição/altura determinística por índice (para a cidade ficar estável)
function edParams(i) {
  const seed = (i * 2654435761) % 2 ** 32
  const rnd = (n) => ((seed >> (n * 3)) % 1000) / 1000
  const x = 70 + ((i * 173) % 760)
  const w = 34 + rnd(1) * 30
  const h = 60 + rnd(2) * 130
  return { x, w, h, cor: CORES_ED[i % 3] }
}

const CEUS = {
  amanhecer: 'linear-gradient(180deg,#4a5a8a 0%,#c97a8a 45%,#F0B080 78%,#FFE1B5 100%)',
  dia:       'linear-gradient(180deg,#5FB6DF 0%,#9AD4EC 55%,#D9EEF4 100%)',
  entardecer:'linear-gradient(180deg,#241b3e 0%,#5a2a55 40%,#c85a6e 70%,#F0A868 100%)',
  noite:     'linear-gradient(180deg,#0b0920 0%,#1a1440 55%,#241830 100%)',
  chuva:     'linear-gradient(180deg,#3a4048 0%,#5a626b 55%,#7a838c 100%)',
}
function faseDoDia() {
  const h = new Date().getHours()
  if (h >= 6 && h < 9) return 'amanhecer'
  if (h >= 9 && h < 18) return 'dia'
  if (h >= 18 && h < 21) return 'entardecer'
  return 'noite'
}

export default function Cidade({ onNavigate }) {
  const { feitas } = useRoe()
  const skyRef = useRef(null)
  const starsRef = useRef(null)
  const builtRef = useRef(0) // quantos edifícios já desenhados

  const [ceu, setCeu] = React.useState(faseDoDia())
  useEffect(() => {
    setCeu(faseDoDia())
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        fetch('https://api.open-meteo.com/v1/forecast?latitude=' + pos.coords.latitude.toFixed(3) + '&longitude=' + pos.coords.longitude.toFixed(3) + '&current=weather_code')
          .then((r) => r.json())
          .then((j) => { if (j && j.current && j.current.weather_code >= 51) setCeu('chuva') })
          .catch(() => {})
      }, () => {}, { timeout: 8000, maximumAge: 600000 })
    }
    const t = setInterval(() => setCeu((c) => c === 'chuva' ? c : faseDoDia()), 5 * 60 * 1000)
    return () => clearInterval(t)
  }, [])

  const nEd = feitas.length
  const nHab = nEd * 4
  const ultima = nEd > 0 ? feitas[feitas.length - 1] : null
  const recente = ultima && ultima.feitaEm && (Date.now() - ultima.feitaEm < 15000)

  useEffect(() => {
    const stars = starsRef.current
    if (stars && stars.childNodes.length === 0) {
      for (let i = 0; i < 40; i++) {
        const s = document.createElement('div')
        s.className = 'star'
        s.style.left = Math.random() * 100 + '%'
        s.style.top = Math.random() * 45 + '%'
        s.style.animationDelay = (Math.random() * 3) + 's'
        stars.appendChild(s)
      }
    }
    const svg = skyRef.current
    if (!svg) return
    if (svg.childNodes.length === 0) baseLand(svg)
    // desenhar edifícios em falta; animar o último se recém-concluído
    while (builtRef.current < nEd) {
      const i = builtRef.current
      const animar = (i === nEd - 1) && recente
      buildEdificio(svg, i, animar)
      builtRef.current++
    }
  }, [nEd, recente])

  const baseLand = (svg) => {
    const back = document.createElementNS(NS, 'path')
    back.setAttribute('d', 'M0,215 L120,175 L260,205 L400,165 L560,200 L720,170 L900,205 L900,300 L0,300 Z')
    back.setAttribute('fill', 'rgba(60,40,64,.5)'); svg.appendChild(back)
    const ground = document.createElementNS(NS, 'rect')
    ground.setAttribute('x', 0); ground.setAttribute('y', 265); ground.setAttribute('width', 900); ground.setAttribute('height', 60); ground.setAttribute('fill', '#1A1220')
    svg.appendChild(ground)
    for (let i = 0; i < 14; i++) {
      const g = document.createElementNS(NS, 'circle')
      g.setAttribute('cx', 30 + Math.random() * 840); g.setAttribute('cy', 250 + Math.random() * 30)
      g.setAttribute('r', 2 + Math.random() * 2); g.setAttribute('fill', 'rgba(0,200,101,.35)')
      svg.appendChild(g)
    }
  }

  const buildEdificio = (svg, i, animar) => {
    const { x, w, h, cor } = edParams(i)
    const baseY = 268
    const g = document.createElementNS(NS, 'g')
    svg.appendChild(g)
    const body = document.createElementNS(NS, 'rect')
    body.setAttribute('x', x); body.setAttribute('width', w); body.setAttribute('fill', cor)
    g.appendChild(body)
    const top = document.createElementNS(NS, 'rect')
    top.setAttribute('x', x); top.setAttribute('width', w); top.setAttribute('height', 6); top.setAttribute('fill', 'rgba(20,18,7,.4)')
    g.appendChild(top)
    const winCols = Math.max(1, Math.floor((w - 10) / 11))
    const winRows = Math.max(1, Math.floor((h - 22) / 16))
    const wins = []
    for (let c = 0; c < winCols; c++) for (let r = 0; r < winRows; r++) {
      if (Math.random() < 0.42) continue
      const win = document.createElementNS(NS, 'rect')
      win.setAttribute('x', x + 6 + c * 11); win.setAttribute('width', 4.5); win.setAttribute('height', 6)
      win.setAttribute('fill', Math.random() < 0.12 ? '#FF1F3D' : '#FFD46A')
      win.dataset.row = r
      g.appendChild(win); wins.push(win)
    }
    const setH = (hh) => {
      body.setAttribute('height', hh); body.setAttribute('y', baseY - hh)
      top.setAttribute('y', baseY - hh)
      wins.forEach((win) => {
        const wy = baseY - hh + 12 + Number(win.dataset.row) * 16
        if (wy < baseY - 8) { win.setAttribute('y', wy); win.setAttribute('opacity', 1) }
        else win.setAttribute('opacity', 0)
      })
    }
    if (!animar) { setH(h); return }
    // animação de construção: sobe em ~1.6s com easing, gruazinha de brilho no topo
    const t0 = performance.now()
    const dur = 1600
    const ease = (p) => 1 - Math.pow(1 - p, 3)
    const step = (now) => {
      const p = Math.min((now - t0) / dur, 1)
      setH(h * ease(p))
      if (p < 1) requestAnimationFrame(step)
      else {
        // brilho final
        const glow = document.createElementNS(NS, 'circle')
        glow.setAttribute('cx', x + w / 2); glow.setAttribute('cy', baseY - h - 8); glow.setAttribute('r', 3)
        glow.setAttribute('fill', '#FFCE0A')
        g.appendChild(glow)
        glow.animate([{ opacity: 1, r: 3 }, { opacity: 0 }], { duration: 1400 })
        setTimeout(() => glow.remove(), 1500)
      }
    }
    requestAnimationFrame(step)
  }

  return (
    <div className="cidade">
      <div className="topbar">
        <div><div className="l1">{nEd === 0 ? 'A tua cidade começa hoje' : recente ? '🏗 obra nova em curso!' : `${nEd} edifício${nEd > 1 ? 's' : ''} · erguido${nEd > 1 ? 's' : ''} por ti`}</div><div className="l2">ROE City</div></div>
      </div>

      <div className="canvas">
        <div className="diorama panel enter" style={{ padding: 0 }}>
          <div className="sky-grad" style={{ background: CEUS[ceu] }} />
          <div className="stars" ref={starsRef} style={{ opacity: ceu === "noite" ? 1 : 0, transition: "opacity 1.5s" }} />
          <div className="roesign">ROE CITY</div>
          <div className="sun" style={{ opacity: (ceu === "amanhecer" || ceu === "entardecer") ? 1 : ceu === "dia" ? 0.9 : 0, transition: "opacity 1.5s" }} />
          {ceu === "chuva" && <div className="rain-layer">{Array.from({ length: 34 }).map((_, i) => <i key={i} style={{ left: (i * 3.1 % 100) + "%", animationDelay: (i * 0.13 % 1.6) + "s", animationDuration: (0.8 + (i % 5) * 0.12) + "s" }} />)}</div>}
          <svg className="sky-svg" ref={skyRef} height="300" viewBox="0 0 900 300" preserveAspectRatio="none" />
          <div className="frame" />
          <div className="chron">
            {nEd === 0 ? (
              <>
                <div className="cl">Terreno pronto · à espera da primeira obra</div>
                <div className="ct">Conclui a tua primeira tarefa para erguer o primeiro edifício.</div>
                <div className="cd">cada tarefa concluída constrói um pedaço da tua cidade</div>
              </>
            ) : (
              <>
                <div className="cl">{recente ? 'Edifício novo · erguido agora mesmo' : 'Último edifício'}</div>
                <div className="ct">{ultima.texto}</div>
                <div className="cd">visita a cidade em 3D para a explorares rua a rua</div>
              </>
            )}
          </div>
        </div>

        <div className="col-r">
          <div className="panel enter" style={{ animationDelay: '.15s' }}>
            <div className="pt">A tua cidade</div>
            <div className="ps">o que ergueste até hoje</div>
            <div className="stats3">
              <div className="st h"><div className="si">🏙️</div><div><div className="sv">{nHab}</div><div className="sl">habitantes</div></div></div>
              <div className="st b"><div className="si">🏢</div><div><div className="sv">{nEd}</div><div className="sl">edifícios erguidos</div></div></div>
              <div className="st d"><div className="si">📅</div><div><div className="sv">{nEd > 0 ? 1 : 0}</div><div className="sl">dias a construir</div></div></div>
            </div>
          </div>
          <div className="panel era enter" style={{ animationDelay: '.3s' }}>
            <div className="et">{nEd === 0 ? '🌱 Primeiro marco: a primeira casa' : '🌇 A cidade cresce contigo'}</div>
            <div className="ed">{nEd === 0 ? 'Conclui uma tarefa no Foco e vê nascer o primeiro edifício.' : 'Cada tarefa concluída ergue mais um edifício. Continua.'}</div>
          </div>
          <div className="panel enter" style={{ animationDelay: '.45s', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div className="pt" style={{ marginBottom: 11 }}>Crónica recente</div>
            {nEd === 0 ? (
              <div className="chr-empty">
                <div className="chr-empty-ic">🏗</div>
                <div className="chr-empty-t">A tua crónica ainda está por escrever.</div>
                <div className="chr-empty-s">Cada edifício vai guardar aqui a tarefa que o ergueu.</div>
              </div>
            ) : (
              <div className="chr-list">
                {[...feitas].reverse().map((t, i) => (
                  <div key={t.id} className={`chr ${['a','b','c'][i % 3]} ${i === 0 && recente ? 'nova' : ''}`}>
                    <div className="chi">{['🏢','🏠','🏛','🏪','🏗'][i % 5]}</div>
                    <div><div className="cht">{t.texto}</div><div className="chs">{i === 0 && recente ? 'erguido agora ✨' : 'concluída'}</div></div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button className="cta" onClick={() => onNavigate && onNavigate('cidade3d')}><span>🖥️</span> Visitar a ROE City em 3D</button>
        </div>
      </div>
    </div>
  )
}
