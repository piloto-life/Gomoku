import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ email, password });
      navigate('/lobby');
    } catch (err) {
      // Error is handled by AuthContext
    }
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
              onChange={(e) => setEmail(e.target.value)}
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
              onChange={(e) => setPassword(e.target.value)}
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
