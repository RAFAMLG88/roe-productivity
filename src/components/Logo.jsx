// Logótipo ROE Guitar — versão híbrida: palheta com contorno néon magenta→ciano
export function PickMark({ size = 64, withText = true }) {
  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 110 126" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="pickNeon" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FF2D95" />
          <stop offset="1" stopColor="#00E0FF" />
        </linearGradient>
        <filter id="pickGlow"><feGaussianBlur stdDeviation="1.6" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <g transform="translate(55,60)">
        <path d="M0,-52 C29,-52 47,-35 47,-13 C47,16 21,45 0,57 C-21,45 -47,16 -47,-13 C-47,-35 -29,-52 0,-52 Z"
          fill="rgba(255,255,255,.02)" stroke="url(#pickNeon)" strokeWidth="2.4" filter="url(#pickGlow)" />
        {withText ? (
          <>
            <text x="0" y="-7" fontFamily="Sora, sans-serif" fontWeight="800" fontSize="26" letterSpacing="1" fill="#F2F2F7" textAnchor="middle">ROE</text>
            <line x1="-26" y1="3" x2="26" y2="3" stroke="url(#pickNeon)" strokeWidth="1.4" opacity=".8" />
            <text x="0" y="21" fontFamily="'JetBrains Mono', monospace" fontWeight="700" fontSize="9.5" letterSpacing="4" fill="rgba(242,242,247,.7)" textAnchor="middle">GUITAR</text>
          </>
        ) : (
          <text x="0" y="12" fontFamily="Sora, sans-serif" fontWeight="800" fontSize="36" fill="#F2F2F7" textAnchor="middle">R</text>
        )}
      </g>
    </svg>
  )
}

export function LogoLockup() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <PickMark size={40} withText={false} />
      <div>
        <div className="logo-neon">ROE<span>/</span>GUITAR</div>
      </div>
    </div>
  )
}
