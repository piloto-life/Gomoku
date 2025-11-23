# 📋 TODO List - Projeto Web Gomoku (Completo)

**Data de Entrega**: 25/11/2025 [20:20]  
**Disciplina**: INE5646 - Programação para Web  
**Grupo**: [Número do Grupo]

---

## 🎯 Status Geral do Projeto

### ✅ Completado
- [x] Sistema de design responsivo completo
- [x] Front-end React com TypeScript
- [x] Backend FastAPI com Python
- [x] MongoDB configurado
- [x] Autenticação de usuários
- [x] Jogo PvP Local funcional
- [x] Jogo PvE (vs Bot) funcional
- [x] Jogo PvP Online com WebSocket
- [x] Chat em tempo real
- [x] Padrão MVC implementado

### 🔄 Em Progresso
- [ ] Deploy no VPS-UFSC (HTTPS 24/7)
- [ ] Gravação de partidas com FFMPEG
- [ ] Vídeochat com WebRTC
- [ ] Sistema de ranking completo

### ⏳ Pendente
- [ ] Administração CRUD completa
- [ ] Compartilhamento de vídeos
- [ ] Apresentação em HTML/CSS/JS (reveal.js)
- [ ] Documentação LaTeX completa

---

## 📱 1. REQUISITOS DA APLICAÇÃO WEB

### 1.1 Infraestrutura [Peso: 1.5]

#### ✅ HTTPS & Disponibilização
- [x] Aplicação funcional localmente
- [ ] **Deploy VPS-UFSC** (0.5 pts)
  - [ ] Configurar servidor HTTPS
  - [ ] Certificado SSL válido
  - [ ] Disponibilidade 24/7
  - [ ] Configurar domínio/IP
  - [ ] Testar acessibilidade externa

#### ✅ Padrão MVC
- [x] **MVC implementado** (0.5 pts)
  - [x] Models: `frontend/src/models/`, `backend/models/`
  - [x] Views: Componentes React
  - [x] Controllers: `backend/routers/`
  - [ ] Documentar estrutura no LaTeX
  - [ ] Diagrama MVC no relatório

#### ✅ MongoDB
- [x] **Banco de dados** (1.0 pts)
  - [x] Conexão configurada
  - [x] Collections criadas (users, games)
  - [x] CRUD básico funcionando
  - [ ] Otimizar indexes
  - [ ] Backup automático

---

## 🎨 2. INTERFACE [Peso: 4.5]

### 2.1 Elementos Visuais Básicos [1.125 pts]

#### ✅ Tabuleiro
- [x] Tabuleiro 19x19 responsivo
- [x] Pedras pretas e brancas
- [x] Animações suaves
- [x] Indicador de turno
- [x] Hover preview

#### ✅ Modos de Visualização
- [x] **Light Mode** (0.125 pts)
- [x] **Dark Mode** (0.125 pts)
  - [x] CSS Variables implementadas
  - [x] Toggle funcional
  - [ ] Persistir preferência no BD

#### ✅ Imagem do Usuário
- [x] Avatar padrão
- [x] Upload de imagem
- [ ] **Webcam capture** (0.125 pts)
  - [ ] Implementar captura via WebRTC
  - [ ] Salvar avatar do snapshot
- [ ] **Opção exibir/ocultar** (0.125 pts)
  - [ ] Toggle no profile
  - [ ] Configuração persistida

#### ⏳ Fila de Jogadores
- [x] Lista de jogadores online
- [ ] **Exibir/Ocultar fila** (0.125 pts)
  - [ ] Toggle button
  - [ ] Animação suave
- [x] Status de jogadores (ativo/aguardando)

### 2.2 Comunicação em Tempo Real [1.375 pts]

#### ⏳ Vídeochat
- [ ] **WebRTC Vídeochat** (0.500 pts)
  - [ ] Configurar servidor STUN/TURN
  - [ ] Implementar signaling via WebSocket
  - [ ] Peer-to-peer connection
  - [ ] Apenas 2 jogadores em partida
  - [ ] UI para minimizar/expandir
  
- [ ] **Controles de Áudio** (0.375 pts)
  - [ ] Áudio do vídeochat (0.125 pts)
    - [ ] Mute individual
    - [ ] Volume control
  - [ ] Áudio geral (0.125 pts)
    - [ ] Master volume
    - [ ] Mute global
  - [ ] Efeitos sonoros (0.125 pts)
    - [ ] Som ao colocar pedra
    - [ ] Som de vitória
    - [ ] Som de derrota
    - [ ] Toggle on/off

