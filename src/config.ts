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

export type MergedChatWidgetConfig = Required<Omit<ChatWidgetConfig, 'theme' | 'features' | 'labels' | 'upload'>> & {
  theme: Required<ThemeConfig>;
  features: Required<FeaturesConfig>;
  labels: Required<LabelsConfig>;
  upload: Required<UploadConfig>;
};

export function mergeConfig(userConfig: ChatWidgetConfig): MergedChatWidgetConfig {
  return {
    apiUrl: userConfig.apiUrl,
    position: userConfig.position ?? 'right',
    offsetX: userConfig.offsetX ?? 24,
    offsetY: userConfig.offsetY ?? 24,
    theme: { ...DEFAULT_THEME, ...userConfig.theme } as Required<ThemeConfig>,
    features: { ...DEFAULT_FEATURES, ...userConfig.features } as Required<FeaturesConfig>,
    labels: { ...DEFAULT_LABELS, ...userConfig.labels } as Required<LabelsConfig>,
    upload: { ...DEFAULT_UPLOAD, ...userConfig.upload } as Required<UploadConfig>,
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
