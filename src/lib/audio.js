let ctx = null
export function ac() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

// ---- Karplus-Strong: síntese de corda dedilhada ----
function pluckBuffer(freq, dur = 1.6) {
  const c = ac()
  const sr = c.sampleRate
  const N = Math.round(sr / freq)
  const len = Math.floor(sr * dur)
  const buf = c.createBuffer(1, len, sr)
  const out = buf.getChannelData(0)
  const delay = new Float32Array(N)
  // excitação: ruído com um toque de "palhetada" (mistura de ruído e rampa)
  for (let i = 0; i < N; i++) delay[i] = (Math.random() * 2 - 1) * 0.9 + Math.sin((i / N) * Math.PI) * 0.1
  let prev = 0
  const damp = 0.996 // sustain
  for (let i = 0; i < len; i++) {
    const j = i % N
    const cur = delay[j]
    // filtro passa-baixo no loop (média com amostra anterior) = decaimento natural dos agudos
    const nxt = damp * 0.5 * (cur + prev)
    delay[j] = nxt
    prev = cur
    out[i] = cur
  }
  return buf
}

export function playNote(midi, delay = 0, dur = 1.6) {
  const c = ac()
  const t = c.currentTime + delay
  const f = 440 * Math.pow(2, (midi - 69) / 12)
  const src = c.createBufferSource()
  src.buffer = pluckBuffer(f, dur)
  const g = c.createGain()
  g.gain.setValueAtTime(0.85, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + dur)
  // corpo: leve realce de médios-graves como a caixa de uma guitarra
  const body = c.createBiquadFilter()
  body.type = 'peaking'; body.frequency.value = 220; body.gain.value = 3; body.Q.value = 0.8
  const lp = c.createBiquadFilter()
  lp.type = 'lowpass'; lp.frequency.value = 5200
  src.connect(body).connect(lp).connect(g).connect(c.destination)
  src.start(t)
}

// acorde/arpejo rápido (usado no fim dos timers e feedbacks)
export function playChime() {
  // E maior aberto, dedilhado: E2 B2 E3 G#3 B3 E4
  const notas = [40, 47, 52, 56, 59, 64]
  notas.forEach((n, i) => playNote(n, i * 0.045, 2.2))
}
export function playAcerto() { playNote(76, 0, 0.5); playNote(83, 0.09, 0.8) }
export function playErro() { playNote(41, 0, 0.7) }

export function createMetronome(onBeat) {
  let timer = null, next = 0, bpm = 92, beat = 0
  function click(t, accent) {
    const c = ac()
    const o = c.createOscillator(); const g = c.createGain()
    o.frequency.value = accent ? 1720 : 1150
    g.gain.setValueAtTime(0.3, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05)
    o.connect(g).connect(c.destination)
    o.start(t); o.stop(t + 0.06)
  }
  function tick() {
    const c = ac()
    while (next < c.currentTime + 0.12) {
      click(next, beat % 4 === 0)
      if (onBeat) onBeat(beat % 4)
      beat++
      next += 60 / bpm
    }
  }
  return {
    start() { const c = ac(); next = c.currentTime + 0.06; beat = 0; timer = setInterval(tick, 25) },
    stop() { clearInterval(timer); timer = null },
    setBpm(b) { bpm = b },
    get running() { return Boolean(timer) },
  }
}

export const NOMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
export const AFINACAO = [64, 59, 55, 50, 45, 40] // cordas 1..6 (E aguda, B, G, D, A, E grave)
export const CORDAS = ['E', 'B', 'G', 'D', 'A', 'E'] // nomes por índice 1..6
export const midiDe = (corda, casa) => AFINACAO[corda - 1] + casa
export const nomeDe = (midi) => NOMES[midi % 12]
