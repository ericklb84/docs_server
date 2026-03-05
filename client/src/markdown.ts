import type MarkdownIt from "markdown-it";
import MarkdownItConstructor from "markdown-it";
import anchor from "markdown-it-anchor";
import toc from "markdown-it-table-of-contents";
import taskLists from "markdown-it-task-lists";
import hljs from "highlight.js";

function highlightImpl(str: string, lang: string, md: MarkdownIt): string {
  if (lang && hljs.getLanguage(lang)) {
    try {
      return (
        '<pre class="hljs"><code class="language-' +
        md.utils.escapeHtml(lang) +
        '">' +
        hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
        "</code></pre>"
      );
    } catch {
      /* ignore */
    }
  }
  return (
    '<pre class="hljs"><code>' +
    md.utils.escapeHtml(str) +
    "</code></pre>"
  );
}

let md: MarkdownIt;
const opts = {
  html: true,
  linkify: true,
  typographer: true,
  highlight(str: string, lang: string): string {
    return highlightImpl(str, lang, md);
  },
};
md = new MarkdownItConstructor(opts);

md.use(anchor, {
  level: [2, 3, 4],
  // sem permalink: títulos ganham só id (para âncoras), não viram link
});

md.use(taskLists, { enabled: true, label: true });

md.use(toc, {
  includeLevel: [2, 3, 4],
  containerClass: "markdown-toc",
  listType: "ul",
});

const defaultFence = md.renderer.rules.fence!;

/** Remove aspas que envolvem o conteúdo de código inline (path/código), para não aparecer na caixa com background */
function stripWrappingQuotesFromCodeContent(content: string): string {
  const trimmed = content.trim();
  if (/^'([^']*[\/\\.\\][^']*)'$/.test(trimmed)) return trimmed.slice(1, -1);
  if (/^\u2018([^\u2018\u2019]*[\/\\.\\][^\u2018\u2019]*)\u2019$/.test(trimmed)) {
    return trimmed.replace(/^\u2018|\u2019$/g, "");
  }
  return content;
}

const HEX_COLOR_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let h = hex.slice(1);
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return { r, g, b };
}

/** Retorna true se a cor for clara (luminância alta), indicando que o texto deve ser escuro para contraste */
function isLightColor(r: number, g: number, b: number): boolean {
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

function isHexColor(content: string): boolean {
  return HEX_COLOR_REGEX.test(content.trim());
}

/** Se o código inline for uma cor hex, renderiza com background na cor e texto com contraste */
function renderInlineCodeWithHex(tokenContent: string): string | null {
  const content = tokenContent.trim();
  if (!isHexColor(content)) return null;
  const rgb = hexToRgb(content);
  const textColor = isLightColor(rgb.r, rgb.g, rgb.b) ? "#111827" : "#f9fafb";
  return (
    '<span class="prose-hex-swatch" style="background:' +
    content +
    ";color:" +
    textColor +
    '">' +
    md.utils.escapeHtml(content) +
    "</span>"
  );
}

/** Normaliza aspas para backticks de código inline, para só a box aparecer (sem aspas no texto) */
function normalizeInlineCodeMarkers(source: string): string {
  // Aspas curvas Unicode '...' → `...`
  let out = source.replace(/\u2018([^\u2018\u2019]*)\u2019/g, "`$1`");
  // Aspas retas '...' quando o conteúdo parece path/código (tem / ou . ou \) → `...` (evita "don't")
  out = out.replace(/'([^']*[\/\\.][^']*)'/g, "`$1`");
  // Já entre backticks mas com aspas dentro: `'/p'` → `/p` (evita aspa aparecer no pseudo-elemento)
  out = out.replace(/`'([^']*[\/\\.\\][^']*)'`/g, "`$1`");
  // Qualquer par de backticks ou ʻ (U+02BB) → backtick ASCII, para o parser reconhecer
  out = out.replace(/[\u0060\u02BB]([^\u0060\u02BB]*)[\u0060\u02BB]/g, "`$1`");
  return out;
}

md.renderer.rules.code_inline = (tokens, idx, _options, _env, _self) => {
  const token = tokens[idx] as { content: string };
  const content = stripWrappingQuotesFromCodeContent(token.content);
  const hexSwatch = renderInlineCodeWithHex(content);
  if (hexSwatch) return hexSwatch;
  return "<code>" + md.utils.escapeHtml(content) + "</code>";
};

md.renderer.rules.fence = ((tokens: unknown[], idx: number, options: unknown, env: unknown, self: unknown) => {
  const token = tokens[idx] as { info?: string; content: string };
  const info = (token.info || "").trim();
  const lang = info ? info.split(/\s+/)[0] : "";
  const code = token.content;

  if (lang === "mermaid" || lang === "flowchart") {
    const base64 = btoa(unescape(encodeURIComponent(code)));
    return `<div data-mermaid data-code="${md.utils.escapeHtml(base64)}"></div>\n`;
  }

  return (defaultFence as (...args: unknown[]) => string)(tokens, idx, options, env, self);
}) as typeof defaultFence;

export function renderMarkdown(content: string): string {
  return md.render(normalizeInlineCodeMarkers(content));
}
