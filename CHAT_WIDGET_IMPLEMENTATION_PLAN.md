# Chat Widget - Plan Implementacji dla Claude Code

## Przegląd projektu

Budujemy uniwersalny, embedowalny chat widget z obsługą markdown, galerii obrazów, uploadu plików i pełną customizacją przez JS config.

**Tech Stack:** Preact + Vite + TypeScript + markdown-it + GLightbox + Uppy + ky + Motion One

**Docelowy rozmiar:** ~54KB gzipped

---

## FAZA 1: Scaffolding projektu

### Zadanie 1.1: Inicjalizacja projektu

```bash
mkdir chat-widget && cd chat-widget
npm init -y
```

Zainstaluj zależności:

```bash
# Core
npm install preact markdown-it glightbox @uppy/core @uppy/drag-drop @uppy/xhr-upload ky motion dompurify lucide-preact

# Markdown plugins
npm install markdown-it-emoji markdown-it-task-lists markdown-it-footnote

# Syntax highlighting (lazy loaded)
npm install shiki

# Dev
npm install -D vite @preact/preset-vite typescript vite-plugin-dts vite-plugin-css-injected-by-js
```

### Zadanie 1.2: Konfiguracja TypeScript - utwórz `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "react-jsx",
    "jsxImportSource": "preact",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationDir": "./dist/types",
    "outDir": "./dist",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Zadanie 1.3: Konfiguracja Vite - utwórz `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import dts from 'vite-plugin-dts';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    preact(),
    dts({ insertTypesEntry: true }),
    cssInjectedByJsPlugin()
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      'react': 'preact/compat',
      'react-dom': 'preact/compat'
    }
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ChatWidget',
      formats: ['es', 'umd'],
      fileName: (format) => `chat-widget.${format}.js`
    },
    rollupOptions: {
      output: {
        assetFileNames: 'chat-widget.[ext]'
      }
    },
    minify: 'terser',
    sourcemap: true
  }
});
```

### Zadanie 1.4: Package.json - dodaj scripts

```json
{
  "name": "chat-widget",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/chat-widget.umd.js",
  "module": "./dist/chat-widget.es.js",
  "types": "./dist/types/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/chat-widget.es.js",
      "require": "./dist/chat-widget.umd.js",
      "types": "./dist/types/index.d.ts"
    }
  },
  "files": ["dist"],
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "mock-api": "node mock-api/server.js"
  }
}
```

---

## FAZA 2: Struktura plików

### Zadanie 2.1: Utwórz strukturę katalogów

```
src/
├── index.ts
├── ChatWidget.tsx
├── types.ts
├── config.ts
├── components/
│   ├── ChatToggle.tsx
│   ├── ChatWindow.tsx
│   ├── ChatHeader.tsx
│   ├── ChatMessages.tsx
│   ├── ChatInput.tsx
│   ├── Message/
│   │   ├── index.tsx
│   │   ├── MessageText.tsx
│   │   ├── MessageImages.tsx
│   │   ├── MessageFile.tsx
│   │   └── MessageLink.tsx
│   ├── Lightbox.tsx
│   ├── TypingIndicator.tsx
│   └── FileUpload.tsx
├── hooks/
│   ├── useChat.ts
│   ├── useApi.ts
│   ├── useUpload.ts
│   └── useTheme.ts
├── utils/
│   ├── markdown.ts
│   ├── sanitize.ts
│   ├── formatters.ts
│   └── cn.ts
└── styles/
    ├── variables.css
    ├── base.css
    ├── components.css
    └── animations.css
```

---

## FAZA 3: Typy i konfiguracja

### Zadanie 3.1: Utwórz `src/types.ts`

