# ROE Productivity

App pessoal de produtividade intencional — 5 ecrãs (Briefing, Foco, Capturar, Cidade, Análise).
Fase 1: projeto React navegável, com a ROE City 3D integrada. Dados de exemplo (Supabase entra na Fase 2).

## Stack
Vite + React 18. Sem backend nesta fase.

## Correr localmente
```bash
npm install
npm run dev
```

## Publicar (GitHub → Vercel)
1. Sobe esta pasta para o repositório GitHub (RAFAMLG88).
2. No Vercel: New Project → importa o repositório.
3. Framework preset: **Vite**. Build command: `npm run build`. Output: `dist`.
4. Deploy. Fica online no teu domínio Vercel.

## Estrutura
- `src/App.jsx` — navegação entre ecrãs (sidebar) + overlay da cidade 3D.
- `src/components/Sidebar.jsx` — navegação lateral.
- `src/components/Cidade3D.jsx` — abre `public/cidade-v41.html` em iframe (ecrã cheio).
- `src/screens/*.jsx` — os 5 ecrãs, cada um com o seu CSS.
- `public/cidade-v41.html` — a ROE City 3D (Three.js), intacta.

## Notas
- Ecrã cheio para PC, com sidebar à esquerda.
- Paleta ROE (creme, preto, mostarda, verde, vermelho, sky). Zero laranja/coral.
- Fontes: Fredoka, Quicksand, JetBrains Mono.
- Foco: "A tocar agora" controla o media do PC (Spotify/YouTube/sistema) — maqueta pronta a ligar às APIs na Fase 1+.
