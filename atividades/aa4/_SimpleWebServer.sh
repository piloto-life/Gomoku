#!/bin/bash
# _SimpleWebServer.sh
# Script para iniciar um servidor web simples para o projeto Gomoku
# Projeto Web UFSC - INE5646

# Configurações
PORT=8080
BROWSER="firefox"

# Função para verificar se uma porta está em uso
check_port() {
    if command -v lsof >/dev/null 2>&1; then
        if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null; then
            return 0  # Porta em uso
        fi
    fi
    return 1  # Porta livre
}

# Função para encontrar uma porta livre
find_free_port() {
    local port=$PORT
    while check_port; do
        ((port++))
        PORT=$port
    done
}

# Função para iniciar o servidor
start_server() {
    echo "=============================================="
    echo "  Gomoku - Servidor Web Simples"
    echo "  Projeto Web UFSC - INE5646"
    echo "=============================================="
    echo ""
    
    # Verificar dependências
    if ! command -v php >/dev/null 2>&1; then
        echo "❌ ERRO: PHP não está instalado!"
        echo "   Execute: sudo apt install php -y"
        exit 1
    fi
    
    # Verificar se está no diretório correto
    if [ ! -f "index.html" ]; then
        echo "❌ ERRO: Arquivo index.html não encontrado!"
        echo "   Execute este script no diretório do projeto."
        exit 1
    fi
    
    # Encontrar porta livre
    find_free_port
    
    echo "🚀 Iniciando servidor web..."
    echo "📁 Diretório: $(pwd)"
    echo "🌐 Porta: $PORT"
    echo "🔗 URL: http://localhost:$PORT"
    echo ""
    echo "Arquivos disponíveis:"
    echo "  - http://localhost:$PORT/index.html (Página principal)"
    echo "  - http://localhost:$PORT/DOM.html (Estrutura DOM)"
    echo ""
    echo "Para parar o servidor, pressione Ctrl+C"
    echo "=============================================="
    echo ""
    
    # Aguardar um momento
    sleep 2
    
    # Abrir navegador em background se disponível
    if command -v $BROWSER >/dev/null 2>&1; then
        echo "🌐 Abrindo navegador..."
        $BROWSER "http://localhost:$PORT" >/dev/null 2>&1 &
    elif command -v xdg-open >/dev/null 2>&1; then
        echo "🌐 Abrindo navegador..."
        xdg-open "http://localhost:$PORT" >/dev/null 2>&1 &
    else
        echo "ℹ️  Abra manualmente: http://localhost:$PORT"
    fi
    
    echo ""
    echo "📊 Logs do servidor:"
    echo "----------------------------------------------"
    
    # Iniciar servidor PHP
    php -S localhost:$PORT
}

# Função para mostrar ajuda
show_help() {
    echo "Uso: $0 [opções]"
    echo ""
    echo "Opções:"
    echo "  -p, --port PORT    Define a porta (padrão: 8080)"
    echo "  -b, --browser APP  Define o navegador (padrão: firefox)"
    echo "  -h, --help         Mostra esta ajuda"
    echo ""
    echo "Exemplos:"
    echo "  $0                 # Usar configurações padrão"
    echo "  $0 -p 3000         # Usar porta 3000"
    echo "  $0 -b chromium     # Usar Chromium"
    echo ""
}

# Processar argumentos da linha de comando
while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--port)
            PORT="$2"
            shift 2
            ;;
        -b|--browser)
            BROWSER="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo "❌ Opção desconhecida: $1"
            show_help
            exit 1
            ;;
    esac
done

# Função para limpeza ao sair
cleanup() {
    echo ""
    echo "🛑 Parando servidor..."
    echo "✅ Servidor finalizado."
    exit 0
}

# Configurar trap para limpeza
trap cleanup SIGINT SIGTERM

# Verificar se já existe um servidor rodando na porta
if check_port; then
    echo "⚠️  Porta $PORT já está em uso!"
    echo "   Tentando encontrar uma porta livre..."
fi

# Iniciar servidor
start_server
