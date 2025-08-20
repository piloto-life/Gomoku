import React, { useState } from 'react';
import { ChatMessage } from '../types';

interface GameChatProps {
  gameId: string;
}

const GameChat: React.FC<GameChatProps> = ({ gameId }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      userId: 'system',
      username: 'Sistema',
      message: 'Bem-vindos ao jogo!',
      timestamp: new Date(),
      type: 'game',
    },
    {
      id: '2',
      userId: '1',
      username: 'Player 1',
      message: 'Boa sorte!',
      timestamp: new Date(),
      type: 'game',
    },
  ]);

  const handleSendMessage = () => {
    if (message.trim() === '') return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      userId: 'current-user', // TODO: Get from auth context
      username: 'Você',
      message: message.trim(),
      timestamp: new Date(),
      type: 'game',
    };

    setMessages(prev => [...prev, newMessage]);
    setMessage('');

    // TODO: Send message via WebSocket
    console.log('Sending message:', newMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="game-chat">
      <h3>Chat da Partida</h3>
      
      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-message ${msg.userId === 'current-user' ? 'own' : ''}`}>
            <div className="message-header">
              <span className="username">{msg.username}</span>
              <span className="timestamp">{formatTime(msg.timestamp)}</span>
            </div>
            <div className="message-content">
              {msg.message}
            </div>
          </div>
        ))}
      </div>

      <div className="chat-input">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Digite sua mensagem..."
          rows={2}
          maxLength={500}
        />
        <button 
          onClick={handleSendMessage}
          disabled={message.trim() === ''}
          className="btn btn-primary"
        >
          Enviar
        </button>
      </div>

      <div className="chat-info">
        <small>Pressione Enter para enviar, Shift+Enter para nova linha</small>
      </div>
    </div>
  );
};

export default GameChat;
