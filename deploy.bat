@echo off
REM AI Chatbot Deployment Script for Windows
REM This script helps deploy the application to various platforms

echo 🚀 AI Chatbot Deployment Script
echo ================================

:menu
echo.
echo Please select deployment option:
echo 1) Render (Full Stack) - RECOMMENDED
echo 2) Railway + Vercel
echo 3) Docker (Full stack)
echo 4) Local development setup
echo 5) Render only (Guide)
echo 6) Railway only (Backend)
echo 7) Vercel only (Frontend)
echo 8) Exit

set /p choice="Enter your choice (1-8): "

if "%choice%"=="1" goto render_deploy
if "%choice%"=="2" goto railway_vercel
if "%choice%"=="3" goto docker_deploy
if "%choice%"=="4" goto dev_setup
if "%choice%"=="5" goto render_only
if "%choice%"=="6" goto railway_only
if "%choice%"=="7" goto vercel_only
if "%choice%"=="8" goto exit
echo ❌ Invalid option
goto menu

:render_deploy
call :deploy_render
goto end

:render_only
call :deploy_render
goto end

:railway_vercel
call :deploy_railway
call :deploy_vercel
goto end

:docker_deploy
call :deploy_docker
goto end

:dev_setup
call :dev_setup_func
goto end

:railway_only
call :deploy_railway
goto end

:vercel_only
call :deploy_vercel
goto end

:deploy_render
echo 🎨 Deploying to Render...
echo.
echo 📋 Render Deployment Steps:
echo 1. Go to https://dashboard.render.com/
echo 2. Connect your GitHub repository
echo 3. Create services as described below:
echo.
echo 🗄️  DATABASE SETUP:
echo    - Create PostgreSQL database OR use MongoDB Atlas
echo    - Note the connection string
echo.
echo 🔧 BACKEND WEB SERVICE:
echo    - Repository: Your GitHub repo
echo    - Build Command: cd server ^&^& npm install
echo    - Start Command: cd server ^&^& npm start
echo    - Environment Variables:
echo      NODE_ENV=production
echo      PORT=10000
echo      MONGODB_URI=your-database-connection
echo      JWT_SECRET=your-secure-secret
echo      OPENAI_API_KEY=your-api-key
echo      CLIENT_URL=https://your-frontend.onrender.com
echo.
echo 🌐 FRONTEND STATIC SITE:
echo    - Repository: Your GitHub repo
echo    - Root Directory: client
echo    - Build Command: npm install ^&^& npm run build
echo    - Publish Directory: dist
echo    - Environment Variables:
echo      VITE_API_URL=https://your-backend.onrender.com/api
echo      VITE_SOCKET_URL=https://your-backend.onrender.com
echo.
echo 📄 You can also use the render.yaml blueprint file for automated setup!
echo.
pause
echo ✅ Render deployment guide completed!
exit /b 0

:deploy_railway
echo 📡 Deploying to Railway...
where railway >nul 2>nul
if errorlevel 1 (
    echo ❌ Railway CLI not found. Installing...
    npm install -g @railway/cli
)

echo 🔐 Please ensure you've set the following environment variables in Railway:
echo    - MONGODB_URI
echo    - JWT_SECRET
echo    - OPENAI_API_KEY or GEMINI_API_KEY
echo    - CLIENT_URL
echo.

set /p confirm="Have you set all environment variables in Railway? (y/n): "
if /i "%confirm%"=="y" (
    railway up
    echo ✅ Backend deployed to Railway!
) else (
    echo ❌ Please set environment variables first
    exit /b 1
)
exit /b 0

:deploy_vercel
echo 🌐 Deploying frontend to Vercel...
where vercel >nul 2>nul
if errorlevel 1 (
    echo ❌ Vercel CLI not found. Installing...
    npm install -g vercel
)

cd client

echo 🔐 Please ensure you've set the following environment variables in Vercel:
echo    - VITE_API_URL (your Railway backend URL)
echo    - VITE_SOCKET_URL (your Railway backend URL)
echo.

set /p confirm="Have you set environment variables in Vercel? (y/n): "
if /i "%confirm%"=="y" (
    vercel --prod
    echo ✅ Frontend deployed to Vercel!
) else (
    echo ❌ Please set environment variables first
    cd ..
    exit /b 1
)

cd ..
exit /b 0

:deploy_docker
echo 🐳 Deploying with Docker...
where docker >nul 2>nul
if errorlevel 1 (
    echo ❌ Docker not found. Please install Docker first.
    exit /b 1
)

where docker-compose >nul 2>nul
if errorlevel 1 (
    echo ❌ Docker Compose not found. Please install Docker Compose first.
    exit /b 1
)

if not exist .env (
    echo 📝 Creating .env file from template...
    copy .env.docker .env
    echo ⚠️  Please edit .env file with your actual values before continuing.
    pause
)

echo 🏗️  Building and starting containers...
docker-compose -f docker-compose.prod.yml up -d --build

echo ⏳ Waiting for services to start...
timeout /t 10 /nobreak >nul

echo 🔍 Checking service health...
docker-compose -f docker-compose.prod.yml ps

echo ✅ Docker deployment complete!
echo 🌐 Application should be available at http://localhost:5000
exit /b 0

:dev_setup_func
echo 💻 Setting up local development...

echo 📦 Installing dependencies...
npm run install:all

if not exist .env (
    echo 📝 Creating .env file from example...
    copy .env.example .env
    echo ⚠️  Please edit .env file with your actual values.
)

echo ✅ Development setup complete!
echo 🚀 Run 'npm run dev' to start development servers
exit /b 0

:end
echo.
echo 🎉 Deployment process completed!
echo 📚 Check DEPLOYMENT.md for detailed instructions and troubleshooting.
pause
goto :eof

:exit
echo 👋 Goodbye!
pause
exit
