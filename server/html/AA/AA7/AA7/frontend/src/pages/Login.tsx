import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePageLogger } from '../hooks/useNavigationLogger';
import logger from '../utils/logger';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();
  
  // Log page visit
  usePageLogger('Login');

  useEffect(() => {
    logger.info('LOGIN_PAGE', 'User accessed login page');
    
    // Clear any existing auth errors when the component mounts or unmounts
    return () => {
      if (error) {
        clearError();
      }
    };
  }, [clearError, error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    logger.userAction('LOGIN_ATTEMPT', 'Login', { email });
    
    try {
      await login({ email, password });
      logger.info('LOGIN_PAGE', 'Login successful, redirecting to lobby', { email });
      navigate('/lobby');
    } catch (err) {
      logger.error('LOGIN_PAGE', 'Login failed', { email, error: err });
      // Error is handled by AuthContext
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    logger.debug('LOGIN_PAGE', 'Email field changed');
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    logger.debug('LOGIN_PAGE', 'Password field changed');
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1>Fazer Login</h1>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={handleEmailChange}
              required
              placeholder="Digite seu email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Senha:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={handlePasswordChange}
              required
              placeholder="Digite sua senha"
            />
          </div>

          <button type="submit" disabled={isLoading} className="btn btn-primary">
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="auth-links">
          <p>
            Não tem uma conta? 
            <Link to="/register"> Criar conta</Link>
          </p>
        </div>

        <div className="demo-credentials">
          <h3>Credenciais de Demonstração:</h3>
          <p>Email: demo@gomoku.com</p>
          <p>Senha: demo123</p>
          <button 
            onClick={() => {
              setEmail('demo@gomoku.com');
              setPassword('demo123');
            }}
            className="btn btn-secondary"
          >
            Preencher Demo
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
