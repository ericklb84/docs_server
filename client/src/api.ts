export interface TreeNode {
  type: "dir" | "file";
  name: string;
  relativePath: string;
  children?: TreeNode[];
}

export async function fetchTree(rootPath: string): Promise<TreeNode[]> {
  const res = await fetch("/api/tree", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rootPath }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  const { tree } = await res.json();
  return tree;
}

export async function fetchFile(
  rootPath: string,
  relativePath: string
): Promise<{ content: string; relativePath: string }> {
  const res = await fetch("/api/file", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rootPath, relativePath }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export type ServerInfo = {
  host: string;
  port: number;
  serverUrl: string;
  /** IP da rede local (quando host é localhost), para acesso de outros dispositivos. */
  networkHost?: string | null;
};

export async function fetchServerInfo(): Promise<ServerInfo> {
  const res = await fetch("/api/server-info");
  if (!res.ok) throw new Error("Falha ao obter URL do servidor");
  return res.json();
}
