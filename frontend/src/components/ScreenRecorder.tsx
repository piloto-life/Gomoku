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
    // 1. Verificação de suporte
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      const errorMsg = 'Gravação de tela não é suportada neste dispositivo/navegador (Mobile não suportado).';
      console.error(errorMsg);
      onRecordingError?.(errorMsg);
      setRecordingStatus('error');
      return;
    }

    try {
      // 2. Chamar a API IMEDIATAMENTE para garantir que o navegador reconheça o clique do usuário.
      // Não use 'await' em setStates antes disso.
      const streamPromise = navigator.mediaDevices.getDisplayMedia({
        video: {
          // Removemos 'max' para evitar erros em monitores menores/maiores
          width: { ideal: 1920 }, 
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        },
        // Captura áudio apenas se habilitado e suportado pelo navegador
        audio: settings.audioSettings.globalAudio 
      });

      // 3. Atualizar UI enquanto o usuário escolhe a janela
      setRecordingStatus('starting');
      setRecordedChunks([]);

      // 4. Aguardar a escolha do usuário
      const stream = await streamPromise;
      streamRef.current = stream;

      // Configurar MediaRecorder
      const options = { mimeType: 'video/webm;codecs=vp9' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'video/webm'; // Fallback
      }

      const mediaRecorder = new MediaRecorder(stream, options);
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
        
        // Limpar tracks para parar o ícone de compartilhamento no navegador
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
      };

      mediaRecorder.onerror = (event) => {
        // Casting para 'any' para acessar a propriedade error de forma segura ou usar string template
        const errorTarget = event.target as any;
        const error = `Erro na gravação: ${errorTarget?.error?.message || 'Erro desconhecido'}`;
        console.error(error);
        onRecordingError?.(error);
        setRecordingStatus('error');
        stopRecording();
      };

      // Detectar quando o usuário clica em "Parar compartilhamento" na barra do navegador
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
      let errorMessage = 'Erro ao iniciar gravação.';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Permissão negada ou cancelada pelo usuário.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'Nenhuma fonte de vídeo encontrada.';
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'Erro de hardware ou permissão do sistema operacional.';
        } else {
            errorMessage = error.message;
        }
      }
      
      console.error('Erro detalhado:', error);
      onRecordingError?.(errorMessage);
      setRecordingStatus('error');
      
      // Resetar estado se falhar no início
      setTimeout(() => setRecordingStatus('idle'), 3000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      setRecordingStatus('stopping');
      mediaRecorderRef.current.stop();
      // A limpeza do stream acontece no evento onstop
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
        return 'Iniciando...';
      case 'recording':
        return `REC ${formatTime(recordingTime)}`;
      case 'stopping':
        return 'Salvando...';
      case 'error':
        return 'Erro';
      default:
        return 'Gravar Tela';
    }
  };

  const canStartRecording = recordingStatus === 'idle' && isInGame;
  const canStopRecording = recordingStatus === 'recording';

  return (
    <div className="screen-recorder">
      <div className="recorder-header">
        <h4>
          <i className="fas fa-film"></i>
          Gravação
        </h4>
        <div className={`recording-status ${recordingStatus}`}>
          {getStatusIcon()}
          <span>{getStatusText()}</span>
        </div>
      </div>

      <div className="recorder-controls">
        {!isInGame && (
          <div className="recorder-info">
            <small>Disponível na partida</small>
          </div>
        )}

        {isInGame && (
          <div className="recording-actions">
            {!isRecording && canStartRecording && (
              <button
                className="btn btn-primary record-btn"
                onClick={startRecording}
                disabled={recordingStatus !== 'idle'}
                title="Gravar partida"
              >
                <i className="fas fa-circle"></i>
                Gravar
              </button>
            )}

            {canStopRecording && (
              <button
                className="btn btn-danger stop-btn"
                onClick={stopRecording}
                title="Parar gravação"
              >
                <i className="fas fa-square"></i>
                Parar
              </button>
            )}

            {recordingStatus === 'error' && (
              <button
                className="btn btn-secondary retry-btn"
                onClick={() => setRecordingStatus('idle')}
              >
                <i className="fas fa-redo"></i>
                Resetar
              </button>
            )}
          </div>
        )}

        {recordedChunks.length > 0 && !isRecording && (
          <div className="recording-actions">
            <button
              className="btn btn-success download-btn"
              onClick={downloadRecording}
              title="Baixar vídeo"
            >
              <i className="fas fa-download"></i>
              Baixar
            </button>
          </div>
        )}
      </div>

      {isRecording && (
        <div className="recording-info">
          <div className="recording-details">
            <div className="file-size">
              <i className="fas fa-hdd"></i>
              <span>{(recordedChunks.reduce((acc, chunk) => acc + chunk.size, 0) / 1024 / 1024).toFixed(1)} MB</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScreenRecorder;
