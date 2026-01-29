# Chat Widget

Universal, embeddable chat widget built with Preact. Features markdown support, image gallery, file upload, and full customization through JavaScript configuration.

## Features

- 💬 **Rich Messaging** - Full markdown support with code highlighting
- 🖼️ **Image Gallery** - Beautiful image grid with lightbox
- 📎 **File Upload** - Drag & drop file attachments
- 🔗 **Link Previews** - Automatic link preview cards
- 🎨 **Fully Customizable** - Theme colors, fonts, and spacing
- 🌓 **Dark Mode** - Built-in light/dark/auto theme support
- 📱 **Mobile Responsive** - Fullscreen mode on mobile devices
- ⚡ **Lightweight** - ~54KB gzipped
- 🔒 **Secure** - HTML sanitization and XSS protection

## Tech Stack

- **Preact** - Fast 3kB alternative to React
- **Vite** - Next generation frontend tooling
- **TypeScript** - Type safety
- **markdown-it** - Markdown parser
- **GLightbox** - Lightbox for images
- **Uppy** - File upload handling
- **ky** - HTTP client

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Mock API Server

```bash
cd mock-api
npm start
```

The mock API will run on http://localhost:3001

### 3. Build the Widget

```bash
npm run build
```

### 4. Run Demo

```bash
npm run dev
```

Open http://localhost:5173/demo/ to see the widget in action.

## Usage

### Basic Setup

```html
<!DOCTYPE html>
<html>
<head>
  <title>My App</title>
</head>
<body>
  <!-- Your content -->

  <script src="https://your-cdn.com/chat-widget.es.js"></script>
  <script>
    ChatWidget.init({
      apiUrl: 'https://your-api.com'
    });
  </script>
</body>
</html>
```

### Advanced Configuration

```javascript
ChatWidget.init({
  apiUrl: 'https://your-api.com',
  position: 'right', // 'left' | 'right'
  offsetX: 24,
  offsetY: 24,

  theme: {
    mode: 'light', // 'light' | 'dark' | 'auto'
    primary: '#6366f1',
    primaryHover: '#4f46e5',
    background: '#ffffff',
    backgroundSecondary: '#f8fafc',
    text: '#1e293b',
    textSecondary: '#64748b',
    border: '#e2e8f0',
    fontFamily: "'DM Sans', sans-serif",
    fontFamilyMono: "'JetBrains Mono', monospace",
    fontSize: 14,
    borderRadius: 16,
    cssVariables: {
      '--custom-var': 'value'
    }
  },

  features: {
    markdown: true,
    codeHighlight: true,
    imageGallery: true,
    fileUpload: true,
    linkPreviews: true,
    typingIndicator: true,
    soundNotifications: false
  },

  labels: {
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
  },

  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    allowedTypes: ['image/*', 'application/pdf', '.doc', '.docx', '.txt'],
    endpoint: '/upload'
  },

  auth: {
    token: 'your-auth-token', // or async function
    headerName: 'Authorization'
  },

  startOpen: false,
  persistState: false,

  // Event callbacks
  onReady: () => console.log('Widget ready'),
  onOpen: () => console.log('Widget opened'),
  onClose: () => console.log('Widget closed'),
  onMessageSent: (message) => console.log('Message sent:', message),
  onMessageReceived: (message) => console.log('Message received:', message),
  onError: (error) => console.error('Error:', error)
});
```

### API Methods

```javascript
// Destroy widget instance
ChatWidget.destroy();
```

## Backend API

The widget expects the following API endpoints:

### GET /messages

Retrieve message history.

**Query Parameters:**
- `cursor` (optional) - Pagination cursor

**Response:**
```json
{
  "messages": [
    {
      "id": "msg-1",
      "role": "assistant",
      "content": "Hello! How can I help?",
      "attachments": [],
      "createdAt": "2024-01-01T12:00:00Z"
    }
  ],
  "hasMore": false,
  "nextCursor": null
}
```

### POST /messages

Send a new message.

**Request:**
```json
{
  "content": "Hello",
  "attachments": ["file-id-1", "file-id-2"]
}
```

**Response:**
```json
{
  "message": {
    "id": "msg-2",
    "role": "user",
    "content": "Hello",
    "attachments": [],
    "createdAt": "2024-01-01T12:00:00Z"
  }
}
```

### POST /upload

Upload a file.

**Request:** multipart/form-data with `file` field

**Response:**
```json
{
  "id": "file-1",
  "url": "https://cdn.example.com/file.pdf",
  "filename": "document.pdf",
  "mimeType": "application/pdf",
  "size": 12345,
  "thumbnailUrl": null
}
```

### GET /link-preview

Get link preview data.

**Query Parameters:**
- `url` - URL to preview

**Response:**
```json
{
  "url": "https://example.com",
  "title": "Example Site",
  "description": "Example description",
  "image": "https://example.com/og-image.jpg",
  "domain": "example.com"
}
```

## Testing

Try these commands in the demo to test different features:

- **"kod"** or **"code"** - See code block with syntax highlighting
- **"tabela"** - Display markdown table
- **"obrazki"** or **"image"** - Show image gallery
- **"plik"** or **"file"** - Display file attachment
- **"link"** - Show link preview card

## Development

### Project Structure

```
src/
├── index.ts              # Entry point
├── ChatWidget.tsx        # Main widget component
├── types.ts              # TypeScript types
├── config.ts             # Default configuration
├── components/           # UI components
│   ├── ChatToggle.tsx
│   ├── ChatHeader.tsx
│   ├── ChatMessages.tsx
│   ├── ChatInput.tsx
│   ├── FileUpload.tsx
│   ├── TypingIndicator.tsx
│   └── Message/
│       ├── index.tsx
│       ├── MessageText.tsx
│       ├── MessageImages.tsx
│       ├── MessageFile.tsx
│       └── MessageLink.tsx
├── hooks/                # Custom hooks
│   ├── useApi.ts
│   ├── useChat.ts
│   ├── useUpload.ts
│   └── useTheme.ts
├── utils/                # Utility functions
│   ├── markdown.ts
│   ├── sanitize.ts
│   ├── formatters.ts
│   └── cn.ts
└── styles/               # CSS files
    ├── variables.css
    ├── base.css
    ├── components.css
    └── animations.css
```

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run mock-api` - Start mock API server

## Browser Support

- Chrome (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Edge (last 2 versions)

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
