// ── ROE: motor de cálculo das Análises / Observatório / Histórico ──
// Tudo deriva de "feitas" (tarefas concluídas, já com todo o histórico do contexto).
// Filosofia: tempos e percentagens. O tempo de cada tarefa = realMin (ou min estimado
// como recurso se não houver real). Absolutos E médias por tarefa, em harmonia.

import { tagsDe } from './tags.js'
import { CATEGORIAS } from './categorias.js'

// Chaves que NÃO são tipos de trabalho reais, mas sim "ainda por catalogar":
// 'ficheiro' = email capturado sem tipo · 'outros' = captura sem tipo · 'obra' = legado vago.
const POR_CATALOGAR = new Set(['ficheiro', 'outros', 'obra'])
export const KEY_SCAT = '_scat' // chave sintética "por catalogar"

// tags de uma tarefa PARA ANÁLISE: tipos reais tal como estão; se só tiver
// chaves-por-catalogar (ou nenhuma tag), colapsa numa única '_scat'.
function tagsAnalise(t) {
  const brutas = tagsDe(t)
  const reais = brutas.filter((k) => !POR_CATALOGAR.has(k))
  if (reais.length) return reais
  return [KEY_SCAT]
}

// tempo "real" de uma tarefa em minutos (real, senão estimado)
export const tempoDe = (t) => (t.realMin != null ? t.realMin : (t.min || 0))
// só tarefas com algum tempo > 0 contam para médias de tempo
const comTempo = (fs) => fs.filter((t) => tempoDe(t) > 0)

// formata minutos → "1h05" / "45m"
export function fmtDur(min) {
  min = Math.round(min || 0)
  if (min < 60) return min + 'm'
  const h = Math.floor(min / 60), m = min % 60
  return m ? h + 'h' + String(m).padStart(2, '0') : h + 'h'
}

// ═══════════════════════════════════════════════════════════════
// 1 · TEMPO POR TAG DE TIPO (absoluto + média/tarefa + %)
// ═══════════════════════════════════════════════════════════════
export function tempoPorTag(feitas) {
  const acc = {} // key → { min, n }
  feitas.forEach((t) => {
    const m = tempoDe(t)
    tagsAnalise(t).forEach((k) => {
      if (!acc[k]) acc[k] = { min: 0, n: 0 }
      acc[k].min += m
      acc[k].n += 1
    })
  })
  const total = Object.values(acc).reduce((s, x) => s + x.min, 0) || 1
  return Object.entries(acc)
    .map(([key, x]) => ({ key, min: x.min, n: x.n, media: x.n ? x.min / x.n : 0, pct: x.min / total * 100 }))
    .sort((a, b) => b.min - a.min)
}

// ═══════════════════════════════════════════════════════════════
// 2 · CATEGORIAS-MÃE (vendida / orçamentar / prescrição)
// ═══════════════════════════════════════════════════════════════
export function porCategoria(feitas) {
  const acc = {}
  CATEGORIAS.forEach((c) => { acc[c.key] = { min: 0, n: 0 } })
  let totalCat = 0
  feitas.forEach((t) => {
    if (t.obra && acc[t.obra]) {
      const m = tempoDe(t)
      acc[t.obra].min += m
      acc[t.obra].n += 1
      totalCat += m
    }
  })
  totalCat = totalCat || 1
  return CATEGORIAS.map((c) => ({
    key: c.key, lab: c.lab, cor: c.cor, corInk: c.corInk,
    min: acc[c.key].min, n: acc[c.key].n,
    media: acc[c.key].n ? acc[c.key].min / acc[c.key].n : 0,
    pct: acc[c.key].min / totalCat * 100,
  }))
}

// ═══════════════════════════════════════════════════════════════
// 3 · CRUZAMENTO: dentro de cada categoria-mãe, repartição por tag
// ═══════════════════════════════════════════════════════════════
export function cruzamento(feitas) {
  return CATEGORIAS.map((c) => {
    const doCat = feitas.filter((t) => t.obra === c.key)
    const totalMin = doCat.reduce((s, t) => s + tempoDe(t), 0) || 1
    const nCat = doCat.length
    const tags = tempoPorTag(doCat).map((x) => ({ ...x, pctCat: x.min / totalMin * 100 }))
    return {
      key: c.key, lab: c.lab, cor: c.cor, corInk: c.corInk,
      totalMin: doCat.reduce((s, t) => s + tempoDe(t), 0),
      n: nCat,
      media: nCat ? doCat.reduce((s, t) => s + tempoDe(t), 0) / nCat : 0,
      tags,
    }
  })
}

