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

## 🚀 Deployment

### Quick Deployment
```bash
# Use the deployment script
npm run deploy        # Linux/Mac
npm run deploy:win    # Windows
```

### Manual Deployment Options

1. **Render (Full Stack) - RECOMMENDED** 🌟
   - Backend: Render Web Service
   - Frontend: Render Static Site
   - Database: Render PostgreSQL or MongoDB Atlas
   - All-in-one platform with free tier

2. **Railway + Vercel**
   - Backend: Railway
   - Frontend: Vercel
   - Database: MongoDB Atlas

3. **Docker (Full Stack)**
   - All services in containers
   - Includes MongoDB and Redis

4. **Other Platforms**
   - Heroku, DigitalOcean, AWS, etc.

### Detailed Instructions
- 🎨 **[RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md)** - Render deployment guide (RECOMMENDED)
- 📚 **[DEPLOYMENT.md](DEPLOYMENT.md)** - Complete deployment guide for all platforms
- ✅ **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** - Step-by-step checklist

### Environment Variables
See `.env.example` for required environment variables.

## 👨‍💻 Author

**Harsh Bhanushali**
- GitHub: [@harshAdv10080](https://github.com/harshAdv10080)
- Project: [AI Chatbot](https://github.com/harshAdv10080/ai-chatbot)

## 🙏 Acknowledgments

This project was built with passion and dedication by **Harsh Bhanushali**. Special thanks to the open-source community for the amazing tools and libraries that made this project possible.

## License

MIT

---

**Built with ❤️ by [Harsh Bhanushali](https://github.com/harshAdv10080)**
