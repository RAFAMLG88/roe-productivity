import React, { createContext, useContext, useState, useCallback } from 'react'

const RoeContext = createContext(null)
export const useRoe = () => useContext(RoeContext)

let _id = 0
const nextId = () => 'i' + (Date.now() + (_id++))

// prioridades: 'urgente' > 'importante' > 'normal'
export const PRI_PESO = { urgente: 0, importante: 1, normal: 2 }

// Estados de uma tarefa: 'fila' | 'eleita' | 'feita'
export function RoeProvider({ children }) {
  const [tarefas, setTarefas] = useState([])
  const [agua, setAgua] = useState(0)
  const [focoAtiva, setFocoAtiva] = useState(null)
  const [media, setMedia] = useState({ yt: '', sp: '' })
  const [mediaTitle, setMediaTitle] = useState({ yt: '', sp: '' })
  const setMediaUrl = useCallback((fonte, url) => setMedia((m) => ({ ...m, [fonte]: url })), [])
  const setMediaTitulo = useCallback((fonte, t) => setMediaTitle((m) => ({ ...m, [fonte]: t })), [])

  const capturar = useCallback((dados) => {
    const t = {
      id: nextId(),
      texto: dados.texto,
      tipo: dados.tipo || 'outros',
      min: Number(dados.min) || 15,
      prioridade: dados.prioridade || 'normal',
      estado: 'fila',
      criadaEm: Date.now(),
    }
    setTarefas((ts) => [t, ...ts])
    return t.id
  }, [])

  const atualizar = useCallback((id, patch) => {
    setTarefas((ts) => ts.map((t) => t.id === id ? { ...t, ...patch } : t))
  }, [])

  const eleger = useCallback((id) => setTarefas((ts) => ts.map((t) => t.id === id ? { ...t, estado: 'eleita' } : t)), [])
  const paraFila = useCallback((id) => setTarefas((ts) => ts.map((t) => t.id === id ? { ...t, estado: 'fila' } : t)), [])
  const concluir = useCallback((id, realMin) => {
    setTarefas((ts) => ts.map((t) => t.id === id ? { ...t, estado: 'feita', feitaEm: Date.now(), realMin: realMin || null } : t))
    setFocoAtiva((f) => f === id ? null : f)
  }, [])
  const apagar = useCallback((id) => {
    setTarefas((ts) => ts.filter((t) => t.id !== id))
    setFocoAtiva((f) => f === id ? null : f)
  }, [])

  const addAgua = useCallback(() => setAgua((a) => Math.min(a + 1, 8)), [])
  const removeAgua = useCallback(() => setAgua((a) => Math.max(a - 1, 0)), [])

  const fila = tarefas.filter((t) => t.estado === 'fila')
  const eleitas = tarefas.filter((t) => t.estado === 'eleita')
  const feitas = tarefas.filter((t) => t.estado === 'feita')

  const value = {
    tarefas, fila, eleitas, feitas,
    capturar, atualizar, eleger, paraFila, concluir, apagar,
    agua, addAgua, removeAgua,
    focoAtiva, setFocoAtiva,
    media, setMediaUrl, mediaTitle, setMediaTitulo,
  }
  return <RoeContext.Provider value={value}>{children}</RoeContext.Provider>
}
