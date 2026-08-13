// ── ROE v34: taxonomia de tags das tarefas ──
// Passámos de "tipo" único (string) para "tags" múltiplas (array).
// Fonte ÚNICA de verdade — importada por Capturar, Briefing, Foco, Análise e Captura Rápida.
// Tarefas antigas (tipos 'interno'/'telefone'/'obra'/'outros'/'ficheiro') não constam
// aqui de propósito: aparecem com o rótulo cru e caem em "Sem tipo" na Análise, por decisão.

// key: valor gravado na BD | lab: rótulo | ic: ícone | cls: classe de cor
export const TAGS = [
  { key: 'interno',      lab: 'Pedido Interno',           ic: '👤', cls: 'red' },
  { key: 'orc_cliente',  lab: 'Orçamento Cliente',        ic: '💰', cls: 'gold' },
  { key: 'orc_constr',   lab: 'Orçamento Construtora',    ic: '🏢', cls: 'gold' },
  { key: 'presc_arq',    lab: 'Prescrições Arquitectura', ic: '📐', cls: 'sky' },
  { key: 'telefone',     lab: 'Via Telefone',             ic: '✆',  cls: 'forest' },
  { key: 'urgencias',    lab: 'Urgências',                ic: '🚨', cls: 'red' },
  { key: 'alteracoes',   lab: 'Pedidos de Alteração',     ic: '✏️', cls: 'gold' },
  { key: 'apoio_tec',    lab: 'Apoio Técnico',            ic: '🛠', cls: 'sky' },
  { key: 'admin',        lab: 'Administrativo',           ic: '🗂', cls: 'forest' },
  { key: 'concorrencia', lab: 'Origem Concorrência',      ic: '🎯', cls: 'red' },
]

export const TAG_POR_KEY = Object.fromEntries(TAGS.map((t) => [t.key, t]))

// ── retrocompatibilidade: tipos ANTIGOS (v32) que já não constam da lista nova ──
// Dá-lhes cor e ícone para as tarefas existentes continuarem vivas no Escritório,
// até serem recatalogadas. 'interno' e 'telefone' já existem nas keys novas.
const LEGADO = {
  obra:     { lab: 'Obra',   ic: '🏗', cls: 'sky' },
  outros:   { lab: 'Outros', ic: '📌', cls: 'gold' },
  ficheiro: { lab: 'Email',  ic: '📧', cls: 'forest' },
}

// resolve uma key (nova OU antiga) para o seu meta visual; null se mesmo desconhecida
export const metaTag = (key) => TAG_POR_KEY[key] || LEGADO[key] || null

// rótulo curto para os badges das listas (Escritório/Foco): usa o nome completo,
// que já é conciso o suficiente; fica aqui centralizado caso queiras encurtar depois.
export const tagLabel = (key) => (TAG_POR_KEY[key] ? TAG_POR_KEY[key].lab : key)
export const tagIcon = (key) => (TAG_POR_KEY[key] ? TAG_POR_KEY[key].ic : '📌')
export const tagCls = (key) => (TAG_POR_KEY[key] ? TAG_POR_KEY[key].cls : 'neutro')

// normaliza: aceita o campo tags (array novo) OU o tipo antigo (string) → sempre array
export function tagsDe(tarefa) {
  if (Array.isArray(tarefa?.tags) && tarefa.tags.length) return tarefa.tags
  if (tarefa?.tipo) return [tarefa.tipo] // retrocompatível: tarefas antigas
  return []
}
