/// <reference types="vite/client" />

declare module "markdown-it-table-of-contents" {
  import type { PluginWithOptions } from "markdown-it";
  const toc: PluginWithOptions<Record<string, unknown>>;
  export default toc;
}

declare module "markdown-it-task-lists" {
  import type MarkdownIt from "markdown-it";
  function taskLists(md: MarkdownIt, options?: { enabled?: boolean; label?: boolean; labelAfter?: boolean }): void;
  export default taskLists;
}
