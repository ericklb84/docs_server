import { useState, useEffect, useRef, useMemo } from "react";
import type { TreeNode } from "../api";

export type FileSearchItem = {
  relativePath: string;
  name: string;
  folder: string;
};

function collectFileItems(nodes: TreeNode[]): FileSearchItem[] {
  const items: FileSearchItem[] = [];
  function walk(ns: TreeNode[]) {
    for (const n of ns) {
      if (n.type === "file") {
        const parts = n.relativePath.split("/");
        const name = parts[parts.length - 1] ?? n.relativePath;
        const folder = parts.length > 1 ? parts.slice(0, -1).join("/") : "";
        items.push({ relativePath: n.relativePath, name, folder });
      }
      if (n.children?.length) walk(n.children);
    }
  }
  walk(nodes);
  return items;
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSelectFile: (relativePath: string) => void;
  tree: TreeNode[];
};

export function FileSearchModal({
  isOpen,
  onClose,
  onSelectFile,
  tree,
}: Props) {
  const [query, setQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const allItems = useMemo(() => collectFileItems(tree), [tree]);

  const results = useMemo(() => {
    if (!query.trim()) return allItems.slice(0, 50);
    const q = query.trim().toLowerCase();
    return allItems.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.relativePath.toLowerCase().includes(q)
    );
  }, [allItems, query]);

  useEffect(() => {
    setHighlightIndex(0);
  }, [query]);

  useEffect(() => {
    if (!isOpen) return;
    setQuery("");
    setHighlightIndex(0);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [isOpen]);

  useEffect(() => {
    const el = listRef.current;
    if (!el || highlightIndex < 0) return;
    const child = el.children[highlightIndex] as HTMLElement | undefined;
    child?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [highlightIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => (i + 1) % Math.max(1, results.length));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) =>
        i <= 0 ? Math.max(0, results.length - 1) : i - 1
      );
      return;
    }
    if (e.key === "Enter" && results[highlightIndex]) {
      e.preventDefault();
      onSelectFile(results[highlightIndex].relativePath);
      onClose();
    }
  };

  const handleSelect = (relativePath: string) => {
    onSelectFile(relativePath);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/50 dark:bg-black/70"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Pesquisar arquivos"
    >
      <div
        className="w-full max-w-xl rounded-xl bg-white shadow-xl dark:bg-zinc-800 ring-1 ring-zinc-200/80 dark:ring-zinc-600/50 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-600 px-4 py-2">
          <svg
            className="h-5 w-5 shrink-0 text-zinc-400 dark:text-zinc-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pesquisar por nome de arquivo..."
            className="flex-1 min-w-0 bg-transparent py-2 text-zinc-900 placeholder-zinc-400 focus:outline-none dark:text-zinc-100 dark:placeholder-zinc-500"
            aria-autocomplete="list"
            aria-controls="file-search-results"
            aria-activedescendant={
              results[highlightIndex]
                ? `file-search-item-${highlightIndex}`
                : undefined
            }
          />
          <kbd className="hidden sm:inline shrink-0 rounded border border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-700 px-2 py-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            ESC
          </kbd>
        </div>
        <div
          ref={listRef}
          id="file-search-results"
          className="max-h-[60vh] overflow-y-auto py-2"
          role="listbox"
        >
          {results.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              {query.trim()
                ? "Nenhum arquivo encontrado."
                : "Digite para pesquisar por nome ou caminho."}
            </div>
          ) : (
            results.map((item, i) => (
              <button
                key={item.relativePath}
                id={`file-search-item-${i}`}
                type="button"
                role="option"
                aria-selected={i === highlightIndex}
                className={`w-full text-left px-4 py-2.5 flex flex-col gap-0.5 transition-colors ${
                  i === highlightIndex
                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100"
                    : "text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700/50"
                }`}
                onMouseEnter={() => setHighlightIndex(i)}
                onClick={() => handleSelect(item.relativePath)}
              >
                <span className="font-medium truncate">{item.name}</span>
                {item.folder && (
                  <span
                    className={`text-xs truncate ${
                      i === highlightIndex
                        ? "text-blue-700 dark:text-blue-200"
                        : "text-zinc-500 dark:text-zinc-400"
                    }`}
                  >
                    {item.folder}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
        <div className="border-t border-zinc-200 dark:border-zinc-600 px-4 py-2 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span>↑↓ navegar · Enter abrir</span>
          <span>{results.length} arquivo(s)</span>
        </div>
      </div>
    </div>
  );
}
