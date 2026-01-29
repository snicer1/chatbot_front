import { h, render } from 'preact';
import { ChatWidget } from './ChatWidget';
import type { ChatWidgetConfig } from './types';

export type { ChatWidgetConfig, Message, Attachment, ThemeConfig } from './types';
export { ChatWidget as ChatWidgetComponent } from './ChatWidget';

let widgetInstance: Element | null = null;

export const ChatWidgetAPI = {
  init(config: ChatWidgetConfig): void {
    if (widgetInstance) {
      console.warn('ChatWidget already initialized');
      return;
    }
    const container = document.createElement('div');
    container.id = 'chat-widget-root';
    document.body.appendChild(container);
    render(h(ChatWidget, { config }), container);
    widgetInstance = container;
  },

  destroy(): void {
    if (widgetInstance) {
      render(null, widgetInstance);
      widgetInstance.remove();
      widgetInstance = null;
    }
  }
};

if (typeof window !== 'undefined') {
  (window as any).ChatWidget = ChatWidgetAPI;
}

export default ChatWidgetAPI;
