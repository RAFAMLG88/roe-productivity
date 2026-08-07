// ── ROE v33: desfazer universal ──
// Uma janela de 6 s por ação. Duas naturezas:
//  · reversível (concluir, eleger, devolver, capturar): a ação executa JÁ no
//    Supabase; o DESFAZER corre a operação inversa (update). Fechar a app não perde nada.
//  · destrutiva (apagar): a tarefa esconde-se de imediato (esconderId) mas o
//    delete real só corre no fim da janela (onCommit). DESFAZER cancela tudo.
// Só existe UMA janela de cada vez: abrir nova fecha (commita) a anterior — simples e previsível.

import { useEffect, useState } from 'react'

const subs = new Set()
const emit = () => subs.forEach((f) => f())

let pendente = null            // { n, msg, undo(), commit(), timer }
let serie = 0                  // nº de série da ação — o toast usa-o como key
const escondidas = new Set()   // ids visualmente removidos à espera do commit

export function pedirUndo({ msg, onUndo, onCommit = null, esconderId = null, ms = 6000 }) {
  if (pendente) { clearTimeout(pendente.timer); pendente.commit() }
  const commit = () => {
    if (onCommit) { try { onCommit() } catch { /* avisaErro do contexto cobre */ } }
    if (esconderId) escondidas.delete(esconderId)
    pendente = null; emit()
  }
  if (esconderId) escondidas.add(esconderId)
  const timer = setTimeout(commit, ms)
  pendente = {
    n: ++serie, msg, timer, commit,
    undo: () => {
      clearTimeout(timer)
      if (esconderId) escondidas.delete(esconderId)
      pendente = null
      if (onUndo) { try { onUndo() } catch { /* idem */ } }
      emit()
    },
  }
  emit()
}

function useVersao() {
  const [, força] = useState(0)
  useEffect(() => {
    const f = () => força((x) => x + 1)
    subs.add(f)
    return () => subs.delete(f)
  }, [])
}

// o toast global lê a ação pendente
export function usePendente() { useVersao(); return pendente }

// os ecrãs filtram tarefas escondidas (apagar com janela)
export function useEscondidas() { useVersao(); return escondidas }
