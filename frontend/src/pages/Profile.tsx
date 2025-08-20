import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    age: user?.age?.toString() || '',
    city: user?.location?.city || '',
    state: user?.location?.state || '',
    country: user?.location?.country || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = () => {
    // TODO: Implement profile update API call
    console.log('Saving profile:', formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      age: user?.age?.toString() || '',
      city: user?.location?.city || '',
      state: user?.location?.state || '',
      country: user?.location?.country || '',
    });
    setIsEditing(false);
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
              <h3>{user.stats.winRate}%</h3>
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
            <p>Implementação do histórico de partidas em desenvolvimento...</p>
            {/* TODO: Implement match history */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
