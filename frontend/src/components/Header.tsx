import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // Initialize theme
  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  return (
    <header className="header">
      <h1>
        <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
          🎮 Gomoku
        </Link>
      </h1>
      <nav className="nav">
        <Link to="/">Início</Link>
        {isAuthenticated && (
          <>
            <Link to="/lobby">Lobby</Link>
            <Link to="/lobby">Jogar</Link>
            <Link to="/profile">Perfil</Link>
          </>
        )}
        {!isAuthenticated && (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Registrar</Link>
          </>
        )}
        <button 
          onClick={toggleTheme}
          className="btn btn-secondary"
          style={{ marginLeft: '1rem' }}
        >
          🌓
        </button>
        {isAuthenticated && (
          <span style={{ marginLeft: '1rem' }}>
            Olá, {user?.name}! 
            <button onClick={handleLogout} className="btn" style={{ marginLeft: '0.5rem' }}>
              Sair
            </button>
          </span>
        )}
      </nav>
    </header>
  );
};

export default Header;
