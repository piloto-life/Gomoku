#!/bin/bash

echo "🐛 Starting Gomoku in DEBUG mode..."
echo "📊 MongoDB Admin available at: http://localhost:8081 (admin/admin)"
echo "🖥️  Frontend available at: http://localhost:9001"
echo "🔧 Backend API available at: http://localhost:9000"
echo "🐍 Backend Debug port: 5678"
echo "⚛️  React Debug port: 9009"
echo ""

# Stop any running containers
docker-compose down

# Start in debug mode
docker-compose -f docker-compose.yml -f docker-compose.debug.yml up --build

echo "🛑 Debug mode stopped"