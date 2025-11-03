import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: '',
    city: '',
    state: '',
    country: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const { register, isLoading, error: authError, clearError } = useAuth();

  useEffect(() => {
    // Clear any existing auth errors when the component mounts or unmounts
    return () => {
      if (authError) {
        clearError();
      }
    };
  }, [clearError, authError]);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setFormError('As senhas não coincidem!');
      return;
    }
    setFormError(null);

    try {
      await register({
        name: formData.name,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        age: formData.age ? parseInt(formData.age) : undefined,
        location: formData.city ? {
          city: formData.city,
          state: formData.state,
          country: formData.country,
        } : undefined,
      });
      navigate('/lobby');
    } catch (err) {
      // Error is handled by AuthContext
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1>Criar Conta</h1>
        
        {(authError || formError) && (
          <div className="error-message">
            {authError || formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Nome:*</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Digite seu nome"
            />
          </div>

          <div className="form-group">
            <label htmlFor="username">Nome de Usuário:*</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="Digite seu nome de usuário"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email:*</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Digite seu email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Senha:*</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Digite sua senha"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar Senha:*</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Confirme sua senha"
            />
          </div>

          <div className="form-group">
            <label htmlFor="age">Idade:</label>
            <input
              type="number"
              id="age"
              name="age"
              value={formData.age}
              onChange={handleChange}
              placeholder="Digite sua idade"
            />
          </div>

          <div className="location-group">
            <h3>Localização (Opcional)</h3>
            
            <div className="form-group">
              <label htmlFor="city">Cidade:</label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Digite sua cidade"
              />
            </div>

            <div className="form-group">
              <label htmlFor="state">Estado:</label>
              <input
                type="text"
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="Digite seu estado"
              />
            </div>

            <div className="form-group">
              <label htmlFor="country">País:</label>
              <input
                type="text"
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="Digite seu país"
              />
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="btn btn-primary">
            {isLoading ? 'Criando conta...' : 'Criar Conta'}
          </button>
        </form>

        <div className="auth-links">
          <p>
            Já tem uma conta? 
            <Link to="/login"> Fazer login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
