import { useState, useEffect, useCallback, useRef } from "react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { Reader } from "./components/Reader";
import { PathModal } from "./components/PathModal";
import { FileSearchModal } from "./components/FileSearchModal";
import { fetchTree, fetchFile, fetchServerInfo } from "./api";
import type { TreeNode } from "./api";
import {
  getStoredRootPath,
  setStoredRootPath,
  getStoredTheme,
  setStoredTheme,
  applyTheme,
  getRecentDocs,
  addOrUpdateRecentDoc,
  removeRecentDoc,
  type Theme,
} from "./storage";

/** Lê dir-path da query string (?dir-path=...) e aplica como rootPath (salva no localStorage). */
function getInitialRootPathFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  const dirPath = params.get("dir-path");
  if (dirPath == null || dirPath.trim() === "") return null;
  try {
    return decodeURIComponent(dirPath.trim());
  } catch {
    return null;
  }
}

function getPathAncestors(relativePath: string): string[] {
  const parts = relativePath.split("/");
  const ancestors: string[] = [];
  for (let i = 0; i < parts.length - 1; i++) {
    ancestors.push(parts.slice(0, i + 1).join("/"));
  }
  return ancestors;
}

/** Coleta todos os relativePath de arquivos na árvore (recursivo). */
function collectFilePaths(nodes: TreeNode[]): string[] {
  const paths: string[] = [];
  function walk(ns: TreeNode[]) {
    for (const n of ns) {
      if (n.type === "file") paths.push(n.relativePath);
      if (n.children?.length) walk(n.children);
    }
  }
  walk(nodes);
  return paths;
}

/** Retorna o caminho de README.md se existir na árvore (prioriza README.md na raiz). */
function findReadmePath(nodes: TreeNode[]): string | null {
  const paths = collectFilePaths(nodes);
  const exact = paths.find((p) => p === "README.md");
  if (exact) return exact;
  const withReadme = paths.find((p) => p.endsWith("/README.md"));
  return withReadme ?? null;
}

/** Lê o caminho do documento atual na URL (hash). Ex.: #docs/intro.md → "docs/intro.md" */
function getFileFromHash(): string | null {
  const hash = window.location.hash.slice(1).trim();
  if (!hash) return null;
  try {
    const path = decodeURIComponent(hash);
    return path || null;
  } catch {
    return null;
  }
}

/** Atualiza o hash da URL para o documento selecionado (para manter no reload). */
function setHashForFile(relativePath: string | null): void {
  if (relativePath == null || relativePath === "") {
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    return;
  }
  window.history.replaceState(null, "", `#${encodeURIComponent(relativePath)}`);
}

