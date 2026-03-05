# Docs Reader

Plataforma **local** para leitura de Markdown (`.md` e `.mdx`) a partir de uma pasta no seu computador. Monorepo com backend Express (TypeScript) e frontend React (Vite + TailwindCSS). Sem banco de dados, sem autenticação — ideal para documentação pessoal ou de equipe na sua máquina.

---

## Índice

- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Desenvolvimento](#desenvolvimento)
- [Produção](#produção)
- [Uso: pasta e leitura](#uso-pasta-e-leitura)
- [Funcionalidades](#funcionalidades)
- [API](#api)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Scripts](#scripts)
- [Segurança](#segurança)
- [Acesso na rede local](#acesso-na-rede-local)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Licença](#licença)

---

## Pré-requisitos

- **Node.js 22.x** (recomendado; versões 20+ devem funcionar)
- **npm** (ou pnpm/yarn)

---

## Instalação

Na raiz do repositório:

```bash
git clone <url-do-repositorio>
cd docs_server
npm install
```

O `npm install` na raiz instala as dependências do monorepo e dos pacotes `server` e `client`.

---

## Desenvolvimento

```bash
npm run dev
```

Isso sobe em paralelo:

- **API:** http://localhost:4000  
- **Client (Vite):** http://localhost:5173  

Abra o app em **http://localhost:5173**. O Vite faz proxy de `/api` para o servidor; não é preciso configurar CORS no dia a dia.

---

## Produção

### Build

```bash
npm run build
```

O script:

1. Limpa e recria a pasta `./build`
2. Gera o bundle do servidor em `build/index.js` (Express + CORS incluídos)
3. Gera o frontend em `build/static`
4. Cria um `package.json` em `build` com `start: "node index.js"`

### Executar

```bash
cd build
npm start
```

Ou a partir da raiz:

```bash
npm run start
```

(O `start` da raiz usa `NODE_ENV=production` e executa `node build/index.js`.)

Aplicação disponível em **http://localhost:4000** (front e API na mesma origem).

---

## Uso: pasta e leitura

1. **Primeira vez:** ao abrir o app, informe o **caminho completo do diretório** (ex: `C:\docs`, `/Users/meu/docs`) e clique em **Salvar e Carregar**.
2. **Trocar pasta:** use o botão **Trocar pasta** no header; no modal, digite o novo path e confirme.
3. O path é salvo no **localStorage** (`md_root_path`). A árvore só lista pastas que contenham `.md` ou `.mdx` em algum nível.
4. **Sidebar:** pastas expandem ao clicar; ao clicar em um arquivo, o conteúdo é carregado no reader.
5. **Documentos recentes:** os últimos arquivos abertos (por pasta) aparecem em **Documentos recentes** para acesso rápido.

---

## Funcionalidades

- **Árvore de arquivos:** apenas `.md` e `.mdx`; pastas vazias de markdown são ocultadas.
- **Reader Markdown:**
  - GitHub Flavored Markdown (tabelas, listas de tarefas, etc.)
  - Syntax highlight em blocos de código (highlight.js)
  - Links e âncoras (markdown-it-anchor)
  - Índice (TOC) a partir dos títulos (markdown-it-table-of-contents)
  - Código inline com destaque para paths
  - Cores em hex no texto renderizadas em chips (ex: `#ff0000`)
- **Diagramas Mermaid:** blocos ` ```mermaid ` são renderizados (flowchart, sequence, etc.) com tema alinhado ao dark/light do app e opção de tela cheia.
- **Dark/Light mode:** toggle no header; preferência salva em `localStorage` (`theme`: `"dark"` ou `"light"`).
- **Acesso na rede:** em dev, o Vite e o servidor escutam em `0.0.0.0`; você pode acessar de outro dispositivo na mesma rede (ex: celular) via `http://<IP>:5173` ou `http://<IP>:4000`. Ver [Acesso na rede local](#acesso-na-rede-local).

---

## API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET`  | `/api/server-info` | Retorna `host`, `port`, `serverUrl` e, em localhost, `networkHost` (IP da rede) para acesso de outros dispositivos. |
| `POST` | `/api/tree` | Body: `{ "rootPath": "C:\\docs" }`. Retorna `{ "tree": TreeNode[] }` — apenas nós que contêm ou levam a arquivos `.md`/`.mdx`. |
| `POST` | `/api/file` | Body: `{ "rootPath": "...", "relativePath": "pasta/arquivo.md" }`. Retorna `{ "content": string, "relativePath": string }` em UTF-8. |

**Formato do nó da árvore:**

```ts
type TreeNode = {
  type: "dir" | "file";
  name: string;
  relativePath: string;
  children?: TreeNode[];  // só em type === "dir"
};
```

Path traversal é bloqueado: o arquivo resolvido deve estar **dentro** de `rootPath`.

---

## Estrutura do projeto

```
docs_server/
├── client/                 # Frontend React + Vite + Tailwind
│   ├── src/
│   │   ├── api.ts          # fetchTree, fetchFile, fetchServerInfo
│   │   ├── storage.ts      # localStorage: rootPath, theme, recent docs
│   │   ├── markdown.ts     # markdown-it + plugins (GFM, anchor, TOC, highlight)
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── components/
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       ├── Reader.tsx
│   │       ├── PathModal.tsx
│   │       ├── FileSearchModal.tsx
│   │       ├── RecentDocs.tsx
│   │       └── MermaidDiagram.tsx
│   ├── vite.config.ts
│   └── package.json
├── server/                 # Backend Express + TypeScript
│   ├── src/
│   │   ├── index.ts        # rotas /api/tree, /api/file, /api/server-info + static em prod
│   │   └── path-utils.ts   # getMarkdownTree, resolveSafe, readFileUtf8
│   └── package.json
├── scripts/
│   └── prepare-build.cjs   # orquestra build do server + client → ./build
├── build/                  # gerado por npm run build (não versionado)
├── package.json            # scripts raiz: dev, build, start
├── README.md
├── NETWORK.md              # dicas de acesso na rede (firewall, mesma Wi‑Fi)
└── .gitignore
```

---

## Scripts

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Sobe server e client em paralelo (concurrently). |
| `npm run build` | Gera `./build` (server bundle + client estático). |
| `npm run build:no-check` | Mesmo build sem `tsc` (apenas para acelerar se você confiar no código). |
| `npm run start` | `NODE_ENV=production node build/index.js` — serve o app na porta 4000. |

Dentro de `server/` e `client/` há scripts próprios (`dev`, `build`, etc.); o uso normal é pelos scripts da **raiz**.

---

## Segurança

- **Path traversal:** o backend garante que o arquivo solicitado esteja **dentro** do `rootPath`. Requisições com `..` ou caminhos que saiam do root retornam **403**.
- **Uso local:** não há autenticação nem banco. O `rootPath` é sempre enviado pelo frontend; não há sessão no servidor. O app foi pensado para uso na sua máquina ou rede interna.
- **CORS:** habilitado para facilitar desenvolvimento; em produção você pode restringir a origem se quiser.
- **Variáveis de ambiente:** não commite `.env` ou `.env.local`. Eles estão no `.gitignore`. Ver [Variáveis de ambiente](#variáveis-de-ambiente).

---

## Acesso na rede local

Para abrir o app em outro dispositivo (celular, outro PC) na mesma rede:

- **Dev:** use o endereço **Network** que o Vite mostra (ex: `http://192.168.1.6:5173`).
- **Produção:** use `http://<IP-do-servidor>:4000`.

Se aparecer **ERR_CONNECTION_REFUSED**:

1. Reinicie o ambiente (`npm run dev` ou `npm run start`).
2. Confirme que o Vite/servidor está escutando em `0.0.0.0` (já configurado no projeto).
3. Firewall (macOS/Windows/roteador): libere as portas **5173** (dev) e **4000** (prod) para conexões na LAN.
4. Celular e PC devem estar na **mesma rede Wi‑Fi**.

Mais detalhes em **[NETWORK.md](./NETWORK.md)**.

---

## Variáveis de ambiente

O projeto não exige arquivo `.env` para rodar. Se no futuro você usar variáveis de ambiente:

- **Não commite** `.env` ou `.env.local` (eles já estão no `.gitignore`).
- Use `.env.example` (sem valores reais) para documentar as chaves necessárias e adicione `.env.example` ao repositório.

---

## Licença

Este repositório é fornecido como está. Consulte o repositório para informações de licença, se houver.