```typescript
// === MESSAGE TYPES ===
export type MessageRole = 'user' | 'assistant' | 'system';
export type AttachmentType = 'image' | 'file' | 'link';

export interface Attachment {
  id: string;
  type: AttachmentType;
  url: string;
  filename?: string;
  mimeType?: string;
  size?: number;
  thumbnailUrl?: string;
  title?: string;
  description?: string;
  domain?: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  attachments?: Attachment[];
  createdAt: string;
  status?: 'sending' | 'sent' | 'error';
}

// === CONFIG TYPES ===
export interface ThemeConfig {
  mode?: 'light' | 'dark' | 'auto';
  primary?: string;
  primaryHover?: string;
  background?: string;
  backgroundSecondary?: string;
  text?: string;
  textSecondary?: string;
  border?: string;
  fontFamily?: string;
  fontFamilyMono?: string;
  fontSize?: number;
  borderRadius?: number;
  cssVariables?: Record<string, string>;
}

export interface FeaturesConfig {
  markdown?: boolean;
  codeHighlight?: boolean;
  imageGallery?: boolean;
  fileUpload?: boolean;
  linkPreviews?: boolean;
  typingIndicator?: boolean;
  soundNotifications?: boolean;
}

export interface UploadConfig {
  maxFileSize?: number;
  maxFiles?: number;
  allowedTypes?: string[];
  endpoint?: string;
}

export interface LabelsConfig {
  title?: string;
  subtitle?: string;
  placeholder?: string;
  sendButton?: string;
  uploadButton?: string;
  closeButton?: string;
  typingText?: string;
  errorText?: string;
  retryText?: string;
  emptyStateTitle?: string;
  emptyStateText?: string;
}

export interface AuthConfig {
  token?: string | (() => string | Promise<string>);
  headerName?: string;
}

export interface ChatWidgetConfig {
  apiUrl: string;
  position?: 'left' | 'right';
  offsetX?: number;
  offsetY?: number;
  theme?: ThemeConfig;
  features?: FeaturesConfig;
  labels?: LabelsConfig;
  upload?: UploadConfig;
  auth?: AuthConfig;
  startOpen?: boolean;
  persistState?: boolean;
  onReady?: () => void;
  onOpen?: () => void;
  onClose?: () => void;
  onMessageSent?: (message: Message) => void;
  onMessageReceived?: (message: Message) => void;
  onError?: (error: Error) => void;
}

// === API TYPES ===
export interface SendMessageRequest {
  content: string;
  attachments?: string[];
}

export interface SendMessageResponse {
  message: Message;
}

export interface GetMessagesResponse {
  messages: Message[];
  hasMore: boolean;
  nextCursor?: string;
}

export interface UploadResponse {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  thumbnailUrl?: string;
}

export interface LinkPreviewResponse {
  url: string;
  title: string;
  description: string;
  image?: string;
  domain: string;
}

export interface ChatState {
  isOpen: boolean;
  messages: Message[];
  isLoading: boolean;
  isTyping: boolean;
  error: string | null;
  hasMore: boolean;
  nextCursor?: string;
}
```

### Zadanie 3.2: Utwórz `src/config.ts`

