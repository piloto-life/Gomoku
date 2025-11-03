import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Admin.css';

interface User {
  _id: string;
  username: string;
  email: string;
  is_admin: boolean;
  is_active: boolean;
  is_banned?: boolean;
  created_at: string;
}

interface Game {
  _id: string;
  game_mode: string;
  status: string;
  player1_id: string;
  player2_id?: string;
  created_at: string;
}

interface DashboardStats {
  users: {
    total: number;
    active: number;
    banned: number;
    admins: number;
    new_this_week: number;
  };
  games: {
    total: number;
    active: number;
    this_week: number;
  };
  recordings: {
    total: number;
    total_size_mb: number;
  };
}

const Admin: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'games' | 'config'>('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Config
  const [config, setConfig] = useState({
    max_video_size_mb: 500,
    max_queue_size: 100,
    enable_registrations: true,
    maintenance_mode: false,
    announcement: ''
  });

  // Modals
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState(24);

  useEffect(() => {
    if (!user?.is_admin) {
      window.location.href = '/';
      return;
    }

    loadData();
    // eslint-disable-next-line
  }, [activeTab, page]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'dashboard') {
        await loadDashboard();
      } else if (activeTab === 'users') {
        await loadUsers();
      } else if (activeTab === 'games') {
        await loadGames();
      } else if (activeTab === 'config') {
        await loadConfig();
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const getToken = () => localStorage.getItem('token');

  const loadDashboard = async () => {
    const response = await fetch('/api/admin/stats/dashboard', {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });

    if (response.ok) {
      const data = await response.json();
      setStats(data);
    }
  };

  const loadUsers = async () => {
    const searchQuery = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : '';
    const response = await fetch(`/api/admin/users?page=${page}&per_page=20${searchQuery}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });

    if (response.ok) {
      const data = await response.json();
      setUsers(data.users || []);
      setTotalPages(data.pages || 1);
    }
  };

  const loadGames = async () => {
    const response = await fetch(`/api/admin/games?page=${page}&per_page=20`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });

    if (response.ok) {
      const data = await response.json();
      setGames(data.games || []);
      setTotalPages(data.pages || 1);
    }
  };

  const loadConfig = async () => {
    const response = await fetch('/api/admin/config', {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });

    if (response.ok) {
      const data = await response.json();
      setConfig(data);
    }
  };

  const updateUser = async (userId: string, updates: Partial<User>) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        alert('Usuário atualizado com sucesso!');
        setShowEditUserModal(false);
        loadUsers();
      } else {
        const error = await response.json();
        alert(`Erro: ${error.detail}`);
      }
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      alert('Erro ao atualizar usuário');
    }
  };

  const banUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/admin/users/${selectedUser._id}/ban`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: selectedUser._id,
          reason: banReason,
          duration_hours: banDuration
        })
      });

      if (response.ok) {
        alert('Usuário banido com sucesso!');
        setShowBanModal(false);
        setBanReason('');
        loadUsers();
      } else {
        const error = await response.json();
        alert(`Erro: ${error.detail}`);
      }
    } catch (error) {
      console.error('Erro ao banir usuário:', error);
      alert('Erro ao banir usuário');
    }
  };

  const unbanUser = async (userId: string) => {
    if (!window.confirm('Desbanir este usuário?')) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}/unban`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });

      if (response.ok) {
        alert('Usuário desbanido!');
        loadUsers();
      }
    } catch (error) {
      console.error('Erro ao desbanir:', error);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!window.confirm('ATENÇÃO: Deletar usuário permanentemente? Esta ação não pode ser desfeita!')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });

      if (response.ok) {
        alert('Usuário deletado!');
        loadUsers();
      }
    } catch (error) {
      console.error('Erro ao deletar:', error);
    }
  };

  const deleteGame = async (gameId: string) => {
    if (!window.confirm('Deletar este jogo?')) return;

    try {
      const response = await fetch(`/api/admin/games/${gameId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });

      if (response.ok) {
        alert('Jogo deletado!');
        loadGames();
      }
    } catch (error) {
      console.error('Erro ao deletar jogo:', error);
    }
  };

  const updateConfig = async () => {
    try {
      const response = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        alert('Configurações atualizadas!');
      }
    } catch (error) {
      console.error('Erro ao atualizar config:', error);
      alert('Erro ao atualizar configurações');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderDashboard = () => (
    <div className="dashboard-grid">
      <div className="stat-card-admin">
        <div className="stat-header">
          <span className="stat-icon">👥</span>
          <h3>Usuários</h3>
        </div>
        <div className="stat-content">
          <div className="stat-main">{stats?.users.total || 0}</div>
          <div className="stat-details">
            <div className="stat-item">
              <span className="label">Ativos:</span>
              <span className="value success">{stats?.users.active || 0}</span>
            </div>
            <div className="stat-item">
              <span className="label">Banidos:</span>
              <span className="value danger">{stats?.users.banned || 0}</span>
            </div>
            <div className="stat-item">
              <span className="label">Admins:</span>
              <span className="value info">{stats?.users.admins || 0}</span>
            </div>
            <div className="stat-item">
              <span className="label">Novos (7d):</span>
              <span className="value">{stats?.users.new_this_week || 0}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="stat-card-admin">
        <div className="stat-header">
          <span className="stat-icon">🎮</span>
          <h3>Jogos</h3>
        </div>
        <div className="stat-content">
          <div className="stat-main">{stats?.games.total || 0}</div>
          <div className="stat-details">
            <div className="stat-item">
              <span className="label">Ativos:</span>
              <span className="value success">{stats?.games.active || 0}</span>
            </div>
            <div className="stat-item">
              <span className="label">Esta semana:</span>
              <span className="value">{stats?.games.this_week || 0}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="stat-card-admin">
        <div className="stat-header">
          <span className="stat-icon">🎥</span>
          <h3>Gravações</h3>
        </div>
        <div className="stat-content">
          <div className="stat-main">{stats?.recordings.total || 0}</div>
          <div className="stat-details">
            <div className="stat-item">
              <span className="label">Espaço usado:</span>
              <span className="value">{stats?.recordings.total_size_mb.toFixed(2) || 0} MB</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="admin-table-container">
      <div className="table-header">
        <input
          type="text"
          className="search-input"
          placeholder="Buscar usuário..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && loadUsers()}
        />
        <button className="btn btn-primary" onClick={loadUsers}>
          🔍 Buscar
        </button>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Status</th>
            <th>Tipo</th>
            <th>Criado em</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u._id}>
              <td>{u.username}</td>
              <td>{u.email}</td>
              <td>
                <span className={`badge ${u.is_active ? 'success' : 'danger'}`}>
                  {u.is_active ? 'Ativo' : 'Inativo'}
                </span>
                {u.is_banned && <span className="badge danger">Banido</span>}
              </td>
              <td>
                <span className={`badge ${u.is_admin ? 'info' : ''}`}>
                  {u.is_admin ? 'Admin' : 'Usuário'}
                </span>
              </td>
              <td>{formatDate(u.created_at)}</td>
              <td>
                <div className="action-buttons">
                  <button
                    className="btn-icon"
                    title="Editar"
                    onClick={() => {
                      setSelectedUser(u);
                      setShowEditUserModal(true);
                    }}
                  >
                    ✏️
                  </button>
                  {u.is_banned ? (
                    <button
                      className="btn-icon success"
                      title="Desbanir"
                      onClick={() => unbanUser(u._id)}
                    >
                      ✅
                    </button>
                  ) : (
                    <button
                      className="btn-icon danger"
                      title="Banir"
                      onClick={() => {
                        setSelectedUser(u);
                        setShowBanModal(true);
                      }}
                    >
                      🚫
                    </button>
                  )}
                  <button
                    className="btn-icon danger"
                    title="Deletar"
                    onClick={() => deleteUser(u._id)}
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {renderPagination()}
    </div>
  );

  const renderGames = () => (
    <div className="admin-table-container">
      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Modo</th>
            <th>Status</th>
            <th>Player 1</th>
            <th>Player 2</th>
            <th>Criado em</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {games.map((g) => (
            <tr key={g._id}>
              <td><code>{g._id.substring(0, 8)}</code></td>
              <td>
                <span className="badge">
                  {g.game_mode === 'pvp_online' ? 'PvP Online' :
                   g.game_mode === 'pvp_local' ? 'PvP Local' : 'PvE'}
                </span>
              </td>
              <td>
                <span className={`badge ${g.status === 'active' ? 'success' : ''}`}>
                  {g.status}
                </span>
              </td>
              <td>{g.player1_id.substring(0, 8)}</td>
              <td>{g.player2_id ? g.player2_id.substring(0, 8) : '-'}</td>
              <td>{formatDate(g.created_at)}</td>
              <td>
                <button
                  className="btn-icon danger"
                  title="Deletar"
                  onClick={() => deleteGame(g._id)}
                >
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {renderPagination()}
    </div>
  );

  const renderConfig = () => (
    <div className="config-container">
      <div className="config-section">
        <h3>⚙️ Configurações do Sistema</h3>

        <div className="form-group">
          <label>Tamanho Máximo de Vídeo (MB)</label>
          <input
            type="number"
            value={config.max_video_size_mb}
            onChange={(e) => setConfig({...config, max_video_size_mb: parseInt(e.target.value)})}
          />
        </div>

        <div className="form-group">
          <label>Tamanho Máximo da Fila</label>
          <input
            type="number"
            value={config.max_queue_size}
            onChange={(e) => setConfig({...config, max_queue_size: parseInt(e.target.value)})}
          />
        </div>

        <div className="form-group checkbox">
          <label>
            <input
              type="checkbox"
              checked={config.enable_registrations}
              onChange={(e) => setConfig({...config, enable_registrations: e.target.checked})}
            />
            Permitir novos registros
          </label>
        </div>

        <div className="form-group checkbox">
          <label>
            <input
              type="checkbox"
              checked={config.maintenance_mode}
              onChange={(e) => setConfig({...config, maintenance_mode: e.target.checked})}
            />
            Modo de Manutenção
          </label>
        </div>

        <div className="form-group">
          <label>Anúncio (exibido no site)</label>
          <textarea
            rows={4}
            value={config.announcement}
            onChange={(e) => setConfig({...config, announcement: e.target.value})}
            placeholder="Deixe vazio para não exibir anúncio"
          />
        </div>

        <button className="btn btn-primary" onClick={updateConfig}>
          💾 Salvar Configurações
        </button>
      </div>
    </div>
  );

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="pagination">
        <button
          className="btn-pagination"
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          ← Anterior
        </button>
        <span className="page-info">
          Página {page} de {totalPages}
        </span>
        <button
          className="btn-pagination"
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
        >
          Próxima →
        </button>
      </div>
    );
  };

  if (!user?.is_admin) {
    return <div className="error-page">Acesso negado. Apenas administradores.</div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>⚙️ Painel de Administração</h1>
        <p>Gerenciamento completo do sistema</p>
      </div>

      <div className="admin-tabs">
        <button
          className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button
          className={`tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Usuários
        </button>
        <button
          className={`tab ${activeTab === 'games' ? 'active' : ''}`}
          onClick={() => setActiveTab('games')}
        >
          🎮 Jogos
        </button>
        <button
          className={`tab ${activeTab === 'config' ? 'active' : ''}`}
          onClick={() => setActiveTab('config')}
        >
          ⚙️ Configurações
        </button>
      </div>

      <div className="admin-content">
        {loading ? (
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>Carregando...</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'users' && renderUsers()}
            {activeTab === 'games' && renderGames()}
            {activeTab === 'config' && renderConfig()}
          </>
        )}
      </div>

      {/* Modal de Editar Usuário */}
      {showEditUserModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowEditUserModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Editar Usuário</h2>
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                value={selectedUser.username}
                onChange={(e) => setSelectedUser({...selectedUser, username: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={selectedUser.email}
                onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})}
              />
            </div>
            <div className="form-group checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={selectedUser.is_admin}
                  onChange={(e) => setSelectedUser({...selectedUser, is_admin: e.target.checked})}
                />
                Administrador
              </label>
            </div>
            <div className="form-group checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={selectedUser.is_active}
                  onChange={(e) => setSelectedUser({...selectedUser, is_active: e.target.checked})}
                />
                Ativo
              </label>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowEditUserModal(false)}>
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                onClick={() => updateUser(selectedUser._id, {
                  username: selectedUser.username,
                  email: selectedUser.email,
                  is_admin: selectedUser.is_admin,
                  is_active: selectedUser.is_active
                })}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Banir */}
      {showBanModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowBanModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Banir Usuário: {selectedUser.username}</h2>
            <div className="form-group">
              <label>Motivo</label>
              <textarea
                rows={3}
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Descreva o motivo do banimento..."
              />
            </div>
            <div className="form-group">
              <label>Duração (horas)</label>
              <input
                type="number"
                value={banDuration}
                onChange={(e) => setBanDuration(parseInt(e.target.value))}
              />
              <small>0 = permanente</small>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowBanModal(false)}>
                Cancelar
              </button>
              <button className="btn btn-danger" onClick={banUser}>
                Banir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
