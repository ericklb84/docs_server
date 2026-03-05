import { useEffect, useMemo, useRef } from "react";
import { createRoot } from "react-dom/client";
import { renderMarkdown } from "../markdown";
import { MermaidDiagram } from "./MermaidDiagram";

type Props = {
  content: string;
  className?: string;
  /** Caminho relativo do arquivo atual (ex: "docs/intro.md") para resolver links relativos */
  currentRelativePath?: string | null;
  /** Callback ao clicar em link para outro .md/.mdx */
  onSelectFile?: (relativePath: string, hash?: string) => void;
  /** Hash para scroll após carregar (ex: "section") — usado após navegar por link com âncora */
  scrollToHash?: string | null;
  onScrolledToHash?: () => void;
  /** Tema para diagramas Mermaid (dark/light) */
  theme?: "dark" | "light";
};

/** Resolve href relativo a partir do arquivo atual. Retorna path com "/" e sem hash/query. */
function resolveRelativePath(
  currentRelativePath: string | null | undefined,
  href: string
): string {
  if (!currentRelativePath || !href || href.startsWith("#") || /^[a-z]+:\/\//i.test(href)) {
    return href;
  }
  const [pathPart] = href.split("#")[0].split("?");
  if (!pathPart) return href;
  const baseDir = currentRelativePath.includes("/")
    ? currentRelativePath.replace(/\/[^/]+$/, "/")
    : "";
  if (pathPart.startsWith("/")) {
    return pathPart.slice(1);
  }
  const full = (baseDir + pathPart).replace(/\/\.\//g, "/");
  const parts = full.split("/");
  const result: string[] = [];
  for (const p of parts) {
    if (p === "..") result.pop();
    else if (p !== "." && p) result.push(p);
  }
  return result.join("/");
}

function isMarkdownPath(path: string): boolean {
  return /\.(md|mdx)(#|$|\?)/i.test(path) || path.endsWith(".md") || path.endsWith(".mdx");
}

export function Reader({
  content,
  className = "",
  currentRelativePath = null,
  onSelectFile,
  scrollToHash = null,
  onScrolledToHash,
  theme,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mermaidRootsRef = useRef<{ root: ReturnType<typeof createRoot>; el: HTMLElement }[]>([]);

  const html = useMemo(() => renderMarkdown(content), [content]);

  useEffect(() => {
    if (!scrollToHash || !onScrolledToHash) return;
    const id = scrollToHash.startsWith("#") ? scrollToHash.slice(1) : scrollToHash;
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      onScrolledToHash();
    }
  }, [content, scrollToHash, onScrolledToHash]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const placeholders = container.querySelectorAll<HTMLElement>("[data-mermaid][data-code]");
    mermaidRootsRef.current.forEach(({ root }) => {
      try {
        root.unmount();
      } catch {
        /* ignore */
      }
    });
    mermaidRootsRef.current = [];

    placeholders.forEach((el) => {
      const base64 = el.getAttribute("data-code");
      if (!base64) return;
      try {
        const code = decodeURIComponent(escape(atob(base64)));
        const root = createRoot(el);
        root.render(<MermaidDiagram code={code} theme={theme} />);
        mermaidRootsRef.current.push({ root, el });
      } catch {
        el.textContent = "Erro ao decodificar diagrama.";
      }
    });

    return () => {
      mermaidRootsRef.current.forEach(({ root }) => {
        try {
          root.unmount();
        } catch {
          /* ignore */
        }
      });
      mermaidRootsRef.current = [];
    };
  }, [html, theme]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.querySelectorAll('a[href^="http"]').forEach((a) => {
      (a as HTMLAnchorElement).setAttribute("target", "_blank");
      (a as HTMLAnchorElement).setAttribute("rel", "noopener noreferrer");
    });
  }, [html]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = (e.target as HTMLElement).closest("a");
    if (!a || !a.href) return;

    const href = a.getAttribute("href");
    if (!href) return;

    const isAnchor = href.startsWith("#");
    const isExternal = /^[a-z]+:\/\//i.test(href);

    if (isAnchor) return;

    if (isExternal) return;

    const resolved = resolveRelativePath(currentRelativePath, href);
    const hash = href.includes("#") ? href.slice(href.indexOf("#") + 1) : undefined;
    if (isMarkdownPath(resolved) && onSelectFile) {
      e.preventDefault();
      onSelectFile(resolved, hash || undefined);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`prose prose-zinc max-w-none dark:prose-invert prose-headings:font-semibold prose-pre:bg-zinc-100 prose-pre:text-zinc-800 dark:prose-pre:bg-zinc-800 dark:prose-pre:text-zinc-200 prose-table:border prose-table:border-zinc-200 dark:prose-table:border-zinc-700 prose-th:border prose-th:border-zinc-200 dark:prose-th:border-zinc-700 prose-th:px-4 prose-th:py-3 prose-td:border prose-td:border-zinc-200 dark:prose-td:border-zinc-700 prose-td:px-4 prose-td:py-3 [&_.markdown-toc]:list-none [&_.markdown-toc_ul]:pl-4 [&_.markdown-toc_li]:py-0.5 ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
      onClick={handleClick}
    />
  );
}
