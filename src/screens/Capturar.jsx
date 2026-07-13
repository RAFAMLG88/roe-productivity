import React, { useState, useRef } from 'react'
import './Capturar.css'
import { useRoe } from '../state/RoeContext.jsx'

const TIPOS = {
  interno: { ci: 'chefe', icon: '👤', tag: 'interno', ph: 'De quem? (ex: pedido da Ana)' },
  telefone: { ci: 'tel', icon: '✆', tag: 'telefone', ph: 'Que chamada devolver?' },
  obra: { ci: 'email', icon: '🏗', tag: 'obra', ph: 'Que assunto de obra?' },
  outros: { ci: 'ideia', icon: '📌', tag: 'outros', ph: 'O que tens em mente?' },
}
const TAGCLS = { interno: 'src-chefe', telefone: 'src-tel', obra: 'src-email', outros: 'src-ideia', ficheiro: 'src-ficheiro' }

// limpa o nome de um ficheiro de email para virar título de tarefa
function nomeDeFicheiro(fname) {
  let n = fname.replace(/\.(eml|msg|txt|pdf)$/i, '')
  n = n.replace(/[_-]+/g, ' ').trim()
  // .eml costuma vir "RE Fwd Assunto" — mantém legível
  return n.charAt(0).toUpperCase() + n.slice(1)
}

