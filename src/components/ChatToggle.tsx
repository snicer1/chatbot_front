import { h } from 'preact';
import { MessageCircle, X } from 'lucide-preact';

interface ChatToggleProps {
  isOpen: boolean;
  onClick: () => void;
  unreadCount?: number;
}

export function ChatToggle({ isOpen, onClick, unreadCount }: ChatToggleProps) {
  return (
    <button
      class="chat-toggle"
      onClick={onClick}
      aria-label={isOpen ? 'Close chat' : 'Open chat'}
    >
      {isOpen ? (
        <X size={24} />
      ) : (
        <>
          <MessageCircle size={24} />
          {unreadCount && unreadCount > 0 && (
            <span class="chat-toggle-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
          )}
        </>
      )}
    </button>
  );
}
