# Docs Reader

Plataforma local para leitura de Markdown a partir de uma pasta no seu computador. Backend (Express + TypeScript) + Frontend (React + Vite + Tailwind) em monorepo.

## Pré-requisitos

- **Node.js 22.x** (recomendado)
- npm (ou pnpm/yarn)

## Como rodar em desenvolvimento

Na raiz do projeto:

```bash
npm install
npm run dev
```

- **API:** http://localhost:4000  
- **Client:** http://localhost:5173  

O Vite faz proxy de `/api` para o servidor; abra o app em **http://localhost:5173**.

## Como buildar e rodar em produção

```bash
npm run build
npm run start
```

O script `start` serve o client buildado pelo Express e inicia a API na mesma origem (porta 4000). Acesse **http://localhost:4000**.

## Como setar/trocar o path

1. **Primeira vez:** ao abrir o app, informe o “Path completo do diretório” (ex: `C:\docs` ou `/Users/meu/docs`) e clique em **Salvar e Carregar**.
2. **Trocar depois:** use o botão **Trocar pasta** no header; no modal, digite o novo path e confirme. O path é salvo no `localStorage` (`md_root_path`) e a árvore é recarregada.

## Observações de segurança

- **Path traversal:** o backend garante que qualquer arquivo solicitado esteja **dentro** do `rootPath` informado. Requisições com `..` ou caminhos absolutos que saiam do root são bloqueadas (403).
- **Uso local:** não há autenticação nem banco; o app foi pensado para uso na sua máquina. O `rootPath` é sempre enviado pelo frontend (não há sessão no servidor).
- **CORS:** habilitado para facilitar dev; em produção você pode restringir a origem se quiser.

## Scripts na raiz

| Script        | Descrição                                      |
|---------------|------------------------------------------------|
| `npm run dev` | Sobe server e client em paralelo (concurrently) |
| `npm run build` | Builda server e client                       |
| `npm run start` | Serve o client e inicia a API (produção)     |

## Estrutura

- `/server` — API Express (TypeScript): `POST /api/tree`, `POST /api/file`
- `/client` — React + Vite + Tailwind: sidebar (árvore .md/.mdx), reader com GFM e syntax highlight

## Dark/Light mode

Toggle no header. A preferência é salva em `localStorage` (`theme`: `"dark"` ou `"light"`) e aplicada via classe `dark` no `<html>` (Tailwind dark mode).