// ═══════════════════════════════════════════════════════════════
// 4 · PRIORIDADE (urgente / importante / normal) — nº + %
// ═══════════════════════════════════════════════════════════════
export function porPrioridade(feitas) {
  const acc = { urgente: 0, importante: 0, normal: 0 }
  feitas.forEach((t) => {
    const p = t.prioridade === 'urgente' || t.prioridade === 'importante' ? t.prioridade : 'normal'
    acc[p] += 1
  })
  const total = feitas.length || 1
  return {
    urgente: { n: acc.urgente, pct: acc.urgente / total * 100 },
    importante: { n: acc.importante, pct: acc.importante / total * 100 },
    normal: { n: acc.normal, pct: acc.normal / total * 100 },
  }
}

// ═══════════════════════════════════════════════════════════════
// 5 · PRECISÃO DA ESTIMATIVA por tag (desvio médio real vs. estimado)
// ═══════════════════════════════════════════════════════════════
export function precisaoPorTag(feitas) {
  const acc = {} // key → { desvios: [], n }
  comTempo(feitas).forEach((t) => {
    if (t.min > 0 && t.realMin != null) {
      const desvio = (t.realMin - t.min) / t.min // fração
      tagsAnalise(t).forEach((k) => {
        if (!acc[k]) acc[k] = { soma: 0, n: 0 }
        acc[k].soma += desvio
        acc[k].n += 1
      })
    }
  })
  return Object.entries(acc)
    .map(([key, x]) => ({ key, desvioMedio: x.n ? x.soma / x.n * 100 : 0, n: x.n }))
    .filter((x) => x.n >= 2)
    .sort((a, b) => Math.abs(b.desvioMedio) - Math.abs(a.desvioMedio))
}

// ═══════════════════════════════════════════════════════════════
// 6 · DELEGAÇÃO por tag (% de tarefas de cada tag que foram delegadas)
// ═══════════════════════════════════════════════════════════════
export function delegacaoPorTag(feitas, meuId) {
  const acc = {} // key → { deleg, total }
  feitas.forEach((t) => {
    const foiDelegada = t.delegadaPor === meuId || (t.ownerId && t.ownerId !== meuId && t.criadaPor === meuId)
    tagsAnalise(t).forEach((k) => {
      if (!acc[k]) acc[k] = { deleg: 0, total: 0 }
      acc[k].total += 1
      if (foiDelegada) acc[k].deleg += 1
    })
  })
  return Object.entries(acc)
    .map(([key, x]) => ({ key, pct: x.total ? x.deleg / x.total * 100 : 0, n: x.total }))
    .filter((x) => x.n >= 2)
    .sort((a, b) => b.pct - a.pct)
}

// ═══════════════════════════════════════════════════════════════
// 7 · TRABALHO REATIVO (urgências + concorrência) vs. planeado
// ═══════════════════════════════════════════════════════════════
export function trabalhoReativo(feitas) {
  let reativo = 0, total = 0
  comTempo(feitas).forEach((t) => {
    const m = tempoDe(t)
    total += m
    const tags = tagsAnalise(t)
    if (t.prioridade === 'urgente' || tags.includes('urgencias') || tags.includes('concorrencia')) reativo += m
  })
  total = total || 1
  return { pctReativo: reativo / total * 100, pctPlaneado: 100 - reativo / total * 100 }
}

// ═══════════════════════════════════════════════════════════════
// AUX de datas
// ═══════════════════════════════════════════════════════════════
const inicioSemana = (d) => {
  const x = new Date(d); const dia = (x.getDay() + 6) % 7 // segunda=0
  x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - dia); return x
}
const MS_SEM = 7 * 24 * 3600 * 1000

// ═══════════════════════════════════════════════════════════════
// 8 · TENDÊNCIAS: semana atual vs. anterior vs. média histórica
// ═══════════════════════════════════════════════════════════════
export function tendenciaSemanal(feitas) {
  const agora = new Date()
  const ini = inicioSemana(agora)
  const iniAnt = new Date(ini.getTime() - MS_SEM)

  const naSemana = (de, ate) => feitas.filter((t) => t.feitaEm && t.feitaEm >= de.getTime() && t.feitaEm < ate.getTime())
  const semAtual = naSemana(ini, new Date(ini.getTime() + MS_SEM))
  const semAnt = naSemana(iniAnt, ini)

  // agrupar todo o histórico por semana para a média
  const porSem = {}
  feitas.forEach((t) => {
    if (!t.feitaEm) return
    const k = inicioSemana(new Date(t.feitaEm)).getTime()
    if (!porSem[k]) porSem[k] = { min: 0, n: 0 }
    porSem[k].min += tempoDe(t); porSem[k].n += 1
  })
  const semanas = Object.values(porSem)
  const mediaFocoMin = semanas.length ? semanas.reduce((s, x) => s + x.min, 0) / semanas.length : 0
  const mediaTarefas = semanas.length ? semanas.reduce((s, x) => s + x.n, 0) / semanas.length : 0

  const foco = (fs) => fs.reduce((s, t) => s + tempoDe(t), 0)
  const mediaTarefa = (fs) => { const c = comTempo(fs); return c.length ? foco(c) / c.length : 0 }
  const reativoPct = (fs) => trabalhoReativo(fs).pctReativo

  return {
    nSemanas: semanas.length,
    foco: { atual: foco(semAtual), anterior: foco(semAnt), media: mediaFocoMin },
    tarefas: { atual: semAtual.length, anterior: semAnt.length, media: mediaTarefas },
    mediaTarefa: { atual: mediaTarefa(semAtual), anterior: mediaTarefa(semAnt), media: mediaTarefa(feitas) },
    reativo: { atual: reativoPct(semAtual), anterior: reativoPct(semAnt), media: reativoPct(feitas) },
    // por natureza, as duas semanas
    porNatureza: CATEGORIAS.map((c) => ({
      key: c.key, lab: c.lab, cor: c.cor,
      atual: foco(semAtual.filter((t) => t.obra === c.key)),
      anterior: foco(semAnt.filter((t) => t.obra === c.key)),
    })),
  }
}

