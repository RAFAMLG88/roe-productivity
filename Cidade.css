import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase.js'

const RoeContext = createContext(null)
export const useRoe = () => useContext(RoeContext)

// prioridades: 'urgente' > 'importante' > 'normal'
export const PRI_PESO = { urgente: 0, importante: 1, normal: 2 }

// data local de hoje em YYYY-MM-DD (o dia da água é o dia do relógio do utilizador)
const hojeStr = () => {
  const d = new Date()
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

// linha da base de dados → forma que a app usa desde a Fase 1
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
})

// patch da app → colunas da base de dados (só as conhecidas)
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
  const [agua, setAgua] = useState(0) // copos de 250 ml (0–8), do dia de hoje
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

  // ── carregamento inicial: as tuas tarefas + a água de hoje ──
  useEffect(() => {
    if (!uid) return
    let vivo = true
    Promise.all([
      supabase.from('tarefas').select('*').eq('owner_id', uid).order('criada_em', { ascending: false }),
      supabase.from('agua').select('ml').eq('user_id', uid).eq('dia', hojeStr()).maybeSingle(),
    ]).then(([t, a]) => {
      if (!vivo) return
      if (t.error) avisaErro(t.error)
      else setTarefas((t.data || []).map(daBD))
      if (!a.error && a.data) setAgua(Math.min(8, Math.round((a.data.ml || 0) / 250)))
      setPronto(true)
    })
    return () => { vivo = false }
  }, [uid, avisaErro])

  // ── escritas: otimistas no ecrã, gravadas no Supabase ──
  const capturar = useCallback((dados) => {
    const id = crypto.randomUUID()
    const t = {
      id,
      texto: dados.texto,
      tipo: dados.tipo || 'outros',
      min: Number(dados.min) || 15,
      prioridade: dados.prioridade || 'normal',
      estado: 'fila',
      criadaEm: Date.now(),
      ownerId: uid,
      criadaPor: uid,
    }
    setTarefas((ts) => [t, ...ts])
    supabase.from('tarefas').insert({
      id, owner_id: uid, criada_por: uid,
      texto: t.texto, tipo: t.tipo, min: t.min, prioridade: t.prioridade, estado: 'fila',
    }).then(({ error }) => { if (error) avisaErro(error) })
    return id
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

  const gravaAgua = useCallback((copos) => {
    if (!uid) return
    supabase.from('agua').upsert({ user_id: uid, dia: hojeStr(), ml: copos * 250 })
      .then(({ error }) => { if (error) avisaErro(error) })
  }, [uid, avisaErro])

  const addAgua = useCallback(() => {
    const n = Math.min(agua + 1, 8)
    setAgua(n); gravaAgua(n)
  }, [agua, gravaAgua])
  const removeAgua = useCallback(() => {
    const n = Math.max(agua - 1, 0)
    setAgua(n); gravaAgua(n)
  }, [agua, gravaAgua])

  const fila = tarefas.filter((t) => t.estado === 'fila')
  const eleitas = tarefas.filter((t) => t.estado === 'eleita')
  const feitas = tarefas.filter((t) => t.estado === 'feita')

  const value = {
    tarefas, fila, eleitas, feitas, pronto,
    capturar, atualizar, eleger, paraFila, concluir, apagar,
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
    </RoeContext.Provider>
  )
}
