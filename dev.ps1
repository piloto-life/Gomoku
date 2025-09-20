# PowerShell script para rodar Gomoku em modo desenvolvimento

Write-Host "🚀 Starting Gomoku in DEVELOPMENT mode..." -ForegroundColor Green
Write-Host "📊 MongoDB Admin available at: http://localhost:8081 (admin/admin)" -ForegroundColor Yellow
Write-Host "🖥️  Frontend available at: http://localhost:9001" -ForegroundColor Cyan
Write-Host "🔧 Backend API available at: http://localhost:9000" -ForegroundColor Blue
Write-Host ""

# Para qualquer container rodando
Write-Host "Stopping any running containers..." -ForegroundColor Yellow
docker-compose down

# Inicia em modo desenvolvimento com mongo-express
Write-Host "Starting development mode..." -ForegroundColor Green
docker-compose --profile debug up --build

Write-Host "🛑 Development mode stopped" -ForegroundColor Red