// série das últimas N semanas (foco por semana) — para sparkline
export function serieSemanas(feitas, n = 8) {
  const agora = new Date(); const ini = inicioSemana(agora)
  const out = []
  for (let i = n - 1; i >= 0; i--) {
    const de = new Date(ini.getTime() - i * MS_SEM)
    const ate = new Date(de.getTime() + MS_SEM)
    const fs = feitas.filter((t) => t.feitaEm && t.feitaEm >= de.getTime() && t.feitaEm < ate.getTime())
    out.push({ min: fs.reduce((s, t) => s + tempoDe(t), 0), n: fs.length })
  }
  const media = out.length ? out.reduce((s, x) => s + x.min, 0) / out.length : 0
  return { pontos: out, media }
}

// ═══════════════════════════════════════════════════════════════
// 9 · RITMO: horas de ouro, dia da semana, consistência
// ═══════════════════════════════════════════════════════════════
export function horasDeOuro(feitas) {
  const bins = Array(24).fill(0)
  feitas.forEach((t) => { if (t.feitaEm) bins[new Date(t.feitaEm).getHours()] += 1 })
  const janela = bins.slice(7, 20) // 7h–19h
  const max = Math.max(...janela, 1)
  const picoIdx = 7 + janela.indexOf(Math.max(...janela))
  return { bins, de: 7, ate: 19, max, pico: picoIdx, temDados: janela.some((x) => x > 0) }
}

export function porDiaSemana(feitas) {
  const dias = Array(7).fill(0) // 0=segunda
  feitas.forEach((t) => { if (t.feitaEm) { const d = (new Date(t.feitaEm).getDay() + 6) % 7; dias[d] += 1 } })
  const nomes = ['2ª', '3ª', '4ª', '5ª', '6ª', 'Sáb', 'Dom']
  const uteis = dias.slice(0, 5)
  const max = Math.max(...uteis, 1)
  const melhorIdx = uteis.indexOf(Math.max(...uteis))
  return { dias, nomes, max, melhor: nomes[melhorIdx], temDados: uteis.some((x) => x > 0) }
}

export function consistencia(feitas, nDias = 14) {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
  const cels = []
  let ativos = 0, streak = 0, streakVivo = true, totalTarefas = 0
  for (let i = nDias - 1; i >= 0; i--) {
    const d = new Date(hoje.getTime() - i * 24 * 3600 * 1000)
    const de = d.getTime(), ate = de + 24 * 3600 * 1000
    const n = feitas.filter((t) => t.feitaEm && t.feitaEm >= de && t.feitaEm < ate).length
    cels.push(n)
    totalTarefas += n
    if (n > 0) ativos += 1
  }
  // streak a contar do fim
  for (let i = cels.length - 1; i >= 0; i--) { if (cels[i] > 0 && streakVivo) streak += 1; else streakVivo = false }
  const max = Math.max(...cels, 1)
  return { cels, max, ativos, nDias, streak, mediaAtivo: ativos ? (totalTarefas / ativos) : 0 }
}

// ═══════════════════════════════════════════════════════════════
// 10 · PLANEADO vs. REAL
// ═══════════════════════════════════════════════════════════════
export function planeadoVsReal(feitas) {
  const medidas = feitas.filter((t) => t.min > 0 && t.realMin != null)
  if (!medidas.length) return null
  const dentro = medidas.filter((t) => t.realMin <= t.min * 1.1).length // margem 10%
  const estMedia = medidas.reduce((s, t) => s + t.min, 0) / medidas.length
  const realMedia = medidas.reduce((s, t) => s + t.realMin, 0) / medidas.length
  return {
    n: medidas.length,
    pctDentro: dentro / medidas.length * 100,
    estMedia, realMedia, desvioMin: realMedia - estMedia,
  }
}

