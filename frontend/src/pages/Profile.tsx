import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePageLogger } from '../hooks/useNavigationLogger';
import { usersAPI } from '../services/api';
import { User, GameState } from '../types';
import logger from '../utils/logger';

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  
  // Log page visit
  usePageLogger('Profile');

  const [isEditing, setIsEditing] = useState(false);
  const [gameHistory, setGameHistory] = useState<GameState[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    age: user?.age?.toString() || '',
    city: user?.location?.city || '',
    state: user?.location?.state || '',
    country: user?.location?.country || '',
  });

  useEffect(() => {
    const fetchGameHistory = async () => {
      setIsLoading(true);
      logger.info('PROFILE', 'Fetching game history');
      
      try {
        const history = await usersAPI.getGameHistory();
        setGameHistory(history);
        logger.info('PROFILE', 'Game history fetched successfully', { count: history.length });
      } catch (error) {
        logger.error('PROFILE', 'Failed to fetch game history', { error });
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchGameHistory();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        age: user.age?.toString() || '',
        city: user.location?.city || '',
        state: user.location?.state || '',
        country: user.location?.country || '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    logger.debug('PROFILE', 'Form field changed', { field: name });
  };

  const handleSave = async () => {
    if (!user) return;

    logger.userAction('SAVE_PROFILE_CLICKED', 'Profile');
    
    const updatedUserData: Partial<User> = {
      name: formData.name,
      age: formData.age ? parseInt(formData.age, 10) : undefined,
      location: {
        city: formData.city,
        state: formData.state,
        country: formData.country,
      },
    };

    try {
      logger.info('PROFILE', 'Updating user profile');
      const updatedUser = await usersAPI.updateProfile(updatedUserData);
      updateUser(updatedUser);
      setIsEditing(false);
      logger.info('PROFILE', 'Profile updated successfully', { userId: user.id });
    } catch (error) {
      logger.error('PROFILE', 'Failed to update profile', { error });
      // Optionally, show an error message to the user
    }
  };

  const handleCancel = () => {
    logger.userAction('CANCEL_PROFILE_EDIT', 'Profile');
    setFormData({
      name: user?.name || '',
      age: user?.age?.toString() || '',
      city: user?.location?.city || '',
      state: user?.location?.state || '',
      country: user?.location?.country || '',
    });
    setIsEditing(false);
  };

  const handleEdit = () => {
    logger.userAction('EDIT_PROFILE_CLICKED', 'Profile');
    setIsEditing(true);
  };

  if (!user) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <h1>Meu Perfil</h1>

        <div className="profile-section">
          <h2>Informações Pessoais</h2>
          
          {isEditing ? (
            <div className="edit-form">
              <div className="form-group">
                <label htmlFor="name">Nome:</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
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
                />
              </div>

              <div className="form-group">
                <label htmlFor="city">Cidade:</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
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
                />
              </div>

              <div className="form-actions">
                <button onClick={handleSave} className="btn btn-primary">
                  Salvar
                </button>
                <button onClick={handleCancel} className="btn btn-secondary">
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="profile-info">
              <div className="info-item">
                <strong>Nome:</strong> {user.name}
              </div>
              <div className="info-item">
                <strong>Email:</strong> {user.email}
              </div>
              <div className="info-item">
                <strong>Idade:</strong> {user.age || 'Não informado'}
              </div>
              <div className="info-item">
                <strong>Localização:</strong> 
                {user.location ? 
                  `${user.location.city}, ${user.location.state}, ${user.location.country}` : 
                  'Não informado'
                }
              </div>
              <div className="info-item">
                <strong>Membro desde:</strong> {new Date(user.createdAt).toLocaleDateString('pt-BR')}
              </div>
              
              <button onClick={() => setIsEditing(true)} className="btn btn-primary">
                Editar Perfil
              </button>
            </div>
          )}
        </div>

        <div className="profile-section">
          <h2>Estatísticas de Jogo</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>{user.stats.gamesPlayed}</h3>
              <p>Jogos Totais</p>
            </div>
            <div className="stat-card">
              <h3>{user.stats.gamesWon}</h3>
              <p>Vitórias</p>
            </div>
            <div className="stat-card">
              <h3>{user.stats.gamesLost}</h3>
              <p>Derrotas</p>
            </div>
            <div className="stat-card">
              <h3>
                {user.stats.gamesPlayed > 0
                  ? Math.round((user.stats.gamesWon / user.stats.gamesPlayed) * 100)
                  : 0}
                %
              </h3>
              <p>Taxa de Vitória</p>
            </div>
            <div className="stat-card">
              <h3>{user.stats.rating}</h3>
              <p>Rating Atual</p>
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h2>Histórico de Partidas</h2>
          <div className="match-history">
            {gameHistory.length === 0 ? (
              <p>Nenhuma partida encontrada.</p>
            ) : (
              <ul>
                {gameHistory.map((game) => (
                  <li key={game.id}>
                    <span>
                      {game.players.black.name} vs {game.players.white.name} - {game.status}
                    </span>
                    <span>{new Date(game.createdAt).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
