import type { RecentDoc } from "../storage";

type Props = {
  recentDocs: RecentDoc[];
  selectedFile: string | null;
  /** Progresso atual em tempo real do doc selecionado (0..1). Sobrescreve o valor da lista quando é o mesmo arquivo. */
  liveProgress?: number;
  onSelectFile: (relativePath: string) => void;
  onRemove: (relativePath: string) => void;
};

function fileName(path: string): string {
  const i = path.lastIndexOf("/");
  return i >= 0 ? path.slice(i + 1) : path;
}

/** Spinner circular com % de leitura (0–100). */
function ReadingProgress({ progress }: { progress: number }) {
  const pct = Math.round(Math.min(1, Math.max(0, progress)) * 100);
  const r = 10;
  const circumference = 2 * Math.PI * r;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="relative flex h-7 w-7 shrink-0 items-center justify-center" title={`${pct}% lido`}>
      <svg className="h-7 w-7 -rotate-90" viewBox="0 0 24 24">
        <circle
          cx="12"
          cy="12"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-zinc-200 dark:text-zinc-600"
        />
        <circle
          cx="12"
          cy="12"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="text-blue-600 dark:text-blue-400 transition-[stroke-dashoffset] duration-200"
        />
      </svg>
      <span className="absolute text-[10px] font-medium text-zinc-600 dark:text-zinc-400">
        {pct}
      </span>
    </div>
  );
}

export function RecentDocs({
  recentDocs,
  selectedFile,
  liveProgress = 0,
  onSelectFile,
  onRemove,
}: Props) {
  if (recentDocs.length === 0) return null;

  return (
    <div className="border-b border-zinc-200 pb-2 dark:border-zinc-700">
      <p className="mb-1.5 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Últimas abertas
      </p>
      <ul className="space-y-0.5">
        {recentDocs.map((doc) => {
          const isSelected = selectedFile === doc.relativePath;
          const progress = isSelected && liveProgress !== undefined ? liveProgress : doc.progress;

          return (
            <li
              key={doc.relativePath}
              className="group flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700"
            >
              <button
                type="button"
                onClick={() => onSelectFile(doc.relativePath)}
                className="min-w-0 flex-1 truncate text-left"
              >
                <span
                  className={
                    isSelected
                      ? "font-medium text-blue-700 dark:text-blue-300"
                      : "text-zinc-700 dark:text-zinc-300"
                  }
                >
                  {fileName(doc.relativePath)}
                </span>
              </button>
              <ReadingProgress progress={progress} />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(doc.relativePath);
                }}
                className="shrink-0 rounded p-0.5 text-zinc-400 opacity-0 hover:bg-zinc-200 hover:text-zinc-700 group-hover:opacity-100 dark:hover:bg-zinc-600 dark:hover:text-zinc-200"
                title="Remover do histórico (recomeçar leitura)"
                aria-label="Remover do histórico"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
