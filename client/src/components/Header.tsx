import { useState, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import type { Theme } from "../storage";
import type { ServerInfo } from "../api";

type Props = {
  theme: Theme;
  onToggleTheme: () => void;
  onOpenPathModal: () => void;
  onOpenSearch: () => void;
  serverInfo: ServerInfo | null;
  rootPath: string | null;
};

/** URL base do app: usa networkHost quando disponível (acesso por outros dispositivos); senão host da requisição. Porta em dev 5173, em prod a do servidor. */
function getAppBaseUrl(info: ServerInfo | null): string {
  if (!info) return "";
  const host = info.networkHost || info.host;
  const port = import.meta.env.DEV ? 5173 : info.port;
  return `http://${host}:${port}`;
}

/** URL assinada com diretório selecionado (query dir-path). */
export function buildSignedUrl(serverInfo: ServerInfo | null, rootPath: string | null): string {
  const base = getAppBaseUrl(serverInfo);
  if (!base) return "";
  if (!rootPath) return base;
  return `${base}/?dir-path=${encodeURIComponent(rootPath)}`;
}

export function Header({ theme, onToggleTheme, onOpenPathModal, onOpenSearch, serverInfo, rootPath }: Props) {
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const signedUrl = buildSignedUrl(serverInfo, rootPath);
  const displayUrl = serverInfo ? getAppBaseUrl(serverInfo) : "";

  const handleCopy = useCallback(() => {
    if (!signedUrl) return;
    navigator.clipboard.writeText(signedUrl).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => {}
    );
  }, [signedUrl]);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4 dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          onClick={onOpenPathModal}
          className="shrink-0 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors"
        >
          Trocar pasta
        </button>
        <button
          onClick={onOpenSearch}
          className="shrink-0 flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors"
          title="Pesquisar arquivos (⌘K)"
        >
          <svg className="h-4 w-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="hidden sm:inline">Pesquisar</span>
          <kbd className="hidden sm:inline rounded bg-zinc-100 dark:bg-zinc-700 px-1.5 py-0.5 text-xs font-mono">⌘K</kbd>
        </button>
        {displayUrl && (
          <div className="flex flex-1 items-center justify-center min-w-0">
            <div className="flex items-center gap-2 rounded-xl bg-zinc-100/80 dark:bg-zinc-800/80 px-3 py-2 ring-1 ring-zinc-200/60 dark:ring-zinc-600/40">
              <span
                className="text-sm text-zinc-600 dark:text-zinc-300 truncate max-w-[180px] sm:max-w-[260px] font-medium"
                title={displayUrl}
              >
                {displayUrl}
              </span>
              <span className="text-zinc-400 dark:text-zinc-500">·</span>
              <button
                type="button"
                onClick={handleCopy}
                disabled={!signedUrl}
                className="shrink-0 rounded-lg px-2.5 py-1.5 text-sm font-medium text-zinc-700 hover:bg-white hover:shadow-sm disabled:opacity-50 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-all"
                title="Copiar URL com pasta selecionada"
              >
                {copied ? "✓ Copiado" : "Copiar"}
              </button>
              <button
                type="button"
                onClick={() => setQrOpen(true)}
                disabled={!signedUrl}
                className="shrink-0 rounded-lg p-1.5 text-zinc-600 hover:bg-white hover:shadow-sm disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-zinc-700 transition-all"
                title="Gerar QR Code"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
      <button
        onClick={onToggleTheme}
        className="shrink-0 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors"
        title={theme === "dark" ? "Modo claro" : "Modo escuro"}
      >
        {theme === "dark" ? "☀️ Claro" : "🌙 Escuro"}
      </button>

      {qrOpen && signedUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 dark:bg-black/70 backdrop-blur-sm"
          onClick={() => setQrOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="QR Code para acessar"
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl ring-1 ring-zinc-200/80 dark:bg-zinc-800 dark:ring-zinc-600/50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Acesse pelo celular
              </h3>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Escaneie o QR Code para abrir com a pasta selecionada
              </p>
            </div>
            <div className="mt-6 flex justify-center rounded-xl bg-white p-5 ring-1 ring-zinc-200/80 dark:bg-zinc-900/80 dark:ring-zinc-600/50">
              <QRCodeSVG value={signedUrl} size={220} level="M" className="rounded-lg" />
            </div>
            <div className="mt-4 rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-900/60">
              <p className="truncate text-center text-xs text-zinc-500 dark:text-zinc-400" title={signedUrl}>
                {signedUrl}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setQrOpen(false)}
              className="mt-6 w-full rounded-xl bg-zinc-900 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
