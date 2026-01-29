import { useState, useCallback, useEffect } from 'preact/hooks';
import type { ChatState, Message } from '../types';
import type { MergedChatWidgetConfig } from '../config';
import { sendMessage, getMessages, initApi } from './useApi';

const initialState: ChatState = {
  isOpen: false,
  messages: [],
  isLoading: false,
  isTyping: false,
  error: null,
  hasMore: true,
  nextCursor: undefined
};

export function useChat(config: MergedChatWidgetConfig) {
  const [state, setState] = useState<ChatState>({
    ...initialState,
    isOpen: config.startOpen
  });

  useEffect(() => {
    initApi(config.apiUrl, config.auth);
    config.onReady();
  }, []);

  const toggle = useCallback(() => {
    setState(prev => {
      const newIsOpen = !prev.isOpen;
      newIsOpen ? config.onOpen() : config.onClose();
      return { ...prev, isOpen: newIsOpen };
    });
  }, [config]);

  const open = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: true }));
    config.onOpen();
  }, [config]);

  const close = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
    config.onClose();
  }, [config]);

  const loadMessages = useCallback(async () => {
    if (state.isLoading || !state.hasMore) return;
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await getMessages(state.nextCursor);
      setState(prev => ({
        ...prev,
        messages: [...response.messages.reverse(), ...prev.messages],
        hasMore: response.hasMore,
        nextCursor: response.nextCursor,
        isLoading: false
      }));
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false, error: 'Failed to load messages' }));
      config.onError(error as Error);
    }
  }, [state.isLoading, state.hasMore, state.nextCursor, config]);

  const send = useCallback(async (content: string, attachmentIds?: string[]) => {
    const tempId = `temp-${Date.now()}`;
    const tempMessage: Message = {
      id: tempId,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
      status: 'sending'
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, tempMessage],
      isTyping: true
    }));

    try {
      const response = await sendMessage({ content, attachments: attachmentIds });
      setState(prev => {
        let newMessages = prev.messages
          .filter(m => m.id !== tempId)
          .concat([{ ...response.message, status: 'sent' as const }]);

        // Add bot response if present
        if (response.response) {
          newMessages = newMessages.concat([response.response]);
        }

        return {
          ...prev,
          messages: newMessages,
          isTyping: false
        };
      });
      config.onMessageSent(response.message);
    } catch (error) {
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(m => m.id === tempId ? { ...m, status: 'error' } : m),
        isTyping: false,
        error: 'Failed to send message'
      }));
      config.onError(error as Error);
    }
  }, [config]);

  const clearError = useCallback(() => setState(prev => ({ ...prev, error: null })), []);
  const setTyping = useCallback((isTyping: boolean) => setState(prev => ({ ...prev, isTyping })), []);
  const addMessage = useCallback((message: Message) => {
    setState(prev => ({ ...prev, messages: [...prev.messages, message] }));
    config.onMessageReceived(message);
  }, [config]);

  return {
    state,
    actions: { toggle, open, close, loadMessages, send, clearError, setTyping, addMessage }
  };
}
