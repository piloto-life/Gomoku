# 🧪 Guia de Testes - Funcionalidades Implementadas

## 🎯 Objetivo

Este guia fornece instruções para testar todas as funcionalidades recém-implementadas no projeto Gomoku.

---

## 🔧 Pré-requisitos

### Backend

1. **Instalar dependências atualizadas:**
```powershell
cd backend
pip install -r requirements.txt
```

2. **Iniciar servidor:**
```powershell
python app.py
```

3. **Verificar Swagger UI:**
```
http://localhost:8000/docs
```

### Frontend

1. **Instalar dependências (se necessário):**
```powershell
cd frontend
npm install
```

2. **Iniciar desenvolvimento:**
```powershell
npm start
```

3. **Abrir aplicação:**
```
http://localhost:3000
```

---

## 📹 Teste 1: Gravação de Partidas

### Backend API

**1. Iniciar gravação via API:**
```bash
curl -X POST http://localhost:8000/api/recordings/start \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"game_id": "test_game_123", "width": 1920, "height": 1080}'
```

**2. Verificar status:**
```bash
curl http://localhost:8000/api/recordings/status/test_game_123 \
  -H "Authorization: Bearer SEU_TOKEN"
```

**3. Parar gravação:**
```bash
curl -X POST http://localhost:8000/api/recordings/stop/test_game_123 \
  -H "Authorization: Bearer SEU_TOKEN"
```

**4. Listar gravações:**
```bash
curl http://localhost:8000/api/recordings/list \
  -H "Authorization: Bearer SEU_TOKEN"
```

**5. Ver vídeo no navegador:**
```
http://localhost:8000/api/recordings/video/VIDEO_ID_AQUI
```

### Frontend

**1. Adicionar componente ao Game.tsx:**

```tsx
import VideoRecorder from '../components/VideoRecorder';

// Dentro do componente Game:
<VideoRecorder 
  gameId={gameId}
  onRecordingStart={() => console.log('Gravação iniciada')}
  onRecordingStop={(url) => console.log('Vídeo salvo:', url)}
/>
```

**2. Testar no jogo:**
- Iniciar partida
- Clicar em "Gravar Partida"
- Fazer algumas jogadas
- Clicar em "Parar"
- Aguardar upload (barra de progresso)
- Verificar alert de sucesso

**3. Console do navegador deve mostrar:**
```
Gravação iniciada
Vídeo gravado: 1234567 bytes
Upload concluído: 507f1f77bcf86cd799439011
```

---

## 📞 Teste 2: Videochat WebRTC

### Backend API

**1. Obter configuração STUN/TURN:**
```bash
curl http://localhost:8000/api/webrtc/config
```

**Resposta esperada:**
```json
{
  "iceServers": [
    {"urls": "stun:stun.l.google.com:19302"},
    {"urls": "stun:stun1.l.google.com:19302"}
  ]
}
```

**2. Iniciar chamada:**
```bash
curl -X POST http://localhost:8000/api/webrtc/call/initiate \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"callee_id": "USER_ID_OPONENTE", "room_id": "game_123"}'
```

**3. Aceitar chamada:**
```bash
curl -X POST http://localhost:8000/api/webrtc/call/accept \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"room_id": "game_123"}'
```

**4. Verificar chamadas ativas:**
```bash
curl http://localhost:8000/api/webrtc/call/active \
  -H "Authorization: Bearer SEU_TOKEN"
```

### Frontend

**1. Adicionar componente ao Game.tsx:**

```tsx
import VideoChat from '../components/VideoChat';

// Dentro do componente Game:
<VideoChat 
  gameId={gameId}
  opponentId={opponent.id}
  currentUserId={currentUser.id}
/>
```

**2. Testar com 2 navegadores:**

**Navegador 1 (Chrome):**
- Fazer login como User1
- Entrar em partida online
- Clicar "Iniciar Vídeo"
- Permitir acesso câmera/microfone

**Navegador 2 (Firefox):**
- Fazer login como User2
- Entrar na mesma partida
- Deve aparecer "Recebendo chamada..."
- Vídeo conecta automaticamente

**3. Testar controles:**
- ✅ Mute (🎤) - áudio deve silenciar
- ✅ Câmera (📹) - vídeo deve desligar
- ✅ Minimizar (🔽) - janela deve reduzir
- ✅ Expandir (🔼) - janela deve aumentar
- ✅ Encerrar (❌) - chamada deve terminar

