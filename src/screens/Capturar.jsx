import React, { useState, useRef, useEffect } from 'react'
import './Capturar.css'
import { useRoe } from '../state/RoeContext.jsx'
import { fmtMin, desvioMedio } from '../utils/formato.js'
import { supabase } from '../lib/supabase.js'
import { outlookConta, outlookLigar, outlookSair, outlookEmailsDesde } from '../lib/outlook.js'

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

// ═══ OUTLOOK → CAPTURAR: quilómetro zero + marcador de triagem ═══
function OutlookCard({ perfil, aoCatalogar, despacharOl }) {
  const [conta, setConta] = useState(null)
  const [temMarco, setTemMarco] = useState(false)
  const [lista, setLista] = useState([])
  const [busy, setBusy] = useState(false)
  const [erro, setErro] = useState('')
  const uid = perfil && perfil.id

  const sync = async () => {
    if (!uid) return
    setBusy(true); setErro('')
    try {
      const { data: mrow } = await supabase.from('outlook_marco').select('marco').eq('user_id', uid).maybeSingle()
      if (!mrow) { setTemMarco(false); setBusy(false); return }
      setTemMarco(true)
      const res = await outlookEmailsDesde(mrow.marco)
      if (res.erro) {
        setErro(res.erro === 'sessao' ? 'A sessão Microsoft expirou — religa o Outlook.' : 'O Outlook não respondeu (' + res.erro + ') — tenta atualizar.')
        setBusy(false); return
      }
      const { data: desp } = await supabase.from('outlook_despachados').select('email_id').eq('user_id', uid)
      const feito = new Set((desp || []).map((d) => d.email_id))
      // o marcador avança sobre o prefixo já despachado (e limpa o rasto)
      let novoMarco = null
      const podados = []
      for (const e of res.emails) {
        if (feito.has(e.id)) { novoMarco = e.recebido; podados.push(e.id) } else break
      }
      if (novoMarco) {
        await supabase.from('outlook_marco').update({ marco: novoMarco }).eq('user_id', uid)
        await supabase.from('outlook_despachados').delete().eq('user_id', uid).in('email_id', podados)
      }
      setLista(res.emails.filter((e) => !feito.has(e.id)))
    } catch (e) { setErro('Algo falhou na sincronização.'); console.warn('[ROE outlook]', e) }
    setBusy(false)
  }

  useEffect(() => {
    let vivo = true
    outlookConta().then((c) => { if (vivo) { setConta(c); if (c) sync() } }).catch(() => {})
    return () => { vivo = false }
  }, [uid]) // eslint-disable-line

  const ligar = async () => {
    setErro(''); setBusy(true)
    try {
      const c = await outlookLigar()
      setConta(c)
      // quilómetro zero: só nasce na PRIMEIRA ligação; religar retoma o marcador antigo
      const { data: mrow } = await supabase.from('outlook_marco').select('marco').eq('user_id', uid).maybeSingle()
      if (!mrow) await supabase.from('outlook_marco').insert({ user_id: uid, marco: new Date().toISOString() })
      await sync()
    } catch { setErro('O login Microsoft foi cancelado ou falhou.') }
    setBusy(false)
  }

  const desligar = async () => {
    await outlookSair()
    setConta(null); setLista([])
    // o marcador fica na base de dados — religar retoma exatamente onde ficou
  }

  const dispensar = async (e) => {
    await despacharOl({ id: e.id, recebido: e.recebido })
    setLista((l) => l.filter((x) => x.id !== e.id))
  }

  const hora = (isoStr) => {
    const d = new Date(isoStr)
    const hoje = new Date()
    const mesmoDia = d.toDateString() === hoje.toDateString()
    return mesmoDia
      ? d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="panel fontes enter" style={{ animationDelay: '.12s' }}>
      <div className="pt">
        <span className="pico" style={{ background: 'var(--sky-soft)' }}>📨</span>Outlook
        {conta && temMarco && (
          <span className="ol-conta"><span className="ol-dot" />{(conta.username || '').toLowerCase()}</span>
        )}
        {conta && (
          <button className="ol-mini" title="atualizar agora" onClick={sync} disabled={busy}>{busy ? '…' : '↻'}</button>
        )}
      </div>
      {!conta || !temMarco ? (
        <>
          <div className="ol-vazio">Liga a tua caixa Outlook e os emails que chegarem <b>a partir desse momento</b> aparecem aqui para triagem — o passado fica onde está, intocado.</div>
          <button className="ol-ligar" onClick={ligar} disabled={busy}>{busy ? 'a abrir a Microsoft…' : conta ? 'Ativar a triagem' : 'Ligar Outlook'}</button>
          {erro && <div className="ol-erro">{erro}</div>}
        </>
      ) : (
        <>
          {erro && <div className="ol-erro">{erro} {erro.includes('religa') && <button className="ol-link" onClick={ligar}>religar</button>}</div>}
          {lista.length === 0 && !erro && (
            <div className="ol-vazio">sem emails novos por triar — em dia ✓</div>
          )}
          {lista.slice(0, 8).map((e) => (
            <div key={e.id} className="ol-mail">
              <div className="ol-b">
                <div className="ol-as">{e.assunto}</div>
                <div className="ol-de">{e.de} · {hora(e.recebido)}</div>
              </div>
              <button className="ol-cat" title="catalogar e capturar" onClick={() => { aoCatalogar(e); setLista((l) => l.filter((x) => x.id !== e.id)) }}>→</button>
              <button className="ol-x" title="dispensar (não é tarefa)" onClick={() => dispensar(e)}>✕</button>
            </div>
          ))}
          {lista.length > 8 && <div className="ol-mais">+ {lista.length - 8} em espera — despacha estes primeiro</div>}
          <button className="ol-desligar" onClick={desligar}>desligar o Outlook deste browser</button>
        </>
      )}
    </div>
  )
}

