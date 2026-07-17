import React, { useEffect, useState } from 'react'
import { supabase } from './lib/supabase.js'
import { RoeProvider } from './state/RoeContext.jsx'
import Sidebar from './components/Sidebar.jsx'
import Cidade3D from './components/Cidade3D.jsx'
import MediaDock from './components/MediaDock.jsx'
import Briefing from './screens/Briefing.jsx'
import Foco from './screens/Foco.jsx'
import Capturar from './screens/Capturar.jsx'
import Cidade from './screens/Cidade.jsx'
import Analise from './screens/Analise.jsx'
import Externo from './screens/Externo.jsx'
import Entrada from './screens/Entrada.jsx'

const SCREENS = {
  briefing: Briefing,
  foco: Foco,
  capturar: Capturar,
  cidade: Cidade,
  analise: Analise,
  externo: Externo,
}

// Splash mínimo enquanto se confirma a sessão (evita "flash" do login a quem já entrou)
function Boot() {
  return (
    <div className="boot">
      <svg width="56" height="56" viewBox="0 0 100 100" className="boot-anel">
        <rect x="6" y="6" width="88" height="88" rx="26" fill="#1d1a10" />
        <circle cx="50" cy="50" r="27" fill="none" stroke="#FFCE0A" strokeWidth="7" />
        <circle cx="50" cy="50" r="14" fill="none" stroke="#00C865" strokeWidth="6" />
        <circle cx="50" cy="50" r="6" fill="#FF1F3D" />
      </svg>
    </div>
  )
}

export default function App() {
  const [screen, setScreen] = useState('briefing')
  const [show3D, setShow3D] = useState(false)
  const [aVerificar, setAVerificar] = useState(true)
  const [session, setSession] = useState(null)
  const [perfil, setPerfil] = useState(null)

  // auto-ajuste: em monitores mais pequenos que a referência (1360×860) a app
  // encolhe sozinha por transform:scale — comportamento idêntico em todos os
  // browsers (o zoom do body partia a geometria dos elementos fixed)
  const [esc, setEsc] = useState({ z: 1, w: 0, h: 0 })
  useEffect(() => {
    const fit = () => {
      const raw = Math.min(1, window.innerWidth / 1360, window.innerHeight / 860)
      const z = raw < 0.995 ? Math.max(0.7, Math.round(raw * 1000) / 1000) : 1
      window.__roeZ = z // usado pelo MediaDock e pelo Foco para converter coordenadas
      setEsc({ z, w: window.innerWidth, h: window.innerHeight })
    }
    fit()
    window.addEventListener('resize', fit)
    return () => { window.removeEventListener('resize', fit); window.__roeZ = 1 }
  }, [])

  // sessão: verifica ao arrancar e reage a login/logout
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAVerificar(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_ev, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  // perfil (nome + cor) do utilizador com sessão
  useEffect(() => {
    if (!session?.user) { setPerfil(null); return }
    let vivo = true
    supabase.from('profiles').select('id,nome,cor').eq('id', session.user.id).single()
      .then(({ data }) => {
        if (!vivo) return
        setPerfil(data || {
          id: session.user.id,
          nome: (session.user.email || 'eu').split('@')[0],
          cor: '#FFCE0A',
        })
      })
    return () => { vivo = false }
  }, [session?.user?.id])

  const sair = async () => {
    await supabase.auth.signOut()
    setScreen('briefing')
    setShow3D(false)
  }

  const navigate = (target) => {
    if (target === 'cidade3d') { setShow3D(true); return }
    setScreen(target)
  }

  if (aVerificar) return <Boot />
  if (!session) return <Entrada />

  const Screen = SCREENS[screen] || Briefing

  return (
    <RoeProvider key={session.user.id} perfil={perfil} sair={sair}>
      <div className="escala-root" style={esc.z !== 1 ? { width: esc.w / esc.z, height: esc.h / esc.z, transform: 'scale(' + esc.z + ')' } : undefined}>
      <div className="app">
        <div className="bg-blob bb1" />
        <div className="bg-blob bb2" />
        <Sidebar current={screen} onNavigate={navigate} />
        <div className="main">
          <Screen key={screen} onNavigate={navigate} />
        </div>
        <Cidade3D visible={show3D} onClose={() => setShow3D(false)} />
        <MediaDock cityOpen={show3D} />
      </div>
      </div>
    </RoeProvider>
  )
}
