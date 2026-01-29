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
  response?: Message;  // Bot's response
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
