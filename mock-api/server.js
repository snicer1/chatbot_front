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

  // Simulate bot thinking delay, then respond
  setTimeout(() => {
    const botMessage = generateResponse(content);
    messages.push(botMessage);

    // Return both messages
    res.json({
      message: userMessage,
      response: botMessage
    });
  }, 1000);
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
