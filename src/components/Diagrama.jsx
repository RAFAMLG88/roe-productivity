// Diagramas animados por semana — visual em vez de texto massudo
export default function Diagrama({ n }) {
  if (n === 1) return (
    <svg viewBox="0 0 560 92" width="100%" height="92" className="fade-up">
      {/* escada das 12 notas com os meios-tons B→C e E→F a pulsar */}
      {['E','F','F#','G','G#','A','A#','B','C','C#','D','D#','E'].map((nota, i) => {
        const meio = (nota === 'F' || nota === 'C')
        return (
          <g key={i} transform={`translate(${18 + i * 42},46)`}>
            <circle r="16" fill={meio ? 'rgba(69,200,245,.16)' : '#221743'}
              stroke={meio ? '#45C8F5' : '#3A2B6B'} strokeWidth="1.6"
              className={meio ? 'pulse-sky' : ''} />
            <text y="4.5" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="12" fontWeight="700"
              fill={meio ? '#45C8F5' : '#F4EEE0'}>{nota}</text>
            {i < 12 && (
              <text x="21" y="4" textAnchor="middle" fontSize="9" fontFamily="JetBrains Mono"
                fill={['E','B'].includes(nota) ? '#45C8F5' : 'rgba(244,238,224,.35)'}>
                {['E','B'].includes(nota) ? '½' : '1'}
              </text>
            )}
          </g>
        )
      })}
      <text x="18" y="86" fontSize="11" fontFamily="Quicksand" fill="rgba(244,238,224,.5)">
        ½ = meio-tom (1 casa) só em E→F e B→C · tudo o resto é 1 tom (2 casas)
      </text>
    </svg>
  )

  if (n === 2) return (
    <svg viewBox="0 0 560 110" width="100%" height="110" className="fade-up">
      {/* mini-braço com o salto de oitava animado */}
      <rect x="20" y="14" width="520" height="70" rx="6" fill="#1B1236" stroke="#3A2B6B" />
      {[1,2,3,4,5,6,7].map((f) => <line key={f} x1={20 + f * 65} y1="14" x2={20 + f * 65} y2="84" stroke="#3A2B6B" strokeWidth="2" />)}
      {['E','A','D','G'].map((c, i) => (
        <g key={c}>
          <line x1="20" y1={26 + i * 16} x2="540" y2={26 + i * 16} stroke="#8E80B8" strokeWidth={2.2 - i * 0.35} />
          <text x="8" y={30 + i * 16} fontSize="10" fontFamily="JetBrains Mono" fill="rgba(244,238,224,.5)">{c}</text>
        </g>
      ))}
      <circle cx="150" cy="74" r="12" fill="#F0CC4E" />
      <text x="150" y="78" textAnchor="middle" fontSize="11" fontFamily="JetBrains Mono" fontWeight="700" fill="#241A00">G</text>
      <g className="octave-jump">
        <circle cx="150" cy="74" r="12" fill="none" stroke="#45C8F5" strokeWidth="2.4" />
        <text x="150" y="78" textAnchor="middle" fontSize="11" fontFamily="JetBrains Mono" fontWeight="700" fill="#45C8F5">G</text>
      </g>
      <path d="M162,66 Q216,20 268,42" fill="none" stroke="#45C8F5" strokeWidth="1.6" strokeDasharray="4 4" opacity=".7" />
      <text x="200" y="24" fontSize="11" fontFamily="Quicksand" fontWeight="600" fill="#45C8F5">+2 casas, +2 cordas = oitava</text>
    </svg>
  )

  if (n === 3) return (
    <svg viewBox="0 0 560 110" width="100%" height="110" className="fade-up">
      <rect x="20" y="14" width="520" height="70" rx="6" fill="#1B1236" stroke="#3A2B6B" />
      {[1,2,3,4,5,6,7].map((f) => <line key={f} x1={20 + f * 65} y1="14" x2={20 + f * 65} y2="84" stroke="#3A2B6B" strokeWidth="2" />)}
      {['A','D','G'].map((c, i) => (
        <g key={c}>
          <line x1="20" y1={30 + i * 20} x2="540" y2={30 + i * 20} stroke="#8E80B8" strokeWidth={2 - i * 0.3} />
          <text x="8" y={34 + i * 20} fontSize="10" fontFamily="JetBrains Mono" fill="rgba(244,238,224,.5)">{c}</text>
        </g>
      ))}
      <g className="grow-1"><circle cx="117" cy="70" r="12" fill="#F0CC4E" /><text x="117" y="74" textAnchor="middle" fontSize="11" fontFamily="JetBrains Mono" fontWeight="700" fill="#241A00">A</text>
        <text x="117" y="100" textAnchor="middle" fontSize="10" fontFamily="Quicksand" fontWeight="600" fill="#F0CC4E">tónica</text></g>
      <g className="grow-2"><circle cx="247" cy="50" r="12" fill="none" stroke="#45C8F5" strokeWidth="2.4" /><text x="247" y="54" textAnchor="middle" fontSize="11" fontFamily="JetBrains Mono" fontWeight="700" fill="#45C8F5">E</text>
        <text x="247" y="100" textAnchor="middle" fontSize="10" fontFamily="Quicksand" fontWeight="600" fill="#45C8F5">5.ᵃ (+2 casas)</text></g>
      <g className="grow-3"><circle cx="247" cy="30" r="12" fill="none" stroke="#3EE08F" strokeWidth="2.4" /><text x="247" y="34" textAnchor="middle" fontSize="11" fontFamily="JetBrains Mono" fontWeight="700" fill="#3EE08F">A</text>
        <text x="310" y="30" fontSize="10" fontFamily="Quicksand" fontWeight="600" fill="#3EE08F">oitava — o power chord completo</text></g>
    </svg>
  )

  if (n === 4) return (
    <svg viewBox="0 0 560 110" width="100%" height="110" className="fade-up">
      <rect x="20" y="14" width="520" height="70" rx="6" fill="#1B1236" stroke="#3A2B6B" />
      {[1,2,3,4,5,6,7].map((f) => <line key={f} x1={20 + f * 65} y1="14" x2={20 + f * 65} y2="84" stroke="#3A2B6B" strokeWidth="2" />)}
      {['E','A'].map((c, i) => (
        <g key={c}>
          <line x1="20" y1={38 + i * 26} x2="540" y2={38 + i * 26} stroke="#8E80B8" strokeWidth={2.4 - i * 0.3} />
          <text x="8" y={42 + i * 26} fontSize="10" fontFamily="JetBrains Mono" fill="rgba(244,238,224,.5)">{c}</text>
        </g>
      ))}
      <circle cx="215" cy="64" r="12" fill="#F0CC4E" />
      <text x="215" y="68" textAnchor="middle" fontSize="11" fontFamily="JetBrains Mono" fontWeight="700" fill="#241A00">G</text>
      <g className="terca-slide">
        <circle r="12" fill="none" stroke="#45C8F5" strokeWidth="2.4" />
        <text y="4" textAnchor="middle" fontSize="10" fontFamily="JetBrains Mono" fontWeight="700" fill="#45C8F5" className="terca-label" />
      </g>
      <text x="330" y="30" fontSize="11" fontFamily="Quicksand" fontWeight="600" fill="rgba(244,238,224,.65)">
        a 3.ᵃ desliza 1 casa: maior ↔ menor
      </text>
    </svg>
  )

  return null
}
