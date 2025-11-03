import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import logger from '../utils/logger';

interface PlayerAvatarProps {
  size?: 'small' | 'medium' | 'large';
  showWebcam?: boolean;
  editable?: boolean;
}

// SVG de avatar padrão como string base64
const DEFAULT_AVATAR_SVG = "data:image/svg+xml;base64," + btoa(`
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="50" fill="#e0e0e0"/>
  <circle cx="50" cy="40" r="15" fill="#999"/>
  <circle cx="50" cy="75" r="25" fill="#999"/>
</svg>
`);

const PlayerAvatar: React.FC<PlayerAvatarProps> = ({ 
  size = 'medium', 
  showWebcam = false,
  editable = false 
}) => {
  const { user } = useAuth();
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState(user?.avatar || '');
  const [imageError, setImageError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-16 h-16',
    large: 'w-24 h-24'
  };

  // Função para gerar avatar baseado no email usando serviço externo
  const getGravatarUrl = (email: string, size: number = 80) => {
    // Simples hash do email para gerar um identificador
    const hash = btoa(email.toLowerCase().trim()).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
    return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon&r=pg`;
  };

  // Função para obter a URL do avatar
  const getAvatarUrl = () => {
    if (imageError) {
      return DEFAULT_AVATAR_SVG;
    }
    
    if (avatarSrc) {
      return avatarSrc;
    }
    
    if (user?.avatar) {
      return user.avatar;
    }
    
    if (user?.email) {
      return getGravatarUrl(user.email);
    }
    
    return DEFAULT_AVATAR_SVG;
  };

  const handleImageError = () => {
    logger.warn('AVATAR', 'Failed to load avatar image', { 
      originalSrc: avatarSrc || user?.avatar,
      userId: user?.id 
    });
    setImageError(true);
  };

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 },
        audio: false 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsWebcamActive(true);
      }
    } catch (error) {
      console.error('Erro ao acessar webcam:', error);
      alert('Não foi possível acessar a webcam');
    }
  };

  const stopWebcam = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsWebcamActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      
      if (context) {
        context.drawImage(videoRef.current, 0, 0);
        const dataURL = canvas.toDataURL('image/png');
        setAvatarSrc(dataURL);
        
        // Aqui você salvaria o avatar no backend
        // updateUser({ avatar: dataURL });
        
        stopWebcam();
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setAvatarSrc(result);
        // updateUser({ avatar: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlInput = () => {
    const url = prompt('Digite a URL da imagem:');
    if (url) {
      setAvatarSrc(url);
      // updateUser({ avatar: url });
    }
  };

  return (
    <div className="player-avatar-container">
      <div className={`player-avatar ${sizeClasses[size]}`}>
        {showWebcam && isWebcamActive ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            className="webcam-feed"
          />
        ) : (
          imageError ? (
            <div 
              dangerouslySetInnerHTML={{ __html: DEFAULT_AVATAR_SVG }}
              className="w-full h-full flex items-center justify-center"
            />
          ) : (
            <img
              src={getAvatarUrl()}
              alt={user?.email || 'Player'}
              className="avatar-image"
              onError={handleImageError}
            />
          )
        )}
        
        {editable && (
          <div className="avatar-controls">
            <div className="avatar-buttons">
              <button
                className="avatar-btn"
                onClick={() => fileInputRef.current?.click()}
                title="Upload from disk"
              >
                <i className="fas fa-upload"></i>
              </button>
              <button
                className="avatar-btn"
                onClick={handleUrlInput}
                title="From URL"
              >
                <i className="fas fa-link"></i>
              </button>
              <button
                className="avatar-btn"
                onClick={isWebcamActive ? stopWebcam : startWebcam}
                title={isWebcamActive ? 'Stop webcam' : 'Use webcam'}
              >
                <i className={`fas ${isWebcamActive ? 'fa-video-slash' : 'fa-video'}`}></i>
              </button>
              {isWebcamActive && (
                <button
                  className="avatar-btn capture-btn"
                  onClick={capturePhoto}
                  title="Capture photo"
                >
                  <i className="fas fa-camera"></i>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Hidden elements */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />
      <video ref={videoRef} style={{ display: 'none' }} />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default PlayerAvatar;