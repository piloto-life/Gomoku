import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameWebSocketContext';
import './UIComponents.css';

interface GameChatProps {
  gameId?: string;
}

const GameChat: React.FC<GameChatProps> = ({ gameId }) => {
  const { user } = useAuth();
  const { chatMessages, sendChatMessage, isConnected } = useGame();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && isConnected) {
      sendChatMessage(newMessage);
      setNewMessage('');
    }
  };

  return (
    <div className="game-chat-container">
      <div className="chat-header">
        <h3>Chat da Partida</h3>
        <div className="chat-status">
          <span className={`status-dot ${isConnected ? 'online' : 'offline'}`}></span>
          {isConnected ? 'Conectado' : 'Desconectado'}
        </div>
      </div>

      <div className="chat-messages">
        {chatMessages.length === 0 ? (
          <div className="empty-chat-message">
            Sem mensagens.
          </div>
        ) : (
          chatMessages.map((msg, index) => {
            // Extrai os dados reais da mensagem, suportando a estrutura aninhada 'data' do backend
            const messageData = msg.data || msg;
            
            // Normaliza os campos
            const content = messageData.message;
            const senderId = messageData.user_id || messageData.userId;
            const senderUsername = messageData.username || messageData.userName;
            const timestamp = messageData.timestamp || msg.timestamp;

            // Verifica se a mensagem é minha
            const isMe = (senderId === user?.id);
            
            // Define o nome a ser exibido
            let senderName = 'Oponente';
            if (isMe) {
              senderName = 'Você';
            } else if (senderUsername) {
              senderName = senderUsername;
            }

            return (
              <div 
                key={index} 
                className={`chat-message ${isMe ? 'sent' : 'received'}`}
              >
                <div className="message-sender">{senderName}</div>
                <div className="message-content">{content}</div>
                
                {timestamp && (
                  <div className="message-time">
                    {new Date(timestamp).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="chat-input-form">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={isConnected ? "Digite sua mensagem..." : "Reconectando..."}
          disabled={!isConnected}
          maxLength={200}
        />
        <button type="submit" disabled={!isConnected || !newMessage.trim()}>
          <i className="fas fa-paper-plane"></i>
        </button>
      </form>
    </div>
  );
};

export default GameChat;