// evolução da precisão ao longo das semanas
export function precisaoSemanas(feitas, n = 8) {
  const agora = new Date(); const ini = inicioSemana(agora)
  const out = []
  for (let i = n - 1; i >= 0; i--) {
    const de = new Date(ini.getTime() - i * MS_SEM).getTime()
    const ate = de + MS_SEM
    const fs = feitas.filter((t) => t.feitaEm && t.feitaEm >= de && t.feitaEm < ate && t.min > 0 && t.realMin != null)
    const dentro = fs.filter((t) => t.realMin <= t.min * 1.1).length
    out.push(fs.length ? dentro / fs.length * 100 : null)
  }
  return out
}

// ═══════════════════════════════════════════════════════════════
// 11 · COMPARATIVO COM A EQUIPA (precisa das tarefas dos colegas)
// ═══════════════════════════════════════════════════════════════
export function tuVsEquipa(minhasFeitas, equipaFeitas) {
  const met = (fs) => {
    const ct = comTempo(fs)
    const mediaTarefa = ct.length ? ct.reduce((s, t) => s + tempoDe(t), 0) / ct.length : 0
    const medidas = fs.filter((t) => t.min > 0 && t.realMin != null)
    const dentro = medidas.filter((t) => t.realMin <= t.min * 1.1).length
    const precisao = medidas.length ? dentro / medidas.length * 100 : 0
    return { mediaTarefa, precisao, n: fs.length }
  }
  if (!equipaFeitas || !equipaFeitas.length) return null
  return { tu: met(minhasFeitas), equipa: met(equipaFeitas) }
}

// ═══════════════════════════════════════════════════════════════
// 12 · HISTÓRICO mensal e anual
// ═══════════════════════════════════════════════════════════════
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

// estatísticas de um conjunto de tarefas (usado por mês e por ano)
function estatsDe(fs) {
  const min = fs.reduce((s, t) => s + tempoDe(t), 0)
  const ct = comTempo(fs)
  const media = ct.length ? min / ct.length : 0
  const cats = porCategoria(fs).filter((c) => c.n > 0).sort((a, b) => b.min - a.min)
  const dominante = cats.length ? cats[0] : null
  const tags = tempoPorTag(fs)
  const prio = porPrioridade(fs)
  return { min, n: fs.length, media, cats, dominante, tags, prio }
}

// intensidade relativa (calmo/média/agitado) — calculada face à média dos meses do ano
function intensidade(nTarefas, mediaMes) {
  if (mediaMes <= 0) return 'media'
  if (nTarefas >= mediaMes * 1.2) return 'alta'
  if (nTarefas <= mediaMes * 0.8) return 'baixa'
  return 'media'
}

export function historico(feitas) {
  // agrupar por ano → mês
  const porAno = {} // ano → { meses: {mesIdx: []}, todas: [] }
  feitas.forEach((t) => {
    if (!t.feitaEm) return
    const d = new Date(t.feitaEm)
    const ano = d.getFullYear(), mes = d.getMonth()
    if (!porAno[ano]) porAno[ano] = { meses: {}, todas: [] }
    if (!porAno[ano].meses[mes]) porAno[ano].meses[mes] = []
    porAno[ano].meses[mes].push(t)
    porAno[ano].todas.push(t)
  })

  const anoAtual = new Date().getFullYear()
  const mesAtual = new Date().getMonth()

  const anos = Object.keys(porAno).map(Number).sort((a, b) => b - a).map((ano) => {
    const dados = porAno[ano]
    const mesesComDados = Object.keys(dados.meses).map(Number).sort((a, b) => b - a)
    const mediaMesTarefas = mesesComDados.length
      ? mesesComDados.reduce((s, m) => s + dados.meses[m].length, 0) / mesesComDados.length : 0

    const meses = mesesComDados.map((m) => {
      const e = estatsDe(dados.meses[m])
      return {
        idx: m, nome: MESES[m],
        emCurso: ano === anoAtual && m === mesAtual,
        intensidade: (ano === anoAtual && m === mesAtual) ? 'curso' : intensidade(e.n, mediaMesTarefas),
        ...e,
      }
    })

    const eAno = estatsDe(dados.todas)
    // mês mais agitado / calmo (por nº tarefas), só entre os fechados
    const fechados = meses.filter((x) => !x.emCurso)
    const maisAgitado = fechados.length ? fechados.reduce((a, b) => b.n > a.n ? b : a) : null
    const maisCalmo = fechados.length ? fechados.reduce((a, b) => b.n < a.n ? b : a) : null

    return {
      ano, emCurso: ano === anoAtual,
      nMeses: mesesComDados.length,
      ...eAno,
      meses,
      maisAgitado, maisCalmo,
    }
  })

  return { anos, anoAtual }
}