export default function App() {
  const [rootPath, setRootPath] = useState<string | null>(() => {
    const fromQuery = getInitialRootPathFromUrl();
    if (fromQuery) {
      setStoredRootPath(fromQuery);
      const url = new URL(window.location.href);
      url.searchParams.delete("dir-path");
      window.history.replaceState(null, "", url.pathname + url.search + url.hash);
      return fromQuery;
    }
    return getStoredRootPath();
  });
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [scrollToHash, setScrollToHash] = useState<string | null>(null);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [pathModalOpen, setPathModalOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [theme, setThemeState] = useState<Theme>(() => getStoredTheme());
  const [serverInfo, setServerInfo] = useState<Awaited<ReturnType<typeof fetchServerInfo>> | null>(null);
  const [recentDocs, setRecentDocs] = useState<ReturnType<typeof getRecentDocs>>([]);
  const [readingProgress, setReadingProgress] = useState(0);
  const mainRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    setRecentDocs(getRecentDocs(rootPath));
  }, [rootPath]);

  useEffect(() => {
    let cancelled = false;
    fetchServerInfo()
      .then((info) => {
        if (!cancelled) setServerInfo(info);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const loadTree = useCallback(async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTree(path);
      setTree(data);
      setSelectedFile(null);
      setFileContent("");
      setExpandedPaths(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar árvore");
      setTree([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (rootPath) loadTree(rootPath);
  }, [rootPath, loadTree]);

  const handlePathConfirm = useCallback(
    (path: string) => {
      setStoredRootPath(path);
      setRootPath(path);
      setPathModalOpen(false);
    },
    []
  );

  const handleSelectFile = useCallback(
    async (relativePath: string, hash?: string) => {
      if (!rootPath) return;
      const prevRecent = getRecentDocs(rootPath);
      const existing = prevRecent.find((d) => d.relativePath === relativePath);
      const initialProgress = existing?.progress ?? 0;
      setSelectedFile(relativePath);
      setScrollToHash(hash ?? null);
      setHashForFile(relativePath);
      setExpandedPaths((prev) => {
        const next = new Set(prev);
        getPathAncestors(relativePath).forEach((p) => next.add(p));
        return next;
      });
      setReadingProgress(initialProgress);
      addOrUpdateRecentDoc(rootPath, relativePath, initialProgress);
      setRecentDocs(getRecentDocs(rootPath));
      setLoading(true);
      setError(null);
      try {
        const { content } = await fetchFile(rootPath, relativePath);
        setFileContent(content);
      } catch (e) {
        setFileContent("");
        setError(e instanceof Error ? e.message : "Erro ao carregar arquivo");
      } finally {
        setLoading(false);
      }
    },
    [rootPath]
  );

  // Ao carregar: se houver documento na URL (hash) e existir na árvore, usá-lo; senão README.md
  useEffect(() => {
    if (!rootPath || tree.length === 0 || selectedFile !== null) return;
    const paths = collectFilePaths(tree);
    const fromHash = getFileFromHash();
    const pathToOpen =
      fromHash && paths.includes(fromHash)
        ? fromHash
        : findReadmePath(tree);
    if (pathToOpen) handleSelectFile(pathToOpen);
  }, [rootPath, tree, selectedFile, handleSelectFile]);

  const toggleTheme = useCallback(() => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setStoredTheme(next);
    setThemeState(next);
  }, [theme]);

  const handleRemoveRecentDoc = useCallback(
    (relativePath: string) => {
      if (!rootPath) return;
      removeRecentDoc(rootPath, relativePath);
      setRecentDocs(getRecentDocs(rootPath));
    },
    [rootPath]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (rootPath && tree.length > 0) setSearchModalOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [rootPath, tree.length]);

  useEffect(() => {
    const el = mainRef.current;
    if (!el || !rootPath || !selectedFile) return;
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const max = scrollHeight - clientHeight;
      const p = max <= 0 ? 0 : Math.min(1, scrollTop / max);
      setReadingProgress((prev) => Math.max(prev, p));
      addOrUpdateRecentDoc(rootPath, selectedFile, p);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [rootPath, selectedFile]);

  // Restaurar scroll onde parou ao abrir um doc (quando tem progresso salvo)
  useEffect(() => {
    const el = mainRef.current;
    if (!rootPath || !selectedFile || !fileContent || !el) return;
    const stored = getRecentDocs(rootPath).find((d) => d.relativePath === selectedFile);
    const progress = stored?.progress ?? 0;
    const scrollToRestored = () => {
      if (!mainRef.current) return;
      const e = mainRef.current;
      const max = e.scrollHeight - e.clientHeight;
      e.scrollTop = progress * max;
    };
    if (progress > 0) {
      requestAnimationFrame(() => {
        requestAnimationFrame(scrollToRestored);
      });
    } else {
      el.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [rootPath, selectedFile, fileContent]);

  if (!rootPath) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100 dark:bg-zinc-900">
        <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg dark:bg-zinc-800">
          <h1 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Docs Reader
          </h1>
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
            Informe o path completo do diretório onde estão seus arquivos
            Markdown (.md / .mdx).
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const input = form.querySelector('input[name="rootPath"]') as HTMLInputElement;
              if (input?.value.trim()) handlePathConfirm(input.value.trim());
            }}
          >
            <input
              type="text"
              name="rootPath"
              placeholder="C:\docs ou /Users/meu/docs"
              className="mb-4 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder-zinc-400"
            />
            <button
              type="submit"
              className="w-full rounded-lg bg-blue-600 py-2 text-white hover:bg-blue-700"
            >
              Salvar e Carregar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-white dark:bg-zinc-950">
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenPathModal={() => setPathModalOpen(true)}
        onOpenSearch={() => setSearchModalOpen(true)}
        serverInfo={serverInfo}
        rootPath={rootPath}
      />
      <div className="flex flex-1 min-h-0">
        <Sidebar
          nodes={tree}
          expandedPaths={expandedPaths}
          onToggleExpand={(relativePath) => {
            setExpandedPaths((prev) => {
              const next = new Set(prev);
              if (next.has(relativePath)) next.delete(relativePath);
              else next.add(relativePath);
              return next;
            });
          }}
          onSelectFile={handleSelectFile}
          selectedFile={selectedFile}
          recentDocs={recentDocs}
          readingProgress={readingProgress}
          onRemoveRecentDoc={handleRemoveRecentDoc}
        />
        <main
          ref={mainRef}
          className="flex-1 overflow-y-auto px-8 py-8"
        >
          {error && (
            <div className="mb-4 rounded-lg bg-red-100 px-4 py-2 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-200">
              {error}
            </div>
          )}
          {loading && !fileContent && selectedFile ? (
            <p className="text-zinc-500 dark:text-zinc-400">Carregando...</p>
          ) : selectedFile ? (
            <div className="mx-auto w-full max-w-[210mm]">
              <Reader
              content={fileContent}
              currentRelativePath={selectedFile}
              onSelectFile={handleSelectFile}
              scrollToHash={scrollToHash}
              onScrolledToHash={() => setScrollToHash(null)}
              theme={theme}
            />
            </div>
          ) : (
            <p className="text-zinc-500 dark:text-zinc-400">
              Selecione um arquivo na sidebar para ler.
            </p>
          )}
        </main>
      </div>
      <PathModal
        isOpen={pathModalOpen}
        onClose={() => setPathModalOpen(false)}
        onConfirm={(path) => {
          handlePathConfirm(path);
        }}
        initialPath={rootPath}
      />
      <FileSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSelectFile={handleSelectFile}
        tree={tree}
      />
    </div>
  );
}
