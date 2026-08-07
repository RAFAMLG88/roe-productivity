import { useState } from 'react'
import { playNote, midiDe, nomeDe, CORDAS } from '../lib/audio'

const FRETS = [125, 215, 300, 381, 457, 529, 597, 661, 722, 779, 833, 884]
const YS = [27, 46, 66, 85, 104, 123] // cordas 1..6
const NUT = 37

function xCasa(casa) {
  if (casa === 0) return 18
  const prev = casa === 1 ? NUT : FRETS[casa - 2]
  return (prev + FRETS[casa - 1]) / 2
}

export function FretSVG({ notas = [], showNames = false, altura = 150 }) {
  const [ativa, setAtiva] = useState(null)

  const tocar = (corda, casa) => {
    playNote(midiDe(corda, casa))
    setAtiva(`${corda}-${casa}`)
    setTimeout(() => setAtiva(null), 700)
  }

  return (
    <svg viewBox="0 0 920 150" width="100%" height={altura} style={{ display: 'block' }}>
      <rect x="30" y="15" width="860" height="120" rx="6" fill="rgba(255,255,255,.02)" stroke="rgba(255,255,255,.06)" />
      <rect x="30" y="15" width="7" height="120" fill="rgba(242,242,247,.6)" />
      <g stroke="rgba(255,255,255,.1)" strokeWidth="2.4">
        {FRETS.map((x) => <line key={x} x1={x} y1="15" x2={x} y2="135" />)}
      </g>
      <g fill="rgba(255,255,255,.08)">
        {[3, 5, 7, 9].map((c) => <circle key={c} cx={xCasa(c)} cy="75" r="7" />)}
        <circle cx={xCasa(12)} cy="65" r="6" /><circle cx={xCasa(12)} cy="85" r="6" />
      </g>
      <g stroke="rgba(242,242,247,.35)">
        {YS.map((y, i) => (
          <line key={y} x1="30" y1={y} x2="890" y2={y} strokeWidth={1 + i * 0.42} />
        ))}
      </g>
      <g fill="rgba(242,242,247,.3)" fontFamily="JetBrains Mono" fontSize="11" textAnchor="middle">
        {[3, 5, 7, 9, 12].map((c) => <text key={c} x={xCasa(c)} y="149">{c}</text>)}
      </g>
      <g fill="rgba(244,238,224,.55)" fontFamily="JetBrains Mono" fontSize="10" fontWeight="700" textAnchor="middle">
        {YS.map((y, i) => <text key={i} x="10" y={y + 3.5}>{CORDAS[i]}</text>)}
      </g>

      {/* nomes de todas as notas (modo estudo) */}
      {showNames && YS.map((y, i) =>
        Array.from({ length: 13 }, (_, casa) => (
          <text key={`${i}-${casa}`} x={xCasa(casa)} y={y + 3.5} fontFamily="JetBrains Mono"
            fontSize="9" fill="rgba(244,238,224,.4)" textAnchor="middle" pointerEvents="none">
            {nomeDe(midiDe(i + 1, casa))}
          </text>
        )),
      )}

      {/* overlay da semana */}
      <g fontFamily="JetBrains Mono" fontWeight="700" fontSize="12" textAnchor="middle" pointerEvents="none">
        {notas.map((n, i) => {
          const x = xCasa(n.casa); const y = YS[n.corda - 1]
          if (n.tipo === 'root') return (
            <g key={i}>
              <circle cx={x} cy={y} r="13" fill="#CCFF00" style={{filter:'drop-shadow(0 0 6px #CCFF00)'}} />
              <text x={x} y={y + 4} fill="#0A1400">{n.label}</text>
            </g>
          )
          if (n.tipo === 'terca') return (
            <g key={i}>
              <circle cx={x} cy={y} r="13" fill="#FF5C8A" />
              <text x={x} y={y + 4} fill="#2A0A16">{n.label}</text>
            </g>
          )
          if (n.tipo === 'cor') return (
            <g key={i}>
              <circle cx={x} cy={y} r="13" fill="#3EE08F" />
              <text x={x} y={y + 4} fill="#062416">{n.label}</text>
            </g>
          )
          const dash = n.tipo === 'dash'
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="13" fill="#070710" stroke="#00E0FF"
                strokeWidth="2.4" strokeDasharray={dash ? '4 3' : 'none'} />
              <text x={x} y={y + 4} fill="#00E0FF">{n.label}</text>
            </g>
          )
        })}
      </g>

      {/* zonas clicáveis + feedback */}
      {YS.map((y, i) =>
        Array.from({ length: 13 }, (_, casa) => {
          const x = xCasa(casa)
          const key = `${i + 1}-${casa}`
          return (
            <g key={key} onClick={() => tocar(i + 1, casa)} style={{ cursor: 'pointer' }}>
              {ativa === key && <circle cx={x} cy={y} r="15" fill="none" stroke="#CCFF00" strokeWidth="2" opacity=".9" />}
              <rect x={x - 22} y={y - 9} width="44" height="18" fill="transparent" />
            </g>
          )
        }),
      )}
    </svg>
  )
}

