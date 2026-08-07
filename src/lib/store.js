// ROE Guitar — armazenamento local (sem Supabase)
// Mantém a MESMA API que os componentes já usam.

const KEY = 'roe-guitar-dados'
const hoje = () => new Date().toISOString().slice(0, 10)
const VAZIO = { progresso: [], tarefas: [], quizes: [], metro: [], desafios: [] }

function ler() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...VAZIO }
    return { ...VAZIO, ...JSON.parse(raw) }
  } catch { return { ...VAZIO } }
}
function escrever(d) {
  try { localStorage.setItem(KEY, JSON.stringify(d)) } catch (e) { console.error(e) }
  window.dispatchEvent(new Event('roe-dados'))
}

export const configured = true
const SESSAO_LOCAL = { user: { id: 'local', email: 'local' } }
export async function getSession() { return SESSAO_LOCAL }
export function onAuth() { return () => {} }
export const signInGoogle = async () => ({})
export const signOut = async () => ({})

export async function fetchAll() { return ler() }

export async function toggleTarefa(_uid, semana, tarefaIdx, feita) {
  const d = ler(); const dia = hoje()
  d.tarefas = d.tarefas.filter((t) => !(t.data === dia && t.tarefa_idx === tarefaIdx))
  if (feita) d.tarefas.push({ data: dia, semana, tarefa_idx: tarefaIdx, feita: true })
  escrever(d); return { data: d.tarefas }
}
export async function saveQuiz(_uid, semana, tipo, total, corretas) {
  const d = ler(); d.quizes.push({ data: hoje(), semana, tipo, total, corretas }); escrever(d); return { data: true }
}
export async function saveMetro(_uid, bpm, contexto) {
  const d = ler(); d.metro.push({ data: hoje(), bpm, contexto }); escrever(d); return { data: true }
}
export async function saveDesafio(_uid, semana, texto) {
  const d = ler(); d.desafios = d.desafios.filter((x) => x.semana !== semana)
  d.desafios.push({ semana, texto }); escrever(d); return { data: true }
}
export async function saveProgresso(_uid, semana, criterios, concluida) {
  const d = ler(); d.progresso = d.progresso.filter((p) => p.semana !== semana)
  d.progresso.push({ semana, criterios, concluida }); escrever(d); return { data: true }
}

export function exportarJSON() {
  const payload = { app: 'roe-guitar', versao: 1, exportado: new Date().toISOString(), dados: ler() }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `roe-guitar-progresso-${hoje()}.json`
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
}
export function importarJSON(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => {
      try {
        const parsed = JSON.parse(r.result)
        const d = parsed.dados ?? parsed
        if (!d || typeof d !== 'object') throw new Error('formato')
        escrever({ ...VAZIO, ...d }); resolve(true)
      } catch (e) { reject(e) }
    }
    r.onerror = () => reject(new Error('leitura'))
    r.readAsText(file)
  })
}
export function apagarTudo() {
  localStorage.removeItem(KEY); window.dispatchEvent(new Event('roe-dados'))
}
