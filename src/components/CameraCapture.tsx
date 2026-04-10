import React, { useRef, useState, useEffect } from 'react';
import { Camera, Video, X, Check, RefreshCw, StopCircle } from 'lucide-react';
import Button from './Button';
import { motion, AnimatePresence } from 'motion/react';

interface CameraCaptureProps {
  onCapture: (blob: Blob, type: 'photo' | 'video') => void;
  onClose: () => void;
  mode: 'photo' | 'video';
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose, mode }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const startCamera = async () => {
    try {
      stopCamera();
      const constraints = {
        video: { 
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: mode === 'video'
      };
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setError(null);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Não foi possível acessar a câmera. Verifique as permissões.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const takePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          setPreviewBlob(blob);
          setPreviewUrl(URL.createObjectURL(blob));
        }
      }, 'image/jpeg', 0.8);
    }
  };

  const startRecording = () => {
    if (!stream) return;
    const chunks: BlobPart[] = [];
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8,opus' });
    
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      setPreviewBlob(blob);
      setPreviewUrl(URL.createObjectURL(blob));
    };

    recorder.start();
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleConfirm = () => {
    if (previewBlob) {
      onCapture(previewBlob, mode);
      onClose();
    }
  };

  const handleRetake = () => {
    setPreviewBlob(null);
    setPreviewUrl(null);
    startCamera();
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  return (
    <div className="fixed inset-0 bg-black z-[300] flex flex-col">
      <div className="flex justify-between items-center p-4 text-white">
        <button onClick={onClose} className="p-2 bg-white/10 rounded-full">
          <X size={24} />
        </button>
        <span className="font-bold uppercase tracking-widest text-sm">
          {mode === 'photo' ? 'Capturar Foto' : 'Gravar Vídeo'}
        </span>
        <button onClick={toggleCamera} className="p-2 bg-white/10 rounded-full">
          <RefreshCw size={24} />
        </button>
      </div>

      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-stone-900">
        {previewUrl ? (
          mode === 'photo' ? (
            <img src={previewUrl} className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
          ) : (
            <video src={previewUrl} controls className="max-w-full max-h-full" />
          )
        ) : (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover"
          />
        )}

        {isRecording && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full animate-pulse">
            <div className="w-2 h-2 bg-white rounded-full" />
            <span className="text-xs font-bold">GRAVANDO</span>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
            <div className="bg-white p-6 rounded-3xl">
              <p className="text-red-600 font-bold mb-4">{error}</p>
              <Button onClick={onClose}>Voltar</Button>
            </div>
          </div>
        )}
      </div>

      <div className="p-8 flex justify-center items-center gap-8 bg-black/80 backdrop-blur-md">
        {previewUrl ? (
          <>
            <button 
              onClick={handleRetake}
              className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-white"
            >
              <RefreshCw size={32} />
            </button>
            <button 
              onClick={handleConfirm}
              className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-red-900/40"
            >
              <Check size={40} />
            </button>
          </>
        ) : (
          mode === 'photo' ? (
            <button 
              onClick={takePhoto}
              className="w-20 h-20 bg-white rounded-full border-4 border-gray-300 flex items-center justify-center"
            >
              <div className="w-16 h-16 bg-white rounded-full border-2 border-black/10" />
            </button>
          ) : (
            <button 
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-20 h-20 rounded-full border-4 border-gray-300 flex items-center justify-center ${isRecording ? 'bg-white' : 'bg-red-600'}`}
            >
              {isRecording ? (
                <StopCircle size={48} className="text-red-600" />
              ) : (
                <Video size={40} className="text-white" />
              )}
            </button>
          )
        )}
      </div>
    </div>
  );
};
