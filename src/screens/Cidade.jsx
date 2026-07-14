import React, { useEffect, useRef } from 'react'
import './Cidade.css'
import { useRoe } from '../state/RoeContext.jsx'

export default function Cidade({ onNavigate }) {
  const { feitas } = useRoe()
  const skyRef = useRef(null)
  const starsRef = useRef(null)
  const nEdificios = feitas.length
  const nHabitantes = feitas.length * 4  // cada edifício ~4 habitantes

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
    // ponto zero: terreno vazio, sem edifícios (só o horizonte e o sol)
    const svg = skyRef.current
    if (svg && svg.childNodes.length === 0) buildEmptyLand(svg)
  }, [])

  const buildEmptyLand = (svg) => {
    const NS = 'http://www.w3.org/2000/svg'
    const rect = (x, y, w, h, fill) => {
      const r = document.createElementNS(NS, 'rect')
      r.setAttribute('x', x); r.setAttribute('y', y); r.setAttribute('width', w); r.setAttribute('height', h); r.setAttribute('fill', fill)
      return r
    }
    // montanhas ao fundo (terreno por povoar)
    const back = document.createElementNS(NS, 'path')
    back.setAttribute('d', 'M0,215 L120,175 L260,205 L400,165 L560,200 L720,170 L900,205 L900,300 L0,300 Z')
    back.setAttribute('fill', 'rgba(60,40,64,.5)'); svg.appendChild(back)
    // chão
    svg.appendChild(rect(0, 265, 900, 60, '#1A1220'))
    // alguns tufos de vegetação (terreno virgem)
    const NS2 = 'http://www.w3.org/2000/svg'
    for (let i = 0; i < 14; i++) {
      const x = 30 + Math.random() * 840, y = 250 + Math.random() * 30
      const g = document.createElementNS(NS2, 'circle')
      g.setAttribute('cx', x); g.setAttribute('cy', y); g.setAttribute('r', 2 + Math.random() * 2)
      g.setAttribute('fill', 'rgba(0,200,101,.35)')
      svg.appendChild(g)
    }
  }

  return (
    <div className="cidade">
      <div className="topbar">
        <div><div className="l1">{nEdificios === 0 ? 'A tua cidade começa hoje' : `${nEdificios} edifício${nEdificios > 1 ? 's' : ''} · erguido${nEdificios > 1 ? 's' : ''} por ti`}</div><div className="l2">ROE City</div></div>
      </div>

      <div className="canvas">
        <div className="diorama panel enter" style={{ padding: 0 }}>
          <div className="sky-grad" />
          <div className="stars" ref={starsRef} />
          <div className="roesign">ROE CITY</div>
          <div className="sun" />
          <svg className="sky-svg" ref={skyRef} height="300" viewBox="0 0 900 300" preserveAspectRatio="none" />
          <div className="frame" />
          <div className="chron">
            {nEdificios === 0 ? (
              <>
                <div className="cl">Terreno pronto · à espera da primeira obra</div>
                <div className="ct">Conclui a tua primeira tarefa importante para erguer o primeiro edifício.</div>
                <div className="cd">cada tarefa concluída constrói um pedaço da tua cidade</div>
              </>
            ) : (
              <>
                <div className="cl">Último edifício · erguido agora</div>
                <div className="ct">{feitas[feitas.length - 1].texto}</div>
                <div className="cd">visita a cidade em 3D para veres a tua construção</div>
              </>
            )}
          </div>
        </div>

        <div className="col-r">
          <div className="panel enter" style={{ animationDelay: '.15s' }}>
            <div className="pt">A tua cidade</div>
            <div className="ps">o que ergueste até hoje</div>
            <div className="stats3">
              <div className="st h"><div className="si">🏙️</div><div><div className="sv">{nHabitantes}</div><div className="sl">habitantes</div></div></div>
              <div className="st b"><div className="si">🏢</div><div><div className="sv">{nEdificios}</div><div className="sl">edifícios erguidos</div></div></div>
              <div className="st d"><div className="si">📅</div><div><div className="sv">{nEdificios > 0 ? 1 : 0}</div><div className="sl">dias a construir</div></div></div>
            </div>
          </div>
          <div className="panel era enter" style={{ animationDelay: '.3s' }}>
            <div className="et">🌱 Primeiro marco: a primeira casa</div>
            <div className="ed">{nEdificios === 0 ? 'Conclui uma tarefa no Foco e vê nascer o primeiro edifício da tua cidade.' : 'A tua cidade está a crescer! Continua a concluir tarefas para a veres florescer.'}</div>
          </div>
          <div className="panel enter" style={{ animationDelay: '.45s', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div className="pt" style={{ marginBottom: 11 }}>Crónica recente</div>
            {nEdificios === 0 ? (
              <div className="chr-empty">
                <div className="chr-empty-ic">🏗</div>
                <div className="chr-empty-t">A tua crónica ainda está por escrever.</div>
                <div className="chr-empty-s">Cada edifício vai guardar aqui a tarefa que o ergueu.</div>
              </div>
            ) : (
              <div className="chr-list">
                {[...feitas].reverse().map((t, i) => (
                  <div key={t.id} className={`chr ${['a','b','c'][i % 3]}`}>
                    <div className="chi">{['🏢','🏠','🏛','🏪','🏗'][i % 5]}</div>
                    <div><div className="cht">{t.texto}</div><div className="chs">concluída agora</div></div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button className="cta" onClick={() => onNavigate && onNavigate('cidade3d')}><span>🖥️</span> Visitar a ROE City em 3D</button>
          <div className="cta-sub">a cidade completa vive no PC · voa, roda, explora rua a rua</div>
        </div>
      </div>
    </div>
  )
}
