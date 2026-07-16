// "43 min" até à hora; "1h 37m" depois; "2h" quando certinho
export function fmtMin(min) {
  const m = Math.round(min)
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60), r = m % 60
  return r > 0 ? `${h}h ${r}m` : `${h}h`
}

// desvio médio entre o tempo real e o previsto (positivo = costuma demorar mais)
export function desvioMedio(feitas) {
  const c = feitas.filter((t) => t.realMin != null && t.min > 0)
  if (c.length === 0) return { n: 0, avg: 0 }
  const avg = c.reduce((s, t) => s + (t.realMin - t.min), 0) / c.length
  return { n: c.length, avg: Math.round(avg) }
}
