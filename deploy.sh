#!/bin/bash

# AI Chatbot Deployment Script
# This script helps deploy the application to various platforms

set -e

echo "🚀 AI Chatbot Deployment Script"
echo "================================"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to deploy to Render
deploy_render() {
    echo "🎨 Deploying to Render..."
    echo ""
    echo "📋 Render Deployment Steps:"
    echo "1. Go to https://dashboard.render.com/"
    echo "2. Connect your GitHub repository"
    echo "3. Create services as described below:"
    echo ""
    echo "🗄️  DATABASE SETUP:"
    echo "   - Create PostgreSQL database OR use MongoDB Atlas"
    echo "   - Note the connection string"
    echo ""
    echo "🔧 BACKEND WEB SERVICE:"
    echo "   - Repository: Your GitHub repo"
    echo "   - Build Command: cd server && npm install"
    echo "   - Start Command: cd server && npm start"
    echo "   - Environment Variables:"
    echo "     NODE_ENV=production"
    echo "     PORT=10000"
    echo "     MONGODB_URI=your-database-connection"
    echo "     JWT_SECRET=your-secure-secret"
    echo "     OPENAI_API_KEY=your-api-key"
    echo "     CLIENT_URL=https://your-frontend.onrender.com"
    echo ""
    echo "🌐 FRONTEND STATIC SITE:"
    echo "   - Repository: Your GitHub repo"
    echo "   - Root Directory: client"
    echo "   - Build Command: npm install && npm run build"
    echo "   - Publish Directory: dist"
    echo "   - Environment Variables:"
    echo "     VITE_API_URL=https://your-backend.onrender.com/api"
    echo "     VITE_SOCKET_URL=https://your-backend.onrender.com"
    echo ""
    echo "📄 You can also use the render.yaml blueprint file for automated setup!"
    echo ""
    read -p "Press enter when you've completed the Render setup..."
    echo "✅ Render deployment guide completed!"
}

# Function to deploy to Railway
deploy_railway() {
    echo "📡 Deploying to Railway..."
    
    if ! command_exists railway; then
        echo "❌ Railway CLI not found. Installing..."
        npm install -g @railway/cli
    fi
    
    echo "🔐 Please ensure you've set the following environment variables in Railway:"
    echo "   - MONGODB_URI"
    echo "   - JWT_SECRET"
    echo "   - OPENAI_API_KEY or GEMINI_API_KEY"
    echo "   - CLIENT_URL"
    echo ""
    
    read -p "Have you set all environment variables in Railway? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        railway up
        echo "✅ Backend deployed to Railway!"
    else
        echo "❌ Please set environment variables first"
        exit 1
    fi
}

# Function to deploy frontend to Vercel
deploy_vercel() {
    echo "🌐 Deploying frontend to Vercel..."
    
    if ! command_exists vercel; then
        echo "❌ Vercel CLI not found. Installing..."
        npm install -g vercel
    fi
    
    cd client
    
    echo "🔐 Please ensure you've set the following environment variables in Vercel:"
    echo "   - VITE_API_URL (your Railway backend URL)"
    echo "   - VITE_SOCKET_URL (your Railway backend URL)"
    echo ""
    
    read -p "Have you set environment variables in Vercel? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        vercel --prod
        echo "✅ Frontend deployed to Vercel!"
    else
        echo "❌ Please set environment variables first"
        exit 1
    fi
    
    cd ..
}

# Function to deploy with Docker
deploy_docker() {
    echo "🐳 Deploying with Docker..."
    
    if ! command_exists docker; then
        echo "❌ Docker not found. Please install Docker first."
        exit 1
    fi
    
    if ! command_exists docker-compose; then
        echo "❌ Docker Compose not found. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if .env file exists
    if [ ! -f .env ]; then
        echo "📝 Creating .env file from template..."
        cp .env.docker .env
        echo "⚠️  Please edit .env file with your actual values before continuing."
        read -p "Press enter when you've updated the .env file..."
    fi
    
    echo "🏗️  Building and starting containers..."
    docker-compose -f docker-compose.prod.yml up -d --build
    
    echo "⏳ Waiting for services to start..."
    sleep 10
    
    echo "🔍 Checking service health..."
    docker-compose -f docker-compose.prod.yml ps
    
    echo "✅ Docker deployment complete!"
    echo "🌐 Application should be available at http://localhost:5000"
}

# Function to run local development
dev_setup() {
    echo "💻 Setting up local development..."
    
    # Install dependencies
    echo "📦 Installing dependencies..."
    npm run install:all
    
    # Check if .env exists
    if [ ! -f .env ]; then
        echo "📝 Creating .env file from example..."
        cp .env.example .env
        echo "⚠️  Please edit .env file with your actual values."
    fi
    
    echo "✅ Development setup complete!"
    echo "🚀 Run 'npm run dev' to start development servers"
}

# Main menu
echo "Please select deployment option:"
echo "1) Render (Full Stack) - RECOMMENDED"
echo "2) Railway + Vercel"
echo "3) Docker (Full stack)"
echo "4) Local development setup"
echo "5) Render only (Guide)"
echo "6) Railway only (Backend)"
echo "7) Vercel only (Frontend)"
echo "8) Exit"

read -p "Enter your choice (1-8): " choice

case $choice in
    1)
        deploy_render
        ;;
    2)
        deploy_railway
        deploy_vercel
        ;;
    3)
        deploy_docker
        ;;
    4)
        dev_setup
        ;;
    5)
        deploy_render
        ;;
    6)
        deploy_railway
        ;;
    7)
        deploy_vercel
        ;;
    8)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid option"
        exit 1
        ;;
esac

echo ""
echo "🎉 Deployment process completed!"
echo "📚 Check DEPLOYMENT.md for detailed instructions and troubleshooting."
