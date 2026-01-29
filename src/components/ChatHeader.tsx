import { h } from 'preact';
import { X, Minimize2 } from 'lucide-preact';
import type { LabelsConfig } from '../types';

interface ChatHeaderProps {
  labels: Required<LabelsConfig>;
  onClose: () => void;
}

export function ChatHeader({ labels, onClose }: ChatHeaderProps) {
  return (
    <div class="chat-header">
      <div class="chat-header-content">
        <div class="chat-header-avatar">
          <MessageCircle size={20} />
        </div>
        <div class="chat-header-info">
          <h3 class="chat-header-title">{labels.title}</h3>
          <p class="chat-header-subtitle">{labels.subtitle}</p>
        </div>
      </div>
      <button
        class="chat-header-close"
        onClick={onClose}
        aria-label={labels.closeButton}
      >
        <X size={20} />
      </button>
    </div>
  );
}

function MessageCircle({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  );
}
