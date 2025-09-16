import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useUI } from '../contexts/UIContext';

interface VideoChatProps {
  isInGame?: boolean;
  opponentId?: string;
}

const VideoChat: React.FC<VideoChatProps> = ({ isInGame = false, opponentId }) => {
  const { settings, updateAudioSetting } = useUI();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(settings.audioSettings.videoChatAudio);
  const [isConnected, setIsConnected] = useState(false);

  const stopVideoChat = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    setIsConnected(false);
  }, [localStream]);

  const startVideoChat = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 320 },
          height: { ideal: 240 },
          frameRate: { ideal: 15 }
        },
        audio: settings.audioSettings.videoChatAudio
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      setLocalStream(stream);
      setIsConnected(true);
      
      // Aqui você integraria com WebRTC para conectar com o oponente
      // Para demonstração, vamos simular uma conexão
      
    } catch (error) {
      console.error('Erro ao iniciar vídeochat:', error);
    }
  }, [settings.audioSettings.videoChatAudio]);

  useEffect(() => {
    if (isInGame && settings.showVideoChat) {
      startVideoChat();
    }

    return () => {
      stopVideoChat();
    };
  }, [isInGame, settings.showVideoChat, startVideoChat, stopVideoChat]);

  useEffect(() => {
    setIsAudioEnabled(settings.audioSettings.videoChatAudio);
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = settings.audioSettings.videoChatAudio;
      });
    }
  }, [settings.audioSettings.videoChatAudio, localStream]);

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    const newAudioState = !isAudioEnabled;
    setIsAudioEnabled(newAudioState);
    updateAudioSetting('videoChatAudio', newAudioState);
    
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = newAudioState;
      });
    }
  };

  if (!settings.showVideoChat || !isInGame) {
    return null;
  }

  return (
    <div className="videochat-container">
      <div className="videochat-header">
        <h4>
          <i className="fas fa-video"></i>
          Vídeochat
        </h4>
        <div className="connection-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
            <i className={`fas ${isConnected ? 'fa-circle' : 'fa-circle-notch fa-spin'}`}></i>
            {isConnected ? 'Conectado' : 'Conectando...'}
          </span>
        </div>
      </div>

      <div className="video-grid">
        {/* Vídeo Local */}
        <div className="video-container local-video">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className={`video-element ${!isVideoEnabled ? 'video-disabled' : ''}`}
          />
          <div className="video-overlay">
            <span className="video-label">Você</span>
            <div className="video-controls">
              <button
                className={`control-btn ${!isVideoEnabled ? 'disabled' : ''}`}
                onClick={toggleVideo}
                title={isVideoEnabled ? 'Desativar vídeo' : 'Ativar vídeo'}
              >
                <i className={`fas ${isVideoEnabled ? 'fa-video' : 'fa-video-slash'}`}></i>
              </button>
              <button
                className={`control-btn ${!isAudioEnabled ? 'disabled' : ''}`}
                onClick={toggleAudio}
                title={isAudioEnabled ? 'Silenciar microfone' : 'Ativar microfone'}
              >
                <i className={`fas ${isAudioEnabled ? 'fa-microphone' : 'fa-microphone-slash'}`}></i>
              </button>
            </div>
          </div>
          {!isVideoEnabled && (
            <div className="video-placeholder">
              <i className="fas fa-user-circle"></i>
            </div>
          )}
        </div>

        {/* Vídeo Remoto */}
        <div className="video-container remote-video">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="video-element"
          />
          <div className="video-overlay">
            <span className="video-label">
              {opponentId ? `Oponente` : 'Aguardando...'}
            </span>
          </div>
          {!opponentId && (
            <div className="video-placeholder waiting">
              <i className="fas fa-user-plus"></i>
              <span>Aguardando oponente...</span>
            </div>
          )}
        </div>
      </div>

      <div className="videochat-footer">
        <div className="audio-controls">
          <label className="audio-control">
            <input
              type="checkbox"
              checked={settings.audioSettings.videoChatAudio}
              onChange={(e) => updateAudioSetting('videoChatAudio', e.target.checked)}
            />
            <span>Áudio do vídeochat</span>
          </label>
        </div>
        
        <button
          className="end-call-btn"
          onClick={stopVideoChat}
          title="Encerrar vídeochat"
        >
          <i className="fas fa-phone-slash"></i>
          Encerrar
        </button>
      </div>
    </div>
  );
};

export default VideoChat;