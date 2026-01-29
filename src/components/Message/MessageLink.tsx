import { h } from 'preact';
import { ExternalLink } from 'lucide-preact';
import type { Attachment } from '../../types';
import { extractDomain } from '../../utils/formatters';

interface MessageLinkProps {
  link: Attachment;
}

export function MessageLink({ link }: MessageLinkProps) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      class="chat-message-link"
    >
      {link.thumbnailUrl && (
        <div class="chat-link-image">
          <img src={link.thumbnailUrl} alt={link.title || ''} loading="lazy" />
        </div>
      )}
      <div class="chat-link-content">
        <div class="chat-link-title">{link.title || link.url}</div>
        {link.description && (
          <div class="chat-link-description">{link.description}</div>
        )}
        <div class="chat-link-domain">
          <ExternalLink size={12} />
          <span>{link.domain || extractDomain(link.url)}</span>
        </div>
      </div>
    </a>
  );
}
