# AI Chatbot

A modern AI chatbot built with React, Node.js, and Google Gemini. Features real-time chat, document upload, and smart scrolling.

## Features

- Real-time chat with AI responses
- Upload PDF documents and ask questions about them
- Dark/light mode toggle
- Smart scrolling that doesn't interfere with manual scrolling
- User authentication and conversation history
- Responsive design

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS
- **Backend**: Node.js, Express, MongoDB
- **AI**: Google Gemini API
- **Real-time**: Socket.IO

## Setup

1. Clone the repository
```bash
git clone https://github.com/harshAdv10080/ai-chatbot.git
cd ai-chatbot
```

2. Install dependencies
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

3. Create environment file
```bash
# Create .env file in root directory
GEMINI_API_KEY=your_gemini_api_key
MONGODB_URI=mongodb://localhost:27017/ai-chatbot
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
```

4. Start the application
```bash
# Start server (from server directory)
npm run dev

# Start client (from client directory)
npm run dev
```

5. Open http://localhost:5173 in your browser

## Usage

- Register/login to start chatting
- Send messages to get AI responses
- Upload PDF files to ask questions about documents
- Toggle dark mode in settings
- Scroll through chat history without interruption

## Deployment

The app can be deployed on platforms like Vercel (frontend) and Railway (backend).

## License

MIT
