import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, Layers, Check, Plus, Trash2, ArrowRight } from 'lucide-react';
import Button from './Button';
import { motion, AnimatePresence } from 'motion/react';

export interface QuickCapturedPhoto {
  id: string;
  blob: Blob;
  previewUrl: string;
  timestamp: number;
}

interface QuickCameraCaptureProps {
  onFinish: (photos: QuickCapturedPhoto[]) => void;
  onClose: () => void;
  initialPhotos?: QuickCapturedPhoto[];
}

export const QuickCameraCapture: React.FC<QuickCameraCaptureProps> = ({
  onFinish,
  onClose,
  initialPhotos = []
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photos, setPhotos] = useState<QuickCapturedPhoto[]>(initialPhotos);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [flashAnimation, setFlashAnimation] = useState(false);

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
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
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

    // Trigger visual flash
    setFlashAnimation(true);
    setTimeout(() => setFlashAnimation(false), 200);

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const previewUrl = URL.createObjectURL(blob);
          const newPhoto: QuickCapturedPhoto = {
            id: `quick_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            blob,
            previewUrl,
            timestamp: Date.now()
          };
          setPhotos(prev => [...prev, newPhoto]);
        }
      }, 'image/jpeg', 0.85);
    }
  };

  const removePhoto = (id: string) => {
    setPhotos(prev => {
      const target = prev.find(p => p.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter(p => p.id !== id);
    });
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const handleFinish = () => {
    stopCamera();
    onFinish(photos);
  };

  const handleClose = () => {
    stopCamera();
    // Revoke any unsaved photos if discarded
    photos.forEach(p => URL.revokeObjectURL(p.previewUrl));
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black z-[300] flex flex-col select-none">
      {/* Top Bar */}
      <div className="flex justify-between items-center px-4 py-3 bg-black/60 backdrop-blur-md text-white z-10">
        <button 
          onClick={handleClose} 
          className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          title="Fechar"
        >
          <X size={22} />
        </button>

        <div className="flex flex-col items-center">
          <span className="font-bold text-sm tracking-wide flex items-center gap-1.5 text-white">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            Captura Rápida Sequencial
          </span>
          <span className="text-xs text-white/70">
            {photos.length === 0 ? 'Nenhuma foto tirada' : `${photos.length} ${photos.length === 1 ? 'foto capturada' : 'fotos capturadas'}`}
          </span>
        </div>

        <button 
          onClick={toggleCamera} 
          className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          title="Inverter câmera"
        >
          <RefreshCw size={22} />
        </button>
      </div>

      {/* Camera Viewport */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-stone-950">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="w-full h-full object-cover"
        />

        {/* Shutter Flash Animation */}
        <AnimatePresence>
          {flashAnimation && (
            <motion.div 
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-white pointer-events-none z-20"
            />
          )}
        </AnimatePresence>

        {error && (
          <div className="absolute inset-0 flex items-center justify-center p-8 text-center bg-black/80 z-30">
            <div className="bg-white p-6 rounded-3xl max-w-sm">
              <p className="text-red-600 font-bold mb-4">{error}</p>
              <Button onClick={handleClose}>Fechar</Button>
            </div>
          </div>
        )}

        {/* Live counter overlay */}
        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 border border-white/10 pointer-events-none">
          <Camera size={14} className="text-red-400" />
          <span>{photos.length} fotos</span>
        </div>
      </div>

      {/* Bottom Tray: Thumbnails + Shutter + Done Action */}
      <div className="bg-stone-900/95 border-t border-white/10 backdrop-blur-md px-4 py-4 flex flex-col gap-3 z-10">
        {/* Horizontal Thumbnails Carousel */}
        {photos.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full scrollbar-thin scrollbar-thumb-white/20">
            {photos.map((photo, idx) => (
              <div 
                key={photo.id} 
                className="relative flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 border-white/30 shadow-md group"
              >
                <img 
                  src={photo.previewUrl} 
                  alt={`Captura ${idx + 1}`} 
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-0.5 left-0.5 bg-black/70 text-white text-[9px] px-1 rounded font-bold">
                  {idx + 1}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removePhoto(photo.id);
                  }}
                  className="absolute top-0.5 right-0.5 bg-red-600/90 hover:bg-red-700 text-white rounded-full p-0.5 shadow transition-transform active:scale-90"
                  title="Remover foto"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Controls Row */}
        <div className="flex items-center justify-between gap-4 pt-1">
          <button
            onClick={handleClose}
            className="text-xs font-semibold text-white/70 hover:text-white px-3 py-2 rounded-xl transition-colors"
          >
            Cancelar
          </button>

          {/* Big Sequential Shutter Button */}
          <button 
            onClick={takePhoto}
            className="w-18 h-18 rounded-full bg-white border-4 border-gray-400/80 active:scale-95 transition-all flex items-center justify-center shadow-2xl hover:border-red-500"
            title="Tirar Foto Sequencial"
          >
            <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center text-white shadow-inner">
              <Camera size={26} />
            </div>
          </button>

          {/* Done / Finish Button */}
          <button
            onClick={handleFinish}
            disabled={photos.length === 0}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md ${
              photos.length > 0 
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-900/30' 
                : 'bg-white/10 text-white/40 cursor-not-allowed'
            }`}
          >
            <span>Concluir</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
