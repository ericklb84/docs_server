import path from "node:path";
import fs from "node:fs";

export interface TreeNode {
  type: "dir" | "file";
  name: string;
  relativePath: string;
  children?: TreeNode[];
}

const MD_EXT = [".md", ".mdx"];

function isMarkdown(name: string): boolean {
  const ext = path.extname(name).toLowerCase();
  return MD_EXT.includes(ext);
}

function hasMarkdownRecursive(dirPath: string): boolean {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const e of entries) {
    if (e.isDirectory()) {
      if (hasMarkdownRecursive(path.join(dirPath, e.name))) return true;
    } else if (e.isFile() && isMarkdown(e.name)) {
      return true;
    }
  }
  return false;
}

function buildTree(
  rootPath: string,
  currentPath: string,
  relativePrefix: string
): TreeNode[] {
  const nodes: TreeNode[] = [];
  const entries = fs.readdirSync(currentPath, { withFileTypes: true });

  const dirs = entries.filter((e) => e.isDirectory()).sort();
  const files = entries.filter((e) => e.isFile() && isMarkdown(e.name)).sort();

  for (const d of dirs) {
    const fullDir = path.join(currentPath, d.name);
    if (!hasMarkdownRecursive(fullDir)) continue;
    const relPath = relativePrefix ? `${relativePrefix}/${d.name}` : d.name;
    nodes.push({
      type: "dir",
      name: d.name,
      relativePath: relPath,
      children: buildTree(rootPath, fullDir, relPath),
    });
  }

  for (const f of files) {
    const relPath = relativePrefix ? `${relativePrefix}/${f.name}` : f.name;
    nodes.push({
      type: "file",
      name: f.name,
      relativePath: relPath,
    });
  }

  return nodes;
}

export function getMarkdownTree(rootPath: string): TreeNode[] {
  const normalizedRoot = path.resolve(rootPath);
  if (!fs.existsSync(normalizedRoot) || !fs.statSync(normalizedRoot).isDirectory()) {
    return [];
  }
  return buildTree(normalizedRoot, normalizedRoot, "");
}

export function resolveSafe(rootPath: string, relativePath: string): string | null {
  const root = path.resolve(rootPath);
  const joined = path.join(root, relativePath);
  const resolved = path.resolve(joined);
  if (!resolved.startsWith(root)) return null;
  return resolved;
}

export function readFileUtf8(filePath: string): string {
  return fs.readFileSync(filePath, "utf-8");
}

export function toSlash(p: string): string {
  return p.split(path.sep).join("/");
}
