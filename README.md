# AI Chatbot

A full-stack chatbot application I built using React, Node.js, and OpenAI's API. It includes user authentication, 2FA security, and a clean chat interface.

**Live Demo:** [https://ai-chatbot-frontend-hzof.onrender.com](https://ai-chatbot-frontend-hzof.onrender.com)

## What it does

This is a complete chatbot application where users can:
- Chat with an AI assistant powered by OpenAI
- Create accounts and log in securely
- Set up two-factor authentication for extra security
- Reset passwords if they forget them
- Switch between dark and light themes
- View their chat history

## Features I implemented

**Authentication & Security**
- User registration and login
- JWT tokens for secure sessions
- Two-factor authentication with QR codes
- Password reset via email
- Protected routes and API endpoints

**Chat Interface**
- Real-time messaging with the AI
- Conversation history
- Clean, responsive design
- Dark/light mode toggle
- Mobile-friendly interface

**Backend API**
- RESTful endpoints for all features
- MongoDB database integration
- Input validation and error handling
- Secure password hashing

## Tech Stack

**Frontend**
- React with Vite
- Tailwind CSS for styling
- React Router for navigation
- Lucide React for icons

**Backend**
- Node.js with Express
- MongoDB with Mongoose
- JWT for authentication
- bcrypt for password hashing
- Speakeasy for 2FA
- QRCode generation

**External APIs**
- OpenAI API for chat responses
- Nodemailer for emails

**Deployment**
- Frontend and backend hosted on Render
- MongoDB Atlas for database

## How I built it

I started with the basic MERN stack setup and gradually added features:

1. **Backend first** - Set up Express server with MongoDB connection
2. **Authentication** - Added user registration, login, and JWT tokens
3. **Frontend** - Built React components for login, chat interface
4. **AI Integration** - Connected OpenAI API for chat responses
5. **Security features** - Added 2FA, password reset, input validation
6. **Polish** - Added dark mode, responsive design, error handling

## Challenges I solved

**2FA Implementation**: Getting the QR code generation and TOTP verification working properly took some research. I used Speakeasy library and had to handle the backup codes system.

**Real-time Chat**: Making the chat feel responsive while handling API delays. I added optimistic updates and proper loading states.

**Security**: Implementing proper JWT refresh tokens, password hashing, and protecting against common vulnerabilities.

**Deployment**: Setting up the full-stack app on Render with proper environment variables and database connections.

## What I learned

- How to integrate external APIs (OpenAI) into a full-stack app
- Implementing enterprise-level security features like 2FA
- Building responsive UIs that work well on mobile
- Managing state across a larger React application
- Deploying and maintaining a production application

---

**Built by Harsh Bhanushali** | [GitHub](https://github.com/harshAdv10080)