**4. Console deve mostrar:**
```
WebSocket conectado
Chamada iniciada
Oferta criada e enviada
Resposta recebida
Peers conectados!
```

---

## 🏆 Teste 3: Sistema de Ranking

### Backend API

**1. Ver leaderboard:**
```bash
curl http://localhost:8000/api/ranking/leaderboard?limit=10
```

**Resposta esperada:**
```json
{
  "total": 10,
  "players": [
    {
      "user_id": "...",
      "username": "Player1",
      "elo_rating": 1456,
      "rank_position": 1,
      "rank_tier": "Ouro",
      "wins": 25,
      "losses": 10,
      "win_rate": 0.714
    }
  ]
}
```

**2. Ver minhas estatísticas:**
```bash
curl http://localhost:8000/api/ranking/me \
  -H "Authorization: Bearer SEU_TOKEN"
```

**3. Ver histórico de partidas:**
```bash
curl http://localhost:8000/api/ranking/history?limit=20 \
  -H "Authorization: Bearer SEU_TOKEN"
```

**4. Ver gráfico de ELO:**
```bash
curl http://localhost:8000/api/ranking/history/elo/USER_ID?days=30
```

**5. Estatísticas globais:**
```bash
curl http://localhost:8000/api/ranking/stats/global
```

**Resposta esperada:**
```json
{
  "total_players": 150,
  "active_players": 45,
  "total_games": 532,
  "avg_elo": 1234.5,
  "tier_distribution": {
    "Bronze": 50,
    "Prata": 40,
    "Ouro": 30,
    "Platina": 20,
    "Diamante": 8,
    "Mestre": 2
  }
}
```

### Testar Atualização Automática

**1. Jogar partida online:**
- User1 vs User2
- Finalizar jogo (vitória de User1)

**2. Verificar console backend:**
```
Ranking atualizado - User1: 1200 -> 1216 (+16), User2: 1200 -> 1184 (-16)
```

**3. Buscar novamente o ranking:**
```bash
curl http://localhost:8000/api/ranking/me \
  -H "Authorization: Bearer USER1_TOKEN"
```

**Deve mostrar novo ELO:**
```json
{
  "elo_rating": 1216,
  "wins": 1,
  "losses": 0
}
```

---

## ⚙️ Teste 4: Painel Admin

### Verificar Permissão

**1. Tornar usuário admin (MongoDB):**
```javascript
// MongoDB Compass ou CLI
db.users.updateOne(
  { username: "admin" },
  { $set: { is_admin: true } }
)
```

### Backend API

**1. Dashboard:**
```bash
curl http://localhost:8000/api/admin/stats/dashboard \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Resposta esperada:**
```json
{
  "users": {
    "total": 150,
    "active": 120,
    "banned": 5,
    "admins": 2,
    "new_this_week": 10
  },
  "games": {
    "total": 500,
    "active": 12,
    "this_week": 45
  },
  "recordings": {
    "total": 23,
    "total_size_mb": 1250.5
  }
}
```

**2. Listar usuários:**
```bash
curl "http://localhost:8000/api/admin/users?page=1&per_page=10" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**3. Buscar usuário:**
```bash
curl "http://localhost:8000/api/admin/users?search=player" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**4. Editar usuário:**
```bash
curl -X PUT http://localhost:8000/api/admin/users/USER_ID \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_admin": true}'
```

**5. Banir usuário:**
```bash
curl -X POST http://localhost:8000/api/admin/users/USER_ID/ban \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Violação de regras", "duration_hours": 24}'
```

**6. Upload de avatar:**
```bash
curl -X POST http://localhost:8000/api/admin/avatars \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -F "name=avatar_novo" \
  -F "file=@/path/to/image.png"
```

**7. Atualizar configurações:**
```bash
curl -X PUT http://localhost:8000/api/admin/config \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"max_video_size_mb": 1000, "maintenance_mode": false}'
```

---

## 🔗 Teste 5: Compartilhamento de Vídeos

### Obter URL de Vídeo

**1. Listar vídeos:**
```bash
curl http://localhost:8000/api/recordings/list \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Resposta:**
```json
[
  {
    "id": "...",
    "game_id": "game_123",
    "video_id": "507f1f77bcf86cd799439011",
    "url": "/api/recordings/video/507f1f77bcf86cd799439011",
    "file_size": 5242880,
    "started_at": "2025-11-02T10:30:00",
    "finished_at": "2025-11-02T10:45:00"
  }
]
```

**2. Compartilhar URL:**
```
http://localhost:8000/api/recordings/video/507f1f77bcf86cd799439011
```

