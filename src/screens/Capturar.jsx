import React, { useState, useRef, useEffect } from 'react'
import './Capturar.css'
import { useRoe } from '../state/RoeContext.jsx'

const TIPOS = {
  interno: { ci: 'chefe', icon: '👤', tag: 'interno', ph: 'De quem? (ex: pedido da Ana)' },
  telefone: { ci: 'tel', icon: '✆', tag: 'telefone', ph: 'Que chamada devolver?' },
  obra: { ci: 'email', icon: '🏗', tag: 'obra', ph: 'Que assunto de obra?' },
  outros: { ci: 'ideia', icon: '📌', tag: 'outros', ph: 'O que tens em mente?' },
}
const TAGCLS = { interno: 'src-chefe', telefone: 'src-tel', obra: 'src-email', outros: 'src-ideia', ficheiro: 'src-ficheiro' }
const PRIS = ['urgente', 'importante', 'normal']
const PRI_LABEL = { urgente: 'Urgente', importante: 'Importante', normal: 'Normal' }
const PRI_ICON = { urgente: '🔥', importante: '⭐', normal: '○' }

function nomeDeFicheiro(fname) {
  let n = fname.replace(/\.(eml|msg|txt|pdf)$/i, '')
  n = n.replace(/[_-]+/g, ' ').trim()
  return n.charAt(0).toUpperCase() + n.slice(1)
}

