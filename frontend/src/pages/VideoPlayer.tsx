import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './VideoPlayer.css';

interface VideoRecording {
  id: string;
  game_id: string;
  filename: string;
  url: string;
  duration: number;
  size: number;
  uploaded_at: string;
  uploaded_by: string;
}

const VideoPlayer: React.FC = () => {
  const { user } = useAuth();
  const [videos, setVideos] = useState<VideoRecording[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoRecording | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'my-videos'>('all');

  useEffect(() => {
    loadVideos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const loadVideos = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const endpoint = filter === 'my-videos' 
        ? `/api/recordings/user/${user?.id}`
        : '/api/recordings/list';
      
      const response = await fetch(`http://localhost:8000${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load videos');
      }

      const data = await response.json();
      setVideos(data);
      
      // Auto-select first video if available
      if (data.length > 0 && !selectedVideo) {
        setSelectedVideo(data[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading videos');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoSelect = (video: VideoRecording) => {
    setSelectedVideo(video);
  };

  const handleShare = async (video: VideoRecording) => {
    const shareUrl = `${window.location.origin}/videos?v=${video.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('Link copiado para a área de transferência!');
    } catch (err) {
      alert('Erro ao copiar link');
    }
  };

  const handleDownload = (video: VideoRecording) => {
    const link = document.createElement('a');
    link.href = video.url;
    link.download = video.filename;
    link.click();
  };

  const handleDelete = async (video: VideoRecording) => {
    if (!window.confirm('Tem certeza que deseja deletar este vídeo?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/recordings/${video.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete video');
      }

      // Remove from list and clear selection if needed
      setVideos(videos.filter(v => v.id !== video.id));
      if (selectedVideo?.id === video.id) {
        setSelectedVideo(videos.length > 1 ? videos[0] : null);
      }

      alert('Vídeo deletado com sucesso!');
    } catch (err: any) {
      alert('Erro ao deletar vídeo: ' + err.message);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return (
      <div className="video-player-page">
        <div className="error-message">
          <h2>🔒 Acesso Restrito</h2>
          <p>Você precisa estar logado para visualizar vídeos.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="video-player-page">
      <div className="player-header">
        <h1>📹 Vídeos das Partidas</h1>
        <p>Reviva os melhores momentos das suas partidas de Gomoku</p>
      </div>

      <div className="filter-tabs">
        <button
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Todos os Vídeos
        </button>
        <button
          className={`filter-tab ${filter === 'my-videos' ? 'active' : ''}`}
          onClick={() => setFilter('my-videos')}
        >
          Meus Vídeos
        </button>
      </div>

      <div className="player-container">
        {/* Video Player Section */}
        <div className="player-section">
          {selectedVideo ? (
            <>
              <video
                key={selectedVideo.id}
                className="video-element"
                controls
                autoPlay
              >
                <source src={selectedVideo.url} type="video/webm" />
                Seu navegador não suporta vídeo HTML5.
              </video>

              <div className="video-info">
                <h2>{selectedVideo.filename}</h2>
                <div className="video-meta">
                  <span className="meta-item">
                    🕒 {formatDuration(selectedVideo.duration)}
                  </span>
                  <span className="meta-item">
                    💾 {formatSize(selectedVideo.size)}
                  </span>
                  <span className="meta-item">
                    📅 {formatDate(selectedVideo.uploaded_at)}
                  </span>
                  <span className="meta-item">
                    🎮 Game ID: <code>{selectedVideo.game_id}</code>
                  </span>
                </div>

                <div className="video-actions">
                  <button
                    className="btn-action primary"
                    onClick={() => handleShare(selectedVideo)}
                  >
                    🔗 Compartilhar
                  </button>
                  <button
                    className="btn-action"
                    onClick={() => handleDownload(selectedVideo)}
                  >
                    ⬇️ Download
                  </button>
                  {selectedVideo.uploaded_by === user.id && (
                    <button
                      className="btn-action danger"
                      onClick={() => handleDelete(selectedVideo)}
                    >
                      🗑️ Deletar
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="no-video-selected">
              <div className="placeholder-icon">📹</div>
              <h3>Nenhum vídeo selecionado</h3>
              <p>Selecione um vídeo da lista ao lado para começar a assistir</p>
            </div>
          )}
        </div>

        {/* Video List Section */}
        <div className="list-section">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Carregando vídeos...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <p>❌ {error}</p>
              <button onClick={loadVideos} className="btn-retry">
                Tentar Novamente
              </button>
            </div>
          ) : videos.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🎬</div>
              <h3>Nenhum vídeo disponível</h3>
              <p>
                {filter === 'my-videos'
                  ? 'Você ainda não tem vídeos gravados. Jogue uma partida e grave!'
                  : 'Nenhum vídeo foi gravado ainda.'}
              </p>
            </div>
          ) : (
            <div className="video-list">
              <div className="list-header">
                <h3>{videos.length} {videos.length === 1 ? 'vídeo' : 'vídeos'}</h3>
              </div>
              {videos.map((video) => (
                <div
                  key={video.id}
                  className={`video-item ${selectedVideo?.id === video.id ? 'active' : ''}`}
                  onClick={() => handleVideoSelect(video)}
                >
                  <div className="video-thumbnail">
                    🎥
                  </div>
                  <div className="video-details">
                    <h4>{video.filename}</h4>
                    <div className="video-stats">
                      <span>{formatDuration(video.duration)}</span>
                      <span>•</span>
                      <span>{formatSize(video.size)}</span>
                    </div>
                    <div className="video-date">
                      {formatDate(video.uploaded_at)}
                    </div>
                  </div>
                  {selectedVideo?.id === video.id && (
                    <div className="playing-indicator">▶️</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
