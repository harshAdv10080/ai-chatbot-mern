# 🚀 Deployment Checklist

## Pre-Deployment Requirements

### ✅ API Keys & Accounts
- [ ] OpenAI API Key (or Google Gemini API Key)
- [ ] MongoDB Atlas account and cluster
- [ ] Railway account (for backend)
- [ ] Vercel account (for frontend)

### ✅ Environment Setup
- [ ] All dependencies installed (`npm run install:all`)
- [ ] Environment variables configured
- [ ] Database connection tested
- [ ] API keys validated

## 🎯 Recommended Deployment Options

### Option 1: Render (Full Stack) - NEW RECOMMENDED
### Option 2: Railway + Vercel

## 🌟 Option 1: Render Full Stack Deployment

### Step 1: Repository Setup
- [ ] Code committed and pushed to GitHub
- [ ] Repository is public or GitHub account connected to Render

### Step 2: Database Setup
- [ ] Render PostgreSQL database created OR MongoDB Atlas cluster setup
- [ ] Database connection string obtained
- [ ] Database user created with proper permissions

### Step 3: Backend Deployment (Render Web Service)
- [ ] Render account created
- [ ] Web Service created and connected to GitHub repository
- [ ] Build command set: `cd server && npm install`
- [ ] Start command set: `cd server && npm start`
- [ ] Environment variables configured:
  - [ ] `NODE_ENV=production`
  - [ ] `PORT=10000`
  - [ ] `MONGODB_URI=your-database-connection-string`
  - [ ] `JWT_SECRET=your-secure-secret`
  - [ ] `OPENAI_API_KEY=your-api-key` (or `GEMINI_API_KEY`)
  - [ ] `CLIENT_URL=https://your-frontend.onrender.com`
  - [ ] `MAX_FILE_SIZE=10485760`
  - [ ] `UPLOAD_DIR=uploads`
  - [ ] `RATE_LIMIT_WINDOW_MS=900000`
  - [ ] `RATE_LIMIT_MAX_REQUESTS=100`
  - [ ] `BCRYPT_ROUNDS=12`
- [ ] Health check path set: `/api/health`
- [ ] Backend deployed successfully
- [ ] Backend URL obtained (e.g., `https://your-backend.onrender.com`)

### Step 4: Frontend Deployment (Render Static Site)
- [ ] Static Site created and connected to GitHub repository
- [ ] Root directory set: `client`
- [ ] Build command set: `npm install && npm run build`
- [ ] Publish directory set: `dist`
- [ ] Environment variables configured:
  - [ ] `VITE_API_URL=https://your-backend.onrender.com/api`
  - [ ] `VITE_SOCKET_URL=https://your-backend.onrender.com`
- [ ] Frontend deployed successfully
- [ ] Frontend URL obtained

### Step 5: Final Configuration
- [ ] Update `CLIENT_URL` in backend to match frontend URL
- [ ] Both services redeployed with updated settings

## 🎯 Option 2: Railway + Vercel

### Step 1: Database Setup
- [ ] MongoDB Atlas cluster created
- [ ] Database user created with read/write permissions
- [ ] IP whitelist configured (0.0.0.0/0 for production)
- [ ] Connection string obtained

### Step 2: Backend Deployment (Railway)
- [ ] Railway CLI installed (`npm install -g @railway/cli`)
- [ ] Railway account connected (`railway login`)
- [ ] Project initialized (`railway init`)
- [ ] Environment variables set in Railway dashboard:
  - [ ] `NODE_ENV=production`
  - [ ] `PORT=5000`
  - [ ] `MONGODB_URI=your-atlas-connection-string`
  - [ ] `JWT_SECRET=your-secure-secret`
  - [ ] `OPENAI_API_KEY=your-api-key` (or `GEMINI_API_KEY`)
  - [ ] `CLIENT_URL=https://your-vercel-app.vercel.app`
  - [ ] `MAX_FILE_SIZE=10485760`
  - [ ] `UPLOAD_DIR=uploads`
  - [ ] `RATE_LIMIT_WINDOW_MS=900000`
  - [ ] `RATE_LIMIT_MAX_REQUESTS=100`
  - [ ] `BCRYPT_ROUNDS=12`
