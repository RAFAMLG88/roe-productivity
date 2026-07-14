import React, { createContext, useContext, useState, useCallback } from 'react'

const RoeContext = createContext(null)
export const useRoe = () => useContext(RoeContext)

let _id = 0
const nextId = () => 'i' + (Date.now() + (_id++))

// Uma tarefa vive num de três "sítios":
//   'fila'    → capturada, à espera
//   'eleita'  → escolhida para hoje (aparece no Briefing eleição + Foco)
//   'feita'   → concluída (constrói a cidade)
export function RoeProvider({ children }) {
  const [tarefas, setTarefas] = useState([])       // todas as tarefas
  const [intencao, setIntencao] = useState('')      // frase do dia
  const [agua, setAgua] = useState(0)               // copos de água hoje
  const [focoAtiva, setFocoAtiva] = useState(null)  // id da tarefa em foco
  const [media, setMedia] = useState({ yt: '', sp: '' }) // URLs de música da sessão
  const setMediaUrl = useCallback((fonte, url) => setMedia((m) => ({ ...m, [fonte]: url })), [])

  // ── CAPTURAR ──
  const capturar = useCallback((dados) => {
    // dados: {texto, tipo, min, importante}
    const t = {
      id: nextId(),
      texto: dados.texto,
      tipo: dados.tipo || 'outros',
      min: Number(dados.min) || 15,
      importante: !!dados.importante,
      estado: 'fila',
      criadaEm: Date.now(),
    }
    setTarefas((ts) => [t, ...ts])
    return t.id
  }, [])

  // ── ADICIONAR direto como eleita (Briefing) ──
  const adicionarEleita = useCallback((dados) => {
    const t = {
      id: nextId(),
      texto: dados.texto,
      tipo: dados.tipo || 'outros',
      min: Number(dados.min) || 30,
      importante: dados.importante !== false,
      estado: 'eleita',
      criadaEm: Date.now(),
    }
    setTarefas((ts) => [...ts, t])
    return t.id
  }, [])

  // ── MOVER entre estados ──
  const eleger = useCallback((id) => setTarefas((ts) => ts.map((t) => t.id === id ? { ...t, estado: 'eleita' } : t)), [])
  const paraFila = useCallback((id) => setTarefas((ts) => ts.map((t) => t.id === id ? { ...t, estado: 'fila' } : t)), [])
  const concluir = useCallback((id) => {
    setTarefas((ts) => ts.map((t) => t.id === id ? { ...t, estado: 'feita', feitaEm: Date.now() } : t))
    setFocoAtiva((f) => f === id ? null : f)
  }, [])

  // ── APAGAR ──
  const apagar = useCallback((id) => {
    setTarefas((ts) => ts.filter((t) => t.id !== id))
    setFocoAtiva((f) => f === id ? null : f)
  }, [])

  // ── ÁGUA ──
  const addAgua = useCallback(() => setAgua((a) => Math.min(a + 1, 8)), [])
  const removeAgua = useCallback(() => setAgua((a) => Math.max(a - 1, 0)), [])

  // ── derivados ──
  const fila = tarefas.filter((t) => t.estado === 'fila')
  const eleitas = tarefas.filter((t) => t.estado === 'eleita')
  const feitas = tarefas.filter((t) => t.estado === 'feita')

  const value = {
    tarefas, fila, eleitas, feitas,
    capturar, adicionarEleita, eleger, paraFila, concluir, apagar,
    intencao, setIntencao,
    agua, addAgua, removeAgua,
    focoAtiva, setFocoAtiva,
    media, setMediaUrl,
  }
  return <RoeContext.Provider value={value}>{children}</RoeContext.Provider>
}
