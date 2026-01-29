import { h } from 'preact';

export function TypingIndicator() {
  return (
    <div class="chat-typing-indicator">
      <span class="chat-typing-dot"></span>
      <span class="chat-typing-dot"></span>
      <span class="chat-typing-dot"></span>
    </div>
  );
}