export default function Capturar() {
  const { capturar, fila, feitas, apagar, atualizar, perfil, colegas, equipaPorId } = useRoe()
  const [tipo, setTipo] = useState('outros')
  const [texto, setTexto] = useState('')
  const [min, setMin] = useState(15)
  const [pri, setPri] = useState('normal')
  const [para, setPara] = useState('eu') // 'eu' ou id do colega
  const [toast, setToast] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [reading, setReading] = useState(false)
  const inputRef = useRef(null)
  const toastT = useRef(null)
  const dropRef = useRef(null)
  const fileRef = useRef(null)
  const [pendentes, setPendentes] = useState([])  // {texto, ol} à espera de catalogação
  const despacharOl = (ol) => {
    if (!perfil) return
    supabase.from('outlook_despachados')
      .upsert({ user_id: perfil.id, email_id: ol.id, recebido_em: ol.recebido })
      .then(({ error }) => { if (error) console.warn('[ROE outlook] despacho:', error.message) })
  }
  const catalogarOutlook = (e) => {
    setPendentes((p) => [...p, { texto: e.assunto + ' — ' + e.de, ol: { id: e.id, recebido: e.recebido } }])
  }

  const lista = fila
  const showToast = (msg) => {
    setToast(msg); clearTimeout(toastT.current)
    toastT.current = setTimeout(() => setToast(''), 3000)
  }

  // o primeiro pendente entra no formulário (texto editável) para catalogares
  useEffect(() => {
    if (pendentes.length > 0) {
      const p0 = pendentes[0]
      setTexto(typeof p0 === 'string' ? p0 : p0.texto)
      if (inputRef.current) inputRef.current.focus()
    }
  }, [pendentes])

  const fazerCaptura = () => {
    const txt = texto.trim()
    if (!txt) return
    const destino = para !== 'eu' ? equipaPorId[para] : null
    capturar({ texto: txt, tipo: pendentes.length > 0 ? 'ficheiro' : tipo, min, prioridade: pri, para: destino ? destino.id : undefined })
    if (destino) showToast('Delegada a ' + destino.nome.split(' ')[0] + ' \u2713 \u2014 j\u00e1 est\u00e1 na fila dele')
    setTexto(''); setPri('normal'); setMin(15); setPara('eu')
    if (pendentes.length > 0) {
      const p0 = pendentes[0]
      if (p0 && p0.ol) despacharOl(p0.ol) // capturado → o marcador Outlook avança
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
      setPendentes((p) => [...p, ...files.map((f) => ({ texto: nomeDeFicheiro(f.name), ol: null }))])
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
                <button className="ep-x" title="Descartar este email" onClick={() => { const p0 = pendentes[0]; if (p0 && p0.ol) despacharOl(p0.ol); setPendentes((p) => p.slice(1)) }}>✕</button>
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
            {colegas.length > 0 && (
              <div className="para-row">
                <span className="para-lab">para</span>
                <button className={'para-chip ' + (para === 'eu' ? 'on' : '')} onClick={() => setPara('eu')}>
                  <span className="pa-av" style={{ background: (perfil && perfil.cor) || 'var(--mustard)' }}>{((perfil && perfil.nome) || 'E').trim().charAt(0).toUpperCase()}</span>mim
                </button>
                {colegas.map((c) => (
                  <button key={c.id} className={'para-chip ' + (para === c.id ? 'on' : '')} onClick={() => setPara(para === c.id ? 'eu' : c.id)}>
                    <span className="pa-av" style={{ background: c.cor }}>{c.nome.trim().charAt(0).toUpperCase()}</span>{c.nome.split(' ')[0]}
                  </button>
                ))}
              </div>
            )}
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
            {(() => { const d = desvioMedio(feitas); return d.n >= 3 && d.avg !== 0 ? (
              <div className="desvio-hint">
                <span className="dh-ic">◎</span>
                no teu histórico costumas {d.avg > 0 ? 'demorar mais' : 'despachar'} ~{Math.abs(d.avg)} min — isto deve virar <b>{fmtMin(Math.max(5, Number(min) + d.avg))}</b>
              </div>
            ) : null })()}
            <button className="cap-btn full" onClick={fazerCaptura}>{para !== 'eu' && equipaPorId[para] ? 'Delegar a ' + equipaPorId[para].nome.split(' ')[0] + ' ↵' : pendentes.length > 0 ? 'Capturar email ↵' : 'Capturar ↵'}</button>
          </div>

          <OutlookCard perfil={perfil} aoCatalogar={catalogarOutlook} despacharOl={despacharOl} />
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
                      {c.criadaPor && perfil && c.criadaPor !== perfil.id && (
                        <span className="tg deleg" style={{ background: (equipaPorId[c.criadaPor] || {}).cor || 'var(--soft)' }}>de {((equipaPorId[c.criadaPor] || {}).nome || 'colega').split(' ')[0]}</span>
                      )}
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