export default function Capturar() {
  const { capturar, fila, feitas, apagar } = useRoe()
  const [tipo, setTipo] = useState('outros')
  const [texto, setTexto] = useState('')
  const [min, setMin] = useState(15)
  const [imp, setImp] = useState(false)
  const [toast, setToast] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [reading, setReading] = useState(false)
  const inputRef = useRef(null)
  const toastT = useRef(null)
  const dropRef = useRef(null)

  // tarefas capturadas nesta sessão que ainda estão na fila (as feitas saem daqui)
  const lista = fila

  const showToast = (msg) => {
    setToast(msg); clearTimeout(toastT.current)
    toastT.current = setTimeout(() => setToast(''), 3000)
  }

  const fazerCaptura = () => {
    const txt = texto.trim()
    if (!txt) return
    capturar({ texto: txt, tipo, min, importante: imp })
    setTexto(''); setImp(false); setMin(15)
    showToast('Capturado ✓')
    if (inputRef.current) inputRef.current.focus()
  }

  const burst = () => {
    const el = dropRef.current; if (!el) return
    const cols = ['#FF1F3D', '#FFCE0A', '#00C865', '#1FB8E0']
    for (let i = 0; i < 18; i++) {
      const b = document.createElement('div')
      b.className = 'burst'
      b.style.cssText = `position:absolute;width:8px;height:8px;border-radius:2px;background:${cols[i % cols.length]};left:50%;top:80px;z-index:25`
      el.appendChild(b)
      const a = Math.random() * Math.PI * 2, d = 50 + Math.random() * 90
      b.animate([{ transform: 'translate(-50%,-50%) scale(1)', opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(a) * d}px),calc(-50% + ${Math.sin(a) * d}px)) scale(0)`, opacity: 0 }], { duration: 700 + Math.random() * 300, easing: 'cubic-bezier(.1,.7,.3,1)' })
      setTimeout(() => b.remove(), 1050)
    }
  }

  // DRAG & DROP de ficheiros de email do PC
  const onDrop = (e) => {
    e.preventDefault(); setDragOver(false)
    const files = Array.from(e.dataTransfer.files || [])
    if (files.length === 0) return
    setReading(true)
    setTimeout(() => {
      setReading(false)
      files.forEach((f) => {
        capturar({ texto: nomeDeFicheiro(f.name), tipo: 'ficheiro', min: 15, importante: false })
      })
      burst()
      showToast(files.length > 1 ? `${files.length} emails capturados ✓` : 'Email capturado ✓')
    }, 1400)
  }

  const impCount = lista.filter((t) => t.importante).length

  return (
    <div className="capturar">
      <div className="topbar">
        <div><div className="l1">Entrada do dia · fricção zero</div><div className="l2">Capturar</div></div>
        <div className="tstats">
          <div className="tst a"><span className="v">{lista.length}</span><span className="l">na fila<br />agora</span></div>
          <div className="tst b"><span className="v">{impCount}</span><span className="l">importante<br />marcado</span></div>
        </div>
      </div>

      <div className="canvas">
        <div className="col">
          <div className="panel enter" style={{ padding: 14 }}>
            <div
              className={`drop ${dragOver ? 'hover' : ''} ${reading ? 'reading' : ''}`}
              ref={dropRef}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={(e) => { e.preventDefault(); setDragOver(false) }}
              onDrop={onDrop}
            >
              <svg className="edge" width="100%" height="100%"><rect x="1.5" y="1.5" width="calc(100% - 3px)" height="calc(100% - 3px)" rx="18" /></svg>
              <div className="scanline" />
              <div className="scene">
                <div className="halo" />
                <span className="fl" style={{ left: '18%', top: '8%' }}>✉</span>
                <span className="fl" style={{ right: '16%', top: '16%', animationDelay: '.8s' }}>📎</span>
                <span className="fl" style={{ left: '26%', bottom: '4%', animationDelay: '1.5s' }}>💡</span>
                <div className="env">✉</div>
              </div>
              <div className="dt">Arrasta um email para aqui</div>
              <div className="ds">Larga aqui ficheiros de email do teu PC (.eml, .msg)<br />— a app capta e junta à tua fila.</div>
              <div className="think">
                <span className={`chip ${reading ? 'done c-imp' : ''}`}>a ler…</span>
                <span className={`chip ${reading ? 'done c-tm' : ''}`}>assunto</span>
                <span className={`chip ${reading ? 'done c-src' : ''}`}>origem</span>
              </div>
            </div>

            <div className="or-sep"><span>ou escreve à mão</span></div>

            <div className="type-tabs">
              {Object.keys(TIPOS).map((k) => (
                <button key={k} className={`ttab ${tipo === k ? 'on' : ''}`} onClick={() => { setTipo(k); if (inputRef.current) inputRef.current.focus() }}>
                  <span className="ti">{TIPOS[k].icon}</span>
                  <span className="tn">{k === 'interno' ? 'Pedido interno' : k === 'telefone' ? 'Via telefone' : k === 'obra' ? 'Obra' : 'Outros'}</span>
                </button>
              ))}
            </div>
            <input ref={inputRef} className="cap-input" type="text" value={texto} placeholder={TIPOS[tipo].ph}
              onChange={(e) => setTexto(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') fazerCaptura() }} />
            <div className="cap-row">
              <div className="min-pick"><label>~</label><input type="number" min="5" step="5" value={min} onChange={(e) => setMin(e.target.value)} /><span>min</span></div>
              <button className={`imp-toggle ${imp ? 'on' : ''}`} onClick={() => setImp((v) => !v)}>{imp ? '🔴 importante' : '○ importante'}</button>
              <button className="cap-btn" onClick={fazerCaptura}>Capturar ↵</button>
            </div>
          </div>

          <div className="panel fontes enter" style={{ animationDelay: '.12s' }}>
            <div className="pt"><span className="pico" style={{ background: 'var(--sky-soft)' }}>🔌</span>Fontes automáticas <span style={{ marginLeft: 'auto', fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--faint)' }}>a ligar na Fase 2</span></div>
            <div className="df-row"><span>Gmail — inbox principal</span><span className="dfk off">por ligar</span></div>
            <div className="df-row"><span>Outlook — trabalho</span><span className="dfk off">por ligar</span></div>
            <div className="df-row"><span>WhatsApp Web</span><span className="dfk off">por ligar</span></div>
          </div>
        </div>

        <div className="col cap-col">
          <div className="group-lab">Na fila · capturado {feitas.length > 0 && `· ${feitas.length} já concluída${feitas.length > 1 ? 's' : ''}`}</div>
          <div id="list">
            {lista.length === 0 ? (
              <div className="empty-cap">
                <div className="empty-ic">📥</div>
                <div className="empty-t">Ainda não capturaste nada.</div>
                <div className="empty-s">Arrasta um email ou escreve à esquerda.<br />O que apanhares aparece aqui e segue para o Briefing.</div>
              </div>
            ) : lista.map((c) => {
              const tp = TIPOS[c.tipo] || { ci: 'ficheiro', icon: '📧' }
              const isFile = c.tipo === 'ficheiro'
              return (
                <div key={c.id} className={`cap show ${c.importante ? 'flash' : ''}`}>
                  <div className={`ci ${isFile ? 'ficheiro' : tp.ci}`}>{isFile ? '📧' : tp.icon}</div>
                  <div className="body">
                    <div className="a">{c.texto}</div>
                    <div className="tags">
                      {c.importante && <span className="tg imp">importante</span>}
                      <span className={`tg ${TAGCLS[c.tipo] || 'src-ficheiro'}`}>{isFile ? 'email' : (TIPOS[c.tipo]?.tag || c.tipo)}</span>
                      <span className="tg tm">~{c.min} min</span>
                    </div>
                  </div>
                  <button className="cap-del" title="Apagar" onClick={() => apagar(c.id)}>✕</button>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className={`toast ${toast ? 'show' : ''}`}><span>{toast}</span></div>
    </div>
  )
}