export default function Capturar() {
  const { capturar, fila, feitas, apagar, atualizar } = useRoe()
  const [tipo, setTipo] = useState('outros')
  const [texto, setTexto] = useState('')
  const [min, setMin] = useState(15)
  const [pri, setPri] = useState('normal')
  const [toast, setToast] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [reading, setReading] = useState(false)
  const inputRef = useRef(null)
  const toastT = useRef(null)
  const dropRef = useRef(null)
  const fileRef = useRef(null)
  const [pendentes, setPendentes] = useState([])  // emails lidos, à espera de catalogação

  const lista = fila
  const showToast = (msg) => {
    setToast(msg); clearTimeout(toastT.current)
    toastT.current = setTimeout(() => setToast(''), 3000)
  }

  // o primeiro pendente entra no formulário (texto editável) para catalogares
  useEffect(() => {
    if (pendentes.length > 0) {
      setTexto(pendentes[0])
      if (inputRef.current) inputRef.current.focus()
    }
  }, [pendentes])

  const fazerCaptura = () => {
    const txt = texto.trim()
    if (!txt) return
    capturar({ texto: txt, tipo: pendentes.length > 0 ? 'ficheiro' : tipo, min, prioridade: pri })
    setTexto(''); setPri('normal'); setMin(15)
    if (pendentes.length > 0) {
      const resto = pendentes.slice(1)
      setPendentes(resto)
      showToast(resto.length > 0 ? `Capturado ✓ · falta${resto.length > 1 ? 'm' : ''} ${resto.length} email${resto.length > 1 ? 's' : ''}` : 'Capturado ✓')
    } else {
      showToast('Capturado ✓')
    }
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

  const lerFicheiros = (files) => {
    if (files.length === 0) return
    setReading(true)
    setTimeout(() => {
      setReading(false)
      setPendentes((p) => [...p, ...files.map((f) => nomeDeFicheiro(f.name))])
      burst()
      showToast(files.length > 1 ? `${files.length} emails lidos — cataloga um a um` : 'Email lido — cataloga e captura')
    }, 1200)
  }
  const onDrop = (e) => {
    e.preventDefault(); setDragOver(false)
    lerFicheiros(Array.from(e.dataTransfer.files || []))
  }
  const onPick = (e) => {
    lerFicheiros(Array.from(e.target.files || []))
    e.target.value = ''
  }

  const ciclarPri = (t) => {
    const i = PRIS.indexOf(t.prioridade || 'normal')
    atualizar(t.id, { prioridade: PRIS[(i + 1) % 3] })
  }

  const nUrg = lista.filter((t) => t.prioridade === 'urgente').length
  const nImp = lista.filter((t) => t.prioridade === 'importante').length

  return (
    <div className="capturar">
      <div className="topbar">
        <div><div className="l1">Entrada do dia · fricção zero</div><div className="l2">Capturar</div></div>
        <div className="tstats">
          <div className="tst u"><span className="v">{nUrg}</span><span className="l">urgentes</span></div>
          <div className="tst b"><span className="v">{nImp}</span><span className="l">importantes</span></div>
          <div className="tst a"><span className="v">{lista.length}</span><span className="l">na fila</span></div>
        </div>
      </div>

      <div className="canvas">
        <div className="col">
          <div className="panel enter painel-captura" style={{ padding: 16 }}>
            <div
              className={`drop ${dragOver ? 'hover' : ''} ${reading ? 'reading' : ''}`}
              ref={dropRef}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={(e) => { e.preventDefault(); setDragOver(false) }}
              onDrop={onDrop}
              onClick={() => fileRef.current && fileRef.current.click()}
              role="button"
              style={{ cursor: 'pointer' }}
            >
              <input ref={fileRef} type="file" accept=".eml,.msg,.txt,.pdf" multiple style={{ display: 'none' }} onChange={onPick} />
              <svg className="edge" width="100%" height="100%"><rect x="1.5" y="1.5" width="calc(100% - 3px)" height="calc(100% - 3px)" rx="18" /></svg>
              <div className="scanline" />
              <div className="scene">
                <div className="halo" />
                <span className="fl" style={{ left: '18%', top: '8%' }}>✉</span>
                <span className="fl" style={{ right: '16%', top: '16%', animationDelay: '.8s' }}>📎</span>
                <span className="fl" style={{ left: '26%', bottom: '4%', animationDelay: '1.5s' }}>💡</span>
                <div className="env">✉</div>
              </div>
              <div className="dt">Arrasta um email — ou clica para escolher</div>
              <div className="ds">Larga aqui ficheiros do teu PC (.eml, .msg) ou clica e escolhe.<br />Depois catalogas: prioridade, tipo e minutos — como tudo o resto.</div>
              <div className="think">
                <span className={`chip ${reading ? 'done c-imp' : ''}`}>a ler…</span>
                <span className={`chip ${reading ? 'done c-tm' : ''}`}>assunto</span>
                <span className={`chip ${reading ? 'done c-src' : ''}`}>origem</span>
              </div>
            </div>

            {pendentes.length > 0 ? (
              <div className="email-pend">
                <span className="ep-ic">📧</span>
                <div className="ep-b">
                  <div className="ep-t">Email lido — cataloga e captura</div>
                  <div className="ep-s">{pendentes.length > 1 ? `${pendentes.length - 1} outro${pendentes.length > 2 ? 's' : ''} em espera` : 'ajusta o texto, prioridade e minutos'}</div>
                </div>
                <button className="ep-x" title="Descartar este email" onClick={() => setPendentes((p) => p.slice(1))}>✕</button>
              </div>
            ) : (
              <div className="or-sep"><span>ou escreve à mão</span></div>
            )}

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
            <div className="pri-row">
              {PRIS.map((p) => (
                <button key={p} className={`pri-chip ${p} ${pri === p ? 'on' : ''}`} onClick={() => setPri(p)}>
                  <span className="pi">{PRI_ICON[p]}</span>{PRI_LABEL[p]}
                </button>
              ))}
            </div>
            <div className="dur-row">
              <div className="dur-stepper">
                <button className="dur-btn" onClick={() => setMin((m) => Math.max(5, Number(m) - 5))}>−</button>
                <div className="dur-val">
                  <span className="dv-n">{Number(min) >= 60 ? `${Math.floor(min / 60)}h${min % 60 ? String(min % 60).padStart(2, '0') : ''}` : min}</span>
                  <span className="dv-u">{Number(min) >= 60 ? '' : 'min'}</span>
                </div>
                <button className="dur-btn mais" onClick={() => setMin((m) => Math.min(480, Number(m) + 5))}>＋</button>
              </div>
              <div className="dur-chips">
                {[15, 30, 45, 60, 90, 120].map((v) => (
                  <button key={v} className={`dur-chip ${Number(min) === v ? 'on' : ''}`} onClick={() => setMin(v)}>
                    {v >= 60 ? `${v / 60}h${v % 60 ? '30' : ''}` : v}
                  </button>
                ))}
              </div>
            </div>
            <button className="cap-btn full" onClick={fazerCaptura}>{pendentes.length > 0 ? 'Capturar email ↵' : 'Capturar ↵'}</button>
          </div>

          <div className="panel fontes enter" style={{ animationDelay: '.12s' }}>
            <div className="pt"><span className="pico" style={{ background: 'var(--sky-soft)' }}>🔌</span>Fontes automáticas <span style={{ marginLeft: 'auto', fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--faint)' }}>a ligar na Fase 2</span></div>
            <div className="df-row"><span>Gmail — inbox principal</span><span className="dfk off">por ligar</span></div>
            <div className="df-row"><span>Outlook — trabalho</span><span className="dfk off">por ligar</span></div>
            <div className="df-row"><span>WhatsApp Web</span><span className="dfk off">por ligar</span></div>
          </div>
        </div>

        <div className="col cap-col">
          <div className="group-lab">Na fila · toca na etiqueta p/ mudar prioridade {feitas.length > 0 && `· ${feitas.length} concluída${feitas.length > 1 ? 's' : ''}`}</div>
          <div id="list">
            {lista.length === 0 ? (
              <div className="empty-cap">
                <div className="empty-ic">📥</div>
                <div className="empty-t">Ainda não capturaste nada.</div>
                <div className="empty-s">Arrasta um email ou escreve à esquerda.<br />O que apanhares aparece aqui e segue para o Escritório.</div>
              </div>
            ) : lista.map((c) => {
              const tp = TIPOS[c.tipo] || { ci: 'ficheiro', icon: '📧' }
              const isFile = c.tipo === 'ficheiro'
              const p = c.prioridade || 'normal'
              return (
                <div key={c.id} className={`cap show pri-${p}`}>
                  <div className={`ci ${isFile ? 'ficheiro' : tp.ci}`}>{isFile ? '📧' : tp.icon}</div>
                  <div className="body">
                    <div className="a">{c.texto}</div>
                    <div className="tags">
                      <button className={`tg pri ${p}`} title="Mudar prioridade" onClick={() => ciclarPri(c)}>{PRI_ICON[p]} {PRI_LABEL[p]}</button>
                      <span className={`tg ${TAGCLS[c.tipo] || 'src-ficheiro'}`}>{isFile ? 'email' : (TIPOS[c.tipo]?.tag || c.tipo)}</span>
                      <span className="tg tm edit">~<input type="number" min="5" step="5" value={c.min} onChange={(e) => atualizar(c.id, { min: Number(e.target.value) || 5 })} /> min</span>
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