```typescript
import type { ChatWidgetConfig, ThemeConfig, FeaturesConfig, LabelsConfig, UploadConfig } from './types';

export const DEFAULT_THEME: Required<ThemeConfig> = {
  mode: 'light',
  primary: '#6366f1',
  primaryHover: '#4f46e5',
  background: '#ffffff',
  backgroundSecondary: '#f8fafc',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  fontFamilyMono: "'JetBrains Mono', monospace",
  fontSize: 14,
  borderRadius: 16,
  cssVariables: {}
};

export const DEFAULT_FEATURES: Required<FeaturesConfig> = {
  markdown: true,
  codeHighlight: true,
  imageGallery: true,
  fileUpload: true,
  linkPreviews: true,
  typingIndicator: true,
  soundNotifications: false
};

export const DEFAULT_LABELS: Required<LabelsConfig> = {
  title: 'Chat',
  subtitle: 'Online',
  placeholder: 'Type a message...',
  sendButton: 'Send',
  uploadButton: 'Attach file',
  closeButton: 'Close',
  typingText: 'typing...',
  errorText: 'Something went wrong',
  retryText: 'Retry',
  emptyStateTitle: 'No messages yet',
  emptyStateText: 'Start a conversation!'
};

export const DEFAULT_UPLOAD: Required<UploadConfig> = {
  maxFileSize: 10 * 1024 * 1024,
  maxFiles: 5,
  allowedTypes: ['image/*', 'application/pdf', '.doc', '.docx', '.txt'],
  endpoint: '/upload'
};

export function mergeConfig(userConfig: ChatWidgetConfig): Required<ChatWidgetConfig> {
  return {
    apiUrl: userConfig.apiUrl,
    position: userConfig.position ?? 'right',
    offsetX: userConfig.offsetX ?? 24,
    offsetY: userConfig.offsetY ?? 24,
    theme: { ...DEFAULT_THEME, ...userConfig.theme },
    features: { ...DEFAULT_FEATURES, ...userConfig.features },
    labels: { ...DEFAULT_LABELS, ...userConfig.labels },
    upload: { ...DEFAULT_UPLOAD, ...userConfig.upload },
    auth: userConfig.auth ?? {},
    startOpen: userConfig.startOpen ?? false,
    persistState: userConfig.persistState ?? false,
    onReady: userConfig.onReady ?? (() => {}),
    onOpen: userConfig.onOpen ?? (() => {}),
    onClose: userConfig.onClose ?? (() => {}),
    onMessageSent: userConfig.onMessageSent ?? (() => {}),
    onMessageReceived: userConfig.onMessageReceived ?? (() => {}),
    onError: userConfig.onError ?? (() => {})
  };
}
```

---

## FAZA 4: Utils

### Zadanie 4.1: Utwórz `src/utils/markdown.ts`

```typescript
import MarkdownIt from 'markdown-it';
import emoji from 'markdown-it-emoji';
import taskLists from 'markdown-it-task-lists';
import footnote from 'markdown-it-footnote';

let shikiHighlighter: any = null;

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  breaks: true,
  highlight: (code, lang) => {
    return `<pre class="chat-code-block" data-lang="${lang}"><code>${md.utils.escapeHtml(code)}</code></pre>`;
  }
});

md.use(emoji);
md.use(taskLists, { enabled: true });
md.use(footnote);

const defaultRender = md.renderer.rules.link_open || function(tokens, idx, options, env, self) {
  return self.renderToken(tokens, idx, options);
};

md.renderer.rules.link_open = function(tokens, idx, options, env, self) {
  tokens[idx].attrSet('target', '_blank');
  tokens[idx].attrSet('rel', 'noopener noreferrer');
  return defaultRender(tokens, idx, options, env, self);
};

export function renderMarkdown(content: string): string {
  return md.render(content);
}

export async function highlightCode(element: HTMLElement): Promise<void> {
  if (!shikiHighlighter) {
    const { getHighlighter } = await import('shiki');
    shikiHighlighter = await getHighlighter({
      themes: ['github-dark', 'github-light'],
      langs: ['javascript', 'typescript', 'python', 'json', 'html', 'css', 'bash', 'sql']
    });
  }
  
  const codeBlocks = element.querySelectorAll('pre.chat-code-block');
  
  for (const block of codeBlocks) {
    const code = block.textContent || '';
    const lang = block.getAttribute('data-lang') || 'text';
    
    try {
      const html = shikiHighlighter.codeToHtml(code, { lang, theme: 'github-dark' });
      block.outerHTML = html;
    } catch (e) {}
  }
}
```

### Zadanie 4.2: Utwórz `src/utils/sanitize.ts`

```typescript
import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'blockquote',
  'a', 'img',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'hr', 'span', 'div', 'input'
];

const ALLOWED_ATTR = [
  'href', 'target', 'rel', 'src', 'alt', 'title',
  'class', 'id', 'data-lang',
  'type', 'checked', 'disabled'
];

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR, ALLOW_DATA_ATTR: true });
}
```

