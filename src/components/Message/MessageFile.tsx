import { h } from 'preact';
import { Download } from 'lucide-preact';
import type { Attachment } from '../../types';
import { formatFileSize, getFileIcon } from '../../utils/formatters';

interface MessageFileProps {
  file: Attachment;
}

export function MessageFile({ file }: MessageFileProps) {
  return (
    <a
      href={file.url}
      target="_blank"
      rel="noopener noreferrer"
      class="chat-message-file"
      download={file.filename}
    >
      <div class="chat-file-icon">
        {getFileIcon(file.mimeType || '')}
      </div>
      <div class="chat-file-info">
        <div class="chat-file-name">{file.filename || 'File'}</div>
        {file.size && (
          <div class="chat-file-size">{formatFileSize(file.size)}</div>
        )}
      </div>
      <div class="chat-file-download">
        <Download size={16} />
      </div>
    </a>
  );
}
