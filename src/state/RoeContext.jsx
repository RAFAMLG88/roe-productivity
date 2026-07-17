import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { supabase } from '../lib/supabase.js'

const RoeContext = createContext(null)
export const useRoe = () => useContext(RoeContext)

// prioridades: 'urgente' > 'importante' > 'normal'
export const PRI_PESO = { urgente: 0, importante: 1, normal: 2 }

const hojeStr = () => {
  const d = new Date()
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

const daBD = (r) => ({
  id: r.id,
  texto: r.texto,
  tipo: r.tipo,
  min: r.min,
  prioridade: r.prioridade,
  estado: r.estado,
  realMin: r.real_min ?? null,
  criadaEm: new Date(r.criada_em).getTime(),
  feitaEm: r.feita_em ? new Date(r.feita_em).getTime() : undefined,
  ownerId: r.owner_id,
  criadaPor: r.criada_por,
  delegadaEm: r.delegada_em ? new Date(r.delegada_em).getTime() : null,
})

const paraBD = (patch) => {
  const m = {}
  if ('texto' in patch) m.texto = patch.texto
  if ('tipo' in patch) m.tipo = patch.tipo
  if ('min' in patch) m.min = patch.min
  if ('prioridade' in patch) m.prioridade = patch.prioridade
  if ('estado' in patch) m.estado = patch.estado
  if ('realMin' in patch) m.real_min = patch.realMin
  if ('feitaEm' in patch) m.feita_em = patch.feitaEm ? new Date(patch.feitaEm).toISOString() : null
  return m
}

// Estados de uma tarefa: 'fila' | 'eleita' | 'feita'
export function RoeProvider({ children, perfil = null, sair = null }) {
  const uid = perfil?.id || null
  const [tarefas, setTarefas] = useState([])
  const [equipa, setEquipa] = useState([])
  const [agua, setAgua] = useState(0) // copos de 250 ml (0–8), hoje
  const [pronto, setPronto] = useState(false)
  const [syncErro, setSyncErro] = useState('')
  const [playerAnchor, setPlayerAnchor] = useState(null)
  const [diaComecou, setDiaComecou] = useState(false)
  const [focoAtiva, setFocoAtiva] = useState(null)
  const [media, setMedia] = useState({ yt: '', sp: '' })
  const [mediaTitle, setMediaTitle] = useState({ yt: '', sp: '' })
  const setMediaUrl = useCallback((fonte, url) => setMedia((m) => ({ ...m, [fonte]: url })), [])
  const setMediaTitulo = useCallback((fonte, t) => setMediaTitle((m) => ({ ...m, [fonte]: t })), [])
  const erroTimer = useRef(null)

  const avisaErro = useCallback((e) => {
    console.error('[ROE sync]', e)
    setSyncErro('sem ligação ao servidor — a última alteração pode não ter ficado guardada')
    clearTimeout(erroTimer.current)
    erroTimer.current = setTimeout(() => setSyncErro(''), 6000)
  }, [])

  // ── carregamento inicial: as minhas + as que deleguei, a equipa, a água de hoje ──
  useEffect(() => {
    if (!uid) return
    let vivo = true
    Promise.all([
      supabase.from('tarefas').select('*')
        .or('owner_id.eq.' + uid + ',criada_por.eq.' + uid)
        .order('criada_em', { ascending: false }),
      supabase.from('profiles').select('id,nome,cor').order('criado_em', { ascending: true }),
      supabase.from('agua').select('ml').eq('user_id', uid).eq('dia', hojeStr()).maybeSingle(),
    ]).then(([t, p, a]) => {
      if (!vivo) return
      if (t.error) avisaErro(t.error)
      else setTarefas((t.data || []).map(daBD))
      if (!p.error) setEquipa(p.data || [])
      if (!a.error && a.data) setAgua(Math.min(8, Math.round((a.data.ml || 0) / 250)))
      setPronto(true)
    })
    return () => { vivo = false }
  }, [uid, avisaErro])

  // ── tempo real: tarefas delegadas a mim aparecem ao segundo; o estado
  //    das que deleguei atualiza-se quando o colega mexe nelas ──
  const [notifDeleg, setNotifDeleg] = useState(null) // { texto, deId }
  const notifTimer = useRef(null)
  const somDeleg = () => {
    try {
      const AC = window.AudioContext || window.webkitAudioContext
      const ctx = new AC()
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.frequency.value = 988; g.gain.setValueAtTime(0.0001, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.1)
      o.start(); o.stop(ctx.currentTime + 1.15)
    } catch { /* sem gesto do utilizador o browser pode recusar áudio — tudo bem */ }
  }
  const avisaDelegacao = useCallback((r) => {
    setNotifDeleg({ texto: r.texto, deId: r.criada_por })
    somDeleg()
    clearTimeout(notifTimer.current)
    notifTimer.current = setTimeout(() => setNotifDeleg(null), 8000)
  }, [])

  useEffect(() => {
    if (!uid) return
    const aplica = (payload) => {
      if (payload.eventType === 'DELETE') {
        const id = payload.old && payload.old.id
        if (id) setTarefas((ts) => ts.filter((t) => t.id !== id))
        return
      }
      const r = payload.new
      if (!r) return
      // se deixou de me dizer respeito (ex.: re-delegada entre outros), remove
      if (r.owner_id !== uid && r.criada_por !== uid) {
        setTarefas((ts) => ts.filter((t) => t.id !== r.id))
        return
      }
      const t = daBD(r)
      // delegaram-me algo? (nasceu já minha por outro, ou mudou de dono para mim)
      const nasceuDelegada = payload.eventType === 'INSERT' && r.owner_id === uid && r.criada_por !== uid
      const passouParaMim = payload.eventType === 'UPDATE' && r.owner_id === uid
        && payload.old && payload.old.owner_id && payload.old.owner_id !== uid
      if (nasceuDelegada || passouParaMim) avisaDelegacao(r)
      setTarefas((ts) => {
        const i = ts.findIndex((x) => x.id === t.id)
        if (i === -1) return [t, ...ts]
        const c = ts.slice(); c[i] = t; return c
      })
    }
    const novoPerfil = (payload) => {
      const r = payload.new
      if (!r) return
      setEquipa((eq) => eq.some((p) => p.id === r.id) ? eq.map((p) => p.id === r.id ? r : p) : [...eq, r])
    }
    const ch = supabase.channel('roe-dados-' + uid)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tarefas', filter: 'owner_id=eq.' + uid }, aplica)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tarefas', filter: 'criada_por=eq.' + uid }, aplica)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, novoPerfil)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [uid])

  // ── presença em tempo real: quem está em foco, em pausa ou livre ──
  // Robustez: o estado é republicado a cada 30s (keepalive) e reenviado após
  // qualquer reconexão (rede a piscar, separador em fundo, portátil a dormir).
  // Quem vê considera "fora" uma presença sem sinal há >95s.
  const [presencas, setPresencas] = useState({})
  const [presRetry, setPresRetry] = useState(0) // watchdog: força recriar o canal se ele morrer
  const presCh = useRef(null)
  const ultimaPres = useRef(null) // último payload publicado (para reenvio/keepalive)
  const presAntes = useRef({})    // para carimbar rx (hora local de RECEÇÃO) — imune a relógios errados

  useEffect(() => {
    if (!uid || !perfil?.nome) return
    const ch = supabase.channel('roe-presenca', { config: { presence: { key: uid } } })
    const reconstruir = () => {
      const st = ch.presenceState()
      const m = {}
      const antes = presAntes.current
      for (const k of Object.keys(st)) {
        if (st[k] && st[k][0]) {
          const nv = st[k][0]
          const ant = antes[k]
          // rx: se o payload mudou (em diferente), chegou AGORA; senão mantém o carimbo
          m[k] = { ...nv, rx: ant && ant.em === nv.em ? ant.rx : Date.now() }
        }
      }
      presAntes.current = m
      setPresencas(m)
    }
    ch.on('presence', { event: 'sync' }, reconstruir)
    ch.on('presence', { event: 'join' }, reconstruir)
    ch.on('presence', { event: 'leave' }, reconstruir)
    ch.subscribe((status) => {
      // SUBSCRIBED dispara também nas RE-conexões — reenviar o estado é o que
      // impede presenças "penduradas" durante minutos
      if (status === 'SUBSCRIBED') {
        const base = ultimaPres.current || { estado: 'livre', tarefa: null, min: null, restante: null }
        const payload = { ...base, em: Date.now() }
        ultimaPres.current = payload // CRÍTICO: sem isto o keepalive não bate até o Foco publicar algo
        const t = ch.track({ nome: perfil.nome, cor: perfil.cor, ...payload })
        if (t && t.then) t.then((r) => { if (r !== 'ok') console.warn('[ROE presença] track:', r) })
      }
    })
    presCh.current = ch

    // keepalive: refresca o "em" (e o restante, se em foco) sem mudar o estado
    const bater = () => {
      const u = ultimaPres.current
      if (!u || !presCh.current) return
      const q = { ...u }
      if (q.estado === 'foco' && q.restante != null && q.em) {
        q.restante = Math.max(0, q.restante - (Date.now() - q.em) / 1000)
      }
      q.em = Date.now()
      ultimaPres.current = q
      const t = presCh.current.track({ nome: perfil.nome, cor: perfil.cor, ...q })
      if (t && t.then) t.then((r) => { if (r !== 'ok') console.warn('[ROE presença] track:', r) })
    }
    const kaTimer = setInterval(bater, 20000)
    // watchdog: se o canal cair e não se levantar sozinho, recria-o do zero
    const wdTimer = setInterval(() => {
      const st = presCh.current && presCh.current.state
      if (st !== 'joined' && st !== 'joining') {
        console.warn('[ROE presença] canal em estado', st, '— a recriar')
        setPresRetry((n) => n + 1)
      }
    }, 25000)
    const aoVoltar = () => { if (document.visibilityState === 'visible') { bater(); reconstruir() } }
    document.addEventListener('visibilitychange', aoVoltar)
    window.addEventListener('online', bater)

    return () => {
      clearInterval(kaTimer)
      clearInterval(wdTimer)
      document.removeEventListener('visibilitychange', aoVoltar)
      window.removeEventListener('online', bater)
      presCh.current = null
      supabase.removeChannel(ch)
    }
  }, [uid, perfil?.nome, perfil?.cor, presRetry])

  // publicar o MEU estado (chamado pelo Foco ao iniciar/pausar/estender/concluir)
  const setPresenca = useCallback((p) => {
    const payload = { ...p, em: Date.now() }
    ultimaPres.current = payload
    const ch = presCh.current
    if (!ch || !perfil?.nome) return
    ch.track({ nome: perfil.nome, cor: perfil.cor, ...payload })
  }, [perfil?.nome, perfil?.cor])

  // ── escritas otimistas ──
  const capturar = useCallback((dados) => {
    const id = crypto.randomUUID()
    const para = dados.para || uid
    const delegada = para !== uid
    const t = {
      id, texto: dados.texto, tipo: dados.tipo || 'outros',
      min: Number(dados.min) || 15, prioridade: dados.prioridade || 'normal',
      estado: 'fila', criadaEm: Date.now(),
      ownerId: para, criadaPor: uid, delegadaEm: delegada ? Date.now() : null,
    }
    setTarefas((ts) => [t, ...ts])
    supabase.from('tarefas').insert({
      id, owner_id: para, criada_por: uid,
      texto: t.texto, tipo: t.tipo, min: t.min, prioridade: t.prioridade,
      estado: 'fila', delegada_em: delegada ? new Date().toISOString() : null,
    }).then(({ error }) => { if (error) avisaErro(error) })
    return id
  }, [uid, avisaErro])

  // delegar uma tarefa existente da minha fila a um colega
  const delegar = useCallback((id, paraId) => {
    if (!paraId || paraId === uid) return
    setTarefas((ts) => ts.map((t) => t.id === id ? { ...t, ownerId: paraId, estado: 'fila', delegadaEm: Date.now() } : t))
    supabase.from('tarefas')
      .update({ owner_id: paraId, estado: 'fila', delegada_em: new Date().toISOString() })
      .eq('id', id)
      .then(({ error }) => { if (error) avisaErro(error) })
  }, [uid, avisaErro])

  const atualizar = useCallback((id, patch) => {
    setTarefas((ts) => ts.map((t) => t.id === id ? { ...t, ...patch } : t))
    const m = paraBD(patch)
    if (Object.keys(m).length) {
      supabase.from('tarefas').update(m).eq('id', id).then(({ error }) => { if (error) avisaErro(error) })
    }
  }, [avisaErro])

  const eleger = useCallback((id) => atualizar(id, { estado: 'eleita' }), [atualizar])
  const paraFila = useCallback((id) => atualizar(id, { estado: 'fila' }), [atualizar])

  const concluir = useCallback((id, realMin) => {
    const agora = Date.now()
    setTarefas((ts) => ts.map((t) => t.id === id ? { ...t, estado: 'feita', feitaEm: agora, realMin: realMin || null } : t))
    setFocoAtiva((f) => f === id ? null : f)
    supabase.from('tarefas')
      .update({ estado: 'feita', feita_em: new Date(agora).toISOString(), real_min: realMin || null })
      .eq('id', id)
      .then(({ error }) => { if (error) avisaErro(error) })
  }, [avisaErro])

  const apagar = useCallback((id) => {
    setTarefas((ts) => ts.filter((t) => t.id !== id))
    setFocoAtiva((f) => f === id ? null : f)
    supabase.from('tarefas').delete().eq('id', id).then(({ error }) => { if (error) avisaErro(error) })
  }, [avisaErro])

  // ordem de trabalhos de um colega (leitura pontual; exige a policy "equipa ve o trabalho da equipa")
  const tarefasDe = useCallback(async (colegaId) => {
    const { data, error } = await supabase.from('tarefas').select('*')
      .eq('owner_id', colegaId).neq('estado', 'feita')
      .order('criada_em', { ascending: false })
    if (error) { avisaErro(error); return null }
    return (data || []).map(daBD)
  }, [avisaErro])

  const gravaAgua = useCallback((copos) => {
    if (!uid) return
    supabase.from('agua').upsert({ user_id: uid, dia: hojeStr(), ml: copos * 250 })
      .then(({ error }) => { if (error) avisaErro(error) })
  }, [uid, avisaErro])
  const addAgua = useCallback(() => { const n = Math.min(agua + 1, 8); setAgua(n); gravaAgua(n) }, [agua, gravaAgua])
  const removeAgua = useCallback(() => { const n = Math.max(agua - 1, 0); setAgua(n); gravaAgua(n) }, [agua, gravaAgua])

  // ── derivados: o MEU dia vs o que anda na equipa ──
  const minhas = useMemo(() => tarefas.filter((t) => t.ownerId === uid), [tarefas, uid])
  const fila = useMemo(() => minhas.filter((t) => t.estado === 'fila'), [minhas])
  const eleitas = useMemo(() => minhas.filter((t) => t.estado === 'eleita'), [minhas])
  const feitas = useMemo(() => minhas.filter((t) => t.estado === 'feita'), [minhas])
  const delegadas = useMemo(() => tarefas.filter((t) => t.criadaPor === uid && t.ownerId !== uid), [tarefas, uid])
  const colegas = useMemo(() => equipa.filter((p) => p.id !== uid), [equipa, uid])
  const equipaPorId = useMemo(() => Object.fromEntries(equipa.map((p) => [p.id, p])), [equipa])

  const value = {
    tarefas, fila, eleitas, feitas, pronto,
    capturar, atualizar, eleger, paraFila, concluir, apagar,
    equipa, colegas, equipaPorId, delegadas, delegar,
    presencas, setPresenca, tarefasDe,
    agua, addAgua, removeAgua,
    playerAnchor, setPlayerAnchor,
    diaComecou, setDiaComecou,
    focoAtiva, setFocoAtiva,
    media, setMediaUrl, mediaTitle, setMediaTitulo,
    perfil, sair,
  }
  return (
    <RoeContext.Provider value={value}>
      {children}
      {syncErro && <div className="sync-erro" role="alert">{syncErro}</div>}
      {notifDeleg && (
        <div className="deleg-toast" role="status" onClick={() => setNotifDeleg(null)}>
          <span className="dt-av" style={{ background: (equipaPorId[notifDeleg.deId] || {}).cor || 'var(--mustard)' }}>
            {(((equipaPorId[notifDeleg.deId] || {}).nome || '?').trim().charAt(0) || '?').toUpperCase()}
          </span>
          <div className="dt-b">
            <div className="dt-t">🤝 {((equipaPorId[notifDeleg.deId] || {}).nome || 'Um colega').split(' ')[0]} delegou-te uma tarefa</div>
            <div className="dt-s">{notifDeleg.texto}</div>
          </div>
        </div>
      )}
    </RoeContext.Provider>
  )
}
