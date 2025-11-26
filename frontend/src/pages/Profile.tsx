import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { usersAPI, recordingsAPI } from '../services/api'; // Import recordingsAPI
import PlayerAvatar from '../components/PlayerAvatar';
import './Admin.css'; // Reutilizando CSS ou crie Profile.css

interface Recording {
  id: string;
  game_id: string;
  filename: string;
  duration: number;
  created_at: string;
  size: number;
}

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { settings } = useUI();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  
  // Estado para gravações
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isLoadingRecordings, setIsLoadingRecordings] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        username: user.name || '',
        email: user.email || ''
      }));
      // Carregar gravações ao entrar no perfil
      fetchRecordings();
    }
  }, [user]);

  const fetchRecordings = async () => {
    setIsLoadingRecordings(true);
    try {
      const data = await recordingsAPI.listRecordings();
      setRecordings(data);
    } catch (error) {
      console.error("Failed to load recordings", error);
    } finally {
      setIsLoadingRecordings(false);
    }
  };

  const handleDownload = async (rec: Recording) => {
      try {
          await recordingsAPI.downloadRecordingBlob(rec.id, rec.filename);
      } catch (error) {
          setMessage({ type: 'error', text: 'Erro ao baixar gravação.' });
      }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatSize = (bytes: number) => {
      return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas não conferem.' });
      return;
    }

    try {
      const updatedUser = await usersAPI.updateProfile({
        username: formData.username,
        email: formData.email,
        current_password: formData.currentPassword || undefined,
        new_password: formData.newPassword || undefined
      });

      updateUser(updatedUser);
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
      setIsEditing(false);
      setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Erro ao atualizar perfil.' 
      });
    }
  };

  return (
    <div className={`profile-container ${settings.theme}`} data-theme={settings.theme}>
      <div className="profile-card">
        <div className="profile-header">
          <h2>Meu Perfil</h2>
          {!isEditing && (
            <button className="btn btn-secondary" onClick={() => setIsEditing(true)}>
              <i className="fas fa-edit"></i> Editar
            </button>
          )}
        </div>

        <div className="profile-content">
          <div className="avatar-section">
            <PlayerAvatar size="large" editable={true} />
            <div className="user-stats-summary">
                {/* Stats summary code here if needed */}
            </div>
          </div>

          {isEditing ? (
            <form onSubmit={handleSubmit} className="profile-form">
              {/* ... (Formulário de edição existente) ... */}
              <div className="form-group">
                <label>Nome de Usuário</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                />
              </div>
              {/* ... Outros campos ... */}
              
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Salvar Alterações
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-details">
              <div className="info-group">
                <label>Nome</label>
                <p>{user?.name}</p>
              </div>
              <div className="info-group">
                <label>Email</label>
                <p>{user?.email}</p>
              </div>
              
              {/* NOVA SEÇÃO: Gravações */}
              <div className="recordings-section" style={{ marginTop: '30px', borderTop: '1px solid #ccc', paddingTop: '20px' }}>
                <h3>
                    <i className="fas fa-film"></i> Minhas Gravações Recentes
                    <span style={{fontSize: '0.8em', fontWeight: 'normal', marginLeft: '10px'}}>
                        (Máx: 5, &lt; 5min)
                    </span>
                </h3>
                
                {isLoadingRecordings ? (
                    <p>Carregando...</p>
                ) : recordings.length === 0 ? (
                    <p className="no-data">Nenhuma gravação salva.</p>
                ) : (
                    <div className="recordings-list">
                        {recordings.map(rec => (
                            <div key={rec.id} className="recording-item" style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                padding: '10px',
                                background: 'rgba(0,0,0,0.05)',
                                marginBottom: '8px',
                                borderRadius: '4px'
                            }}>
                                <div className="rec-info">
                                    <div style={{fontWeight: 'bold'}}>Jogo: {rec.game_id.substring(0,8)}...</div>
                                    <div style={{fontSize: '0.9em', opacity: 0.8}}>
                                        {new Date(rec.created_at).toLocaleDateString()} - 
                                        {formatDuration(rec.duration)} - {formatSize(rec.size)}
                                    </div>
                                </div>
                                <button 
                                    className="btn btn-sm btn-primary"
                                    onClick={() => handleDownload(rec)}
                                >
                                    <i className="fas fa-download"></i> Baixar
                                </button>
                            </div>
                        ))}
                    </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {message && (
          <div className={`message-toast ${message.type}`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
