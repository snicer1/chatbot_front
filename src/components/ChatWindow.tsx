import { h } from 'preact';
import type { ChatState, UploadResponse } from '../types';
import type { MergedChatWidgetConfig } from '../config';
import { ChatHeader } from './ChatHeader';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';

interface ChatWindowProps {
  state: ChatState;
  config: MergedChatWidgetConfig;
  uploadState?: {
    files: File[];
    isUploading: boolean;
    progress: number;
  };
  onClose: () => void;
  onSend: (message: string, attachmentIds?: string[]) => void;
  onLoadMore: () => void;
  onFilesSelected?: (files: File[]) => void;
  onRemoveFile?: (index: number) => void;
}

export function ChatWindow({
  state,
  config,
  uploadState,
  onClose,
  onSend,
  onLoadMore,
  onFilesSelected,
  onRemoveFile
}: ChatWindowProps) {
  if (!state.isOpen) return null;

  return (
    <div class={`chat-window chat-window-${config.position}`}>
      <ChatHeader labels={config.labels} onClose={onClose} />

      {state.error && (
        <div class="chat-error">
          <span>{state.error}</span>
        </div>
      )}

      <ChatMessages
        messages={state.messages}
        isTyping={state.isTyping}
        isLoading={state.isLoading}
        hasMore={state.hasMore}
        features={config.features}
        labels={config.labels}
        onLoadMore={onLoadMore}
      />

      <ChatInput
        labels={config.labels}
        onSend={onSend}
        onFilesSelected={onFilesSelected}
        uploadState={uploadState}
        onRemoveFile={onRemoveFile}
        fileUploadEnabled={config.features.fileUpload}
      />
    </div>
  );
}
