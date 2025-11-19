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

  // Rola para baixo sempre que chega uma nova mensagem
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
            Nenhuma mensagem ainda. Diga oi!
          </div>
        ) : (
          chatMessages.map((msg, index) => {
            // Verifica se a mensagem foi enviada pelo próprio usuário
            // O backend agora repassa o user_id no nível raiz do objeto
            const isMe = (msg.user_id === user?.id) || (msg.userId === user?.id);
            
            // Define o nome a ser exibido
            let senderName = 'Oponente';
            if (isMe) {
              senderName = 'Você';
            } else if (msg.username) {
              senderName = msg.username;
            } else if (msg.userName) {
              senderName = msg.userName;
            }

            return (
              <div 
                key={index} 
                className={`chat-message ${isMe ? 'sent' : 'received'}`}
              >
                <div className="message-sender">{senderName}</div>
                {/* O conteúdo da mensagem agora é lido diretamente de msg.message */}
                <div className="message-content">{msg.message}</div>
                
                {msg.timestamp && (
                  <div className="message-time">
                    {new Date(msg.timestamp).toLocaleTimeString([], { 
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