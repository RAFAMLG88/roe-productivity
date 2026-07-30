// ── ROE v33: captura rápida global ──
// Tecla C (fora de campos de texto) ou Ctrl+K, em QUALQUER ecrã.
// Usa o capturar() real do contexto → a tarefa nasce na fila com criada_em = agora
// (regra transversal da data de origem respeitada). Enter guarda; chips opcionais
// com as MESMAS etiquetas do ecrã Capturar. Desfazer disponível 6 s.
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRoe } from '../state/RoeContext.jsx'
import { pedirUndo } from '../state/undo.js'
import { TAGS } from '../lib/tags.js'

const PRIS = [
  { k: 'urgente',    ic: '🔥', lab: 'Urgente' },
  { k: 'importante', ic: '⭐', lab: 'Importante' },
  { k: 'normal',     ic: '○',  lab: 'Normal' },
]
const MINS = [15, 30, 45, 60, 90, 120]
const fmtM = (m) => (m >= 60 ? (m % 60 ? `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}` : `${m / 60}h`) : `${m}`)

const emCampo = (el) =>
  !!el && !!el.matches && el.matches('input, textarea, select, [contenteditable="true"], [contenteditable=""]')

export default function CapturaRapida() {
  const { capturar, apagar } = useRoe()
  const [aberto, setAberto] = useState(false)
  const [texto, setTexto] = useState('')
  const [tags, setTags] = useState([])            // v34: multi-seleção
  const [pri, setPri] = useState('normal')
  const [min, setMin] = useState(15)
  const inputRef = useRef(null)
  const toggleTag = (k) => setTags((cur) => cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k])

  const abrir = useCallback(() => {
    setTexto(''); setTags([]); setPri('normal'); setMin(15)
    setAberto(true)
    setTimeout(() => inputRef.current && inputRef.current.focus(), 30)
  }, [])
  const fechar = useCallback(() => setAberto(false), [])

  useEffect(() => {
    const onKey = (e) => {
      const teclaC = (e.key === 'c' || e.key === 'C') && !e.ctrlKey && !e.metaKey && !e.altKey
      const ctrlK = (e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')
      if ((teclaC || ctrlK) && !emCampo(e.target) && !aberto) { e.preventDefault(); abrir(); return }
      if (e.key === 'Escape' && aberto) fechar()
    }
    const onAbrir = () => abrir()
    window.addEventListener('keydown', onKey)
    window.addEventListener('roe-captura-abrir', onAbrir)
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('roe-captura-abrir', onAbrir) }
  }, [aberto, abrir, fechar])

  const guardar = () => {
    const t = texto.trim()
    if (!t) return
    const tipo = tags[0] || 'outros' // retrocompat: a coluna tipo guarda a 1ª tag
    const id = capturar({ texto: t, tipo, tags, min, prioridade: pri })
    fechar()
    const curto = t.length > 34 ? t.slice(0, 33) + '…' : t
    pedirUndo({ msg: `Capturada → Fila · «${curto}»`, onUndo: () => apagar(id) })
  }

  if (!aberto) return null
  return (
    <div className="cr-veu" onClick={(e) => { if (e.target === e.currentTarget) fechar() }}>
      <div className="cr-box" role="dialog" aria-label="Captura rápida">
        <div className="cr-cab"><span>CAPTURA RÁPIDA</span><button className="cr-x" title="Fechar" onClick={fechar}>✕</button></div>
        <input
          ref={inputRef} className="cr-input" type="text" value={texto}
          placeholder="Escreve aqui"
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') guardar() }}
        />
        <div className="cr-lab">tipo · escolhe uma ou mais</div>
        <div className="cr-chips">
          {TAGS.map((t) => (
            <button key={t.key} className={'cr-chip cr-tag-' + t.cls + (tags.includes(t.key) ? ' sel' : '')}
              onClick={() => { toggleTag(t.key); inputRef.current && inputRef.current.focus() }}>
              {t.ic} {t.lab}
            </button>
          ))}
        </div>
        <div className="cr-lab">prioridade</div>
        <div className="cr-chips">
          {PRIS.map((p) => (
            <button key={p.k} className={'cr-chip pri-' + p.k + (pri === p.k ? ' sel' : '')} onClick={() => { setPri(p.k); inputRef.current && inputRef.current.focus() }}>
              {p.ic} {p.lab}
            </button>
          ))}
        </div>
        <div className="cr-lab">duração estimada</div>
        <div className="cr-chips">
          {MINS.map((m) => (
            <button key={m} className={'cr-chip' + (min === m ? ' sel' : '')} onClick={() => { setMin(m); inputRef.current && inputRef.current.focus() }}>
              {fmtM(m)}
            </button>
          ))}
        </div>
        <div className="cr-acao">
          <button className="cr-guardar" onClick={guardar} disabled={!texto.trim()}>Guardar →</button>
        </div>
      </div>
    </div>
  )
}
