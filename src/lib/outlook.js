// ═══ Ligação ao Outlook (Microsoft Graph, OAuth PKCE no browser) ═══
// Sem servidores, sem segredos: o login acontece na janela oficial da Microsoft
// e a app recebe apenas um token de LEITURA do correio (Mail.Read).
import { PublicClientApplication } from '@azure/msal-browser'

const CLIENT_ID = '474130a7-bc8c-40a3-b520-dc468654a04c'
const SCOPES = ['Mail.Read']

let _msalPromise = null
function getMsal() {
  // à prova de corridas: TODOS os chamadores esperam pela inicialização completa,
  // incluindo a digestão da resposta do login (handleRedirectPromise) — era esta
  // corrida que obrigava a um reload após o regresso da Microsoft
  if (!_msalPromise) {
    _msalPromise = (async () => {
      const m = new PublicClientApplication({
        auth: {
          clientId: CLIENT_ID,
          authority: 'https://login.microsoftonline.com/common',
          redirectUri: window.location.origin,
        },
        cache: { cacheLocation: 'localStorage' },
      })
      await m.initialize()
      try { await m.handleRedirectPromise() } catch (e) { console.warn('[ROE outlook] regresso:', e) }
      return m
    })()
  }
  return _msalPromise
}

export async function outlookProcessarRegresso() {
  await getMsal()
  return outlookConta()
}

export async function outlookConta() {
  const m = await getMsal()
  const contas = m.getAllAccounts()
  return contas[0] || null
}

export async function outlookLigar() {
  const m = await getMsal()
  const contas = m.getAllAccounts()
  if (contas[0]) return contas[0] // já há sessão Microsoft — não é preciso sair da página
  await m.loginRedirect({ scopes: SCOPES, prompt: 'select_account' })
  return null // a página vai sair — nunca chega aqui
}

export async function outlookSair() {
  const m = await getMsal()
  const conta = (m.getAllAccounts() || [])[0]
  if (conta) await m.logoutRedirect({ account: conta, postLogoutRedirectUri: window.location.origin }).catch(() => {})
}

async function token() {
  const m = await getMsal()
  const conta = (m.getAllAccounts() || [])[0]
  if (!conta) return null
  try {
    const r = await m.acquireTokenSilent({ scopes: SCOPES, account: conta })
    return r.accessToken
  } catch {
    return null // token expirado sem renovação silenciosa: o cartão pede para religar
  }
}

// emails recebidos DEPOIS do marco — caixa de entrada E lixo (os reencaminhamentos
// automáticos do Gmail caem no lixo com frequência), asc, máx. 50
export async function outlookEmailsDesde(marcoISO) {
  const tk = await token()
  if (!tk) return { erro: 'sessao' }
  const marco = new Date(marcoISO).toISOString() // formato limpo que o Graph aceita sempre
  const filtro = encodeURIComponent('receivedDateTime gt ' + marco)
  const sel = '$select=id,subject,from,receivedDateTime,bodyPreview'
  const base = 'https://graph.microsoft.com/v1.0/me/mailFolders/'
  const q = '/messages?$filter=' + filtro + '&$orderby=receivedDateTime asc&$top=50&' + sel
  const pastas = ['inbox', 'junkemail']
  const respostas = await Promise.all(pastas.map((pasta) =>
    fetch(base + pasta + q, { headers: { Authorization: 'Bearer ' + tk } })
  ))
  if (!respostas[0].ok) return { erro: 'graph-' + respostas[0].status }
  const corpos = await Promise.all(respostas.map((r) => r.ok ? r.json() : { value: [] }))
  const vistos = new Set()
  const emails = []
  for (let i = 0; i < corpos.length; i++) {
    for (const e of corpos[i].value || []) {
      if (vistos.has(e.id)) continue
      vistos.add(e.id)
      emails.push({
        id: e.id,
        assunto: e.subject || '(sem assunto)',
        de: (e.from && e.from.emailAddress && (e.from.emailAddress.name || e.from.emailAddress.address)) || '?',
        recebido: e.receivedDateTime,
        resumo: (e.bodyPreview || '').slice(0, 120),
        lixo: pastas[i] === 'junkemail',
      })
    }
  }
  emails.sort((a, b) => a.recebido.localeCompare(b.recebido))
  if (emails.length === 0) {
    // sonda de diagnóstico: o que há de mais recente na caixa? (só na consola)
    try {
      const pr = await fetch(base + 'inbox/messages?$orderby=receivedDateTime desc&$top=3&' + sel,
        { headers: { Authorization: 'Bearer ' + tk } })
      if (pr.ok) {
        const pj = await pr.json()
        console.log('[ROE outlook] filtro desde', marco, '· últimas na caixa:',
          (pj.value || []).map((e) => e.receivedDateTime + ' — ' + (e.subject || '(sem assunto)')))
      } else {
        console.warn('[ROE outlook] sonda falhou:', pr.status)
      }
    } catch (e) { console.warn('[ROE outlook] sonda:', e) }
  }
  return { emails: emails.slice(0, 50) }
}
