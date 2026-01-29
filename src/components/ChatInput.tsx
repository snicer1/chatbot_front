import { h } from 'preact';
import { useState, useRef } from 'preact/hooks';
import { Send, Paperclip } from 'lucide-preact';
import type { LabelsConfig, UploadResponse } from '../types';
import { FileUpload } from './FileUpload';

interface ChatInputProps {
  labels: Required<LabelsConfig>;
  onSend: (message: string, attachmentIds?: string[]) => void;
  onFilesSelected?: (files: File[]) => void;
  uploadState?: {
    files: File[];
    isUploading: boolean;
    progress: number;
  };
  onRemoveFile?: (index: number) => void;
  fileUploadEnabled: boolean;
}

export function ChatInput({
  labels,
  onSend,
  onFilesSelected,
  uploadState,
  onRemoveFile,
  fileUploadEnabled
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (message.trim() || uploadState?.files.length) {
      onSend(message.trim());
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInput = (e: Event) => {
    const target = e.target as HTMLTextAreaElement;
    setMessage(target.value);

    target.style.height = 'auto';
    target.style.height = Math.min(target.scrollHeight, 120) + 'px';
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files.length > 0 && onFilesSelected) {
      onFilesSelected(Array.from(target.files));
      target.value = '';
    }
  };

  return (
    <div class="chat-input-container">
      {uploadState && uploadState.files.length > 0 && (
        <FileUpload
          files={uploadState.files}
          isUploading={uploadState.isUploading}
          progress={uploadState.progress}
          onRemove={onRemoveFile!}
        />
      )}
      <form class="chat-input" onSubmit={handleSubmit}>
        {fileUploadEnabled && (
          <>
            <button
              type="button"
              class="chat-input-attach"
              onClick={handleFileSelect}
              aria-label={labels.uploadButton}
              disabled={uploadState?.isUploading}
            >
              <Paperclip size={20} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </>
        )}
        <textarea
          ref={textareaRef}
          class="chat-input-textarea"
          placeholder={labels.placeholder}
          value={message}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={uploadState?.isUploading}
        />
        <button
          type="submit"
          class="chat-input-send"
          disabled={(!message.trim() && !uploadState?.files.length) || uploadState?.isUploading}
          aria-label={labels.sendButton}
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}
