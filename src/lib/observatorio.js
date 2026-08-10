// ── ROE v35: motor de cálculos do Observatório ──
// Transforma o histórico de tarefas concluídas em padrões reais. Zero IA, zero rede.
// Recebe sempre a lista `feitas` (tarefas com feitaEm, criadaEm, min, realMin, prioridade, tags).
// Cada função devolve null quando não há amostra suficiente para uma leitura honesta.

import { metaTag, tagsDe } from './tags.js'

const HORA = (ts) => new Date(ts).getHours() + new Date(ts).getMinutes() / 60
const diaISO = (ts) => { const d = new Date(ts); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') }
const DIA_MS = 864e5

// ── 1 · CURVA DE ENERGIA ──────────────────────────────────────────────
// Ritmo real de execução por meia-hora, dentro do horário 9–18h30.
// "Energia" = densidade de trabalho concluído (nº ponderado pelo peso) normalizada.
// Devolve pontos [{h, v}] com v em 0..1, e o pico. null se < 5 conclusões com hora.
export function curvaEnergia(feitas) {
  const com = feitas.filter((t) => t.feitaEm)
  if (com.length < 5) return null
  // baldes de 30 min entre 9h e 18h30 (índices 0..18, saltando o almoço 12h30–14h)
  const BINS = []
  for (let h = 9; h < 18.5; h += 0.5) BINS.push({ h, peso: 0, n: 0 })
  const pesoPri = { urgente: 1.4, importante: 1.2, normal: 1 }
  com.forEach((t) => {
    const hh = HORA(t.feitaEm)
    if (hh < 9 || hh >= 18.5) return
    // acha o balde mais próximo
    let idx = Math.round((hh - 9) * 2)
    idx = Math.max(0, Math.min(BINS.length - 1, idx))
    const w = (pesoPri[t.prioridade] || 1) * ((t.realMin || t.min) / 30) // trabalho por peso e duração
    BINS[idx].peso += w
    BINS[idx].n += 1
  })
  const maxP = Math.max(...BINS.map((b) => b.peso), 0.0001)
  const pts = BINS.map((b) => ({ h: b.h, v: b.peso / maxP, n: b.n, almoco: b.h >= 12.5 && b.h < 14 }))
  // pico (ignorando almoço)
  let peak = null
  pts.forEach((p) => { if (!p.almoco && p.n > 0 && (!peak || p.v > peak.v)) peak = p })
  return { pts, peak, amostra: com.length }
}

// ── 2 · FLUXO DO TEMPO (previsto vs real por tag) ─────────────────────
// Para cada tag, soma o previsto e o real; devolve desvio %. Ordena por tempo real.
// null se < 4 conclusões com realMin.
export function fluxoTempo(feitas) {
  const com = feitas.filter((t) => t.feitaEm && t.realMin)
  if (com.length < 4) return null
  const acc = {}
  com.forEach((t) => {
    const ks = tagsDe(t)
    const alvo = ks.length ? ks : ['__sem']
    alvo.forEach((k) => {
      if (!acc[k]) acc[k] = { prev: 0, real: 0, n: 0 }
      acc[k].prev += t.min
      acc[k].real += t.realMin
      acc[k].n += 1
    })
  })
  const rows = Object.entries(acc).map(([k, v]) => {
    const meta = k === '__sem' ? null : metaTag(k)
    return {
      key: k, lab: k === '__sem' ? 'Sem tipo' : (meta ? meta.lab : k),
      cls: meta ? meta.cls : 'neutro',
      prev: v.prev, real: v.real, n: v.n,
      dev: v.prev > 0 ? Math.round((v.real - v.prev) / v.prev * 100) : 0,
    }
  }).sort((a, b) => b.real - a.real).slice(0, 6)
  return { rows, amostra: com.length }
}

// ── 3 · EVOLUÇÃO SEMANAL ──────────────────────────────────────────────
// Conclusões por semana (últimas N semanas), com média móvel de 3.
// null se < 2 semanas com dados.
export function evolucaoSemanal(feitas, semanas = 6) {
  const com = feitas.filter((t) => t.feitaEm)
  if (com.length < 3) return null
  const agora = new Date(); agora.setHours(23, 59, 59, 999)
  // início da semana atual (segunda)
  const hoje = new Date(agora)
  const diaSem = (hoje.getDay() + 6) % 7 // 0 = segunda
  const iniSemanaAtual = new Date(hoje); iniSemanaAtual.setDate(hoje.getDate() - diaSem); iniSemanaAtual.setHours(0, 0, 0, 0)
  const wk = []
  for (let i = semanas - 1; i >= 0; i--) {
    const ini = new Date(iniSemanaAtual.getTime() - i * 7 * DIA_MS)
    const fim = new Date(ini.getTime() + 7 * DIA_MS)
    const n = com.filter((t) => t.feitaEm >= ini.getTime() && t.feitaEm < fim.getTime()).length
    const mins = com.filter((t) => t.feitaEm >= ini.getTime() && t.feitaEm < fim.getTime()).reduce((s, t) => s + (t.realMin || t.min), 0)
    wk.push({ ini: ini.getTime(), n, min: mins, lab: 'S-' + i === 'S-0' ? 'Esta' : 'S-' + i })
  }
  // rótulos: última = "Esta", resto S-n
  wk.forEach((w, i) => { const atras = semanas - 1 - i; w.lab = atras === 0 ? 'Esta' : 'há ' + atras })
  // média móvel 3
  const mm = wk.map((_, i) => { const s = Math.max(0, i - 2); const sl = wk.slice(s, i + 1); return sl.reduce((a, b) => a + b.n, 0) / sl.length })
  // tendência: compara média das últimas 2 com as 2 anteriores
  const semDados = wk.filter((w) => w.n > 0).length
  let tendencia = 'estavel'
  if (wk.length >= 4) {
    const recente = (wk[wk.length - 1].n + wk[wk.length - 2].n) / 2
    const antes = (wk[wk.length - 3].n + wk[wk.length - 4].n) / 2
    if (recente > antes * 1.12) tendencia = 'sobe'
    else if (recente < antes * 0.88) tendencia = 'desce'
  }
  return { wk, mm, tendencia, semDados }
}

// ── 4 · CORRELAÇÕES OCULTAS ───────────────────────────────────────────
// A estrela. Cada correlação é medida sobre o histórico; só entra se tiver
// amostra mínima e sinal claro. Devolve lista de {de, para, forca, tipo, texto}.
// Trabalhamos ao nível do DIA para várias delas.
export function correlacoes(feitas) {
  const com = feitas.filter((t) => t.feitaEm)
  if (com.length < 8) return null
  const out = []

  // agrupa por dia
  const porDia = {}
  com.forEach((t) => { const k = diaISO(t.feitaEm); (porDia[k] = porDia[k] || []).push(t) })
  const dias = Object.values(porDia)

  // (A) urgente cedo → dia produtivo
  // dias cujo 1º fecho do dia foi tarefa urgente, vs média de conclusões/dia
  if (dias.length >= 4) {
    const comUrgCedo = [], sem = []
    dias.forEach((ts) => {
      const ord = [...ts].sort((a, b) => a.feitaEm - b.feitaEm)
      const primUrg = (ord[0].prioridade === 'urgente')
      ;(primUrg ? comUrgCedo : sem).push(ts.length)
    })
    if (comUrgCedo.length >= 2 && sem.length >= 2) {
      const mA = comUrgCedo.reduce((a, b) => a + b, 0) / comUrgCedo.length
      const mB = sem.reduce((a, b) => a + b, 0) / sem.length
      if (mB > 0) {
        const ganho = Math.round((mA - mB) / mB * 100)
        if (Math.abs(ganho) >= 10) {
          out.push({
            de: 'urg', para: 'prod', forca: Math.min(1, Math.abs(ganho) / 60),
            tipo: ganho > 0 ? 'good' : 'bad',
            texto: `Quando arrancas o dia com uma <b>tarefa urgente</b>, fechas <b>${ganho > 0 ? '+' : ''}${ganho}%</b> no resto do dia.`,
          })
        }
      }
    }
  }

  // (B) tarefa muito tempo na fila → nunca feita  (usa idade à conclusão)
  // proporção de conclusões que passaram >3 dias na fila (sinal de que quando ficam, ou saem cedo ou tarde)
  {
    const idades = com.map((t) => (t.feitaEm - t.criadaEm) / DIA_MS).filter((d) => d >= 0)
    if (idades.length >= 6) {
      const cedo = idades.filter((d) => d <= 2).length
      const pctCedo = Math.round(cedo / idades.length * 100)
      if (pctCedo >= 55) {
        out.push({
          de: 'fila', para: 'morte', forca: Math.min(1, pctCedo / 100),
          tipo: 'bad',
          texto: `<b>${pctCedo}%</b> do que fechas é feito nos <b>primeiros 2 dias</b>. O que fica parado, tende a morrer.`,
        })
      }
    }
  }

  // (C) muitas tags → demora mais que o previsto
  {
    const multi = com.filter((t) => t.realMin && tagsDe(t).length >= 3)
    const simples = com.filter((t) => t.realMin && tagsDe(t).length <= 1)
    if (multi.length >= 3 && simples.length >= 3) {
      const devM = multi.reduce((s, t) => s + (t.realMin - t.min) / t.min, 0) / multi.length
      const devS = simples.reduce((s, t) => s + (t.realMin - t.min) / t.min, 0) / simples.length
      const dif = Math.round((devM - devS) * 100)
      if (dif >= 12) {
        out.push({
          de: 'multi', para: 'lento', forca: Math.min(1, dif / 80),
          tipo: 'bad',
          texto: `Tarefas com <b>≥3 tags</b> estouram o previsto em <b>+${dif}%</b> face às simples. Divide-as.`,
        })
      }
    }
  }

  // (D) manhã → foco profundo (sessões longas concentram-se de manhã?)
  {
    const longas = com.filter((t) => (t.realMin || t.min) >= 45)
    if (longas.length >= 4) {
      const manha = longas.filter((t) => HORA(t.feitaEm) < 12.5).length
      const pct = Math.round(manha / longas.length * 100)
      if (pct >= 55) {
        out.push({
          de: 'manha', para: 'foco', forca: Math.min(1, pct / 100),
          tipo: 'good',
          texto: `<b>${pct}%</b> das tuas sessões longas acontecem de <b>manhã</b>. É aí que tens fôlego.`,
        })
      }
    }
  }

  if (out.length === 0) return null
  return { links: out, amostra: com.length }
}

// ── INSIGHTS DE DESTAQUE (os 3 cartões do topo) ──────────────────────
// Escolhe os sinais mais fortes disponíveis. Sempre devolve o que conseguir.
export function insightsDestaque(feitas) {
  const com = feitas.filter((t) => t.feitaEm)
  const cards = []

  // taxa de cumprimento aproximada: conclusões vs (conclusões + ainda por fazer antigas)
  // aqui usamos um proxy honesto — % de tarefas com realMin <= previsto (dentro do estimado)
  const comReal = com.filter((t) => t.realMin)
  if (comReal.length >= 4) {
    const dentro = comReal.filter((t) => t.realMin <= t.min * 1.1).length
    const pct = Math.round(dentro / comReal.length * 100)
    cards.push({ ic: '🎯', big: pct + '%', cap: 'Fechas dentro do previsto', accent: 'forest',
      note: `De ${comReal.length} tarefas medidas, ${dentro} ficaram dentro do que estimaste.` })
  }

  // hora de ouro
  const en = curvaEnergia(feitas)
  if (en && en.peak) {
    const h = Math.floor(en.peak.h)
    cards.push({ ic: '⚡', big: `${h}h–${h + 1}h`, cap: 'A tua hora de ouro', accent: 'mustard',
      note: 'É a faixa onde fechas mais trabalho — guarda-a para o que exige cabeça.' })
  }

  // maior desvio por tag
  const fl = fluxoTempo(feitas)
  if (fl && fl.rows.length) {
    const pior = [...fl.rows].sort((a, b) => Math.abs(b.dev) - Math.abs(a.dev))[0]
    if (Math.abs(pior.dev) >= 12) {
      cards.push({ ic: pior.dev > 0 ? '📐' : '✅', big: (pior.dev > 0 ? '+' : '') + pior.dev + '%', cap: `Desvio · ${pior.lab}`, accent: pior.dev > 0 ? 'sky' : 'forest',
        note: pior.dev > 0 ? `Subestimas ${pior.lab} — reserva-lhe mais tempo.` : `Acertas bem nas ${pior.lab}.` })
    }
  }

  return cards.slice(0, 3)
}
