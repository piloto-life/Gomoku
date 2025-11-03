import React, { useState, useRef, useCallback } from 'react';
import { useUI } from '../contexts/UIContext';

interface ScreenRecorderProps {
  isInGame?: boolean;
  onRecordingStart?: () => void;
  onRecordingStop?: (blob: Blob) => void;
  onRecordingError?: (error: string) => void;
}

const ScreenRecorder: React.FC<ScreenRecorderProps> = ({
  isInGame = false,
  onRecordingStart,
  onRecordingStop,
  onRecordingError
}) => {
  const { settings } = useUI();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [recordingStatus, setRecordingStatus] = useState<'idle' | 'starting' | 'recording' | 'stopping' | 'error'>('idle');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startTimer = useCallback(() => {
    setRecordingTime(0);
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const startRecording = async () => {
    try {
      setRecordingStatus('starting');
      setRecordedChunks([]);

      // Solicitar permissão para capturar a tela
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
          frameRate: { ideal: 30, max: 30 }
        },
        audio: settings.audioSettings.globalAudio // Capturar áudio se habilitado
      });

      streamRef.current = stream;

      // Configurar MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9' // Codec de alta qualidade
      });

      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
          setRecordedChunks(prev => [...prev, event.data]);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        onRecordingStop?.(blob);
        stopTimer();
        setIsRecording(false);
        setRecordingStatus('idle');
      };

      mediaRecorder.onerror = (event) => {
        const error = `Erro na gravação: ${event}`;
        console.error(error);
        onRecordingError?.(error);
        setRecordingStatus('error');
        stopRecording();
      };

      // Detectar quando o usuário para a captura de tela
      stream.getVideoTracks()[0].onended = () => {
        stopRecording();
      };

      // Iniciar gravação
      mediaRecorder.start(1000); // Salvar dados a cada segundo
      setIsRecording(true);
      setRecordingStatus('recording');
      startTimer();
      onRecordingStart?.();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao iniciar gravação';
      console.error('Erro ao iniciar gravação:', error);
      onRecordingError?.(errorMessage);
      setRecordingStatus('error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      setRecordingStatus('stopping');
      mediaRecorderRef.current.stop();
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  };

  const downloadRecording = () => {
    if (recordedChunks.length > 0) {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gomoku-game-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const getStatusIcon = () => {
    switch (recordingStatus) {
      case 'starting':
        return <i className="fas fa-spinner fa-spin"></i>;
      case 'recording':
        return <i className="fas fa-stop recording-pulse"></i>;
      case 'stopping':
        return <i className="fas fa-spinner fa-spin"></i>;
      case 'error':
        return <i className="fas fa-exclamation-triangle"></i>;
      default:
        return <i className="fas fa-video"></i>;
    }
  };

  const getStatusText = () => {
    switch (recordingStatus) {
      case 'starting':
        return 'Iniciando gravação...';
      case 'recording':
        return `Gravando - ${formatTime(recordingTime)}`;
      case 'stopping':
        return 'Finalizando gravação...';
      case 'error':
        return 'Erro na gravação';
      default:
        return 'Pronto para gravar';
    }
  };

  const canStartRecording = recordingStatus === 'idle' && isInGame;
  const canStopRecording = recordingStatus === 'recording';

  return (
    <div className="screen-recorder">
      <div className="recorder-header">
        <h4>
          <i className="fas fa-video"></i>
          Gravação de Tela
        </h4>
        <div className={`recording-status ${recordingStatus}`}>
          {getStatusIcon()}
          <span>{getStatusText()}</span>
        </div>
      </div>

      <div className="recorder-controls">
        {!isInGame && (
          <div className="recorder-info">
            <i className="fas fa-info-circle"></i>
            <span>A gravação estará disponível durante o jogo</span>
          </div>
        )}

        {isInGame && (
          <div className="recording-actions">
            {!isRecording && canStartRecording && (
              <button
                className="btn btn-primary record-btn"
                onClick={startRecording}
                disabled={recordingStatus !== 'idle'}
              >
                <i className="fas fa-play"></i>
                Iniciar Gravação
              </button>
            )}

            {canStopRecording && (
              <button
                className="btn btn-danger stop-btn"
                onClick={stopRecording}
              >
                <i className="fas fa-stop"></i>
                Parar Gravação
              </button>
            )}

            {recordingStatus === 'error' && (
              <button
                className="btn btn-secondary retry-btn"
                onClick={() => {
                  setRecordingStatus('idle');
                  setRecordedChunks([]);
                }}
              >
                <i className="fas fa-redo"></i>
                Tentar Novamente
              </button>
            )}
          </div>
        )}

        {recordedChunks.length > 0 && !isRecording && (
          <div className="recording-actions">
            <button
              className="btn btn-secondary download-btn"
              onClick={downloadRecording}
            >
              <i className="fas fa-download"></i>
              Baixar Gravação
            </button>
          </div>
        )}
      </div>

      {isRecording && (
        <div className="recording-info">
          <div className="recording-details">
            <div className="time-display">
              <i className="fas fa-clock"></i>
              <span>{formatTime(recordingTime)}</span>
            </div>
            <div className="file-size">
              <i className="fas fa-hdd"></i>
              <span>{(recordedChunks.reduce((acc, chunk) => acc + chunk.size, 0) / 1024 / 1024).toFixed(1)} MB</span>
            </div>
          </div>
          
          <div className="recording-tips">
            <p>
              <i className="fas fa-lightbulb"></i>
              Dica: Você pode parar a gravação clicando no botão "Parar compartilhamento" do navegador
            </p>
          </div>
        </div>
      )}

      <div className="recorder-settings">
        <h5>Configurações de Gravação</h5>
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.audioSettings.globalAudio}
              onChange={(e) => {
                // Aqui você atualizaria a configuração de áudio
                console.log('Audio setting:', e.target.checked);
              }}
            />
            <span>Incluir áudio do sistema</span>
          </label>
        </div>
        <div className="setting-info">
          <small>
            <i className="fas fa-info-circle"></i>
            A gravação captura toda a tela. Qualidade: 1080p@30fps
          </small>
        </div>
      </div>
    </div>
  );
};

export default ScreenRecorder;