#### ✅ Chat Escrito
- [x] **Chat implementado** (0.500 pts)
  - [x] WebSocket em tempo real
  - [x] Mensagens persistidas
  - [x] Histórico de mensagens
- [ ] **Seleção de destinatários** (0.250 pts)
  - [x] Jogadores ativos (2 em partida) (0.125 pts)
  - [ ] Chat geral (todos jogadores) (0.125 pts)
    - [ ] Tabs para alternar
    - [ ] Contador de não lidas

### 2.3 Persistência e Ranking [0.875 pts]

#### ⏳ Sistema de Pontuação
- [x] Pontuação básica (vitória/derrota)
- [ ] **Rank completo** (0.250 pts)
  - [ ] Nome, data/hora, oponente
  - [ ] Ordenação por pontos
  - [ ] Paginação
  - [ ] Filtros (período, oponente)
  
- [ ] **High Score** (0.125 pts)
  - [ ] Top 10 jogadores
  - [ ] Atualização em tempo real
  - [ ] Exibição no lobby

#### ⏳ Gravação de Partidas
- [ ] **FFMPEG Recording** (0.500 pts)
  - [ ] Instalar FFMPEG no servidor
  - [ ] Captura de tela da partida
  - [ ] Configurações:
    - [ ] Vídeo WebM
    - [ ] Bitrate: 4 Mbit/s (configurável)
    - [ ] FPS: 24 (configurável)
    - [ ] Áudio: 128 kbit/s, stereo, 44100Hz
  - [ ] Área de gravação:
    - [ ] Tabuleiro + pontuação [default]
    - [ ] Full screen (opcional)
  - [ ] Armazenar no MongoDB GridFS
  - [ ] Link compartilhável
  - [ ] Player HTML5 simples

### 2.4 Modos de Jogo [0.250 pts]

#### ✅ Implementação
- [x] **Bot (PvE)** (0.125 pts)
  - [x] IA básica funcional
  - [x] Níveis de dificuldade
  
- [x] **Humanos (PvP)** (0.125 pts)
  - [x] Local (2 jogadores, 1 tela)
  - [x] Online (WebSocket)
  - [x] Fila de espera

#### ⏳ Seleção de Jogadores
- [x] Lista de jogadores disponíveis
- [ ] **Confirmação de início** (0.250 pts)
  - [ ] Botão "Aceitar partida"
  - [ ] Timeout de 30s
  - [ ] Recusar convite
  - [ ] Notificação ao oponente

### 2.5 Compartilhamento [0.125 pts]

- [x] Dados de partida básicos
- [ ] **Compartilhamento completo** (0.125 pts)
  - [ ] URL única por partida
  - [ ] Player de vídeo embutido
  - [ ] Estatísticas da partida
  - [ ] Compartilhar via redes sociais
  - [ ] Embed code

---

## 🔧 3. ADMINISTRADOR [1.125 pts]

### 3.1 CRUD Completo [0.750 pts]

#### ⏳ Gerenciamento de Usuários
- [x] Listar usuários (Read)
- [x] Criar usuários (Create)
- [x] Atualizar dados (Update)
- [ ] **Banir/Excluir** (0.250 pts - Delete)
  - [ ] Interface admin
  - [ ] Confirmação de exclusão
  - [ ] Logs de ações admin
  - [ ] Restaurar usuário banido

#### ⏳ Gerenciamento de Recursos
- [ ] **Avatares Default** (0.125 pts)
  - [ ] Upload de novos avatares
  - [ ] Listagem de disponíveis
  - [ ] Editar/remover
  - [ ] Categorização

- [ ] **Jogadores Online** (0.250 pts)
  - [ ] Tempo de inatividade (0.125 pts)
    - [ ] Config: default 60s
    - [ ] Auto-kick após timeout
    - [ ] Notificação ao jogador
  - [ ] Tamanho da fila (0.125 pts)
    - [ ] Config: default 25
    - [ ] Mensagem quando cheia
    - [ ] Priorização (ranking/tempo)

- [ ] **Limites de Armazenamento** (0.125 pts)
  - [ ] Vídeos: 15 dias (default)
  - [ ] Size: 1 GB (default)
  - [ ] Auto-delete de vídeos antigos
  - [ ] Notificar usuário antes de deletar

---

## 👤 4. USUÁRIO [1.000 pts]

### 4.1 Cadastro e Autenticação [0.625 pts]

