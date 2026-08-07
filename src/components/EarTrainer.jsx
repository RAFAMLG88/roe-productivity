import { useMemo, useState } from 'react'
import { playNote, playAcerto, playErro } from '../lib/audio'
import { saveQuiz } from '../lib/store'
import { PILARES } from '../data/curso'

function novaRonda(quiz) {
  const root = 45 + Math.floor(Math.random() * 17) // A2..D4
  if (quiz.tipo === 'grau_pentatonica') {
    const op = quiz.opcoes[Math.floor(Math.random() * quiz.opcoes.length)]
    return { root, segunda: root + op.semitons, correta: op.id, tocarTonica: true }
  }
  if (quiz.tipo === 'direcao') {
    const r = Math.random()
    if (r < 0.34) return { root, segunda: root, correta: 'igual' }
    const delta = 1 + Math.floor(Math.random() * 7)
    return r < 0.67
      ? { root, segunda: root + delta, correta: 'aguda' }
      : { root, segunda: root - delta, correta: 'grave' }
  }
  const op = quiz.opcoes[Math.floor(Math.random() * quiz.opcoes.length)]
  return { root, segunda: root + op.semitons, correta: op.id }
}

export default function EarTrainer({ semana, uid, onSaved }) {
  const quiz = semana.quiz
  const [ronda, setRonda] = useState(1)
  const [certas, setCertas] = useState(0)
  const [atual, setAtual] = useState(() => novaRonda(quiz))
  const [resposta, setResposta] = useState(null)
  const [fim, setFim] = useState(false)
  const [tocou, setTocou] = useState(false)

  const tocar = () => {
    if (atual.tocarTonica) {
      // toca a tónica (referência), depois a nota a identificar
      playNote(atual.root, 0, 1.1)
      playNote(atual.root + 12, 0.5, 1.1) // reforça a tónica na oitava
      playNote(atual.segunda, 1.25, 1.6)
    } else {
      playNote(atual.root, 0)
      playNote(atual.segunda, 0.85)
    }
    setTocou(true)
  }

  const responder = async (id) => {
    if (resposta || !tocou) return
    setResposta(id)
    const acertou = id === atual.correta
    if (acertou) { setCertas((c) => c + 1); playAcerto() } else { playErro() }
    setTimeout(async () => {
      if (ronda >= quiz.rondas) {
        setFim(true)
        const total = quiz.rondas
        const corretas = certas + (acertou ? 1 : 0)
        try { await saveQuiz(uid, semana.n, quiz.tipo, total, corretas); onSaved?.() } catch (e) { console.error(e) }
      } else {
        setRonda((r) => r + 1)
        setAtual(novaRonda(quiz))
        setResposta(null)
        setTocou(false)
      }
    }, 900)
  }

  const reiniciar = () => {
    setRonda(1); setCertas(0); setAtual(novaRonda(quiz)); setResposta(null); setFim(false); setTocou(false)
  }

  const precisao = useMemo(() => Math.round((certas / quiz.rondas) * 100), [certas, quiz.rondas])

  if (fim) {
    const passou = precisao >= 80
    return (
      <div className="ear2">
        <div className="ear2-h"><h3>{quiz.titulo}</h3><span className="ear2-badge">SESSÃO GUARDADA</span></div>
        <div className="ear2-result">
          <div className="ear2-score" style={{ color: passou ? '#CCFF00' : '#FF2D95' }}>{precisao}<small>%</small></div>
          <p className="ear2-msg">{certas} de {quiz.rondas} corretas · {passou ? 'Acima do critério da semana. Continua assim.' : 'Ainda abaixo dos 80%. Normal — repete amanhã, o ouvido cresce a dormir.'}</p>
          <button className="ear2-btn" onClick={reiniciar}>Nova sessão</button>
        </div>
      </div>
    )
  }

  return (
    <div className="ear2">
      <div className="ear2-h"><h3>{quiz.titulo}</h3>
        <span className="ear2-badge">RONDA {ronda} / {quiz.rondas}</span></div>
      <p className="ear2-desc">{quiz.descricao}</p>
      <button className={`ear2-play ${tocou ? 'played' : ''}`} onClick={tocar} aria-label="Tocar">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="#08080F"><path d="M8 5v14l11-7z" /></svg>
        <span className="ear2-play-ring" />
      </button>
      <div className="ear2-q">{tocou ? (quiz.tipo === 'grau_pentatonica' ? 'Ouviste a tónica e depois a nota. Qual é o grau?' : 'Canta as duas notas. Depois responde.') : 'Carrega no play para ouvir'}</div>
      <div className="ear2-answers" style={{ gridTemplateColumns: `repeat(${Math.min(quiz.opcoes.length, 3)}, 1fr)` }}>
        {quiz.opcoes.map((o) => {
          let cls = 'ear2-ans'
          if (resposta) {
            if (o.id === atual.correta) cls += ' ok'
            else if (o.id === resposta) cls += ' err'
          }
          return <button key={o.id} className={cls} onClick={() => responder(o.id)}>{o.label}</button>
        })}
      </div>
      <div className="ear2-stat"><span>CERTAS ATÉ AGORA</span>
        <b>{certas} / {ronda - 1 + (resposta ? 1 : 0)}</b></div>
    </div>
  )
}
