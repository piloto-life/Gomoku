import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import logger from '../utils/logger';
import md5 from 'blueimp-md5';

interface PlayerAvatarProps {
  size?: 'small' | 'medium' | 'large';
  showWebcam?: boolean;
  editable?: boolean;
  avatarUrl?: string;
  alt?: string;
  name?: string;
  fallbackToAuth?: boolean;
}

// Paleta de cores para avatares padrão
const COLOR_PALETTE = [
  '#F44336', '#E91E63', '#9C27B0', '#3F51B5', '#2196F3',
  '#009688', '#4CAF50', '#FF9800', '#795548', '#607D8B'
];

function hashString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function generateAvatarSvg(initial: string, bgColor: string) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">` +
    `<rect width="100%" height="100%" fill="${bgColor}"/>` +
    `<text x="50%" y="56%" font-size="44" fill="#ffffff" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="700">${initial}</text>` +
    `</svg>`;
  return svg;
}

function svgToDataUrl(svg: string) {
  try {
    return 'data:image/svg+xml;base64,' + btoa(svg);
  } catch (e) {
    // Fallback to encodeURIComponent if btoa isn't available for any reason
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }
}

function pickDefaultAvatar(seed?: string) {
  const key = (seed || '').trim() || 'anon';
  const idx = hashString(key) % COLOR_PALETTE.length;
  const initial = key.length > 0 ? key[0].toUpperCase() : '?';
  const svg = generateAvatarSvg(initial, COLOR_PALETTE[idx]);
  return svgToDataUrl(svg);
}

const PlayerAvatar: React.FC<PlayerAvatarProps> = ({ 
  size = 'medium', 
  showWebcam = false,
  editable = false,
  avatarUrl,
  alt,
  name,
  fallbackToAuth = true
}) => {
  const { user } = useAuth();
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState<string>('');
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
    if (!email) return `https://www.gravatar.com/avatar/?s=${size}&d=identicon&r=pg`;
    // Gravatar expects an MD5 hex of the trimmed/lowercased email
    try {
      const normalized = email.toLowerCase().trim();
      const hash = md5(normalized);
      return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon&r=pg`;
    } catch (e) {
      // Fallback to generic gravatar URL if hashing fails
      return `https://www.gravatar.com/avatar/?s=${size}&d=identicon&r=pg`;
    }
  };

  // Função para obter a URL do avatar
  const getAvatarUrl = () => {
    // If an image failed to load, prefer a generated default avatar
    if (imageError) {
      return pickDefaultAvatar(name || user?.id || user?.email);
    }

    // Prefer explicit prop first
    if (avatarUrl) {
      return avatarUrl;
    }

    // Then any locally set/uploaded avatar
    if (avatarSrc) {
      return avatarSrc;
    }

    // Optionally fall back to authenticated user data
    if (fallbackToAuth) {
      if (user?.avatar) {
        return user.avatar;
      }
      if (user?.email) {
        return getGravatarUrl(user.email);
      }
    }

    // Final fallback: generated deterministic avatar based on name/id/email
    return pickDefaultAvatar(name || user?.id || user?.email);
  };

  const handleImageError = () => {
    logger.warn('AVATAR', 'Failed to load avatar image', { 
      originalSrc: avatarUrl || avatarSrc || user?.avatar,
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

  // Reset image error when the source or identifying props change
  useEffect(() => {
    setImageError(false);
  }, [avatarUrl, avatarSrc, user?.avatar, user?.email, name]);

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
          <img
            src={getAvatarUrl()}
            alt={alt || name || user?.name || 'Player'}
            className="avatar-image"
            onError={handleImageError}
            onLoad={() => setImageError(false)}
          />
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