#!/usr/bin/env python3
"""
Script para executar o servidor FastAPI do Gomoku
"""
import uvicorn
import os
from pathlib import Path

if __name__ == "__main__":
    print("🚀 Starting Gomoku Backend Server...")
    print("Backend will be available at: http://localhost:8000")
    print("API Documentation at: http://localhost:8000/docs")
    print("Press Ctrl+C to stop the server")
    print()

    # Mudar para o diretório do script
    script_dir = Path(__file__).parent
    os.chdir(script_dir)

    # Executar o servidor
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )