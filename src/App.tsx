import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Home, 
  ClipboardCheck, 
  Camera, 
  Mic, 
  FileText, 
  ChevronRight, 
  ArrowLeft, 
  Trash2, 
  Save, 
  CheckCircle, 
  AlertTriangle, 
  Download, 
  Layers, 
  DollarSign, 
  Play, 
  Pause, 
  X,
  Image as ImageIcon,
  Video as VideoIcon,
  Search,
  Settings,
  MoreVertical,
  Calendar,
  MapPin,
  User,
  Users,
  ArrowRightLeft,
  Briefcase,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  Zap
} from 'lucide-react';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  orderBy, 
  getDocs,
  getDoc,
  serverTimestamp,
  deleteField
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';
import { Inspection, Room, Item, InspectionType, ConservationState, Responsibility, ItemIssue, Owner, Tenant, Property, MediaStatus, AIStatus } from './types';
import { analyzeRoomMedia, transcribeAudio } from './lib/gemini';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// --- UTILS ---
const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

const handleFirestoreError = (error: any, operation: string, path: string) => {
  const errInfo = {
    error: error?.message || String(error),
    operation,
    path,
    timestamp: new Date().toISOString()
  };
  console.error(`[Firestore Error] ${operation} on ${path}:`, JSON.stringify(errInfo, null, 2));
  // In a real app, we might show a toast here
};

// --- COMPONENTS ---

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, icon: Icon, size = 'md' }: any) => {
  const variants: any = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
    secondary: 'bg-white text-indigo-600 border border-indigo-600 hover:bg-indigo-50',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100',
    outline: 'bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50',
  };

  const sizes: any = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={cn(
        'flex items-center justify-center gap-2 rounded-lg font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {Icon && <Icon size={size === 'sm' ? 14 : 18} />}
      {children}
    </button>
  );
};

const Card = ({ children, className = '', onClick }: any) => (
  <div 
    onClick={onClick}
    className={cn('bg-white rounded-xl shadow-sm border border-gray-100 p-4 transition-all hover:shadow-md cursor-pointer', className)}
  >
    {children}
  </div>
);

const Badge = ({ children, variant = 'gray' }: any) => {
  const variants: any = {
    indigo: 'bg-indigo-100 text-indigo-700',
    green: 'bg-green-100 text-green-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    red: 'bg-red-100 text-red-700',
    gray: 'bg-gray-100 text-gray-700',
  };
  return (
    <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold', variants[variant])}>
      {children}
    </span>
  );
};

// --- MAIN APP ---

