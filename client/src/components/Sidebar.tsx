import type { TreeNode } from "../api";
import type { RecentDoc } from "../storage";
import { RecentDocs } from "./RecentDocs";

type Props = {
  nodes: TreeNode[];
  expandedPaths: Set<string>;
  onToggleExpand: (relativePath: string) => void;
  onSelectFile: (relativePath: string) => void;
  selectedFile: string | null;
  recentDocs: RecentDoc[];
  readingProgress: number;
  onRemoveRecentDoc: (relativePath: string) => void;
};

function TreeItem({
  node,
  expandedPaths,
  onToggleExpand,
  onSelectFile,
  selectedFile,
  depth = 0,
}: {
  node: TreeNode;
  expandedPaths: Set<string>;
  onToggleExpand: (relativePath: string) => void;
  onSelectFile: (relativePath: string) => void;
  selectedFile: string | null;
  depth?: number;
}) {
  const isExpanded = node.type === "dir" && expandedPaths.has(node.relativePath);
  const isSelected =
    node.type === "file" && selectedFile === node.relativePath;

  if (node.type === "file") {
    return (
      <button
        type="button"
        onClick={() => onSelectFile(node.relativePath)}
        className={`block w-full truncate rounded px-2 py-1.5 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 ${
          isSelected
            ? "bg-blue-100 font-medium text-blue-800 dark:bg-blue-900/50 dark:text-blue-200"
            : "text-zinc-700 dark:text-zinc-300"
        }`}
        style={{ paddingLeft: 8 + depth * 16 }}
      >
        {node.name}
      </button>
    );
  }

  const hasChildren = node.children && node.children.length > 0;
  return (
    <div>
      <button
        type="button"
        onClick={() => hasChildren && onToggleExpand(node.relativePath)}
        className="flex w-full items-center gap-1 truncate rounded px-2 py-1.5 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
        style={{ paddingLeft: 8 + depth * 16 }}
      >
        <span className="shrink-0 w-4 text-zinc-500">
          {isExpanded ? "▼" : "▶"}
        </span>
        {node.name}
      </button>
      {isExpanded && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <TreeItem
              key={child.relativePath}
              node={child}
              expandedPaths={expandedPaths}
              onToggleExpand={onToggleExpand}
              onSelectFile={onSelectFile}
              selectedFile={selectedFile}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar({
  nodes,
  expandedPaths,
  onToggleExpand,
  onSelectFile,
  selectedFile,
  recentDocs,
  readingProgress,
  onRemoveRecentDoc,
}: Props) {
  return (
    <aside className="flex w-64 shrink-0 flex-col overflow-y-auto border-r border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900">
      <div className="p-2">
        {nodes.length === 0 ? (
          <p className="px-2 py-4 text-sm text-zinc-500 dark:text-zinc-400">
            Nenhum arquivo .md/.mdx encontrado.
          </p>
        ) : (
          nodes.map((node) => (
            <TreeItem
              key={node.relativePath}
              node={node}
              expandedPaths={expandedPaths}
              onToggleExpand={onToggleExpand}
              onSelectFile={onSelectFile}
              selectedFile={selectedFile}
            />
          ))
        )}
        {recentDocs.length > 0 && (
          <div className="my-2 border-t border-zinc-200 dark:border-zinc-700" />
        )}
        <RecentDocs
          recentDocs={recentDocs}
          selectedFile={selectedFile}
          liveProgress={readingProgress}
          onSelectFile={onSelectFile}
          onRemove={onRemoveRecentDoc}
        />
      </div>
    </aside>
  );
}