#### ✅ Cadastro Básico
- [x] **Campos obrigatórios** (0.125 pts)
  - [x] Nome (nickname)
  - [x] Senha (hash bcrypt)
  - [x] Email

#### ⏳ Cadastro Completo
- [ ] **Dados pessoais** (0.250 pts)
  - [ ] Idade
  - [ ] Local:
    - [ ] Cidade
    - [ ] Estado
    - [ ] País (autocomplete)
  
- [x] **Avatar** (0.125 pts)
  - [x] Upload de arquivo
  - [ ] Webcam capture
  - [x] URL externa
  - [ ] Crop/resize

- [x] **Autenticação** (0.500 pts)
  - [x] Login seguro
  - [x] JWT tokens
  - [x] Refresh tokens
  - [x] Logout

#### ✅ Atualização de Dados
- [x] Editar perfil
- [x] Mudar senha
- [ ] Mudar avatar via webcam

### 4.2 Dados Armazenados [0.250 pts]

#### ✅ Histórico de Partidas
- [x] Data/hora
- [x] Nome do oponente
- [x] Pontuação
- [ ] **Vídeo (gravação)** (0.125 pts)
  - [ ] Link para vídeo no GridFS
  - [ ] Thumbnail
  - [ ] Duração
  - [ ] Tamanho do arquivo

- [ ] **Outros dados** (0.125 pts)
  - [ ] Duração da partida
  - [ ] Número de jogadas
  - [ ] Abertura utilizada
  - [ ] Maior sequência

### 4.3 Compartilhamento [0.125 pts]

- [ ] **Compartilhar dados** (0.125 pts)
  - [ ] Pontuação com amigos
  - [ ] URL do vídeo
  - [ ] Estatísticas
  - [ ] Social share buttons

---

## 🔒 5. SEGURANÇA [0.500 pts]

### 5.1 Proteção contra Ataques [0.250 pts]

#### ⏳ XSS (Cross-Site Scripting)
- [x] Sanitização de inputs React
- [ ] Content Security Policy (CSP)
- [ ] Validação de HTML no chat
- [ ] Escape de caracteres especiais

#### ⏳ CSRF (Cross-Site Request Forgery)
- [ ] CSRF tokens
- [ ] SameSite cookies
- [ ] Origin validation

#### ✅ Injeção de Código
- [x] Prepared statements (MongoDB)
- [x] Validação de entrada (Pydantic)
- [ ] Rate limiting
- [ ] Input sanitization completa

### 5.2 Proteção de Dados [0.250 pts]

#### ✅ Dados Sensíveis
- [x] Senhas com bcrypt
- [x] HTTPS (pending deploy)
- [ ] Criptografia de dados sensíveis
- [ ] Tokens seguros

#### ⏳ Testes de Segurança
- [ ] **Testes de vulnerabilidade** (0.125 pts)
  - [ ] OWASP ZAP scan
  - [ ] Penetration testing
  - [ ] Relatório de vulnerabilidades
  
- [ ] **Soluções implementadas** (0.125 pts)
  - [ ] Documentar no LaTeX
  - [ ] Demonstrar na apresentação
  - [ ] Logs de segurança

---

## 📝 6. ESCRITA DO PROJETO (EP) [10.0 pts]

### 6.1 Documento LaTeX [8.50 pts]

#### ⏳ Estrutura Básica [4.00 pts]
- [ ] **Template IEEEtran** (1.00 pts)
  - [ ] Baixar template UFSC
  - [ ] Configurar estrutura
  - [ ] Compilar corretamente

- [ ] **Cabeçalho** (0.75 pts)
  - [ ] Título (0.25 pts)
  - [ ] Autores (0.25 pts)
  - [ ] Departamento/Instituição (0.25 pts)

- [ ] **Resumo** (0.25 pts)
  - [ ] Abstract em inglês
  - [ ] 150-250 palavras
  - [ ] Objetivo, métodos, resultados

- [ ] **Introdução** (1.25 pts)
  - [ ] Motivação (0.25 pts)
  - [ ] Problema (0.25 pts)
  - [ ] Trabalhos relacionados (0.25 pts)
    - [ ] Pelo menos 3 trabalhos
    - [ ] Comparação detalhada
  - [ ] Contribuição (0.25 pts)
  - [ ] Organização do trabalho (0.25 pts)

- [ ] **Fundamentação Teórica** (0.50 pts)
  - [ ] WebSockets
  - [ ] React & TypeScript
  - [ ] FastAPI & Python
  - [ ] MongoDB
  - [ ] WebRTC (se implementado)
  - [ ] Referências científicas

