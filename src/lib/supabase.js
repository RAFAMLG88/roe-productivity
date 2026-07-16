import { createClient } from '@supabase/supabase-js'

// A chave "anon" é pública por design — a segurança real são as políticas RLS
// definidas na base de dados (Etapa 1). NUNCA colocar aqui a service_role.
const SUPABASE_URL = 'https://zlhnelprxoxhemwpcnao.supabase.co'
const SUPABASE_ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsaG5lbHByeG94aGVtd3BjbmFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyMDIyNDUsImV4cCI6MjA5OTc3ODI0NX0.VoXzMOxvwDuymMTS9jj06GDmA-arF5486_3is5Mc30o'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)
