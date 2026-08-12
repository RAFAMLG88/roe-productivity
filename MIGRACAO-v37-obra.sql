-- ═══════════════════════════════════════════════════════════════════
-- ROE Productivity · Migração v37 — campo "obra" nas tarefas
-- Correr no Supabase (SQL Editor) ANTES de publicar a v37.
-- Aditivo e idempotente: seguro correr várias vezes, não afeta dados.
-- ═══════════════════════════════════════════════════════════════════

alter table public.tarefas
  add column if not exists obra text;

-- valores possíveis: 'vendida' | 'orcamentar' | NULL (sem estado)
-- (não se cria constraint para manter total flexibilidade e evitar quebras)
