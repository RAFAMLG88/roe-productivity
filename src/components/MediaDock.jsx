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
function scEmbed(url) {
  try {
    const u = new URL(url.trim())
    if (!u.hostname.includes('soundcloud.com')) return null
    if (u.pathname.split('/').filter(Boolean).length < 1) return null
    return 'https://w.soundcloud.com/player/?url=' + encodeURIComponent(u.origin + u.pathname)
      + '&color=%23ffce0a&auto_play=false&hide_related=true&show_comments=false&visual=false'
  } catch { return null }
}


// Dock de música global: vive fora dos ecrãs, por isso mudar de aba NUNCA pára a música.
// Só pára se o utilizador pausar no player ou clicar ✕.
export default function MediaDock({ cityOpen }) {
  const { media, mediaTitle, setMediaUrl, playerAnchor } = useRoe()
  const [mini, setMini] = useState(false)
  const [pos, setPos] = useState(null) // posição escolhida pelo utilizador (arrasto)
  const [dragging, setDragging] = useState(false)
  React.useEffect(() => { if (cityOpen) setMini(true) }, [cityOpen])
  const drag = useRef(null)
  const onGrab = (e) => {
    if (e.target.closest('.md-btn')) return
    const z = window.__roeZ || 1 // com o auto-ajuste ativo, o rato fala em px reais e o dock em px escalados
    const dk = e.currentTarget.closest('.media-dock')
    const r = dk.getBoundingClientRect()
    drag.current = { dx: e.clientX / z - r.left / z, dy: e.clientY / z - r.top / z, w: r.width / z, h: r.height / z }
    setDragging(true)
    const move = (ev) => {
      const d = drag.current; if (!d) return
      const zz = window.__roeZ || 1
      const x = Math.min(Math.max(6, ev.clientX / zz - d.dx), window.innerWidth / zz - d.w - 6)
      const y = Math.min(Math.max(6, ev.clientY / zz - d.dy), window.innerHeight / zz - d.h - 6)
      setPos({ x, y })
    }
    const up = () => { drag.current = null; setDragging(false); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up) }
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up)
    e.preventDefault()
  }
  const fonte = media.yt ? 'yt' : media.sp ? 'sp' : media.sc ? 'sc' : null
  if (!fonte) return null
  const src = fonte === 'yt' ? ytEmbed(media.yt) : fonte === 'sp' ? spEmbed(media.sp) : scEmbed(media.sc)
  if (!src) return null
  const titulo = mediaTitle[fonte] || (fonte === 'yt' ? 'YouTube' : fonte === 'sp' ? 'Spotify' : 'SoundCloud')

  const anch = playerAnchor
  const style = anch
    ? { left: anch.x, top: anch.y, width: anch.w, height: anch.h, right: 'auto', bottom: 'auto' }
    : pos ? { left: pos.x, top: pos.y, right: 'auto', bottom: 'auto' } : undefined
  return (
    <div className={`media-dock ${mini ? 'mini' : ''} ${anch ? 'anchored' : ''} ${dragging ? 'dragging' : ''}`} style={style}>
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
