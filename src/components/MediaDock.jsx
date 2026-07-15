import React, { useState, useRef } from 'react'
import { useRoe } from '../state/RoeContext.jsx'

function ytEmbed(u) {
  try {
    const url = new URL(u)
    if (url.hostname.includes('youtu.be')) return `https://www.youtube-nocookie.com/embed/${url.pathname.slice(1)}?autoplay=1`
    const list = url.searchParams.get('list'); const v = url.searchParams.get('v')
    if (list) return `https://www.youtube-nocookie.com/embed/videoseries?list=${list}&autoplay=1`
    if (v) return `https://www.youtube-nocookie.com/embed/${v}?autoplay=1`
  } catch { /* */ }
  return null
}
function spEmbed(u) {
  try {
    const url = new URL(u)
    if (!url.hostname.includes('spotify.com')) return null
    const path = url.pathname.replace(/^\/(intl-[a-z]+\/)?/, '')
    return `https://open.spotify.com/embed/${path}`
  } catch { /* */ }
  return null
}

// Dock de música global: vive fora dos ecrãs, por isso mudar de aba NUNCA pára a música.
// Só pára se o utilizador pausar no player ou clicar ✕.
export default function MediaDock() {
  const { media, mediaTitle, setMediaUrl, playerAnchor } = useRoe()
  const [mini, setMini] = useState(false)
  const [pos, setPos] = useState(null) // posição escolhida pelo utilizador (arrasto)
  const drag = useRef(null)
  const onGrab = (e) => {
    if (e.target.closest('.md-btn')) return
    const dk = e.currentTarget.closest('.media-dock')
    const r = dk.getBoundingClientRect()
    drag.current = { dx: e.clientX - r.left, dy: e.clientY - r.top, w: r.width, h: r.height }
    const move = (ev) => {
      const d = drag.current; if (!d) return
      const x = Math.min(Math.max(6, ev.clientX - d.dx), window.innerWidth - d.w - 6)
      const y = Math.min(Math.max(6, ev.clientY - d.dy), window.innerHeight - d.h - 6)
      setPos({ x, y })
    }
    const up = () => { drag.current = null; window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up) }
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up)
    e.preventDefault()
  }
  const fonte = media.yt ? 'yt' : media.sp ? 'sp' : null
  if (!fonte) return null
  const src = fonte === 'yt' ? ytEmbed(media.yt) : spEmbed(media.sp)
  if (!src) return null
  const titulo = mediaTitle[fonte] || (fonte === 'yt' ? 'YouTube' : 'Spotify')

  const anch = playerAnchor
  const style = anch
    ? { left: anch.x, top: anch.y, width: anch.w, height: anch.h, right: 'auto', bottom: 'auto' }
    : pos ? { left: pos.x, top: pos.y, right: 'auto', bottom: 'auto' } : undefined
  return (
    <div className={`media-dock ${mini ? 'mini' : ''} ${anch ? 'anchored' : ''}`} style={style}>
      <div className="md-bar" onPointerDown={anch ? undefined : onGrab} style={{ cursor: anch ? 'default' : 'grab' }} title={anch ? undefined : 'arrasta-me para onde quiseres'}>
        <span className="md-eq"><b /><b /><b /></span>
        <span className="md-t" title={titulo}>{titulo}</span>
        <button className="md-btn" title={mini ? 'expandir' : 'encolher'} onClick={() => setMini((m) => !m)}>{mini ? '⌃' : '⌄'}</button>
        <button className="md-btn x" title="desligar a música" onClick={() => setMediaUrl(fonte, '')}>✕</button>
      </div>
      <div className="md-body">
        <iframe
          src={src}
          title="Player de música"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          frameBorder="0"
          className={fonte === 'yt' ? 'md-yt' : 'md-sp'}
        />
      </div>
    </div>
  )
}
