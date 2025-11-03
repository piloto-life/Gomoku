# 📋 TO-DO List - Projeto Gomoku Web UFSC

## 🚀 Entregas Principais
- [ ] **EP (Escrita do Projeto)** - 25/11/2025 às 20:20
  - [ ] Arquivo PDF: grupo#_te.pdf
  - [ ] Códigos LaTeX: grupo#_te_latex.zip  
  - [ ] Códigos implementação: grupo#_deploy.zip
  - [ ] URL da aplicação no VPS-UFSC

- [ ] **AP (Apresentação do Projeto)** - 25/11/2025 às 20:20
  - [ ] Website apresentação: grupo#_ap.zip
  - [ ] URL da apresentação no VPS-UFSC
  - [ ] Apresentação HTML/CSS/JS (Reveal.js)

## 🏗️ Backend - FastAPI + MongoDB

### Core API ✅
- [x] **Configurar projeto FastAPI**
  - [x] Estrutura de pastas MVC
  - [x] Configuração de ambiente
  - [x] Dockerfile
  - [x] Requirements.txt

- [x] **Integração MongoDB**
  - [x] Configurar conexão
  - [x] Models de dados (User, Game, Match, etc.)
  - [x] Agregações e queries

- [x] **Sistema de Autenticação**
  - [x] JWT token system
  - [x] Middleware de autenticação
  - [x] Password hashing
  - [ ] Refresh tokens

### Game Logic API ✅
- [x] **Endpoints do jogo**
  - [x] POST /api/games (criar nova partida)
  - [x] GET /api/games/{id} (obter estado da partida)
  - [x] POST /api/games/{id}/move (fazer jogada)
  - [x] GET /api/games/{id}/join (entrar em partida)
  - [x] DELETE /api/games/{id} (deletar partida)

- [x] **WebSocket para tempo real**
  - [x] Conexão de jogadores
  - [x] Sincronização de movimentos
  - [x] Chat em tempo real
  - [x] Sistema de salas

### User Management ✅
- [x] **CRUD de usuários**
  - [x] Cadastro (nome, idade, localização, avatar)
  - [x] Login/logout
  - [x] Atualização de perfil
  - [x] Listagem de usuários

- [ ] **Sistema de ranking**
  - [ ] Pontuação por vitórias
  - [ ] Histórico de partidas
  - [ ] Leaderboard global
  - [ ] Estatísticas detalhadas

## 🎨 Frontend - React + TypeScript

### Setup Inicial ✅
- [x] **Configurar projeto React**
  - [x] Create React App com TypeScript
  - [x] Configurar Tailwind CSS
  - [x] Estrutura de componentes
  - [x] Roteamento (React Router)

- [x] **Estado global**
  - [x] Context API
  - [x] Gerenciamento de usuário logado
  - [x] Estado do jogo
  - [x] WebSocket integration

### Interface Core ✅
- [x] **Tabuleiro do jogo**
  - [x] Componente Board 19x19
  - [x] Componente Piece (peças)
  - [x] Validação visual de jogadas
  - [x] Animações de movimento

- [x] **Sistema de autenticação**
  - [x] Tela de login
  - [x] Tela de cadastro
  - [x] Perfil do usuário
  - [ ] Recuperação de senha

### Game Features ✅
- [x] **Lobby/Salas**
  - [x] Lista de jogadores online
  - [x] Criação de salas
  - [x] Interface de lobby
  - [ ] Fila de espera
  - [ ] Convites para partida

- [x] **Chat System**
  - [x] Chat da partida
  - [x] Interface de chat
  - [ ] Chat global
  - [ ] Moderação básica
  - [ ] Emojis/reações

### Responsividade ✅
- [x] **Design adaptativo**
  - [x] Layout desktop
  - [x] Layout mobile/tablet
  - [x] Temas light/dark
  - [ ] Accessibility (ARIA)

## 🔒 Segurança

### Backend Security
- [ ] **Proteção contra ataques**
  - [ ] Input sanitization
  - [ ] SQL injection prevention (MongoDB)
  - [ ] XSS protection
  - [ ] CSRF protection
  - [ ] Rate limiting

- [ ] **Headers de segurança**
  - [ ] CORS configuration
  - [ ] Security headers
  - [ ] Content Security Policy
  - [ ] HTTPS enforcement

### Frontend Security
- [ ] **Validação client-side**
  - [ ] Form validation
  - [ ] Input sanitization
  - [ ] Token storage seguro
  - [ ] Session management

## 📹 Recursos Avançados

### Video & Audio
- [ ] **WebRTC Integration**
  - [ ] Videochat entre jogadores
  - [ ] Audio chat
  - [ ] Controles de mídia
  - [ ] Qualidade adaptativa

- [ ] **Gravação de partidas (FFMPEG)**
  - [ ] Screen recording
  - [ ] Audio capture
  - [ ] Video compression
  - [ ] Storage no MongoDB
  - [ ] Player de vídeo custom

