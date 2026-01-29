import { h } from 'preact';
import type { Message as MessageType, FeaturesConfig } from '../../types';
import { MessageText } from './MessageText';
import { MessageImages } from './MessageImages';
import { MessageFile } from './MessageFile';
import { MessageLink } from './MessageLink';
import { formatTime } from '../../utils/formatters';
import { cn } from '../../utils/cn';

interface MessageProps {
  message: MessageType;
  features: Required<FeaturesConfig>;
}

export function Message({ message, features }: MessageProps) {
  const images = message.attachments?.filter(a => a.type === 'image') || [];
  const files = message.attachments?.filter(a => a.type === 'file') || [];
  const links = message.attachments?.filter(a => a.type === 'link') || [];

  return (
    <div
      class={cn(
        'chat-message',
        `chat-message-${message.role}`,
        message.status === 'error' && 'chat-message-error'
      )}
    >
      <div class="chat-message-content">
        {message.content && (
          <MessageText
            content={message.content}
            enableMarkdown={features.markdown}
            enableCodeHighlight={features.codeHighlight}
          />
        )}

        {images.length > 0 && (
          <MessageImages images={images} enableGallery={features.imageGallery} />
        )}

        {files.map(file => (
          <MessageFile key={file.id} file={file} />
        ))}

        {features.linkPreviews && links.map(link => (
          <MessageLink key={link.id} link={link} />
        ))}

        <div class="chat-message-time">{formatTime(message.createdAt)}</div>
      </div>
    </div>
  );
}
