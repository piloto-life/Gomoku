#!/bin/bash

# Development setup script for Gomoku project

echo "🎮 Setting up Gomoku development environment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ Please edit .env file with your configuration"
fi

# Build and start services
echo "🐳 Building and starting Docker containers..."
docker-compose up --build -d

echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
echo "🔍 Checking service status..."
docker-compose ps

echo ""
echo "🎉 Development environment is ready!"
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "🔌 Backend API: http://localhost:8000"
echo "📊 API Docs: http://localhost:8000/docs"
echo "🗄️  MongoDB: localhost:27017"
echo ""
echo "🛑 To stop: docker-compose down"
echo "📋 To view logs: docker-compose logs -f [service-name]"
