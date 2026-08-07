import React, { useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { ROE_VER } from '../lib/versao.js'
import './Entrada.css'

// ── tradução honesta dos erros do Supabase para pt-PT ──
function traduzErro(msg = '') {
  const m = msg.toLowerCase()
  if (m.includes('invalid login credentials')) return 'Email ou password errados.'
  if (m.includes('user already registered') || m.includes('already been registered'))
    return 'Este email já tem conta — entra em vez de registar.'
  if (m.includes('password should be at least')) return 'A password precisa de pelo menos 6 caracteres.'
  if (m.includes('valid email') || m.includes('invalid format')) return 'Esse email não parece válido.'
  if (m.includes('rate limit') || m.includes('too many')) return 'Muitas tentativas seguidas — espera um minuto e tenta de novo.'
  if (m.includes('database error saving new user') || m.includes('convite'))
    return 'Código de convite inválido — confirma com quem te convidou.'
  if (m.includes('failed to fetch') || m.includes('network')) return 'Sem ligação ao servidor — verifica a internet.'
  return 'Algo correu mal: ' + msg
}

function AnelLogo({ size = 52 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ flex: 'none' }}>
      <rect x="6" y="6" width="88" height="88" rx="26" fill="#1d1a10" />
      <circle cx="50" cy="50" r="27" fill="none" stroke="#FFCE0A" strokeWidth="7" />
      <circle cx="50" cy="50" r="14" fill="none" stroke="#00C865" strokeWidth="6" />
      <circle cx="50" cy="50" r="6" fill="#FF1F3D" />
    </svg>
  )
}

// ── a ROE City a dormir no horizonte (janelas âmbar a acender) ──
function Skyline() {
  const bl = [
    [0, 66, 34, 74], [30, 46, 26, 94], [52, 58, 30, 82], [78, 30, 34, 110],
    [108, 52, 26, 88], [130, 40, 38, 100], [164, 62, 28, 78], [188, 36, 30, 104],
    [214, 56, 34, 84], [244, 44, 26, 96], [266, 60, 34, 80], [296, 50, 28, 90],
  ]
  const win = [
    [10, 80], [40, 60], [60, 72], [86, 44], [90, 66], [116, 66], [140, 54],
    [138, 78], [172, 76], [196, 50], [222, 70], [250, 58], [252, 82], [276, 72], [304, 64],
  ]
  return (
    <svg className="ent-skyline" viewBox="0 0 320 140" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      {bl.map(([x, y, w, h], i) => <rect key={i} x={x} y={y} width={w} height={h} fill="#0a0904" />)}
      {win.map(([x, y], i) => (
        <rect key={'w' + i} className="ent-win" x={x} y={y} width="5" height="6" rx="1"
          fill="#FFCE0A" style={{ animationDelay: (i * 1.7) % 9 + 's' }} />
      ))}
    </svg>
  )
}

export default function Entrada() {
  const [modo, setModo] = useState('entrar') // 'entrar' | 'registar'
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [convite, setConvite] = useState('')
  const [erro, setErro] = useState('')
  const [busy, setBusy] = useState(false)

  const trocar = (m) => { setModo(m); setErro('') }

  const submeter = async () => {
    if (busy) return
    setErro('')
    if (!email.trim() || !pass) { setErro('Preenche o email e a password.'); return }
    if (modo === 'registar' && !nome.trim()) { setErro('Diz-nos o teu nome — é o que a equipa vai ver.'); return }
    if (modo === 'registar' && !convite.trim()) { setErro('Falta o código de convite da empresa.'); return }
    setBusy(true)
    try {
      if (modo === 'entrar') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pass })
        if (error) throw error
      } else {
        // verificação do convite no servidor ANTES de criar a conta (erro limpo);
        // o trigger na base de dados volta a verificar — dupla barreira
        const { data: ok, error: e1 } = await supabase.rpc('verificar_convite', { codigo: convite.trim().toUpperCase() })
        if (e1) throw e1
        if (!ok) { setErro('Código de convite inválido — confirma com quem te convidou.'); setBusy(false); return }
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password: pass,
          options: { data: { nome: nome.trim(), codigo_convite: convite.trim().toUpperCase() } },
        })
        if (error) throw error
      }
      // sucesso: o onAuthStateChange no App troca para o escritório — o dia amanhece
    } catch (e) {
      setErro(traduzErro(e?.message || String(e)))
      setBusy(false)
    }
  }

  const onKey = (e) => { if (e.key === 'Enter') submeter() }

  return (
    <div className="entrada">
      <div className="ent-stars" aria-hidden="true">
        {Array.from({ length: 26 }).map((_, i) => (
          <span key={i} style={{
            left: (i * 37 + 11) % 100 + '%', top: (i * 23 + 7) % 55 + '%',
            animationDelay: (i * 0.9) % 6 + 's', opacity: 0.3 + ((i * 13) % 50) / 100,
          }} />
        ))}
      </div>
      <Skyline />

      <div className="ent-card">
        <div className="ent-brand">
          <AnelLogo size={52} />
          <div>
            <div className="ent-bt">ROE</div>
            <div className="ent-bs">Productivity</div>
          </div>
        </div>
        <div className="ent-tag">{modo === 'entrar' ? 'A cidade espera por ti.' : 'Junta-te à equipa ROE.'}</div>

        <div className="ent-tabs" role="tablist">
          <button role="tab" aria-selected={modo === 'entrar'} className={modo === 'entrar' ? 'on' : ''} onClick={() => trocar('entrar')}>Entrar</button>
          <button role="tab" aria-selected={modo === 'registar'} className={modo === 'registar' ? 'on' : ''} onClick={() => trocar('registar')}>Registar</button>
        </div>

        {modo === 'registar' && (
          <label className="ent-field">
            <span>Nome</span>
            <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} onKeyDown={onKey}
              placeholder="como a equipa te conhece" autoComplete="name" />
          </label>
        )}
        <label className="ent-field">
          <span>Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={onKey}
            placeholder="o teu email" autoComplete="off" name="roe-email" />
        </label>
        <label className="ent-field">
          <span>Password</span>
          <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} onKeyDown={onKey}
            placeholder={modo === 'registar' ? 'mínimo 6 caracteres' : 'a tua password'}
            autoComplete="new-password" name="roe-pass" />
        </label>
        {modo === 'registar' && (
          <label className="ent-field">
            <span>Código de convite</span>
            <input className="ent-convite" type="text" value={convite}
              onChange={(e) => setConvite(e.target.value.toUpperCase())} onKeyDown={onKey}
              placeholder="pede a quem te convidou" autoComplete="off" spellCheck="false" />
          </label>
        )}

        {erro && <div className="ent-erro" role="alert">{erro}</div>}

        <button className="ent-go" onClick={submeter} disabled={busy}>
          {busy ? 'a abrir a porta…' : modo === 'entrar' ? 'Entrar no escritório' : 'Criar a minha conta'}
        </button>

        <div className="ent-foot">10 lugares · uma cidade para construir · {ROE_VER}</div>
      </div>
    </div>
  )
}
