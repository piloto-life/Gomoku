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

### Core API
- [ ] **Configurar projeto FastAPI**
  - [ ] Estrutura de pastas MVC
  - [ ] Configuração de ambiente
  - [ ] Dockerfile
  - [ ] Requirements.txt

- [ ] **Integração MongoDB**
  - [ ] Configurar conexão
  - [ ] Models de dados (User, Game, Match, etc.)
  - [ ] Agregações e queries

- [ ] **Sistema de Autenticação**
  - [ ] JWT token system
  - [ ] Middleware de autenticação
  - [ ] Password hashing
  - [ ] Refresh tokens

### Game Logic API
- [ ] **Endpoints do jogo**
  - [ ] POST /api/games (criar nova partida)
  - [ ] GET /api/games/{id} (obter estado da partida)
  - [ ] POST /api/games/{id}/move (fazer jogada)
  - [ ] GET /api/games/{id}/history (histórico de jogadas)

- [ ] **WebSocket para tempo real**
  - [ ] Conexão de jogadores
  - [ ] Sincronização de movimentos
  - [ ] Chat em tempo real
  - [ ] Sistema de salas

### User Management
- [ ] **CRUD de usuários**
  - [ ] Cadastro (nome, idade, localização, avatar)
  - [ ] Login/logout
  - [ ] Atualização de perfil
  - [ ] Exclusão de conta

- [ ] **Sistema de ranking**
  - [ ] Pontuação por vitórias
  - [ ] Histórico de partidas
  - [ ] Leaderboard global
  - [ ] Estatísticas detalhadas

## 🎨 Frontend - React + TypeScript

### Setup Inicial
- [ ] **Configurar projeto React**
  - [ ] Create React App com TypeScript
  - [ ] Configurar Tailwind CSS
  - [ ] Estrutura de componentes
  - [ ] Roteamento (React Router)

- [ ] **Estado global**
  - [ ] Context API ou Redux
  - [ ] Gerenciamento de usuário logado
  - [ ] Estado do jogo
  - [ ] WebSocket integration

### Interface Core
- [ ] **Tabuleiro do jogo**
  - [ ] Componente Board 19x19
  - [ ] Componente Piece (peças)
  - [ ] Validação visual de jogadas
  - [ ] Animações de movimento

- [ ] **Sistema de autenticação**
  - [ ] Tela de login
  - [ ] Tela de cadastro
  - [ ] Perfil do usuário
  - [ ] Recuperação de senha

### Game Features
- [ ] **Lobby/Salas**
  - [ ] Lista de jogadores online
  - [ ] Criação de salas
  - [ ] Fila de espera
  - [ ] Convites para partida

- [ ] **Chat System**
  - [ ] Chat da partida
  - [ ] Chat global
  - [ ] Moderação básica
  - [ ] Emojis/reações

### Responsividade
- [ ] **Design adaptativo**
  - [ ] Layout desktop
  - [ ] Layout mobile/tablet
  - [ ] Temas light/dark
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

### Ambiente de Desenvolvimento
- [ ] **Docker setup**
  - [ ] Backend container
  - [ ] Frontend container
  - [ ] MongoDB container
  - [ ] Docker compose

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
