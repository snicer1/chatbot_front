import { h } from 'preact';
import { X, Upload } from 'lucide-preact';
import { formatFileSize } from '../utils/formatters';

interface FileUploadProps {
  files: File[];
  isUploading: boolean;
  progress: number;
  onRemove: (index: number) => void;
  onDrop?: (files: File[]) => void;
}

export function FileUpload({ files, isUploading, progress, onRemove, onDrop }: FileUploadProps) {
  if (files.length === 0) return null;

  return (
    <div class="chat-file-upload">
      {files.map((file, index) => (
        <div key={index} class="chat-file-upload-item">
          <div class="chat-file-upload-info">
            <div class="chat-file-upload-name">{file.name}</div>
            <div class="chat-file-upload-size">{formatFileSize(file.size)}</div>
          </div>
          {!isUploading && (
            <button
              class="chat-file-upload-remove"
              onClick={() => onRemove(index)}
              aria-label="Remove file"
            >
              <X size={16} />
            </button>
          )}
        </div>
      ))}
      {isUploading && (
        <div class="chat-file-upload-progress">
          <div class="chat-file-upload-progress-bar" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}
