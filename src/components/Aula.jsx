import { useState } from 'react'
import { PILARES, NIVEIS, MESTRES } from '../data/curso'
import { FretSVG } from './Fretboard'
import { saveDesafio, saveProgresso } from '../lib/store'
import Diagrama from './Diagrama'

const NEON = { A: '#FF2D95', B: '#00E0FF', C: '#FFB020', D: '#CCFF00' }
const MESTRE_COR = { slash: '#FF7A1A', sambora: '#FF2D95', smith: '#00E0FF' }

export default function Aula({ semana, uid, dados, refresh }) {
  const prog = dados.progresso.find((p) => p.semana === semana.n)
  const [criterios, setCriterios] = useState(prog?.criterios ?? semana.criterios.map(() => false))
  const desafioGuardado = dados.desafios.find((d) => d.semana === semana.n)
  const [texto, setTexto] = useState(desafioGuardado?.texto ?? '')
  const [msg, setMsg] = useState('')
  const nivel = NIVEIS.find((nv) => nv.id === semana.nivel) ?? NIVEIS[0]
  // guitarra que acompanha a leitura, roda pela fase do curso
  const guitarraLeitura = semana.nivel <= 2 ? '/img/guitarra-lespaul.png'
    : semana.nivel === 3 ? '/img/guitarra-strat.png' : '/img/guitarra-jackson.png'

  const quizesSemana = dados.quizes.filter((q) => q.semana === semana.n)
  const precisao = quizesSemana.length
    ? Math.round((quizesSemana.reduce((a, q) => a + q.corretas, 0) / quizesSemana.reduce((a, q) => a + q.total, 0)) * 100)
    : null

  const toggleCriterio = async (i) => {
    const novos = criterios.map((c, j) => (j === i ? !c : c))
    setCriterios(novos)
    try { await saveProgresso(uid, semana.n, novos, novos.every(Boolean)); refresh() } catch (e) { console.error(e) }
  }
  const guardarDesafio = async () => {
    if (!texto.trim()) return
    try {
      await saveDesafio(uid, semana.n, texto.trim())
      setMsg('Desafio guardado ✓'); setTimeout(() => setMsg(''), 1800)
      refresh()
    } catch (e) { console.error(e) }
  }
  const todas = criterios.every(Boolean)

  return (
    <div className="scr aula2">
      <div className="scr-particles" aria-hidden="true">
        {['♪', '♫', '♩', '♬', '♪', '♫'].map((n, i) => (
          <span key={i} className={`gg-particle p${i}`} style={{ color: NEON[['A', 'B', 'C', 'D'][i % 4]] }}>{n}</span>
        ))}
      </div>

      <div className="scr-top"><div>
        <div className="scr-kick" style={{ color: nivel.cor }}>// Nível {nivel.id} · {nivel.nome} — {nivel.sub}</div>
        <h1 className="scr-title">Semana {String(semana.n).padStart(2, '0')} — {semana.titulo}</h1>
        <p className="scr-sub">{semana.refs}</p>
      </div></div>

      {/* trilha de competências — os 5 níveis */}
      <div className="aula2-trilha">
        {NIVEIS.map((nv, i) => {
          const estado = semana.nivel > nv.id ? 'done' : semana.nivel === nv.id ? 'on' : 'todo'
          return (
            <div className="aula2-trilha-step" key={nv.id}>
              <span className={`aula2-trilha-dot ${estado}`} style={{ '--nvc': nv.cor }} />
              <span className={`aula2-trilha-lbl ${estado}`} style={estado === 'on' ? { color: nv.cor } : {}}>
                {nv.id} · {nv.nome}{estado === 'on' ? ' ◄' : ''}
              </span>
              {i < NIVEIS.length - 1 && <span className="aula2-trilha-arrow">→</span>}
            </div>
          )
        })}
      </div>

      {/* a competência da semana (a espinha) */}
      <div className="aula2-comp">
        <span className="aula2-comp-mark" style={{ color: nivel.cor }}>◆</span>
        <div>
          <div className="aula2-comp-h">A competência desta semana</div>
          <p>{semana.competencia}</p>
        </div>
        <img src={guitarraLeitura} alt="" className="aula2-comp-guitar" aria-hidden="true" />
      </div>

      {/* COMO CADA MESTRE FAZ — os 3 mentores aplicados ao tema */}
      {semana.mentores && (
        <div className="aula2-mentores-wrap">
          <div className="aula2-mentores-head">
            <h2>Como cada mestre faz</h2>
            <p>O mesmo tema, três abordagens. Experimenta as três — a que te sair mais natural é a semente da tua voz.</p>
          </div>
          <div className="aula2-mentores">
            {['slash', 'sambora', 'smith'].map((k) => {
              const m = MESTRES[k]
              const dados_m = semana.mentores[k]
              const cor = MESTRE_COR[k]
              return (
                <div className="aula2-mentor" key={k} style={{ '--mc': cor }}>
                  <div className="aula2-mentor-top">
                    <div className="aula2-mentor-glow" />
                    <img src={m.img} alt={m.nome} className="aula2-mentor-foto" loading="lazy" />
                  </div>
                  <div className="aula2-mentor-body">
                    <div className="aula2-mentor-nome">{m.nome}</div>
                    <p className="aula2-mentor-tec">{dados_m.tec}</p>
                    <div className="aula2-mentor-ref">{dados_m.ref}</div>
                    <div className="aula2-mentor-treino">▸ {dados_m.treino}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="scr-glass aula2-explica">
        <div className="scr-glass-h"><h3>Explicação</h3><span className="scr-badge">≈ 5 MIN DE LEITURA</span></div>
        <div className="aula2-explica-grid">
          <div className="aula2-texto aula2-texto-marcado">
            {semana.explicacao.map((p, i) => (
              <div className="aula2-para" key={i} style={{ '--pc': [NEON.A, NEON.B, NEON.C, NEON.D][i % 4] }}>
                <span className="aula2-para-n">{String(i + 1).padStart(2, '0')}</span>
                <p>{p}</p>
              </div>
            ))}
          </div>
          <div className="aula2-explica-side">
            <img src={guitarraLeitura} alt="" className="aula2-side-guitar" aria-hidden="true" />
            <div className="aula2-side-note">
              <span className="aula2-side-mark">♪</span>
              <p>Lê devagar. A teoria só fica quando a tocas — abre o Braço noutro separador e experimenta cada ideia.</p>
            </div>
          </div>
        </div>
        <Diagrama n={semana.n} />
      </div>

      {semana.braco && (
        <div className="scr-glass">
          <div className="scr-glass-h"><h3>{semana.braco.titulo}</h3><span className="scr-badge">CLICA PARA OUVIR · E A D G B E</span></div>
          <FretSVG notas={semana.braco.notas} altura={185} />
          <div className="scr-fret-leg">
            <span><i style={{ background: '#CCFF00', boxShadow: '0 0 8px #CCFF00' }} />Tónica</span>
            <span><i style={{ background: '#FF5C8A' }} />3.ª menor</span>
            <span><i style={{ background: '#3EE08F' }} />Nota-cor</span>
            <span><i style={{ border: '2px solid #00E0FF' }} />Escala</span>
          </div>
          {semana.braco.legenda && <p className="scr-legenda">{semana.braco.legenda}</p>}
        </div>
      )}

      {/* rotina — os 4 pilares */}
      <div className="scr-glass">
        <div className="scr-glass-h"><h3>Rotina diária da semana</h3>
          <span className="scr-badge">{semana.rotina.reduce((a, t) => a + t.min, 0)} MIN / DIA</span></div>
        <div className="aula2-rotina">
          {semana.rotina.map((t, i) => (
            <div className="aula2-task" key={i} style={{ '--tc': NEON[t.pilar] }}>
              <span className="aula2-task-pilar">{PILARES[t.pilar].nome}</span>
              <div className="aula2-task-name">{t.nome}</div>
              <div className="aula2-task-sub">{t.sub}</div>
              <span className="aula2-task-time">{t.min} MIN{t.freq ? ` · ${t.freq.toUpperCase()}` : ''}</span>
            </div>
          ))}
        </div>
        <p className="scr-legenda">Marca as tarefas de cada dia no Dashboard — é lá que a sequência conta.</p>
      </div>

      {/* aplicação + desafio */}
      <div className="aula2-two">
        <div className="scr-glass">
          <div className="scr-glass-h"><h3>Aplicação prática</h3><span className="scr-badge" style={{ color: '#00E0FF', borderColor: 'rgba(0,224,255,.3)' }}>MÚSICA REAL</span></div>
          <div className="aula2-texto"><p>{semana.aplicacao}</p></div>
        </div>
        <div className="scr-glass">
          <div className="scr-glass-h"><h3>Desafio criativo</h3><span className="scr-badge" style={{ color: '#CCFF00', borderColor: 'rgba(204,255,0,.3)' }}>PILAR CRIAÇÃO</span></div>
          <div className="aula2-texto"><p>{semana.desafio}</p></div>
          <textarea className="gg-textarea" rows="3" value={texto} onChange={(e) => setTexto(e.target.value)}
            placeholder="Escreve aqui a tua resposta (notas, tom, ritmo...)" />
          <button className="pg-btn" style={{ marginTop: 12 }} onClick={guardarDesafio}>{msg || 'Guardar desafio'}</button>
        </div>
      </div>

      {/* autoavaliação */}
      <div className="scr-glass">
        <div className="scr-glass-h"><h3>Autoavaliação · Semana {String(semana.n).padStart(2, '0')}</h3>
          <span className="scr-badge" style={todas ? { color: '#CCFF00', borderColor: 'rgba(204,255,0,.4)' } : {}}>
            {todas ? 'CONCLUÍDA — PRÓXIMA DESBLOQUEADA' : `DESBLOQUEIA A ${String(semana.n + 1).padStart(2, '0')}`}</span></div>
        {semana.criterios.map((c, i) => {
          const eQuiz = c.includes('precisão')
          return (
            <div className={`gg-crit ${criterios[i] ? 'on' : ''}`} key={i} onClick={() => toggleCriterio(i)}>
              <div className="gg-crit-chk">{criterios[i] ? '✓' : ''}</div>
              <span>{c}</span>
              {eQuiz && precisao !== null && (
                <span className={`scr-hist-pct ${precisao >= 80 ? 'ok' : 'low'}`} style={{ marginLeft: 'auto' }}>{precisao}% REAL</span>
              )}
            </div>
          )
        })}
        <p className="scr-legenda" style={{ marginTop: 12 }}>Sê honesto contigo — marcar sem dominar só te rouba a ti. Repetir uma semana é progresso, não falhanço.</p>
      </div>

      {semana.n === nivel.ate && (
        <div className="scr-glass aula2-marco" style={{ borderColor: `color-mix(in srgb, ${nivel.cor} 30%, transparent)` }}>
          <div className="scr-glass-h"><h3 style={{ color: nivel.cor }}>◆ Fim do Nível {nivel.id} — {nivel.nome}</h3>
            <span className="scr-badge">MARCO</span></div>
          <div className="aula2-texto">
            <p>Esta é a última semana do nível <b>{nivel.nome} — {nivel.sub}</b>. Ao concluíres os critérios, consolidas {nivel.desc.toLowerCase()}
            {semana.nivel < 5 ? ` Depois abre-se o Nível ${nivel.id + 1}: ${NIVEIS[nivel.id]?.nome} — ${NIVEIS[nivel.id]?.sub}.` : ' Chegaste ao fim da viagem — a tua voz está livre.'}</p>
          </div>
        </div>
      )}
    </div>
  )
}
