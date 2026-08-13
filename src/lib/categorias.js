// ── ROE: categorias-mãe de trabalho (campo "obra") ──
// Natureza do trabalho, independente da tag de tipo. Uma tarefa tem no máximo
// uma categoria-mãe (ou nenhuma). Fonte única para Resumo, Observatório e Histórico.
//
// 'vendida'    → obra já ganha
// 'orcamentar' → obra ainda por fechar
// 'prescricao' → incorporação em projeto (nunca se vende nem orçamenta)

export const CATEGORIAS = [
  { key: 'vendida',    lab: 'Obra vendida',            cor: '#00C865', corSoft: '#EBFCF3', corInk: '#00A352' },
  { key: 'orcamentar', lab: 'Obra a orçamentar',       cor: '#1FB8E0', corSoft: '#EAF7FC', corInk: '#1496C4' },
  { key: 'prescricao', lab: 'Prescrição / Arquitetura', cor: '#8B5CF6', corSoft: '#F3EEFE', corInk: '#7C4FE0' },
]

export const CAT_POR_KEY = Object.fromEntries(CATEGORIAS.map((c) => [c.key, c]))

export const catLabel = (key) => (CAT_POR_KEY[key] ? CAT_POR_KEY[key].lab : null)
export const catCor = (key) => (CAT_POR_KEY[key] ? CAT_POR_KEY[key].cor : '#ADA590')
export const catCorInk = (key) => (CAT_POR_KEY[key] ? CAT_POR_KEY[key].corInk : '#7C7466')

// paleta estável por tag de tipo (para as barras coloridas, consistente entre vistas)
export const COR_TAG = {
  orc_cliente:  '#1FB8E0',
  orc_constr:   '#FF7A59',
  presc_arq:    '#00C865',
  alteracoes:   '#FFCE0A',
  apoio_tec:    '#8B5CF6',
  concorrencia: '#F43F76',
  admin:        '#14B8A6',
  urgencias:    '#FF1F3D',
  interno:      '#FF1F3D',
  telefone:     '#00C865',
  // legado
  obra:         '#1FB8E0',
  outros:       '#FFCE0A',
  ficheiro:     '#00C865',
}
export const corTag = (key) => COR_TAG[key] || '#ADA590'

// prioridade → cor
export const COR_PRIO = { urgente: '#FF1F3D', importante: '#FFCE0A', normal: '#ADA590' }
export const PRIO_LABEL = { urgente: 'Urgentes', importante: 'Importantes', normal: 'Normais' }