export default function PaginaBraco({ semana }) {
  const [showNames, setShowNames] = useState(false)

  return (
    <div className="scr">
      {/* partículas de notas no fundo */}
      <div className="scr-particles" aria-hidden="true">
        {['♪', '♫', '♩', '♬', '♪', '♫'].map((n, i) => (
          <span key={i} className={`gg-particle p${i}`} style={{ color: ['#FF2D95', '#00E0FF', '#CCFF00', '#FFB020'][i % 4] }}>{n}</span>
        ))}
      </div>

      <div className="scr-top">
        <div>
          <div className="scr-kick" style={{ color: '#FF2D95' }}>◆ Pilar Braço</div>
          <h1 className="scr-title">Braço interativo</h1>
          <p className="scr-sub">Clica em qualquer casa para ouvir a nota. Modo treino: nomes escondidos — diz o nome ANTES de clicar, o som confirma.</p>
        </div>
        <button className={`scr-toggle ${showNames ? 'on' : ''}`} onClick={() => setShowNames(!showNames)}>
          {showNames ? '● Nomes visíveis' : '○ Mostrar nomes'}
        </button>
      </div>

      <div className="scr-glass scr-fret-card">
        <div className="scr-glass-h"><h3>{semana?.braco?.titulo ?? 'Braço completo'}</h3>
          <span className="scr-badge">CASAS 0–12 · AFINAÇÃO STANDARD · E A D G B E</span></div>
        <FretSVG notas={semana?.braco?.notas ?? []} showNames={showNames} altura={210} />
        <div className="scr-fret-leg">
          <span><i style={{ background: '#CCFF00', boxShadow: '0 0 8px #CCFF00' }} />Tónica</span>
          <span><i style={{ background: '#FF5C8A' }} />3.ª menor</span>
          <span><i style={{ background: '#3EE08F' }} />Nota-cor</span>
          <span><i style={{ border: '2px solid #00E0FF' }} />Escala</span>
        </div>
        {semana?.braco?.legenda && <p className="scr-legenda">{semana.braco.legenda}</p>}
      </div>

      {/* faixa dupla: como treinar + ilustração animada das cordas */}
      <div className="scr-braco-lower">
        <div className="scr-glass">
          <div className="scr-glass-h"><h3>Como treinar aqui</h3></div>
          <div className="scr-steps-list">
            <div className="scr-step-item"><span className="scr-step-n" style={{ color: '#FF2D95' }}>01</span><p>Com os nomes escondidos, aponta mentalmente para uma casa, diz o nome em voz alta, e só depois clica — o som e a tua memória confirmam-se um ao outro.</p></div>
            <div className="scr-step-item"><span className="scr-step-n" style={{ color: '#00E0FF' }}>02</span><p>Jogo inverso: clica numa casa aleatória de olhos semicerrados, ouve, e tenta dizer que nota foi antes de olhar.</p></div>
            <div className="scr-step-item"><span className="scr-step-n" style={{ color: '#CCFF00' }}>03</span><p>O overlay colorido mostra o tema da tua semana — verde = tónica, ciano = escala. Usa-o como gabarito, não como muleta.</p></div>
          </div>
        </div>

        {/* cordas animadas a vibrar */}
        <div className="scr-glass scr-strings-card">
          <div className="scr-glass-h"><h3>As 6 cordas · afinação standard</h3></div>
          <div className="scr-strings">
            {['E', 'A', 'D', 'G', 'B', 'E'].map((c, i) => (
              <div className="scr-string-row" key={i}>
                <span className="scr-string-name">{c}</span>
                <svg className="scr-string-wave" viewBox="0 0 400 20" preserveAspectRatio="none" width="100%" height="20">
                  <path className="scr-string-path" style={{ animationDelay: `${i * 0.15}s` }}
                    d="M0,10 Q100,10 200,10 T400,10" fill="none"
                    stroke={['#FF2D95', '#FF6B9D', '#B84DFF', '#00E0FF', '#00E0FF', '#CCFF00'][i]}
                    strokeWidth={2.5 - i * 0.2} strokeLinecap="round" />
                </svg>
              </div>
            ))}
          </div>
          <p className="scr-legenda">As cordas grave e aguda são ambas E, uma oitava de distância. Toca uma casa acima para as sentires vibrar.</p>
        </div>
      </div>
    </div>
  )
}
