import { h } from 'preact';
import { useEffect } from 'preact/hooks';
import type { ChatWidgetConfig } from './types';
import { mergeConfig } from './config';
import { useChat } from './hooks/useChat';
import { useUpload } from './hooks/useUpload';
import { useTheme } from './hooks/useTheme';
import { ChatToggle } from './components/ChatToggle';
import { ChatWindow } from './components/ChatWindow';
import './styles/variables.css';
import './styles/base.css';
import './styles/components.css';
import './styles/animations.css';

interface ChatWidgetProps {
  config: ChatWidgetConfig;
}

export function ChatWidget({ config: userConfig }: ChatWidgetProps) {
  const config = mergeConfig(userConfig);
  const { state, actions } = useChat(config);

  const upload = useUpload({
    config: config.upload,
    apiUrl: config.apiUrl,
    auth: config.auth,
    onUploadComplete: (files) => {
      const attachmentIds = files.map(f => f.id);
      actions.send('', attachmentIds);
      upload.actions.clear();
    },
    onError: (error) => config.onError(error)
  });

  useTheme(config.theme, 'chat-widget-root');

  useEffect(() => {
    if (state.isOpen && state.messages.length === 0 && !state.isLoading) {
      actions.loadMessages();
    }
  }, [state.isOpen]);

  const handleSend = (message: string, attachmentIds?: string[]) => {
    if (upload.state.files.length > 0 && !attachmentIds) {
      upload.actions.upload();
    } else {
      actions.send(message, attachmentIds);
    }
  };

  const handleFilesSelected = (files: File[]) => {
    upload.actions.addFiles(files);
  };

  return (
    <div
      class={`chat-widget chat-widget-${config.position}`}
      style={{
        [config.position === 'right' ? 'right' : 'left']: `${config.offsetX}px`,
        bottom: `${config.offsetY}px`
      }}
    >
      <ChatWindow
        state={state}
        config={config}
        uploadState={upload.state}
        onClose={actions.close}
        onSend={handleSend}
        onLoadMore={actions.loadMessages}
        onFilesSelected={handleFilesSelected}
        onRemoveFile={upload.actions.removeFile}
      />
      <ChatToggle isOpen={state.isOpen} onClick={actions.toggle} />
    </div>
  );
}