### Social Features
- [ ] **Sistema de amigos**
  - [ ] Adicionar/remover amigos
  - [ ] Status online/offline
  - [ ] Convites diretos
  - [ ] Chat privado

- [ ] **Compartilhamento**
  - [ ] Share de partidas
  - [ ] Links de replay
  - [ ] Exportar estatísticas
  - [ ] Social media integration

## 🎯 IA/Bot

### Bot Básico
- [ ] **Melhorar IA atual**
  - [ ] Estratégias defensivas
  - [ ] Estratégias ofensivas
  - [ ] Diferentes níveis de dificuldade
  - [ ] Algoritmo minimax

### Bot Avançado
- [ ] **Machine Learning (opcional)**
  - [ ] Treinamento com partidas
  - [ ] Neural networks
  - [ ] Reinforcement learning
  - [ ] API para diferentes bots

## 🖥️ DevOps & Deploy

### Ambiente de Desenvolvimento ✅
- [x] **Docker setup**
  - [x] Backend container
  - [x] Frontend container
  - [x] MongoDB container
  - [x] Docker compose

- [ ] **CI/CD Pipeline**
  - [ ] GitHub Actions
  - [ ] Automated testing
  - [ ] Deploy automático
  - [ ] Environment variables

### Deploy VPS-UFSC
- [ ] **Configuração servidor**
  - [ ] HTTPS certificate
  - [ ] Nginx configuration
  - [ ] PM2 para backend
  - [ ] Static files serving

- [ ] **Monitoramento**
  - [ ] Health checks
  - [ ] Error logging
  - [ ] Performance monitoring
  - [ ] Backup automático

## 📚 Documentação (LaTeX)

### Estrutura do Artigo
- [ ] **Template UFSC configurado**
- [ ] **Título e autores**
- [ ] **Resumo (Abstract)**
- [ ] **Introdução**
  - [ ] Motivação
  - [ ] Problema
  - [ ] Trabalhos relacionados
  - [ ] Contribuição
  - [ ] Organização

- [ ] **Fundamentação teórica**
  - [ ] Conceitos de programação web
  - [ ] Arquitetura MVC
  - [ ] WebSocket e tempo real
  - [ ] Segurança web

- [ ] **Materiais e métodos**
  - [ ] Tecnologias utilizadas
  - [ ] Metodologia de desenvolvimento
  - [ ] Roteiro de instalação
  - [ ] Arquitetura do sistema

- [ ] **Resultados**
  - [ ] Screenshots da aplicação
  - [ ] Árvore DOM
  - [ ] Estrutura MVC implementada
  - [ ] Testes de segurança
  - [ ] Performance

- [ ] **Conclusão**
- [ ] **Referências bibliográficas**
- [ ] **Apêndices com código**

### Apresentação (Reveal.js)
- [ ] **Slides HTML/CSS/JS**
- [ ] **Demo ao vivo**
- [ ] **Aspectos técnicos**
- [ ] **Discussão de segurança**
- [ ] **20 min + 5 min tolerância**

## ✅ Critérios de Avaliação

### Aplicação Web (9.5 pontos)
- [ ] Website 24/7 HTTPS VPS-UFSC (0.5pt)
- [ ] Padrão MVC (0.5pt)
- [ ] Front-end completo (4.375pt)
- [ ] Back-end MongoDB + CRUD (2.125pt)
- [ ] Aspectos de segurança (0.5pt)
- [ ] Apresentação reveal.js (1.0pt)
- [ ] Códigos-fonte postados (0.5pt)

### Trabalho Escrito (10.0 pontos)
- [ ] Template LaTeX UFSC (1.0pt)
- [ ] Estrutura completa (5.75pt)
- [ ] Conteúdo técnico (2.75pt)
- [ ] Arquivos finais (0.5pt)

## 🎯 Prioridades

### Semana 1-2: Setup Base
1. Configurar FastAPI + MongoDB
2. Setup React + TypeScript
3. Autenticação básica
4. Deploy inicial VPS-UFSC

### Semana 3-4: Core Features
1. Tabuleiro funcional
2. WebSocket para tempo real
3. Sistema de salas/lobby
4. Chat básico

### Semana 5-6: Recursos Avançados
1. Videochat WebRTC
2. Gravação FFMPEG
3. Sistema de ranking
4. Testes de segurança

### Semana 7-8: Finalização
1. Documentação LaTeX
2. Apresentação Reveal.js
3. Testes finais
4. Deploy final

## 📅 Cronograma

| Data | Milestone |
|------|-----------|
| 01/09 | Setup inicial + VPS |
| 15/09 | Autenticação + Tabuleiro |
| 01/10 | Multiplayer funcional |
| 15/10 | Chat + WebRTC |
| 01/11 | Gravação + Ranking |
| 15/11 | Documentação LaTeX |
| 20/11 | Apresentação final |
| **25/11** | **ENTREGA FINAL** |

---

**⚠️ IMPORTANTE:** Manter deploy 24/7 no VPS-UFSC durante todo o desenvolvimento!
