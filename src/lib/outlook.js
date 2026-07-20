// ═══ Ligação ao Outlook (Microsoft Graph, OAuth PKCE no browser) ═══
// Sem servidores, sem segredos: o login acontece na janela oficial da Microsoft
// e a app recebe apenas um token de LEITURA do correio (Mail.Read).
import { PublicClientApplication } from '@azure/msal-browser'

const CLIENT_ID = '474130a7-bc8c-40a3-b520-dc468654a04c'
const SCOPES = ['Mail.Read']

let _msal = null
async function getMsal() {
  if (!_msal) {
    _msal = new PublicClientApplication({
      auth: {
        clientId: CLIENT_ID,
        authority: 'https://login.microsoftonline.com/common',
        // fluxo de REDIRECT: a própria página vai à Microsoft e volta ao endereço da app
        redirectUri: window.location.origin,
      },
      cache: { cacheLocation: 'localStorage' },
    })
    await _msal.initialize()
    // obrigatório no fluxo de redirect: consumir a resposta que vem no regresso
    try { await _msal.handleRedirectPromise() } catch (e) { console.warn('[ROE outlook] regresso:', e) }
  }
  return _msal
}

// chamado no arranque da app para processar um eventual regresso da Microsoft
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

// emails da caixa de entrada recebidos DEPOIS do marco (asc, máx. 50)
export async function outlookEmailsDesde(marcoISO) {
  const tk = await token()
  if (!tk) return { erro: 'sessao' }
  const filtro = encodeURIComponent("receivedDateTime gt " + marcoISO)
  const sel = '$select=id,subject,from,receivedDateTime,bodyPreview'
  const url = 'https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?$filter=' + filtro +
    '&$orderby=receivedDateTime asc&$top=50&' + sel
  const r = await fetch(url, { headers: { Authorization: 'Bearer ' + tk } })
  if (!r.ok) return { erro: 'graph-' + r.status }
  const j = await r.json()
  return {
    emails: (j.value || []).map((e) => ({
      id: e.id,
      assunto: e.subject || '(sem assunto)',
      de: (e.from && e.from.emailAddress && (e.from.emailAddress.name || e.from.emailAddress.address)) || '?',
      recebido: e.receivedDateTime,
      resumo: (e.bodyPreview || '').slice(0, 120),
    })),
  }
}