### Zadanie 4.3: Utwórz `src/utils/formatters.ts`

```typescript
export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.getDate() === yesterday.getDate()) {
    return 'Yesterday ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.startsWith('video/')) return '🎬';
  if (mimeType.startsWith('audio/')) return '🎵';
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊';
  if (mimeType.includes('zip') || mimeType.includes('archive')) return '📦';
  return '📎';
}

export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}
```

### Zadanie 4.4: Utwórz `src/utils/cn.ts`

```typescript
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
```

---

## FAZA 5: Hooks

### Zadanie 5.1: Utwórz `src/hooks/useApi.ts`

```typescript
import ky, { type KyInstance } from 'ky';
import type { AuthConfig, SendMessageRequest, SendMessageResponse, GetMessagesResponse, LinkPreviewResponse } from '../types';

let apiClient: KyInstance;

export function initApi(baseUrl: string, auth?: AuthConfig): void {
  apiClient = ky.create({
    prefixUrl: baseUrl,
    timeout: 30000,
    retry: 2,
    hooks: {
      beforeRequest: [
        async (request) => {
          if (auth?.token) {
            const token = typeof auth.token === 'function' ? await auth.token() : auth.token;
            request.headers.set(auth.headerName || 'Authorization', `Bearer ${token}`);
          }
        }
      ]
    }
  });
}

export async function sendMessage(data: SendMessageRequest): Promise<SendMessageResponse> {
  return apiClient.post('messages', { json: data }).json();
}

export async function getMessages(cursor?: string): Promise<GetMessagesResponse> {
  const searchParams = cursor ? { cursor } : {};
  return apiClient.get('messages', { searchParams }).json();
}

export async function getLinkPreview(url: string): Promise<LinkPreviewResponse> {
  return apiClient.get('link-preview', { searchParams: { url } }).json();
}

export { apiClient };
```

### Zadanie 5.2: Utwórz `src/hooks/useChat.ts`

```typescript
import { useState, useCallback, useEffect } from 'preact/hooks';
import type { ChatState, Message, ChatWidgetConfig } from '../types';
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

export function useChat(config: Required<ChatWidgetConfig>) {
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
      setState(prev => ({
        ...prev,
        messages: prev.messages.filter(m => m.id !== tempId).concat([{ ...response.message, status: 'sent' }]),
        isTyping: false
      }));
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
```

### Zadanie 5.3: Utwórz `src/hooks/useUpload.ts`

