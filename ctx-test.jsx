// ── ROE · teste SSR (§8 do dossier): contrato do contexto + render dos ecrãs ──
// Correr a partir da raiz do projeto:
//   npx esbuild ctx-test.jsx --bundle --format=esm --platform=node --jsx=automatic --packages=external --outfile=ctx-test.mjs
//   node ctx-test.mjs
// O ficheiro vive DENTRO do projeto para os imports resolverem.
// Stubs de browser primeiro; os módulos da app entram por import dinâmico DEPOIS.

const store = new Map()
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
}
globalThis.matchMedia = globalThis.matchMedia || (() => ({ matches: false, addEventListener() {}, removeEventListener() {} }))

const { renderToString } = await import('react-dom/server')
const { RoeProvider, useRoe } = await import('./src/state/RoeContext.jsx')

const perfil = { id: 'teste-uid', nome: 'Teste SSR', cor: '#FFCE0A' }
let falhas = 0

// 1) contrato do contexto: as chaves do value
let chaves = null
function Sonda() { const v = useRoe(); chaves = Object.keys(v); return null }
try {
  renderToString(<RoeProvider perfil={perfil} sair={() => {}}><Sonda /></RoeProvider>)
  console.log(`✓ contexto renderiza · ${chaves.length} chaves no value`)
  console.log('  ' + chaves.join(', '))
  if (chaves.length < 33) { console.log(`✗ CONTRATO: esperadas ≥33 chaves, encontradas ${chaves.length}`); falhas++ }
} catch (e) { console.log('✗ contexto FALHOU:', e.message); falhas++ }

// 2) cada ecrã renderiza dentro do provider (>300 chars de HTML = conteúdo real)
const ecras = {
  Briefing: (await import('./src/screens/Briefing.jsx')).default,
  Capturar: (await import('./src/screens/Capturar.jsx')).default,
  Foco: (await import('./src/screens/Foco.jsx')).default,
  Externo: (await import('./src/screens/Externo.jsx')).default,
  Analise: (await import('./src/screens/Analise.jsx')).default,
  Cidade: (await import('./src/screens/Cidade.jsx')).default,
}
for (const [nome, C] of Object.entries(ecras)) {
  try {
    const h = renderToString(<RoeProvider perfil={perfil} sair={() => {}}><C onNavigate={() => {}} /></RoeProvider>)
    const ok = h.length > 300
    console.log(`${ok ? '✓' : '✗'} ${nome} · ${h.length} chars`)
    if (!ok) falhas++
  } catch (e) { console.log(`✗ ${nome} FALHOU:`, e.message); falhas++ }
}

// 3) novos em v33: componentes globais importam e renderizam sem crash
const novos = {
  ArcoDia: (await import('./src/components/ArcoDia.jsx')).default,
  CapturaRapida: (await import('./src/components/CapturaRapida.jsx')).default,
  DesfazerToast: (await import('./src/components/DesfazerToast.jsx')).default,
  Observatorio: (await import('./src/screens/Observatorio.jsx')).default,
}
for (const [nome, C] of Object.entries(novos)) {
  try {
    // Observatório precisa da prop feitas — geramos histórico sintético mínimo
    if (nome === 'Observatorio') {
      const feitas = Array.from({ length: 12 }, (_, i) => ({
        id: i, texto: 'T' + i, tags: ['orc_cliente'], min: 30, realMin: 40, prioridade: 'normal',
        feitaEm: Date.now() - i * 3600e3, criadaEm: Date.now() - i * 3600e3 - 864e5,
      }))
      renderToString(<RoeProvider perfil={perfil} sair={() => {}}><C feitas={feitas} /></RoeProvider>)
    } else {
      renderToString(<RoeProvider perfil={perfil} sair={() => {}}><C /></RoeProvider>)
    }
    console.log(`✓ ${nome} (v35)`)
  } catch (e) { console.log(`✗ ${nome} FALHOU:`, e.message); falhas++ }
}

// 3b) v40: motor analytics + Histórico com dados sintéticos (caminho CHEIO)
try {
  const A = await import('./src/lib/analytics.js')
  const DIA = 864e5
  const feitas = Array.from({ length: 40 }, (_, i) => {
    const d = new Date(Date.now() - i * 3 * DIA); d.setHours(9 + (i % 9), 0, 0, 0)
    const cats = ['vendida', 'orcamentar', 'prescricao', null]
    const tg = ['orc_cliente', 'presc_arq', 'alteracoes', 'concorrencia', 'admin']
    return { id: 'x' + i, texto: 'T' + i, feitaEm: d.getTime(), criadaEm: d.getTime() - 36e5,
      min: 30 + (i % 4) * 15, realMin: 25 + (i % 5) * 12,
      prioridade: i % 6 === 0 ? 'urgente' : (i % 3 === 0 ? 'importante' : 'normal'),
      tags: [tg[i % tg.length]], obra: cats[i % 4] }
  })
  const checks = {
    tempoPorTag: A.tempoPorTag(feitas).length > 0,
    porCategoria: A.porCategoria(feitas).length === 3,
    cruzamento: A.cruzamento(feitas).length === 3,
    tendenciaSemanal: A.tendenciaSemanal(feitas).nSemanas > 0,
    historico: A.historico(feitas).anos.length > 0,
    consistencia: A.consistencia(feitas).cels.length === 14,
    planeadoVsReal: A.planeadoVsReal(feitas) != null,
  }
  const maus = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k)
  if (maus.length) { console.log('✗ motor analytics FALHOU em:', maus.join(', ')); falhas++ }
  else console.log(`✓ motor analytics · ${Object.keys(checks).length} funções OK`)

  const Historico = (await import('./src/screens/Historico.jsx')).default
  const hH = renderToString(<Historico feitas={feitas} />)
  console.log(`${hH.length > 300 ? '✓' : '✗'} Historico c/ dados · ${hH.length} chars`)
  if (hH.length <= 300) falhas++

  const hHv = renderToString(<Historico feitas={[]} />)
  console.log(`${hHv.length > 50 ? '✓' : '✗'} Historico vazio · ${hHv.length} chars`)
  if (hHv.length <= 50) falhas++
} catch (e) { console.log('✗ motor/Historico FALHOU:', e.message); falhas++ }

// 4) Entrada (fora do provider — é o ecrã de login)
try {
  const Entrada = (await import('./src/screens/Entrada.jsx')).default
  const h = renderToString(<Entrada />)
  console.log(`${h.length > 200 ? '✓' : '✗'} Entrada · ${h.length} chars`)
  if (h.length <= 200) falhas++
} catch (e) { console.log('✗ Entrada FALHOU:', e.message); falhas++ }

console.log(falhas === 0 ? '\n═══ TUDO VERDE ═══' : `\n═══ ${falhas} FALHA(S) ═══`)
process.exit(falhas === 0 ? 0 : 1)
