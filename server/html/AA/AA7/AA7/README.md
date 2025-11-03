# Gomoku - Projeto Web UFSC

## 🎯 Sobre o Projeto

Este projeto implementa um jogo **Gomoku** (também conhecido como Five in a Row) como parte do Projeto Web da disciplina INE5646 - Programação para Web da UFSC. O jogo permite dois modos: jogador vs jogador (PvP) e jogador vs inteligência artificial (PvE).

Atualmente, o projeto conta com uma implementação base em Python (console) que será expandida para uma aplicação web completa seguindo os requisitos da disciplina.

## 🎮 Sobre o Gomoku

Gomoku é um jogo de estratégia para dois jogadores jogado em um tabuleiro de 19x19. O objetivo é ser o primeiro a formar uma linha ininterrupta de cinco peças da sua cor - horizontalmente, verticalmente ou diagonalmente.

### Regras Básicas:
- Tabuleiro 19x19
- Dois jogadores alternando turnos
- Peças pretas (Jogador 1) começam
- Primeiro a formar 5 em linha vence
- Sem remoção de peças após colocadas

## 🏗️ Arquitetura Atual

### Backend (Python - Base Atual)
```
backend/
├── main.py      # Loop principal do jogo e inicialização
├── admin.py     # Lógica do jogo (tabuleiro, validações, vitória)
├── player.py    # Classe Player e interações
├── symbols.py   # Símbolos Unicode para o tabuleiro
└── README.md    # Documentação atual do backend
```

**Principais Classes:**
- **Admin**: Gerencia o tabuleiro, validações de movimento e verificações de vitória
- **Player**: Representa jogadores humanos e IA
- **Símbolos**: Define caracteres Unicode para visualização do tabuleiro

## 🚀 Roadmap de Desenvolvimento

### Fase 1: Modernização do Backend ✅
- [x] Migração para FastAPI
- [x] Implementação de API RESTful
- [x] Integração com MongoDB
- [x] Sistema de autenticação JWT
- [x] WebSocket para comunicação em tempo real

### Fase 2: Frontend Moderno ✅
- [x] Aplicação React + TypeScript
- [x] Interface responsiva (desktop/mobile)
- [x] Temas light/dark
- [x] Sistema de salas/lobby

### Fase 3: Recursos Avançados
- [ ] Chat em tempo real
- [ ] Videochat com WebRTC
- [ ] Sistema de ranking
- [ ] Gravação de partidas (FFMPEG)
- [ ] Bot inteligente aprimorado

## 🛠️ Stack Tecnológica Planejada

### Backend
- **FastAPI** - Framework web moderno e rápido
- **MongoDB** - Banco de dados NoSQL (obrigatório pelo projeto)
- **WebSocket** - Comunicação em tempo real
- **JWT** - Autenticação segura
- **FFMPEG** - Gravação de vídeo das partidas

### Frontend
- **React** - Biblioteca para interfaces de usuário
- **TypeScript** - Linguagem tipada baseada em JavaScript
- **Tailwind CSS** - Framework CSS utilitário
- **Socket.io** - Cliente WebSocket
- **WebRTC** - Videochat peer-to-peer

### DevOps & Segurança
- **HTTPS** - Protocolo seguro obrigatório
- **CORS** - Configuração de origem cruzada
- **Helmet.js** - Headers de segurança
- **Rate Limiting** - Proteção contra spam
- **Input Sanitization** - Prevenção de injeção

## 🔧 Instalação e Execução

### Modo Produção
```bash
# Clone o repositório
git clone https://github.com/Coelho50/Gomoku.git
cd Gomoku

# Execute em modo produção
docker-compose up -d
```

### Modo Desenvolvimento
```bash
# Execute com MongoDB Admin Interface
docker-compose --profile debug up

# Ou usando o script PowerShell
.\dev.ps1
```

### Modo Debug (Para Desenvolvimento)
```bash
# Execute em modo debug completo (com debugger Python)
docker-compose -f docker-compose.yml -f docker-compose.debug.yml up

# Ou usando o script PowerShell
.\debug.ps1
```

#### Portas em Modo Debug:
- **Frontend**: http://localhost:9001
- **Backend API**: http://localhost:9000
- **MongoDB Admin**: http://localhost:8081 (admin/admin)
- **Python Debugger**: Port 5678
- **React DevTools**: Port 9009

### Versão Console (Legacy)
```bash
# Execute o jogo console
cd backend
python main.py
```
# Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app:app --host 0.0.0.0 --port 8000 --reload

# Frontend
cd frontend
npm install
npm start

# MongoDB
docker-compose up -d mongodb
```

## 📋 Requisitos do Projeto UFSC

### ✅ Requisitos Implementados
- [x] Lógica base do jogo Gomoku
- [x] Modo PvP (jogador vs jogador)
- [x] Modo PvE (jogador vs IA básica)
- [x] Validação de movimentos
- [x] Verificação de condições de vitória

### ✅ Implementado
- [x] **Aplicação Web** (Backend + Frontend)
- [x] **Padrão MVC** (FastAPI + React)
- [x] **MongoDB** (obrigatório)
- [x] **Interface Responsiva**
- [x] **Sistema de Autenticação** (JWT)
- [x] **Chat em tempo real** (WebSocket)

### 🔄 Em Desenvolvimento
- [ ] **HTTPS** (Deploy VPS-UFSC)
- [ ] **Videochat com WebRTC**
- [ ] **Sistema de Ranking**
- [ ] **Gravação de Partidas**

### 🔒 Aspectos de Segurança
- [ ] Proteção contra XSS
- [ ] Proteção contra CSRF  
- [ ] Validação de entrada
- [ ] Sanitização de dados
- [ ] Rate limiting
- [ ] Headers de segurança

## 🎯 Funcionalidades Planejadas

### Core Game
- [x] Tabuleiro 19x19 interativo
- [x] Validação de movimentos
- [x] Detecção de vitória (5 em linha)
- [x] Sistema de turnos em tempo real
- [x] WebSocket para sincronização
- [ ] Reconexão automática

### Multiplayer
- [x] Sistema de salas/lobby
- [x] Criação e entrada em jogos
- [x] API RESTful para gerenciamento
- [ ] Fila de jogadores
- [ ] Matchmaking automático
- [ ] Espectadores

### Social
- [ ] Perfis de usuário
- [ ] Sistema de amigos
- [ ] Histórico de partidas
- [ ] Rankings globais
- [ ] Compartilhamento de partidas

### Media
- [ ] Chat de texto
- [ ] Videochat opcional
- [ ] Gravação automática de partidas
- [ ] Player de vídeo integrado
- [ ] Upload de avatares

## 👥 Contribuição

Este é um projeto acadêmico da UFSC. Para contribuir:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é desenvolvido para fins acadêmicos na UFSC.

## 🔗 Links Úteis

- [Documentação do Projeto (UFSC)](docs/projeto.md)
- [Atividades e Entregas](docs/atividades.md)
- [Repositório GitHub](https://github.com/Coelho50/Gomoku)

## 📞 Contato

Projeto desenvolvido como parte da disciplina INE5646 - Programação para Web, UFSC.

---

**Data de Entrega:** 25/11/2025 às 20:20  
**Modalidade:** Grupo de 2 integrantes  
**Servidor:** VPS-UFSC (24/7 obrigatório)