```typescript
import { useState, useCallback, useRef } from 'preact/hooks';
import Uppy from '@uppy/core';
import XHRUpload from '@uppy/xhr-upload';
import type { UploadConfig, UploadResponse, AuthConfig } from '../types';

interface UseUploadOptions {
  config: Required<UploadConfig>;
  apiUrl: string;
  auth?: AuthConfig;
  onUploadComplete: (files: UploadResponse[]) => void;
  onError: (error: Error) => void;
}

interface UploadState {
  isUploading: boolean;
  progress: number;
  files: File[];
}

export function useUpload({ config, apiUrl, auth, onUploadComplete, onError }: UseUploadOptions) {
  const [state, setState] = useState<UploadState>({ isUploading: false, progress: 0, files: [] });
  const uppyRef = useRef<Uppy | null>(null);

  const initUppy = useCallback(() => {
    if (uppyRef.current) return uppyRef.current;

    const uppy = new Uppy({
      restrictions: {
        maxFileSize: config.maxFileSize,
        maxNumberOfFiles: config.maxFiles,
        allowedFileTypes: config.allowedTypes
      },
      autoProceed: false
    });

    uppy.use(XHRUpload, {
      endpoint: `${apiUrl}${config.endpoint}`,
      fieldName: 'file',
      headers: auth?.token ? { [auth.headerName || 'Authorization']: `Bearer ${typeof auth.token === 'function' ? '' : auth.token}` } : {}
    });

    uppy.on('upload-progress', (file, progress) => {
      setState(prev => ({ ...prev, progress: progress.bytesUploaded / progress.bytesTotal * 100 }));
    });

    uppy.on('complete', (result) => {
      const uploaded = result.successful?.map(file => file.response?.body as UploadResponse) || [];
      setState({ isUploading: false, progress: 0, files: [] });
      onUploadComplete(uploaded);
      uppy.cancelAll();
    });

    uppy.on('error', (error) => {
      setState({ isUploading: false, progress: 0, files: [] });
      onError(error);
    });

    uppyRef.current = uppy;
    return uppy;
  }, [config, apiUrl, auth, onUploadComplete, onError]);

  const addFiles = useCallback((files: File[]) => {
    const uppy = initUppy();
    files.forEach(file => {
      try { uppy.addFile({ name: file.name, type: file.type, data: file }); } catch (e) {}
    });
    setState(prev => ({ ...prev, files: [...prev.files, ...files] }));
  }, [initUppy]);

  const removeFile = useCallback((index: number) => {
    const uppy = uppyRef.current;
    if (uppy) {
      const files = uppy.getFiles();
      if (files[index]) uppy.removeFile(files[index].id);
    }
    setState(prev => ({ ...prev, files: prev.files.filter((_, i) => i !== index) }));
  }, []);

  const upload = useCallback(async () => {
    const uppy = uppyRef.current;
    if (!uppy || uppy.getFiles().length === 0) return;
    setState(prev => ({ ...prev, isUploading: true }));
    await uppy.upload();
  }, []);

  const clear = useCallback(() => {
    uppyRef.current?.cancelAll();
    setState({ isUploading: false, progress: 0, files: [] });
  }, []);

  return { state, actions: { addFiles, removeFile, upload, clear } };
}
```

### Zadanie 5.4: Utwórz `src/hooks/useTheme.ts`

```typescript
import { useEffect } from 'preact/hooks';
import type { ThemeConfig } from '../types';

export function useTheme(theme: Required<ThemeConfig>, containerId: string) {
  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const cssVars: Record<string, string> = {
      '--chat-primary': theme.primary,
      '--chat-primary-hover': theme.primaryHover,
      '--chat-bg': theme.background,
      '--chat-bg-secondary': theme.backgroundSecondary,
      '--chat-text': theme.text,
      '--chat-text-secondary': theme.textSecondary,
      '--chat-border': theme.border,
      '--chat-font-family': theme.fontFamily,
      '--chat-font-mono': theme.fontFamilyMono,
      '--chat-font-size': `${theme.fontSize}px`,
      '--chat-border-radius': `${theme.borderRadius}px`,
      ...theme.cssVariables
    };

    Object.entries(cssVars).forEach(([key, value]) => container.style.setProperty(key, value));

    if (theme.mode === 'dark') {
      container.setAttribute('data-theme', 'dark');
    } else if (theme.mode === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      container.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }
  }, [theme, containerId]);
}
```

---

## FAZA 6: Komponenty

Claude Code powinien zaimplementować następujące komponenty zgodnie ze strukturą z FAZY 2:

1. **ChatToggle.tsx** - Przycisk otwierania/zamykania z animacją ikon i badge'em
2. **ChatHeader.tsx** - Nagłówek z avatarem, tytułem, statusem i przyciskami
3. **Message/MessageText.tsx** - Renderowanie markdown z sanityzacją
4. **Message/MessageImages.tsx** - Galeria z GLightbox, grid layout
5. **Message/MessageFile.tsx** - Podgląd załącznika z ikoną i rozmiarem
6. **Message/MessageLink.tsx** - Link preview card
7. **Message/index.tsx** - Wrapper łączący wszystkie typy
8. **TypingIndicator.tsx** - Animowane kropki
9. **ChatMessages.tsx** - Lista z auto-scroll i infinite scroll
10. **FileUpload.tsx** - Drag&drop preview z progress bar
11. **ChatInput.tsx** - Textarea + przyciski (attach, send)
12. **ChatWindow.tsx** - Kontener łączący header + messages + input
13. **ChatWidget.tsx** - Główny komponent z logiką

Każdy komponent używa:
- Preact (`import { h } from 'preact'`)
- Lucide icons (`import { Send, X } from 'lucide-preact'`)
- Utils z `@/utils/*`
- Typów z `@/types`

---

## FAZA 7: Entry point

### Zadanie 7.1: Utwórz `src/index.ts`

```typescript
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
```

---

## FAZA 8: Style CSS

### Zadanie 8.1-8.4: Utwórz pliki CSS w `src/styles/`

Claude Code powinien utworzyć 4 pliki CSS:

1. **variables.css** - CSS custom properties dla theming (kolory, fonty, spacing, shadows)
2. **base.css** - Reset i bazowe style dla .chat-widget
3. **components.css** - Style dla wszystkich komponentów (toggle, window, header, messages, input, file upload, link preview, galeria)
4. **animations.css** - Keyframes (pulse, typingBounce, messageIn, windowIn) + responsive media queries

Kluczowe CSS:
- Użyj `var(--chat-*)` wszędzie
- Dark theme przez `[data-theme="dark"]`
- Mobile: fullscreen chat na `max-width: 480px`
- Smooth transitions z `cubic-bezier(0.4, 0, 0.2, 1)`

---

## FAZA 9: Mock API

### Zadanie 9.1: Utwórz `mock-api/server.js`

```javascript
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { v4 as uuid } from 'uuid';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const storage = multer.diskStorage({
  destination: './mock-api/uploads/',
  filename: (req, file, cb) => cb(null, `${uuid()}-${file.originalname}`)
});
const upload = multer({ storage });

let messages = [
  {
    id: '1',
    role: 'assistant',
    content: 'Cześć! 👋 Jestem asystentem demo.\n\nNapisz:\n- **"kod"** - przykład kodu\n- **"tabela"** - tabela\n- **"obrazki"** - galeria\n- **"plik"** - załącznik\n- **"link"** - link preview',
    createdAt: new Date(Date.now() - 60000).toISOString()
  }
];

const mockAttachments = {};

// GET /messages
app.get('/messages', (req, res) => {
  res.json({ messages, hasMore: false, nextCursor: null });
});

// POST /messages
app.post('/messages', (req, res) => {
  const { content, attachments } = req.body;
  
  const userMessage = {
    id: uuid(),
    role: 'user',
    content,
    attachments: attachments?.map(id => mockAttachments[id]).filter(Boolean),
    createdAt: new Date().toISOString()
  };
  messages.push(userMessage);
  
  setTimeout(() => {
    const botMessage = generateResponse(content);
    messages.push(botMessage);
  }, 1000);
  
  res.json({ message: userMessage });
});

// POST /upload
app.post('/upload', upload.single('file'), (req, res) => {
  const file = req.file;
  const id = uuid();
  const response = {
    id,
    url: `http://localhost:${PORT}/uploads/${file.filename}`,
    filename: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    thumbnailUrl: file.mimetype.startsWith('image/') ? `http://localhost:${PORT}/uploads/${file.filename}` : null
  };
  mockAttachments[id] = { id, type: file.mimetype.startsWith('image/') ? 'image' : 'file', ...response };
  res.json(response);
});

// GET /link-preview
app.get('/link-preview', (req, res) => {
  const url = req.query.url;
  res.json({
    url,
    title: 'Example Link',
    description: 'Link preview description',
    image: 'https://picsum.photos/200/200',
    domain: new URL(url).hostname
  });
});

app.use('/uploads', express.static('./mock-api/uploads'));

