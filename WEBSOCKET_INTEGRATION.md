# Protocolo WebSocket para Jogos - Gomoku

## Visão Geral

O backend foi revisado para usar protocolo WebSocket durante as partidas de Gomoku, permitindo comunicação em tempo real entre os jogadores.

## Endpoints WebSocket

### Conexão ao Jogo
```
ws://150.162.244.21:8000/ws/game/{game_id}?token={jwt_token}
```

- **Parâmetros:**
  - `game_id`: ID do jogo obtido ao criar/participar de uma partida
  - `token`: Token JWT de autenticação obtido no login

## Tipos de Mensagens

### 1. Mensagens do Cliente para Servidor

#### Fazer Jogada
```json
{
  "type": "move",
  "row": 10,
  "col": 10
}
```

#### Enviar Mensagem de Chat
```json
{
  "type": "chat",
  "message": "Boa jogada!"
}
```

#### Ping (manter conexão ativa)
```json
{
  "type": "ping"
}
```

### 2. Mensagens do Servidor para Cliente

#### Confirmação de Conexão
```json
{
  "type": "connected",
  "message": "Connected to game 12345",
  "game_id": "12345",
  "user": {
    "id": "user123",
    "username": "player1",
    "email": "player@example.com"
  },
  "timestamp": "2025-09-15T10:30:00Z"
}
```

#### Estado Completo do Jogo
```json
{
  "type": "game_state",
  "game_id": "12345",
  "state": {
    "id": "12345",
    "mode": "pvp-online",
    "status": "active",
    "board": [[null, null, ...], ...],
    "current_player": "black",
    "players": {
      "black": {"id": "user123", "username": "player1", "email": "player1@example.com"},
      "white": {"id": "user456", "username": "player2", "email": "player2@example.com"}
    },
    "moves": [
      {"row": 9, "col": 9, "player": "black", "timestamp": "2025-09-15T10:25:00Z"}
    ],
    "created_at": "2025-09-15T10:20:00Z",
    "updated_at": "2025-09-15T10:25:00Z"
  },
  "timestamp": "2025-09-15T10:25:00Z"
}
```

#### Movimento de Jogador
```json
{
  "type": "player_move",
  "game_id": "12345",
  "move": {
    "row": 10,
    "col": 10,
    "player": "black",
    "next_player": "white"
  },
  "from_user": "user123",
  "timestamp": "2025-09-15T10:30:00Z"
}
```

#### Mensagem de Chat
```json
{
  "type": "chat_message",
  "game_id": "12345",
  "data": {
    "user_id": "user123",
    "username": "player1",
    "message": "Boa jogada!",
    "timestamp": "2025-09-15T10:30:00Z"
  },
  "timestamp": "2025-09-15T10:30:00Z"
}
```

#### Desconexão de Jogador
```json
{
  "type": "player_disconnected",
  "game_id": "12345",
  "data": {
    "user_id": "user456",
    "username": "player2",
    "message": "player2 disconnected"
  },
  "timestamp": "2025-09-15T10:35:00Z"
}
```

#### Erro
```json
{
  "type": "error",
  "message": "Invalid move position"
}
```

#### Pong (resposta ao ping)
```json
{
  "type": "pong",
  "timestamp": "2025-09-15T10:30:00Z"
}
```

## Implementação no Frontend

### Hook Personalizado
Criado o hook `useGameWebSocket` que gerencia a conexão WebSocket:

```typescript
const {
  isConnected,
  connectionError,
  sendMove,
  sendChatMessage
} = useGameWebSocket({
  gameId: "12345",
  onMove: (move) => {
    // Atualizar tabuleiro local
  },
  onGameState: (state) => {
    // Sincronizar estado do jogo
  },
  onPlayerDisconnect: (playerId) => {
    // Notificar desconexão
  },
  onChatMessage: (message) => {
    // Exibir mensagem de chat
  },
  onError: (error) => {
    // Mostrar erro
  }
});
```

### Componente Wrapper
O componente `GameWebSocketWrapper` facilita a integração:

```tsx
<GameWebSocketWrapper gameId={gameId} onGameUpdate={updateGameState}>
  <GameBoard />
  <GameChat />
</GameWebSocketWrapper>
```

## Fluxo de uma Partida

1. **Criar/Participar do Jogo**: Usar API HTTP para criar ou entrar em jogo
2. **Conectar WebSocket**: Usar o `game_id` retornado para conectar via WebSocket
3. **Receber Estado**: Servidor envia estado atual do jogo
4. **Fazer Jogadas**: Cliente envia jogadas via WebSocket
5. **Sincronizar**: Outros jogadores recebem atualizações em tempo real
6. **Chat**: Comunicação opcional via WebSocket
7. **Desconexão**: Notificação automática de desconexões

## Autenticação

- Token JWT é obrigatório como query parameter na URL do WebSocket
- Servidor valida o token e verifica se o usuário faz parte do jogo
- Conexão é rejeitada se token for inválido ou usuário não autorizado

## Validações

### Servidor valida:
- Usuário autenticado e autorizado para o jogo
- Posição da jogada é válida (dentro do tabuleiro e posição vazia)
- É a vez do jogador que está fazendo a jogada
- Estado do jogo permite jogadas (jogo ativo)

### Cliente deve:
- Manter conexão ativa com pings periódicos
- Tratar reconexões automáticas em caso de desconexão
- Sincronizar estado local com servidor
- Validar jogadas localmente antes de enviar

## Exemplo de Uso Completo

```typescript
// 1. Criar jogo via API HTTP
const game = await gamesAPI.createGame({ mode: 'pvp-online' });

// 2. Conectar WebSocket
const {
  isConnected,
  sendMove,
  sendChatMessage
} = useGameWebSocket({
  gameId: game.id,
  onMove: (move) => {
    // Atualizar tabuleiro
    updateBoard(move.row, move.col, move.player);
    setCurrentPlayer(move.next_player);
  },
  onGameState: (state) => {
    // Sincronizar estado completo
    setGameState(state);
  }
});

// 3. Fazer jogada
const handleCellClick = (row: number, col: number) => {
  if (isConnected && isMyTurn) {
    sendMove(row, col);
  }
};

// 4. Enviar chat
const handleSendMessage = (message: string) => {
  if (isConnected) {
    sendChatMessage(message);
  }
};
```

## Benefícios da Implementação WebSocket

- ✅ **Tempo Real**: Jogadas aparecem instantaneamente para todos os jogadores
- ✅ **Baixa Latência**: Comunicação direta sem polling
- ✅ **Chat Integrado**: Comunicação entre jogadores durante a partida
- ✅ **Detecção de Desconexão**: Notificação automática quando jogador sai
- ✅ **Sincronização**: Estado do jogo sempre sincronizado entre clientes
- ✅ **Escalabilidade**: Suporte a múltiplas partidas simultâneas

## Próximos Passos

1. Implementar detecção de vitória via WebSocket
2. Adicionar sistema de espectadores
3. Implementar pause/resume de partidas
4. Adicionar replay de partidas
5. Integrar com sistema de ranking em tempo real