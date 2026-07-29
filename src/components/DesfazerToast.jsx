// ── ROE v33: toast global "desfazer" ──
// Vive no App (dentro do provider), reage ao undo store. Barra de 6 s a esvaziar.
import React from 'react'
import { usePendente } from '../state/undo.js'

export default function DesfazerToast() {
  const p = usePendente()
  if (!p) return null
  return (
    <div className="undo-toast" role="status" key={p.n /* nova ação → barra reinicia */}>
      <span className="ut-msg">{p.msg}</span>
      <button className="ut-btn" onClick={p.undo}>DESFAZER</button>
      <i className="ut-prog" />
    </div>
  )
}
