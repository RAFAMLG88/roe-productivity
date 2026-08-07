// Data real de hoje, formatada em português (pt-PT).
const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']
const DIAS_CURTO = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

export function hoje() {
  return new Date()
}

// "Quinta · 9 julho"
export function dataLonga(d = new Date()) {
  const dia = DIAS[d.getDay()]
  return dia.charAt(0).toUpperCase() + dia.slice(1) + ' · ' + d.getDate() + ' ' + MESES[d.getMonth()]
}

// saudação conforme a hora
export function saudacao(d = new Date()) {
  const h = d.getHours()
  if (h < 6) return 'boa madrugada'
  if (h < 13) return 'bom dia'
  if (h < 20) return 'boa tarde'
  return 'boa noite'
}

// hora atual "09:42"
export function horaAgora(d = new Date()) {
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
}

// semana de segunda a sexta com o dia de hoje marcado
export function semanaUtil(d = new Date()) {
  const dow = d.getDay() // 0=dom … 6=sáb
  // encontrar a segunda-feira desta semana
  const offsetToMonday = (dow === 0 ? -6 : 1 - dow)
  const monday = new Date(d)
  monday.setDate(d.getDate() + offsetToMonday)
  const out = []
  for (let i = 0; i < 5; i++) {
    const dd = new Date(monday)
    dd.setDate(monday.getDate() + i)
    out.push({
      d1: DIAS_CURTO[dd.getDay()],
      d2: String(dd.getDate()),
      today: dd.toDateString() === d.toDateString(),
    })
  }
  return out
}

// data curta "9/7"
export function dataCurta(d = new Date()) {
  return d.getDate() + '/' + (d.getMonth() + 1)
}
