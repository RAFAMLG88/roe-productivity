import React from 'react'

export default function Cidade3D({ onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100, background: '#0a0812',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px', background: '#141207', flex: 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <svg width="30" height="30" viewBox="0 0 100 100" style={{ flex: 'none' }}>
            <rect x="6" y="6" width="88" height="88" rx="26" fill="#1d1a10" />
            <circle cx="50" cy="50" r="27" fill="none" stroke="#FFCE0A" strokeWidth="8" />
            <circle cx="50" cy="50" r="13" fill="none" stroke="#00C865" strokeWidth="7" />
            <circle cx="50" cy="50" r="6" fill="#FF1F3D" />
          </svg>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: '#F4EEE0', fontSize: 15 }}>
            ROE City <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#8a8272', marginLeft: 8 }}>em 3D · a tua recompensa</span>
          </div>
        </div>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,.08)', border: '1px solid #2a2618', color: '#F4EEE0',
          fontFamily: 'var(--font-mono)', fontSize: 12, padding: '9px 18px', borderRadius: 12,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
        }}>← voltar à app</button>
      </div>
      <iframe
        src="./cidade-v41.html"
        title="ROE City 3D"
        allow="geolocation; fullscreen"
        style={{ flex: 1, width: '100%', border: 'none' }}
      />
    </div>
  )
}