- [ ] **Materiais e Métodos** (1.00 pts)
  - [ ] Metodologia (0.25 pts)
  - [ ] Código principal (0.25 pts)
    - [ ] Usar package `listings`
    - [ ] Numeração de linhas
  - [ ] Roteiro de pacotes (0.25 pts)
    - [ ] requirements.txt
    - [ ] package.json
  - [ ] Roteiro de instalação (0.25 pts)
    - [ ] Passo a passo detalhado
    - [ ] Screenshots

#### ⏳ Resultados e Conclusão [3.00 pts]
- [ ] **Resultados** (1.75 pts)
  - [ ] DOM (0.25 pts)
    - [ ] Árvore de componentes
    - [ ] Diagrama
  - [ ] MVC (0.25 pts)
    - [ ] Diagrama de arquitetura
    - [ ] Fluxo de dados
  - [ ] Screenshots (0.50 pts)
    - [ ] Todas as telas
    - [ ] Responsividade
  - [ ] Segurança (0.50 pts)
    - [ ] Testes (0.25 pts)
    - [ ] Soluções (0.25 pts)
  - [ ] Discussão (0.25 pts)

- [ ] **Conclusão** (0.50 pts)
  - [ ] Objetivos alcançados
  - [ ] Dificuldades encontradas
  - [ ] Trabalhos futuros

- [ ] **Referências** (0.50 pts)
  - [ ] Formato IEEE
  - [ ] Pelo menos 10 referências
  - [ ] Todas citadas no texto

- [ ] **Apêndices/Anexos** (0.75 pts)
  - [ ] Código completo (0.50 pts)
    - [ ] Package `listings`
    - [ ] Código próprio
  - [ ] Link GitHub (0.25 pts)
    - [ ] README.md completo
    - [ ] Documentação

### 6.2 Entrega EP [1.50 pts]
- [ ] **PDF gerado** (0.50 pts)
  - [ ] Nome: `grupo#_te.pdf`
  - [ ] Sem erros de compilação

- [ ] **Código LaTeX** (0.50 pts)
  - [ ] Nome: `grupo#_te_latex.zip`
  - [ ] Todos .tex, .bib, imagens

- [ ] **Código da aplicação** (1.00 pts)
  - [ ] Nome: `grupo#_deploy.zip`
  - [ ] Frontend completo
  - [ ] Backend completo
  - [ ] README.md
  - [ ] docker-compose.yml (opcional)

---

## 🎤 7. APRESENTAÇÃO (AP) [10.0 pts]

### 7.1 Website de Apresentação [9.00 pts]

#### ⏳ Framework reveal.js [1.00 pts]
- [ ] **Configuração** (0.50 pts)
  - [ ] reveal.js configurado
  - [ ] Tema adequado (claro, visível em datashow)
  - [ ] Transições suaves

- [ ] **Deploy VPS-UFSC** (0.50 pts)
  - [ ] HTTPS funcional
  - [ ] Acessível 24/7
  - [ ] URL no campo de texto da tarefa

#### ⏳ Conteúdo da Apresentação [8.00 pts]

**Slide 1: Introdução** (0.50 pts)
- [ ] Título do projeto
- [ ] Integrantes
- [ ] Curso/Disciplina

**Slides 2-3: Teoria** (0.50 pts)
- [ ] Conceitos de forma sucinta
- [ ] Tecnologias utilizadas
- [ ] Arquitetura MVC

**Slides 4-8: Código** (2.00 pts)
- [ ] Principais trechos
- [ ] Explicação clara
- [ ] Syntax highlighting
- [ ] Links para repositório

**Slides 9-15: Demonstração** (4.00 pts)
- [ ] Autenticação (0.50 pts)
- [ ] Cadastro (0.50 pts)
- [ ] Backend/BD (0.50 pts)
- [ ] Funcionalidades principais (1.00 pts)
  - [ ] Criar jogo
  - [ ] Jogar partida completa
  - [ ] Chat
  - [ ] Gravação (se implementado)
- [ ] Compartilhamento (0.50 pts)
- [ ] Segurança (0.50 pts)
  - [ ] Demonstrar proteções
  - [ ] Resultados de testes
- [ ] Screenshots/vídeos (0.50 pts)

**Slide 16: Conclusão** (0.50 pts)
- [ ] Resultados obtidos
- [ ] Dificuldades
- [ ] Próximos passos

**Slide 17: Q&A** (0.50 pts)
- [ ] Perguntas e respostas

