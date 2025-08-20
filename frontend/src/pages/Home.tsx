import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="home">
      <div className="hero">
        <h1>Bem-vindo ao Gomoku</h1>
        <p>Jogue o clássico jogo de estratégia Five in a Row online</p>
        
        {isAuthenticated ? (
          <div className="welcome-back">
            <h2>Olá, {user?.name}!</h2>
            <div className="stats">
              <div className="stat">
                <h3>{user?.stats.gamesPlayed}</h3>
                <p>Jogos</p>
              </div>
              <div className="stat">
                <h3>{user?.stats.gamesWon}</h3>
                <p>Vitórias</p>
              </div>
              <div className="stat">
                <h3>{user?.stats.winRate}%</h3>
                <p>Taxa de Vitória</p>
              </div>
              <div className="stat">
                <h3>{user?.stats.rating}</h3>
                <p>Rating</p>
              </div>
            </div>
            <div className="action-buttons">
              <Link to="/lobby" className="btn btn-primary">
                Entrar no Lobby
              </Link>
              <Link to="/game" className="btn btn-secondary">
                Jogo Rápido
              </Link>
            </div>
          </div>
        ) : (
          <div className="guest-actions">
            <h2>Comece a jogar agora!</h2>
            <div className="action-buttons">
              <Link to="/register" className="btn btn-primary">
                Criar Conta
              </Link>
              <Link to="/login" className="btn btn-secondary">
                Fazer Login
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="game-info">
        <h2>Como Jogar Gomoku</h2>
        <div className="rules">
          <div className="rule">
            <h3>🎯 Objetivo</h3>
            <p>Seja o primeiro a formar uma linha de 5 peças consecutivas</p>
          </div>
          <div className="rule">
            <h3>🎲 Regras</h3>
            <p>Jogadores alternam turnos colocando peças no tabuleiro 19x19</p>
          </div>
          <div className="rule">
            <h3>🏆 Vitória</h3>
            <p>Forme 5 peças em linha: horizontal, vertical ou diagonal</p>
          </div>
        </div>
      </div>

      <div className="features">
        <h2>Recursos da Plataforma</h2>
        <div className="feature-grid">
          <div className="feature">
            <h3>🎮 Múltiplos Modos</h3>
            <p>Jogue contra outros jogadores ou contra a IA</p>
          </div>
          <div className="feature">
            <h3>💬 Chat em Tempo Real</h3>
            <p>Converse com outros jogadores durante as partidas</p>
          </div>
          <div className="feature">
            <h3>📊 Ranking</h3>
            <p>Sistema de pontuação e classificação global</p>
          </div>
          <div className="feature">
            <h3>📹 Gravação</h3>
            <p>Grave e compartilhe suas melhores partidas</p>
          </div>
          <div className="feature">
            <h3>🌓 Temas</h3>
            <p>Modo claro e escuro para melhor experiência</p>
          </div>
          <div className="feature">
            <h3>📱 Responsivo</h3>
            <p>Jogue em qualquer dispositivo: desktop ou mobile</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
