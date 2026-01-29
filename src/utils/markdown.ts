import MarkdownIt from 'markdown-it';

let shikiHighlighter: any = null;

const md: MarkdownIt = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  breaks: true,
  highlight: (code: string, lang: string): string => {
    const escaper = new MarkdownIt();
    return `<pre class="chat-code-block" data-lang="${lang}"><code>${escaper.utils.escapeHtml(code)}</code></pre>`;
  }
});

// Note: markdown-it plugins (emoji, task-lists, footnote) disabled due to ES module compatibility issues
// Core markdown functionality (bold, italic, links, code blocks, etc.) still works

const defaultRender = md.renderer.rules.link_open || function(tokens: any, idx: any, options: any, env: any, self: any) {
  return self.renderToken(tokens, idx, options);
};

md.renderer.rules.link_open = function(tokens: any, idx: any, options: any, env: any, self: any) {
  tokens[idx].attrSet('target', '_blank');
  tokens[idx].attrSet('rel', 'noopener noreferrer');
  return defaultRender(tokens, idx, options, env, self);
};

export function renderMarkdown(content: string): string {
  return md.render(content);
}

export async function highlightCode(element: HTMLElement): Promise<void> {
  if (!shikiHighlighter) {
    const { createHighlighter } = await import('shiki');
    shikiHighlighter = await createHighlighter({
      themes: ['github-dark', 'github-light'],
      langs: ['javascript', 'typescript', 'python', 'json', 'html', 'css', 'bash', 'sql']
    });
  }

  const codeBlocks = element.querySelectorAll('pre.chat-code-block');

  for (const block of codeBlocks) {
    const code = block.textContent || '';
    const lang = block.getAttribute('data-lang') || 'text';

    try {
      const html = shikiHighlighter.codeToHtml(code, { lang, theme: 'github-dark' });
      block.outerHTML = html;
    } catch (e) {}
  }
}
