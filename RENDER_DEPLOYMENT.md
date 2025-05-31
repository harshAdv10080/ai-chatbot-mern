# 🎨 Render Deployment Guide

This guide will help you deploy your AI Chatbot to Render, which can host both your backend and frontend with managed databases.

## 🌟 Why Render?

- **All-in-one platform**: Backend, frontend, and database in one place
- **Free tier available**: Great for testing and small projects
- **Auto-deploy from Git**: Automatic deployments on code changes
- **Built-in SSL**: HTTPS enabled by default
- **Easy environment management**: Simple UI for environment variables

## 📋 Prerequisites

1. **GitHub Repository**: Your code should be in a GitHub repository
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **API Keys**: OpenAI or Google Gemini API key
4. **Database**: Choose between Render PostgreSQL or MongoDB Atlas

## 🚀 Step-by-Step Deployment

### Step 1: Prepare Your Repository

1. **Commit and push your code** to GitHub
2. **Ensure your repository is public** or connect your GitHub account to Render

### Step 2: Database Setup

**Option A: Render PostgreSQL (Recommended)**
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "PostgreSQL"
3. Configure:
   - **Name**: `ai-chatbot-db`
   - **Database**: `ai_chatbot`
   - **User**: `ai_chatbot_user`
   - **Region**: Choose closest to your users
   - **Plan**: Free (for testing) or Starter
4. Click "Create Database"
5. **Save the connection details** (Internal Database URL)

**Option B: MongoDB Atlas**
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a cluster and get connection string
3. Whitelist all IPs (0.0.0.0/0) for production

### Step 3: Backend Deployment

1. **Create Web Service**:
   - Go to Render Dashboard
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select your repository

2. **Configure Service**:
   - **Name**: `ai-chatbot-backend`
   - **Environment**: `Node`
   - **Region**: Same as your database
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: Leave empty (uses project root)
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && npm start`

3. **Set Environment Variables**:
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=your-database-connection-string
   JWT_SECRET=your-super-secure-jwt-secret-here
   OPENAI_API_KEY=your-openai-api-key
   GEMINI_API_KEY=your-gemini-api-key
   CLIENT_URL=https://your-frontend-name.onrender.com
   MAX_FILE_SIZE=10485760
   UPLOAD_DIR=uploads
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   BCRYPT_ROUNDS=12
   ```

4. **Advanced Settings**:
   - **Health Check Path**: `/api/health`
   - **Auto-Deploy**: Yes

5. Click "Create Web Service"

6. **Note your backend URL**: `https://your-backend-name.onrender.com`

### Step 4: Frontend Deployment

1. **Create Static Site**:
   - Go to Render Dashboard
   - Click "New +" → "Static Site"
   - Connect your GitHub repository
   - Select your repository

2. **Configure Static Site**:
   - **Name**: `ai-chatbot-frontend`
   - **Branch**: `main`
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

3. **Set Environment Variables**:
   ```
   VITE_API_URL=https://your-backend-name.onrender.com/api
   VITE_SOCKET_URL=https://your-backend-name.onrender.com
   ```

4. **Advanced Settings**:
   - **Auto-Deploy**: Yes

5. Click "Create Static Site"

### Step 5: Update CORS Settings

1. Go to your **backend service** in Render
2. Update the `CLIENT_URL` environment variable to your frontend URL:
   ```
   CLIENT_URL=https://your-frontend-name.onrender.com
   ```
3. Save and redeploy

## 🔧 Using the Blueprint (Alternative Method)

You can use the included `render.yaml` file for automated setup:

1. **Fork/Clone** this repository
2. **Push to your GitHub**
3. In Render Dashboard, click "New +" → "Blueprint"
4. Connect your repository
5. Select the `render.yaml` file
6. **Manually add API keys** in the environment variables
7. Deploy

## 🔍 Testing Your Deployment

### Backend Health Check
Visit: `https://your-backend-name.onrender.com/api/health`

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456
}
```

### Frontend Access
Visit: `https://your-frontend-name.onrender.com`

Test:
- [ ] Application loads
- [ ] User registration works
- [ ] User login works
- [ ] Chat functionality works
- [ ] File upload works
- [ ] Real-time messaging works

## 🐛 Troubleshooting

### Common Issues

**1. Build Failures**
- Check build logs in Render dashboard
- Ensure all dependencies are in package.json
- Verify Node.js version compatibility

**2. CORS Errors**
- Verify `CLIENT_URL` matches frontend URL exactly
- Check environment variables are set correctly
- Ensure no trailing slashes in URLs

**3. Database Connection Issues**
- Verify connection string format
- Check database is running and accessible
- Ensure IP whitelist includes Render IPs (for external databases)

**4. Environment Variables Not Working**
- Check spelling and case sensitivity
- Ensure variables are set in correct service
- Redeploy after changing environment variables

**5. Socket.IO Connection Issues**
- Verify `VITE_SOCKET_URL` matches backend URL
- Check WebSocket support in Render (should work by default)

### Debugging Steps

1. **Check Logs**:
   - Go to service in Render dashboard
   - Click "Logs" tab
   - Look for error messages

2. **Test API Endpoints**:
   ```bash
   curl https://your-backend.onrender.com/api/health
   ```

3. **Verify Environment Variables**:
   - Check in Render dashboard under "Environment"
   - Ensure sensitive values are not exposed in logs

## 💰 Pricing Considerations

### Free Tier Limitations
- **Web Services**: Sleep after 15 minutes of inactivity
- **Static Sites**: Unlimited bandwidth
- **PostgreSQL**: 1GB storage, 1 month retention

### Upgrading
- **Starter Plan**: $7/month per service
- **No sleep**: Services stay active 24/7
- **More resources**: Better performance

## 🔄 Continuous Deployment

Render automatically deploys when you push to your connected branch:

1. **Make changes** to your code
2. **Commit and push** to GitHub
3. **Render automatically builds and deploys**
4. **Monitor deployment** in Render dashboard

## 📊 Monitoring

### Built-in Monitoring
- **Metrics**: CPU, memory, response times
- **Logs**: Real-time application logs
- **Alerts**: Email notifications for issues

### Health Checks
- Render automatically monitors `/api/health`
- Restarts service if health check fails
- Configurable timeout and retry settings

## 🔐 Security Best Practices

1. **Environment Variables**: Never commit secrets to Git
2. **HTTPS**: Enabled by default on Render
3. **Database Security**: Use strong passwords and connection strings
4. **API Keys**: Rotate regularly and use least privilege
5. **CORS**: Set specific origins, not wildcards in production

## 📞 Support

- **Render Documentation**: [render.com/docs](https://render.com/docs)
- **Community**: [community.render.com](https://community.render.com)
- **Status Page**: [status.render.com](https://status.render.com)

---

**🎉 Congratulations!** Your AI Chatbot is now deployed on Render with automatic deployments, SSL, and monitoring!
