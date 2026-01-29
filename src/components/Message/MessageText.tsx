import { h } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { renderMarkdown, highlightCode } from '../../utils/markdown';
import { sanitizeHtml } from '../../utils/sanitize';

interface MessageTextProps {
  content: string;
  enableMarkdown: boolean;
  enableCodeHighlight: boolean;
}

export function MessageText({ content, enableMarkdown, enableCodeHighlight }: MessageTextProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (enableCodeHighlight && contentRef.current) {
      highlightCode(contentRef.current);
    }
  }, [content, enableCodeHighlight]);

  if (!enableMarkdown) {
    return <div class="chat-message-text">{content}</div>;
  }

  const html = sanitizeHtml(renderMarkdown(content));

  return (
    <div
      ref={contentRef}
      class="chat-message-text"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
