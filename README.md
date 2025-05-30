# 🤖 AI Chatbot - Production-Grade MERN Stack Application

A sophisticated, production-ready AI chatbot built with the MERN stack, featuring real-time chat, document analysis (RAG), and advanced AI capabilities.

## 🌟 Features

### 🧠 Core AI Features
- **Real-time Chat**: Socket.IO powered instant messaging with typing indicators
- **Multi-turn Conversations**: Context-aware conversations with memory
- **RAG (Retrieval Augmented Generation)**: Upload PDFs and get AI responses based on document content
- **Message Streaming**: ChatGPT-like streaming responses
- **GPT-4 Integration**: Powered by OpenAI's latest models

### 📄 Document Processing
- **PDF Upload & Processing**: Drag-and-drop PDF upload with text extraction
- **Vector Search**: Semantic search across uploaded documents
- **Document Management**: View, search, and delete uploaded documents
- **Chunking & Embeddings**: Intelligent text chunking with vector embeddings

### 🎯 Advanced Features
- **Flashcard Generation**: AI-powered flashcard creation from documents
- **Text Summarization**: Intelligent document and text summarization
- **Search Functionality**: Search across all conversations and documents
- **Token Management**: Usage tracking and limits

### 🔐 Authentication & Security
- **JWT Authentication**: Secure token-based authentication
- **Password Security**: Bcrypt hashing with strong password requirements
- **Rate Limiting**: API rate limiting and abuse prevention
- **Input Validation**: Comprehensive input validation and sanitization

### 🎨 Modern UI/UX
- **Responsive Design**: Mobile-first responsive design
- **Dark Mode**: Full dark mode support
- **Real-time Updates**: Live updates via WebSocket
- **Loading States**: Smooth loading animations and states
- **Toast Notifications**: User-friendly notifications

## 🏗️ Architecture

### Backend (Node.js/Express)
```
server/
├── app.js                 # Main Express application
├── config/
│   └── database.js        # MongoDB connection
├── models/
│   ├── User.js           # User schema with subscription management
│   ├── Conversation.js   # Chat conversations with message history
│   └── Document.js       # Uploaded documents with vector chunks
├── routes/
│   ├── auth.js           # Authentication endpoints
│   ├── chat.js           # Chat and AI endpoints
│   └── upload.js         # File upload and processing
├── middleware/
│   └── auth.js           # JWT authentication middleware
├── services/
│   ├── openai.js         # OpenAI API integration
│   ├── vectorStore.js    # Vector storage and similarity search
│   └── pdfProcessor.js   # PDF text extraction and chunking
└── sockets/
    └── chatSocket.js     # Socket.IO real-time handlers
```

### Frontend (React/Vite)
```
client/
├── src/
│   ├── components/
│   │   ├── Auth/         # Login and registration
│   │   ├── Chat/         # Chat interface components
│   │   ├── Upload/       # File upload components
│   │   └── common/       # Reusable components
│   ├── context/
│   │   └── AuthContext.jsx  # Authentication state management
│   ├── hooks/
│   │   ├── useSocket.js     # Socket.IO hook
│   │   └── useAuth.js       # Authentication hook
│   ├── services/
│   │   └── api.js           # API client with interceptors
│   └── App.jsx              # Main application component
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB 4.4+
- OpenAI API Key

### 1. Clone and Install
```bash
git clone <repository-url>
cd ai-chatbot
npm run install:all
```

### 2. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
MONGODB_URI=mongodb://localhost:27017/ai-chatbot
JWT_SECRET=your-super-secret-jwt-key
OPENAI_API_KEY=your-openai-api-key
```

### 3. Start Development Environment
```bash
# Start MongoDB (if using Docker)
npm run docker:up

# Start development servers
npm run dev
```

### 4. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/api/health

## 🔧 Configuration

### Environment Variables
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/ai-chatbot

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# OpenAI API
OPENAI_API_KEY=your-openai-api-key-here

# CORS
CLIENT_URL=http://localhost:5173

# File Upload
MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_DIR=uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000    # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
```

### OpenAI Configuration
The application uses:
- **Chat Model**: GPT-4 Turbo Preview
- **Embedding Model**: text-embedding-3-small
- **Fallback Model**: GPT-3.5 Turbo

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Chat
- `GET /api/chat/conversations` - List conversations
- `POST /api/chat/conversations` - Create conversation
- `GET /api/chat/conversations/:id` - Get conversation
- `POST /api/chat/conversations/:id/messages` - Send message
- `DELETE /api/chat/conversations/:id` - Delete conversation

### File Upload
- `POST /api/upload` - Upload PDF file
- `GET /api/upload/documents` - List documents
- `GET /api/upload/documents/:id` - Get document
- `DELETE /api/upload/documents/:id` - Delete document

### AI Features
- `POST /api/chat/search` - Search documents
- `POST /api/chat/generate/summary` - Generate summary
- `POST /api/chat/generate/flashcards` - Generate flashcards

## 🔌 Socket.IO Events

### Client → Server
- `join_conversation` - Join conversation room
- `leave_conversation` - Leave conversation room
- `typing_start` - Start typing indicator
- `typing_stop` - Stop typing indicator
- `send_message_stream` - Send streaming message

### Server → Client
- `connected` - Connection established
- `message_received` - New message received
- `stream_start` - Streaming response started
- `stream_chunk` - Streaming response chunk
- `stream_complete` - Streaming response completed
- `user_typing` - User typing indicator

## 🧪 Testing

### Run Tests
```bash
# Backend tests
cd server && npm test

# Frontend tests
cd client && npm test

# E2E tests
npm run test:e2e
```

### Test Coverage
- Unit tests for all services and utilities
- Integration tests for API endpoints
- Socket.IO event testing
- Frontend component testing

## 🚀 Deployment

### Production Build
```bash
# Build frontend
npm run build

# Start production server
npm start
```

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables for Production
```env
NODE_ENV=production
MONGODB_URI=mongodb://your-production-db
JWT_SECRET=your-production-jwt-secret
OPENAI_API_KEY=your-production-openai-key
CLIENT_URL=https://your-domain.com
```

## 🔒 Security Features

- **JWT Authentication** with secure token handling
- **Password Hashing** using bcrypt with salt rounds
- **Rate Limiting** to prevent API abuse
- **Input Validation** using express-validator
- **CORS Configuration** for cross-origin security
- **Helmet.js** for security headers
- **File Upload Validation** with type and size limits

## 📈 Performance Optimizations

- **Code Splitting** with React.lazy and Suspense
- **API Response Caching** with appropriate headers
- **Database Indexing** for optimal query performance
- **Compression** middleware for reduced payload sizes
- **Vector Search Optimization** for fast document retrieval

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for GPT-4 and embedding models
- MongoDB for the database solution
- Socket.IO for real-time communication
- React and Vite for the frontend framework
- Tailwind CSS for styling

## 📞 Support

For support, email support@example.com or join our Slack channel.

---

**Built with ❤️ for the AI community**
