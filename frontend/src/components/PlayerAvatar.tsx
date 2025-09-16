import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface PlayerAvatarProps {
  size?: 'small' | 'medium' | 'large';
  showWebcam?: boolean;
  editable?: boolean;
}

const PlayerAvatar: React.FC<PlayerAvatarProps> = ({ 
  size = 'medium', 
  showWebcam = false,
  editable = false 
}) => {
  const { user } = useAuth();
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState(user?.email || ''); // Using email as placeholder
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-16 h-16',
    large: 'w-24 h-24'
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
          <img
            src={avatarSrc || '/default-avatar.png'}
            alt={user?.email || 'Player'}
            className="avatar-image"
            onError={(e) => {
              e.currentTarget.src = '/default-avatar.png';
            }}
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