import { useEffect, useId, useState } from "react";
import mermaid from "mermaid";

type Props = {
  code: string;
  /** "dark" | "light" para re-renderizar o diagrama ao trocar tema */
  theme?: "dark" | "light";
};

function getMermaidTheme(): "default" | "dark" {
  return document.documentElement.classList.contains("dark") ? "dark" : "default";
}

function getBaseConfig() {
  return {
    startOnLoad: false,
    theme: getMermaidTheme(),
    securityLevel: "loose" as const,
    themeVariables: {
      fontSize: "16px",
      fontFamily: "inherit",
    },
    flowchart: { useMaxWidth: true },
  };
}

export function MermaidDiagram({ code, theme }: Props) {
  const id = useId().replace(/:/g, "");
  const [error, setError] = useState<string | null>(null);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [fullscreenSvg, setFullscreenSvg] = useState<string | null>(null);
  const [fullscreenLoading, setFullscreenLoading] = useState(false);

  useEffect(() => {
    mermaid.initialize(getBaseConfig());
  }, [theme]);

  useEffect(() => {
    if (!code.trim()) return;
    setSvgContent(null);
    setError(null);
    mermaid.initialize(getBaseConfig());
    let cancelled = false;
    const diagramId = `mermaid-${id}-${Date.now()}`;
    mermaid
      .render(diagramId, code)
      .then(({ svg }) => {
        if (!cancelled) setSvgContent(svg);
      })
      .catch((err) => {
        if (!cancelled) setError(String(err?.message ?? err));
      });
    return () => {
      cancelled = true;
    };
  }, [code, theme, id]);

  useEffect(() => {
    if (!fullscreenOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreenOpen(false);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [fullscreenOpen]);

  useEffect(() => {
    if (!fullscreenOpen || !code.trim()) return;
    setFullscreenSvg(null);
    setFullscreenLoading(true);
    let cancelled = false;
    mermaid.initialize({
      ...getBaseConfig(),
      themeVariables: { fontSize: "24px", fontFamily: "inherit" },
      flowchart: { useMaxWidth: false },
    });
    const diagramId = `mermaid-fs-${id}-${Date.now()}`;
    mermaid
      .render(diagramId, code)
      .then(({ svg }) => {
        if (!cancelled) setFullscreenSvg(svg);
      })
      .catch(() => {
        if (!cancelled) setFullscreenSvg(null);
      })
      .finally(() => {
        if (!cancelled) setFullscreenLoading(false);
      });
    return () => {
      cancelled = true;
      setFullscreenSvg(null);
      mermaid.initialize(getBaseConfig());
    };
  }, [fullscreenOpen, code, theme, id]);

  if (error) {
    return (
      <div className="my-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
        <p className="font-medium">Erro ao renderizar diagrama:</p>
        <p className="mt-1 font-mono text-xs">{error}</p>
        <pre className="mt-2 overflow-x-auto rounded bg-black/10 p-2 text-xs">
          {code}
        </pre>
      </div>
    );
  }

  if (!svgContent) {
    return (
      <div className="my-4 flex min-h-[120px] items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/50">
        <span className="text-sm text-zinc-500 dark:text-zinc-400">Carregando diagrama…</span>
      </div>
    );
  }

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setFullscreenOpen(true)}
        onKeyDown={(e) => e.key === "Enter" && setFullscreenOpen(true)}
        className="my-4 flex cursor-pointer justify-center rounded-lg border border-zinc-200 bg-zinc-50 p-4 transition hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900/50 dark:hover:border-zinc-600 dark:hover:bg-zinc-900"
        aria-label="Abrir diagrama em tela cheia"
      >
        <div
          className="[&_svg]:max-w-full [&_svg]:h-auto [&_svg]:[shape-rendering:geometricPrecision]"
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      </div>

      {fullscreenOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setFullscreenOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Diagrama em tela cheia"
        >
          <button
            type="button"
            onClick={() => setFullscreenOpen(false)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Fechar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
          <div
            className="flex max-h-[90vh] w-[80vw] max-w-[80vw] items-center justify-center overflow-auto rounded-lg bg-white p-6 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            {fullscreenLoading ? (
              <span className="text-zinc-500 dark:text-zinc-400">Carregando…</span>
            ) : fullscreenSvg ? (
              <div
                className="w-full [&_svg]:h-auto [&_svg]:w-full [&_svg]:[shape-rendering:geometricPrecision]"
                dangerouslySetInnerHTML={{ __html: fullscreenSvg }}
              />
            ) : svgContent ? (
              <div
                className="w-full [&_svg]:h-auto [&_svg]:w-full [&_svg]:[shape-rendering:geometricPrecision]"
                dangerouslySetInnerHTML={{ __html: svgContent }}
              />
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}
