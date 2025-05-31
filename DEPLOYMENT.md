# 🚀 Deployment Guide

This guide covers multiple deployment options for your AI Chatbot application.

## 📋 Prerequisites

1. **API Keys Required:**
   - OpenAI API Key (or Gemini API Key)
   - MongoDB Atlas connection string (for production database)

2. **Accounts Needed:**
   - Railway account (for backend)
   - Vercel account (for frontend)
   - MongoDB Atlas account (for database)

## 🎯 Recommended Deployment Options

### Option 1: Render (Full Stack) - NEW RECOMMENDED
### Option 2: Railway + Vercel
### Option 3: Docker Deployment

## 🌟 Option 1: Render Full Stack Deployment

Render can host both your backend and frontend with managed databases, making it a great all-in-one solution.

### Step 1: Database Setup (Render PostgreSQL or MongoDB Atlas)

**Option A: Render PostgreSQL (Recommended)**
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Create a new PostgreSQL database
3. Note the connection details

**Option B: MongoDB Atlas (If you prefer MongoDB)**
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a new cluster (free tier available)
3. Get your connection string

### Step 2: Backend Deployment (Render Web Service)

1. **Connect Repository to Render:**
   - Go to Render Dashboard
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the root directory

2. **Configure Build & Deploy:**
   - **Build Command:** `cd server && npm install`
   - **Start Command:** `cd server && npm start`
   - **Environment:** `Node`

3. **Set Environment Variables:**
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=your-database-connection-string
   JWT_SECRET=your-super-secure-jwt-secret
   OPENAI_API_KEY=your-openai-api-key
   GEMINI_API_KEY=your-gemini-api-key
   CLIENT_URL=https://your-frontend-name.onrender.com
   MAX_FILE_SIZE=10485760
   UPLOAD_DIR=uploads
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   BCRYPT_ROUNDS=12
   ```

4. **Deploy and get your backend URL** (e.g., `https://your-backend.onrender.com`)

### Step 3: Frontend Deployment (Render Static Site)

1. **Create Static Site:**
   - Go to Render Dashboard
   - Click "New +" → "Static Site"
   - Connect your GitHub repository
   - Set **Root Directory:** `client`

2. **Configure Build:**
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`

3. **Set Environment Variables:**
   ```
   VITE_API_URL=https://your-backend.onrender.com/api
   VITE_SOCKET_URL=https://your-backend.onrender.com
   ```

4. **Deploy and get your frontend URL**

### Step 4: Update CORS Settings

Update the `CLIENT_URL` environment variable in your backend service to match your frontend URL.

## 🎯 Option 2: Railway + Vercel

### Step 1: Database Setup (MongoDB Atlas)

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a new cluster (free tier available)
3. Create a database user
4. Get your connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/ai-chatbot?retryWrites=true&w=majority
   ```

### Step 2: Backend Deployment (Railway)

1. **Connect Repository to Railway:**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login to Railway
   railway login
   
   # Initialize project
   railway init
   ```

2. **Set Environment Variables in Railway:**
   Go to Railway dashboard → Your project → Variables, and add:
   ```
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=your-mongodb-atlas-connection-string
   JWT_SECRET=your-super-secure-jwt-secret
   OPENAI_API_KEY=your-openai-api-key
   GEMINI_API_KEY=your-gemini-api-key
   CLIENT_URL=https://your-frontend-domain.vercel.app
   MAX_FILE_SIZE=10485760
   UPLOAD_DIR=uploads
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   BCRYPT_ROUNDS=12
   ```

3. **Deploy:**
   ```bash
   railway up
   ```

4. **Get your Railway backend URL** (e.g., `https://your-app.railway.app`)

### Step 3: Frontend Deployment (Vercel)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Navigate to client directory:**
   ```bash
   cd client
   ```

3. **Set Environment Variables:**
   Create `.env.production` in client folder:
   ```
   VITE_API_URL=https://your-railway-backend-url.railway.app
   VITE_SOCKET_URL=https://your-railway-backend-url.railway.app
   ```

4. **Deploy to Vercel:**
   ```bash
   vercel --prod
   ```

5. **Set Environment Variables in Vercel Dashboard:**
   - Go to Vercel dashboard → Your project → Settings → Environment Variables
   - Add:
     ```
     VITE_API_URL=https://your-railway-backend-url.railway.app
     VITE_SOCKET_URL=https://your-railway-backend-url.railway.app
     ```

### Step 4: Update CORS Settings

Update the `CLIENT_URL` environment variable in Railway to your Vercel frontend URL.

## 🐳 Alternative: Docker Deployment

### Prerequisites
- Docker and Docker Compose installed
- Production MongoDB instance

### Steps

1. **Create production environment file:**
   ```bash
   cp .env.example .env
   # Edit .env with your production values
   ```

2. **Build and run:**
   ```bash
   docker-compose up -d
   ```

## 🔧 Environment Variables Reference

### Backend (Railway)
| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | Database connection | `mongodb+srv://...` |
| `JWT_SECRET` | JWT signing secret | `your-secret-key` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |
| `GEMINI_API_KEY` | Google Gemini API key | `AI...` |
| `CLIENT_URL` | Frontend URL | `https://app.vercel.app` |

### Frontend (Vercel)
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://api.railway.app` |
| `VITE_SOCKET_URL` | Socket.IO URL | `https://api.railway.app` |

## 🔍 Testing Deployment

1. **Backend Health Check:**
   ```bash
   curl https://your-railway-url.railway.app/api/health
   ```

2. **Frontend Access:**
   Visit your Vercel URL and test:
   - User registration/login
   - Chat functionality
   - File upload
   - Real-time messaging

## 🐛 Troubleshooting

### Common Issues:

1. **CORS Errors:**
   - Ensure `CLIENT_URL` in backend matches your frontend domain
   - Check Vercel environment variables

2. **Database Connection:**
   - Verify MongoDB Atlas connection string
   - Check IP whitelist in MongoDB Atlas

3. **API Keys:**
   - Ensure all API keys are correctly set
   - Check API key permissions and quotas

4. **Socket.IO Issues:**
   - Verify `VITE_SOCKET_URL` matches backend URL
   - Check Railway logs for WebSocket errors

## 📊 Monitoring

- **Railway:** Check logs in Railway dashboard
- **Vercel:** Monitor function logs in Vercel dashboard
- **MongoDB:** Use Atlas monitoring tools

## 🔄 Updates

To update your deployment:

1. **Backend (Railway):**
   ```bash
   git push origin main  # Auto-deploys if connected to Git
   # OR
   railway up
   ```

2. **Frontend (Vercel):**
   ```bash
   cd client
   vercel --prod
   ```
