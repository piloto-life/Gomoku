# PowerShell script para rodar Gomoku em modo debug

Write-Host "🐛 Starting Gomoku in DEBUG mode..." -ForegroundColor Green
Write-Host "📊 MongoDB Admin available at: http://localhost:8081 (admin/admin)" -ForegroundColor Yellow
Write-Host "🖥️  Frontend available at: http://localhost:9001" -ForegroundColor Cyan
Write-Host "🔧 Backend API available at: http://localhost:9000" -ForegroundColor Blue
Write-Host "🐍 Backend Debug port: 5678" -ForegroundColor Magenta
Write-Host "⚛️  React Debug port: 9009" -ForegroundColor Red
Write-Host ""

# Para qualquer container rodando
Write-Host "Stopping any running containers..." -ForegroundColor Yellow
docker-compose down

# Inicia em modo debug
Write-Host "Starting debug mode..." -ForegroundColor Green
docker-compose -f docker-compose.yml -f docker-compose.debug.yml up --build

Write-Host "🛑 Debug mode stopped" -ForegroundColor Red