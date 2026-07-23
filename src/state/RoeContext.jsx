import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { supabase, SUPABASE_URL, SUPABASE_ANON } from '../lib/supabase.js'

const RoeContext = createContext(null)
export const useRoe = () => useContext(RoeContext)

// prioridades: 'urgente' > 'importante' > 'normal'
export const PRI_PESO = { urgente: 0, importante: 1, normal: 2 }

const hojeStr = () => {
  const d = new Date()
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

const daAg = (r) => ({
  id: r.id, userId: r.user_id, dia: r.dia,
  inicio: (r.inicio || '').slice(0, 5), fim: (r.fim || '').slice(0, 5), texto: r.texto,
})

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
  delegadaPor: r.delegada_por || null,
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
  const equipaRef = useRef([])
  const [agenda, setAgenda] = useState([]) // blocos de trabalho externo de toda a equipa
  const [agua, setAgua] = useState(0) // copos de 250 ml (0–8), hoje
  const [pronto, setPronto] = useState(false)
  const [syncErro, setSyncErro] = useState('')
  const [playerAnchor, setPlayerAnchor] = useState(null)
  const [diaComecou, setDiaComecou] = useState(false)
  const [focoAtiva, setFocoAtiva] = useState(null)
  const [media, setMedia] = useState({ yt: '', sp: '', sc: '' })
  const [mediaTitle, setMediaTitle] = useState({ yt: '', sp: '', sc: '' })
  const setMediaUrl = useCallback((fonte, url) => setMedia((m) => ({ ...m, [fonte]: url })), [])
  const setMediaTitulo = useCallback((fonte, t) => setMediaTitle((m) => ({ ...m, [fonte]: t })), [])
  const erroTimer = useRef(null)

  const recarregarRef = useRef(null) // preenchido pelo efeito de carga: repõe a verdade do servidor
  const avisaErro = useCallback((e) => {
    console.error('[ROE sync]', e)
    const msg = String((e && e.message) || e || '')
    const ehPermissao = msg.includes('row-level security') || msg.includes('violates') || (e && e.code === '42501')
    setSyncErro(ehPermissao
      ? 'o servidor recusou a operação (permissões) — a app foi reposta como está no servidor'
      : 'sem ligação ao servidor — a última alteração pode não ter ficado guardada')
    if (ehPermissao && recarregarRef.current) recarregarRef.current() // desfaz o otimismo errado no ecrã
    clearTimeout(erroTimer.current)
    erroTimer.current = setTimeout(() => setSyncErro(''), 6000)
  }, [])

  // ── carregamento inicial: as minhas + as que deleguei, a equipa, a água de hoje ──
  useEffect(() => {
    if (!uid) return
    let vivo = true
    const carregar = () => Promise.all([
      supabase.from('tarefas').select('*')
        .or('owner_id.eq.' + uid + ',criada_por.eq.' + uid + ',delegada_por.eq.' + uid)
        .order('criada_em', { ascending: false }),
      supabase.from('profiles').select('id,nome,cor').order('criado_em', { ascending: true }),
      supabase.from('agua').select('ml').eq('user_id', uid).eq('dia', hojeStr()).maybeSingle(),
      supabase.from('agenda_externa').select('*').order('dia').order('inicio'),
    ]).then(([t, p, a, g]) => {
      if (!vivo) return
      if (t.error) avisaErro(t.error)
      else setTarefas((t.data || []).map(daBD))
      if (!p.error) setEquipa(p.data || [])
      if (!a.error && a.data) setAgua(Math.min(8, Math.round((a.data.ml || 0) / 250)))
      if (!g.error) setAgenda((g.data || []).map(daAg))
      setPronto(true)
    })
    recarregarRef.current = () => {
      supabase.from('tarefas').select('*')
        .or('owner_id.eq.' + uid + ',criada_por.eq.' + uid + ',delegada_por.eq.' + uid)
        .order('criada_em', { ascending: false })
        .then(({ data, error }) => { if (vivo && !error) setTarefas((data || []).map(daBD)) })
    }
    carregar()
    return () => { vivo = false; recarregarRef.current = null }
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
  const notifNativa = useCallback((titulo, corpo) => {
    try {
      if (!('Notification' in window) || Notification.permission !== 'granted') return
      if (document.visibilityState === 'visible') return // já vês o toast na app
      const n = new Notification(titulo, { body: corpo, icon: '/icon-192.png', tag: 'roe-deleg' })
      n.onclick = () => { window.focus(); n.close() }
    } catch { /* sem suporte — o toast interno cobre */ }
  }, [])

  const avisaDelegacao = useCallback((r) => {
    const deId = r.delegada_por || r.criada_por
    setNotifDeleg({ texto: r.texto, deId })
    somDeleg()
    const quem = (equipaRef.current.find((p) => p.id === deId) || {}).nome || 'Um colega'
    notifNativa('🤝 ' + quem.split(' ')[0] + ' delegou-te uma tarefa', r.texto)
    clearTimeout(notifTimer.current)
    notifTimer.current = setTimeout(() => setNotifDeleg(null), 8000)
  }, [notifNativa])

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
      if (r.owner_id !== uid && r.criada_por !== uid && r.delegada_por !== uid) {
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
    supabase.getChannels()
      .filter((c) => c.topic === 'realtime:roe-dados-' + uid)
      .forEach((c) => { try { supabase.removeChannel(c) } catch { /* já removido */ } })
    const ch = supabase.channel('roe-dados-' + uid)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tarefas', filter: 'owner_id=eq.' + uid }, aplica)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tarefas', filter: 'criada_por=eq.' + uid }, aplica)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tarefas', filter: 'delegada_por=eq.' + uid }, aplica)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, novoPerfil)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agenda_externa' }, (payload) => {
        if (payload.eventType === 'DELETE') {
          const id = payload.old && payload.old.id
          if (id) setAgenda((a) => a.filter((b) => b.id !== id))
          return
        }
        const r = payload.new
        if (!r) return
        const b = daAg(r)
        setAgenda((a) => a.some((x) => x.id === b.id) ? a.map((x) => x.id === b.id ? b : x) : [...a, b])
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'presenca' }, (payload) => {
        const r = payload.new
        if (!r || r.user_id === uid) return
        setPresencas((m) => ({ ...m, [r.user_id]: linhaPres(r, true) }))
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [uid])

  // ── presença em tempo real VIA BASE DE DADOS ──
  // O canal efémero de presença mostrou-se surdo a atualizações no ambiente da
  // equipa; as alterações de BD (postgres_changes) nunca falharam. Por isso a
  // presença agora é uma tabela: cada um grava o seu estado (transições +
  // batimento de 20s) e todos recebem pelo canal que está provado funcionar.
  const [presencas, setPresencas] = useState({})
  const ultimaPres = useRef(null)
  const tokenRef = useRef(null) // access token vivo, para o sinal de fecho
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { tokenRef.current = data.session?.access_token || null })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => { tokenRef.current = sess?.access_token || null })
    return () => sub.subscription.unsubscribe()
  }, [])

  const linhaPres = (r, aoVivo) => {
    const em = r.em ? Date.parse(r.em) : Date.now()
    return {
      nome: r.nome, cor: r.cor, estado: r.estado, tarefa: r.tarefa,
      min: r.min, restante: r.restante == null ? null : Number(r.restante),
      em,
      // eventos ao vivo chegam AGORA (frescura pelo meu relógio); na fotografia
      // inicial a frescura NÃO renasce — senão cada refresh ressuscitava
      // presenças antigas como "livre" durante mais 95s
      rx: aoVivo ? Date.now() : Math.min(Date.now(), em),
    }
  }

  const gravaPresenca = useCallback((payload) => {
    if (!uid || !perfil?.nome) return
    supabase.from('presenca').upsert({
      user_id: uid, nome: perfil.nome, cor: perfil.cor,
      estado: payload.estado, tarefa: payload.tarefa ?? null,
      min: payload.min ?? null, restante: payload.restante ?? null,
      em: new Date().toISOString(),
    }).then(({ error }) => { if (error) console.warn('[ROE presença] gravação:', error.message) })
  }, [uid, perfil?.nome, perfil?.cor])

  const setPresenca = useCallback((p) => {
    const payload = { ...p, em: Date.now() }
    ultimaPres.current = payload
    gravaPresenca(payload)
  }, [gravaPresenca])

  useEffect(() => {
    if (!uid || !perfil?.nome) return
    let vivo = true
    // fotografia inicial da equipa (entradas velhas envelhecem para "fora" em <95s)
    supabase.from('presenca').select('*').then(({ data, error }) => {
      if (!vivo || error) return
      const m = {}
      for (const r of data || []) { if (r.user_id !== uid) m[r.user_id] = linhaPres(r, false) }
      setPresencas(m)
    })
    // apresentar-me como livre ao entrar (se o Foco ainda não disse nada)
    if (!ultimaPres.current) {
      ultimaPres.current = { estado: 'livre', tarefa: null, min: null, restante: null, em: Date.now() }
    }
    gravaPresenca(ultimaPres.current)
    // batimento: refresca o em (e o restante, se em foco) a cada 20s
    const bater = () => {
      const u = ultimaPres.current
      if (!u) return
      const q = { ...u }
      if (q.estado === 'foco' && q.restante != null && q.em) {
        q.restante = Math.max(0, q.restante - (Date.now() - q.em) / 1000)
      }
      q.em = Date.now()
      ultimaPres.current = q
      gravaPresenca(q)
    }
    const kaTimer = setInterval(bater, 20000)
    // sinal de despedida: ao fechar a página, anuncia "fora" no próprio ato —
    // os colegas veem "externo"/"fora" em ~1s, sem esperar a janela de frescura
    const aoFechar = () => {
      const tk = tokenRef.current
      if (!uid || !tk || !perfil?.nome) return
      try {
        fetch(SUPABASE_URL + '/rest/v1/presenca?on_conflict=user_id', {
          method: 'POST',
          keepalive: true,
          headers: {
            apikey: SUPABASE_ANON,
            Authorization: 'Bearer ' + tk,
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates',
          },
          body: JSON.stringify([{ user_id: uid, nome: perfil.nome, cor: perfil.cor, estado: 'fora', tarefa: null, min: null, restante: null, em: new Date().toISOString() }]),
        })
      } catch { /* melhor esforço — se falhar, a janela de frescura cobre */ }
    }
    window.addEventListener('pagehide', aoFechar)
    const aoVoltar = () => { if (document.visibilityState === 'visible') bater() }
    document.addEventListener('visibilitychange', aoVoltar)
    window.addEventListener('online', bater)
    return () => {
      vivo = false
      clearInterval(kaTimer)
      window.removeEventListener('pagehide', aoFechar)
      document.removeEventListener('visibilitychange', aoVoltar)
      window.removeEventListener('online', bater)
      aoFechar() // sair/logout também anuncia "fora"
    }
  }, [uid, perfil?.nome, gravaPresenca])

  // ── escritas otimistas ──
  const capturar = useCallback((dados) => {
    const id = crypto.randomUUID()
    const para = dados.para || uid
    const delegada = para !== uid
    const t = {
      id, texto: dados.texto, tipo: dados.tipo || 'outros',
      min: Number(dados.min) || 15, prioridade: dados.prioridade || 'normal',
      estado: 'fila', criadaEm: dados.origemEm ? new Date(dados.origemEm).getTime() : Date.now(),
      ownerId: para, criadaPor: uid, delegadaPor: delegada ? uid : null, delegadaEm: delegada ? Date.now() : null,
    }
    setTarefas((ts) => [t, ...ts])
    supabase.from('tarefas').insert({
      id, owner_id: para, criada_por: uid, delegada_por: delegada ? uid : null,
      texto: t.texto, tipo: t.tipo, min: t.min, prioridade: t.prioridade,
      estado: 'fila', delegada_em: delegada ? new Date().toISOString() : null,
      // origem: data/hora REAL de chegada (email) — não o instante da captura
      criada_em: dados.origemEm ? new Date(dados.origemEm).toISOString() : undefined,
    }).then(({ error }) => { if (error) avisaErro(error) })
    return id
  }, [uid, avisaErro])

  // delegar uma tarefa existente da minha fila a um colega
  const delegar = useCallback((id, paraId) => {
    if (!paraId || paraId === uid) return
    setTarefas((ts) => ts.map((t) => t.id === id ? { ...t, ownerId: paraId, estado: 'fila', delegadaPor: uid, delegadaEm: Date.now() } : t))
    supabase.from('tarefas')
      .update({ owner_id: paraId, delegada_por: uid, estado: 'fila', delegada_em: new Date().toISOString() })
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

  // marcar/apagar trabalho externo (a equipa recebe ao segundo)
  const marcarExterno = useCallback(({ dia, inicio, fim, texto }) => {
    const id = crypto.randomUUID()
    setAgenda((a) => [...a, { id, userId: uid, dia, inicio, fim, texto }])
    supabase.from('agenda_externa').insert({ id, user_id: uid, dia, inicio, fim, texto })
      .then(({ error }) => { if (error) avisaErro(error) })
  }, [uid, avisaErro])
  const apagarExterno = useCallback((id) => {
    setAgenda((a) => a.filter((b) => b.id !== id))
    supabase.from('agenda_externa').delete().eq('id', id)
      .then(({ error }) => { if (error) avisaErro(error) })
  }, [avisaErro])

  // ── NOVIDADES: o que aconteceu desde a última visita ──
  const [ultimaVisita, setUltimaVisita] = useState(null)
  const visitaCarimbada = useRef(false)
  useEffect(() => {
    if (!uid || visitaCarimbada.current) return
    visitaCarimbada.current = true
    ;(async () => {
      const { data } = await supabase.from('visitas').select('vista_em').eq('user_id', uid).maybeSingle()
      setUltimaVisita(data?.vista_em ? Date.parse(data.vista_em) : null)
      await supabase.from('visitas').upsert({ user_id: uid, vista_em: new Date().toISOString() })
    })()
  }, [uid])

  const pedirNotificacoes = useCallback(async () => {
    try {
      if (!('Notification' in window)) return 'nao-suportado'
      if (Notification.permission === 'granted') return 'granted'
      return await Notification.requestPermission()
    } catch { return 'erro' }
  }, [])

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
  const delegadas = useMemo(() => tarefas.filter((t) => t.delegadaPor === uid && t.ownerId !== uid), [tarefas, uid])
  useEffect(() => { equipaRef.current = equipa }, [equipa])
  const colegas = useMemo(() => equipa.filter((p) => p.id !== uid), [equipa, uid])
  const equipaPorId = useMemo(() => Object.fromEntries(equipa.map((p) => [p.id, p])), [equipa])

  const value = {
    tarefas, fila, eleitas, feitas, pronto,
    capturar, atualizar, eleger, paraFila, concluir, apagar,
    equipa, colegas, equipaPorId, delegadas, delegar,
    presencas, setPresenca, tarefasDe,
    agenda, marcarExterno, apagarExterno,
    ultimaVisita, pedirNotificacoes,
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
