// ── ROE v33: sons de interface (Web Audio, zero ficheiros, zero dependências) ──
// tocarConclusao(): acorde dourado curto ao concluir uma tarefa (Foco)
// tocarPop(): pop subtil para micro-interações
// Nota SSR/teste: o AudioContext só é criado dentro das funções, nunca no import.

let actx = null
function ctx() {
  if (typeof window === 'undefined') return null
  try { return (actx = actx || new (window.AudioContext || window.webkitAudioContext)()) }
  catch { return null }
}

export function tocarConclusao() {
  const a = ctx(); if (!a) return
  try {
    if (a.state === 'suspended') a.resume()
    const t0 = a.currentTime
    // C5 (corpo) + arpejo C6-E6-G6: quente, curto, satisfatório
    ;[[523.25, 0, .10], [1046.5, .02, .16], [1318.5, .09, .15], [1568, .16, .14]].forEach(([f, dt, g]) => {
      const o = a.createOscillator(), ga = a.createGain()
      o.type = 'sine'; o.frequency.value = f
      ga.gain.setValueAtTime(.0001, t0 + dt)
      ga.gain.exponentialRampToValueAtTime(g, t0 + dt + .025)
      ga.gain.exponentialRampToValueAtTime(.0001, t0 + dt + .75)
      o.connect(ga).connect(a.destination)
      o.start(t0 + dt); o.stop(t0 + dt + .85)
    })
  } catch { /* sem áudio disponível — silêncio digno */ }
}

export function tocarPop() {
  const a = ctx(); if (!a) return
  try {
    if (a.state === 'suspended') a.resume()
    const t0 = a.currentTime
    const o = a.createOscillator(), g = a.createGain()
    o.type = 'triangle'
    o.frequency.setValueAtTime(320, t0)
    o.frequency.exponentialRampToValueAtTime(920, t0 + .11)
    g.gain.setValueAtTime(.10, t0)
    g.gain.exponentialRampToValueAtTime(.0001, t0 + .16)
    o.connect(g).connect(a.destination)
    o.start(t0); o.stop(t0 + .2)
  } catch { /* idem */ }
}
