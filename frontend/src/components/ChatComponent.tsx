import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: Date;
  type: 'system' | 'user';
}

interface ChatComponentProps {
  onSendMessage?: (message: string) => void;
  messages?: ChatMessage[];
  isGameChat?: boolean;
}

const ChatComponent: React.FC<ChatComponentProps> = ({
  onSendMessage,
  messages = [],
  isGameChat = false
}) => {
  const { user } = useAuth();
  const { settings } = useUI();
  const [messageInput, setMessageInput] = useState('');
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevMessageCountRef = useRef<number>(0);

  const allMessages = [...messages, ...localMessages].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Only scroll if new messages were added
    if (allMessages.length > prevMessageCountRef.current) {
      scrollToBottom();
      prevMessageCountRef.current = allMessages.length;
    }
  }, [allMessages.length]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageInput.trim() || !user) return;

    const newMessage: ChatMessage = {
      id: `${Date.now()}-${Math.random()}`,
      userId: user.id,
      username: user.email.split('@')[0], // Use email prefix as username
      message: messageInput.trim(),
      timestamp: new Date(),
      type: 'user'
    };

    // Add to local messages for immediate display
    setLocalMessages(prev => [...prev, newMessage]);

    // Send via WebSocket or callback
    if (onSendMessage) {
      onSendMessage(messageInput.trim());
    }

    setMessageInput('');
    inputRef.current?.focus();
  };

  const formatTime = (timestamp: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(timestamp));
  };

  if (!settings.showChat) {
    return null;
  }

  return (
    <div className={`chat-component ${isGameChat ? 'game-chat' : 'lobby-chat'}`}>
      <div className="chat-header">
        <div className="chat-title">
          <i className="fas fa-comments"></i>
          <span>
            {isGameChat ? 'Chat do Jogo' :
              settings.chatMode === 'active-players' ? 'Jogadores Ativos' : 'Chat Geral'}
          </span>
        </div>
        <div className="chat-controls">
          <span className="online-count">
            <i className="fas fa-circle online-indicator"></i>
            {isGameChat ? '2' : '5'} online
          </span>
        </div>
      </div>

      <div className="chat-messages">
        {allMessages.length === 0 ? (
          <div className="no-messages">
            <i className="fas fa-comments"></i>
            <p>Nenhuma mensagem ainda...</p>
            <p>Seja o primeiro a conversar!</p>
          </div>
        ) : (
          allMessages.map((msg) => (
            <div
              key={msg.id}
              className={`message ${msg.type} ${msg.userId === user?.id ? 'own-message' : ''}`}
            >
              <div className="message-header">
                <span className="username">{msg.username}</span>
                <span className="timestamp">{formatTime(msg.timestamp)}</span>
              </div>
              <div className="message-content">{msg.message}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="chat-input-form">
        <div className="input-group">
          <input
            ref={inputRef}
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder={isGameChat ? "Digite uma mensagem..." : "Chat geral..."}
            className="chat-input"
            maxLength={200}
            disabled={!settings.audioSettings.globalAudio && !isGameChat}
          />
          <button
            type="submit"
            className="send-button"
            disabled={!messageInput.trim()}
          >
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>
        <div className="input-info">
          <span className="char-count">
            {messageInput.length}/200
          </span>
          {!settings.audioSettings.globalAudio && !isGameChat && (
            <span className="muted-indicator">
              <i className="fas fa-volume-mute"></i>
              Chat silenciado
            </span>
          )}
        </div>
      </form>
    </div>
  );
};

export default ChatComponent;
