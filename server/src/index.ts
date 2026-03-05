import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import os from "node:os";
import {
  getMarkdownTree,
  resolveSafe,
  readFileUtf8,
  toSlash,
  type TreeNode,
} from "./path-utils.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = 4000;
const app = express();

/** Primeiro IPv4 não-interno (rede local), ou null. */
function getNetworkHost(): string | null {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    const list = ifaces[name];
    if (!list) continue;
    for (const iface of list) {
      if (iface.family === "IPv4" && !iface.internal) return iface.address;
    }
  }
  return null;
}

app.use(cors());
app.use(express.json());

/** URL dinâmica: host da requisição; se for localhost, inclui IP da rede para acesso de outros dispositivos. */
app.get("/api/server-info", (req, res) => {
  const host = req.hostname || "localhost";
  const isLocalhost = host === "localhost" || host === "127.0.0.1";
  const networkHost = isLocalhost ? getNetworkHost() : null;
  res.json({
    host,
    port: PORT,
    serverUrl: `http://${host}:${PORT}`,
    ...(networkHost && { networkHost }),
  });
});

app.post("/api/tree", (req, res) => {
  const { rootPath } = req.body as { rootPath?: string };
  if (typeof rootPath !== "string" || !rootPath.trim()) {
    return res.status(400).json({ error: "rootPath is required" });
  }

  const normalizedRoot = path.resolve(rootPath.trim());
  if (!fs.existsSync(normalizedRoot)) {
    return res.status(404).json({ error: "Directory not found" });
  }
  if (!fs.statSync(normalizedRoot).isDirectory()) {
    return res.status(400).json({ error: "rootPath must be a directory" });
  }

  const tree = getMarkdownTree(normalizedRoot);
  res.json({ tree });
});

app.post("/api/file", (req, res) => {
  const { rootPath, relativePath } = req.body as {
    rootPath?: string;
    relativePath?: string;
  };
  if (typeof rootPath !== "string" || !rootPath.trim()) {
    return res.status(400).json({ error: "rootPath is required" });
  }
  if (typeof relativePath !== "string" || !relativePath.trim()) {
    return res.status(400).json({ error: "relativePath is required" });
  }

  const normalized = relativePath.replace(/\\/g, "/").replace(/\/+/g, "/");
  const resolved = resolveSafe(rootPath.trim(), normalized);
  if (!resolved) {
    return res.status(403).json({ error: "Path traversal not allowed" });
  }
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
    return res.status(404).json({ error: "File not found" });
  }

  const ext = path.extname(resolved).toLowerCase();
  if (ext !== ".md" && ext !== ".mdx") {
    return res.status(400).json({ error: "Only .md and .mdx files are allowed" });
  }

  try {
    const content = readFileUtf8(resolved);
    const relativePathSlash = toSlash(
      path.relative(path.resolve(rootPath.trim()), resolved)
    );
    res.json({ content, relativePath: relativePathSlash });
  } catch (err) {
    res.status(500).json({ error: "Failed to read file" });
  }
});

if (process.env.NODE_ENV === "production") {
  // Em produção: servir front da pasta ./static (quando rodando de ./build)
  const clientDir = path.join(__dirname, "static");
  app.use(express.static(clientDir));
  // SPA: qualquer GET que não for arquivo estático cai no index.html; /api não existe aqui (já tratado acima)
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api")) {
      return res.status(404).json({ error: "Not found" });
    }
    res.sendFile(path.join(clientDir, "index.html"));
  });
}

const networkHost = getNetworkHost();

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API running at http://localhost:${PORT}`);
  if (networkHost) {
    console.log(`  Rede:  http://${networkHost}:${PORT} (acesso de outros dispositivos)`);
  }
});
