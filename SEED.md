Gere um projeto local “all-in-one” (backend + frontend) para rodar na minha máquina.

Stack
- Node.js 22.x
- Backend: Node.js + Express (TypeScript)
- Frontend: React (Vite) + TailwindCSS (TypeScript)
- Sem Next.js
- Monorepo simples: /server e /client (com scripts na raiz para rodar os dois)

Objetivo
Criar uma plataforma simples de leitura de Markdown a partir de uma pasta LOCAL do meu computador.

UX / Fluxo
1) Ao abrir o app:
   - Se existir `md_root_path` no localStorage:
     - usar esse path automaticamente, carregar a árvore e exibir o reader.
   - Se NÃO existir:
     - mostrar uma tela simples pedindo o “Path completo do diretório” (input + botão “Salvar e Carregar”).
2) No topo (header):
   - Botão “Trocar pasta”:
     - ao clicar, abrir um modal/overlay com input do path.
     - ao confirmar, salvar no localStorage (`md_root_path`) e recarregar árvore.
   - Toggle Dark/Light mode:
     - usar Tailwind dark mode (class)
     - persistir em localStorage (ex: `theme = "dark"|"light"`)

Backend (API)
- IMPORTANTE: o backend deve receber SEMPRE o rootPath vindo do frontend (não precisa “salvar sessão” no servidor).
- Endpoints:
  - POST /api/tree  { "rootPath": "C:\\... ou /Users/..."} -> retorna árvore filtrando apenas .md e .mdx
  - POST /api/file  { "rootPath": "...", "relativePath": "docs/intro.md" } -> retorna conteúdo UTF-8
- Segurança:
  - Impedir path traversal: garantir que o arquivo resolvido esteja DENTRO do rootPath.
  - Normalize caminhos e gere `relativePath` com separador "/" na resposta.
- Árvore:
  - Node:
    { type: "dir"|"file", name: string, relativePath: string, children?: Node[] }
  - Diretórios só aparecem se contiverem markdown em algum nível OU se tiverem subpastas com markdown.

Frontend
- Layout:
  - Header (topo) com “Trocar pasta” + toggle dark/light
  - Sidebar esquerda com árvore (expand/collapse)
  - Área principal direita com reader
- Sidebar:
  - Pastas expandem ao clicar
  - Ao clicar em arquivo: chamar /api/file e renderizar no reader
  - Auto-expand: quando abrir um arquivo, manter o caminho de pastas expandido
- Reader Markdown moderno:
  - Renderizar markdown com:
    - GitHub Flavored Markdown (tabelas, task list, etc.)
    - Code blocks com highlight
    - Links
  - Libs sugeridas: react-markdown + remark-gfm + rehype-highlight (ou equivalente)
  - Tipografia agradável com Tailwind (pode usar @tailwindcss/typography)

Scripts
- Na raiz:
  - npm run dev -> sobe server e client (concurrently)
  - npm run build -> builda os dois
  - npm run start -> serve o client buildado pelo server e inicia API
- Portas:
  - Server: 4000
  - Client: 5173
  - Em dev, usar proxy do Vite para /api

Entrega
- Gere TODOS os arquivos do projeto (package.json raiz + server + client).
- Inclua README com:
  - Pré-requisitos
  - Como rodar dev
  - Como buildar e rodar prod
  - Como setar/trocar o path
  - Observações de segurança (path traversal bloqueado)

Regras de simplicidade
- Nada de banco
- Nada de auth
- Nada de electron
- Código limpo e direto