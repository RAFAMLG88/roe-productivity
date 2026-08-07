# ROE Guitar — versão localStorage

Sem Supabase, sem login. A app abre direto no Dashboard e guarda o progresso
no navegador do dispositivo.

## Publicar
1. GitHub: sobe o conteúdo desta pasta `app` para `RAFAMLG88/roe-guitar` (substitui os ficheiros antigos).
2. Vercel: importa o repositório (preset Vite) e faz Deploy. **Sem Environment Variables.**
   Se o projeto já existe, o commit dispara redeploy automático.

## Dados
- O progresso vive no localStorage do navegador.
- Progresso → Gestão de dados → Exportar/Importar JSON para backup ou para passar entre dispositivos.
- "Apagar tudo" limpa o progresso deste dispositivo (pede confirmação).

## Voltar ao Supabase (futuro)
A API interna em `src/lib/store.js` tem as mesmas funções que a versão Supabase.
Trocar a implementação de volta é substituir só esse ficheiro.