function generateResponse(content) {
  const lower = content.toLowerCase();
  
  if (lower.includes('kod') || lower.includes('code')) {
    return {
      id: uuid(),
      role: 'assistant',
      content: '```javascript\nfunction hello() {\n  console.log("Hello!");\n}\n```',
      createdAt: new Date().toISOString()
    };
  }
  
  if (lower.includes('tabel')) {
    return {
      id: uuid(),
      role: 'assistant',
      content: '| Col 1 | Col 2 |\n|-------|-------|\n| A | B |\n| C | D |',
      createdAt: new Date().toISOString()
    };
  }
  
  if (lower.includes('obraz') || lower.includes('image')) {
    return {
      id: uuid(),
      role: 'assistant',
      content: 'Oto obrazki:',
      attachments: [
        { id: uuid(), type: 'image', url: 'https://picsum.photos/800/600?random=1', thumbnailUrl: 'https://picsum.photos/400/300?random=1' },
        { id: uuid(), type: 'image', url: 'https://picsum.photos/800/600?random=2', thumbnailUrl: 'https://picsum.photos/400/300?random=2' }
      ],
      createdAt: new Date().toISOString()
    };
  }
  
  if (lower.includes('plik') || lower.includes('file')) {
    return {
      id: uuid(),
      role: 'assistant',
      content: 'Oto plik:',
      attachments: [
        { id: uuid(), type: 'file', url: 'https://example.com/file.pdf', filename: 'dokument.pdf', mimeType: 'application/pdf', size: 12345 }
      ],
      createdAt: new Date().toISOString()
    };
  }
  
  if (lower.includes('link')) {
    return {
      id: uuid(),
      role: 'assistant',
      content: 'Sprawdź ten link:',
      attachments: [
        { id: uuid(), type: 'link', url: 'https://github.com', title: 'GitHub', description: 'Where the world builds software', thumbnailUrl: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png', domain: 'github.com' }
      ],
      createdAt: new Date().toISOString()
    };
  }
  
  return {
    id: uuid(),
    role: 'assistant',
    content: `Otrzymałem: "${content}"\n\nWpisz "kod", "tabela", "obrazki", "plik" lub "link" aby zobaczyć różne typy.`,
    createdAt: new Date().toISOString()
  };
}

app.listen(PORT, () => console.log(`Mock API: http://localhost:${PORT}`));
```

### Zadanie 9.2: Utwórz `mock-api/package.json`

```json
{
  "name": "chat-widget-mock-api",
  "type": "module",
  "scripts": { "start": "node server.js" },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "multer": "^1.4.5-lts.1",
    "uuid": "^9.0.0"
  }
}
```

---

## FAZA 10: Demo Page

### Zadanie 10.1: Utwórz `demo/index.html`

Strona HTML z:
- Formularzem do konfiguracji (pozycja, motyw, kolor, features)
- Przyciskami "Zastosuj", "Reset", "Toggle"
- Kodem do embedowania
- Ładowaniem widgetu z `../dist/chat-widget.es.js`
- Hintem o komendach testowych

---

## FAZA 11: Finalizacja

### Zadanie 11.1: Utwórz `.gitignore`

```
node_modules/
dist/
mock-api/uploads/*
!mock-api/uploads/.gitkeep
*.log
```

### Zadanie 11.2: Utwórz `README.md` z instrukcjami

---

## Podsumowanie dla Claude Code

### Kolejność:
1. FAZA 1 - Scaffolding
2. FAZA 2 - Katalogi  
3. FAZA 3 - Typy + config
4. FAZA 4 - Utils
5. FAZA 5 - Hooks
6. FAZA 6 - Komponenty (13 plików)
7. FAZA 7 - Entry point
8. FAZA 8 - CSS (4 pliki)
9. FAZA 9 - Mock API
10. FAZA 10 - Demo
11. FAZA 11 - Finalizacja

### Komendy testowe:
```bash
npm run build          # Build widget
npm run dev            # Dev server
cd mock-api && npm start  # Mock API
```

### Kluczowe:
- **Preact** nie React
- **CSS Variables** do theming
- **Shiki** lazy-loaded
- **GLightbox** dla galerii
- **Uppy** dla uploadu
- Jeden plik output (CSS w JS)
