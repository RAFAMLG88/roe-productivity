import { PILARES, NIVEIS, SEMANAS, MESTRES } from '../data/curso'
import { FretSVG } from './Fretboard'
import { toggleTarefa } from '../lib/store'

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const hojeStr = () => new Date().toISOString().slice(0, 10)

// cor néon de cada pilar (estética híbrida)
const NEON = { A: '#FF2D95', B: '#00E0FF', C: '#FFB020', D: '#CCFF00' }

function calcularSequencia(tarefas) {
  const dias = [...new Set(tarefas.map((t) => t.data))].sort().reverse()
  if (!dias.length) return 0
  let seq = 0
  const d = new Date()
  for (;;) {
    const s = d.toISOString().slice(0, 10)
    if (dias.includes(s)) { seq++; d.setDate(d.getDate() - 1) }
    else if (seq === 0 && s === hojeStr()) { d.setDate(d.getDate() - 1) }
    else break
  }
  return seq
}

export default function Dashboard({ semana, uid, dados, refresh, irPara }) {
  const nivel = NIVEIS.find((nv) => nv.id === semana.nivel) ?? NIVEIS[0]
  // guitarra roda pela fase do curso: Les Paul (fundação/expressão), Strat (cor), Jackson (harmonia/composição)
  const guitarraBloco = semana.nivel <= 2 ? '/img/guitarra-lespaul.png' : semana.nivel === 3 ? '/img/guitarra-strat.png' : '/img/guitarra-jackson.png'
  const tarefasHoje = dados.tarefas.filter((t) => t.data === hojeStr())
  const seq = calcularSequencia(dados.tarefas)

  const feita = (i) => tarefasHoje.some((t) => t.tarefa_idx === i && t.feita)
  const marcar = async (i) => {
    try { await toggleTarefa(uid, semana.n, i, !feita(i)); refresh() } catch (e) { console.error(e) }
  }

  const pilarPct = (p) => {
    const idx = semana.rotina.map((t, i) => ({ t, i })).filter((x) => x.t.pilar === p)
    const feitas = dados.tarefas.filter((t) => idx.some((x) => x.i === t.tarefa_idx) && t.feita).length
    const primeiro = dados.tarefas.length
      ? Math.max(1, Math.ceil((new Date(hojeStr()) - new Date(dados.tarefas.map((t) => t.data).sort()[0])) / 86400000) + 1)
      : 1
    const esperadas = Math.max(1, primeiro * (idx.length || 1))
    return Math.min(100, Math.round((feitas / esperadas) * 100))
  }

  const quizesSemana = dados.quizes.filter((q) => q.semana === semana.n)
  const precisao = quizesSemana.length
    ? Math.round((quizesSemana.reduce((a, q) => a + q.corretas, 0) / quizesSemana.reduce((a, q) => a + q.total, 0)) * 100)
    : 0
  const ultimoBpm = dados.metro.length ? dados.metro[dados.metro.length - 1].bpm : null

  const totalTarefas = semana.rotina.length
  const feitasHoje = semana.rotina.filter((_, i) => feita(i)).length
  const pctHoje = Math.round((feitasHoje / totalTarefas) * 100)

  // título com a "cauda" a néon (parte após —, ou a segunda metade)
  const partes = semana.titulo.split(/ — | – /)
  const tituloBase = partes[0]
  const tituloCauda = partes[1] ?? ''

  const R = 52, C = 2 * Math.PI * R

  return (
    <div className="dash">
      {/* topbar editorial */}
      <div className="dash-topbar">
        <div className="dash-brand">ROE<b>/</b>GUITAR</div>
        <div className="dash-topnav">
          <span className="on">DASH</span>
          <span onClick={() => irPara('aula')}>AULA</span>
          <span onClick={() => irPara('braco')}>BRAÇO</span>
          <span onClick={() => irPara('ouvido')}>OUVIDO</span>
          <span onClick={() => irPara('metronomo')}>MÉTRON</span>
          <span onClick={() => irPara('progresso')}>STATS</span>
        </div>
        <div className="dash-seq">SEQUÊNCIA <b>{seq} {seq === 1 ? 'DIA' : 'DIAS'}</b></div>
      </div>

      {/* hero: número gigante + guitarra do bloco */}
      <div className="dash-hero">
        <div className="dash-hero-txt">
          <div className="dash-kick">// Semana {String(semana.n).padStart(2, '0')} · Nível {nivel.id} — {nivel.nome}</div>
          <h1 className="dash-title">
            {tituloBase}{tituloCauda && <> — <span className="neon">{tituloCauda}</span></>}
          </h1>
          <div className="dash-refs">{semana.refs}</div>
        </div>
        <img src={guitarraBloco} alt="" className="dash-hero-guitar" aria-hidden="true" />
      </div>

      {/* faixa de stats néon */}
      <div className="dash-stats">
        <div className="dstat"><div className="dstat-l">Braço</div><div className="dstat-v" style={{ color: NEON.A }}>{pilarPct('A')}<small>%</small></div></div>
        <div className="dstat"><div className="dstat-l">Ouvido</div><div className="dstat-v" style={{ color: NEON.B }}>{precisao}<small>%</small></div></div>
        <div className="dstat"><div className="dstat-l">Técnica</div><div className="dstat-v" style={{ color: NEON.C }}>{ultimoBpm ?? '—'}<small>{ultimoBpm ? ' bpm' : ''}</small></div></div>
        <div className="dstat"><div className="dstat-l">Criação</div><div className="dstat-v" style={{ color: NEON.D }}>{pilarPct('D')}<small>%</small></div></div>
      </div>

      {/* corpo: rotina (vidro) + acção com anel */}
      <div className="dash-lower">
        <div className="dash-glass">
          <div className="dglass-h"><h3>Rotina de hoje · {DIAS[new Date().getDay()]}</h3>
            <span className="dglass-n">{semana.rotina.reduce((a, t) => a + t.min, 0)} MIN · {totalTarefas} TAREFAS</span></div>
          {semana.rotina.map((t, i) => (
            <div className={`dtask ${feita(i) ? 'done' : ''}`} key={i} onClick={() => marcar(i)}>
              <span className="dtask-idx" style={{ color: NEON[t.pilar] }}>{String(i + 1).padStart(2, '0')}</span>
              <span className={`dchk ${feita(i) ? 'on' : ''}`}>{feita(i) ? '✓' : ''}</span>
              <span className="dtask-dot" style={{ background: NEON[t.pilar], boxShadow: `0 0 10px ${NEON[t.pilar]}` }} />
              <div className="dtask-body">
                <div className="dtask-name">{PILARES[t.pilar].nome} — {t.nome}</div>
                <div className="dtask-sub">{t.sub}</div>
              </div>
              <span className="dtask-time">{String(t.min).padStart(2, '0')}:00</span>
            </div>
          ))}
        </div>

        <div className="dash-action">
          <div className="dglass-h"><h3>Aula de hoje</h3></div>
          <div className="dring-wrap">
            <svg width="132" height="132" viewBox="0 0 132 132">
              <defs><linearGradient id="dring" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FF2D95" /><stop offset="1" stopColor="#00E0FF" /></linearGradient></defs>
              <circle cx="66" cy="66" r={R} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="9" />
              <circle cx="66" cy="66" r={R} fill="none" stroke="url(#dring)" strokeWidth="9" strokeLinecap="round"
                strokeDasharray={C} strokeDashoffset={C * (1 - pctHoje / 100)} transform="rotate(-90 66 66)"
                style={{ transition: 'stroke-dashoffset .6s ease' }} />
              <text x="66" y="62" fontFamily="Sora, sans-serif" fontWeight="800" fontSize="28" fill="#fff" textAnchor="middle">{pctHoje}</text>
              <text x="66" y="82" fontFamily="'JetBrains Mono', monospace" fontSize="11" fill="rgba(255,255,255,.5)" textAnchor="middle">%</text>
            </svg>
            <div className="dring-lbl">{feitasHoje} de {totalTarefas} tarefas feitas</div>
          </div>
          <button className="dbtn" onClick={() => irPara('guiada')}>▶ INICIAR AULA</button>
          <button className="dbtn ghost" onClick={() => irPara('aula')}>Ler a aula primeiro</button>
        </div>
      </div>

      {/* braço da semana (mantém o Fretboard interativo) */}
      <div className="dash-glass dash-fret">
        <div className="dglass-h"><h3>Braço — {semana.braco.titulo}</h3>
          <span className="dglass-n">CLICA PARA OUVIR</span></div>
        <FretSVG notas={semana.braco.notas} altura={170} />
        <div className="dfret-leg">
          <span><i style={{ background: '#CCFF00', boxShadow: '0 0 8px #CCFF00' }} />Tónica</span>
          <span><i style={{ background: '#FF5C8A' }} />3.ª menor</span>
          <span><i style={{ background: '#3EE08F' }} />Nota-cor</span>
          <span><i style={{ border: '2px solid #00E0FF' }} />Escala</span>
        </div>
      </div>
    </div>
  )
}