- [ ] Backend deployed (`railway up`)
- [ ] Railway URL obtained (e.g., `https://your-app.railway.app`)

### Step 3: Frontend Deployment (Vercel)
- [ ] Vercel CLI installed (`npm install -g vercel`)
- [ ] Navigate to client directory (`cd client`)
- [ ] Environment variables set in Vercel dashboard:
  - [ ] `VITE_API_URL=https://your-railway-app.railway.app/api`
  - [ ] `VITE_SOCKET_URL=https://your-railway-app.railway.app`
- [ ] Frontend deployed (`vercel --prod`)
- [ ] Vercel URL obtained

### Step 4: Final Configuration
- [ ] Update `CLIENT_URL` in Railway to match Vercel URL
- [ ] Test all functionality:
  - [ ] User registration/login
  - [ ] Chat functionality
  - [ ] File upload
  - [ ] Real-time messaging
  - [ ] API health check

## 🐳 Alternative: Docker Deployment

### Prerequisites
- [ ] Docker installed
- [ ] Docker Compose installed
- [ ] `.env` file created from `.env.docker` template
- [ ] All environment variables configured in `.env`

### Deployment Steps
- [ ] Build and start containers (`npm run docker:prod`)
- [ ] Verify all services are running (`docker-compose -f docker-compose.prod.yml ps`)
- [ ] Test application at `http://localhost:5000`

## 🔍 Post-Deployment Testing

### Backend Health Check
- [ ] Health endpoint responds: `GET /api/health`
- [ ] Database connection working
- [ ] API endpoints responding correctly

### Frontend Functionality
- [ ] Application loads without errors
- [ ] User registration works
- [ ] User login works
- [ ] Chat interface loads
- [ ] Messages send and receive
- [ ] File upload works
- [ ] Real-time features work (Socket.IO)
- [ ] Dark/light mode toggle works

### Performance & Security
- [ ] HTTPS enabled (production)
- [ ] CORS configured correctly
- [ ] Rate limiting working
- [ ] File upload size limits enforced
- [ ] JWT authentication working
- [ ] Error handling working properly

## 🐛 Common Issues & Solutions

### CORS Errors
- [ ] Verify `CLIENT_URL` matches frontend domain exactly
- [ ] Check environment variables in both Railway and Vercel
- [ ] Ensure no trailing slashes in URLs

### Database Connection Issues
- [ ] Verify MongoDB Atlas connection string
- [ ] Check IP whitelist in MongoDB Atlas
- [ ] Ensure database user has correct permissions

### Socket.IO Connection Issues
- [ ] Verify `VITE_SOCKET_URL` matches backend URL
- [ ] Check Railway logs for WebSocket errors
- [ ] Ensure Socket.IO transports are configured correctly

### API Key Issues
- [ ] Verify API keys are correctly set
- [ ] Check API key permissions and quotas
- [ ] Test API keys with simple requests

## 📊 Monitoring & Maintenance

### Regular Checks
- [ ] Monitor Railway logs for errors
- [ ] Check Vercel function logs
- [ ] Monitor MongoDB Atlas metrics
- [ ] Check API usage and quotas
- [ ] Monitor application performance

### Updates
- [ ] Keep dependencies updated
- [ ] Monitor security advisories
- [ ] Regular backup of database
- [ ] Test deployment process regularly

## 🚀 Quick Commands

```bash
# Development
npm run dev

# Build everything
npm run build

# Deploy with script
npm run deploy        # Linux/Mac
npm run deploy:win    # Windows

# Docker deployment
npm run docker:prod

# Install all dependencies
npm run install:all
```

## 📞 Support

If you encounter issues:
1. Check the logs (Railway/Vercel dashboards)
2. Verify environment variables
3. Test API endpoints manually
4. Check database connectivity
5. Review DEPLOYMENT.md for detailed troubleshooting