### 7.2 Recursos Especiais [0.50 pts]
- [ ] **Embed da aplicação** (0.25 pts)
  - [ ] `<iframe>` com demo ao vivo
  - [ ] Links diretos para features

- [ ] **Interatividade** (0.25 pts)
  - [ ] Navegação entre slides
  - [ ] Code snippets executáveis
  - [ ] Demonstração ao vivo

### 7.3 Entrega AP [0.50 pts]
- [ ] **Website compactado** (0.50 pts)
  - [ ] Nome: `grupo#_ap.zip`
  - [ ] index.html
  - [ ] Todos assets (CSS, JS, imagens)
  - [ ] URL no campo de texto da tarefa

---

## 📊 8. CHECKLIST DE REQUISITOS CRÍTICOS

### Obrigatórios para Aprovação
- [ ] ✅ Deploy VPS-UFSC HTTPS 24/7
- [ ] ✅ MongoDB funcionando
- [ ] ✅ Padrão MVC documentado
- [ ] ✅ Front-end responsivo
- [ ] ✅ Autenticação segura
- [ ] ✅ Chat em tempo real
- [ ] ✅ Modos de jogo funcionais
- [ ] ✅ LaTeX compilando sem erros
- [ ] ✅ Apresentação reveal.js online
- [ ] ✅ Código no GitHub

### Diferenciais (Pontuação Extra)
- [ ] 🌟 Vídeochat WebRTC
- [ ] 🌟 Gravação FFMPEG
- [ ] 🌟 Sistema de ranking avançado
- [ ] 🌟 IA forte no bot
- [ ] 🌟 Interface excepcional
- [ ] 🌟 Performance otimizada
- [ ] 🌟 Testes automatizados
- [ ] 🌟 CI/CD configurado

---

## 📅 9. CRONOGRAMA SUGERIDO

### Semana 1-2 (Até 08/11)
- [ ] Deploy VPS-UFSC configurado
- [ ] HTTPS funcionando
- [ ] MongoDB em produção

### Semana 3-4 (Até 15/11)
- [ ] Vídeochat implementado
- [ ] Gravação FFMPEG funcional
- [ ] Sistema de ranking completo
- [ ] Administração CRUD

### Semana 5 (Até 20/11)
- [ ] LaTeX 80% completo
- [ ] Apresentação reveal.js 80% completa
- [ ] Testes de segurança
- [ ] Otimizações finais

### Semana 6 (Até 25/11 20:20)
- [ ] LaTeX 100%
- [ ] Apresentação 100%
- [ ] Testes finais
- [ ] **ENTREGA**

---

## 🎯 10. PONTUAÇÃO ATUAL

### EP (Escrita) - Meta: 10.0 pts
- ✅ Completado: ~3.0 pts
- 🔄 Em progresso: ~2.0 pts
- ⏳ Pendente: ~5.0 pts

### AP (Apresentação) - Meta: 10.0 pts
- ✅ Completado: ~4.0 pts
- 🔄 Em progresso: ~2.0 pts
- ⏳ Pendente: ~4.0 pts

### Total Estimado: ~11.0 / 20.0 pts (55%)
**Meta: 18.0+ / 20.0 pts (90%+)**

---

## 📝 Notas Importantes

1. **Deploy é OBRIGATÓRIO**: Sem VPS-UFSC HTTPS 24/7, zero em EP e AP
2. **LaTeX é obrigatório**: Não aceita Word, Google Docs, etc.
3. **reveal.js é obrigatório**: Apresentação deve ser HTML/CSS/JS
4. **MongoDB é obrigatório**: Não pode usar outro banco
5. **Prazo é FATAL**: 25/11/2025 às 20:20 - sem prorrogação

---

## ✅ Próximas Ações Prioritárias

### Urgente (Esta Semana)
1. [ ] Configurar VPS-UFSC
2. [ ] Deploy com HTTPS
3. [ ] Testar acesso externo
4. [ ] Iniciar LaTeX

### Importante (Próxima Semana)
1. [ ] Implementar vídeochat
2. [ ] Gravação com FFMPEG
3. [ ] Sistema de ranking
4. [ ] Continuar LaTeX

### Desejável (Semanas Seguintes)
1. [ ] Polimento UI/UX
2. [ ] Testes de segurança
3. [ ] Apresentação reveal.js
4. [ ] Documentação final

---

**Última Atualização**: 02/11/2025  
**Status**: 🟡 Em Desenvolvimento (55% completo)  
**Próximo Milestone**: Deploy VPS-UFSC

🎮 Bom trabalho! ⚫⚪