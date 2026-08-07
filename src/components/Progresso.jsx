import { useRef, useState } from 'react'
import { PILARES, NIVEIS, SEMANAS, MESTRES } from '../data/curso'
import { exportarJSON, importarJSON, apagarTudo } from '../lib/store'

const NEON = { A: '#FF2D95', B: '#00E0FF', C: '#FFB020', D: '#CCFF00' }

export default function Progresso({ dados }) {
  const concluidas = dados.progresso.filter((p) => p.concluida).map((p) => p.semana)
  const totalQuiz = dados.quizes.reduce((a, q) => a + q.total, 0)
  const certasQuiz = dados.quizes.reduce((a, q) => a + q.corretas, 0)
  const diasTreino = new Set(dados.tarefas.map((t) => t.data)).size
  const precisaoOuvido = totalQuiz ? Math.round((certasQuiz / totalQuiz) * 100) : 0

  // progresso por nível (a trilha de competências)
  const pctNivel = (nv) => {
    const total = nv.ate - nv.de + 1
    const feitas = concluidas.filter((n) => n >= nv.de && n <= nv.ate).length
    return Math.round((feitas / total) * 100)
  }
  const nivelAtual = NIVEIS.find((nv) => concluidas.filter((n) => n >= nv.de && n <= nv.ate).length < (nv.ate - nv.de + 1)) ?? NIVEIS[4]

  return (
    <div className="pg">
      {/* partículas subtis */}
      <div className="pg-particles" aria-hidden="true">
        {['♪', '♫', '♩', '♬', '♪', '♫'].map((n, i) => (
          <span key={i} className={`gg-particle p${i}`} style={{ color: NEON[['A', 'B', 'C', 'D'][i % 4]] }}>{n}</span>
        ))}
      </div>

      <div className="pg-top">
        <div className="pg-kick">// Progresso do curso</div>
        <h1 className="pg-h1">A tua evolução</h1>
        <p className="pg-sub">{concluidas.length} de 48 semanas concluídas · {diasTreino} dias de treino registados</p>
      </div>

      {/* TRILHA DOS 5 NÍVEIS — a espinha do curso */}
      <div className="pg-trilha">
        {NIVEIS.map((nv) => {
          const pct = pctNivel(nv)
          const ativo = nv.id === nivelAtual.id
          return (
            <div key={nv.id} className={`pg-nivel ${ativo ? 'ativo' : ''}`} style={{ '--nvc': nv.cor }}>
              <div className="pg-nivel-num">{nv.id}</div>
              <div className="pg-nivel-nome">{nv.nome}</div>
              <div className="pg-nivel-sub">{nv.sub}</div>
              <div className="pg-nivel-bar"><i style={{ width: `${Math.max(3, pct)}%` }} /></div>
              <div className="pg-nivel-meta">S{nv.de}–{nv.ate} · {pct}%</div>
            </div>
          )
        })}
      </div>

      {/* OS TRÊS MESTRES — presença constante */}
      <div className="pg-mestres">
        {Object.entries(MESTRES).map(([k, m]) => {
          const ehFavorito = k === 'sambora'
          return (
            <div key={k} className="pg-mestre" style={{ '--mc': m.cor }}>
              <div className="pg-mestre-glow" />
              <div className="pg-mestre-tag">MENTOR{ehFavorito ? ' · O TEU FAVORITO' : ''}</div>
              <div className="pg-mestre-foto-wrap">
                <img src={m.img} alt={m.nome} className="pg-mestre-foto" loading="lazy" />
              </div>
              <div className="pg-mestre-info">
                <div className="pg-mestre-nome">{m.nome}</div>
                <div className="pg-mestre-lema">{m.lema}</div>
                <div className="pg-mestre-adn">{m.adn}</div>
                <div className="pg-mestre-meta">
                  <span>PRESENTE EM TODAS AS SEMANAS</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* STATS néon */}
      <div className="pg-stats">
        <div className="pg-stat">
          <div className="pg-stat-l">Semanas</div>
          <div className="pg-stat-v">{concluidas.length}<small> / 48</small></div>
          <div className="pg-stat-bar"><i style={{ width: `${(concluidas.length / 48) * 100}%`, background: 'linear-gradient(90deg,#FF2D95,#00E0FF)' }} /></div>
        </div>
        <div className="pg-stat">
          <div className="pg-stat-l">Ouvido · precisão</div>
          <div className="pg-stat-v" style={{ color: NEON.B }}>{precisaoOuvido}<small>%</small></div>
          <div className="pg-stat-note">{certasQuiz} certas em {totalQuiz} rondas</div>
        </div>
        <div className="pg-stat">
          <div className="pg-stat-l">Consistência</div>
          <div className="pg-stat-v" style={{ color: NEON.D }}>{diasTreino}<small> dias</small></div>
          <div className="pg-stat-note">Dias com ≥ 1 tarefa feita</div>
        </div>
      </div>

      {/* GRELHA por nível */}
      {NIVEIS.map((nv) => (
        <div className="pg-bloco" key={nv.id} style={{ '--nvc': nv.cor }}>
          <div className="pg-bloco-h">
            <h3>Nível {nv.id} · {nv.nome} — {nv.sub}</h3>
            <span className="pg-bloco-tag">SEMANAS {nv.de}–{nv.ate}</span>
          </div>
          <div className="pg-sem-grid">
            {Array.from({ length: nv.ate - nv.de + 1 }, (_, i) => {
              const n = nv.de + i
              const done = concluidas.includes(n)
              const existe = SEMANAS.some((s) => s.n === n)
              return (
                <div key={n} className={`pg-cell ${done ? 'done' : existe ? 'aberta' : 'locked'}`}
                  title={SEMANAS.find((s) => s.n === n)?.titulo ?? 'Por desbloquear'}>
                  {String(n).padStart(2, '0')}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      <DadosCard />

      <div className="pg-glass">
        <div className="pg-glass-h"><h3>Desafios criativos entregues</h3>
          <span className="pg-bloco-tag">{dados.desafios.length} ENTREGUES</span></div>
        {dados.desafios.length === 0
          ? <p className="pg-empty">Ainda nenhum. O primeiro é a melodia de 4 notas da Semana 01.</p>
          : dados.desafios.sort((a, b) => a.semana - b.semana).map((d) => (
            <div className="pg-desafio-row" key={d.semana}>
              <b style={{ color: NEON.D }}>S{String(d.semana).padStart(2, '0')}</b> · {d.texto}
            </div>
          ))}
      </div>
    </div>
  )
}

function DadosCard() {
  const inputRef = useRef(null)
  const [msg, setMsg] = useState('')

  const onImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try { await importarJSON(file); setMsg('Progresso importado ✓') }
    catch { setMsg('Ficheiro inválido') }
    setTimeout(() => setMsg(''), 2500)
    e.target.value = ''
  }

  const onApagar = () => {
    if (confirm('Apagar todo o progresso guardado neste dispositivo? Esta ação não se desfaz. Exporta primeiro se quiseres uma cópia.')) {
      apagarTudo(); setMsg('Progresso apagado'); setTimeout(() => setMsg(''), 2500)
    }
  }

  return (
    <div className="pg-glass">
      <div className="pg-glass-h"><h3>Gestão de dados</h3><span className="pg-bloco-tag">GUARDADO NESTE DISPOSITIVO</span></div>
      <p className="pg-empty" style={{ marginBottom: 14 }}>
        O teu progresso vive no navegador deste dispositivo. Para o levar para o telemóvel ou fazer backup, exporta um ficheiro JSON e importa-o do outro lado.
      </p>
      <div className="pg-dados-btns">
        <button className="pg-btn" onClick={exportarJSON}>↓ Exportar progresso</button>
        <button className="pg-btn ghost" onClick={() => inputRef.current?.click()}>↑ Importar progresso</button>
        <button className="pg-btn danger" onClick={onApagar}>Apagar tudo</button>
        <input ref={inputRef} type="file" accept="application/json,.json" onChange={onImport} style={{ display: 'none' }} />
      </div>
      {msg && <p className="pg-msg">{msg}</p>}
    </div>
  )
}
