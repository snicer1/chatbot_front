import { h } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import type { Message as MessageType, FeaturesConfig, LabelsConfig } from '../types';
import { Message } from './Message';
import { TypingIndicator } from './TypingIndicator';

interface ChatMessagesProps {
  messages: MessageType[];
  isTyping: boolean;
  isLoading: boolean;
  hasMore: boolean;
  features: Required<FeaturesConfig>;
  labels: Required<LabelsConfig>;
  onLoadMore: () => void;
}

export function ChatMessages({
  messages,
  isTyping,
  isLoading,
  hasMore,
  features,
  labels,
  onLoadMore
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevScrollHeight = useRef(0);

  useEffect(() => {
    if (messagesEndRef.current && !isLoading) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isTyping]);

  const handleScroll = () => {
    if (!containerRef.current || isLoading || !hasMore) return;

    const { scrollTop } = containerRef.current;
    if (scrollTop === 0) {
      prevScrollHeight.current = containerRef.current.scrollHeight;
      onLoadMore();
    }
  };

  useEffect(() => {
    if (containerRef.current && prevScrollHeight.current > 0) {
      const newScrollHeight = containerRef.current.scrollHeight;
      containerRef.current.scrollTop = newScrollHeight - prevScrollHeight.current;
      prevScrollHeight.current = 0;
    }
  }, [messages.length]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div class="chat-messages-empty">
        <div class="chat-messages-empty-icon">💬</div>
        <h3 class="chat-messages-empty-title">{labels.emptyStateTitle}</h3>
        <p class="chat-messages-empty-text">{labels.emptyStateText}</p>
      </div>
    );
  }

  return (
    <div class="chat-messages" ref={containerRef} onScroll={handleScroll}>
      {isLoading && <div class="chat-messages-loading">Loading...</div>}

      {messages.map((message) => (
        <Message key={message.id} message={message} features={features} />
      ))}

      {isTyping && features.typingIndicator && (
        <div class="chat-message chat-message-assistant">
          <div class="chat-message-content">
            <TypingIndicator />
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
