import React, { useState } from 'react'
import { RoeProvider } from './state/RoeContext.jsx'
import Sidebar from './components/Sidebar.jsx'
import Cidade3D from './components/Cidade3D.jsx'
import Briefing from './screens/Briefing.jsx'
import Foco from './screens/Foco.jsx'
import Capturar from './screens/Capturar.jsx'
import Cidade from './screens/Cidade.jsx'
import Analise from './screens/Analise.jsx'

const SCREENS = {
  briefing: Briefing,
  foco: Foco,
  capturar: Capturar,
  cidade: Cidade,
  analise: Analise,
}

export default function App() {
  const [screen, setScreen] = useState('briefing')
  const [show3D, setShow3D] = useState(false)

  const navigate = (target) => {
    if (target === 'cidade3d') { setShow3D(true); return }
    setScreen(target)
  }

  const Screen = SCREENS[screen] || Briefing

  return (
    <RoeProvider>
      <div className="app">
        <div className="bg-blob bb1" />
        <div className="bg-blob bb2" />
        <Sidebar current={screen} onNavigate={navigate} />
        <div className="main">
          <Screen key={screen} onNavigate={navigate} />
        </div>
        <Cidade3D visible={show3D} onClose={() => setShow3D(false)} />
      </div>
    </RoeProvider>
  )
}
