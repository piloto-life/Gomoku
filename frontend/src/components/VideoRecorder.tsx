import React, { useState, useRef, useEffect } from 'react';
import './VideoRecorder.css';

interface VideoRecorderProps {
  gameId: string;
  onRecordingStart?: () => void;
  onRecordingStop?: (videoUrl: string) => void;
}

const VideoRecorder: React.FC<VideoRecorderProps> = ({
  gameId,
  onRecordingStart,
  onRecordingStop
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Limpar recursos ao desmontar
  useEffect(() => {
    return () => {
      stopRecording();
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      // Capturar o canvas do jogo + áudio
      const gameCanvas = document.querySelector('canvas') as HTMLCanvasElement;
      
      if (!gameCanvas) {
        alert('Canvas do jogo não encontrado');
        return;
      }

      // Stream do canvas
      const canvasStream = gameCanvas.captureStream(24); // 24 FPS
      
      // Tentar capturar áudio do microfone (opcional)
      let audioStream: MediaStream | null = null;
      try {
        audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (e) {
        console.warn('Microfone não disponível:', e);
      }

      // Combinar streams
      let finalStream: MediaStream;
      
      if (audioStream) {
        finalStream = new MediaStream([
          ...canvasStream.getVideoTracks(),
          ...audioStream.getAudioTracks()
        ]);
      } else {
        finalStream = canvasStream;
      }

      streamRef.current = finalStream;

      // Configurar MediaRecorder
      const options = {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 4000000 // 4 Mbit/s
      };

      const mediaRecorder = new MediaRecorder(finalStream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      // Coletar chunks
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // Ao parar gravação
      mediaRecorder.onstop = async () => {
        await handleRecordingStopped();
      };

      // Iniciar gravação
      mediaRecorder.start(1000); // Chunk a cada 1 segundo
      setIsRecording(true);
      setRecordingTime(0);

      // Timer para contagem de tempo
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      if (onRecordingStart) {
        onRecordingStart();
      }

      console.log('Gravação iniciada');

    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      alert('Erro ao iniciar gravação: ' + (error as Error).message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      console.log('Gravação parada');
    }
  };

  const handleRecordingStopped = async () => {
    const blob = new Blob(chunksRef.current, { type: 'video/webm' });
    
    console.log('Vídeo gravado:', blob.size, 'bytes');

    // Upload para servidor
    await uploadVideo(blob);
  };

  const uploadVideo = async (blob: Blob) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      // Opção 1: Upload direto (arquivo grande)
      // Pode causar timeout, melhor usar chunks
      
      // Opção 2: Upload em chunks
      const chunkSize = 256 * 1024; // 256KB por chunk
      const chunks = Math.ceil(blob.size / chunkSize);

      // Iniciar upload
      const initResponse = await fetch('/api/recordings/upload/init', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ game_id: gameId })
      });

      if (!initResponse.ok) {
        throw new Error('Erro ao iniciar upload');
      }

      const { upload_id } = await initResponse.json();

      // Enviar chunks
      for (let i = 0; i < chunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, blob.size);
        const chunk = blob.slice(start, end);

        // Converter para Base64
        const base64Chunk = await blobToBase64(chunk);

        await fetch('/api/recordings/upload/chunk', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            upload_id,
            chunk_index: i,
            chunk_data: base64Chunk.split(',')[1] // Remover prefixo data:
          })
        });

        setUploadProgress(Math.round(((i + 1) / chunks) * 100));
      }

      // Finalizar upload
      const finalizeResponse = await fetch(`/api/recordings/upload/finalize/${upload_id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!finalizeResponse.ok) {
        throw new Error('Erro ao finalizar upload');
      }

      const { video_id, url } = await finalizeResponse.json();

      console.log('Upload concluído:', video_id);
      setUploadProgress(100);

      if (onRecordingStop) {
        onRecordingStop(url);
      }

      alert('Vídeo gravado com sucesso!');

    } catch (error) {
      console.error('Erro no upload:', error);
      alert('Erro ao fazer upload do vídeo: ' + (error as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="video-recorder">
      {!isRecording && !isUploading && (
        <button 
          className="btn btn-primary btn-record"
          onClick={startRecording}
        >
          <span className="record-icon">⏺</span> Gravar Partida
        </button>
      )}

      {isRecording && (
        <div className="recording-controls">
          <div className="recording-indicator">
            <span className="pulse-dot"></span>
            <span className="recording-text">Gravando {formatTime(recordingTime)}</span>
          </div>
          <button 
            className="btn btn-danger btn-stop"
            onClick={stopRecording}
          >
            <span>⏹</span> Parar
          </button>
        </div>
      )}

      {isUploading && (
        <div className="upload-progress">
          <div className="progress-text">Enviando vídeo... {uploadProgress}%</div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoRecorder;
