# Makefile for Gomoku project

.PHONY: help setup dev stop clean logs test build deploy

# Default target
help:
	@echo "🎮 Gomoku Project Commands"
	@echo ""
	@echo "Development:"
	@echo "  make setup    - Setup development environment"
	@echo "  make dev      - Start development servers"
	@echo "  make stop     - Stop all services"
	@echo "  make logs     - View logs"
	@echo "  make clean    - Clean containers and volumes"
	@echo ""
	@echo "Testing:"
	@echo "  make test     - Run all tests"
	@echo "  make test-be  - Run backend tests"
	@echo "  make test-fe  - Run frontend tests"
	@echo ""
	@echo "Production:"
	@echo "  make build    - Build production images"
	@echo "  make deploy   - Deploy to production"

# Development setup
setup:
	@echo "🚀 Setting up development environment..."
	@./dev-setup.sh

# Start development environment
dev:
	@echo "🔧 Starting development environment..."
	@docker-compose up -d
	@echo "✅ Services started!"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend: http://150.162.244.21:8000"

# Stop all services
stop:
	@echo "🛑 Stopping all services..."
	@docker-compose down

# View logs
logs:
	@docker-compose logs -f

# Clean containers and volumes
clean:
	@echo "🧹 Cleaning containers and volumes..."
	@docker-compose down -v --remove-orphans
	@docker system prune -f

# Run all tests
test:
	@echo "🧪 Running all tests..."
	@make test-be
	@make test-fe

# Run backend tests
test-be:
	@echo "🧪 Running backend tests..."
	@docker-compose exec backend pytest

# Run frontend tests
test-fe:
	@echo "🧪 Running frontend tests..."
	@docker-compose exec frontend npm test

# Build production images
build:
	@echo "🏗️ Building production images..."
	@docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Deploy to production
deploy:
	@echo "🚀 Deploying to production..."
	@docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