**3. Testar no navegador:**
- Copiar URL
- Colar em nova aba
- Vídeo deve tocar automaticamente

**4. Testar download:**
```bash
curl http://localhost:8000/api/recordings/video/507f1f77bcf86cd799439011 \
  --output game_replay.webm
```

**5. Verificar arquivo:**
```powershell
# Windows
Get-ChildItem game_replay.webm
ffprobe game_replay.webm  # Se FFMPEG instalado
```

---

## 🧪 Testes de Integração

### Cenário Completo: Partida com Todos Recursos

**Setup:**
- 2 usuários logados
- 2 navegadores diferentes
- Backend rodando
- MongoDB conectado

**Passos:**

1. **User1: Criar partida online**
   - Lobby → Criar Jogo
   - Modo: PvP Online

2. **User2: Entrar na partida**
   - Lobby → Ver Jogos Disponíveis
   - Entrar no jogo de User1

3. **User1: Iniciar videochat**
   - Clicar "Iniciar Vídeo"
   - Permitir câmera/microfone
   - Verificar vídeo local aparece

4. **User2: Aceitar videochat**
   - Popup "Recebendo chamada"
   - Permitir câmera/microfone
   - Verificar ambos vídeos aparecem

5. **User1: Iniciar gravação**
   - Clicar "Gravar Partida"
   - Verificar timer começando

6. **Ambos: Jogar partida**
   - Fazer jogadas alternadas
   - Testar chat (mensagens aparecem)
   - Testar controles videochat (mute, câmera)

7. **User1: Vencer partida**
   - Fazer 5 em linha
   - Verificar modal de vitória

8. **Verificar ranking atualizado:**
   - API: GET /api/ranking/me
   - User1 deve ter ELO maior
   - User2 deve ter ELO menor

9. **User1: Parar gravação**
   - Clicar "Parar"
   - Aguardar upload (100%)
   - Verificar alert "Vídeo gravado com sucesso"

10. **Ambos: Ver vídeo**
    - Listar gravações
    - Abrir URL do vídeo
    - Assistir replay

**Resultado Esperado:**
- ✅ Videochat funcionou durante toda partida
- ✅ Vídeo gravado e disponível
- ✅ Ranking atualizado corretamente
- ✅ Histórico de partida registrado

---

## 🐛 Troubleshooting

### Erro: "Token de autenticação não encontrado"
**Solução:** Fazer login novamente e verificar localStorage
```javascript
// Console do navegador
localStorage.getItem('token')
```

### Erro: "Canvas do jogo não encontrado"
**Solução:** Verificar se GameBoard usa `<canvas>` tag
```tsx
// GameBoard.tsx deve ter:
<canvas ref={canvasRef} width={600} height={600} />
```

### Erro: "Erro ao acessar câmera/microfone"
**Solução:** 
- Permitir permissões no navegador
- Usar HTTPS (localhost funciona em HTTP)
- Verificar se dispositivos estão conectados

### Erro: "MongoDB not connected"
**Solução:**
```powershell
# Verificar se MongoDB está rodando
mongo --eval "db.version()"

# Ou via Docker
docker ps | findstr mongo
```

### Erro: "FFMPEG not found"
**Solução (Windows):**
```powershell
# Instalar via Chocolatey
choco install ffmpeg

# Ou baixar: https://ffmpeg.org/download.html
# Adicionar ao PATH
```

### WebRTC não conecta
**Solução:**
- Verificar console: `pc.connectionState`
- Testar servidores STUN: https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
- Verificar firewall não bloqueia UDP

---

## 📊 Checklist de Testes

### Backend ✅

- [ ] FFMPEG service inicializa
- [ ] WebRTC signaling conecta
- [ ] Ranking calcula ELO corretamente
- [ ] Admin middleware bloqueia não-admin
- [ ] Vídeos podem ser streamados

### Frontend 🔄

- [ ] VideoRecorder captura canvas
- [ ] VideoChat conecta WebRTC
- [ ] Upload de vídeo funciona
- [ ] Controles de áudio/vídeo funcionam

### Integração 🧪

- [ ] Partida completa com videochat
- [ ] Gravação durante jogo
- [ ] Ranking atualiza após jogo
- [ ] Vídeo pode ser assistido depois

---

## ✅ Próximo Passo

Depois de testar tudo localmente, seguir **DEPLOY_VPS_UFSC.md** para fazer deploy em produção.

**Deadline: 25/11/2025 às 20:20**

Boa sorte! 🚀
