const MD_ROOT_PATH_KEY = "md_root_path";
const THEME_KEY = "theme";
const RECENT_DOCS_KEY = "md_recent_docs";

export function getStoredRootPath(): string | null {
  return localStorage.getItem(MD_ROOT_PATH_KEY);
}

export function setStoredRootPath(path: string): void {
  localStorage.setItem(MD_ROOT_PATH_KEY, path);
}

export type Theme = "dark" | "light";

export function getStoredTheme(): Theme {
  const t = localStorage.getItem(THEME_KEY);
  return t === "dark" || t === "light" ? t : "light";
}

export function setStoredTheme(theme: Theme): void {
  localStorage.setItem(THEME_KEY, theme);
}

export function applyTheme(theme: Theme): void {
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

// --- Últimas docs abertas (por rootPath) ---

export type RecentDoc = {
  relativePath: string;
  progress: number; // 0..1
  lastOpened: number;
};

const MAX_RECENT = 20;

function getStoredRecentDocsRaw(): Record<string, RecentDoc[]> {
  try {
    const raw = localStorage.getItem(RECENT_DOCS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, RecentDoc[]>;
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function setStoredRecentDocsRaw(data: Record<string, RecentDoc[]>): void {
  localStorage.setItem(RECENT_DOCS_KEY, JSON.stringify(data));
}

export function getRecentDocs(rootPath: string | null): RecentDoc[] {
  if (!rootPath) return [];
  const data = getStoredRecentDocsRaw();
  const list = data[rootPath];
  if (!Array.isArray(list)) return [];
  return list
    .slice()
    .sort((a, b) => b.lastOpened - a.lastOpened)
    .slice(0, MAX_RECENT);
}

export function addOrUpdateRecentDoc(
  rootPath: string,
  relativePath: string,
  progress: number
): void {
  const data = getStoredRecentDocsRaw();
  let list = Array.isArray(data[rootPath]) ? data[rootPath].slice() : [];
  const existing = list.find((d) => d.relativePath === relativePath);
  const now = Date.now();
  if (existing) {
    existing.progress = Math.max(existing.progress, progress);
    existing.lastOpened = now;
    list = list.filter((d) => d.relativePath !== relativePath);
    list.unshift(existing);
  } else {
    list = [{ relativePath, progress, lastOpened: now }, ...list];
  }
  list = list.slice(0, MAX_RECENT);
  setStoredRecentDocsRaw({ ...data, [rootPath]: list });
}

export function removeRecentDoc(rootPath: string, relativePath: string): void {
  const data = getStoredRecentDocsRaw();
  const list = Array.isArray(data[rootPath])
    ? data[rootPath].filter((d) => d.relativePath !== relativePath)
    : [];
  setStoredRecentDocsRaw({ ...data, [rootPath]: list });
}
