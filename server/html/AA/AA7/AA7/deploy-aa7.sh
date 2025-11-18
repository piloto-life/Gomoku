#!/bin/bash

# Script de deployment para AA7 - Gomoku
echo "🎮 Iniciando deployment AA7 - Gomoku"

# Verificar se estamos no diretório correto
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Erro: Execute este script no diretório raiz do projeto"
    exit 1
fi

echo "📁 Diretório de trabalho: $(pwd)"

# Função para verificar se um comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verificar dependências
echo "🔍 Verificando dependências..."

if ! command_exists docker; then
    echo "❌ Docker não está instalado"
    exit 1
fi

if ! command_exists docker-compose; then
    echo "❌ Docker Compose não está instalado"
    exit 1
fi

echo "✅ Dependências verificadas"

# Parar containers existentes
echo "🛑 Parando containers existentes..."
docker-compose down

# Construir imagens
echo "🏗️ Construindo imagens Docker..."
docker-compose build

# Iniciar serviços
echo "🚀 Iniciando serviços..."
docker-compose up -d mongodb backend

# Aguardar backend inicializar
echo "⏳ Aguardando backend inicializar..."
sleep 5

# Verificar se backend está respondendo
echo "🔍 Verificando backend..."
if curl -f http://150.162.244.21:8000/docs > /dev/null 2>&1; then
    echo "✅ Backend está respondendo"
else
    echo "⚠️  Backend pode estar ainda inicializando..."
fi

# Iniciar frontend
echo "🎨 Iniciando frontend..."
docker-compose up -d frontend

echo ""
echo "🎯 Deployment concluído!"
echo ""
echo "📱 Acesso à aplicação:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://150.162.244.21:8000"
echo "   Documentação API: http://150.162.244.21:8000/docs"
echo ""
echo "🎮 Funcionalidades disponíveis:"
echo "   ✅ Jogo PvP (Jogador vs Jogador)"
echo "   ✅ Jogo PvE (Jogador vs IA)"
echo "   ✅ IA com 3 níveis de dificuldade"
echo "   ✅ Tabuleiro interativo 19x19"
echo "   ✅ Conexão em tempo real"
echo ""
echo "📋 Para parar os serviços:"
echo "   docker-compose down"
echo ""
echo "📊 Para ver logs:"
echo "   docker-compose logs -f"
echo ""
echo "🎉 Pronto para apresentação da AA7!"