export default function App() {
  const [view, setView] = useState<'dashboard' | 'new' | 'detail' | 'compare' | 'budget' | 'registrations'>('dashboard');
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [compareInspections, setCompareInspections] = useState<Inspection[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAnalyzingAll, setIsAnalyzingAll] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pendingFiles, setPendingFiles] = useState<Map<string, File>>(new Map());
  const [quickPhotos, setQuickPhotos] = useState<string[]>([]);
  const [isUploadingQuick, setIsUploadingQuick] = useState(false);
  const [localRoomPhotos, setLocalRoomPhotos] = useState<Record<string, string[]>>({});
  const [pdfFiles, setPdfFiles] = useState<{ file1: File | null, file2: File | null }>({ file1: null, file2: null });
  const [isComparingPdfs, setIsComparingPdfs] = useState(false);
  const [pdfComparisonResult, setPdfComparisonResult] = useState<any>(null);

  const handleQuickPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploadingQuick(true);
    const newPhotos: string[] = [];
    
    files.forEach(file => {
      const url = URL.createObjectURL(file);
      newPhotos.push(url);
    });

    setQuickPhotos(prev => [...prev, ...newPhotos]);
    setIsUploadingQuick(false);
  };

  const handleRoomQuickPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, roomId: string) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newPhotos: string[] = [];
    files.forEach(file => {
      const url = URL.createObjectURL(file);
      newPhotos.push(url);
    });

    setLocalRoomPhotos(prev => ({
      ...prev,
      [roomId]: [...(prev[roomId] || []), ...newPhotos]
    }));
  };

  const removeRoomQuickPhoto = (roomId: string, url: string) => {
    setLocalRoomPhotos(prev => ({
      ...prev,
      [roomId]: (prev[roomId] || []).filter(p => p !== url)
    }));
    URL.revokeObjectURL(url);
  };

  const removeQuickPhoto = (url: string) => {
    setQuickPhotos(prev => prev.filter(p => p !== url));
    URL.revokeObjectURL(url);
  };

  // --- DATA FETCHING ---
  useEffect(() => {
    const q = query(collection(db, 'inspections'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Inspection));
      setInspections(data);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'owners'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Owner));
      setOwners(data);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'tenants'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tenant));
      setTenants(data);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'properties'), orderBy('address', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
      setProperties(data);
    }, (error) => handleFirestoreError(error, 'list' as any, 'properties'));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedInspection) {
      const q = query(collection(db, `inspections/${selectedInspection.id}/rooms`), orderBy('createdAt', 'asc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room));
        setRooms(data);
      });
      return () => unsubscribe();
    } else {
      setRooms([]);
    }
  }, [selectedInspection]);

  useEffect(() => {
    if (selectedRoom && selectedInspection) {
      const q = query(collection(db, `inspections/${selectedInspection.id}/rooms/${selectedRoom.id}/items`), orderBy('name', 'asc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item));
        setItems(data);
      });
      return () => unsubscribe();
    } else {
      setItems([]);
    }
  }, [selectedRoom, selectedInspection]);

  useEffect(() => {
    if (editingItem && selectedRoom && selectedInspection) {
      const itemRef = doc(db, `inspections/${selectedInspection.id}/rooms/${selectedRoom.id}/items`, editingItem.id);
      const unsubscribe = onSnapshot(itemRef, (doc) => {
        if (doc.exists()) {
          setEditingItem({ id: doc.id, ...doc.data() } as Item);
        }
      });
      return () => unsubscribe();
    }
  }, [editingItem?.id, selectedRoom?.id, selectedInspection?.id]);

  // --- ACTIONS ---
  const handleDeleteInspection = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir esta vistoria e todos os seus dados permanentemente?")) return;
    
    try {
      setLoading(true);
      // Delete rooms and items first (client-side recursive delete is limited but we try)
      const roomsSnap = await getDocs(collection(db, `inspections/${id}/rooms`));
      for (const roomDoc of roomsSnap.docs) {
        const itemsSnap = await getDocs(collection(db, `inspections/${id}/rooms/${roomDoc.id}/items`));
        for (const itemDoc of itemsSnap.docs) {
          await deleteDoc(doc(db, `inspections/${id}/rooms/${roomDoc.id}/items`, itemDoc.id));
        }
        await deleteDoc(doc(db, `inspections/${id}/rooms`, roomDoc.id));
      }
      
      await deleteDoc(doc(db, 'inspections', id));
      if (selectedInspection?.id === id) {
        setSelectedInspection(null);
        setView('dashboard');
      }
    } catch (error) {
      console.error("Error deleting inspection:", error);
      alert("Erro ao excluir vistoria.");
    } finally {
      setLoading(false);
    }
  };

  const handleRenameRoom = async (roomId: string, newName: string) => {
    if (!selectedInspection || !newName.trim()) return;
    try {
      await updateDoc(doc(db, `inspections/${selectedInspection.id}/rooms`, roomId), {
        name: newName.trim()
      });
    } catch (error) {
      console.error("Error renaming room:", error);
    }
  };

  const handleUpdateRoomDescription = async (roomId: string, description: string) => {
    if (!selectedInspection) return;
    
    // Update local state immediately for responsiveness
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, description } : r));
    if (selectedRoom?.id === roomId) {
      setSelectedRoom(prev => prev ? { ...prev, description } : null);
    }

    try {
      await updateDoc(doc(db, `inspections/${selectedInspection.id}/rooms`, roomId), {
        description: description
      });
    } catch (error) {
      console.error("Error updating room description:", error);
    }
  };

  const handleAnalyzeAllQuickPhotos = async (roomId: string) => {
    if (!selectedInspection || !localRoomPhotos[roomId]) return;
    
    const photosToProcess = [...localRoomPhotos[roomId]];
    // Clear local previews immediately
    setLocalRoomPhotos(prev => ({ ...prev, [roomId]: [] }));

    for (const url of photosToProcess) {
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        const file = new File([blob], `quick_photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
        
        // 1. Create item in Firestore
        const newItem = {
          roomId,
          inspectionId: selectedInspection.id,
          name: `FOTO RÁPIDA ${new Date().toLocaleTimeString()}`,
          condition: 'Bom' as ConservationState,
          description: 'Analisando foto rápida...',
          mediaStatus: 'preview_local' as MediaStatus,
          aiStatus: 'idle' as AIStatus,
          localPreviewUrl: url,
          photos: [],
          videos: [],
          createdAt: new Date().toISOString(),
        };
        
        const docRef = await addDoc(collection(db, `inspections/${selectedInspection.id}/rooms/${roomId}/items`), newItem);
        
        // 2. Process Upload and Analysis
        handleProcessUpload(file, roomId, docRef.id, true);
      } catch (err) {
        console.error("Error processing quick photo:", err);
      }
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!selectedInspection) return;
    if (!window.confirm("Tem certeza que deseja excluir este ambiente e todos os seus itens?")) return;
    
    try {
      setLoading(true);
      const itemsSnap = await getDocs(collection(db, `inspections/${selectedInspection.id}/rooms/${roomId}/items`));
      for (const itemDoc of itemsSnap.docs) {
        await deleteDoc(doc(db, `inspections/${selectedInspection.id}/rooms/${roomId}/items`, itemDoc.id));
      }
      await deleteDoc(doc(db, `inspections/${selectedInspection.id}/rooms`, roomId));
      if (selectedRoom?.id === roomId) setSelectedRoom(null);
    } catch (error) {
      console.error("Error deleting room:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePdfComparison = async () => {
    if (!pdfFiles.file1 || !pdfFiles.file2) {
      alert("Por favor, selecione os dois arquivos PDF para comparação.");
      return;
    }

    setIsComparingPdfs(true);
    try {
      // 1. Extract text from PDFs
      const [text1, text2] = await Promise.all([
        extractTextFromPdf(pdfFiles.file1),
        extractTextFromPdf(pdfFiles.file2)
      ]);

      if (!text1.trim() || !text2.trim()) {
        throw new Error("Um ou ambos os PDFs não contêm texto legível. A IA não pode analisar imagens digitalizadas sem OCR.");
      }

      // 2. Send to Gemini for comparison
      const prompt = `
        Você é um perito especialista em vistorias imobiliárias e análise de laudos técnicos.
        Sua tarefa é realizar uma comparação minuciosa entre dois laudos de vistoria (Entrada e Saída) de um mesmo imóvel.

        OBJETIVOS:
        1. Comparar os dois laudos ambiente por ambiente (ex: Sala, Cozinha, Quarto 1, etc).
        2. Identificar danos, desgastes anormais, manchas, quebras ou qualquer alteração negativa que tenha ocorrido entre a entrada e a saída.
        3. Gerar um orçamento detalhado de reparos para cada dano identificado.
        4. Classificar a responsabilidade de forma justa (Locatário para danos causados por uso; Locador para desgastes naturais ou problemas estruturais).
        5. Estimar o custo de mercado para cada reparo (mão de obra + material).

        DADOS DOS LAUDOS:
        ---
        LAUDO 1 (ENTRADA):
        ${text1.substring(0, 30000)}
        ---
        LAUDO 2 (SAÍDA):
        ${text2.substring(0, 30000)}
        ---

        FORMATO DE SAÍDA (JSON):
        Você deve retornar EXATAMENTE um objeto JSON seguindo este exemplo de estrutura:

        {
          "summary": "Resumo executivo das principais divergências encontradas.",
          "rooms": [
            {
              "name": "Sala de Estar",
              "issues": [
                {
                  "item": "Pintura das Paredes",
                  "description": "Na entrada estava nova e limpa. Na saída apresenta manchas de gordura e furos de pregos não vedados.",
                  "responsibility": "Locatário",
                  "estimatedCost": 450.00
                },
                {
                  "item": "Piso Laminado",
                  "description": "Risco profundo próximo à porta da varanda, não existente no laudo de entrada.",
                  "responsibility": "Locatário",
                  "estimatedCost": 200.00
                }
              ]
            }
          ],
          "totalEstimatedCost": 650.00
        }

        REGRAS IMPORTANTES:
        - Se não houver divergências em um ambiente, não o inclua na lista ou deixe a lista de 'issues' vazia.
        - Seja específico nas descrições.
        - Use valores monetários realistas em Reais (BRL).
        - O campo 'responsibility' deve ser estritamente "Locatário" ou "Locador".
      `;

      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { 
          responseMimeType: "application/json",
          temperature: 0.1 // Even lower for more precision
        }
      });

      const result = JSON.parse(response.text || '{}');
      setPdfComparisonResult(result);
    } catch (error: any) {
      console.error("Error in PDF comparison:", error);
      let errorMessage = "Verifique se os arquivos são válidos.";
      
      if (error.message) {
        try {
          // Try to parse if it's a JSON string from the SDK
          const parsedError = JSON.parse(error.message);
          if (parsedError.error?.message) {
            errorMessage = parsedError.error.message;
            // If it's a 502, it might be a timeout
            if (parsedError.code === 502 || parsedError.error?.code === 502) {
              errorMessage = "O servidor demorou muito para responder. Tente novamente com arquivos menores ou aguarde um momento.";
            }
          } else {
            errorMessage = error.message;
          }
        } catch (e) {
          errorMessage = error.message;
        }
      }
      
      alert(`Erro ao comparar PDFs: ${errorMessage}`);
    } finally {
      setIsComparingPdfs(false);
    }
  };

  const extractTextFromPdf = async (file: File): Promise<string> => {
    const MAX_PAGES = 50;
    const MAX_CHARS = 50000;

    try {
      const pdfjsLib = await import('pdfjs-dist');
      const version = '5.6.205'; 
      // Use unpkg with the .mjs extension which is the modern standard for PDF.js 5.x
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
      
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ 
        data: arrayBuffer,
        useSystemFonts: true,
        disableFontFace: true,
        isEvalSupported: false // Security: disable eval
      });
      
      const pdf = await loadingTask.promise;
      const numPages = Math.min(pdf.numPages, MAX_PAGES);
      
      // Extract pages in parallel for efficiency
      const pagePromises = Array.from({ length: numPages }, (_, i) => i + 1).map(async (pageNum) => {
        try {
          const page = await pdf.getPage(pageNum);
          const content = await page.getTextContent();
          return content.items.map((item: any) => item.str).join(" ");
        } catch (err) {
          console.warn(`Failed to extract text from page ${pageNum}`, err);
          return "";
        }
      });
      
      const pageTexts = await Promise.all(pagePromises);
      const fullText = pageTexts.join("\n");
      
      return fullText.length > MAX_CHARS ? fullText.substring(0, MAX_CHARS) + "..." : fullText;
    } catch (error: any) {
      console.error("Error extracting text from PDF:", error);
      throw new Error(error.message || "Não foi possível extrair o texto do PDF.");
    }
  };

  const handleCreateInspection = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const ownerId = formData.get('ownerId') as string;
    const tenantId = formData.get('tenantId') as string;
    const propertyId = formData.get('propertyId') as string;
    const owner = owners.find(o => o.id === ownerId);
    const tenant = tenants.find(t => t.id === tenantId);

    const newInspection = {
      type: formData.get('type') as InspectionType,
      propertyId: propertyId || null,
      propertyAddress: formData.get('address') as string,
      date: formData.get('date') as string,
      status: 'rascunho',
      inspectorName: formData.get('inspector') as string || 'Vistoriador',
      ownerId: ownerId || null,
      tenantId: tenantId || null,
      ownerName: owner?.name || '',
      tenantName: tenant?.name || '',
      createdAt: new Date().toISOString(),
    };

    try {
      setLoading(true);
      const docRef = await addDoc(collection(db, 'inspections'), newInspection);
      setSelectedInspection({ id: docRef.id, ...newInspection } as Inspection);
      setView('detail');
    } catch (error) {
      console.error("Error creating inspection:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!selectedInspection || !selectedRoom) return;
    if (!window.confirm("Tem certeza que deseja excluir este item e todas as suas mídias?")) return;

    try {
      setLoading(true);
      console.log(`[MEDIA] delete started: ${itemId}`);
      
      const itemRef = doc(db, `inspections/${selectedInspection.id}/rooms/${selectedRoom.id}/items`, itemId);
      const itemSnap = await getDoc(itemRef);
      
      if (itemSnap.exists()) {
        const itemData = itemSnap.data() as Item;

        // Revoke local preview if exists
        if (itemData.localPreviewUrl) {
          console.log(`[MEDIA] revoking local preview: ${itemData.localPreviewUrl}`);
          URL.revokeObjectURL(itemData.localPreviewUrl);
        }

        // Delete photos from storage
        if (itemData.photos) {
          for (const url of itemData.photos) {
            if (url.startsWith('http')) {
              try {
                const fileRef = ref(storage, url);
                await deleteObject(fileRef);
                console.log(`[MEDIA] deleted photo from storage: ${url}`);
              } catch (e) {
                console.warn(`[MEDIA] error deleting photo from storage: ${url}`, e);
              }
            }
          }
        }

        // Delete videos from storage
        if (itemData.videos) {
          for (const url of itemData.videos) {
            if (url.startsWith('http')) {
              try {
                const fileRef = ref(storage, url);
                await deleteObject(fileRef);
                console.log(`[MEDIA] deleted video from storage: ${url}`);
              } catch (e) {
                console.warn(`[MEDIA] error deleting video from storage: ${url}`, e);
              }
            }
          }
        }
      }

      // Delete from mediaAttachments collection
      const attachmentsQuery = query(collection(db, 'mediaAttachments'), where('itemId', '==', itemId));
      const attachmentsSnap = await getDocs(attachmentsQuery);
      for (const attachmentDoc of attachmentsSnap.docs) {
        await deleteDoc(doc(db, 'mediaAttachments', attachmentDoc.id));
        console.log(`[MEDIA] deleted metadata: ${attachmentDoc.id}`);
      }

      await deleteDoc(itemRef);
      console.log(`[MEDIA] deleted item from firestore: ${itemId}`);
    } catch (error) {
      console.error(`[MEDIA] delete failed: ${itemId}`, error);
      alert(`Erro ao excluir item: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMedia = async (itemId: string, mediaUrl: string, type: 'photo' | 'video') => {
    if (!selectedInspection || !selectedRoom) return;
    if (!window.confirm(`Tem certeza que deseja excluir esta ${type === 'photo' ? 'foto' : 'vídeo'}?`)) return;

    try {
      setLoading(true);
      console.log(`[MEDIA] delete media started: ${type} - ${mediaUrl}`);
      
      // 1. Delete from Storage (if it's a remote URL)
      if (mediaUrl.startsWith('http')) {
        try {
          const fileRef = ref(storage, mediaUrl);
          await deleteObject(fileRef);
          console.log(`[MEDIA] deleted from storage: ${mediaUrl}`);
        } catch (storageErr) {
          console.warn(`[MEDIA] storage delete error:`, storageErr);
        }
      } else if (mediaUrl.startsWith('blob:')) {
        URL.revokeObjectURL(mediaUrl);
        console.log(`[MEDIA] revoked local preview: ${mediaUrl}`);
      }

      // 2. Update/Delete Item document
      const itemRef = doc(db, `inspections/${selectedInspection.id}/rooms/${selectedRoom.id}/items`, itemId);
      const itemSnap = await getDoc(itemRef);
      
      if (itemSnap.exists()) {
        const itemData = itemSnap.data() as Item;
        const photos = itemData.photos || [];
        const videos = itemData.videos || [];
        
        const newPhotos = photos.filter(url => url !== mediaUrl);
        const newVideos = videos.filter(url => url !== mediaUrl);
        
        // Also clear localPreviewUrl if it matches
        const updateData: any = { 
          photos: newPhotos,
          videos: newVideos
        };
        
        if (itemData.localPreviewUrl === mediaUrl) {
          updateData.localPreviewUrl = deleteField();
          updateData.mediaStatus = 'ready_for_analysis'; // If we delete the preview that was in error, reset status
        }
        
        if (newPhotos.length === 0 && newVideos.length === 0 && !updateData.localPreviewUrl) {
          console.log(`[MEDIA] deleting empty item document: ${itemId}`);
          await deleteDoc(itemRef);
        } else {
          console.log(`[MEDIA] updating item document: ${itemId}`);
          await updateDoc(itemRef, updateData);
        }
      }

      // 3. Delete from mediaAttachments collection
      const attachmentsQuery = query(collection(db, 'mediaAttachments'), where('downloadURL', '==', mediaUrl));
      const attachmentsSnap = await getDocs(attachmentsQuery);
      for (const attachmentDoc of attachmentsSnap.docs) {
        await deleteDoc(doc(db, 'mediaAttachments', attachmentDoc.id));
        console.log(`[MEDIA] deleted metadata: ${attachmentDoc.id}`);
      }

      console.log(`[MEDIA] delete media success`);
    } catch (error) {
      console.error(`[MEDIA] delete media failed:`, error);
      alert(`Erro ao excluir mídia: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoom = async (name: string) => {
    if (!selectedInspection) return;
    try {
      const newRoom = {
        inspectionId: selectedInspection.id,
        name,
        description: '',
        status: 'pendente',
        createdAt: new Date().toISOString(),
      };
      await addDoc(collection(db, `inspections/${selectedInspection.id}/rooms`), newRoom);
    } catch (error) {
      console.error("Error adding room:", error);
    }
  };

  const handleUploadMedia = async (file: File, roomId: string, itemId: string, onProgress?: (progress: number) => void) => {
    if (!selectedInspection) {
      throw new Error("Nenhuma vistoria selecionada.");
    }
    if (!roomId || !itemId) {
      throw new Error("Room ID ou Item ID ausente.");
    }

    const isVideo = file.type.startsWith('video/');
    // Sanitize file name: remove special characters and spaces
    const sanitizedName = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
    const storagePath = `inspections/${selectedInspection.id}/${roomId}/${itemId}/${sanitizedName}`;
    console.log(`[Storage] Iniciando upload: ${storagePath}`);
    
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        uploadTask.cancel();
        reject(new Error("Timeout no upload (60s excedidos)."));
      }, 60000); // 60 seconds timeout

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(progress);
          console.log(`[Storage] Progresso de ${file.name}: ${progress.toFixed(2)}%`);
        }, 
        (error) => {
          clearTimeout(timeout);
          console.error(`[Storage] Erro no uploadTask para ${file.name}:`, error);
          reject(error);
        }, 
        async () => {
          clearTimeout(timeout);
          try {
            console.log(`[Storage] Upload concluído para ${file.name}. Obtendo URL...`);
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            console.log(`[Storage] URL de download obtida: ${url}`);
            resolve(url);
          } catch (err) {
            console.error(`[Storage] Erro ao obter URL de download para ${file.name}:`, err);
            reject(err);
          }
        }
      );
    });
  };

  const handleProcessUpload = async (file: File, roomId: string, itemId: string, isNewItem: boolean = false) => {
    if (!selectedInspection) return;
    
    const itemRef = doc(db, `inspections/${selectedInspection.id}/rooms/${roomId}/items`, itemId);
    const isVideo = file.type.startsWith('video/');
    
    // [MEDIA] file selected
    console.log(`[MEDIA] file selected: ${file.name} (${file.type})`);
    
    // 1. Create Local Preview
    const localUrl = URL.createObjectURL(file);
    console.log(`[MEDIA] local preview created: ${localUrl}`);
    
    // Store file for potential retry
    setPendingFiles(prev => {
      const next = new Map(prev);
      next.set(itemId, file);
      return next;
    });

    try {
      // Set initial status to preview_local
      await updateDoc(itemRef, { 
        mediaStatus: 'preview_local',
        localPreviewUrl: localUrl,
        uploadProgress: 0
      });

      // 2. Start Storage Upload
      console.log(`[MEDIA] upload started: ${file.name}`);
      await updateDoc(itemRef, { mediaStatus: 'uploading' });
      
      const url = await handleUploadMedia(file, roomId, itemId, async (progress) => {
        // [MEDIA] upload progress X%
        console.log(`[MEDIA] upload progress ${Math.floor(progress)}%`);
        // Update progress in Firestore (throttled)
        if (Math.floor(progress) % 10 === 0) {
          await updateDoc(itemRef, { uploadProgress: progress });
        }
      }) as string;
      
      // [MEDIA] upload success
      console.log(`[MEDIA] upload success: ${file.name}`);
      // [MEDIA] downloadURL success
      console.log(`[MEDIA] downloadURL success: ${url}`);
      
      await updateDoc(itemRef, { 
        mediaStatus: 'uploaded',
        uploadProgress: 100,
        tempDownloadUrl: url // Store URL temporarily for sync retries
      });

      // 3. Firestore Metadata Sync (Background)
      // [MEDIA] firestore sync started
      console.log(`[MEDIA] firestore sync started: ${itemId}`);
      await updateDoc(itemRef, { mediaStatus: 'metadata_syncing' });
      
      try {
        const attachmentData = {
          inspectionId: selectedInspection.id,
          roomId: roomId,
          itemId: itemId,
          type: isVideo ? 'video' : 'photo',
          fileName: file.name,
          storagePath: `inspections/${selectedInspection.id}/${roomId}/${itemId}/${file.name}`,
          downloadURL: url,
          contentType: file.type,
          createdAt: new Date().toISOString()
        };
        
        await addDoc(collection(db, 'mediaAttachments'), attachmentData);
        
        const itemSnap = await getDoc(itemRef);
        if (itemSnap.exists()) {
          const currentData = itemSnap.data();
          const updatedPhotos = isVideo ? (currentData.photos || []) : [...(currentData.photos || []), url];
          const updatedVideos = isVideo ? [...(currentData.videos || []), url] : (currentData.videos || []);
          
          await updateDoc(itemRef, { 
            photos: updatedPhotos,
            videos: updatedVideos,
            mediaStatus: 'ready_for_analysis',
            localPreviewUrl: deleteField(),
            tempDownloadUrl: deleteField(),
            description: isNewItem ? (isVideo ? 'Vídeo anexado.' : 'Pronto para análise.') : (currentData.description || '')
          });
          
          // [MEDIA] firestore sync success
          console.log(`[MEDIA] firestore sync success: ${itemId}`);
          // [MEDIA] final visual state = ready_for_analysis
          console.log(`[MEDIA] final visual state = ready_for_analysis`);

          // 4. AI Analysis (Decoupled - Now manual)
          
          // Remove from pending
          setPendingFiles(prev => {
            const next = new Map(prev);
            next.delete(itemId);
            return next;
          });
        }
      } catch (syncError) {
        // [MEDIA] firestore sync failed
        console.error(`[MEDIA] firestore sync failed: ${itemId}`, syncError);
        await updateDoc(itemRef, { mediaStatus: 'metadata_error' });
      }
    } catch (error) {
      console.error(`[MEDIA] upload failed: ${itemId}`, error);
      await updateDoc(itemRef, { mediaStatus: 'error' });
    }
  };

  const handleRetryUpload = async (itemId: string, roomId: string) => {
    const file = pendingFiles.get(itemId);
    if (!file) {
      alert("Arquivo não encontrado na sessão atual. Por favor, selecione o arquivo novamente.");
      return;
    }
    await handleProcessUpload(file, roomId, itemId, false);
  };

  const handleRetrySync = async (itemId: string, roomId: string) => {
    if (!selectedInspection) return;
    const itemRef = doc(db, `inspections/${selectedInspection.id}/rooms/${roomId}/items`, itemId);
    
    try {
      const itemSnap = await getDoc(itemRef);
      if (!itemSnap.exists()) return;
      
      const itemData = itemSnap.data();
      const url = itemData.tempDownloadUrl;
      
      if (!url) {
        // If no temp URL, we might need to re-upload
        const file = pendingFiles.get(itemId);
        if (file) {
          console.log(`[MEDIA] sync retry: tempDownloadUrl missing, re-uploading file`);
          await handleProcessUpload(file, roomId, itemId, false);
        } else {
          console.error(`[MEDIA] sync retry failed: no URL and no file in memory`);
          alert("Não foi possível recuperar o link do upload. Por favor, tente enviar o arquivo novamente.");
          await updateDoc(itemRef, { mediaStatus: 'error' });
        }
        return;
      }

      // [MEDIA] firestore sync started
      console.log(`[MEDIA] firestore sync started (retry): ${itemId}`);
      await updateDoc(itemRef, { mediaStatus: 'metadata_syncing' });

      const isVideo = itemData.videos?.length > 0 || itemData.name?.toLowerCase().endsWith('.mp4');
      
      const attachmentData = {
        inspectionId: selectedInspection.id,
        roomId: roomId,
        itemId: itemId,
        type: isVideo ? 'video' : 'photo',
        fileName: itemData.name || 'arquivo_recuperado',
        storagePath: `inspections/${selectedInspection.id}/${roomId}/${itemId}/${itemData.name || 'arquivo_recuperado'}`,
        downloadURL: url,
        contentType: isVideo ? 'video/mp4' : 'image/jpeg',
        createdAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, 'mediaAttachments'), attachmentData);
      
      const updatedPhotos = isVideo ? (itemData.photos || []) : [...(itemData.photos || []), url];
      const updatedVideos = isVideo ? [...(itemData.videos || []), url] : (itemData.videos || []);
      
      await updateDoc(itemRef, { 
        photos: updatedPhotos,
        videos: updatedVideos,
        mediaStatus: 'ready_for_analysis',
        localPreviewUrl: deleteField(),
        tempDownloadUrl: deleteField()
      });
      
      // [MEDIA] firestore sync success
      console.log(`[MEDIA] firestore sync success (retry): ${itemId}`);
      // [MEDIA] final visual state = ready_for_analysis
      console.log(`[MEDIA] final visual state = ready_for_analysis`);

      // AI Analysis is now manual
    } catch (error) {
      // [MEDIA] firestore sync failed
      console.error(`[MEDIA] firestore sync failed (retry): ${itemId}`, error);
      await updateDoc(itemRef, { mediaStatus: 'metadata_error' });
    }
  };

  // Utility to convert URL to base64 for Gemini
  const getBase64FromUrl = async (url: string): Promise<{ data: string; mimeType: string }> => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve({ data: base64, mimeType: blob.type });
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleAnalyzeItem = async (itemId: string, roomId: string, imageUrl: string) => {
    if (!selectedInspection) return;
    const itemRef = doc(db, `inspections/${selectedInspection.id}/rooms/${roomId}/items`, itemId);
    
    try {
      // [MEDIA] analysis started
      console.log(`[MEDIA] analysis started: ${itemId}`);
      
      const itemSnap = await getDoc(itemRef);
      if (!itemSnap.exists()) {
        console.warn(`[MEDIA] analysis aborted: document ${itemId} does not exist`);
        return;
      }

      await updateDoc(itemRef, { 
        mediaStatus: 'analyzing',
        aiStatus: 'analyzing' 
      });

      const { data, mimeType } = await getBase64FromUrl(imageUrl);
      const analysis = await analyzeRoomMedia(data, mimeType, selectedRoom?.description);

      if (analysis) {
        console.log(`[MEDIA] analysis success: ${itemId}`);
        const finalSnap = await getDoc(itemRef);
        if (finalSnap.exists()) {
          await updateDoc(itemRef, { 
            aiAnalysis: analysis,
            condition: analysis.conservationState,
            description: analysis.technicalDescription,
            aiStatus: 'analyzed',
            mediaStatus: 'ready_for_analysis'
          });
          // [MEDIA] final visual state = analyzed
          console.log(`[MEDIA] final visual state = analyzed`);
        }
      } else {
        throw new Error("Análise retornou nula");
      }
    } catch (error) {
      // [MEDIA] analysis failed
      console.error(`[MEDIA] analysis failed: ${itemId}`, error);
      try {
        const finalSnap = await getDoc(itemRef);
        if (finalSnap.exists()) {
          await updateDoc(itemRef, { 
            aiStatus: 'error',
            mediaStatus: 'ready_for_analysis' // IA error doesn't block the media from being "ready"
          });
          // [MEDIA] final visual state = ready_for_analysis (with IA error)
          console.log(`[MEDIA] final visual state = ready_for_analysis (IA error)`);
        }
      } catch (err) {
        console.error(`[MEDIA] error updating failure status: ${itemId}`, err);
      }
    }
  };

  const handleAnalyzeAllMedia = async () => {
    if (!selectedInspection) return;
    
    setIsAnalyzingAll(true);
    console.log(`[IA] Iniciando análise em lote para a vistoria: ${selectedInspection.id}`);
    
    try {
      // 1. Buscar todos os ambientes da vistoria
      const roomsSnap = await getDocs(collection(db, `inspections/${selectedInspection.id}/rooms`));
      
      for (const roomDoc of roomsSnap.docs) {
        const roomId = roomDoc.id;
        // 2. Buscar todos os itens de cada ambiente
        const itemsSnap = await getDocs(collection(db, `inspections/${selectedInspection.id}/rooms/${roomId}/items`));
        
        for (const itemDoc of itemsSnap.docs) {
          const item = itemDoc.data() as Item;
          const itemId = itemDoc.id;
          
          // Só analisar se for foto e ainda não tiver sido analisado (ou se falhou)
          const isPhoto = item.photos && item.photos.length > 0;
          const needsAnalysis = item.aiStatus !== 'analyzed';
          
          if (isPhoto && needsAnalysis) {
            console.log(`[IA] Analisando item: ${item.name} (${itemId})`);
            // Usar a primeira foto para análise
            await handleAnalyzeItem(itemId, roomId, item.photos[0]);
            // Pequeno delay para evitar rate limit se necessário
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }
      console.log(`[IA] Análise em lote concluída.`);
    } catch (error) {
      console.error(`[IA] Erro na análise em lote:`, error);
      alert("Ocorreu um erro ao processar a análise em lote.");
    } finally {
      setIsAnalyzingAll(false);
    }
  };

  const generatePDF = async (type: 'entrada' | 'saida' | 'comparativa' | 'orcamento') => {
    // Handle PDF Comparison Budget export
    if (type === 'orcamento' && pdfComparisonResult) {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      doc.setFontSize(22);
      doc.setTextColor(79, 70, 229);
      doc.text('Orçamento de Reparos (Comparação)', 20, 30);
      
      doc.setFontSize(10);
      doc.setTextColor(156, 163, 175);
      doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 20, 38);
      
      doc.setFontSize(12);
      doc.setTextColor(31, 41, 55);
      const splitSummary = doc.splitTextToSize(pdfComparisonResult.summary, 170);
      doc.text(splitSummary, 20, 50);
      
      let y = 50 + (splitSummary.length * 7) + 10;
      
      for (const room of pdfComparisonResult.rooms) {
        if (y > 260) { doc.addPage(); y = 20; }
        doc.setFontSize(14);
        doc.setTextColor(79, 70, 229);
        doc.text(room.name, 20, y);
        y += 8;
        
        for (const issue of room.issues) {
          if (y > 260) { doc.addPage(); y = 20; }
          doc.setFontSize(10);
          doc.setTextColor(31, 41, 55);
          doc.text(`• ${issue.item}: ${issue.description}`, 25, y);
          y += 5;
          doc.setFontSize(9);
          doc.setTextColor(107, 114, 128);
          doc.text(`  Responsabilidade: ${issue.responsibility} - Est: R$ ${issue.estimatedCost.toFixed(2)}`, 25, y);
          y += 7;
        }
        y += 5;
      }
      
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFontSize(16);
      doc.setTextColor(185, 28, 28);
      doc.text(`Total Estimado: R$ ${pdfComparisonResult.totalEstimatedCost.toFixed(2)}`, 20, y);
      
      doc.save(`orcamento_comparacao_${format(new Date(), 'yyyyMMdd')}.pdf`);
      return;
    }

    if (!selectedInspection) return;
    setLoading(true);
    const doc = new jsPDF();
    const title = type === 'entrada' ? 'Laudo de Vistoria de Entrada' : 
                  type === 'saida' ? 'Laudo de Vistoria de Saída' :
                  type === 'comparativa' ? 'Laudo Comparativo' : 'Orçamento de Reparos';

    // Helper to get image as base64
    const getBase64Image = async (url: string): Promise<string> => {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    };

    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229); // Indigo 600
    doc.text('VISTORIA.AI', 20, 20);
    
    doc.setFontSize(18);
    doc.setTextColor(31, 41, 55); // Gray 800
    doc.text(title, 20, 35);
    
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128); // Gray 500
    doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 140, 20);

    doc.setDrawColor(229, 231, 235); // Gray 200
    doc.line(20, 40, 190, 40);

    doc.setFontSize(12);
    doc.setTextColor(31, 41, 55);
    doc.text(`Endereço: ${selectedInspection.propertyAddress}`, 20, 50);
    doc.text(`Data da Vistoria: ${format(new Date(selectedInspection.date), 'dd/MM/yyyy')}`, 20, 57);
    doc.text(`Vistoriador: ${selectedInspection.inspectorName}`, 20, 64);
    
    if (selectedInspection.ownerName) {
      doc.text(`Proprietário: ${selectedInspection.ownerName}`, 20, 71);
    }
    if (selectedInspection.tenantName) {
      doc.text(`Locatário: ${selectedInspection.tenantName}`, 20, 78);
    }

    let y = selectedInspection.tenantName ? 90 : 80;
    let totalLocatario = 0;
    let totalLocador = 0;

    for (const room of rooms) {
      if (y > 240) { doc.addPage(); y = 20; }
      
      doc.setFontSize(14);
      doc.setTextColor(79, 70, 229);
      doc.text(`${room.name}`, 20, y);
      y += 8;

      // Fetch items for this room
      const itemsSnapshot = await getDocs(query(collection(db, `inspections/${selectedInspection.id}/rooms/${room.id}/items`), orderBy('name', 'asc')));
      const roomItems = itemsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Item));

      if (roomItems.length === 0) {
        doc.setFontSize(10);
        doc.setTextColor(156, 163, 175);
        doc.text('Nenhum item registrado neste ambiente.', 25, y);
        y += 10;
      }

      for (const item of roomItems) {
        if (y > 240) { doc.addPage(); y = 20; }
        
        doc.setFontSize(11);
        doc.setTextColor(31, 41, 55);
        doc.text(`• ${item.name} - Estado: ${item.condition}`, 25, y);
        y += 6;
        
        if (item.description) {
          doc.setFontSize(9);
          doc.setTextColor(75, 85, 99);
          const splitDesc = doc.splitTextToSize(item.description, 160);
          doc.text(splitDesc, 30, y);
          y += (splitDesc.length * 5);
        }

        // Specific for Budget
        if (item.aiAnalysis?.detectedIssues) {
          item.aiAnalysis.detectedIssues.forEach(issue => {
            const cost = issue.estimatedCost || 0;
            if (issue.responsibility === 'Locatário') totalLocatario += cost;
            if (issue.responsibility === 'Locador') totalLocador += cost;

            if (type === 'orcamento') {
              doc.setFontSize(9);
              doc.setTextColor(185, 28, 28); // Red 700
              doc.text(`  - REPARO: ${issue.item}: ${issue.issue} (${issue.responsibility}) - Est: R$ ${cost.toFixed(2)}`, 30, y);
              y += 5;
            }
          });
        }

        // Add images (only for non-budget or if specifically needed)
        if (type !== 'orcamento' && item.photos && item.photos.length > 0) {
          let x = 30;
          for (const photoUrl of item.photos.slice(0, 3)) {
            try {
              const base64 = await getBase64Image(photoUrl);
              doc.addImage(base64, 'JPEG', x, y, 40, 40);
              x += 45;
            } catch (e) {
              console.error("Error adding image to PDF", e);
            }
          }
          y += 45;
        }
        
        y += 5;
      }

      // Add Local Room Photos
      const localPhotos = localRoomPhotos[room.id] || [];
      if (type !== 'orcamento' && localPhotos.length > 0) {
        if (y > 240) { doc.addPage(); y = 20; }
        doc.setFontSize(10);
        doc.setTextColor(79, 70, 229);
        doc.text(`Fotos Rápidas - ${room.name}`, 25, y);
        y += 5;

        let x = 30;
        for (const photoUrl of localPhotos) {
          if (x > 160) { x = 30; y += 45; }
          if (y > 240) { doc.addPage(); y = 20; x = 30; }
          try {
            const base64 = await getBase64Image(photoUrl);
            doc.addImage(base64, 'JPEG', x, y, 40, 40);
            x += 45;
          } catch (e) {
            console.error("Error adding local room photo to PDF", e);
          }
        }
        y += 50;
      }

      y += 10;
    }

    // Add Quick Photos at the end
    if (type !== 'orcamento' && quickPhotos.length > 0) {
      if (y > 200) { doc.addPage(); y = 20; }
      doc.setFontSize(14);
      doc.setTextColor(79, 70, 229);
      doc.text('Fotos Complementares (Rápido)', 20, y);
      y += 10;

      let x = 20;
      for (const photoUrl of quickPhotos) {
        if (x > 160) { x = 20; y += 45; }
        if (y > 240) { doc.addPage(); y = 20; x = 20; }
        
        try {
          const base64 = await getBase64Image(photoUrl);
          doc.addImage(base64, 'JPEG', x, y, 40, 40);
          x += 45;
        } catch (e) {
          console.error("Error adding quick photo to PDF", e);
        }
      }
      y += 50;
    }

    if (type === 'orcamento') {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFontSize(14);
      doc.setTextColor(31, 41, 55);
      doc.text('Resumo de Orçamento', 20, y);
      y += 10;
      doc.setFontSize(12);
      doc.text(`Total Locador: R$ ${totalLocador.toFixed(2)}`, 25, y);
      y += 7;
      doc.text(`Total Locatário: R$ ${totalLocatario.toFixed(2)}`, 25, y);
      y += 15;
    }

    // Signatures
    if (y > 220) { doc.addPage(); y = 40; } else { y += 20; }
    doc.setDrawColor(200, 200, 200);
    
    // Line 1
    doc.line(20, y, 90, y);
    doc.line(120, y, 190, y);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Assinatura do Proprietário/Locador', 55, y + 5, { align: 'center' });
    doc.text('Assinatura do Locatário', 155, y + 5, { align: 'center' });
    
    y += 30;
    
    // Line 2
    doc.line(70, y, 140, y);
    doc.text('Assinatura do Vistoriador', 105, y + 5, { align: 'center' });
    doc.text(selectedInspection.inspectorName || '', 105, y + 10, { align: 'center' });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text(`Página ${i} de ${pageCount} - Vistoria.AI - Relatório Profissional`, 105, 290, { align: 'center' });
    }

    doc.save(`vistoria_${selectedInspection.id}_${type}.pdf`);
    setLoading(false);
  };

  // --- VIEWS ---

  const Dashboard = () => (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Minhas Vistorias</h1>
          <p className="text-gray-500">Gerencie seus laudos e vistorias imobiliárias</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setView('registrations')} icon={Users}>Cadastros</Button>
          <Button onClick={() => setView('new')} icon={Plus}>Nova Vistoria</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {inspections.map(insp => (
          <div key={insp.id} className="relative group">
            <Card onClick={() => { setSelectedInspection(insp); setView('detail'); }}>
              <div className="flex justify-between items-start mb-3">
                <Badge variant={insp.type === 'entrada' ? 'indigo' : insp.type === 'saida' ? 'red' : 'yellow'}>
                  {insp.type.toUpperCase()}
                </Badge>
                <span className="text-xs text-gray-400">{format(new Date(insp.createdAt), 'dd/MM/yy HH:mm')}</span>
              </div>
              <h3 className="font-bold text-lg text-gray-800 line-clamp-1">{insp.propertyAddress}</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {insp.ownerName && <Badge variant="gray" className="text-[10px]"><User size={10} className="inline mr-1" /> Prop: {insp.ownerName}</Badge>}
                {insp.tenantName && <Badge variant="gray" className="text-[10px]"><Users size={10} className="inline mr-1" /> Loc: {insp.tenantName}</Badge>}
              </div>
              <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                <div className="flex items-center gap-1"><Calendar size={14} /> {format(new Date(insp.date), 'dd/MM/yy')}</div>
                <div className="flex items-center gap-1"><User size={14} /> {insp.inspectorName}</div>
              </div>
            </Card>
            <button 
              onClick={(e) => { e.stopPropagation(); handleDeleteInspection(insp.id); }}
              className="absolute top-2 right-2 p-2 bg-white/80 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-sm border border-gray-100"
              title="Excluir Vistoria"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {inspections.length === 0 && (
          <div className="col-span-full py-20 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <ClipboardCheck className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-gray-500">Nenhuma vistoria encontrada. Comece agora!</p>
            <Button variant="ghost" onClick={() => setView('new')} className="mt-4">Criar primeira vistoria</Button>
          </div>
        )}
      </div>
    </div>
  );

  const NewInspectionForm = () => {
    const [selectedPropertyId, setSelectedPropertyId] = useState('');
    const [address, setAddress] = useState('');
    const [ownerId, setOwnerId] = useState('');

    const onPropertyChange = (id: string) => {
      setSelectedPropertyId(id);
      const prop = properties.find(p => p.id === id);
      if (prop) {
        setAddress(prop.address);
        setOwnerId(prop.ownerId);
      }
    };

    return (
      <div className="max-w-2xl mx-auto p-6">
        <button onClick={() => setView('dashboard')} className="flex items-center gap-2 text-gray-500 mb-6 hover:text-indigo-600 transition-colors">
          <ArrowLeft size={20} /> Voltar ao Dashboard
        </button>
        <h1 className="text-2xl font-bold mb-8">Nova Vistoria</h1>
        <form onSubmit={handleCreateInspection} className="space-y-6 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Vistoria</label>
            <select name="type" required className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none">
              <option value="entrada">Vistoria de Entrada</option>
              <option value="constatacao">Vistoria de Constatação</option>
              <option value="saida">Vistoria de Saída</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Imóvel Cadastrado (Opcional)</label>
            <select 
              name="propertyId" 
              value={selectedPropertyId}
              onChange={(e) => onPropertyChange(e.target.value)}
              className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">Selecione um imóvel</option>
              {properties.map(p => <option key={p.id} value={p.id}>{p.address}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Endereço do Imóvel</label>
            <input 
              name="address" 
              required 
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Rua, Número, Bairro, Cidade - SP" 
              className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Proprietário</label>
              <select 
                name="ownerId" 
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="">Selecione um proprietário</option>
                {owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Locatário</label>
              <select name="tenantId" className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="">Selecione um locatário</option>
                {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data da Vistoria</label>
              <input type="date" name="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vistoriador</label>
              <input name="inspector" placeholder="Nome do profissional" className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>
          <Button className="w-full py-4 text-lg" disabled={loading}>
            {loading ? 'Criando...' : 'Iniciar Vistoria'}
          </Button>
        </form>
      </div>
    );
  };

  const InspectionDetail = () => {
    const [newRoomName, setNewRoomName] = useState('');
    const [activeTab, setActiveTab] = useState<'ambientes' | 'midia' | 'laudo'>('ambientes');
    const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
    const [editingRoomName, setEditingRoomName] = useState("");

    const RoomMediaGallery = ({ room }: { room: Room }) => {
      const [roomItems, setRoomItems] = useState<Item[]>([]);

      useEffect(() => {
        if (selectedInspection && room) {
          const q = query(collection(db, `inspections/${selectedInspection.id}/rooms/${room.id}/items`), orderBy('name', 'asc'));
          const unsubscribe = onSnapshot(q, (snapshot) => {
            setRoomItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item)));
          });
          return () => unsubscribe();
        }
      }, [room.id]);

      const allMedia = roomItems.flatMap(item => [
        ...(item.photos || []).map(url => ({ url, type: 'photo' as const, itemName: item.name })),
        ...(item.videos || []).map(url => ({ url, type: 'video' as const, itemName: item.name }))
      ]);

      if (allMedia.length === 0) return null;

      return (
        <div className="mb-8">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-700">
            <Layers size={18} /> {room.name}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {allMedia.map((media, i) => (
              <div key={i} className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                {media.type === 'photo' ? (
                  <img src={media.url} className="w-full h-full object-cover transition-transform group-hover:scale-110" referrerPolicy="no-referrer" />
                ) : (
                  <div className="relative w-full h-full">
                    <video src={media.url} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <Play size={24} className="text-white" />
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  <span className="text-white text-xs font-medium truncate">{media.itemName}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    };

    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => setView('dashboard')} className="flex items-center gap-2 text-gray-500 hover:text-indigo-600">
            <ArrowLeft size={20} /> Dashboard
          </button>
          <div className="flex gap-2">
            <Button 
              variant="secondary" 
              onClick={handleAnalyzeAllMedia} 
              icon={isAnalyzingAll ? RefreshCw : RefreshCw} 
              disabled={loading || isAnalyzingAll}
              className={isAnalyzingAll ? 'animate-pulse' : ''}
            >
              {isAnalyzingAll ? (
                <span className="flex items-center gap-2">
                  <RefreshCw size={18} className="animate-spin" /> Analisando...
                </span>
              ) : 'Analisar mídias com IA'}
            </Button>
            <Button variant="primary" onClick={async () => {
              if (selectedInspection) {
                await updateDoc(doc(db, 'inspections', selectedInspection.id), { status: 'concluido' });
                setSelectedInspection(prev => prev ? { ...prev, status: 'concluido' } : null);
              }
            }} icon={CheckCircle}>Concluir</Button>
            <Button variant="outline" onClick={() => generatePDF(selectedInspection?.type as any)} icon={Download}>PDF</Button>
            <Button variant="outline" onClick={() => setView('compare')} icon={ArrowRightLeft}>Comparar</Button>
            <Button variant="outline" onClick={() => setView('budget')} icon={DollarSign}>Orçamento</Button>
          </div>
        </div>

        <div className="bg-indigo-600 text-white p-8 rounded-3xl mb-8 shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <Badge variant="indigo" className="bg-white/20 text-white mb-2">{selectedInspection?.type.toUpperCase()}</Badge>
            <h1 className="text-3xl font-bold mb-2">{selectedInspection?.propertyAddress}</h1>
            <div className="flex flex-wrap gap-4 opacity-80 text-sm">
              <span className="flex items-center gap-2"><MapPin size={16} /> {selectedInspection?.inspectorName}</span>
              <span className="flex items-center gap-2"><Calendar size={16} /> {format(new Date(selectedInspection?.date || ''), 'dd MMMM yyyy', { locale: ptBR })}</span>
              {selectedInspection?.ownerName && <span className="flex items-center gap-2"><User size={16} /> Prop: {selectedInspection.ownerName}</span>}
              {selectedInspection?.tenantName && <span className="flex items-center gap-2"><Users size={16} /> Loc: {selectedInspection.tenantName}</span>}
            </div>
          </div>
          <div className="absolute -right-10 -bottom-10 opacity-10">
            <Home size={200} />
          </div>
        </div>

        <div className="flex gap-4 mb-8 border-b border-gray-100">
          {['ambientes', 'midia', 'laudo'].map((tab: any) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'pb-4 px-2 font-medium capitalize transition-all relative',
                activeTab === tab ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
              )}
            >
              {tab}
              {activeTab === tab && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />}
            </button>
          ))}
        </div>

        {activeTab === 'ambientes' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-bold mb-4 flex items-center gap-2"><Layers size={18} /> Ambientes</h3>
                <div className="space-y-2">
                  {rooms.map(room => (
                    <div key={room.id} className="relative group">
                      <button 
                        onClick={() => setSelectedRoom(room)}
                        className={cn(
                          'w-full text-left p-3 rounded-xl transition-all flex justify-between items-center',
                          selectedRoom?.id === room.id ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'hover:bg-gray-50 text-gray-600 border border-transparent'
                        )}
                      >
                        <span className="truncate pr-8">{room.name}</span>
                        <ChevronRight size={16} className={selectedRoom?.id === room.id ? 'opacity-100' : 'opacity-0'} />
                      </button>
                      
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setEditingRoomId(room.id); 
                            setEditingRoomName(room.name);
                          }}
                          className="p-1.5 bg-white shadow-sm border border-gray-100 rounded-lg text-gray-400 hover:text-indigo-600"
                        >
                          <Settings size={14} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteRoom(room.id); }}
                          className="p-1.5 bg-white shadow-sm border border-gray-100 rounded-lg text-gray-400 hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {editingRoomId && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                        <h3 className="text-xl font-bold mb-4">Editar Ambiente</h3>
                        <input 
                          type="text" 
                          value={editingRoomName}
                          onChange={(e) => setEditingRoomName(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="Nome do ambiente"
                          autoFocus
                        />
                        <div className="flex gap-2 justify-end">
                          <Button variant="ghost" onClick={() => setEditingRoomId(null)}>Cancelar</Button>
                          <Button onClick={() => { handleRenameRoom(editingRoomId, editingRoomName); setEditingRoomId(null); }}>Salvar</Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 flex gap-2">
                    <input 
                      value={newRoomName} 
                      onChange={e => setNewRoomName(e.target.value)}
                      placeholder="Novo ambiente..." 
                      className="flex-1 p-2 text-sm rounded-lg border border-gray-200 outline-none focus:ring-1 focus:ring-indigo-500" 
                    />
                    <Button onClick={() => { handleAddRoom(newRoomName); setNewRoomName(''); }} className="px-2 py-2"><Plus size={18} /></Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              {selectedRoom ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800">{selectedRoom.name}</h2>
                    <div className="flex gap-2">
                      <Button variant="outline" icon={Camera} onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.multiple = true;
                        input.onchange = (e: any) => handleRoomQuickPhotoUpload(e, selectedRoom.id);
                        input.click();
                      }}>Carga Rápida (Local)</Button>
                      <Button variant="secondary" icon={Camera} onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*,video/*';
                        input.multiple = true;
                        input.onchange = async (e: any) => {
                        const files = Array.from(e.target.files) as File[];
                        console.log(`[Upload] ${files.length} arquivos selecionados.`);
                        
                        for (const file of files) {
                          const localUrl = URL.createObjectURL(file);
                          
                          // 1. Criar item com preview local
                          const newItem = {
                            roomId: selectedRoom.id,
                            inspectionId: selectedInspection?.id,
                            name: file.name.split('.')[0].toUpperCase(),
                            condition: 'Bom' as ConservationState,
                            description: 'Aguardando upload...',
                            mediaStatus: 'preview_local' as MediaStatus,
                            aiStatus: 'idle' as AIStatus,
                            localPreviewUrl: localUrl,
                            photos: [],
                            videos: [],
                            createdAt: new Date().toISOString(),
                          };
                          
                          console.log(`[Upload] Criando item no Firestore: ${file.name}`);
                          const docRef = await addDoc(collection(db, `inspections/${selectedInspection?.id}/rooms/${selectedRoom.id}/items`), newItem);
                          
                          // 2. Processar Upload
                          handleProcessUpload(file, selectedRoom.id, docRef.id, true);
                        }
                      };
                      input.click();
                    }
                  }>Adicionar Mídia</Button>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Observações do Ambiente (Análise IA)</label>
                <textarea 
                  value={selectedRoom.description || ''}
                  onChange={(e) => handleUpdateRoomDescription(selectedRoom.id, e.target.value)}
                  placeholder="Ex: Sala com boa iluminação, pintura nova, sem sinais de infiltração aparente..."
                  className="w-full p-3 text-sm rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px] resize-none"
                />
              </div>

                  <div className="grid grid-cols-1 gap-4">
                    {/* Quick Local Photos Section */}
                    {localRoomPhotos[selectedRoom.id]?.length > 0 && (
                      <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 mb-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-bold text-indigo-700 flex items-center gap-2">
                            <Camera size={16} /> Fotos Rápidas (Não salvas no banco)
                          </h4>
                          <div className="flex gap-2">
                            <Button 
                              variant="secondary" 
                              size="sm" 
                              icon={Zap} 
                              onClick={() => handleAnalyzeAllQuickPhotos(selectedRoom.id)}
                            >
                              Analisar e Salvar Todas
                            </Button>
                            <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-bold uppercase flex items-center">Modo Offline</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {localRoomPhotos[selectedRoom.id].map((url, i) => (
                            <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden group border border-white shadow-sm">
                              <img src={url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              <button 
                                onClick={() => removeRoomQuickPhoto(selectedRoom.id, url)}
                                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {items.map(item => (
                      <Card key={item.id} className="p-0 overflow-hidden">
                        <div className="flex flex-col md:flex-row">
                          <div className="w-full md:w-48 bg-gray-100 relative min-h-[12rem]">
                            <div className="grid grid-cols-2 gap-1 p-1 h-full">
                              {/* Render Local Preview Fallback (Always visible if available and remote not ready) */}
                              {(item.mediaStatus === 'preview_local' || item.mediaStatus === 'uploading' || item.mediaStatus === 'uploaded' || item.mediaStatus === 'metadata_syncing' || item.mediaStatus === 'error' || item.mediaStatus === 'metadata_error') && item.localPreviewUrl && (
                                <div className="col-span-2 relative group aspect-video bg-gray-200 rounded-md overflow-hidden">
                                  {item.localPreviewUrl.includes('video') || item.name.toLowerCase().endsWith('.mp4') ? (
                                    <video src={item.localPreviewUrl} className="w-full h-full object-cover opacity-50" />
                                  ) : (
                                    <img 
                                      src={item.localPreviewUrl} 
                                      className="w-full h-full object-cover opacity-50" 
                                      onLoad={() => console.log(`[Preview] Preview local carregado: ${item.localPreviewUrl}`)}
                                    />
                                  )}
                                  
                                  {/* Status Overlays */}
                                  {item.mediaStatus === 'uploading' && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/60 p-4 z-20">
                                      <div className="w-full bg-gray-800 rounded-full h-1.5 mb-3 overflow-hidden">
                                        <motion.div 
                                          className="bg-blue-500 h-full"
                                          initial={{ width: 0 }}
                                          animate={{ width: `${item.uploadProgress || 0}%` }}
                                          transition={{ duration: 0.3 }}
                                        />
                                      </div>
                                      <span className="text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                        <RefreshCw size={12} className="animate-spin text-blue-400" />
                                        Enviando {item.uploadProgress ? `${Math.floor(item.uploadProgress)}%` : '...'}
                                      </span>
                                    </div>
                                  )}

                                  {item.mediaStatus === 'uploaded' && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-green-600/40 backdrop-blur-[2px] z-20">
                                      <CheckCircle size={24} className="text-white mb-1" />
                                      <span className="text-[10px] font-bold text-white uppercase">Upload Concluído</span>
                                    </div>
                                  )}

                                  {item.mediaStatus === 'metadata_syncing' && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-blue-600/40 backdrop-blur-[2px] p-4 z-20">
                                      <div className="w-6 h-6 border-2 border-white border-t-transparent animate-spin rounded-full mb-2" />
                                      <span className="text-[10px] font-bold text-white uppercase tracking-widest">Sincronizando...</span>
                                    </div>
                                  )}

                                  {item.mediaStatus === 'error' && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-600/80 backdrop-blur-sm p-4 text-center z-20">
                                      <AlertCircle size={24} className="text-white mb-1" />
                                      <span className="text-[10px] font-bold text-white uppercase mb-2">Erro no Upload</span>
                                      <Button variant="secondary" className="text-[10px] py-1 h-auto" onClick={() => handleRetryUpload(item.id, item.roomId)}>Tentar Novamente</Button>
                                    </div>
                                  )}

                                  {item.mediaStatus === 'metadata_error' && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-yellow-600/70 backdrop-blur-sm p-4 text-center z-20">
                                      <RefreshCw size={24} className="text-white mb-1" />
                                      <span className="text-[10px] font-bold text-white uppercase mb-2">Falha ao sincronizar metadados</span>
                                      <Button variant="secondary" className="text-[10px] py-1 h-auto" onClick={() => handleRetrySync(item.id, item.roomId)}>Tentar Sincronizar</Button>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Render Remote Photos */}
                              {item.photos && item.photos.map((url, i) => (
                                <div key={`photo-${i}`} className="relative group aspect-square bg-gray-200 rounded-md overflow-hidden">
                                  <img 
                                    src={url} 
                                    className="w-full h-full object-cover" 
                                    referrerPolicy="no-referrer"
                                    onLoad={() => console.log(`[Preview] Imagem remota carregada: ${url}`)}
                                    onError={(e) => {
                                      console.error(`[Preview] Erro ao carregar imagem remota: ${url}`);
                                      (e.target as HTMLImageElement).src = 'https://placehold.co/400x400?text=Erro+Imagem';
                                    }}
                                  />
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleDeleteMedia(item.id, url, 'photo'); }}
                                    className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              ))}

                              {/* Render Remote Videos */}
                              {item.videos && item.videos.map((url, i) => (
                                <div key={`video-${i}`} className="relative group aspect-square bg-gray-200 rounded-md overflow-hidden">
                                  <video 
                                    src={url} 
                                    className="w-full h-full object-cover"
                                    onLoadedData={() => console.log(`[Preview] Vídeo remoto carregado: ${url}`)}
                                    onError={(e) => {
                                      console.error(`[Preview] Erro ao carregar vídeo remoto: ${url}`);
                                    }}
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <Play size={20} className="text-white opacity-50" />
                                  </div>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleDeleteMedia(item.id, url, 'video'); }}
                                    className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              ))}

                              {/* Empty State (Only if no local preview AND no remote photos/videos) */}
                              {(!item.photos || item.photos.length === 0) && (!item.videos || item.videos.length === 0) && !item.localPreviewUrl && (
                                <div className="col-span-2 h-48 flex items-center justify-center text-gray-300">
                                  <ImageIcon size={48} />
                                </div>
                              )}
                            </div>
                            
                            {/* AI Status Overlay */}
                            {item.aiStatus === 'analyzing' && (
                              <div className="absolute bottom-2 left-2 right-2 bg-indigo-600/80 backdrop-blur-sm text-white text-[10px] py-1 px-2 rounded-lg flex items-center gap-2 z-20">
                                <div className="w-2 h-2 bg-white animate-pulse rounded-full" />
                                <span className="font-bold uppercase tracking-widest">IA Analisando...</span>
                              </div>
                            )}

                            {item.aiStatus === 'error' && (
                              <div className="absolute bottom-2 left-2 right-2 bg-red-600/80 backdrop-blur-sm text-white text-[10px] py-1 px-2 rounded-lg flex items-center gap-2 z-20">
                                <AlertTriangle size={12} className="text-white" />
                                <span className="font-bold uppercase tracking-widest">Erro na Análise IA</span>
                              </div>
                            )}

                            {item.mediaStatus === 'ready_for_analysis' && item.aiStatus === 'idle' && item.photos && item.photos.length > 0 && (
                              <div className="absolute bottom-2 left-2 right-2 bg-green-600/80 backdrop-blur-sm text-white text-[10px] py-1 px-2 rounded-lg flex items-center gap-2 z-20">
                                <CheckCircle size={12} className="text-white" />
                                <span className="font-bold uppercase tracking-widest">Pronto para análise</span>
                              </div>
                            )}
                            
                            {/* Condition Badge */}
                            {item.aiAnalysis && (
                              <div className="absolute top-2 left-2 z-20">
                                <Badge variant={item.condition === 'Novo' || item.condition === 'Bom' ? 'green' : 'red'}>{item.condition}</Badge>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 p-6">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h4 className="font-bold text-lg mb-1">{item.name}</h4>
                                <p className="text-sm text-gray-500 line-clamp-2">{item.description || 'Sem descrição técnica.'}</p>
                              </div>
                              <button 
                                onClick={() => handleDeleteItem(item.id)}
                                className="text-gray-300 hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                            
                            {item.aiAnalysis && (
                              <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                                <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Análise da IA</h5>
                                {item.aiAnalysis.detectedIssues.map((issue, i) => (
                                  <div key={i} className="flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-2 text-gray-700">
                                      <AlertTriangle size={14} className="text-yellow-500" /> {issue.item}: {issue.issue}
                                    </span>
                                    <Badge variant={issue.responsibility === 'Locador' ? 'indigo' : 'red'}>{issue.responsibility}</Badge>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="mt-6 flex gap-2">
                              <Button variant="ghost" className="text-xs py-1 px-2" icon={Mic} onClick={async () => {
                                // Simulate audio transcription for demo
                                if (!item.audioUrl) {
                                  alert("Anexe um áudio primeiro.");
                                  return;
                                }
                                setLoading(true);
                                try {
                                  setLoading(true);
                                  const { data, mimeType } = await getBase64FromUrl(item.audioUrl);
                                  const text = await transcribeAudio(data, mimeType);
                                  if (text) {
                                    await updateDoc(doc(db, `inspections/${selectedInspection?.id}/rooms/${selectedRoom.id}/items`, item.id), { 
                                      description: (item.description || '') + '\nTranscrição: ' + text 
                                    });
                                  }
                                } catch (error) {
                                  console.error("Erro na transcrição:", error);
                                  alert("Erro na transcrição do áudio.");
                                } finally {
                                  setLoading(false);
                                }
                              }}>Transcrição</Button>
                              <Button variant="ghost" className="text-xs py-1 px-2" icon={FileText} onClick={() => setEditingItem(item)}>Editar / Revisar</Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 p-20">
                  <Layers size={64} className="mb-4 opacity-20" />
                  <p>Selecione um ambiente para começar a vistoria</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'midia' && (
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Galeria de Mídia</h2>
                  <p className="text-sm text-gray-500">Todas as fotos e vídeos organizados por ambiente</p>
                </div>
                <Badge variant="indigo">{rooms.length} Ambientes</Badge>
              </div>
              
              {rooms.map(room => (
                <RoomMediaGallery key={room.id} room={room} />
              ))}
              
              {rooms.length === 0 && (
                <div className="py-20 text-center text-gray-400">
                  <ImageIcon size={48} className="mx-auto mb-4 opacity-20" />
                  <p>Nenhuma mídia capturada ainda.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'laudo' && (
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <FileText size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Finalização do Laudo</h2>
                  <p className="text-gray-500">Adicione fotos rápidas e gere o documento final</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="p-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                      <Camera size={18} /> Fotos Rápidas (Impressão Direta)
                    </h3>
                    <p className="text-sm text-gray-500 mb-6">
                      Estas fotos serão incluídas ao final do laudo sem análise de IA. Ideal para registros gerais ou complementares.
                    </p>
                    
                    <div className="flex flex-wrap gap-4 mb-6">
                      {quickPhotos.map((url, i) => (
                        <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden group border border-gray-200">
                          <img src={url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <button 
                            onClick={() => removeQuickPhoto(url)}
                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                      <label className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-all text-gray-400 hover:text-indigo-600">
                        <Plus size={24} />
                        <span className="text-[10px] font-bold mt-1 uppercase">Adicionar</span>
                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleQuickPhotoUpload} />
                      </label>
                    </div>

                    {quickPhotos.length > 0 && (
                      <Button variant="ghost" className="text-red-500 hover:bg-red-50 w-full" onClick={() => {
                        quickPhotos.forEach(url => URL.revokeObjectURL(url));
                        setQuickPhotos([]);
                      }}>Limpar Todas</Button>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-6 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-200">
                    <h3 className="font-bold text-lg mb-2">Gerar Laudo Completo</h3>
                    <p className="text-indigo-100 text-sm mb-6">O sistema irá compilar todos os ambientes, itens, análises de IA e fotos complementares em um único PDF profissional.</p>
                    <Button 
                      className="w-full bg-white text-indigo-600 hover:bg-indigo-50 py-4 text-lg shadow-md"
                      onClick={() => generatePDF(selectedInspection?.type as any)}
                      disabled={loading}
                      icon={Download}
                    >
                      {loading ? 'Gerando PDF...' : 'Baixar Laudo PDF'}
                    </Button>
                  </div>
                  
                  <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <h4 className="font-bold mb-4">Próximos Passos</h4>
                    <ul className="space-y-3 text-sm text-gray-600">
                      <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" /> Revise todas as descrições</li>
                      <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" /> Verifique as responsabilidades (Locador/Locatário)</li>
                      <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" /> Adicione as fotos de fechamento</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const ComparisonView = () => {
    const [diffs, setDiffs] = useState<any[]>([]);
    const [isComparing, setIsComparing] = useState(false);
    const [compareMode, setCompareMode] = useState<'internal' | 'external'>('internal');

    const runComparison = async () => {
      if (compareInspections.length !== 2) return;
      setIsComparing(true);
      try {
        const [insp1, insp2] = compareInspections;
        
        // Fetch all rooms and items for both
        const fetchAll = async (inspId: string) => {
          const roomsSnap = await getDocs(collection(db, `inspections/${inspId}/rooms`));
          const roomsData = roomsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Room));
          const allItems: Item[] = [];
          for (const r of roomsData) {
            const itemsSnap = await getDocs(collection(db, `inspections/${inspId}/rooms/${r.id}/items`));
            allItems.push(...itemsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Item)));
          }
          return { rooms: roomsData, items: allItems };
        };

        const data1 = await fetchAll(insp1.id);
        const data2 = await fetchAll(insp2.id);

        const newDiffs: any[] = [];

        // Compare by room name and item name
        data2.items.forEach(item2 => {
          const room2 = data2.rooms.find(r => r.id === item2.roomId);
          const item1 = data1.items.find(i => {
            const r1 = data1.rooms.find(r => r.id === i.roomId);
            return r1?.name === room2?.name && i.name === item2.name;
          });

          if (!item1) {
            newDiffs.push({ room: room2?.name, item: item2.name, status: 'Dano Novo', detail: 'Item não presente na vistoria anterior.' });
          } else if (item1.condition !== item2.condition) {
            newDiffs.push({ room: room2?.name, item: item2.name, status: 'Piorou', detail: `Condição alterada de ${item1.condition} para ${item2.condition}.` });
          } else {
            newDiffs.push({ room: room2?.name, item: item2.name, status: 'Igual', detail: 'Sem alterações detectadas.' });
          }
        });

        setDiffs(newDiffs);
      } catch (error) {
        console.error("Comparison error:", error);
      } finally {
        setIsComparing(false);
      }
    };

    return (
      <div className="max-w-4xl mx-auto p-6">
        <button onClick={() => { setView('dashboard'); setCompareInspections([]); }} className="flex items-center gap-2 text-gray-500 mb-6 hover:text-indigo-600">
          <ArrowLeft size={20} /> Voltar
        </button>
        <h1 className="text-3xl font-bold mb-8">Comparação de Laudos</h1>

        <div className="flex gap-4 mb-8">
          <button 
            onClick={() => setCompareMode('internal')}
            className={cn(
              "flex-1 py-3 rounded-xl font-bold transition-all border-2",
              compareMode === 'internal' ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-500 border-gray-100 hover:border-indigo-200"
            )}
          >
            Comparar Vistorias Internas
          </button>
          <button 
            onClick={() => setCompareMode('external')}
            className={cn(
              "flex-1 py-3 rounded-xl font-bold transition-all border-2",
              compareMode === 'external' ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-500 border-gray-100 hover:border-indigo-200"
            )}
          >
            Comparar PDFs Externos
          </button>
        </div>

        {compareMode === 'external' ? (
          <div className="space-y-8">
            {!pdfComparisonResult ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-8 bg-white rounded-3xl border-2 border-dashed border-gray-200 hover:border-indigo-400 transition-all text-center">
                    <FileText className="mx-auto text-gray-300 mb-4" size={48} />
                    <h3 className="font-bold mb-2">Laudo de Entrada (PDF)</h3>
                    <p className="text-xs text-gray-400 mb-4">{pdfFiles.file1 ? pdfFiles.file1.name : "Nenhum arquivo selecionado"}</p>
                    <label className="cursor-pointer bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg font-bold hover:bg-indigo-100 transition-all">
                      Selecionar PDF
                      <input type="file" accept="application/pdf" className="hidden" onChange={(e) => setPdfFiles(prev => ({ ...prev, file1: e.target.files?.[0] || null }))} />
                    </label>
                  </div>
                  <div className="p-8 bg-white rounded-3xl border-2 border-dashed border-gray-200 hover:border-indigo-400 transition-all text-center">
                    <FileText className="mx-auto text-gray-300 mb-4" size={48} />
                    <h3 className="font-bold mb-2">Laudo de Saída (PDF)</h3>
                    <p className="text-xs text-gray-400 mb-4">{pdfFiles.file2 ? pdfFiles.file2.name : "Nenhum arquivo selecionado"}</p>
                    <label className="cursor-pointer bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg font-bold hover:bg-indigo-100 transition-all">
                      Selecionar PDF
                      <input type="file" accept="application/pdf" className="hidden" onChange={(e) => setPdfFiles(prev => ({ ...prev, file2: e.target.files?.[0] || null }))} />
                    </label>
                  </div>
                </div>
                
                <Button 
                  disabled={!pdfFiles.file1 || !pdfFiles.file2 || isComparingPdfs} 
                  className="w-full py-4 text-lg" 
                  onClick={handlePdfComparison}
                >
                  {isComparingPdfs ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw size={20} className="animate-spin" /> Analisando PDFs com IA...
                    </span>
                  ) : "Comparar e Gerar Orçamento"}
                </Button>
                
                <div className="p-6 bg-yellow-50 rounded-2xl border border-yellow-100 flex gap-4">
                  <AlertCircle className="text-yellow-600 shrink-0" />
                  <p className="text-sm text-yellow-700">
                    A IA analisará o texto dos dois laudos para identificar divergências e sugerir reparos. 
                    Certifique-se de que os PDFs contêm texto legível.
                  </p>
                </div>
              </>
            ) : (
              <div className="space-y-6">
                <div className="p-8 bg-indigo-900 text-white rounded-3xl shadow-xl">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-2xl">Resultado da Análise IA</h3>
                    <Badge variant="indigo" className="bg-indigo-700 text-white border-indigo-500">PDF Externo</Badge>
                  </div>
                  <p className="text-indigo-100 leading-relaxed mb-6">{pdfComparisonResult.summary}</p>
                  <div className="flex gap-3">
                    <Button variant="secondary" className="bg-white/10 hover:bg-white/20 border-white/20 text-white" onClick={() => setPdfComparisonResult(null)}>
                      Nova Comparação
                    </Button>
                    <Button className="bg-white text-indigo-900 hover:bg-indigo-50" onClick={() => setView('budget')}>
                      Ver Orçamento Detalhado
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-xl">Divergências por Ambiente</h3>
                  {pdfComparisonResult.rooms.map((room: any, i: number) => (
                    <div key={i} className="space-y-3">
                      <h4 className="font-bold text-indigo-600 flex items-center gap-2 mt-4">
                        <Layers size={18} /> {room.name}
                      </h4>
                      {room.issues.map((issue: any, j: number) => (
                        <Card key={j} className="p-4 border-l-4 border-l-red-500">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-bold text-gray-800">{issue.item}</p>
                              <p className="text-sm text-gray-600">{issue.description}</p>
                            </div>
                            <div className="text-right">
                              <Badge variant={issue.responsibility === 'Locatário' ? 'red' : 'indigo'}>{issue.responsibility}</Badge>
                              <p className="text-xs font-bold text-gray-400 mt-1">Est: R$ {issue.estimatedCost.toFixed(2)}</p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : diffs.length === 0 && !isComparing ? (
          <div className="space-y-6">
            <p className="text-gray-500">Selecione duas vistorias para comparar (ex: Entrada e Saída):</p>
            <div className="grid grid-cols-1 gap-3">
              {inspections.map(insp => (
                <Card 
                  key={insp.id} 
                  className={cn(
                    compareInspections.find(i => i.id === insp.id) ? 'border-indigo-500 bg-indigo-50' : ''
                  )}
                  onClick={() => {
                    if (compareInspections.find(i => i.id === insp.id)) {
                      setCompareInspections(prev => prev.filter(i => i.id !== insp.id));
                    } else if (compareInspections.length < 2) {
                      setCompareInspections(prev => [...prev, insp]);
                    }
                  }}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold">{insp.propertyAddress}</h4>
                      <p className="text-xs text-gray-400">{insp.type.toUpperCase()} • {format(new Date(insp.date), 'dd/MM/yy')}</p>
                    </div>
                    {compareInspections.find(i => i.id === insp.id) && <CheckCircle className="text-indigo-600" size={20} />}
                  </div>
                </Card>
              ))}
            </div>
            <Button disabled={compareInspections.length < 2} className="w-full py-4" onClick={runComparison}>
              Comparar Agora
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {isComparing ? (
              <div className="py-20 text-center">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500">Analisando divergências entre laudos...</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <div className="text-center flex-1">
                    <p className="text-xs font-bold text-gray-400 uppercase">{compareInspections[0].type}</p>
                    <h4 className="font-bold">{format(new Date(compareInspections[0].date), 'dd/MM/yy')}</h4>
                  </div>
                  <ArrowRightLeft className="text-indigo-600 mx-4" />
                  <div className="text-center flex-1">
                    <p className="text-xs font-bold text-gray-400 uppercase">{compareInspections[1].type}</p>
                    <h4 className="font-bold">{format(new Date(compareInspections[1].date), 'dd/MM/yy')}</h4>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-xl">Divergências Encontradas</h3>
                  {diffs.map((diff, i) => (
                    <Card key={i} className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-indigo-900">{diff.room} - {diff.item}</h4>
                        <Badge variant={diff.status === 'Igual' ? 'green' : diff.status === 'Piorou' ? 'yellow' : 'red'}>{diff.status}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">{diff.detail}</p>
                    </Card>
                  ))}
                </div>

                <div className="bg-indigo-900 text-white p-8 rounded-3xl">
                  <h3 className="font-bold text-lg mb-4">Conclusão Comparativa</h3>
                  <p className="text-indigo-100 leading-relaxed">
                    O sistema identificou {diffs.filter(d => d.status !== 'Igual').length} divergências significativas. 
                    {diffs.some(d => d.status === 'Piorou') ? ' Há evidências de deterioração em itens de acabamento.' : ' O imóvel mantém o estado de conservação original.'}
                  </p>
                  <Button variant="outline" className="mt-6 border-white/20 text-white hover:bg-white/10" onClick={() => generatePDF('comparativa')}>
                    Gerar Laudo Comparativo PDF
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  const BudgetView = () => {
    const [allInspectionItems, setAllInspectionItems] = useState<Item[]>([]);
    const [loadingBudget, setLoadingBudget] = useState(false);

    useEffect(() => {
      if (view === 'budget' && selectedInspection && !pdfComparisonResult) {
        const fetchAllItems = async () => {
          setLoadingBudget(true);
          try {
            let allItems: Item[] = [];
            for (const room of rooms) {
              const itemsSnapshot = await getDocs(collection(db, `inspections/${selectedInspection.id}/rooms/${room.id}/items`));
              const roomItems = itemsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Item));
              allItems = [...allItems, ...roomItems];
            }
            setAllInspectionItems(allItems);
          } catch (error) {
            console.error("Error fetching all items for budget:", error);
          } finally {
            setLoadingBudget(false);
          }
        };
        fetchAllItems();
      }
    }, [view, selectedInspection, rooms, pdfComparisonResult]);

    const totalLocatario = pdfComparisonResult 
      ? pdfComparisonResult.totalEstimatedCost 
      : allInspectionItems.reduce((acc, item) => acc + (item.aiAnalysis?.detectedIssues.filter(i => i.responsibility === 'Locatário').reduce((sum, i) => sum + (i.estimatedCost || 0), 0) || 0), 0);
    
    const totalLocador = pdfComparisonResult
      ? 0 
      : allInspectionItems.reduce((acc, item) => acc + (item.aiAnalysis?.detectedIssues.filter(i => i.responsibility === 'Locador').reduce((sum, i) => sum + (i.estimatedCost || 0), 0) || 0), 0);

    return (
      <div className="max-w-4xl mx-auto p-6">
        <button 
          onClick={() => { 
            if (pdfComparisonResult) {
              setView('compare');
            } else {
              setView('detail');
              setPdfComparisonResult(null);
            }
          }} 
          className="flex items-center gap-2 text-gray-500 mb-6 hover:text-indigo-600"
        >
          <ArrowLeft size={20} /> Voltar
        </button>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">Orçamento Estimado</h1>
          <Button onClick={() => generatePDF('orcamento')} icon={Download}>Exportar Orçamento</Button>
        </div>
        
        {pdfComparisonResult && (
          <div className="mb-8 p-6 bg-indigo-900 text-white rounded-3xl shadow-lg">
            <h3 className="font-bold text-xl mb-2">Resumo da Comparação de PDFs</h3>
            <p className="text-indigo-100 leading-relaxed">{pdfComparisonResult.summary}</p>
          </div>
        )}

        <div className="mb-8 p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-wrap gap-6 text-sm text-gray-600">
          <p><span className="font-bold">Imóvel:</span> {selectedInspection?.propertyAddress || "Comparação Externa"}</p>
          {selectedInspection?.ownerName && <p><span className="font-bold">Proprietário:</span> {selectedInspection.ownerName}</p>}
          {selectedInspection?.tenantName && <p><span className="font-bold">Locatário:</span> {selectedInspection.tenantName}</p>}
        </div>

        {loadingBudget ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-medium">Calculando orçamento total...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-3xl">
                <p className="text-indigo-600 text-sm font-bold uppercase tracking-wider mb-1">Responsabilidade Locador</p>
                <h2 className="text-4xl font-black text-indigo-900">R$ {totalLocador.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
                <p className="text-indigo-700/60 text-xs mt-2">* Estimativa baseada na tabela SINAPI-SP</p>
              </div>
              <div className="bg-red-50 border border-red-100 p-6 rounded-3xl">
                <p className="text-red-600 text-sm font-bold uppercase tracking-wider mb-1">Responsabilidade Locatário</p>
                <h2 className="text-4xl font-black text-red-900">R$ {totalLocatario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
                <p className="text-red-700/60 text-xs mt-2">* Estimativa baseada na tabela SINAPI-SP</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-xl mb-4">Detalhamento por Item</h3>
              {pdfComparisonResult ? (
                pdfComparisonResult.rooms.map((room: any, i: number) => (
                  <div key={i} className="space-y-4">
                    <h4 className="font-bold text-lg text-indigo-900 mt-6 flex items-center gap-2">
                      <Layers size={18} /> {room.name}
                    </h4>
                    {room.issues.map((issue: any, j: number) => (
                      <Card key={j} className="p-6">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-bold text-gray-800">{issue.item}</p>
                            <p className="text-sm text-gray-600 mt-1">{issue.description}</p>
                          </div>
                          <div className="text-right shrink-0 ml-4">
                            <p className="font-bold text-lg text-gray-900">R$ {(issue.estimatedCost || 0).toFixed(2)}</p>
                            <Badge variant={issue.responsibility === 'Locador' ? 'indigo' : 'red'}>{issue.responsibility}</Badge>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ))
              ) : (
                allInspectionItems.filter(item => item.aiAnalysis?.detectedIssues.length).map(item => (
                  <Card key={item.id} className="p-6">
                    <h4 className="font-bold text-lg mb-4 border-b pb-2">{item.name}</h4>
                    <div className="space-y-3">
                      {item.aiAnalysis?.detectedIssues.map((issue, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-gray-800">{issue.item}</p>
                            <p className="text-xs text-gray-500">{issue.issue}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900">R$ {(issue.estimatedCost || 0).toFixed(2)}</p>
                            <Badge variant={issue.responsibility === 'Locador' ? 'indigo' : 'red'}>{issue.responsibility}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  const RegistrationsView = () => {
    const [activeSubTab, setActiveSubTab] = useState<'proprietarios' | 'locatarios' | 'imoveis'>('proprietarios');
    const [showForm, setShowForm] = useState(false);

    const handleSaveRegistration = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const collectionName = activeSubTab === 'proprietarios' ? 'owners' : activeSubTab === 'locatarios' ? 'tenants' : 'properties';
      
      let data: any = {
        createdAt: new Date().toISOString(),
      };

      if (activeSubTab === 'imoveis') {
        const ownerId = formData.get('ownerId') as string;
        const owner = owners.find(o => o.id === ownerId);
        data = {
          ...data,
          address: formData.get('address') as string,
          ownerId,
          ownerName: owner?.name || '',
          type: formData.get('type') as any,
          observations: formData.get('observations') as string,
        };
      } else {
        data = {
          ...data,
          name: formData.get('name') as string,
          document: formData.get('document') as string,
          phone: formData.get('phone') as string,
          email: formData.get('email') as string,
          observations: formData.get('observations') as string,
        };
      }

      try {
        setLoading(true);
        console.log(`[Registration] Saving to ${collectionName}:`, data);
        await addDoc(collection(db, collectionName), data);
        setShowForm(false);
      } catch (error) {
        handleFirestoreError(error, 'create', collectionName);
      } finally {
        setLoading(false);
      }
    };

    const handleDeleteRegistration = async (id: string) => {
      if (!window.confirm("Tem certeza que deseja excluir este cadastro?")) return;
      const collectionName = activeSubTab === 'proprietarios' ? 'owners' : activeSubTab === 'locatarios' ? 'tenants' : 'properties';
      try {
        console.log(`[Registration] Deleting from ${collectionName}:`, id);
        await deleteDoc(doc(db, collectionName, id));
      } catch (error) {
        handleFirestoreError(error, 'delete', `${collectionName}/${id}`);
      }
    };

    return (
      <div className="max-w-4xl mx-auto p-6">
        <button onClick={() => setView('dashboard')} className="flex items-center gap-2 text-gray-500 mb-6 hover:text-indigo-600">
          <ArrowLeft size={20} /> Voltar ao Dashboard
        </button>
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Cadastros</h1>
          <Button onClick={() => setShowForm(true)} icon={Plus}>Novo Cadastro</Button>
        </div>

        <div className="flex gap-4 mb-8 border-b border-gray-100">
          <button 
            onClick={() => setActiveSubTab('proprietarios')}
            className={cn(
              'pb-4 px-2 font-medium transition-all relative',
              activeSubTab === 'proprietarios' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
            )}
          >
            Proprietários
            {activeSubTab === 'proprietarios' && <motion.div layoutId="subtab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />}
          </button>
          <button 
            onClick={() => setActiveSubTab('locatarios')}
            className={cn(
              'pb-4 px-2 font-medium transition-all relative',
              activeSubTab === 'locatarios' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
            )}
          >
            Locatários
            {activeSubTab === 'locatarios' && <motion.div layoutId="subtab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />}
          </button>
          <button 
            onClick={() => setActiveSubTab('imoveis')}
            className={cn(
              'pb-4 px-2 font-medium transition-all relative',
              activeSubTab === 'imoveis' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
            )}
          >
            Imóveis
            {activeSubTab === 'imoveis' && <motion.div layoutId="subtab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />}
          </button>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Novo {activeSubTab === 'proprietarios' ? 'Proprietário' : activeSubTab === 'locatarios' ? 'Locatário' : 'Imóvel'}</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
              </div>
              <form onSubmit={handleSaveRegistration} className="space-y-4">
                {activeSubTab === 'imoveis' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Endereço Completo</label>
                      <input name="address" required className="w-full p-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                        <select name="type" className="w-full p-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500">
                          <option value="Apartamento">Apartamento</option>
                          <option value="Casa">Casa</option>
                          <option value="Comercial">Comercial</option>
                          <option value="Outros">Outros</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Proprietário</label>
                        <select name="ownerId" required className="w-full p-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500">
                          <option value="">Selecione</option>
                          {owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                        </select>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                      <input name="name" required className="w-full p-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">CPF/CNPJ</label>
                        <input name="document" required className="w-full p-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                        <input name="phone" className="w-full p-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                      <input type="email" name="email" className="w-full p-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                  <textarea name="observations" rows={3} className="w-full p-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <Button className="w-full py-3" disabled={loading}>{loading ? 'Salvando...' : 'Salvar Cadastro'}</Button>
              </form>
            </motion.div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {(activeSubTab === 'proprietarios' ? owners : activeSubTab === 'locatarios' ? tenants : properties).map(item => (
            <Card key={item.id} className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">{(item as any).name || (item as any).address}</h3>
                <p className="text-sm text-gray-500">
                  {activeSubTab === 'imoveis' ? `${(item as any).type} • Prop: ${(item as any).ownerName}` : `${(item as any).document} • ${(item as any).email}`}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleDeleteRegistration(item.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
              </div>
            </Card>
          ))}
          {(activeSubTab === 'proprietarios' ? owners : activeSubTab === 'locatarios' ? tenants : properties).length === 0 && (
            <div className="py-20 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              <Users className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-500">Nenhum cadastro encontrado.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8F9FC] text-gray-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('dashboard')}>
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <ClipboardCheck className="text-white" size={20} />
            </div>
            <span className="font-black text-xl tracking-tight text-indigo-900">VISTORIA.AI</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"><Search size={20} /></button>
            <button className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"><Settings size={20} /></button>
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs uppercase">
              {selectedInspection?.inspectorName?.charAt(0) || 'V'}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {view === 'dashboard' && <Dashboard />}
            {view === 'new' && <NewInspectionForm />}
            {view === 'detail' && <InspectionDetail />}
            {view === 'budget' && <BudgetView />}
            {view === 'compare' && <ComparisonView />}
            {view === 'registrations' && <RegistrationsView />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Item Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Revisar Item: {editingItem.name}</h2>
              <button onClick={() => setEditingItem(null)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado de Conservação</label>
                <select 
                  defaultValue={editingItem.condition}
                  onChange={async (e) => {
                    await updateDoc(doc(db, `inspections/${selectedInspection?.id}/rooms/${selectedRoom?.id}/items`, editingItem.id), { condition: e.target.value as ConservationState });
                  }}
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Novo">Novo</option>
                  <option value="Bom">Bom</option>
                  <option value="Regular">Regular</option>
                  <option value="Ruim">Ruim</option>
                  <option value="Impróprio para uso">Impróprio para uso</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descrição Técnica / Observações</label>
                <textarea 
                  defaultValue={editingItem.description}
                  onBlur={async (e) => {
                    await updateDoc(doc(db, `inspections/${selectedInspection?.id}/rooms/${selectedRoom?.id}/items`, editingItem.id), { description: e.target.value });
                  }}
                  rows={4}
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium text-gray-700">Mídias</h4>
                  <Button variant="outline" className="text-xs py-1" icon={Camera} onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*,video/*';
                    input.multiple = true;
                    input.onchange = async (e: any) => {
                      const files = Array.from(e.target.files) as File[];
                      console.log(`[Edit Modal] ${files.length} arquivos selecionados.`);
                      
                      for (const file of files) {
                        handleProcessUpload(file, selectedRoom?.id || '', editingItem.id, false);
                      }
                    };
                    input.click();
                  }}>Adicionar</Button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {/* Remote Photos */}
                  {editingItem.photos?.map((url, i) => (
                    <div key={`edit-photo-${i}`} className="relative group aspect-square bg-gray-100 rounded-xl overflow-hidden">
                      <img 
                        src={url} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                        onLoad={() => console.log(`[Edit Modal Preview] Imagem remota carregada: ${url}`)}
                        onError={(e) => {
                          console.error(`[Edit Modal Preview] Erro ao carregar imagem remota: ${url}`);
                          (e.target as HTMLImageElement).src = 'https://placehold.co/400x400?text=Erro';
                        }}
                      />
                      <button 
                        onClick={() => handleDeleteMedia(editingItem.id, url, 'photo')}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}

                  {/* Remote Videos */}
                  {editingItem.videos?.map((url, i) => (
                    <div key={`edit-video-${i}`} className="relative group aspect-square bg-gray-100 rounded-xl overflow-hidden">
                      <video 
                        src={url} 
                        className="w-full h-full object-cover"
                        onLoadedData={() => console.log(`[Edit Modal Preview] Vídeo remoto carregado: ${url}`)}
                        onError={(e) => {
                          console.error(`[Edit Modal Preview] Erro ao carregar vídeo remoto: ${url}`);
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <Play size={16} className="text-white opacity-50" />
                      </div>
                      <button 
                        onClick={() => handleDeleteMedia(editingItem.id, url, 'video')}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}

                  {/* Local Preview Fallback */}
                  {editingItem.localPreviewUrl && (
                    <div className="relative group aspect-square bg-gray-100 rounded-xl overflow-hidden">
                      {editingItem.localPreviewUrl.includes('video') || editingItem.name.toLowerCase().endsWith('.mp4') ? (
                        <video src={editingItem.localPreviewUrl} className="w-full h-full object-cover opacity-50" />
                      ) : (
                        <img src={editingItem.localPreviewUrl} className="w-full h-full object-cover opacity-50" />
                      )}
                      
                      {editingItem.mediaStatus === 'uploading' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-20">
                          <RefreshCw size={16} className="animate-spin text-blue-400 mb-1" />
                          <span className="text-[8px] font-bold text-white uppercase tracking-widest">
                            {editingItem.uploadProgress ? Math.floor(editingItem.uploadProgress) + '%' : 'Enviando'}
                          </span>
                        </div>
                      )}

                      {editingItem.mediaStatus === 'metadata_syncing' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-blue-600/60 backdrop-blur-sm z-20">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full mb-1" />
                          <span className="text-[8px] font-bold text-white uppercase tracking-widest">Sinc.</span>
                        </div>
                      )}

                      {editingItem.mediaStatus === 'error' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-600/80 backdrop-blur-sm p-1 text-center z-20">
                          <AlertCircle size={16} className="text-white mb-1" />
                          <Button variant="secondary" className="text-[8px] py-0.5 h-auto" onClick={() => handleRetryUpload(editingItem.id, editingItem.roomId)}>Tentar</Button>
                        </div>
                      )}

                      {editingItem.mediaStatus === 'metadata_error' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-yellow-600/70 backdrop-blur-sm p-1 text-center z-20">
                          <RefreshCw size={16} className="text-white mb-1" />
                          <Button variant="secondary" className="text-[8px] py-0.5 h-auto" onClick={() => handleRetrySync(editingItem.id, editingItem.roomId)}>Sinc.</Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Error States in Modal */}
                  {editingItem.mediaStatus === 'error' && (
                    <div className="aspect-square bg-red-50 rounded-xl flex flex-col items-center justify-center p-2 border border-red-100 text-center">
                      <AlertCircle size={20} className="text-red-500 mb-1" />
                      <span className="text-[8px] font-bold text-red-600 uppercase mb-1">Erro no Upload</span>
                      <Button variant="secondary" className="text-[8px] py-0.5 h-auto" onClick={() => handleRetryUpload(editingItem.id, editingItem.roomId)}>Tentar</Button>
                    </div>
                  )}

                  {editingItem.mediaStatus === 'metadata_error' && (
                    <div className="aspect-square bg-yellow-50 rounded-xl flex flex-col items-center justify-center p-2 border border-yellow-100 text-center">
                      <RefreshCw size={20} className="text-yellow-600 mb-1" />
                      <span className="text-[8px] font-bold text-yellow-700 uppercase mb-1">Erro Sinc.</span>
                      <Button variant="secondary" className="text-[8px] py-0.5 h-auto" onClick={() => handleRetrySync(editingItem.id, editingItem.roomId)}>Sinc.</Button>
                    </div>
                  )}

                  {/* AI Analyzing Status */}
                  {editingItem.aiStatus === 'analyzing' && (
                    <div className="aspect-square bg-indigo-50 rounded-xl flex flex-col items-center justify-center gap-2 border border-indigo-100">
                      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent animate-spin rounded-full" />
                      <span className="text-[8px] font-bold text-indigo-600 uppercase tracking-widest text-center px-1">IA Analisando...</span>
                    </div>
                  )}
                </div>
              </div>

              {editingItem.aiAnalysis && (
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-400 uppercase text-xs tracking-widest">Danos e Responsabilidades (IA)</h3>
                  {editingItem.aiAnalysis.detectedIssues.map((issue, idx) => (
                    <div key={idx} className="bg-gray-50 p-4 rounded-xl flex justify-between items-center">
                      <div>
                        <p className="font-bold text-gray-800">{issue.item}</p>
                        <p className="text-sm text-gray-500">{issue.issue}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <select 
                          defaultValue={issue.responsibility}
                          onChange={async (e) => {
                            const newIssues = [...editingItem.aiAnalysis!.detectedIssues];
                            newIssues[idx].responsibility = e.target.value as Responsibility;
                            await updateDoc(doc(db, `inspections/${selectedInspection?.id}/rooms/${selectedRoom?.id}/items`, editingItem.id), { 
                              'aiAnalysis.detectedIssues': newIssues 
                            });
                          }}
                          className="text-xs p-1 rounded border border-gray-200"
                        >
                          <option value="Locador">Locador</option>
                          <option value="Locatário">Locatário</option>
                          <option value="N/A">N/A</option>
                        </select>
                        <span className="font-mono font-bold text-indigo-600">R$ {issue.estimatedCost?.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Button className="w-full" onClick={() => setEditingItem(null)}>Salvar Alterações</Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Upload Progress Overlay */}
      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="fixed bottom-6 right-6 bg-white p-4 rounded-2xl shadow-2xl border border-gray-100 flex items-center gap-4 z-[100]">
          <div className="w-12 h-12 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
          <div>
            <p className="font-bold text-sm">Enviando mídia...</p>
            <p className="text-xs text-gray-400">{Math.round(uploadProgress)}% concluído</p>
          </div>
        </div>
      )}
    </div>
  );
}
