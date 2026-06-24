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
  Percent,
  Video,
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
  Zap,
  Printer,
  Edit,
  Sliders,
  Sparkles
} from 'lucide-react';
import { 
  collection as fb_collection, 
  addDoc as fb_addDoc, 
  query as fb_query, 
  where as fb_where, 
  onSnapshot as fb_onSnapshot, 
  doc as fb_doc, 
  setDoc as fb_setDoc,
  updateDoc as fb_updateDoc, 
  deleteDoc as fb_deleteDoc, 
  orderBy as fb_orderBy, 
  getDocs as fb_getDocs,
  getDoc as fb_getDoc,
  serverTimestamp as fb_serverTimestamp,
  deleteField as fb_deleteField,
  arrayUnion as fb_arrayUnion
} from 'firebase/firestore';

// --- FIRESTORE OFFLINE/DEMO SHADOW WRAPPERS ---
interface DemoDocListener {
  id: string;
  type: 'doc';
  docPath: string;
  trigger: () => void;
}

interface DemoQueryListener {
  id: string;
  type: 'query';
  collectionPath: string;
  constraints: any[];
  trigger: () => void;
}

let demoDocListeners: DemoDocListener[] = [];
let demoQueryListeners: DemoQueryListener[] = [];

// Seed Data
const DEFAULT_SEED_DATA: Record<string, any> = {
  // --- PROPERTIES ---
  "properties/prop_1": {
    id: "prop_1",
    address: "Av. Atlântica, 1200 - Apto 802 - Copacabana, Rio de Janeiro - RJ",
    type: "apartamento",
    area: 120,
    bedrooms: 3,
    bathrooms: 2,
    parkingSpaces: 1,
    rentValue: 6500,
    saleValue: 1800000,
    createdAt: "2026-06-20T10:00:00Z"
  },
  "properties/prop_2": {
    id: "prop_2",
    address: "Rua Barão da Torre, 340 - Ipanema, Rio de Janeiro - RJ",
    type: "apartamento",
    area: 95,
    bedrooms: 2,
    bathrooms: 2,
    parkingSpaces: 1,
    rentValue: 5800,
    saleValue: 1450000,
    createdAt: "2026-06-21T14:30:00Z"
  },

  // --- OWNERS ---
  "owners/own_1": {
    id: "own_1",
    name: "Carlos Alberto Menezes",
    email: "carlos.menezes@gmail.com",
    phone: "(21) 98888-1122",
    cpf: "123.456.789-00",
    createdAt: "2026-06-19T09:00:00Z"
  },
  "owners/own_2": {
    id: "own_2",
    name: "Ana Beatriz Rocha",
    email: "anabeatrocha@hotmail.com",
    phone: "(21) 97777-3344",
    cpf: "987.654.321-11",
    createdAt: "2026-06-19T10:15:00Z"
  },

  // --- TENANTS ---
  "tenants/ten_1": {
    id: "ten_1",
    name: "Mateus Ribeiro Santos",
    email: "mateus.ribs@gmail.com",
    phone: "(21) 99999-5566",
    cpf: "222.333.444-55",
    createdAt: "2026-06-20T11:00:00Z"
  },

  // --- USERS ---
  "users/demo_user": {
    uid: "demo_user",
    name: "Administrador Master (Demo)",
    email: "qdezimoveis@gmail.com",
    role: "admin",
    createdAt: "2026-06-24T08:00:00Z"
  },

  // --- INSPECTIONS ---
  "inspections/insp_1": {
    id: "insp_1",
    type: "entrada",
    propertyId: "prop_1",
    propertyAddress: "Av. Atlântica, 1200 - Apto 802 - Copacabana, Rio de Janeiro - RJ",
    date: "2026-06-24",
    status: "concluido",
    inspectorName: "Daniel Vistoriador",
    ownerId: "own_1",
    ownerName: "Carlos Alberto Menezes",
    tenantId: "ten_1",
    tenantName: "Mateus Ribeiro Santos",
    createdAt: "2026-06-24T08:30:00Z",
    createdBy: "demo_user"
  },

  // --- ROOMS FOR INSPECTION 1 ---
  "inspections/insp_1/rooms/room_1": {
    id: "room_1",
    name: "Sala de Estar",
    createdAt: "2026-06-24T08:35:00Z"
  },
  "inspections/insp_1/rooms/room_2": {
    id: "room_2",
    name: "Cozinha",
    createdAt: "2026-06-24T08:36:00Z"
  },

  // --- ITEMS FOR ROOM 1 ---
  "inspections/insp_1/rooms/room_1/items/item_1": {
    id: "item_1",
    name: "Piso de Taco de Madeira",
    state: "bom",
    observations: "Sinteco novo, brilhoso, sem riscos aparentes.",
    responsibility: "proprietario",
    createdAt: "2026-06-24T08:38:00Z"
  },
  "inspections/insp_1/rooms/room_1/items/item_2": {
    id: "item_2",
    name: "Paredes e Pintura",
    state: "regular",
    observations: "Pintura branca nova, mas com pequena marca de batida de móvel perto da porta de entrada.",
    responsibility: "inquilino",
    createdAt: "2026-06-24T08:39:00Z"
  },

  // --- ITEMS FOR ROOM 2 ---
  "inspections/insp_1/rooms/room_2/items/item_3": {
    id: "item_3",
    name: "Bancada de Granito",
    state: "bom",
    observations: "Sem trincas, polimento conservado.",
    responsibility: "proprietario",
    createdAt: "2026-06-24T08:41:00Z"
  },

  // --- APPRAISALS ---
  "appraisals/appr_1": {
    id: "appr_1",
    propertyAddress: "Rua Barão da Torre, 340 - Ipanema, Rio de Janeiro - RJ",
    propertyType: "apartamento",
    area: 95,
    bedrooms: 2,
    bathrooms: 2,
    parkingSpaces: 1,
    standard: "alto",
    conservation: "novo",
    calculatedValue: 1425000,
    status: "concluido",
    userId: "demo_user",
    createdAt: "2026-06-24T08:45:00Z",
    notes: "Avaliação por comparação direta baseada em 3 amostras geradas na região de Ipanema.",
    samples: [
      { id: "s1", address: "Rua Redentor, 120", rentValue: 6000, saleValue: 1480000, area: 98, bedrooms: 2, bathrooms: 2, parkingSpaces: 1, standard: "alto", distance: 0.15 },
      { id: "s2", address: "Rua Vinícius de Moraes, 250", rentValue: 5500, saleValue: 1390000, area: 92, bedrooms: 2, bathrooms: 2, parkingSpaces: 1, standard: "alto", distance: 0.32 },
      { id: "s3", address: "Rua Joana Angélica, 85", rentValue: 5900, saleValue: 1410000, area: 95, bedrooms: 2, bathrooms: 2, parkingSpaces: 1, standard: "alto", distance: 0.22 }
    ]
  }
};

const getDemoDb = () => {
  try {
    const data = localStorage.getItem('qdez_demo_db');
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error(e);
  }
  localStorage.setItem('qdez_demo_db', JSON.stringify(DEFAULT_SEED_DATA));
  return DEFAULT_SEED_DATA;
};

const saveDemoDb = (dbState: any) => {
  try {
    localStorage.setItem('qdez_demo_db', JSON.stringify(dbState));
  } catch (e) {
    console.error(e);
  }
};

const isDemoActive = () => {
  return localStorage.getItem('qdez_demo_db_active') === 'true';
};

const getCollectionDocs = (collectionPath: string) => {
  const dbState = getDemoDb();
  const docs: any[] = [];
  const prefix = collectionPath + '/';
  for (const key of Object.keys(dbState)) {
    if (key.startsWith(prefix)) {
      const subPath = key.substring(prefix.length);
      if (!subPath.includes('/')) {
        docs.push({ id: subPath, ...dbState[key] });
      }
    }
  }
  return docs;
};

const executeQuery = (collectionPath: string, constraints: any[]) => {
  let docs = getCollectionDocs(collectionPath);
  
  for (const constraint of constraints) {
    if (constraint.type === 'where') {
      const { field, op, value } = constraint;
      docs = docs.filter(doc => {
        const docVal = doc[field];
        if (op === '==') return docVal === value;
        if (op === '>=') return docVal >= value;
        if (op === '<=') return docVal <= value;
        if (op === 'array-contains') return Array.isArray(docVal) && docVal.includes(value);
        return true;
      });
    }
  }

  for (const constraint of constraints) {
    if (constraint.type === 'orderBy') {
      const { field, direction } = constraint;
      docs.sort((a, b) => {
        const valA = a[field];
        const valB = b[field];
        if (valA === undefined || valB === undefined) return 0;
        
        let comparison = 0;
        if (typeof valA === 'string' && typeof valB === 'string') {
          comparison = valA.localeCompare(valB);
        } else {
          comparison = valA < valB ? -1 : valA > valB ? 1 : 0;
        }
        return direction === 'desc' ? -comparison : comparison;
      });
    }
  }

  return docs;
};

const triggerDemoUpdate = (changedPath: string) => {
  for (const listener of demoDocListeners) {
    if (listener.docPath === changedPath) {
      listener.trigger();
    }
  }

  const lastSlashIndex = changedPath.lastIndexOf('/');
  if (lastSlashIndex !== -1) {
    const collectionPath = changedPath.substring(0, lastSlashIndex);
    for (const listener of demoQueryListeners) {
      if (listener.collectionPath === collectionPath) {
        listener.trigger();
      }
    }
  }
};

const collection = (dbInstance: any, path: string, ...args: any[]) => {
  const fullPath = [path, ...args].filter(Boolean).join('/');
  const fbRef = fb_collection(dbInstance, path, ...args);
  return {
    type: 'collection',
    path: fullPath,
    fbRef
  };
};

const doc = (dbInstance: any, path: string, ...args: any[]) => {
  const fullPath = [path, ...args].filter(Boolean).join('/');
  const fbRef = fb_doc(dbInstance, path, ...args);
  const segments = fullPath.split('/');
  const id = segments[segments.length - 1];
  return {
    type: 'doc',
    path: fullPath,
    id,
    fbRef
  };
};

const query = (collectionRef: any, ...constraints: any[]) => {
  const isWrapped = collectionRef && collectionRef.type === 'collection';
  const realColl = isWrapped ? collectionRef.fbRef : collectionRef;
  const realConstraints = constraints.map(c => c.type === 'where' || c.type === 'orderBy' ? c.fbConstraint : c);
  const fbRef = fb_query(realColl, ...realConstraints);
  return {
    type: 'query',
    collection: isWrapped ? collectionRef : { path: collectionRef.path || '' },
    constraints,
    fbRef
  };
};

const where = (field: string, op: any, value: any) => {
  const fbConstraint = fb_where(field, op, value);
  return {
    type: 'where',
    field,
    op,
    value,
    fbConstraint
  };
};

const orderBy = (field: string, direction: any = 'asc') => {
  const fbConstraint = fb_orderBy(field, direction);
  return {
    type: 'orderBy',
    field,
    direction,
    fbConstraint
  };
};

const processFieldUpdate = (existingValue: any, updateValue: any) => {
  if (updateValue && typeof updateValue === 'object') {
    if (updateValue.__type === 'deleteField') {
      return undefined;
    }
    if (updateValue.__type === 'arrayUnion') {
      const arr = Array.isArray(existingValue) ? [...existingValue] : [];
      for (const el of updateValue.elements) {
        if (!arr.includes(el)) {
          arr.push(el);
        }
      }
      return arr;
    }
  }
  return updateValue;
};

const resolveSentinels = (existingObj: any, updateObj: any) => {
  const result = { ...existingObj };
  for (const [key, val] of Object.entries(updateObj)) {
    const processed = processFieldUpdate(result[key], val);
    if (processed === undefined) {
      delete result[key];
    } else {
      result[key] = processed;
    }
  }
  return result;
};

const addDoc = async (collectionRef: any, data: any) => {
  if (!isDemoActive()) {
    return fb_addDoc(collectionRef.fbRef || collectionRef, data);
  }

  const dbState = getDemoDb();
  const id = 'demo_' + Math.random().toString(36).substring(2, 9);
  const path = `${collectionRef.path}/${id}`;
  const newDoc = { id, ...data };
  dbState[path] = newDoc;
  saveDemoDb(dbState);
  
  triggerDemoUpdate(path);
  return { id };
};

const setDoc = async (docRef: any, data: any, options?: any) => {
  if (!isDemoActive()) {
    return fb_setDoc(docRef.fbRef || docRef, data, options);
  }

  const dbState = getDemoDb();
  const path = docRef.path;
  if (options?.merge) {
    dbState[path] = resolveSentinels(dbState[path] || {}, data);
  } else {
    dbState[path] = { id: docRef.id, ...data };
  }
  saveDemoDb(dbState);
  
  triggerDemoUpdate(path);
};

const updateDoc = async (docRef: any, data: any) => {
  if (!isDemoActive()) {
    return fb_updateDoc(docRef.fbRef || docRef, data);
  }

  const dbState = getDemoDb();
  const path = docRef.path;
  dbState[path] = resolveSentinels(dbState[path] || {}, data);
  saveDemoDb(dbState);
  
  triggerDemoUpdate(path);
};

const deleteDoc = async (docRef: any) => {
  if (!isDemoActive()) {
    return fb_deleteDoc(docRef.fbRef || docRef);
  }

  const dbState = getDemoDb();
  const path = docRef.path;
  delete dbState[path];
  
  const prefix = path + '/';
  for (const key of Object.keys(dbState)) {
    if (key.startsWith(prefix)) {
      delete dbState[key];
    }
  }
  
  saveDemoDb(dbState);
  triggerDemoUpdate(path);
};

const getDoc = async (docRef: any) => {
  if (!isDemoActive()) {
    return fb_getDoc(docRef.fbRef || docRef);
  }

  const dbState = getDemoDb();
  const docData = dbState[docRef.path];
  return {
    id: docRef.id,
    exists: () => !!docData,
    data: () => docData
  };
};

const getDocs = async (queryRef: any) => {
  if (!isDemoActive()) {
    return fb_getDocs(queryRef.fbRef || queryRef);
  }

  const collectionPath = queryRef.type === 'query' ? queryRef.collection.path : queryRef.path;
  const constraints = queryRef.type === 'query' ? queryRef.constraints : [];
  const docs = executeQuery(collectionPath, constraints);
  const docsSnap = docs.map(d => ({
    id: d.id,
    data: () => d,
    exists: () => true
  }));
  return {
    docs: docsSnap,
    forEach: (cb: any) => docsSnap.forEach(cb),
    map: (cb: any) => docsSnap.map(cb),
    empty: docsSnap.length === 0,
    size: docsSnap.length
  };
};

const onSnapshot = (ref: any, onNext: (snap: any) => void, onError?: (err: any) => void) => {
  if (!isDemoActive()) {
    const targetRef = ref.fbRef || ref;
    return fb_onSnapshot(targetRef, onNext, onError);
  }

  const listenerId = 'listener_' + Math.random().toString(36).substring(2, 9);
  
  if (ref.type === 'doc') {
    const docPath = ref.path;
    const triggerDocUpdate = () => {
      const dbState = getDemoDb();
      const docData = dbState[docPath];
      onNext({
        id: ref.id,
        exists: () => !!docData,
        data: () => docData
      } as any);
    };
    
    triggerDocUpdate();
    
    const listenerObj = {
      id: listenerId,
      type: 'doc' as const,
      docPath,
      trigger: triggerDocUpdate
    };
    demoDocListeners.push(listenerObj);
    
    return () => {
      demoDocListeners = demoDocListeners.filter(l => l.id !== listenerId);
    };
  } else {
    const collectionPath = ref.type === 'query' ? ref.collection.path : ref.path;
    const constraints = ref.type === 'query' ? ref.constraints : [];
    
    const triggerQueryUpdate = () => {
      const docs = executeQuery(collectionPath, constraints);
      const docsSnap = docs.map(d => ({
        id: d.id,
        data: () => d,
        exists: () => true
      }));
      onNext({
        docs: docsSnap,
        forEach: (cb: any) => docsSnap.forEach(cb),
        map: (cb: any) => docsSnap.map(cb),
        empty: docsSnap.length === 0,
        size: docsSnap.length
      } as any);
    };
    
    triggerQueryUpdate();
    
    const listenerObj = {
      id: listenerId,
      type: 'query' as const,
      collectionPath,
      constraints,
      trigger: triggerQueryUpdate
    };
    demoQueryListeners.push(listenerObj);
    
    return () => {
      demoQueryListeners = demoQueryListeners.filter(l => l.id !== listenerId);
    };
  }
};

const serverTimestamp = fb_serverTimestamp;
const deleteField = () => ({ __type: 'deleteField' });
const arrayUnion = (...elements: any[]) => ({ __type: 'arrayUnion', elements });
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable, deleteObject } from 'firebase/storage';
import { initializeApp, getApp } from 'firebase/app';
import { db, storage, auth } from './firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut, 
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { 
  Inspection, 
  Room, 
  Item, 
  InspectionType, 
  ConservationState, 
  Responsibility, 
  ItemIssue, 
  Owner, 
  Tenant, 
  Property, 
  MediaStatus, 
  AIStatus, 
  Appraisal, 
  AppraisalSample, 
  ExclusivityContract,
  AppUser 
} from './types';
import { analyzeRoomMedia, transcribeAudio, generateAppraisalSamples, analyzeAppraisalMedia, generateQdezMarketingDiagnosis } from './lib/gemini';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import imageCompression from 'browser-image-compression';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { offlineDB, type OfflineMedia } from './lib/db';
import { CameraCapture } from './components/CameraCapture';

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

// --- BRANDING ---
const BRAND_RED: [number, number, number] = [193, 39, 45]; // #C1272D
const BRAND_STONE_DARK: [number, number, number] = [87, 83, 78]; // #57534E
const BRAND_STONE_LIGHT: [number, number, number] = [120, 113, 108]; // #78716C

const drawPDFHeader = (doc: any, title: string) => {
  // Page Frame Accent (Premium Editorial Style)
  doc.setDrawColor(210, 205, 200);
  doc.setLineWidth(0.3);
  doc.rect(12, 12, 186, 273, 'D');

  // Solid vertical high-performance red left border strap
  doc.setFillColor(193, 39, 45);
  doc.rect(12, 12, 1.5, 273, 'F');

  // Solid horizontal red top border strap
  doc.rect(12, 12, 186, 1.5, 'F');

  // Logo "Q"
  doc.setFillColor(193, 39, 45);
  doc.circle(30, 25, 10, 'F');
  doc.setFillColor(255, 255, 255);
  doc.circle(30, 25, 6, 'F');
  
  // House inside Q
  doc.setFillColor(193, 39, 45);
  doc.triangle(26, 28, 34, 28, 30, 22, 'F');
  doc.rect(27, 28, 6, 4, 'F');
  
  // Q tail
  doc.setDrawColor(193, 39, 45);
  doc.setLineWidth(1.5);
  doc.line(36, 31, 40, 35);

  // Text "Q.DEZ"
  doc.setFontSize(24);
  doc.setTextColor(87, 83, 78);
  doc.setFont(undefined, 'bold');
  doc.text('Q.DEZ', 45, 30);
  
  // Text "IMÓVEIS"
  doc.setFontSize(12);
  doc.setTextColor(120, 113, 108);
  doc.setFont(undefined, 'normal');
  doc.text('IMÓVEIS', 45, 37);

  // Date
  doc.setFontSize(9);
  doc.setTextColor(120, 113, 108);
  doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 145, 20);

  // Report Title (Imposing typography & branding)
  doc.setFontSize(16);
  doc.setTextColor(193, 39, 45); // Brand Red for imposing header titles
  doc.setFont(undefined, 'bold');
  doc.text(title, 20, 55);

  // Divider
  doc.setDrawColor(200, 195, 190);
  doc.setLineWidth(0.5);
  doc.line(20, 60, 190, 60);

  // Bottom Branded Footer (Prestigious layout)
  doc.setDrawColor(220, 215, 210);
  doc.setLineWidth(0.3);
  doc.line(15, 278, 195, 278);

  doc.setFontSize(6.5);
  doc.setTextColor(140, 135, 130);
  doc.setFont(undefined, 'bold');
  doc.text('METODOLOGIA EXCLUSIVA QDEZ IMÓVEIS • REPRESENTAÇÃO COM ALTA PERFORMANCE', 15, 282);

  doc.setFont(undefined, 'normal');
  doc.text('DOCUMENTO OFICIAL DE PRESTAÇÃO DE CONTAS', 195, 282, { align: 'right' });
  
  // Reset font for body text
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'normal');
  
  return 70;
};

// --- COMPONENTS ---

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, icon: Icon, size = 'md' }: any) => {
  const variants: any = {
    primary: 'bg-red-700 text-white hover:bg-red-800',
    secondary: 'bg-white text-red-700 border border-red-700 hover:bg-red-50',
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
    red: 'bg-red-100 text-red-700',
    green: 'bg-green-100 text-green-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    stone: 'bg-stone-100 text-stone-700',
    gray: 'bg-gray-100 text-gray-700',
    blue: 'bg-blue-100 text-blue-700',
  };
  return (
    <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold', variants[variant])}>
      {children}
    </span>
  );
};

const adjustPaintAndStructuralIssue = (issue: any) => {
  if (!issue) return issue;
  const itemLower = (issue.item || '').toLowerCase();
  const issueLower = (issue.issue || issue.description || '').toLowerCase();
  const responsibility = issue.responsibility || 'N/A';

  // Identify paint-related issues
  const isPaintOrWall = itemLower.includes('pintura') || 
                        itemLower.includes('parede') || 
                        itemLower.includes('teto') || 
                        itemLower.includes('massa corrida') ||
                        issueLower.includes('pintura') || 
                        issueLower.includes('parede') || 
                        issueLower.includes('teto') || 
                        issueLower.includes('latex') ||
                        issueLower.includes('látex') ||
                        issueLower.includes('tinta');

  // Tenant-responsible paint issues (like furos, sujeiras, riscos, etc.)
  const isTenantPaintProblem = isPaintOrWall && (
    issueLower.includes('sujeira') || 
    issueLower.includes('sujidade') || 
    issueLower.includes('furo') || 
    issueLower.includes('prego') || 
    issueLower.includes('risco') || 
    issueLower.includes('mancha') || 
    issueLower.includes('gordura') || 
    issueLower.includes('rabisco') || 
    issueLower.includes('descascado') || 
    issueLower.includes('desgaste') ||
    itemLower.includes('pintura') || // default walls/painting to complete paint job
    responsibility === 'Locatário'
  );

  // Identify structural/landlord issues
  const isStructuralOrLandlord = responsibility === 'Locador' ||
                                itemLower.includes('infiltração') || 
                                itemLower.includes('infiltracao') || 
                                itemLower.includes('vazamento') || 
                                itemLower.includes('estrutura') || 
                                itemLower.includes('rachadura') || 
                                itemLower.includes('fissura') || 
                                itemLower.includes('reboco') ||
                                issueLower.includes('infiltração') || 
                                issueLower.includes('infiltracao') || 
                                issueLower.includes('vazamento') || 
                                issueLower.includes('rachadura') || 
                                issueLower.includes('fissura') || 
                                issueLower.includes('mofo') ||
                                issueLower.includes('estrutural');

  // Rule 3: Structural/Landlord repairs must NEVER be budgeted, only mentioned (cost = 0)
  if (isStructuralOrLandlord) {
    return {
      ...issue,
      responsibility: 'Locador',
      materialCost: 0,
      laborCost: 0,
      totalCost: 0,
      estimatedCost: 0,
      source: 'Mencionamento Estrutural - Isento de Ônus Financeiro'
    };
  }

  // Rule 1: Upgrade tenant paint problems to a complete room painting using standard quality paint
  if (isTenantPaintProblem) {
    return {
      ...issue,
      responsibility: 'Locatário',
      item: 'Pintura Completa do Ambiente',
      issue: `Pintura completa de todas as paredes/ambiente de qualidade standard devido a sujeiras, furos ou danos na parede: "${issue.issue || issue.description || 'sujeira/furos'}".`,
      description: `Pintura completa de todas as paredes/ambiente de qualidade standard devido a sujeiras, furos ou danos na parede: "${issue.description || issue.issue || 'sujeira/furos'}".`,
      materialCost: 350.00,
      laborCost: 500.00,
      totalCost: 850.00,
      estimatedCost: 850.00,
      source: 'SINAPI/SP - Pintura Látex Completa das Paredes (Tinta Padrão Standard)'
    };
  }

  // Any other item
  return issue;
};

// --- MAIN APP ---

export default function App() {
  const [mainModule, setMainModule] = useState<'selector' | 'inspections' | 'appraisals'>('selector');
  const [view, setView] = useState<'dashboard' | 'new' | 'detail' | 'compare' | 'budget' | 'registrations' | 'appraisal_list' | 'appraisal_new' | 'appraisal_detail' | 'appraisal_edit'>('dashboard');
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [appraisals, setAppraisals] = useState<Appraisal[]>([]);
  const [selectedAppraisal, setSelectedAppraisal] = useState<Appraisal | null>(null);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [roomMultipliers, setRoomMultipliers] = useState<Record<string, number>>({});
  const [itemMultipliers, setItemMultipliers] = useState<Record<string, number>>({});
  const [compareInspections, setCompareInspections] = useState<Inspection[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAnalyzingAll, setIsAnalyzingAll] = useState(false);
  const [isAnalyzingAppraisal, setIsAnalyzingAppraisal] = useState(false);
  const [captureMode, setCaptureMode] = useState<{ mode: 'photo' | 'video', roomId?: string, itemId?: string, target?: 'inspection' | 'appraisal' } | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pendingFiles, setPendingFiles] = useState<Map<string, File>>(new Map());
  const [quickPhotos, setQuickPhotos] = useState<string[]>([]);
  const [isUploadingQuick, setIsUploadingQuick] = useState(false);
  const [reportProgress, setReportProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [localRoomPhotos, setLocalRoomPhotos] = useState<Record<string, string[]>>({});
  const [pdfFiles, setPdfFiles] = useState<{ file1: File | null, file2: File | null }>({ file1: null, file2: null });
  const [isComparingPdfs, setIsComparingPdfs] = useState(false);
  const [pdfComparisonResult, setPdfComparisonResult] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isEditingFactors, setIsEditingFactors] = useState(false);
  const [editedSamples, setEditedSamples] = useState<AppraisalSample[]>([]);
  const [isGeneratingQdez, setIsGeneratingQdez] = useState(false);
  const [isEditingContract, setIsEditingContract] = useState(false);
  const [contractFormData, setContractFormData] = useState<ExclusivityContract | null>(null);

  // --- AUTH STATE & EFFECTS ---
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [usersList, setUsersList] = useState<AppUser[]>([]);

  useEffect(() => {
    if (localStorage.getItem('qdez_demo_db_active') === 'true') {
      const demoUser: AppUser = {
        uid: 'demo_user',
        email: 'qdezimoveis@gmail.com',
        name: 'Administrador Master (Demo)',
        role: 'admin',
        createdAt: new Date().toISOString()
      };
      setAppUser(demoUser);
      setAuthLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            setAppUser(userDoc.data() as AppUser);
          } else {
            const isMaster = user.email === 'qdezimoveis@gmail.com';
            const newAppUser: AppUser = {
              uid: user.uid,
              email: user.email || '',
              name: isMaster ? 'Administrador Master' : (user.displayName || 'Corretor'),
              role: isMaster ? 'admin' : 'corretor',
              createdAt: new Date().toISOString()
            };
            await setDoc(userRef, newAppUser);
            setAppUser(newAppUser);
          }
        } catch (error) {
          console.error("Erro ao obter perfil de usuário:", error);
        }
      } else {
        setCurrentUser(null);
        setAppUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (appUser?.role === 'admin') {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => doc.data() as AppUser);
        setUsersList(data);
      }, (error) => handleFirestoreError(error, 'list', 'users'));
      return () => unsubscribe();
    } else {
      setUsersList([]);
    }
  }, [appUser]);

  const handleToggleMedia = (media: string) => {
    setContractFormData(prev => {
      if (!prev) return null;
      const current = prev.authorizedMedia || [];
      const updated = current.includes(media)
        ? current.filter(m => m !== media)
        : [...current, media];
      return { ...prev, authorizedMedia: updated };
    });
  };

  const handleStartDateOrDaysChange = (dateStr: string, days: number) => {
    if (!dateStr || !days) return;
    try {
      const startDate = new Date(dateStr + 'T12:00:00');
      const endDate = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);
      setContractFormData(prev => prev ? {
        ...prev,
        startDate: dateStr,
        exclusivityDays: days,
        endDate: endDate.toISOString().split('T')[0]
      } : null);
    } catch (e) {
      console.error(e);
    }
  };

  // --- OFFLINE SYNC ---
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isOnline && !syncing) {
      syncOfflineMedia();
    }
  }, [isOnline]);

  const syncOfflineMedia = async () => {
    const pending = await offlineDB.media.where('synced').equals(0).toArray();
    if (pending.length === 0) return;

    setSyncing(true);
    console.log(`[Sync] Sincronizando ${pending.length} itens offline...`);

    for (const item of pending) {
      try {
        const file = new File([item.file], item.fileName, { type: item.contentType });
        const downloadURL = await uploadToStorage(file, item.inspectionId, item.roomId, item.itemId);
        
        if (downloadURL) {
          const itemRef = doc(db, `inspections/${item.inspectionId}/rooms/${item.roomId}/items`, item.itemId);
          const field = item.type === 'photo' ? 'photos' : 'videos';
          
          // Update item
          const itemDoc = await getDoc(itemRef);
          if (itemDoc.exists()) {
            const data = itemDoc.data() as any;
            const currentMedia = data[field] || [];
            await updateDoc(itemRef, {
              [field]: [...currentMedia, downloadURL]
            });
          }

          // Create media attachment
          await addDoc(collection(db, 'mediaAttachments'), {
            inspectionId: item.inspectionId,
            roomId: item.roomId,
            itemId: item.itemId,
            type: item.type,
            fileName: item.fileName,
            downloadURL,
            contentType: item.contentType,
            createdAt: item.createdAt,
            synced: true
          });

          await offlineDB.media.update(item.id!, { synced: true });
        }
      } catch (error) {
        console.error("[Sync] Erro ao sincronizar item:", error);
      }
    }
    setSyncing(false);
  };

  const uploadToStorage = async (file: File, inspectionId: string, roomId: string, itemId: string): Promise<string | null> => {
    try {
      const storagePath = `inspections/${inspectionId}/${roomId}/${itemId}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, storagePath);
      const snapshot = await uploadBytes(storageRef, file);
      return await getDownloadURL(snapshot.ref);
    } catch (error) {
      console.error("[Storage] Erro no upload:", error);
      return null;
    }
  };

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
    if (!appUser) {
      setInspections([]);
      return;
    }
    const q = appUser.role === 'admin'
      ? query(collection(db, 'inspections'))
      : query(collection(db, 'inspections'), where('createdBy', '==', appUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Inspection));
      data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setInspections(data);
    }, (error) => handleFirestoreError(error, 'list', 'inspections'));
    return () => unsubscribe();
  }, [appUser]);

  useEffect(() => {
    if (!appUser) {
      setOwners([]);
      return;
    }
    const q = query(collection(db, 'owners'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Owner));
      setOwners(data);
    });
    return () => unsubscribe();
  }, [appUser]);

  useEffect(() => {
    if (!appUser) {
      setTenants([]);
      return;
    }
    const q = query(collection(db, 'tenants'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tenant));
      setTenants(data);
    });
    return () => unsubscribe();
  }, [appUser]);

  useEffect(() => {
    if (!appUser) {
      setProperties([]);
      return;
    }
    const q = query(collection(db, 'properties'), orderBy('address', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
      setProperties(data);
    }, (error) => handleFirestoreError(error, 'list' as any, 'properties'));
    return () => unsubscribe();
  }, [appUser]);

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

  useEffect(() => {
    if (selectedInspection) {
      setRoomMultipliers((selectedInspection as any).roomMultipliers || {});
      setItemMultipliers((selectedInspection as any).itemMultipliers || {});
    } else {
      setRoomMultipliers({});
      setItemMultipliers({});
    }
  }, [selectedInspection]);

  const saveRoomMultipliers = async (newMultipliers: Record<string, number>) => {
    if (selectedInspection) {
      try {
        await updateDoc(doc(db, 'inspections', selectedInspection.id), {
          roomMultipliers: newMultipliers
        });
        setSelectedInspection(prev => prev ? { ...prev, roomMultipliers: newMultipliers } as any : null);
      } catch (err) {
        console.error("Error saving room multipliers:", err);
      }
    }
  };

  const saveItemMultipliers = async (newMultipliers: Record<string, number>) => {
    if (selectedInspection) {
      try {
        await updateDoc(doc(db, 'inspections', selectedInspection.id), {
          itemMultipliers: newMultipliers
        });
        setSelectedInspection(prev => prev ? { ...prev, itemMultipliers: newMultipliers } as any : null);
      } catch (err) {
        console.error("Error saving item multipliers:", err);
      }
    }
  };

  useEffect(() => {
    if (!appUser) {
      setAppraisals([]);
      return;
    }
    const q = appUser.role === 'admin'
      ? query(collection(db, 'appraisals'))
      : query(collection(db, 'appraisals'), where('userId', '==', appUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appraisal));
      data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAppraisals(data);
    }, (error) => handleFirestoreError(error, 'list' as any, 'appraisals'));
    return () => unsubscribe();
  }, [appUser]);

  // --- ACTIONS ---
  const handleDeleteInspection = async (id: string) => {
    if (appUser?.role !== 'admin') {
      alert("Apenas administradores podem excluir vistorias.");
      return;
    }
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

  const handleCreateAppraisal = async (data: Partial<Appraisal>) => {
    try {
      setLoading(true);
      const docRef = await addDoc(collection(db, 'appraisals'), {
        ...data,
        userId: auth.currentUser?.uid || 'default_user',
        status: 'rascunho',
        createdAt: new Date().toISOString(),
        photos: [],
        videos: [],
      });
      setView('appraisal_list');
      return docRef.id;
    } catch (error) {
      console.error("Error creating appraisal:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAppraisal = async (id: string, data: Partial<Appraisal>) => {
    try {
      setLoading(true);
      
      // Recalcular valor final se a área do terreno ou área construída mudou
      const currentAppraisal = selectedAppraisal || (await getDoc(doc(db, 'appraisals', id))).data() as Appraisal;
      if (currentAppraisal?.meanValue) {
        const builtArea = data.propertyBuiltArea !== undefined ? data.propertyBuiltArea : (currentAppraisal.propertyBuiltArea || 0);
        const area = data.propertyArea !== undefined ? data.propertyArea : (currentAppraisal.propertyArea || 0);
        const isTerrainOnly = !builtArea || builtArea === 0;
        data.finalValue = currentAppraisal.meanValue * (isTerrainOnly ? area : builtArea);
      }

      await updateDoc(doc(db, 'appraisals', id), data);
      setView('appraisal_detail');
      // Refresh selected appraisal
      const updatedSnap = await getDoc(doc(db, 'appraisals', id));
      if (updatedSnap.exists()) {
        setSelectedAppraisal({ id: updatedSnap.id, ...updatedSnap.data() } as Appraisal);
      }
    } catch (error) {
      console.error("Error updating appraisal:", error);
      alert("Erro ao atualizar parecer.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSamples = async (appraisal: Appraisal) => {
    try {
      setReportProgress(10);
      setProgressMessage('Iniciando análise de mercado...');
      setLoading(true);
      
      setReportProgress(30);
      setProgressMessage('IA buscando amostras comparáveis...');
      
      const result = await generateAppraisalSamples(
        appraisal.propertyAddress,
        appraisal.propertyArea,
        appraisal.propertyBuiltArea,
        appraisal.propertyAge,
        appraisal.propertyConservation,
        appraisal.propertyCep,
        appraisal.propertyNumber
      );

      if (result.error) {
        alert(result.error);
        return;
      }

      setReportProgress(70);
      setProgressMessage('Processando valores e homogeneização...');

      const rawSamples = result.samples as AppraisalSample[];
      const isTerrainOnly = !appraisal.propertyBuiltArea || appraisal.propertyBuiltArea === 0;

      // Recalcular rigorosamente todos os valores de homogeneização do cliente para contornar qualquer alucinação matemática da IA
      const samples = rawSamples.map(sample => {
        const areaToUse = isTerrainOnly ? (sample.area || 1) : (sample.builtArea || sample.area || 1);
        const offerFact = parseFloat(sample.factors.offer as any) || 1;
        const locationFact = parseFloat(sample.factors.location as any) || 1;
        const areaFact = parseFloat(sample.factors.area as any) || 1;
        const standardFact = isTerrainOnly ? 1 : (parseFloat(sample.factors.standard as any) || 1);
        const ageFact = isTerrainOnly ? 1 : (parseFloat(sample.factors.age as any) || 1);
        const frontageFact = parseFloat(sample.factors.frontage as any) || 1;
        
        const homogenizedValue = (sample.offerPrice * 
          offerFact * 
          locationFact * 
          areaFact * 
          standardFact * 
          ageFact * 
          frontageFact
        ) / areaToUse;

        return {
          ...sample,
          factors: {
            offer: offerFact,
            location: locationFact,
            area: areaFact,
            standard: isTerrainOnly ? 1 : standardFact,
            age: isTerrainOnly ? 1 : ageFact,
            frontage: frontageFact
          },
          unitValue: Math.round((sample.offerPrice / areaToUse) * 100) / 100,
          homogenizedValue: Math.round(homogenizedValue * 100) / 100
        };
      });

      const values = samples.map(s => s.homogenizedValue);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const stdDev = Math.sqrt(values.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / values.length);
      const finalValue = mean * (isTerrainOnly ? appraisal.propertyArea : appraisal.propertyBuiltArea);

      setReportProgress(80);
      setProgressMessage('Atualizando Parecer Técnico de Comercialização com IA...');

      let technicalMarketingReport = appraisal.technicalMarketingReport || null;
      let quickFieldDiagnosis = appraisal.quickFieldDiagnosis || null;

      try {
        const qdezRes = await generateQdezMarketingDiagnosis(
          appraisal.propertyAddress,
          appraisal.propertyArea,
          appraisal.propertyBuiltArea,
          appraisal.propertyAge,
          appraisal.propertyConservation,
          appraisal.propertyDescription || 'Sem descrição específica',
          finalValue
        );

        if (qdezRes && !qdezRes.error) {
          technicalMarketingReport = qdezRes.technicalMarketingReport;
          quickFieldDiagnosis = qdezRes.quickFieldDiagnosis;
        } else if (qdezRes && qdezRes.error) {
          console.warn("Erro retornado do diagnóstico QDEZ:", qdezRes.error);
        }
      } catch (diagnosisError) {
        console.error("Erro ao gerar Parecer Técnico de Comercialização automático:", diagnosisError);
      }

      setReportProgress(90);
      setProgressMessage('Salvando parecer concluído...');

      const updateData: Partial<Appraisal> = {
        samples,
        meanValue: mean,
        stdDev,
        finalValue,
        status: 'concluido',
        technicalMarketingReport,
        quickFieldDiagnosis
      };

      await updateDoc(doc(db, 'appraisals', appraisal.id), updateData);

      setSelectedAppraisal(prev => prev ? { ...prev, ...updateData } : null);
      setReportProgress(100);
      setProgressMessage('Parecer gerado com sucesso!');
      setTimeout(() => {
        setReportProgress(0);
        setProgressMessage('');
      }, 1500);
    } catch (error) {
      console.error("Error generating samples:", error);
      alert("Erro ao gerar amostras com IA.");
      setReportProgress(0);
      setProgressMessage('');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReevaluation = async (appraisal: Appraisal) => {
    const confirmReeval = window.confirm(
      "Deseja solicitar uma reavaliação deste imóvel?\n\nO status do laudo retornará para rascunho para que você possa atualizar as informações cadastrais e re-gerar as amostras de mercado com os valores atualizados por IA."
    );
    if (!confirmReeval) return;

    try {
      setLoading(true);
      await updateDoc(doc(db, 'appraisals', appraisal.id), {
        status: 'rascunho'
      });
      setSelectedAppraisal(prev => prev ? { ...prev, status: 'rascunho' } : null);
      setView('appraisal_edit');
    } catch (error) {
      console.error("Error requesting reevaluation:", error);
      alert("Erro ao solicitar reavaliação do imóvel.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQdezDiagnosis = async (appraisal: Appraisal) => {
    try {
      setIsGeneratingQdez(true);
      setReportProgress(15);
      setProgressMessage('Consultando cartilha QDEZ & analisando dados...');
      
      const res = await generateQdezMarketingDiagnosis(
        appraisal.propertyAddress,
        appraisal.propertyArea,
        appraisal.propertyBuiltArea,
        appraisal.propertyAge,
        appraisal.propertyConservation,
        appraisal.propertyDescription || 'Sem descrição específica',
        appraisal.finalValue || 0
      );

      if (res.error) {
        alert(res.error);
        return;
      }

      setReportProgress(75);
      setProgressMessage('Atualizando cadastro do laudo imobiliário...');

      const updateData = {
        technicalMarketingReport: res.technicalMarketingReport,
        quickFieldDiagnosis: res.quickFieldDiagnosis
      };

      await updateDoc(doc(db, 'appraisals', appraisal.id), updateData);

      setSelectedAppraisal(prev => prev ? { ...prev, ...updateData } : null);
      
      setReportProgress(100);
      setProgressMessage('Diagnóstico QDEZ e Parecer Técnico preenchidos!');
      setTimeout(() => {
        setReportProgress(0);
        setProgressMessage('');
      }, 1800);
    } catch (error) {
      console.error("Error generating Qdez diagnosis:", error);
      alert("Erro ao preencher diagnóstico e parecer técnico automático.");
      setReportProgress(0);
      setProgressMessage('');
    } finally {
      setIsGeneratingQdez(false);
    }
  };

  const handleSaveFactors = async (updatedSamples: AppraisalSample[]) => {
    if (!selectedAppraisal) return;
    setLoading(true);
    try {
      const isTerrainOnly = !selectedAppraisal.propertyBuiltArea || selectedAppraisal.propertyBuiltArea === 0;

      // Recalculate homogenized value for each sample based on its updated factors
      const finalSamples = updatedSamples.map(sample => {
        const areaToUse = isTerrainOnly ? (sample.area || 1) : (sample.builtArea || sample.area || 1);
        const offerFact = parseFloat(sample.factors.offer as any) || 1;
        const locationFact = parseFloat(sample.factors.location as any) || 1;
        const areaFact = parseFloat(sample.factors.area as any) || 1;
        const standardFact = isTerrainOnly ? 1 : (parseFloat(sample.factors.standard as any) || 1);
        const ageFact = isTerrainOnly ? 1 : (parseFloat(sample.factors.age as any) || 1);
        const frontageFact = parseFloat(sample.factors.frontage as any) || 1;
        
        const homogenizedValue = (sample.offerPrice * 
          offerFact * 
          locationFact * 
          areaFact * 
          standardFact * 
          ageFact * 
          frontageFact
        ) / areaToUse;

        return {
          ...sample,
          factors: {
            offer: offerFact,
            location: locationFact,
            area: areaFact,
            standard: isTerrainOnly ? 1 : standardFact,
            age: isTerrainOnly ? 1 : ageFact,
            frontage: frontageFact
          },
          unitValue: Math.round((sample.offerPrice / areaToUse) * 100) / 100,
          homogenizedValue: Math.round(homogenizedValue * 100) / 100
        };
      });

      const values = finalSamples.map(s => s.homogenizedValue);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const stdDev = Math.sqrt(values.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / values.length);
      const finalValue = mean * (isTerrainOnly ? selectedAppraisal.propertyArea : selectedAppraisal.propertyBuiltArea);

      // Recalcular Parecer QDEZ com base no novo valor final
      let technicalMarketingReport = selectedAppraisal.technicalMarketingReport || null;
      let quickFieldDiagnosis = selectedAppraisal.quickFieldDiagnosis || null;
      
      try {
        const qdezRes = await generateQdezMarketingDiagnosis(
          selectedAppraisal.propertyAddress,
          selectedAppraisal.propertyArea,
          selectedAppraisal.propertyBuiltArea,
          selectedAppraisal.propertyAge,
          selectedAppraisal.propertyConservation,
          selectedAppraisal.propertyDescription || 'Sem descrição específica',
          finalValue
        );

        if (qdezRes && !qdezRes.error) {
          technicalMarketingReport = qdezRes.technicalMarketingReport;
          quickFieldDiagnosis = qdezRes.quickFieldDiagnosis;
        }
      } catch (diagnosisError) {
        console.error("Erro ao gerar Parecer QDEZ na atualização de fatores:", diagnosisError);
      }

      await updateDoc(doc(db, 'appraisals', selectedAppraisal.id), {
        samples: finalSamples,
        meanValue: mean,
        stdDev: stdDev,
        finalValue: finalValue,
        technicalMarketingReport,
        quickFieldDiagnosis
      });

      // Update local state
      setSelectedAppraisal(prev => prev ? { 
        ...prev, 
        samples: finalSamples, 
        meanValue: mean, 
        stdDev, 
        finalValue,
        technicalMarketingReport,
        quickFieldDiagnosis
      } : null);

      // Also update the appraisals list state so it syncs there
      setAppraisals(prev => prev.map(app => app.id === selectedAppraisal.id ? {
        ...app,
        samples: finalSamples,
        meanValue: mean,
        stdDev,
        finalValue,
        technicalMarketingReport,
        quickFieldDiagnosis
      } : app));

      alert("Fatores atualizados com sucesso! O laudo foi recalculado.");
      setIsEditingFactors(false);
    } catch (err: any) {
      console.error("Error updating factors:", err);
      alert(`Erro ao atualizar os fatores: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveContract = async (contractData: ExclusivityContract) => {
    if (!selectedAppraisal) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'appraisals', selectedAppraisal.id), {
        exclusivityContract: contractData
      });

      setSelectedAppraisal(prev => prev ? {
        ...prev,
        exclusivityContract: contractData
      } : null);

      setAppraisals(prev => prev.map(app => app.id === selectedAppraisal.id ? {
        ...app,
        exclusivityContract: contractData
      } : app));

      alert("Contrato de representação exclusiva salvo com sucesso!");
    } catch (err: any) {
      console.error("Error saving contract:", err);
      alert(`Erro ao salvar o contrato: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAppraisal = async (id: string) => {
    if (appUser?.role !== 'admin') {
      alert("Apenas administradores podem excluir pareceres de comercialização.");
      return;
    }
    if (!window.confirm("Deseja excluir este parecer permanentemente?")) return;
    try {
      await deleteDoc(doc(db, 'appraisals', id));
      if (selectedAppraisal?.id === id) setSelectedAppraisal(null);
      setView('appraisal_list');
    } catch (error) {
      console.error("Error deleting appraisal:", error);
    }
  };

  const handleAppraisalMediaUpload = async (e: React.ChangeEvent<HTMLInputElement> | Blob, type?: 'photo' | 'video') => {
    if (!selectedAppraisal) return;
    
    let files: (File | Blob)[] = [];
    if (e instanceof Blob) {
      files = [e];
    } else if (e.target instanceof HTMLInputElement && e.target.files) {
      files = Array.from(e.target.files);
    }

    if (files.length === 0) return;
    
    setLoading(true);
    setReportProgress(5);
    setProgressMessage('Iniciando envio de arquivos...');

    try {
      let currentFile = 0;
      const totalFiles = files.length;

      for (const file of files) {
        currentFile++;
        const baseProgress = 5 + Math.floor(((currentFile - 1) / totalFiles) * 85);
        setReportProgress(baseProgress);
        
        const isVideo = type === 'video' || (file instanceof File && file.type.startsWith('video/'));
        setProgressMessage(`Processando ${isVideo ? 'vídeo' : 'foto'} ${currentFile} de ${totalFiles}...`);
        
        // 1. Compression for photos
        let fileToUpload: File | Blob = file;
        if (!isVideo && file instanceof File) {
          setProgressMessage(`Otimizando foto ${currentFile} de ${totalFiles}...`);
          try {
            fileToUpload = await imageCompression(file, {
              maxSizeMB: 1,
              maxWidthOrHeight: 1920,
              useWebWorker: true
            });
          } catch (err) {
            console.error("Compression error:", err);
          }
        }

        const rawFileName = file instanceof File ? file.name : `capture_${Date.now()}.${isVideo ? 'webm' : 'jpg'}`;
        const sanitizedName = rawFileName.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
        const storagePath = `appraisals/${selectedAppraisal.id}/${Date.now()}_${sanitizedName}`;
        const storageRef = ref(storage, storagePath);
        
        setProgressMessage(`Enviando ${currentFile} de ${totalFiles}...`);
        console.log(`[Storage] Iniciando upload para: ${storagePath}`);
        await uploadBytes(storageRef, fileToUpload);
        
        setReportProgress(baseProgress + Math.floor(85 / totalFiles / 2));
        setProgressMessage(`Finalizando ${currentFile} de ${totalFiles}...`);

        const url = await getDownloadURL(storageRef);
        console.log(`[Storage] Upload concluído. URL: ${url}`);
        
        if (isVideo) {
          await updateDoc(doc(db, 'appraisals', selectedAppraisal.id), {
            videos: arrayUnion(url)
          });
        } else {
          await updateDoc(doc(db, 'appraisals', selectedAppraisal.id), {
            photos: arrayUnion(url)
          });
        }
      }
      
      setReportProgress(95);
      setProgressMessage('Atualizando dados do parecer...');

      // Refresh selected appraisal
      const updatedSnap = await getDoc(doc(db, 'appraisals', selectedAppraisal.id));
      if (updatedSnap.exists()) {
        setSelectedAppraisal({ id: updatedSnap.id, ...updatedSnap.data() } as Appraisal);
      }

      setReportProgress(100);
      setProgressMessage('Arquivos enviados com sucesso!');
      setTimeout(() => {
        setReportProgress(0);
        setProgressMessage('');
      }, 1500);
    } catch (error: any) {
      console.error("Error uploading appraisal media:", error);
      setReportProgress(0);
      setProgressMessage('');
      let errorMsg = "Erro ao enviar mídia.";
      if (error.code === 'storage/unauthorized') {
        errorMsg += " Sem permissão no Firebase Storage. Verifique as regras de segurança.";
      } else if (error.code === 'storage/quota-exceeded') {
        errorMsg += " Limite de armazenamento excedido.";
      } else if (error.code === 'storage/unknown') {
        errorMsg += " Erro desconhecido. Verifique se o Firebase Storage está ativado no console.";
      }
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeAppraisal = async () => {
    if (!selectedAppraisal || !selectedAppraisal.photos || selectedAppraisal.photos.length === 0) return;
    
    setIsAnalyzingAppraisal(true);
    setReportProgress(10);
    setProgressMessage('Preparando imagens para análise...');
    
    try {
      // Use the first photo for analysis (or could aggregate)
      const url = selectedAppraisal.photos[0];
      
      setReportProgress(30);
      setProgressMessage('Carregando foto do imóvel...');
      const base64 = await getBase64FromUrl(url);
      
      const propertyDetails = `Endereço: ${selectedAppraisal.propertyAddress}${selectedAppraisal.propertyNumber ? `, nº ${selectedAppraisal.propertyNumber}` : ''}${selectedAppraisal.propertyCep ? `, CEP: ${selectedAppraisal.propertyCep}` : ''}, Área: ${selectedAppraisal.propertyArea}m², Idade: ${selectedAppraisal.propertyAge} anos, Conservação declarada: ${selectedAppraisal.propertyConservation}`;
      const samplesSummary = selectedAppraisal.samples?.length > 0 
        ? selectedAppraisal.samples.map(s => `${s.description} (Vu: ${s.homogenizedValue})`).join('; ')
        : "Nenhuma amostra gerada ainda.";
      
      setReportProgress(50);
      setProgressMessage('IA analisando conservação e mercado...');
      const analysis = await analyzeAppraisalMedia(base64.data, base64.mimeType, propertyDetails, samplesSummary);
      
      if (analysis.startsWith('Erro')) {
        throw new Error(analysis);
      }
      
      setReportProgress(80);
      setProgressMessage('Atualizando parecer com análise...');
      await updateDoc(doc(db, 'appraisals', selectedAppraisal.id), {
        aiAnalysis: analysis
      });
      
      setSelectedAppraisal(prev => prev ? { ...prev, aiAnalysis: analysis } : null);
      setReportProgress(100);
      setProgressMessage('Análise concluída!');
      setTimeout(() => {
        setReportProgress(0);
        setProgressMessage('');
      }, 1500);
    } catch (error: any) {
      console.error("Error analyzing appraisal media:", error);
      alert(error?.message || "Erro na análise da IA.");
      setReportProgress(0);
      setProgressMessage('');
    } finally {
      setIsAnalyzingAppraisal(false);
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

    const analysisPromises = photosToProcess.map(async (url) => {
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
        
        // 2. Process Upload and wait for URL
        const downloadUrl = await handleProcessUpload(file, roomId, docRef.id, true);
        
        // 3. Trigger AI Analysis automatically
        if (downloadUrl) {
          await handleAnalyzeItem(docRef.id, roomId, downloadUrl, selectedRoom?.name);
        }
      } catch (err) {
        console.error("Error processing quick photo:", err);
      }
    });

    await Promise.all(analysisPromises);
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
        4. O orçamento DEVE ser baseado na tabela vigente SINAPI/SP e nos valores de mercado da região de Ribeirão Preto, SP. Minimizando o valor se houver divergências.
        5. Separe obrigatoriamente o valor de MATERIAL e MÃO DE OBRA para cada item.
        6. Apresente a FONTE do valor (nome da loja ou empresa de prestação de serviços).
        7. Classificar a responsabilidade seguindo RIGOROSAMENTE as seguintes diretrizes da Lei do Inquilinato:
           - REGRAS DE PINTURA (DANOS DO LOCATÁRIO vs ESTRUTURAIS):
             * Se identificar problemas de pintura, como sujeira, furos, riscos, manchas, marcas de móveis, rabiscos, descascados provocados pelo inquilino (responsabilidade do Locatário):
               Sempre orçar a pintura de TODO o ambiente/cômodo por completo (todas as paredes), nunca retoques parciais isolados. Sempre utilizar preços de pintura integral usando tintas paletas padrões de qualidade "standard".
             * Se houver sujeiras/furos de pintura (Locatário) combinados com problemas estruturais (responsabilidade do Locador, ex: infiltração, rachadura estrutural):
               Mesmo assim, deve-se orçar a pintura de todo o ambiente por completo (todas as paredes sob responsabilidade do Locatário) e APENAS mencionar os reparos estruturais de forma descritiva, sem colocar custo financeiro para eles (custo zero).
             * Reparos estruturais (responsabilidade do LOCADOR, ex: infiltrações, fissuras estruturais, problemas hidráulicos no teto, mofos por problemas estruturais):
               NUNCA devem ter custos orçados (materialCost = 0, laborCost = 0, totalCost = 0). Eles devem ser listados ou descritos textualmente de forma meramente informativa / apenas mencionar.

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
                  "item": "Pintura Completa do Ambiente",
                  "description": "Presença de manchas de gordura, furos de pregos não vedados e sujidade geral. Orçado pintura completa de todas as paredes com tintas de paletas padrões de qualidade standard.",
                  "responsibility": "Locatário",
                  "materialCost": 350.00,
                  "laborCost": 500.00,
                  "totalCost": 850.00,
                  "source": "SINAPI/SP - Pintura Látex Completa (Tinta Standard)"
                },
                {
                  "item": "Infiltração de parede",
                  "description": "Mencionado infiltração vinda do banheiro vizinho (reparo estrutural do locador). Isento de orçamento financeiro.",
                  "responsibility": "Locador",
                  "materialCost": 0.00,
                  "laborCost": 0.00,
                  "totalCost": 0.00,
                  "source": "Mencionamento Estrutural - Isento de Ônus Financeiro"
                }
              ]
            }
          ],
          "totalEstimatedCost": 850.00
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
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { 
          responseMimeType: "application/json",
          temperature: 0.1 // Even lower for more precision
        }
      });

      if (!response.text) {
        throw new Error("Resposta vazia da inteligência artificial.");
      }
      if (response.text.trim().startsWith("<!doctype") || response.text.trim().startsWith("<html")) {
        throw new Error("A API de Inteligência Artificial retornou uma resposta inválida em formato HTML. Verifique sua chave de acesso (API Key) nas configurações do AI Studio.");
      }

      const result = JSON.parse(response.text || '{}');
      setPdfComparisonResult({
        summary: result.summary || "Nenhuma divergência significativa encontrada.",
        rooms: result.rooms || [],
        totalEstimatedCost: result.totalEstimatedCost || result.totalCost || 0
      });
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
      
      const errorStr = String(errorMessage || "").toLowerCase();
      const isForbidden = errorStr.includes('403') || 
                          errorStr.includes('forbidden') || 
                          errorStr.includes('permission_denied') || 
                          errorStr.includes('proibido') || 
                          errorStr.includes('api_key') ||
                          errorStr.includes('api key') ||
                          errorStr.includes('unauthorized');
                          
      if (isForbidden) {
        errorMessage = "Acesso Negado (403/Proibido). A sua chave GEMINI_API_KEY no painel de Configurações do AI Studio (Settings > Secrets) está inválida ou ausente. Acesse Configurações > Secrets para cadastrá-la.";
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
      createdBy: auth.currentUser?.uid || 'unknown',
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

  const handleAddItem = async (name: string, roomId: string) => {
    if (!selectedInspection) return;
    
    const newItem = {
      roomId,
      inspectionId: selectedInspection.id,
      name: name.toUpperCase(),
      condition: 'Bom' as ConservationState,
      description: '',
      mediaStatus: 'idle' as MediaStatus,
      aiStatus: 'idle' as AIStatus,
      photos: [],
      videos: [],
      createdAt: new Date().toISOString(),
    };
    
    await addDoc(collection(db, `inspections/${selectedInspection.id}/rooms/${roomId}/items`), newItem);
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

  const handleProcessUpload = async (file: File, roomId: string, itemId: string, isNewItem: boolean = false): Promise<string | null> => {
    if (!selectedInspection) return null;
    
    let targetItemId = itemId;
    let itemRef: any = null;

    // If no itemId provided, create a new item for this media
    if (!targetItemId) {
      const isVideo = file.type.startsWith('video/');
      const newItem = {
        roomId,
        inspectionId: selectedInspection.id,
        name: `${isVideo ? 'VÍDEO' : 'FOTO'} ${new Date().toLocaleTimeString()}`,
        condition: 'Bom' as ConservationState,
        description: '',
        mediaStatus: 'preview_local' as MediaStatus,
        aiStatus: 'idle' as AIStatus,
        photos: [],
        videos: [],
        createdAt: new Date().toISOString(),
      };
      const docRef = await addDoc(collection(db, `inspections/${selectedInspection.id}/rooms/${roomId}/items`), newItem);
      targetItemId = docRef.id;
    }

    itemRef = doc(db, `inspections/${selectedInspection.id}/rooms/${roomId}/items`, targetItemId);
    const isVideo = file.type.startsWith('video/');
    
    // 1. Compression
    let fileToUpload: File | Blob = file;
    if (!isVideo) {
      try {
        fileToUpload = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true
        });
      } catch (err) {
        console.error("Compression error:", err);
      }
    }

    // 2. Offline First
    if (!isOnline) {
      console.log("[Offline] Salvando mídia localmente...");
      const localUrl = URL.createObjectURL(fileToUpload);
      
      await offlineDB.media.add({
        inspectionId: selectedInspection.id,
        roomId,
        itemId: targetItemId,
        type: isVideo ? 'video' : 'photo',
        file: fileToUpload,
        fileName: file.name,
        contentType: file.type,
        createdAt: new Date().toISOString(),
        synced: false
      });
      
      // Update item state for local feedback
      const itemSnap = await getDoc(itemRef);
      if (itemSnap.exists()) {
        const currentData = itemSnap.data() as any;
        const updatedPhotos = isVideo ? (currentData.photos || []) : [...(currentData.photos || []), localUrl];
        const updatedVideos = isVideo ? [...(currentData.videos || []), localUrl] : (currentData.videos || []);
        
        await updateDoc(itemRef, { 
          photos: updatedPhotos,
          videos: updatedVideos,
          mediaStatus: 'preview_local',
          localPreviewUrl: localUrl
        });
      }
      
      return null;
    }

    // 3. Online Upload
    try {
      await updateDoc(itemRef, { mediaStatus: 'uploading', uploadProgress: 0 });
      
      const url = await handleUploadMedia(fileToUpload as File, roomId, targetItemId, async (progress) => {
        if (Math.floor(progress) % 10 === 0) {
          await updateDoc(itemRef, { uploadProgress: progress });
        }
      }) as string;
      
      await updateDoc(itemRef, { 
        mediaStatus: 'uploaded',
        uploadProgress: 100,
        tempDownloadUrl: url
      });

      await updateDoc(itemRef, { mediaStatus: 'metadata_syncing' });
      
      const attachmentData = {
        inspectionId: selectedInspection.id,
        roomId: roomId,
        itemId: targetItemId,
        type: isVideo ? 'video' : 'photo',
        fileName: file.name,
        storagePath: `inspections/${selectedInspection.id}/${roomId}/${targetItemId}/${file.name}`,
        downloadURL: url,
        contentType: file.type,
        createdAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, 'mediaAttachments'), attachmentData);
      
      const itemSnap = await getDoc(itemRef);
      if (itemSnap.exists()) {
        const currentData = itemSnap.data() as any;
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

        // Trigger AI Analysis automatically for both photos and videos
        handleAnalyzeItem(targetItemId, roomId, url, selectedRoom?.description);
      }

      return url;
    } catch (error) {
      console.error("Upload error:", error);
      await updateDoc(itemRef, { mediaStatus: 'error' });
      return null;
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
      
      const itemData = itemSnap.data() as any;
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
      const response = await fetch(url, { 
        signal: controller.signal,
        cache: 'no-cache' // Force bypass cache to get fresh CORS headers
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            const base64 = reader.result.split(',')[1];
            resolve({ data: base64, mimeType: blob.type });
          } else {
            reject(new Error("Falha ao converter imagem para base64"));
          }
        };
        reader.onerror = () => reject(new Error("Erro na leitura do arquivo local"));
        reader.readAsDataURL(blob);
      });
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error("Tempo esgotado ao buscar imagem do Storage.");
      }
      throw err;
    }
  };

  const handleAnalyzeItem = async (itemId: string, roomId: string, imageUrl: string, roomDescription?: string) => {
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
        aiStatus: 'analyzing',
        aiError: deleteField()
      });

      let base64Result;
      try {
        base64Result = await getBase64FromUrl(imageUrl);
      } catch (fetchErr: any) {
        console.error(`[MEDIA] Erro ao buscar imagem para análise: ${itemId}`, fetchErr);
        await updateDoc(itemRef, { 
          aiStatus: 'error',
          aiError: "Erro ao acessar arquivo no Firebase Storage. Verifique as regras de CORS.",
          mediaStatus: 'ready_for_analysis'
        });
        return;
      }

      const { data, mimeType } = base64Result;
      const result = await analyzeRoomMedia(data, mimeType, roomDescription || selectedRoom?.description, selectedInspection.type);

      if (result && !result.error) {
        console.log(`[MEDIA] analysis success: ${itemId}`);
        const finalSnap = await getDoc(itemRef);
        if (finalSnap.exists()) {
          await updateDoc(itemRef, { 
            aiAnalysis: result,
            condition: result.conservationState,
            description: result.technicalDescription,
            audioTranscription: result.audioTranscription || '',
            aiStatus: 'analyzed',
            mediaStatus: 'ready_for_analysis',
            aiError: deleteField()
          });
          // [MEDIA] final visual state = analyzed
          console.log(`[MEDIA] final visual state = analyzed`);
        }
      } else {
        const errorMsg = result?.error || "Análise retornou nula ou inválida";
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      // [MEDIA] analysis failed
      console.error(`[MEDIA] analysis failed: ${itemId}`, error);
      try {
        const finalSnap = await getDoc(itemRef);
        if (finalSnap.exists()) {
          await updateDoc(itemRef, { 
            aiStatus: 'error',
            aiError: error?.message || "Erro na análise da IA",
            mediaStatus: 'ready_for_analysis'
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
    setReportProgress(5);
    setProgressMessage('Iniciando análise em lote...');
    console.log(`[IA] Iniciando análise em lote para a vistoria: ${selectedInspection.id}`);
    
    try {
      // 1. Buscar todos os ambientes da vistoria
      const roomsSnap = await getDocs(collection(db, `inspections/${selectedInspection.id}/rooms`));
      const totalRooms = roomsSnap.docs.length;
      let processedRooms = 0;

      for (const roomDoc of roomsSnap.docs) {
        processedRooms++;
        const roomId = roomDoc.id;
        const roomName = roomDoc.data().name;
        
        setProgressMessage(`Analisando ambiente: ${roomName}...`);
        setReportProgress(5 + Math.floor((processedRooms / totalRooms) * 90));

        // 2. Buscar todos os itens de cada ambiente
        const itemsSnap = await getDocs(collection(db, `inspections/${selectedInspection.id}/rooms/${roomId}/items`));
        
        for (const itemDoc of itemsSnap.docs) {
          const item = itemDoc.data() as Item;
          const itemId = itemDoc.id;
          
          // Só analisar se for foto/vídeo e ainda não tiver sido analisado (ou se falhou)
          const isPhoto = item.photos && item.photos.length > 0;
          const isVideo = item.videos && item.videos.length > 0;
          const needsAnalysis = item.aiStatus !== 'analyzed';
          
          if ((isPhoto || isVideo) && needsAnalysis) {
            console.log(`[IA] Analisando item: ${item.name} (${itemId})`);
            // Usar a primeira mídia (foto ou vídeo) para análise
            const mediaUrl = isPhoto ? item.photos[0] : item.videos[0];
            await handleAnalyzeItem(itemId, roomId, mediaUrl, roomDoc.data().description);
            // Pequeno delay para evitar rate limit se necessário
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }
      setReportProgress(100);
      setProgressMessage('Análise em lote concluída!');
      setTimeout(() => {
        setReportProgress(0);
        setProgressMessage('');
      }, 1500);
      console.log(`[IA] Análise em lote concluída.`);
    } catch (error) {
      console.error(`[IA] Erro na análise em lote:`, error);
      alert("Ocorreu um erro ao processar a análise em lote.");
      setReportProgress(0);
      setProgressMessage('');
    } finally {
      setIsAnalyzingAll(false);
    }
  };

  const generateAppraisalPDF = async (appraisal: Appraisal, print: boolean = false) => {
    try {
      if (typeof autoTable !== 'function') {
        throw new Error("Biblioteca de tabelas (autoTable) não encontrada.");
      }
      setIsGeneratingPDF(true);
      setReportProgress(10);
      setProgressMessage('Iniciando criação do PDF...');
      
      const doc = new jsPDF();
      const startY = drawPDFHeader(doc, 'Parecer de Comercialização');

      setReportProgress(20);
      setProgressMessage('Processando dados do solicitante e imóvel...');

    // 1. Requester Info
    doc.setFontSize(14);
    doc.setTextColor(BRAND_STONE_DARK[0], BRAND_STONE_DARK[1], BRAND_STONE_DARK[2]);
    doc.setFont(undefined, 'bold');
    doc.text('1. Dados do Solicitante', 20, startY + 10);

    const requesterData = [
      ['Nome:', appraisal.requesterName],
      ['CPF/CNPJ:', appraisal.requesterDocument],
      ['Email:', appraisal.requesterEmail],
      ['Celular:', appraisal.requesterPhone],
    ];

    autoTable(doc, {
      startY: startY + 15,
      body: requesterData,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3, lineColor: [230, 225, 220], lineWidth: 0.1 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45, fillColor: [248, 248, 248] } },
      margin: { left: 20, right: 20 }
    });

    const propY = ((doc as any).lastAutoTable?.finalY || startY + 50) + 10;

    // 2. Property Info
    doc.setFontSize(14);
    doc.setTextColor(BRAND_STONE_DARK[0], BRAND_STONE_DARK[1], BRAND_STONE_DARK[2]);
    doc.setFont(undefined, 'bold');
    doc.text('2. Identificação do Imóvel Avaliando', 20, propY);

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(BRAND_STONE_LIGHT[0], BRAND_STONE_LIGHT[1], BRAND_STONE_LIGHT[2]);
    
    const propertyData = [
      ['Endereço:', appraisal.propertyAddress],
      ['CEP:', appraisal.propertyCep || '-'],
      ['Descrição:', appraisal.propertyDescription || 'N/A'],
      ['Área Terreno:', `${appraisal.propertyArea} m²`],
      ['Área Construída:', `${appraisal.propertyBuiltArea} m²`],
      ['Idade:', `${appraisal.propertyAge} anos`],
      ['Conservação:', appraisal.propertyConservation],
    ];

    autoTable(doc, {
      startY: propY + 5,
      body: propertyData,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3, lineColor: [230, 225, 220], lineWidth: 0.1 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45, fillColor: [248, 248, 248] } },
      margin: { left: 20, right: 20 }
    });

    let currentY = ((doc as any).lastAutoTable?.finalY || propY + 50) + 15;

    // 3. Market Samples
    doc.setFontSize(14);
    doc.setTextColor(BRAND_STONE_DARK[0], BRAND_STONE_DARK[1], BRAND_STONE_DARK[2]);
    doc.setFont(undefined, 'bold');
    doc.text('3. Amostras de Mercado (NBR-14653)', 20, currentY);

    const isTerrainOnlyPDF = !appraisal.propertyBuiltArea || appraisal.propertyBuiltArea === 0;
    const sampleRows = (appraisal.samples || []).map((s, i) => {
      const areaToPrint = isTerrainOnlyPDF ? (s.area || 0) : (s.builtArea || s.area || 0);
      const factorsStr = s.factors 
        ? (isTerrainOnlyPDF 
          ? `O:${s.factors.offer || 1} L:${s.factors.location || 1} A:${(s.factors.area || 1).toFixed(2)} F:${(s.factors.frontage || 1).toFixed(2)}`
          : `O:${s.factors.offer || 1} L:${s.factors.location || 1} A:${(s.factors.area || 1).toFixed(2)} P:${s.factors.standard || 1} I:${s.factors.age || 1} F:${(s.factors.frontage || 1).toFixed(2)}`)
        : '-';
      
      return [
        `E${i + 1}`,
        s.description || '-',
        `${areaToPrint} m²`,
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(s.offerPrice || 0),
        factorsStr,
        s.sourceUrl || '-',
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(s.homogenizedValue || 0)
      ];
    });

    autoTable(doc, {
      startY: currentY + 5,
      head: [['ID', 'Descrição', 'Área', 'V. Oferta', 'Fatores', 'Fonte', 'V. Homog.']],
      body: sampleRows,
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 2, overflow: 'linebreak' },
      headStyles: { fillColor: BRAND_RED as [number, number, number], textColor: 255, halign: 'center' },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' }, // ID
        1: { cellWidth: 45 }, // Descrição (compacted to prevent right-edge overflow)
        2: { cellWidth: 12, halign: 'center' }, // Área
        3: { cellWidth: 20, halign: 'right' }, // V. Oferta
        4: { cellWidth: 33, fontSize: 5.5 }, // Fatores (smaller font to save space)
        5: { cellWidth: 32, fontSize: 5.5 }, // Fonte (smaller font for URLs)
        6: { cellWidth: 20, halign: 'right' } // V. Homog.
      },
      margin: { left: 20, right: 20 }
    });

    currentY = ((doc as any).lastAutoTable?.finalY || currentY + 60) + 15;

      setReportProgress(40);
      setProgressMessage('Calculando resultado da avaliação...');

      // 4. Resultado da Avaliação
      const isTerrainOnly = !appraisal.propertyBuiltArea || appraisal.propertyBuiltArea === 0;
      const areaToUse = isTerrainOnly ? (appraisal.propertyArea || 1) : (appraisal.propertyBuiltArea || 1);
      const finalVal = appraisal.finalValue || ((appraisal.meanValue || 0) * areaToUse);
      const meanVal = appraisal.meanValue || (finalVal / areaToUse);

      if (currentY > 210) {
        doc.addPage();
        currentY = drawPDFHeader(doc, 'Parecer de Comercialização');
      }

      // Professional result box
      doc.setFillColor(252, 243, 243); // Very light red
      doc.setDrawColor(BRAND_RED[0], BRAND_RED[1], BRAND_RED[2]);
      doc.setLineWidth(1);
      doc.roundedRect(20, currentY, 170, 52, 3, 3, 'FD');
      
      doc.setFontSize(14);
      doc.setTextColor(BRAND_RED[0], BRAND_RED[1], BRAND_RED[2]);
      doc.setFont(undefined, 'bold');
      doc.text('4. Resultado da Avaliação', 30, currentY + 12);
      
      doc.setDrawColor(BRAND_RED[0], BRAND_RED[1], BRAND_RED[2], 0.2);
      doc.setLineWidth(0.2);
      doc.line(30, currentY + 16, 180, currentY + 16);

      doc.setFontSize(11);
      doc.setTextColor(BRAND_STONE_DARK[0], BRAND_STONE_DARK[1], BRAND_STONE_DARK[2]);
      doc.setFont(undefined, 'normal');
      doc.text(`Valor Unitário Médio:`, 30, currentY + 25);
      doc.setFont(undefined, 'bold');
      doc.text(`${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(meanVal)}/m²${isTerrainOnly ? ' de Terreno' : ''}`, 100, currentY + 25);

      doc.setFont(undefined, 'normal');
      doc.text(isTerrainOnly ? `Área do Terreno:` : `Área Construída:`, 30, currentY + 33);
      doc.setFont(undefined, 'bold');
      doc.text(`${areaToUse} m²`, 100, currentY + 33);

      doc.setFillColor(BRAND_RED[0], BRAND_RED[1], BRAND_RED[2]);
      doc.rect(20, currentY + 40, 170, 12, 'F');
      
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.setFont(undefined, 'bold');
      doc.text(`VALOR DE MERCADO:`, 30, currentY + 48);
      doc.text(`${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(finalVal)}`, 180, currentY + 48, { align: 'right' });

      currentY += 65;

      // 5. AI Analysis (if exists)
      if (appraisal.aiAnalysis) {
        if (currentY > 210) {
          doc.addPage();
          drawPDFHeader(doc, 'Parecer de Comercialização');
          currentY = 70;
        }
        
        doc.setFontSize(14);
        doc.setTextColor(BRAND_STONE_DARK[0], BRAND_STONE_DARK[1], BRAND_STONE_DARK[2]);
        doc.setFont(undefined, 'bold');
        doc.text('5. Análise IA de Conservação e Mercado', 20, currentY);
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(50, 50, 50);
        
        const splitAnalysis = doc.splitTextToSize(appraisal.aiAnalysis, 170);
        let analysisY = currentY + 10;
        
        splitAnalysis.forEach((line: string) => {
          if (analysisY > 275) {
            doc.addPage();
            drawPDFHeader(doc, 'Parecer de Comercialização');
            analysisY = 70;
          }
          doc.text(line, 20, analysisY);
          analysisY += 5.5;
        });
        
        currentY = analysisY + 10;
      }

      // 6. Parecer Técnico de Comercialização & Captação (QDEZ)
      if (appraisal.technicalMarketingReport) {
        if (currentY > 210) {
          doc.addPage();
          drawPDFHeader(doc, 'Parecer de Comercialização');
          currentY = 70;
        }
        
        doc.setFontSize(14);
        doc.setTextColor(BRAND_RED[0], BRAND_RED[1], BRAND_RED[2]);
        doc.setFont(undefined, 'bold');
        doc.text('6. Parecer Técnico de Comercialização & Captação', 20, currentY);
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(50, 50, 50);
        
        const splitMarketingReport = doc.splitTextToSize(appraisal.technicalMarketingReport, 170);
        let reportY = currentY + 10;
        
        splitMarketingReport.forEach((line: string) => {
          if (reportY > 275) {
            doc.addPage();
            drawPDFHeader(doc, 'Parecer de Comercialização');
            reportY = 70;
          }
          doc.text(line, 20, reportY);
          reportY += 5.5;
        });
        
        currentY = reportY + 10;
      }

      // 7. Diagnóstico Rápido de Campo (QDEZ)
      if (appraisal.quickFieldDiagnosis) {
        if (currentY > 190) {
          doc.addPage();
          drawPDFHeader(doc, 'Parecer de Comercialização');
          currentY = 70;
        }
        
        doc.setFontSize(14);
        doc.setTextColor(BRAND_RED[0], BRAND_RED[1], BRAND_RED[2]);
        doc.setFont(undefined, 'bold');
        doc.text('7. Diagnóstico Rápido de Campo QDEZ', 20, currentY);
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(50, 50, 50);
        
        let diagY = currentY + 10;
        
        // Occupancy type
        doc.setFont(undefined, 'bold');
        doc.text(`Situação de Ocupação Atual: `, 20, diagY);
        doc.setFont(undefined, 'normal');
        doc.text(`${appraisal.quickFieldDiagnosis.occupancyType}`, 75, diagY);
        diagY += 10;
        
        // Valuation Items
        doc.setFont(undefined, 'bold');
        doc.text('Itens de Valorização Urbana / Diferenciais:', 20, diagY);
        diagY += 7;
        doc.setFont(undefined, 'normal');
        appraisal.quickFieldDiagnosis.valuationItems.forEach(item => {
          const splitItem = doc.splitTextToSize(`• ${item}`, 165);
          splitItem.forEach((line: string) => {
            if (diagY > 272) {
              doc.addPage();
              drawPDFHeader(doc, 'Parecer de Comercialização');
              diagY = 70;
            }
            doc.text(line, 25, diagY);
            diagY += 5;
          });
          diagY += 1.5;
        });
        diagY += 2;

        // Attention Points
        if (diagY > 260) {
          doc.addPage();
          drawPDFHeader(doc, 'Parecer de Comercialização');
          diagY = 70;
        }
        doc.setFont(undefined, 'bold');
        doc.text('Pontos de Atenção / Preparação Técnica:', 20, diagY);
        diagY += 7;
        doc.setFont(undefined, 'normal');
        appraisal.quickFieldDiagnosis.attentionPoints.forEach(item => {
          const splitItem = doc.splitTextToSize(`[!] ${item}`, 165);
          splitItem.forEach((line: string) => {
            if (diagY > 272) {
              doc.addPage();
              drawPDFHeader(doc, 'Parecer de Comercialização');
              diagY = 70;
            }
            doc.text(line, 25, diagY);
            diagY += 5;
          });
          diagY += 1.5;
        });
        diagY += 2;

        // Exclusivity strategy
        if (diagY > 230) {
          doc.addPage();
          drawPDFHeader(doc, 'Parecer de Comercialização');
          diagY = 70;
        }
        doc.setFont(undefined, 'bold');
        doc.text('Abordagem de Representação Exclusiva (Roteiro Consultivo):', 20, diagY);
        diagY += 7;
        doc.setFont(undefined, 'italic');
        const splitExcl = doc.splitTextToSize(`"${appraisal.quickFieldDiagnosis.recommendedExclusivityStrategy}"`, 170);
        splitExcl.forEach((line: string) => {
          if (diagY > 272) {
            doc.addPage();
            drawPDFHeader(doc, 'Parecer de Comercialização');
            diagY = 70;
          }
          doc.text(line, 20, diagY);
          diagY += 5;
        });
        diagY += 4;

        // Launch channels
        if (diagY > 230) {
          doc.addPage();
          drawPDFHeader(doc, 'Parecer de Comercialização');
          diagY = 70;
        }
        doc.setFont(undefined, 'bold');
        doc.text('Plano de Lançamento & Canais de Captação Qualificada:', 20, diagY);
        diagY += 7;
        doc.setFont(undefined, 'normal');
        appraisal.quickFieldDiagnosis.marketingLaunchChannels.forEach(item => {
          const splitItem = doc.splitTextToSize(`- ${item}`, 165);
          splitItem.forEach((line: string) => {
            if (diagY > 272) {
              doc.addPage();
              drawPDFHeader(doc, 'Parecer de Comercialização');
              diagY = 70;
            }
            doc.text(line, 25, diagY);
            diagY += 5;
          });
          diagY += 1.5;
        });
        
        currentY = diagY + 10;
      }

      // 8. Photos Section
      if (appraisal.photos && appraisal.photos.length > 0) {
        setReportProgress(60);
        setProgressMessage('Processando anexo fotográfico...');
        
        doc.addPage();
        drawPDFHeader(doc, 'Anexo Fotográfico');
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'bold');
        doc.text('Registro Fotográfico', 20, 40);

        let photoY = 50;
        const totalPhotos = appraisal.photos.length;
        for (let i = 0; i < appraisal.photos.length; i++) {
          setProgressMessage(`Adicionando foto ${i + 1} de ${totalPhotos}...`);
          setReportProgress(60 + Math.floor((i / totalPhotos) * 30));

          if (photoY > 230) {
            doc.addPage();
            drawPDFHeader(doc, 'Anexo Fotográfico');
            photoY = 40;
          }
          try {
            const imgData = await getBase64FromUrl(appraisal.photos[i]);
            if (imgData && imgData.data) {
              doc.addImage(imgData.data, 'JPEG', 20, photoY, 80, 60);
            }
            
            if (i + 1 < appraisal.photos.length) {
              const imgData2 = await getBase64FromUrl(appraisal.photos[i+1]);
              if (imgData2 && imgData2.data) {
                doc.addImage(imgData2.data, 'JPEG', 110, photoY, 80, 60);
              }
              i++;
            }
            photoY += 70;
          } catch (e) {
            console.error("Error adding photo to PDF", e);
            // Continue to next photos if one fails
            photoY += 70; 
          }
        }
      }

    // 6. Signature Section
    setReportProgress(95);
    setProgressMessage('Finalizando documento...');
    doc.addPage();
    drawPDFHeader(doc, 'Encerramento');
    const signY = 100;
    
    doc.setDrawColor(200);
    doc.line(20, signY, 90, signY);
    doc.line(110, signY, 180, signY);

    doc.setFontSize(10);
    doc.setTextColor(BRAND_STONE_DARK[0], BRAND_STONE_DARK[1], BRAND_STONE_DARK[2]);
    doc.text(appraisal.requesterName, 55, signY + 5, { align: 'center' });
    doc.text('Solicitante', 55, signY + 10, { align: 'center' });

    doc.text(appraisal.appraiserName, 145, signY + 5, { align: 'center' });
    doc.text(`Corretor / Avaliador - CRECI: ${appraisal.appraiserCreci}`, 145, signY + 10, { align: 'center' });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Página ${i} de ${pageCount} - Q.DEZ IMÓVEIS - Parecer Técnico de Avaliação Mercadológica`, 105, 285, { align: 'center' });
    }

    if (print) {
      doc.autoPrint();
      const hRef = doc.output('bloburl');
      const printWindow = window.open(hRef, '_blank');
      if (!printWindow) {
        alert("O bloqueador de pop-ups impediu a abertura da janela de impressão. Por favor, autorize pop-ups para este site.");
      }
    } else {
      doc.save(`Parecer_${appraisal.propertyAddress.substring(0, 20)}.pdf`);
    }
    
    setReportProgress(100);
    setProgressMessage('PDF concluído!');
    setTimeout(() => {
      setReportProgress(0);
      setProgressMessage('');
    }, 1500);
    } catch (error: any) {
      console.error("Erro ao gerar PDF:", error);
      alert(`Ocorreu um erro ao gerar o PDF: ${error?.message || 'Erro desconhecido'}. Verifique se os dados estão completos e se as imagens foram carregadas.`);
      setReportProgress(0);
      setProgressMessage('');
    } finally {
    setIsGeneratingPDF(false);
  }
};

  const generateExclusivityContractPDF = async (appraisal: Appraisal, contract: ExclusivityContract, print: boolean = false) => {
    try {
      if (typeof autoTable !== 'function') {
        throw new Error("Biblioteca de tabelas (autoTable) não encontrada.");
      }
      setIsGeneratingPDF(true);
      setReportProgress(10);
      setProgressMessage('Iniciando contrato...');

      const doc = new jsPDF();
      
      // PAGE 1: COVER
      let startY = drawPDFHeader(doc, 'Contrato de Representação Exclusiva');
      
      doc.setFontSize(14);
      doc.setTextColor(BRAND_RED[0], BRAND_RED[1], BRAND_RED[2]);
      doc.setFont(undefined, 'bold');
      doc.text('CONTRATO DE REPRESENTAÇÃO EXCLUSIVA', 20, startY + 12);
      doc.text('PARA VENDA OU LOCAÇÃO DE IMÓVEL', 20, startY + 18);

      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);
      doc.setFont(undefined, 'bold');
      doc.text('Seu imóvel não será apenas anunciado. Será representado com estratégia, proteção e responsabilidade.', 20, startY + 28);

      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      const introText = "Modelo profissional inspirado nas melhores práticas de representação exclusiva e estruturado com base no contrato-padrão do Sistema COFECI-CRECI, na contratação escrita de corretagem e em práticas de gestão comercial imobiliária.";
      const splitIntroText = doc.splitTextToSize(introText, 170);
      doc.text(splitIntroText, 20, startY + 33);

      // Core Summary Table on Cover Page
      const coverTableData = [
        ['Contratante / Proprietário:', contract.ownerName],
        ['Imóvel:', contract.address],
        ['Corretor Responsável:', `${contract.brokerName} (CRECI: ${contract.brokerCreci})`],
        ['Data do Instrumento:', contract.localDate || new Date().toLocaleDateString('pt-BR')]
      ];

      autoTable(doc, {
        startY: startY + 45,
        body: coverTableData,
        theme: 'grid',
        styles: { fontSize: 8.5, cellPadding: 3.5, lineColor: [220, 215, 210], lineWidth: 0.1 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45, fillColor: [250, 248, 245] } },
        margin: { left: 20, right: 20 }
      });

      const coverEndNewY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(8);
      doc.setTextColor(110, 105, 100);
      const coverNotice = "IMPORTANTE: este documento é um modelo operacional. Antes do uso definitivo, recomenda-se validação por advogado de confiança e conferência pelo CRECI competente, especialmente quanto a dados da imobiliária, percentuais de honorários, forma de assinatura e adequação ao caso concreto.";
      const splitNotice = doc.splitTextToSize(coverNotice, 170);
      doc.text(splitNotice, 20, coverEndNewY);

      // PAGE 2: QUADRO RESUMO (TABLE)
      doc.addPage();
      drawPDFHeader(doc, 'Quadro-Resumo da Contratação');
      
      const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
      };

      const fallbackPhone = contract.qdezPhone || '1635071010';
      const fallbackEmail = contract.qdezEmail || 'atendimento@qdez.com.br';
      const fallbackAddress = contract.qdezAddress || 'Avenida Benjamin Constant 534 - Centro - Jaboticabal/SP - CEP 14870-140';
      const fallbackCorporateName = contract.qdezCorporateName || 'Qdez Negócios Imobiliários Ltdsa.';
      const fallbackCNPJ = contract.qdezCnpj || '35.798.476/0001-02';
      const fallbackCreci = contract.qdezCreci || '34873-J';

      const tableRows = [
        ['Tipo de Representação:', contract.representationType === 'venda' ? 'Venda' : contract.representationType === 'locacao' ? 'Locação' : 'Venda & Locação'],
        ['Endereço Completo:', contract.address],
        ['Matrícula / Cartório:', `Matrícula nº ${contract.registryNumber} do ${contract.registryOffice} de ${contract.registryCity}`],
        ['Proprietário / Contratante:', `${contract.ownerName} | CPF/CNPJ: ${contract.ownerCpfCnpj}`],
        ['Contatos Proprietário:', `Tel: ${contract.ownerPhone} | E-mail: ${contract.ownerEmail}`],
        ['CONTRATADA (Imobiliária):', `${fallbackCorporateName} | CNPJ: ${fallbackCNPJ} | CRECI: ${fallbackCreci}\nEndereço: ${fallbackAddress}\nContato: ${fallbackPhone} | E-mail: ${fallbackEmail}`],
        ['Corretor Responsável:', `${contract.brokerName} | CRECI: ${contract.brokerCreci}`],
        ['Valor de Oferta (Venda):', contract.representationType !== 'locacao' ? `${formatCurrency(contract.salePrice)} (${contract.salePriceWords})` : 'N/A'],
        ['Valor de Oferta (Locação):', contract.representationType !== 'venda' ? `${formatCurrency(contract.rentPrice)} mensais` : 'N/A'],
        ['Honorários de Corretagem:', `Venda: ${contract.commissionPercentVenda}% sobre o valor total | Locação: ${contract.commissionRent}`],
        ['Exclusividade:', `${contract.exclusivityDays} dias | Início: ${contract.startDate} | Término: ${contract.endDate}`],
        ['Canais de Divulgação:', contract.authorizedMedia.join(', ')],
        ['Controle das Chaves:', contract.keySituation === 'outro' ? contract.keySituationOther : contract.keySituation],
        ['Ocupação Atual:', contract.occupancyStatus === 'outro' ? contract.occupancyStatusOther : contract.occupancyStatus],
      ];

      autoTable(doc, {
        startY: 70,
        body: tableRows,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 3, lineColor: [220, 215, 210], lineWidth: 0.1 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50, fillColor: [248, 245, 242] } },
        margin: { left: 20, right: 20 }
      });

      // PAGE 3: CONTRATO (CLAUSES)
      doc.addPage();
      drawPDFHeader(doc, 'Instrumento de Contrato');
      
      doc.setFontSize(11);
      doc.setTextColor(BRAND_RED[0], BRAND_RED[1], BRAND_RED[2]);
      doc.setFont(undefined, 'bold');
      doc.text('3. Termos do Contrato de Representação Exclusiva', 20, 70);
      
      doc.setFontSize(8);
      doc.setTextColor(50, 50, 50);
      doc.setFont(undefined, 'normal');
      
      let cy = 76;
      const printParagraph = (title: string, content: string) => {
        if (cy > 255) {
          doc.addPage();
          drawPDFHeader(doc, 'Instrumento de Contrato');
          cy = 70;
        }
        doc.setFont(undefined, 'bold');
        doc.text(title, 20, cy);
        cy += 4;
        
        doc.setFont(undefined, 'normal');
        const splitText = doc.splitTextToSize(content, 170);
        splitText.forEach((line: string) => {
          if (cy > 270) {
            doc.addPage();
            drawPDFHeader(doc, 'Instrumento de Contrato');
            cy = 70;
          }
          doc.text(line, 20, cy);
          cy += 3.5;
        });
        cy += 2;
      };

      printParagraph(
        '3.1. Partes',
        `CONTRATANTE: ${contract.ownerName}, CPF/CNPJ: ${contract.ownerCpfCnpj}, Tel: ${contract.ownerPhone}, doravante denominado simplesmente Proprietário.\nCONTRATADA: ${fallbackCorporateName}, inscrita no CNPJ sob nº ${fallbackCNPJ} e CRECI PJ nº ${fallbackCreci}, estabelecida na ${fallbackAddress}, Contato: ${fallbackPhone}, E-mail: ${fallbackEmail}, sob responsabilidade do corretor ${contract.brokerName} (CRECI: ${contract.brokerCreci}), doravante denominado Corretor.`
      );

      printParagraph(
        '3.2. Objeto',
        'O objeto deste contrato é a representação comercial com exclusividade da CONTRATADA para intermediar a venda e/ou locação do imóvel descrito no quadro-resumo, incluindo análise profunda de mercado, estratégia de posicionamento, divulgação qualificada, visitas monitoradas e acompanhamento jurídica até a conclusão do negócio.'
      );

      printParagraph(
        '3.3. Exclusividade',
        'O CONTRATANTE confere à CONTRATADA exclusividade absoluta para representação comercial do imóvel pelo prazo estabelecido. Compromete-se a não anunciar por outros meios, não contratar outros intermediários e nem realizar negociações diretas sem participação da CONTRATADA.'
      );

      printParagraph(
        '3.4. Preço e Autorização para Recebimento de Propostas',
        `O preço pretendido inicial do imóvel é aquele constante no quadro-resumo. Qualquer alteração ou aceitação de proposta diferente desta autorização formal deverão ser ratificadas em comum acordo pelas partes.`
      );

      printParagraph(
        '3.5. Honorários de Intermediação',
        `Ficam pactuados os honorários previstos no quadro-resumo. Os honorários serão integralmente devidos caso o negócio venha a se realizar no prazo deste contrato (mesmo que por terceiros), ou após o vencimento com compradores inscritos e apresentados pelo corretor.`
      );

      // PAGE 4: OBRIGACOES E ASSINATURAS
      doc.addPage();
      drawPDFHeader(doc, 'Obrigações e Assinaturas');
      cy = 70;

      printParagraph(
        '3.6. Obrigações da QDEZ Imóveis',
        'Atuar com máxima lealdade e zelo profissional de acordo com as normas da NBR-14653 e COFECI-CRECI; promover marketing multicanal ativo; qualificar interessados; apresentar propostas formais e realizar relatórios de progresso.'
      );

      printParagraph(
        '3.7. Obrigações do Proprietário',
        'Prestar informações verdadeiras e fidedignas sobre a documentação e conservação do imóvel; autorizar visitas agendadas; repassar contatos diretos para o Corretor e adimplir pontualmente os honorários devidos sobre o negócio fechado.'
      );

      printParagraph(
        '3.8. Foro Competente',
        `Fica eleito o foro da comarca de ${contract.forumCity || 'São Paulo'} - ${contract.forumState || 'SP'} para dirimir controvérsias decorrentes deste negócio.`
      );

      cy += 5;
      if (cy > 190) {
        doc.addPage();
        drawPDFHeader(doc, 'Obrigações e Assinaturas');
        cy = 70;
      }

      // Local e data
      doc.setFont(undefined, 'bold');
      doc.text(`Local e Data: ${contract.localDate}`, 20, cy);
      cy += 15;

      // Signatures
      doc.setDrawColor(200);
      doc.line(20, cy, 90, cy);
      doc.line(110, cy, 180, cy);

      doc.setFontSize(8);
      doc.setTextColor(BRAND_STONE_DARK[0], BRAND_STONE_DARK[1], BRAND_STONE_DARK[2]);
      doc.text(contract.ownerName, 55, cy + 4, { align: 'center' });
      doc.text('CONTRATANTE / PROPRIETÁRIO', 55, cy + 8, { align: 'center' });

      doc.text(fallbackCorporateName, 145, cy + 4, { align: 'center' });
      doc.text(`CONTRATADA • Corretor CRECI: ${contract.brokerCreci}`, 145, cy + 8, { align: 'center' });

      cy += 20;
      doc.line(20, cy, 90, cy);
      doc.line(110, cy, 180, cy);
      doc.text('Testemunha 1 (Nome e CPF)', 55, cy + 4, { align: 'center' });
      doc.text('Testemunha 2 (Nome e CPF)', 145, cy + 4, { align: 'center' });

      // PAGE 5: ANEXOS (CHECKLIST & PLANO)
      doc.addPage();
      drawPDFHeader(doc, 'Anexo I - Ficha de Captação e Documentos');
      
      const capturingRows = [
        ['Endereço do Imóvel:', contract.address],
        ['Área Construída:', `${appraisal.propertyBuiltArea} m²`],
        ['Área Terreno:', `${appraisal.propertyArea} m²`],
        ['Ocupação:', contract.occupancyStatus],
        ['Condições de conservação:', appraisal.propertyConservation],
        ['Laudos Registrados:', `Parecer de Comercialização oficial QDEZ de código ${appraisal.id}`],
      ];

      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(BRAND_RED[0], BRAND_RED[1], BRAND_RED[2]);
      doc.text('Anexo I: Detalhamento Técnico Relacionado', 20, 70);

      autoTable(doc, {
        startY: 75,
        body: capturingRows,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 3, lineColor: [220, 215, 210], lineWidth: 0.1 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50, fillColor: [248, 245, 242] } },
        margin: { left: 20, right: 20 }
      });

      const nextY = (doc as any).lastAutoTable.finalY + 8;
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('Anexo II: Checklist Documental Recomendado', 20, nextY);

      const checklistRows = [
        ['RG, CPF e comprovante de estado civil do proprietário', 'Solicitado'],
        ['Cópia da Matrícula Atualizada do Imóvel', 'Solicitado'],
        ['Espelho do IPTU / Cadastro Municipal', 'Solicitado'],
        ['Certidão Negativa de Tributos Municipais', 'Solicitado'],
        ['Declaração de Quitação de Débitos Condominiais', 'Solicitado'],
        ['Cópia de planta e Habite-se', 'Opcional'],
      ];

      autoTable(doc, {
        startY: nextY + 4,
        head: [['Documento Obrigatório', 'Situação']],
        body: checklistRows,
        theme: 'grid',
        styles: { fontSize: 7.5, cellPadding: 2.5, lineColor: [220, 215, 210], lineWidth: 0.1 },
        headStyles: { fillColor: BRAND_RED, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        columnStyles: { 0: { cellWidth: 120 }, 1: { fontStyle: 'italic', fillColor: [250, 250, 250] } },
        margin: { left: 20, right: 20 }
      });

      const nextY2 = (doc as any).lastAutoTable.finalY + 8;
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('Anexo III: Plano de Marketing e Comercialização QDEZ', 20, nextY2);

      const marketingRows = [
        ['1. Diagnóstico de Campo', 'Análise jurídica, pesquisa mercadológica com fatores de homogeneização integrados da NBR-14653 e fotografia técnica.'],
        ['2. Posicionamento', 'Produção de conteúdo rico, descrição comercial consultiva ressaltando os itens de alta valorização urbana.'],
        ['3. Divulgação Ativa', 'Publicação no site oficial QDEZ, portais de alta conversão, tráfego pago georreferenciado e rede de parceiros locais.'],
        ['4. Atendimento e Nutrição', 'Qualificação criteriosa de leads, filtragem de curiosos e agendamento de visitas com termos de ciência assinados.'],
      ];

      autoTable(doc, {
        startY: nextY2 + 4,
        head: [['Etapa do Plano', 'Estratégia do Corretor / Imobiliária']],
        body: marketingRows,
        theme: 'grid',
        styles: { fontSize: 7.5, cellPadding: 2.5, lineColor: [220, 215, 210], lineWidth: 0.1 },
        headStyles: { fillColor: BRAND_STONE_DARK, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50, fillColor: [248, 245, 242] } },
        margin: { left: 20, right: 20 }
      });

      // Pagination numbering across pages
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Página ${i} de ${pageCount} - Q.DEZ IMÓVEIS - Contrato de Representação Exclusiva`, 105, 285, { align: 'center' });
      }

      if (print) {
        doc.autoPrint();
        const hRef = doc.output('bloburl');
        const printWindow = window.open(hRef, '_blank');
        if (!printWindow) {
          alert("O bloqueador de pop-ups impediu a abertura da janela de impressão. Por favor, autorize pop-ups para este site.");
        }
      } else {
        doc.save(`Contrato_Representacao_Exclusiva_${appraisal.propertyAddress.substring(0, 20)}.pdf`);
      }

      setReportProgress(100);
      setProgressMessage('Contrato gerado com sucesso!');
      setTimeout(() => {
        setReportProgress(0);
        setProgressMessage('');
      }, 1500);

    } catch (error: any) {
      console.error("Erro ao gerar PDF:", error);
      alert(`Ocorreu um erro ao gerar o PDF do contrato: ${error?.message || 'Erro desconhecido'}`);
      setReportProgress(0);
      setProgressMessage('');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const generatePDF = async (type: 'entrada' | 'saida' | 'comparativa' | 'orcamento') => {
    // Handle PDF Comparison Budget export
    if (type === 'orcamento' && pdfComparisonResult) {
      setLoading(true);
      const { jsPDF } = await import('jspdf');
      
      const responsibilities = ['Locador', 'Locatário'];
      
      // Standardize comparison issues matching paint & structural rules
      const processedResult = {
        ...pdfComparisonResult,
        rooms: (pdfComparisonResult.rooms || []).map((room: any) => ({
          ...room,
          issues: (room.issues || []).map(adjustPaintAndStructuralIssue)
        }))
      };
      
      for (const resp of responsibilities) {
        const doc = new jsPDF();
        let y = drawPDFHeader(doc, `Orçamento de Reparos (${resp})`);
        
        // Filter rooms and issues for this responsibility
        const filteredRooms = processedResult.rooms.map((room: any) => ({
          ...room,
          issues: (room.issues || []).filter((issue: any) => issue.responsibility === resp)
        })).filter((room: any) => room.issues.length > 0);

        if (filteredRooms.length === 0) continue;

        doc.setFontSize(12);
        doc.setTextColor(87, 83, 78);
        doc.setFont(undefined, 'normal');
        doc.text(`Este orçamento detalha os reparos de responsabilidade do ${resp} identificados na comparação.`, 20, y);
        y += 10;
        
        let totalCost = 0;
        let totalMaterial = 0;
        let totalLabor = 0;

        for (const room of filteredRooms) {
          const mult = roomMultipliers[room.name] !== undefined ? roomMultipliers[room.name] : 1.0;
          if (y > 260) { doc.addPage(); y = drawPDFHeader(doc, `Orçamento de Reparos (${resp})`); }
          doc.setFontSize(14);
          doc.setTextColor(193, 39, 45);
          doc.setFont(undefined, 'bold');
          
          let roomHeader = room.name;
          doc.text(roomHeader, 20, y);
          y += 8;
          
          let issueIdx = 0;
          for (const issue of room.issues) {
            if (y > 260) { doc.addPage(); y = drawPDFHeader(doc, `Orçamento de Reparos (${resp})`); }
            doc.setFontSize(10);
            doc.setTextColor(31, 41, 55);
            doc.setFont(undefined, 'normal');
            
            const isTenant = issue.responsibility === 'Locatário';
            const itemKey = `${room.name} | ${issue.item} | ${issueIdx}`;
            const currentMult = itemMultipliers[itemKey] !== undefined ? itemMultipliers[itemKey] : mult;
            const factor = isTenant ? currentMult : 1.0;

            const pItemLower = (issue.item || '').toLowerCase();
            const pIssueLower = (issue.description || '').toLowerCase();
            const isStructural = issue.responsibility === 'Locador' ||
                                 pItemLower.includes('infiltração') || 
                                 pItemLower.includes('infiltracao') || 
                                 pItemLower.includes('vazamento') || 
                                 pItemLower.includes('estrutura') || 
                                 pItemLower.includes('rachadura') || 
                                 pItemLower.includes('fissura') || 
                                 pItemLower.includes('reboco') ||
                                 pIssueLower.includes('infiltração') || 
                                 pIssueLower.includes('infiltracao') || 
                                 pIssueLower.includes('vazamento') || 
                                 pIssueLower.includes('rachadura') || 
                                 pIssueLower.includes('fissura') || 
                                 pIssueLower.includes('mofo') ||
                                 pIssueLower.includes('estrutural');
            const isTenantMaintenance = isTenant && !isStructural;

            let issueLabel = '';
            if (isTenantMaintenance) {
              doc.setTextColor(185, 28, 28); // Red 700
              issueLabel = `• [MANUTENÇÃO / DANO PROVOCADO] ${issue.item}`;
            } else {
              doc.setTextColor(31, 41, 55);
              issueLabel = `• ${issue.item}`;
            }

            if (isTenant && currentMult !== 1.0) {
              issueLabel += ` [Ajuste Realista: ${(currentMult * 100).toFixed(0)}%]`;
            }
            issueLabel += `: ${issue.description}`;

            const splitIssue = doc.splitTextToSize(issueLabel, 165);
            doc.text(splitIssue, 25, y);
            y += (splitIssue.length * 5);
            
            if (y > 260) { doc.addPage(); y = drawPDFHeader(doc, `Orçamento de Reparos (${resp})`); }
            doc.setFontSize(9);
            doc.setTextColor(87, 83, 78);
            
            const rawCost = issue.totalCost || (issue.materialCost + issue.laborCost) || issue.estimatedCost || 0;
            const cost = rawCost * factor;
            const matCost = (issue.materialCost || 0) * factor;
            const labCost = (issue.laborCost || 0) * factor;
            
            totalCost += cost;
            totalMaterial += matCost;
            totalLabor += labCost;

            const costDetailText = `  Est. Total: R$ ${cost.toFixed(2)} (Material: R$ ${matCost.toFixed(2)}, Mão de Obra: R$ ${labCost.toFixed(2)})`;
            const splitCostDetail = doc.splitTextToSize(costDetailText, 160);
            doc.text(splitCostDetail, 25, y);
            y += (splitCostDetail.length * 5) + 2;
            issueIdx++;
          }
          y += 5;
        }
        
        if (y > 240) { doc.addPage(); y = drawPDFHeader(doc, `Orçamento de Reparos (${resp})`); }
        doc.setFontSize(16);
        doc.setTextColor(193, 39, 45);
        doc.setFont(undefined, 'bold');
        doc.text(`Total do ${resp}: R$ ${totalCost.toFixed(2)}`, 20, y);
        y += 10;
        doc.setFontSize(12);
        doc.setTextColor(31, 41, 55);
        doc.text(`(Sendo R$ ${totalMaterial.toFixed(2)} em materiais e R$ ${totalLabor.toFixed(2)} em mão de obra)`, 20, y);
        y += 15;

        // Add Legal Text for Locador
        if (resp === 'Locador') {
          if (y > 200) { doc.addPage(); y = drawPDFHeader(doc, `Orçamento de Reparos (${resp})`); }
          doc.setDrawColor(200, 200, 200);
          doc.line(20, y, 190, y);
          y += 10;
          
          doc.setFontSize(10);
          doc.setTextColor(31, 41, 55);
          doc.setFont(undefined, 'bold');
          doc.text('Informações Legais Importantes:', 20, y);
          y += 7;
          
          doc.setFontSize(9);
          doc.setTextColor(75, 85, 99);
          doc.setFont(undefined, 'normal');
          
          const legalLines = [
            { label: 'Base Legal:', text: 'O Artigo 23, III da Lei do Inquilinato determina que o locatário deve restituir o imóvel no estado em que o recebeu, salvo as deteriorações decorrentes do seu uso normal.' },
            { label: 'Regra de Cobrança:', text: 'É proibido cobrar do locatário reformas, reparos ou substituições de itens decorrentes da ação do tempo ou obsolescência. O inquilino paga pelo uso do bem (aluguel), não pela reposição de sua vida útil.' },
            { label: 'Desgaste Natural (Isento de Cobrança):', text: 'exemplos: Pintura levemente desbotada ou gasta pelo sol. Pisos de madeira que perderam o brilho naturalmente. Folgas em fechaduras e maçanetas antigas. Tomadas amareladas e azulejos opacos.' }
          ];

          for (const line of legalLines) {
            if (y > 270) { doc.addPage(); y = 70; }
            doc.setFont(undefined, 'bold');
            doc.text(line.label, 20, y);
            y += 5;
            doc.setFont(undefined, 'normal');
            const splitLegal = doc.splitTextToSize(line.text, 170);
            doc.text(splitLegal, 20, y);
            y += (splitLegal.length * 5) + 4;
          }
        }

        doc.save(`orcamento_${resp.toLowerCase()}_${format(new Date(), 'yyyyMMdd')}.pdf`);
      }
      
      setLoading(false);
      return;
    }

    if (!selectedInspection) return;
    setLoading(true);
    setReportProgress(5);
    const doc = new jsPDF();
    const title = type === 'entrada' ? 'Laudo de Vistoria de Entrada' : 
                  type === 'saida' ? 'Laudo de Vistoria de Saída' :
                  type === 'comparativa' ? 'Laudo Comparativo' : 'Orçamento de Reparos';

    let y = drawPDFHeader(doc, title);

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

    doc.setFontSize(12);
    doc.setTextColor(87, 83, 78);
    doc.setFont(undefined, 'normal');
    doc.text(`Endereço: ${selectedInspection.propertyAddress}`, 20, y);
    y += 7;
    doc.text(`Data da Vistoria: ${format(new Date(selectedInspection.date), 'dd/MM/yyyy')}`, 20, y);
    y += 7;
    doc.text(`Vistoriador: ${selectedInspection.inspectorName}`, 20, y);
    y += 7;
    setReportProgress(15);
    
    if (selectedInspection.ownerName) {
      doc.text(`Proprietário: ${selectedInspection.ownerName}`, 20, y);
      y += 7;
    }
    if (selectedInspection.tenantName) {
      doc.text(`Locatário: ${selectedInspection.tenantName}`, 20, y);
      y += 7;
    }

    y += 5;
    let totalLocatario = 0;
    let totalLocador = 0;
    let totalMaterial = 0;
    let totalLabor = 0;

    const totalSteps = rooms.length;
    let currentStep = 0;

      for (const room of rooms) {
        currentStep++;
        setReportProgress(15 + Math.floor((currentStep / totalSteps) * 70));

        const mult = roomMultipliers[room.name] !== undefined ? roomMultipliers[room.name] : 1.0;
        if (y > 240) { doc.addPage(); y = drawPDFHeader(doc, title); }
        
        doc.setFontSize(14);
        doc.setTextColor(193, 39, 45);
        doc.setFont(undefined, 'bold');
        
        let roomLabel = `${room.name}`;
        if (type === 'orcamento' && mult !== 1.0) {
          roomLabel += ` (Ajuste Realista: ${(mult * 100).toFixed(0)}%)`;
        }
        doc.text(roomLabel, 20, y);
        y += 8;

      // Fetch items for this room
      const itemsSnapshot = await getDocs(query(collection(db, `inspections/${selectedInspection.id}/rooms/${room.id}/items`), orderBy('name', 'asc')));
      const rawRoomItems = itemsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Item));
      const roomItems = rawRoomItems.map((item: any) => {
        const depreciation = (item.condition === 'Regular' || item.condition === 'Ruim') ? (item.depreciation || 0) : 0;
        const depFactor = 1.0 - (depreciation / 100);

        if (item.aiAnalysis?.detectedIssues) {
          return {
            ...item,
            aiAnalysis: {
              ...item.aiAnalysis,
              detectedIssues: item.aiAnalysis.detectedIssues.map((issue: any) => {
                const adjusted = adjustPaintAndStructuralIssue(issue);
                if (depFactor !== 1.0) {
                  const origMat = adjusted.materialCost || 0;
                  const origLab = adjusted.laborCost || 0;
                  const origTotal = adjusted.totalCost || (origMat + origLab) || adjusted.estimatedCost || 0;
                  return {
                    ...adjusted,
                    materialCost: origMat * depFactor,
                    laborCost: origLab * depFactor,
                    totalCost: origTotal * depFactor,
                  };
                }
                return adjusted;
              })
            }
          };
        }
        return item;
      });

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
        const depreciationText = ((item.condition === 'Regular' || item.condition === 'Ruim') && item.depreciation) ? ` (Depreciação: ${item.depreciation}%)` : '';
        const itemTitle = `• ${item.name} - Estado: ${item.condition}${depreciationText}`;
        const splitTitle = doc.splitTextToSize(itemTitle, 165);
        doc.text(splitTitle, 25, y);
        y += (splitTitle.length * 6);
        
        if (item.description) {
          doc.setFontSize(9);
          doc.setTextColor(75, 85, 99);
          const splitDesc = doc.splitTextToSize(item.description, 160);
          doc.text(splitDesc, 30, y);
          y += (splitDesc.length * 5);
        }

        if (item.audioTranscription) {
          if (y > 250) { doc.addPage(); y = 20; }
          doc.setFontSize(9);
          doc.setTextColor(193, 39, 45); // Brand Red for micro indicators
          doc.setFont(undefined, 'bold');
          doc.text('Transcrição do Áudio do Vídeo (IA):', 30, y);
          y += 5;
          doc.setFont(undefined, 'normal');
          doc.setTextColor(75, 85, 99);
          const splitTrans = doc.splitTextToSize(item.audioTranscription, 155);
          doc.text(splitTrans, 32, y);
          y += (splitTrans.length * 5) + 3;
        }

        // Specific for Budget
        if (item.aiAnalysis?.detectedIssues) {
          item.aiAnalysis.detectedIssues.forEach((issue, issueIdx) => {
            const isTenant = issue.responsibility === 'Locatário';
            const itemKey = `${room.name} | ${item.name} | ${issue.item} | ${issueIdx}`;
            const currentMult = itemMultipliers[itemKey] !== undefined ? itemMultipliers[itemKey] : mult;
            const factor = isTenant ? currentMult : 1.0;
            
            const rawMat = issue.materialCost || 0;
            const rawLab = issue.laborCost || 0;
            const rawTot = issue.totalCost || (rawMat + rawLab) || 0;
            
            const material = rawMat * factor;
            const labor = rawLab * factor;
            const total = rawTot * factor;
            
            totalMaterial += material;
            totalLabor += labor;
            
            if (issue.responsibility === 'Locatário') totalLocatario += total;
            if (issue.responsibility === 'Locador') totalLocador += total;

            if (y > 260) { doc.addPage(); y = 20; }
            
            doc.setFontSize(9);
            
            const pItemLower = (issue.item || '').toLowerCase();
            const pIssueLower = (issue.issue || issue.description || '').toLowerCase();
            const isStructural = issue.responsibility === 'Locador' ||
                                 pItemLower.includes('infiltração') || 
                                 pItemLower.includes('infiltracao') || 
                                 pItemLower.includes('vazamento') || 
                                 pItemLower.includes('estrutura') || 
                                 pItemLower.includes('rachadura') || 
                                 pItemLower.includes('fissura') || 
                                 pItemLower.includes('reboco') ||
                                 pIssueLower.includes('infiltração') || 
                                 pIssueLower.includes('infiltracao') || 
                                 pIssueLower.includes('vazamento') || 
                                 pIssueLower.includes('rachadura') || 
                                 pIssueLower.includes('fissura') || 
                                 pIssueLower.includes('mofo') ||
                                 pIssueLower.includes('estrutural');

            let responsibilityText = '';

            if (type === 'saida') {
              if (isStructural) {
                doc.setTextColor(29, 78, 216); // Blue 700
                responsibilityText = ' [Estrutural]';
              } else {
                doc.setTextColor(185, 28, 28); // Red 700
                responsibilityText = ' [Manutenção]';
              }
            } else {
              if (issue.responsibility === 'Locatário') {
                doc.setTextColor(185, 28, 28); // Red 700
              } else if (issue.responsibility === 'Locador') {
                doc.setTextColor(29, 78, 216); // Blue 700
              } else {
                doc.setTextColor(107, 114, 128); // Gray 500
              }

              const isEntry = type === 'entrada' || selectedInspection.type === 'entrada';
              if (isEntry) {
                responsibilityText = '';
              } else {
                const isTenantMaintenance = issue.responsibility === 'Locatário' && !isStructural;
                if (isTenantMaintenance && (type === 'orcamento' || type === 'comparativa')) {
                  responsibilityText = ' (Responsabilidade do Locatário - Manutenção/Dano Provocado)';
                  doc.setTextColor(185, 28, 28); // Highlighted in Red
                } else {
                  responsibilityText = ` (${issue.responsibility})`;
                }
              }

              if (isTenant && currentMult !== 1.0) {
                responsibilityText += ` [Ajuste Realista: ${(currentMult * 100).toFixed(0)}%]`;
              }
              if (!isEntry && issue.responsibility && issue.responsibility !== 'N/A' && item.audioTranscription && item.audioTranscription.trim().length > 0) {
                responsibilityText += ` [Apurado via Gravação de Voz/Áudio]`;
              }
            }
            
            const repairText = `  - REPARO: ${issue.item}: ${issue.issue}${responsibilityText}`;
            const splitRepair = doc.splitTextToSize(repairText, 160);
            doc.text(splitRepair, 30, y);
            y += (splitRepair.length * 5);

            if (type === 'orcamento') {
              doc.setFontSize(8);
              doc.setTextColor(107, 114, 128);
              doc.text(`    Material: R$ ${material.toFixed(2)} | Mão de Obra: R$ ${labor.toFixed(2)} | Total: R$ ${total.toFixed(2)}`, 30, y);
              y += 4;
              if (issue.source) {
                doc.setFontSize(7);
                doc.text(`    Fonte: ${issue.source}`, 30, y);
                y += 4;
              }
              y += 2;
            }
          });
        }

        // Add images
        if (item.photos && item.photos.length > 0) {
          let x = 30;
          for (const photoUrl of item.photos) {
            if (x > 160) { x = 30; y += 45; }
            if (y > 240) { doc.addPage(); y = 20; x = 30; }
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
        if (localPhotos.length > 0) {
          if (y > 240) { doc.addPage(); y = drawPDFHeader(doc, title); }
          doc.setFontSize(10);
          doc.setTextColor(193, 39, 45);
          doc.setFont(undefined, 'bold');
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
    if (quickPhotos.length > 0) {
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
      doc.text(`Total Material: R$ ${totalMaterial.toFixed(2)}`, 25, y);
      y += 7;
      doc.text(`Total Mão de Obra: R$ ${totalLabor.toFixed(2)}`, 25, y);
      y += 7;
      doc.text(`Total Locador: R$ ${totalLocador.toFixed(2)}`, 25, y);
      y += 7;
      doc.text(`Total Locatário: R$ ${totalLocatario.toFixed(2)}`, 25, y);
      y += 15;
    }

    setReportProgress(95);

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
    setReportProgress(0);
  };

  // --- VIEWS ---

  const getLast6MonthsData = (inspectionsList: Inspection[]) => {
    const monthsData = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = d.toLocaleDateString('pt-BR', { month: 'short' });
      const yearStr = d.toLocaleDateString('pt-BR', { year: '2-digit' });
      const year = d.getFullYear();
      const month = d.getMonth();
      
      const count = inspectionsList.filter(insp => {
        try {
          const dateToParse = insp.createdAt || insp.date;
          if (!dateToParse) return false;
          const inspDate = new Date(dateToParse);
          return inspDate.getFullYear() === year && inspDate.getMonth() === month;
        } catch (e) {
          return false;
        }
      }).length;
      
      const capitalizedLabel = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1).replace('.', '');
      monthsData.push({
        name: `${capitalizedLabel}/${yearStr}`,
        vistorias: count,
      });
    }
    return monthsData;
  };

  const Dashboard = () => {
    const chartData = getLast6MonthsData(inspections);

    return (
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

        {/* Estatísticas e Grafico */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Card: Resumo */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total de Vistorias</p>
              <h3 className="text-4xl font-black text-gray-900 mt-2">{inspections.length}</h3>
              <p className="text-xs text-gray-500 mt-2">Laudos e laudos de vistoria realizados no app.</p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center text-xs text-green-600 gap-1.5 font-medium">
              <CheckCircle size={14} />
              <span>Dados sincronizados</span>
            </div>
          </div>

          {/* Card: Gráfico */}
          <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Vistorias nos Últimos 6 Meses</h3>
            <div className="h-40 w-full min-h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <Tooltip 
                    cursor={{ fill: '#f3f4f6', opacity: 0.4 }}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '11px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelClassName="font-bold text-gray-700"
                  />
                  <Bar dataKey="vistorias" fill="#c1272d" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {inspections.map(insp => (
            <div key={insp.id} className="relative group">
              <Card onClick={() => { setSelectedInspection(insp); setView('detail'); }}>
                <div className="flex justify-between items-start mb-3">
                  <Badge variant={insp.type === 'entrada' ? 'red' : insp.type === 'saida' ? 'red' : 'yellow'}>
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
              {appUser?.role === 'admin' && (
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeleteInspection(insp.id); }}
                  className="absolute top-2 right-2 p-2 bg-white/80 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-sm border border-gray-100"
                  title="Excluir Vistoria"
                >
                  <Trash2 size={16} />
                </button>
              )}
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
  };

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
        <button onClick={() => setView('dashboard')} className="flex items-center gap-2 text-gray-500 mb-6 hover:text-red-700 transition-colors">
          <ArrowLeft size={20} /> Voltar ao Dashboard
        </button>
        <h1 className="text-2xl font-bold mb-8">Nova Vistoria</h1>
        <form onSubmit={handleCreateInspection} className="space-y-6 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Vistoria</label>
            <select name="type" required className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none">
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
              className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none"
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
              className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none" 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Proprietário</label>
              <select 
                name="ownerId" 
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none"
              >
                <option value="">Selecione um proprietário</option>
                {owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Locatário</label>
              <select name="tenantId" className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none">
                <option value="">Selecione um locatário</option>
                {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data da Vistoria</label>
              <input type="date" name="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vistoriador</label>
              <input name="inspector" placeholder="Nome do profissional" className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none" />
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
          <button onClick={() => setView('dashboard')} className="flex items-center gap-2 text-gray-500 hover:text-red-700">
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

        <div className="bg-red-700 text-white p-8 rounded-3xl mb-8 shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <Badge variant="red" className="bg-white/20 text-white mb-2">{selectedInspection?.type.toUpperCase()}</Badge>
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
                activeTab === tab ? 'text-red-700' : 'text-gray-400 hover:text-gray-600'
              )}
            >
              {tab}
              {activeTab === tab && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-700" />}
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
                          selectedRoom?.id === room.id ? 'bg-red-50 text-red-800 border border-red-100' : 'hover:bg-gray-50 text-gray-600 border border-transparent'
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
                          className="p-1.5 bg-white shadow-sm border border-gray-100 rounded-lg text-gray-400 hover:text-red-700"
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
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-red-500 outline-none"
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
                      className="flex-1 p-2 text-sm rounded-lg border border-gray-200 outline-none focus:ring-1 focus:ring-red-500" 
                    />
                    <Button onClick={() => { handleAddRoom(newRoomName); setNewRoomName(''); }} className="px-2 py-2"><Plus size={18} /></Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              {selectedRoom ? (
                <div className="space-y-6">
                  <div className="flex flex-col gap-4 mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">{selectedRoom.name}</h2>
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        size="sm" 
                        icon={Camera} 
                        onClick={() => setCaptureMode({ mode: 'photo', roomId: selectedRoom.id, itemId: '' })}
                        className="flex-1 min-w-[120px]"
                      >
                        Tirar Foto
                      </Button>
                      <Button 
                        size="sm" 
                        icon={VideoIcon} 
                        onClick={() => setCaptureMode({ mode: 'video', roomId: selectedRoom.id, itemId: '' })}
                        className="flex-1 min-w-[120px]"
                      >
                        Gravar Vídeo
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        icon={ImageIcon} 
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*,video/*';
                          input.multiple = true;
                          input.onchange = (e: any) => {
                            const files = Array.from(e.target.files) as File[];
                            for (const file of files) {
                              handleProcessUpload(file, selectedRoom.id, '', true);
                            }
                          };
                          input.click();
                        }}
                        className="flex-1 min-w-[120px]"
                      >
                        Galeria
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        icon={Plus} 
                        onClick={() => {
                          const name = prompt("Nome do item (ex: Pintura, Piso, Janela):");
                          if (name) handleAddItem(name, selectedRoom.id);
                        }}
                        className="flex-1 min-w-[120px]"
                      >
                        Observação
                      </Button>
                    </div>
                  </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Observações do Ambiente (Análise IA)</label>
                <textarea 
                  key={selectedRoom.id}
                  defaultValue={selectedRoom.description || ''}
                  onBlur={(e) => {
                    if (e.target.value !== (selectedRoom.description || '')) {
                      handleUpdateRoomDescription(selectedRoom.id, e.target.value);
                    }
                  }}
                  placeholder="Ex: Sala com boa iluminação, pintura nova, sem sinais de infiltração aparente..."
                  className="w-full p-3 text-sm rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-500 min-h-[80px] resize-none"
                />
              </div>

                  <div className="grid grid-cols-1 gap-4">
                    {/* Quick Local Photos Section */}
                    {localRoomPhotos[selectedRoom.id]?.length > 0 && (
                      <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100 mb-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-bold text-red-800 flex items-center gap-2">
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
                            <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold uppercase flex items-center">Modo Offline</span>
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
                              <div className="absolute bottom-2 left-2 right-2 bg-red-700/80 backdrop-blur-sm text-white text-[10px] py-1 px-2 rounded-lg flex items-center gap-2 z-20">
                                <div className="w-2 h-2 bg-white animate-pulse rounded-full" />
                                <span className="font-bold uppercase tracking-widest">IA Analisando...</span>
                              </div>
                            )}

                            {item.aiStatus === 'error' && (
                              <div className="absolute bottom-2 left-2 right-2 bg-red-600/80 backdrop-blur-sm text-white text-[10px] py-1 px-2 rounded-lg flex flex-col gap-1 z-20">
                                <div className="flex items-center gap-2">
                                  <AlertTriangle size={12} className="text-white" />
                                  <span className="font-bold uppercase tracking-widest">Erro na Análise IA</span>
                                </div>
                                {item.aiError && (
                                  <p className="text-[8px] opacity-90 leading-tight border-t border-white/20 pt-1">
                                    {item.aiError}
                                  </p>
                                )}
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAnalyzeItem(item.id, item.roomId, item.photos?.[0] || item.videos?.[0], selectedRoom?.description);
                                  }}
                                  className="mt-1 text-[8px] bg-white text-red-600 font-bold py-0.5 rounded hover:bg-gray-100 transition-colors"
                                >
                                  Tentar Novamente
                                </button>
                              </div>
                            )}

                            {item.mediaStatus === 'ready_for_analysis' && item.aiStatus === 'idle' && ((item.photos && item.photos.length > 0) || (item.videos && item.videos.length > 0)) && (
                              <div className="absolute bottom-2 left-2 right-2 bg-green-600/80 backdrop-blur-sm text-white text-[10px] py-1 px-2 rounded-lg flex flex-col gap-1 z-20">
                                <div className="flex items-center gap-2">
                                  <CheckCircle size={12} className="text-white" />
                                  <span className="font-bold uppercase tracking-widest">Pronto para análise</span>
                                </div>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const mediaUrl = (item.photos && item.photos.length > 0) ? item.photos[0] : item.videos[0];
                                    handleAnalyzeItem(item.id, item.roomId, mediaUrl, selectedRoom?.description);
                                  }}
                                  className="mt-1 text-[8px] bg-white text-green-700 font-bold py-0.5 rounded hover:bg-gray-100 transition-colors"
                                >
                                  Analisar Agora
                                </button>
                              </div>
                            )}
                            
                            {/* Condition Badge */}
                            {item.aiAnalysis && (
                              <div className="absolute top-2 left-2 z-20 flex flex-col gap-1 items-start">
                                <Badge variant={item.condition === 'Novo' || item.condition === 'Bom' ? 'green' : 'red'}>{item.condition}</Badge>
                                {item.depreciation > 0 && (item.condition === 'Regular' || item.condition === 'Ruim') && (
                                  <Badge variant="yellow">-{item.depreciation}% Deprec.</Badge>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 p-6">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h4 className="font-bold text-lg mb-1">{item.name}</h4>
                                <p className="text-sm text-gray-500 line-clamp-2">{item.description || 'Sem descrição técnica.'}</p>
                                {item.audioTranscription && (
                                  <div className="mt-2 text-xs bg-red-50 text-red-750 p-2.5 rounded-lg border border-red-100 flex items-start gap-1.5">
                                    <Mic size={14} className="mt-0.5 shrink-0 text-red-500" />
                                    <div>
                                      <span className="font-semibold text-[10px] uppercase tracking-wider block text-red-800">Transcrição de Vídeo:</span>
                                      <span className="italic">"{item.audioTranscription}"</span>
                                    </div>
                                  </div>
                                )}
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
                                {item.aiAnalysis.detectedIssues.map(adjustPaintAndStructuralIssue).map((issue, i) => (
                                  <div key={i} className="flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-2 text-gray-700">
                                      <AlertTriangle size={14} className="text-yellow-500" /> {issue.item}: {issue.issue}
                                    </span>
                                    {selectedInspection?.type !== 'entrada' && (
                                      <div className="flex items-center gap-1.5">
                                        {item.audioTranscription && item.audioTranscription.trim().length > 0 && (
                                          <span className="text-[10.5px] text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-200 flex items-center gap-0.5 font-medium">
                                            <Mic size={10} className="shrink-0" /> Voz / Áudio
                                          </span>
                                        )}
                                        {selectedInspection?.type === 'saida' ? (
                                          (() => {
                                            const itemLower = (issue.item || '').toLowerCase();
                                            const issueLower = (issue.issue || '').toLowerCase();
                                            const isStructural = issue.responsibility === 'Locador' ||
                                                                 itemLower.includes('infiltração') || 
                                                                 itemLower.includes('infiltracao') || 
                                                                 itemLower.includes('vazamento') || 
                                                                 itemLower.includes('estrutura') || 
                                                                 itemLower.includes('rachadura') || 
                                                                 itemLower.includes('fissura') || 
                                                                 itemLower.includes('reboco') ||
                                                                 issueLower.includes('infiltração') || 
                                                                 issueLower.includes('infiltracao') || 
                                                                 issueLower.includes('vazamento') || 
                                                                 issueLower.includes('rachadura') || 
                                                                 issueLower.includes('fissura') || 
                                                                 issueLower.includes('mofo') ||
                                                                 issueLower.includes('estrutural');
                                            return isStructural ? (
                                              <Badge variant="blue">Estrutural</Badge>
                                            ) : (
                                              <Badge variant="red">Manutenção</Badge>
                                            );
                                          })()
                                        ) : (
                                          <Badge variant={issue.responsibility === 'Locador' ? 'stone' : 'red'}>{issue.responsibility}</Badge>
                                        )}
                                      </div>
                                    )}
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
                <Badge variant="red">{rooms.length} Ambientes</Badge>
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
                <div className="p-3 bg-red-50 text-red-700 rounded-2xl">
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
                      <label className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-red-500 hover:bg-red-50 transition-all text-gray-400 hover:text-red-700">
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
                  <div className="p-6 bg-red-700 rounded-2xl text-white shadow-lg shadow-red-200">
                    <h3 className="font-bold text-lg mb-2">Gerar Laudo Completo</h3>
                    <p className="text-red-100 text-sm mb-6">O sistema irá compilar todos os ambientes, itens, análises de IA e fotos complementares em um único PDF profissional.</p>
                    <Button 
                      className="w-full bg-white text-red-700 hover:bg-red-50 py-4 text-lg shadow-md"
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
        <button onClick={() => { setView('dashboard'); setCompareInspections([]); }} className="flex items-center gap-2 text-gray-500 mb-6 hover:text-red-700">
          <ArrowLeft size={20} /> Voltar
        </button>
        <h1 className="text-3xl font-bold mb-8">Comparação de Laudos</h1>

        <div className="flex gap-4 mb-8">
          <button 
            onClick={() => setCompareMode('internal')}
            className={cn(
              "flex-1 py-3 rounded-xl font-bold transition-all border-2",
              compareMode === 'internal' ? "bg-red-700 text-white border-red-700" : "bg-white text-gray-500 border-gray-100 hover:border-red-200"
            )}
          >
            Comparar Vistorias Internas
          </button>
          <button 
            onClick={() => setCompareMode('external')}
            className={cn(
              "flex-1 py-3 rounded-xl font-bold transition-all border-2",
              compareMode === 'external' ? "bg-red-700 text-white border-red-700" : "bg-white text-gray-500 border-gray-100 hover:border-red-200"
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
                  <div className="p-8 bg-white rounded-3xl border-2 border-dashed border-gray-200 hover:border-red-400 transition-all text-center">
                    <FileText className="mx-auto text-gray-300 mb-4" size={48} />
                    <h3 className="font-bold mb-2">Laudo de Entrada (PDF)</h3>
                    <p className="text-xs text-gray-400 mb-4">{pdfFiles.file1 ? pdfFiles.file1.name : "Nenhum arquivo selecionado"}</p>
                    <label className="cursor-pointer bg-red-50 text-red-700 px-4 py-2 rounded-lg font-bold hover:bg-red-100 transition-all">
                      Selecionar PDF
                      <input type="file" accept="application/pdf" className="hidden" onChange={(e) => setPdfFiles(prev => ({ ...prev, file1: e.target.files?.[0] || null }))} />
                    </label>
                  </div>
                  <div className="p-8 bg-white rounded-3xl border-2 border-dashed border-gray-200 hover:border-red-400 transition-all text-center">
                    <FileText className="mx-auto text-gray-300 mb-4" size={48} />
                    <h3 className="font-bold mb-2">Laudo de Saída (PDF)</h3>
                    <p className="text-xs text-gray-400 mb-4">{pdfFiles.file2 ? pdfFiles.file2.name : "Nenhum arquivo selecionado"}</p>
                    <label className="cursor-pointer bg-red-50 text-red-700 px-4 py-2 rounded-lg font-bold hover:bg-red-100 transition-all">
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
                <div className="p-8 bg-stone-900 text-white rounded-3xl shadow-xl">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-2xl">Resultado da Análise IA</h3>
                    <Badge variant="stone" className="bg-stone-700 text-white border-stone-500">PDF Externo</Badge>
                  </div>
                  <p className="text-stone-200 leading-relaxed mb-6">{pdfComparisonResult.summary}</p>
                  <div className="flex gap-3">
                    <Button variant="secondary" className="bg-white/10 hover:bg-white/20 border-white/20 text-white" onClick={() => setPdfComparisonResult(null)}>
                      Nova Comparação
                    </Button>
                    <Button className="bg-white text-stone-900 hover:bg-stone-50" onClick={() => setView('budget')}>
                      Ver Orçamento Detalhado
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-xl">Divergências por Ambiente</h3>
                  {pdfComparisonResult.rooms?.map((room: any, i: number) => (
                    <div key={i} className="space-y-3">
                      <h4 className="font-bold text-red-700 flex items-center gap-2 mt-4">
                        <Layers size={18} /> {room.name}
                      </h4>
                      {room.issues?.map((issue: any, j: number) => (
                        <Card key={j} className="p-4 border-l-4 border-l-red-500">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-bold text-gray-800">{issue.item}</p>
                              <p className="text-sm text-gray-600">{issue.description}</p>
                            </div>
                            <div className="text-right">
                              {selectedInspection?.type !== 'entrada' && (
                                <Badge variant={issue.responsibility === 'Locatário' ? 'red' : 'stone'}>{issue.responsibility}</Badge>
                              )}
                              <p className="text-xs font-bold text-gray-400 mt-1">Est: R$ {(issue.totalCost || (issue.materialCost + issue.laborCost) || issue.estimatedCost || 0).toFixed(2)}</p>
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
                    compareInspections.find(i => i.id === insp.id) ? 'border-red-500 bg-red-50' : ''
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
                    {compareInspections.find(i => i.id === insp.id) && <CheckCircle className="text-red-700" size={20} />}
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
                <div className="w-12 h-12 border-4 border-red-700 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500">Analisando divergências entre laudos...</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <div className="text-center flex-1">
                    <p className="text-xs font-bold text-gray-400 uppercase">{compareInspections[0].type}</p>
                    <h4 className="font-bold">{format(new Date(compareInspections[0].date), 'dd/MM/yy')}</h4>
                  </div>
                  <ArrowRightLeft className="text-red-700 mx-4" />
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
                        <h4 className="font-bold text-stone-900">{diff.room} - {diff.item}</h4>
                        <Badge variant={diff.status === 'Igual' ? 'green' : diff.status === 'Piorou' ? 'yellow' : 'red'}>{diff.status}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">{diff.detail}</p>
                    </Card>
                  ))}
                </div>

                <div className="bg-stone-900 text-white p-8 rounded-3xl">
                  <h3 className="font-bold text-lg mb-4">Conclusão Comparativa</h3>
                  <p className="text-stone-200 leading-relaxed">
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

    // Apply standardizer rules to enforce painting & structural budget constraints
    const processedComparisonResult = pdfComparisonResult ? {
      ...pdfComparisonResult,
      rooms: (pdfComparisonResult.rooms || []).map((room: any) => ({
        ...room,
        issues: (room.issues || []).map(adjustPaintAndStructuralIssue)
      }))
    } : null;

    const processedInspectionItems = (allInspectionItems || []).map((item: any) => {
      const depreciation = (item.condition === 'Regular' || item.condition === 'Ruim') ? (item.depreciation || 0) : 0;
      const depFactor = 1.0 - (depreciation / 100);

      if (item.aiAnalysis?.detectedIssues) {
        return {
          ...item,
          aiAnalysis: {
            ...item.aiAnalysis,
            detectedIssues: item.aiAnalysis.detectedIssues.map((issue: any) => {
              const adjusted = adjustPaintAndStructuralIssue(issue);
              if (depFactor !== 1.0) {
                const origMat = adjusted.materialCost || 0;
                const origLab = adjusted.laborCost || 0;
                const origTotal = adjusted.totalCost || (origMat + origLab) || adjusted.estimatedCost || 0;
                return {
                  ...adjusted,
                  materialCost: origMat * depFactor,
                  laborCost: origLab * depFactor,
                  totalCost: origTotal * depFactor,
                  depreciatedValue: true,
                  depreciationPercent: depreciation
                };
              }
              return adjusted;
            })
          }
        };
      }
      return item;
    });

    let totalLocatario = 0;
    let totalLocador = 0;
    let totalMaterial = 0;
    let totalLabor = 0;

    if (processedComparisonResult) {
      (processedComparisonResult.rooms || []).forEach((room: any) => {
        (room.issues || []).forEach((issue: any, issueIdx: number) => {
          const isTenant = issue.responsibility === 'Locatário';
          const itemKey = `${room.name} | ${issue.item} | ${issueIdx}`;
          const currentMult = itemMultipliers[itemKey] !== undefined ? itemMultipliers[itemKey] : (roomMultipliers[room.name] !== undefined ? roomMultipliers[room.name] : 1.0);
          const factor = isTenant ? currentMult : 1.0;
          
          const rawCost = issue.totalCost || (issue.materialCost + issue.laborCost) || issue.estimatedCost || 0;
          const cost = rawCost * factor;
          const matCost = (issue.materialCost || 0) * factor;
          const labCost = (issue.laborCost || 0) * factor;
          
          totalMaterial += matCost;
          totalLabor += labCost;
          if (isTenant) {
            totalLocatario += cost;
          } else {
            totalLocador += cost;
          }
        });
      });
    } else {
      (processedInspectionItems || []).forEach((item: any) => {
        const roomObj = rooms.find(r => r.id === item.roomId);
        const roomName = roomObj ? roomObj.name : '';

        if (item.aiAnalysis?.detectedIssues) {
          item.aiAnalysis.detectedIssues.forEach((issue: any, issueIdx: number) => {
            const isTenant = issue.responsibility === 'Locatário';
            const itemKey = `${roomName} | ${item.name} | ${issue.item} | ${issueIdx}`;
            const currentMult = itemMultipliers[itemKey] !== undefined ? itemMultipliers[itemKey] : ((roomName && roomMultipliers[roomName] !== undefined) ? roomMultipliers[roomName] : 1.0);
            const factor = isTenant ? currentMult : 1.0;
            
            const rawCost = issue.totalCost || (issue.materialCost + issue.laborCost) || 0;
            const cost = rawCost * factor;
            const matCost = (issue.materialCost || 0) * factor;
            const labCost = (issue.laborCost || 0) * factor;
            
            totalMaterial += matCost;
            totalLabor += labCost;
            if (isTenant) {
              totalLocatario += cost;
            } else {
              totalLocador += cost;
            }
          });
        }
      });
    }

    const roomsWithTenantIssues = processedComparisonResult
      ? (processedComparisonResult.rooms || []).filter((room: any) => 
          (room.issues || []).some((i: any) => i.responsibility === 'Locatário')
        )
      : rooms.filter(room => {
          const roomItems = processedInspectionItems.filter(item => item.roomId === room.id);
          return roomItems.some(item => 
            item.aiAnalysis?.detectedIssues?.some((i: any) => i.responsibility === 'Locatário')
          );
        });

    const tenantIssues: any[] = [];
    if (processedComparisonResult) {
      (processedComparisonResult.rooms || []).forEach((room: any) => {
        (room.issues || []).forEach((issue: any, issueIdx: number) => {
          if (issue.responsibility === 'Locatário') {
            const itemKey = `${room.name} | ${issue.item} | ${issueIdx}`;
            tenantIssues.push({
              key: itemKey,
              roomName: room.name,
              itemName: room.name,
              issueItem: issue.item,
              originalCost: issue.totalCost || (issue.materialCost + issue.laborCost) || issue.estimatedCost || 0,
              description: issue.description || issue.issue
            });
          }
        });
      });
    } else {
      (processedInspectionItems || []).forEach((item: any) => {
        const roomObj = rooms.find(r => r.id === item.roomId);
        const roomName = roomObj ? roomObj.name : '';
        if (item.aiAnalysis?.detectedIssues) {
          item.aiAnalysis.detectedIssues.forEach((issue: any, issueIdx: number) => {
            if (issue.responsibility === 'Locatário') {
              const itemKey = `${roomName} | ${item.name} | ${issue.item} | ${issueIdx}`;
              tenantIssues.push({
                key: itemKey,
                roomName: roomName,
                itemName: item.name,
                issueItem: issue.item,
                originalCost: issue.totalCost || (issue.materialCost + issue.laborCost) || 0,
                description: issue.issue || issue.description
              });
            }
          });
        }
      });
    }

    const groupedTenantIssues = tenantIssues.reduce((acc: Record<string, any[]>, issue) => {
      if (!acc[issue.roomName]) {
        acc[issue.roomName] = [];
      }
      acc[issue.roomName].push(issue);
      return acc;
    }, {});

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
          className="flex items-center gap-2 text-gray-500 mb-6 hover:text-red-700"
        >
          <ArrowLeft size={20} /> Voltar
        </button>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">Orçamento Estimado</h1>
          <Button onClick={() => generatePDF('orcamento')} icon={Download}>Exportar Orçamento</Button>
        </div>
        
        {pdfComparisonResult && (
          <div className="mb-8 p-6 bg-stone-900 text-white rounded-3xl shadow-lg">
            <h3 className="font-bold text-xl mb-2">Resumo da Comparação de PDFs</h3>
            <p className="text-stone-200 leading-relaxed">{pdfComparisonResult.summary}</p>
          </div>
        )}

        <div className="mb-8 p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-wrap gap-6 text-sm text-gray-600">
          <p><span className="font-bold">Imóvel:</span> {selectedInspection?.propertyAddress || "Comparação Externa"}</p>
          {selectedInspection?.ownerName && <p><span className="font-bold">Proprietário:</span> {selectedInspection.ownerName}</p>}
          {selectedInspection?.tenantName && <p><span className="font-bold">Locatário:</span> {selectedInspection.tenantName}</p>}
        </div>

        {loadingBudget ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100">
            <div className="w-12 h-12 border-4 border-red-700 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-medium">Calculando orçamento total...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-stone-50 border border-stone-100 p-4 rounded-2xl">
                <p className="text-stone-600 text-[10px] font-bold uppercase tracking-wider mb-1">Locador</p>
                <h2 className="text-2xl font-black text-stone-900">R$ {totalLocador.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
              </div>
              <div className="bg-red-50 border border-red-100 p-4 rounded-2xl">
                <p className="text-red-600 text-[10px] font-bold uppercase tracking-wider mb-1">Locatário</p>
                <h2 className="text-2xl font-black text-red-900">R$ {totalLocatario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
              </div>
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-2xl">
                <p className="text-gray-600 text-[10px] font-bold uppercase tracking-wider mb-1">Total Material</p>
                <h2 className="text-2xl font-black text-gray-900">R$ {totalMaterial.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
              </div>
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-2xl">
                <p className="text-gray-600 text-[10px] font-bold uppercase tracking-wider mb-1">Total Mão de Obra</p>
                <h2 className="text-2xl font-black text-gray-900">R$ {totalLabor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
              </div>
            </div>
            <p className="text-gray-400 text-[10px] mb-8 italic">* Estimativa baseada no menor valor entre SINAPI-SP e Mercado Regional (Ribeirão Preto).</p>

            {/* Custom Multipliers Sliders Section */}
            <Card className="p-6 bg-white border border-gray-100 shadow-sm rounded-3xl mb-8">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 border-b pb-4 gap-2">
                <div>
                  <h3 className="font-bold text-lg text-stone-900 flex items-center gap-2">
                    <Sliders size={20} className="text-red-700" />
                    Parâmetros e Ajuste Realista de Custos (Locatário)
                  </h3>
                  <p className="text-xs text-stone-500 mt-1">
                    Ajuste individualmente os valores cobrados do locatário por item de cada ambiente para refletir as condições reais de mercado ou do imóvel.
                  </p>
                </div>
                {(Object.keys(itemMultipliers).some(k => itemMultipliers[k] !== 1.0) || Object.keys(roomMultipliers).some(k => roomMultipliers[k] !== 1.0)) && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs border-gray-200 hover:bg-gray-50 hover:text-red-700 transition"
                    onClick={() => {
                      setRoomMultipliers({});
                      saveRoomMultipliers({});
                      setItemMultipliers({});
                      saveItemMultipliers({});
                    }}
                  >
                    Resetar Todos os Ajustes
                  </Button>
                )}
              </div>

              {Object.keys(groupedTenantIssues).length === 0 ? (
                <div className="text-center py-6 text-stone-400 text-sm italic">
                  Nenhum reparo de responsabilidade do Locatário identificado nestes ambientes.
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedTenantIssues).map(([roomName, issues]: [string, any[]]) => (
                    <div key={roomName} className="bg-stone-50 p-5 rounded-2xl border border-stone-200/40 space-y-3">
                      <div className="flex items-center gap-2 border-b border-gray-200/50 pb-2">
                        <span className="font-black text-stone-800 text-xs uppercase tracking-wider">{roomName}</span>
                        <span className="text-[10px] text-stone-500 font-semibold bg-stone-200/60 px-2 py-0.5 rounded-full">
                          {issues.length} item(ns)
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {issues.map((issue) => {
                          const currentMultiplier = itemMultipliers[issue.key] !== undefined ? itemMultipliers[issue.key] : 1.0;
                          const adjustedCost = issue.originalCost * currentMultiplier;

                          return (
                            <div key={issue.key} className="bg-white p-4 rounded-xl border border-stone-200/60 flex flex-col justify-between shadow-xs hover:border-stone-300 transition-colors">
                              <div className="mb-2">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <div className="flex flex-col gap-0.5">
                                    <span className="font-bold text-stone-900 text-xs">{issue.issueItem}</span>
                                    {issue.itemName && issue.itemName !== issue.roomName && (
                                      <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider">{issue.itemName}</span>
                                    )}
                                  </div>
                                  <span className="text-[10px] font-mono font-bold bg-red-700 text-white px-2 py-0.5 rounded-full shrink-0">
                                    {(currentMultiplier * 100).toFixed(0)}%
                                  </span>
                                </div>
                                <p className="text-[10px] text-stone-500 line-clamp-2 italic leading-tight">
                                  {issue.description}
                                </p>
                              </div>

                              <div>
                                {/* Slide input range */}
                                <div className="mt-3 flex items-center gap-3">
                                  <span className="text-[9px] text-stone-400 font-bold shrink-0">0%</span>
                                  <input 
                                    type="range"
                                    min="0"
                                    max="200"
                                    step="5"
                                    value={Math.round(currentMultiplier * 100)}
                                    onChange={(e) => {
                                      const newMult = parseFloat(e.target.value) / 100;
                                      const newMultipliers = {
                                        ...itemMultipliers,
                                        [issue.key]: newMult
                                      };
                                      setItemMultipliers(newMultipliers);
                                      saveItemMultipliers(newMultipliers);
                                    }}
                                    className="w-full h-1.5 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-red-700"
                                  />
                                  <span className="text-[9px] text-stone-400 font-bold shrink-0">200%</span>
                                </div>

                                <div className="mt-3 flex items-center justify-between text-[11px] text-stone-600 border-t border-stone-100 pt-2 shrink-0">
                                  <div>
                                    Original: <span className="font-semibold text-stone-500">R$ {issue.originalCost.toFixed(2)}</span>
                                  </div>
                                  <div>
                                    Ajustado: <span className="font-extrabold text-red-700">R$ {adjustedCost.toFixed(2)}</span>
                                  </div>
                                  {currentMultiplier !== 1.0 && (
                                    <button 
                                      onClick={() => {
                                        const newMultipliers = { ...itemMultipliers };
                                        delete newMultipliers[issue.key];
                                        setItemMultipliers(newMultipliers);
                                        saveItemMultipliers(newMultipliers);
                                      }}
                                      className="text-red-500 hover:underline text-[9px] font-semibold"
                                    >
                                      Limpar
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <div className="space-y-4">
              <h3 className="font-bold text-xl mb-4">Detalhamento por Item</h3>
              {processedComparisonResult ? (
                processedComparisonResult.rooms?.map((room: any, i: number) => {
                  return (
                    <div key={i} className="space-y-4">
                      <h4 className="font-bold text-lg text-stone-800 mt-6 flex items-center gap-2">
                        <Layers size={18} /> {room.name}
                      </h4>
                      {room.issues?.map((issue: any, j: number) => {
                        const isTenant = issue.responsibility === 'Locatário';
                        const itemKey = `${room.name} | ${issue.item} | ${j}`;
                        const currentMult = itemMultipliers[itemKey] !== undefined ? itemMultipliers[itemKey] : (roomMultipliers[room.name] !== undefined ? roomMultipliers[room.name] : 1.0);
                        const factor = isTenant ? currentMult : 1.0;
                        const origCost = issue.totalCost || (issue.materialCost + issue.laborCost) || issue.estimatedCost || 0;
                        const adjustedCost = origCost * factor;
                        const origMat = issue.materialCost || 0;
                        const origLab = issue.laborCost || 0;

                        const pItemLower = (issue.item || '').toLowerCase();
                        const pIssueLower = (issue.description || issue.issue || '').toLowerCase();
                        const isStructural = issue.responsibility === 'Locador' ||
                                             pItemLower.includes('infiltração') || 
                                             pItemLower.includes('infiltracao') || 
                                             pItemLower.includes('vazamento') || 
                                             pItemLower.includes('estrutura') || 
                                             pItemLower.includes('rachadura') || 
                                             pItemLower.includes('fissura') || 
                                             pItemLower.includes('reboco') ||
                                             pIssueLower.includes('infiltração') || 
                                             pIssueLower.includes('infiltracao') || 
                                             pIssueLower.includes('vazamento') || 
                                             pIssueLower.includes('rachadura') || 
                                             pIssueLower.includes('fissura') || 
                                             pIssueLower.includes('mofo') ||
                                             pIssueLower.includes('estrutural');
                        const isTenantMaintenance = isTenant && !isStructural;

                        return (
                          <Card key={j} className="p-6">
                            <div className="flex justify-between items-center bg-white">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-bold text-stone-900 text-sm">{issue.item}</p>
                                  {isTenantMaintenance && (
                                    <span className="text-[9px] font-bold text-red-705 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                                      Manutenção / Dano Provocado
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-stone-500 mt-1">{issue.description || issue.issue}</p>
                                {isTenant && currentMult !== 1.0 && (
                                  <div className="mt-1.5 font-bold text-red-700 bg-red-50 text-[10px] inline-block px-2 py-0.5 rounded">
                                    Ajuste Realista: {(currentMult * 100).toFixed(0)}% aplicado
                                  </div>
                                )}
                              </div>
                              <div className="text-right shrink-0 ml-4">
                                <p className="font-bold text-stone-900 text-base">R$ {adjustedCost.toFixed(2)}</p>
                                <div className="text-[10px] text-gray-400 mb-1">
                                  Material: R$ {(origMat * factor).toFixed(2)} | Mão de Obra: R$ {(origLab * factor).toFixed(2)}
                                </div>
                                {selectedInspection?.type !== 'entrada' && (
                                  <Badge variant={issue.responsibility === 'Locador' ? 'stone' : 'red'}>
                                    {isTenantMaintenance ? 'Locatário (Manutenção)' : issue.responsibility}
                                  </Badge>
                                )}
                                {issue.source && <p className="text-[8px] text-gray-400 mt-1">Fonte: {issue.source}</p>}
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  );
                })
              ) : (
                processedInspectionItems.filter(item => item.aiAnalysis?.detectedIssues.length).map(item => {
                  const roomObj = rooms.find(r => r.id === item.roomId);
                  const roomName = roomObj ? roomObj.name : '';

                  return (
                    <Card key={item.id} className="p-6">
                      <div className="flex justify-between items-center mb-4 border-b pb-2">
                        <div>
                          <h4 className="font-bold text-lg text-stone-800">{item.name}</h4>
                          {item.depreciation > 0 && (item.condition === 'Regular' || item.condition === 'Ruim') && (
                            <p className="text-[11px] font-semibold text-red-700 mt-0.5">
                              Depreciação de Vida Útil: {item.depreciation}% aplicada
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-xs font-semibold text-stone-600 bg-stone-100 px-2.5 py-0.5 rounded-full">
                            {roomName}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {item.aiAnalysis?.detectedIssues.map((issue, i) => {
                          const isTenant = issue.responsibility === 'Locatário';
                          const itemKey = `${roomName} | ${item.name} | ${issue.item} | ${i}`;
                          const currentMult = itemMultipliers[itemKey] !== undefined ? itemMultipliers[itemKey] : ((roomName && roomMultipliers[roomName] !== undefined) ? roomMultipliers[roomName] : 1.0);
                          const factor = isTenant ? currentMult : 1.0;
                          const origCost = issue.totalCost || (issue.materialCost + issue.laborCost) || 0;
                          const adjustedCost = origCost * factor;
                          const origMat = issue.materialCost || 0;
                          const origLab = issue.laborCost || 0;

                           const pItemLower = (issue.item || '').toLowerCase();
                           const pIssueLower = (issue.issue || issue.description || '').toLowerCase();
                           const isStructural = issue.responsibility === 'Locador' ||
                                                pItemLower.includes('infiltração') || 
                                                pItemLower.includes('infiltracao') || 
                                                pItemLower.includes('vazamento') || 
                                                pItemLower.includes('estrutura') || 
                                                pItemLower.includes('rachadura') || 
                                                pItemLower.includes('fissura') || 
                                                pItemLower.includes('reboco') ||
                                                pIssueLower.includes('infiltração') || 
                                                pIssueLower.includes('infiltracao') || 
                                                pIssueLower.includes('vazamento') || 
                                                pIssueLower.includes('rachadura') || 
                                                pIssueLower.includes('fissura') || 
                                                pIssueLower.includes('mofo') ||
                                                pIssueLower.includes('estrutural');
                           const isTenantMaintenance = isTenant && !isStructural;

                           return (
                             <div key={i} className="flex justify-between items-center bg-white p-3 border-b border-stone-100 last:border-0 pb-3 last:pb-0">
                               <div>
                                 <div className="flex items-center gap-2 flex-wrap">
                                   <p className="font-semibold text-stone-800 text-sm">{issue.item}</p>
                                   {isTenantMaintenance && (
                                     <span className="text-[9px] font-bold text-red-705 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                                       Manutenção / Dano Provocado
                                     </span>
                                   )}
                                 </div>
                                 <p className="text-xs text-stone-500 mt-0.5">{issue.issue || issue.description}</p>
                                 {isTenant && currentMult !== 1.0 && (
                                   <span className="text-[10px] font-bold text-red-700 mt-1 bg-red-50 inline-block px-2 py-0.5 rounded">
                                     Ajuste Realista: {(currentMult * 100).toFixed(0)}% aplicado
                                   </span>
                                 )}
                               </div>
                               <div className="text-right">
                                 <p className="font-bold text-stone-900 text-sm">R$ {adjustedCost.toFixed(2)}</p>
                                 <div className="text-[10px] text-gray-400 mb-1">
                                   Material: R$ {(origMat * factor).toFixed(2)} | Mão de Obra: R$ {(origLab * factor).toFixed(2)}
                                 </div>
                                 {selectedInspection?.type !== 'entrada' && (
                                   <div className="flex items-center gap-1 justify-end mt-1">
                                     {item.audioTranscription && item.audioTranscription.trim().length > 0 && (
                                       <span className="text-[9.5px] text-red-700 bg-red-50 border border-red-200 rounded px-1 flex items-center gap-0.5 font-medium shrink-0">
                                         <Mic size={9} /> Voz
                                       </span>
                                     )}
                                     <Badge variant={issue.responsibility === 'Locador' ? 'stone' : 'red'}>
                                       {isTenantMaintenance ? 'Locatário (Manutenção)' : issue.responsibility}
                                     </Badge>
                                   </div>
                                 )}
                                 {issue.source && <p className="text-[8px] text-gray-400 mt-1">Fonte: {issue.source}</p>}
                               </div>
                             </div>
                           );
                        })}
                      </div>
                    </Card>
                  );
                })
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
        <button onClick={() => setView('dashboard')} className="flex items-center gap-2 text-gray-500 mb-6 hover:text-red-700">
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
              activeSubTab === 'proprietarios' ? 'text-red-700' : 'text-gray-400 hover:text-gray-600'
            )}
          >
            Proprietários
            {activeSubTab === 'proprietarios' && <motion.div layoutId="subtab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-700" />}
          </button>
          <button 
            onClick={() => setActiveSubTab('locatarios')}
            className={cn(
              'pb-4 px-2 font-medium transition-all relative',
              activeSubTab === 'locatarios' ? 'text-red-700' : 'text-gray-400 hover:text-gray-600'
            )}
          >
            Locatários
            {activeSubTab === 'locatarios' && <motion.div layoutId="subtab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-700" />}
          </button>
          <button 
            onClick={() => setActiveSubTab('imoveis')}
            className={cn(
              'pb-4 px-2 font-medium transition-all relative',
              activeSubTab === 'imoveis' ? 'text-red-700' : 'text-gray-400 hover:text-gray-600'
            )}
          >
            Imóveis
            {activeSubTab === 'imoveis' && <motion.div layoutId="subtab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-700" />}
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
                      <input name="address" required className="w-full p-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-red-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                        <select name="type" className="w-full p-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-red-500">
                          <option value="Apartamento">Apartamento</option>
                          <option value="Casa">Casa</option>
                          <option value="Comercial">Comercial</option>
                          <option value="Outros">Outros</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Proprietário</label>
                        <select name="ownerId" required className="w-full p-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-red-500">
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
                      <input name="name" required className="w-full p-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-red-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">CPF/CNPJ</label>
                        <input name="document" required className="w-full p-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-red-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                        <input name="phone" className="w-full p-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-red-500" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                      <input type="email" name="email" className="w-full p-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-red-500" />
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                  <textarea name="observations" rows={3} className="w-full p-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-red-500" />
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

  const ModuleSelector = () => (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-red-50 to-white">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-4xl w-full"
      >
        <div className="text-center mb-12">
          <div className="bg-red-700 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <Home className="text-white" size={40} />
          </div>
          <h1 className="text-4xl font-black text-stone-900 mb-2 uppercase tracking-tight">Q.DEZ IMÓVEIS</h1>
          <p className="text-gray-500 text-lg">Selecione o módulo que deseja acessar</p>
        </div>

        <div className={`grid grid-cols-1 ${appUser?.role === 'admin' ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-8`}>
          <Card 
            onClick={() => {
              setMainModule('inspections');
              setView('dashboard');
            }}
            className="p-8 flex flex-col items-center text-center group hover:border-red-500 hover:bg-red-50/30"
          >
            <div className="bg-red-100 p-6 rounded-full text-red-700 mb-6 group-hover:scale-110 transition-transform">
              <ClipboardCheck size={48} />
            </div>
            <h2 className="text-2xl font-bold mb-4">Vistorias e Orçamentos</h2>
            <p className="text-gray-500">Laudos de entrada, saída, orçamentos automáticos com IA e comparação de estados.</p>
          </Card>

          <Card 
            onClick={() => {
              setMainModule('appraisals');
              setView('appraisal_list');
            }}
            className="p-8 flex flex-col items-center text-center group hover:border-red-500 hover:bg-red-50/30"
          >
            <div className="bg-red-100 p-6 rounded-full text-red-700 mb-6 group-hover:scale-110 transition-transform">
              <DollarSign size={48} />
            </div>
            <h2 className="text-2xl font-bold mb-4">Parecer de Comercialização</h2>
            <p className="text-gray-500">Avaliação de mercado por comparação direta (NBR-14653) com amostras geradas por IA.</p>
          </Card>

          {appUser?.role === 'admin' && (
            <Card 
              onClick={() => {
                setMainModule('inspections');
                setView('users_admin' as any);
              }}
              className="p-8 flex flex-col items-center text-center group hover:border-red-500 hover:bg-red-50/30"
            >
              <div className="bg-red-100 p-6 rounded-full text-red-700 mb-6 group-hover:scale-110 transition-transform">
                <Users size={48} />
              </div>
              <h2 className="text-2xl font-bold mb-4">Gerenciar Usuários</h2>
              <p className="text-gray-500">Cadastre e gerencie corretores e administradores com controle de acesso.</p>
            </Card>
          )}
        </div>
      </motion.div>
    </div>
  );

  const AppraisalList = () => {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Pareceres de Comercialização</h1>
            <p className="text-gray-500">Avaliação de mercado por comparação direta</p>
          </div>
          <Button onClick={() => { setSelectedAppraisal(null); setView('appraisal_new'); }} icon={Plus}>Novo Parecer</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {appraisals.map(appraisal => (
            <Card 
              key={appraisal.id} 
              onClick={() => {
                setSelectedAppraisal(appraisal);
                setView('appraisal_detail');
              }}
              className="relative overflow-hidden group"
            >
              <div className="flex justify-between items-start mb-4">
                <Badge variant={appraisal.status === 'concluido' ? 'green' : 'yellow'}>
                  {appraisal.status === 'concluido' ? 'Concluído' : 'Rascunho'}
                </Badge>
                {appUser?.role === 'admin' && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteAppraisal(appraisal.id);
                    }}
                    className="text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
              <h3 className="font-bold text-lg mb-2 line-clamp-2">{appraisal.propertyAddress}</h3>
              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center gap-2"><MapPin size={14} /> {appraisal.propertyArea}m² terreno • {appraisal.propertyBuiltArea}m² constr.</div>
                <div className="flex items-center gap-2"><Calendar size={14} /> {format(new Date(appraisal.createdAt), 'dd/MM/yyyy')}</div>
              </div>
              {appraisal.finalValue && (
                <div className="mt-6 pt-4 border-t border-gray-50">
                  <p className="text-xs text-gray-400 uppercase font-bold tracking-widest">Valor Avaliado</p>
                  <p className="text-2xl font-black text-red-700">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(appraisal.finalValue)}
                  </p>
                </div>
              )}
            </Card>
          ))}
          {appraisals.length === 0 && (
            <div className="col-span-full py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
              <DollarSign className="mx-auto text-gray-300 mb-4" size={64} />
              <p className="text-gray-500 text-lg">Nenhum parecer cadastrado ainda.</p>
              <Button variant="outline" className="mt-4" onClick={() => setView('appraisal_new')}>Criar Primeiro</Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const AppraisalNew = () => {
    const isEditing = !!selectedAppraisal && view === 'appraisal_edit';
    const [cep, setCep] = useState(selectedAppraisal?.propertyCep || '');
    const [number, setNumber] = useState(selectedAppraisal?.propertyNumber || '');
    const [address, setAddress] = useState(selectedAppraisal?.propertyAddress || '');

    const handleCepBlur = async () => {
      const cleanCep = cep.replace(/\D/g, '');
      if (cleanCep.length === 8) {
        try {
          const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
          const data = await response.json();
          if (!data.erro) {
            // Automatically fill address
            const newAddress = `${data.logradouro}, ${number ? number + ', ' : ''}${data.bairro}, ${data.localidade} - ${data.uf}`;
            setAddress(newAddress);
          }
        } catch (error) {
          console.error("Erro ao buscar CEP:", error);
        }
      }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const data = {
        propertyAddress: address,
        propertyCep: cep,
        propertyNumber: number,
        propertyDescription: formData.get('description') as string,
        propertyArea: Number(formData.get('area')),
        propertyBuiltArea: Number(formData.get('builtArea')),
        propertyAge: Number(formData.get('age')),
        propertyConservation: formData.get('conservation') as string,
        requesterName: formData.get('requesterName') as string,
        requesterDocument: formData.get('requesterDocument') as string,
        requesterEmail: formData.get('requesterEmail') as string,
        requesterPhone: formData.get('requesterPhone') as string,
        appraiserName: formData.get('appraiserName') as string,
        appraiserCreci: formData.get('appraiserCreci') as string,
      };
      
      if (isEditing) {
        await handleUpdateAppraisal(selectedAppraisal.id, data);
      } else {
        await handleCreateAppraisal({ ...data, samples: [] });
      }
    };

    return (
      <div className="max-w-3xl mx-auto p-6">
        <button onClick={() => setView(isEditing ? 'appraisal_detail' : 'appraisal_list')} className="flex items-center gap-2 text-gray-500 mb-6 hover:text-red-700">
          <ArrowLeft size={20} /> Voltar
        </button>
        <h1 className="text-3xl font-bold mb-8">{isEditing ? 'Editar Parecer de Comercialização' : 'Novo Parecer de Comercialização'}</h1>
        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-lg font-bold border-b pb-2">Dados do Solicitante</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Solicitante</label>
                  <input name="requesterName" defaultValue={selectedAppraisal?.requesterName} required className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CPF/CNPJ</label>
                  <input name="requesterDocument" defaultValue={selectedAppraisal?.requesterDocument} required className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input name="requesterEmail" type="email" defaultValue={selectedAppraisal?.requesterEmail} required className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Celular</label>
                  <input name="requesterPhone" defaultValue={selectedAppraisal?.requesterPhone} required className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-500" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-bold border-b pb-2">Dados do Imóvel</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                  <input 
                    name="cep" 
                    value={cep} 
                    onChange={(e) => setCep(e.target.value)} 
                    onBlur={handleCepBlur}
                    placeholder="00000-000" 
                    className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                  <input 
                    name="number" 
                    value={number} 
                    onChange={(e) => setNumber(e.target.value)} 
                    onBlur={handleCepBlur}
                    placeholder="Nº" 
                    className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-500" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Endereço Completo (Logradouro)</label>
                <input 
                  name="address" 
                  value={address} 
                  onChange={(e) => setAddress(e.target.value)}
                  required 
                  placeholder="Rua, Bairro, Cidade - UF" 
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição do Imóvel</label>
                <textarea name="description" defaultValue={selectedAppraisal?.propertyDescription} rows={3} placeholder="Ex: Casa térrea, 3 dormitórios, sendo 1 suíte, armários embutidos..." className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Área do Terreno (m²)</label>
                  <input name="area" type="number" step="0.01" defaultValue={selectedAppraisal?.propertyArea} required className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Área Construída (m²) <span className="text-xs font-normal text-gray-500">(digite 0 para terreno vago)</span></label>
                  <input name="builtArea" type="number" step="0.01" defaultValue={selectedAppraisal !== undefined && selectedAppraisal !== null ? (selectedAppraisal.propertyBuiltArea ?? 0) : 0} required className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Idade do Imóvel (anos)</label>
                  <input name="age" type="number" defaultValue={selectedAppraisal?.propertyAge} required className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado de Conservação</label>
                  <select name="conservation" defaultValue={selectedAppraisal?.propertyConservation || 'Bom'} className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-500">
                    <option value="Novo">Novo</option>
                    <option value="Bom">Bom</option>
                    <option value="Regular">Regular</option>
                    <option value="Ruim">Ruim</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-bold border-b pb-2">Dados do Vistoriador / Corretor</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Profissional</label>
                  <input name="appraiserName" defaultValue={selectedAppraisal?.appraiserName} required className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CRECI / Documento</label>
                  <input name="appraiserCreci" defaultValue={selectedAppraisal?.appraiserCreci} required className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-500" />
                </div>
              </div>
            </div>

            <Button className="w-full py-4 text-lg" disabled={loading}>
              {loading ? (isEditing ? 'Salvando...' : 'Criando...') : (isEditing ? 'Salvar Alterações' : 'Criar Parecer')}
            </Button>
          </form>
        </Card>
      </div>
    );
  };

  const AppraisalDetail = () => {
    if (!selectedAppraisal) return null;

    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <button onClick={() => setView('appraisal_list')} className="flex items-center gap-2 text-gray-500 hover:text-red-700">
            <ArrowLeft size={20} /> Voltar
          </button>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" icon={Edit} onClick={() => setView('appraisal_edit')} disabled={isGeneratingPDF}>Editar Laudo</Button>
            {selectedAppraisal.status === 'concluido' && (
              <Button 
                variant="outline" 
                className="hover:bg-red-50 text-red-600 border-red-200"
                icon={RefreshCw} 
                onClick={() => handleRequestReevaluation(selectedAppraisal)} 
                disabled={loading || isGeneratingPDF}
              >
                Reavaliar Imóvel
              </Button>
            )}
            {selectedAppraisal.samples && selectedAppraisal.samples.length > 0 && (
              <Button 
                variant="outline" 
                icon={Sliders} 
                onClick={() => { 
                  setEditedSamples(JSON.parse(JSON.stringify(selectedAppraisal.samples))); 
                  setIsEditingFactors(true); 
                }} 
                disabled={isGeneratingPDF}
              >
                Aprimorar Fatores
              </Button>
            )}
            <Button variant="outline" icon={Printer} onClick={() => generateAppraisalPDF(selectedAppraisal, true)} disabled={isGeneratingPDF}>
              {isGeneratingPDF ? 'Gerando...' : 'Imprimir'}
            </Button>
            <Button variant="outline" icon={Download} onClick={() => generateAppraisalPDF(selectedAppraisal)} disabled={isGeneratingPDF}>
              {isGeneratingPDF ? 'Gerando...' : 'Baixar PDF'}
            </Button>
            <Button 
              className="bg-stone-900 hover:bg-stone-800 text-white flex items-center gap-2" 
              icon={FileText} 
              onClick={() => {
                setContractFormData(selectedAppraisal.exclusivityContract || {
                  representationType: 'venda',
                  address: selectedAppraisal.propertyAddress || '',
                  registryNumber: '',
                  registryOffice: '',
                  registryCity: '',
                  ownerName: selectedAppraisal.requesterName || '',
                  ownerCpfCnpj: selectedAppraisal.requesterDocument || '',
                  ownerPhone: selectedAppraisal.requesterPhone || '',
                  ownerEmail: selectedAppraisal.requesterEmail || '',
                  qdezCorporateName: 'Qdez Negócios Imobiliários Ltdsa.',
                  qdezCnpj: '35.798.476/0001-02',
                  qdezCreci: '34873-J',
                  qdezAddress: 'Avenida Benjamin Constant 534 - Centro - Jaboticabal/SP - CEP 14870-140',
                  qdezPhone: '1635071010',
                  qdezEmail: 'atendimento@qdez.com.br',
                  brokerName: selectedAppraisal.appraiserName || '',
                  brokerCreci: selectedAppraisal.appraiserCreci || '',
                  salePrice: selectedAppraisal.finalValue || 0,
                  salePriceWords: '',
                  rentPrice: 0,
                  commissionPercentVenda: 6,
                  commissionRent: 'Valor equivalente ao primeiro aluguel integral',
                  exclusivityDays: 90,
                  startDate: new Date().toISOString().split('T')[0],
                  endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  authorizedMedia: ['site', 'portais', 'redes', 'placa', 'parcerias'],
                  keySituation: 'proprietario',
                  keySituationOther: '',
                  occupancyStatus: 'vazio',
                  occupancyStatusOther: '',
                  forumCity: 'Jaboticabal',
                  forumState: 'SP',
                  localDate: `Jaboticabal, ${new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}`
                });
                setIsEditingContract(true);
              }}
              disabled={isGeneratingPDF}
            >
              Exclusividade QDEZ
            </Button>
            {selectedAppraisal.status === 'rascunho' && (
              <Button icon={Zap} onClick={() => handleGenerateSamples(selectedAppraisal)} disabled={loading}>
                {loading ? 'Analisando...' : 'Gerar Amostras com IA'}
              </Button>
            )}
            {selectedAppraisal.status === 'concluido' && (!selectedAppraisal.technicalMarketingReport) && (
              <Button 
                className="bg-red-700 hover:bg-red-800 text-white" 
                icon={Sparkles} 
                onClick={() => handleGenerateQdezDiagnosis(selectedAppraisal)} 
                disabled={isGeneratingQdez || loading}
              >
                {isGeneratingQdez ? 'Gerando...' : 'Diagnóstico QDEZ'}
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Dados do Solicitante</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-400 uppercase text-[10px] font-bold tracking-widest">Nome</p>
                  <p className="font-medium">{selectedAppraisal.requesterName}</p>
                </div>
                <div>
                  <p className="text-gray-400 uppercase text-[10px] font-bold tracking-widest">CPF/CNPJ</p>
                  <p className="font-medium">{selectedAppraisal.requesterDocument}</p>
                </div>
                <div>
                  <p className="text-gray-400 uppercase text-[10px] font-bold tracking-widest">Email / Celular</p>
                  <p className="font-medium">{selectedAppraisal.requesterEmail} / {selectedAppraisal.requesterPhone}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Dados do Imóvel</h2>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-gray-400 uppercase text-[10px] font-bold tracking-widest">Endereço</p>
                  <p className="font-medium">{selectedAppraisal.propertyAddress}</p>
                </div>
                {selectedAppraisal.propertyCep && (
                  <div>
                    <p className="text-gray-400 uppercase text-[10px] font-bold tracking-widest">CEP</p>
                    <p className="font-medium">{selectedAppraisal.propertyCep}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 uppercase text-[10px] font-bold tracking-widest">Área Terreno</p>
                    <p className="font-medium">{selectedAppraisal.propertyArea} m²</p>
                  </div>
                  <div>
                    <p className="text-gray-400 uppercase text-[10px] font-bold tracking-widest">Área Constr.</p>
                    <p className="font-medium">{selectedAppraisal.propertyBuiltArea} m²</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 uppercase text-[10px] font-bold tracking-widest">Idade</p>
                    <p className="font-medium">{selectedAppraisal.propertyAge} anos</p>
                  </div>
                  <div>
                    <p className="text-gray-400 uppercase text-[10px] font-bold tracking-widest">Conservação</p>
                    <p className="font-medium">{selectedAppraisal.propertyConservation}</p>
                  </div>
                </div>
                {selectedAppraisal.propertyDescription && (
                  <div>
                    <p className="text-gray-400 uppercase text-[10px] font-bold tracking-widest">Descrição</p>
                    <p className="text-gray-600 italic leading-relaxed">{selectedAppraisal.propertyDescription}</p>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Responsável Técnico</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-400 uppercase text-[10px] font-bold tracking-widest">Nome do Profissional</p>
                  <p className="font-medium">{selectedAppraisal.appraiserName}</p>
                </div>
                <div>
                  <p className="text-gray-400 uppercase text-[10px] font-bold tracking-widest">CRECI / Documento</p>
                  <p className="font-medium">{selectedAppraisal.appraiserCreci}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Mídia do Imóvel</h2>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setCaptureMode({ mode: 'photo', target: 'appraisal' })}
                    className="p-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                    title="Tirar Foto"
                  >
                    <Camera size={20} />
                  </button>
                  <button 
                    onClick={() => setCaptureMode({ mode: 'video', target: 'appraisal' })}
                    className="p-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                    title="Gravar Vídeo"
                  >
                    <Video size={20} />
                  </button>
                  <label className="p-2 bg-red-50 text-red-700 rounded-lg cursor-pointer hover:bg-red-100 transition-colors" title="Anexar Arquivos">
                    <Plus size={20} />
                    <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleAppraisalMediaUpload} />
                  </label>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mb-4">
                {selectedAppraisal.photos?.map((url, i) => (
                  <div key={i} className="aspect-square rounded-lg overflow-hidden border border-gray-100 relative group">
                    <img src={url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                ))}
                {selectedAppraisal.videos?.map((url, i) => (
                  <div key={i} className="aspect-square rounded-lg overflow-hidden border border-gray-100 bg-stone-100 flex items-center justify-center relative group">
                    <Video size={20} className="text-stone-400" />
                  </div>
                ))}
              </div>

              {selectedAppraisal.photos && selectedAppraisal.photos.length > 0 && (
                <Button 
                  variant="outline" 
                  className="w-full mb-4 text-xs py-2" 
                  icon={Zap} 
                  onClick={handleAnalyzeAppraisal}
                  disabled={isAnalyzingAppraisal}
                >
                  {isAnalyzingAppraisal ? 'Analisando...' : 'Analisar Conservação com IA'}
                </Button>
              )}

              {selectedAppraisal.aiAnalysis && (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <h3 className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <Zap size={12} /> Análise IA de Conservação
                  </h3>
                  <p className="text-xs text-blue-800 leading-relaxed italic">
                    {selectedAppraisal.aiAnalysis}
                  </p>
                </div>
              )}
            </Card>

            {selectedAppraisal.finalValue && (
              <Card className="p-6 bg-red-700 text-white">
                <h2 className="text-xl font-bold mb-2 opacity-80">Valor de Mercado</h2>
                <p className="text-4xl font-black mb-4">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedAppraisal.finalValue)}
                </p>
                <div className="space-y-2 text-xs opacity-70 border-t border-white/20 pt-4">
                  <div className="flex justify-between">
                    <span>Valor Unitário Médio:</span>
                    <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedAppraisal.meanValue)}/m²{(!selectedAppraisal.propertyBuiltArea || selectedAppraisal.propertyBuiltArea === 0) ? ' de Terreno' : ''}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Desvio Padrão:</span>
                    <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedAppraisal.stdDev)}</span>
                  </div>
                </div>
              </Card>
            )}
          </div>

          <div className="lg:col-span-2">
            <Card className="p-6 overflow-x-auto">
              <h2 className="text-xl font-bold mb-6">Amostras de Mercado (NBR-14653)</h2>
              {selectedAppraisal.samples && selectedAppraisal.samples.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-gray-100">
                      <th className="pb-4 font-medium">Amostra</th>
                      <th className="pb-4 font-medium">Área (m²)</th>
                      <th className="pb-4 font-medium">Valor Oferta</th>
                      <th className="pb-4 font-medium">Fatores</th>
                      <th className="pb-4 font-medium">Fonte</th>
                      <th className="pb-4 font-medium text-right" title="Valor Unitário Homogeneizado (Vu)">Vu Homog.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {selectedAppraisal.samples.map((sample, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 pr-4">
                           <p className="font-bold text-gray-800">Elemento {idx + 1}</p>
                           <p className="text-[10px] text-gray-500 line-clamp-1">{sample.description}</p>
                        </td>
                        <td className="py-4">{(!selectedAppraisal.propertyBuiltArea || selectedAppraisal.propertyBuiltArea === 0) ? sample.area : (sample.builtArea || sample.area)}</td>
                        <td className="py-4">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(sample.offerPrice)}</td>
                         <td className="py-4">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            <span className="text-[9px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-medium" title="Fator Oferta">O:{sample.factors.offer}</span>
                            <span className="text-[9px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-medium" title="Fator Localização">L:{sample.factors.location}</span>
                            <span className="text-[9px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-medium" title="Fator Área">A:{(sample.factors.area || 1).toFixed(2)}</span>
                            {!selectedAppraisal.propertyBuiltArea || selectedAppraisal.propertyBuiltArea === 0 ? null : (
                              <>
                                <span className="text-[9px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-medium" title="Fator Padrão">P:{sample.factors.standard || 1}</span>
                                <span className="text-[9px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-medium" title="Fator Idade / Conservação">I:{sample.factors.age || 1}</span>
                              </>
                            )}
                            <span className="text-[9px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-medium" title="Fator Frente/Topografia/Garagem">F:{(sample.factors.frontage || 1).toFixed(2)}</span>
                          </div>
                        </td>
                        <td className="py-4">
                          {sample.sourceUrl ? (
                            <a href={sample.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline flex items-center gap-1">
                              <ExternalLink size={12} /> Link
                            </a>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="py-4 text-right">
                          <p className="font-bold text-red-700 leading-none">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sample.homogenizedValue)}/m²
                          </p>
                          <p className="text-[10px] text-gray-400 mt-1 whitespace-nowrap">
                            Equiv: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(sample.homogenizedValue * ((!selectedAppraisal.propertyBuiltArea || selectedAppraisal.propertyBuiltArea === 0) ? selectedAppraisal.propertyArea : selectedAppraisal.propertyBuiltArea))}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-20 text-center">
                  <Zap className="mx-auto text-gray-200 mb-4" size={48} />
                  <p className="text-gray-400">Nenhuma amostra gerada. Clique em "Gerar Amostras com IA" para iniciar a avaliação.</p>
                </div>
              )}
            </Card>

            {selectedAppraisal.technicalMarketingReport || selectedAppraisal.quickFieldDiagnosis ? (
              <div className="space-y-6 mt-6">
                {/* Parecer Técnico Section */}
                {selectedAppraisal.technicalMarketingReport && (
                  <Card className="p-6 border-l-4 border-red-700 bg-white shadow-sm">
                    <div className="flex items-center gap-2 mb-4 border-b pb-3 border-gray-100">
                      <Sparkles className="text-red-700 font-bold" size={24} />
                      <h2 className="text-xl font-bold text-gray-950">Parecer Técnico de Comercialização & Captação</h2>
                    </div>
                    <div className="text-gray-700 leading-relaxed text-sm whitespace-pre-wrap">
                      {selectedAppraisal.technicalMarketingReport}
                    </div>
                  </Card>
                )}

                {/* Diagnóstico Rápido de Campo Section */}
                {selectedAppraisal.quickFieldDiagnosis && (
                  <Card className="p-6 bg-white shadow-sm">
                    <div className="flex items-center gap-2 mb-6 border-b pb-3 border-gray-100">
                      <ClipboardCheck className="text-red-700" size={24} />
                      <h2 className="text-xl font-bold text-gray-950">Diagnóstico Rápido de Campo QDEZ</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Ocupação */}
                      <div className="md:col-span-2 bg-stone-50 p-4 rounded-xl border border-stone-200">
                        <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-1">Situação de Ocupação Atual</span>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                          <span className="font-semibold text-gray-800 text-sm">
                            {selectedAppraisal.quickFieldDiagnosis.occupancyType}
                          </span>
                        </div>
                      </div>

                      {/* Itens de Valorização */}
                      <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100">
                        <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <CheckCircle size={16} className="text-emerald-600" />
                          Itens de Valorização Urbana / Diferenciais
                        </h3>
                        <ul className="space-y-2">
                          {selectedAppraisal.quickFieldDiagnosis.valuationItems.map((item, id) => (
                            <li key={id} className="text-xs text-emerald-950 flex items-start gap-2">
                              <span className="text-emerald-500 font-bold font-mono mt-0.5">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Pontos de Atenção */}
                      <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100">
                        <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <AlertTriangle size={16} className="text-amber-600" />
                          Pontos de Atenção / Preparação Técnica
                        </h3>
                        <ul className="space-y-2">
                          {selectedAppraisal.quickFieldDiagnosis.attentionPoints.map((item, id) => (
                            <li key={id} className="text-xs text-amber-950 flex items-start gap-2">
                              <span className="text-amber-500 font-bold font-mono mt-0.5">⚠️</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Estratégia de Captação */}
                      <div className="md:col-span-2 bg-red-50/30 p-5 rounded-2xl border border-red-100">
                        <h3 className="text-sm font-bold text-red-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                          <Briefcase size={16} className="text-red-700" />
                          Abordagem de Representação Exclusiva (Roteiro Consultivo)
                        </h3>
                        <p className="text-xs text-red-950 leading-relaxed italic whitespace-pre-wrap">
                          "{selectedAppraisal.quickFieldDiagnosis.recommendedExclusivityStrategy}"
                        </p>
                      </div>

                      {/* Canais de Lançamento */}
                      <div className="md:col-span-2 bg-blue-50/20 p-5 rounded-2xl border border-blue-100">
                        <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <Layers size={16} className="text-blue-700" />
                          Plano de Lançamento & Canais de Captação Qualificada
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-blue-950">
                          {selectedAppraisal.quickFieldDiagnosis.marketingLaunchChannels.map((item, id) => (
                            <div key={id} className="flex items-center gap-2 bg-white/60 p-2 rounded-lg border border-blue-50">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            ) : (
              selectedAppraisal.status === 'concluido' && (
                <div className="mt-6 bg-stone-50 border border-stone-200 rounded-3xl p-8 text-center shadow-inner">
                  <Sparkles size={48} className="mx-auto text-stone-300 mb-4 animate-pulse" />
                  <h3 className="text-lg font-bold text-stone-800 mb-2">Parecer e Diagnóstico Baseados na Cartilha QDEZ</h3>
                  <p className="text-gray-500 text-sm max-w-lg mx-auto mb-6">
                    A alta performance requer uma visão consultiva e diagnóstico técnico de campo, superando o achismo comum. Gere agora o Parecer de Comercialização e o Diagnóstico Rápido seguindo o método prático QDEZ.
                  </p>
                  <Button 
                    variant="red"
                    className="bg-red-700 hover:bg-red-800 text-white font-bold py-3 px-6 shadow-sm flex items-center gap-2 mx-auto"
                    onClick={() => handleGenerateQdezDiagnosis(selectedAppraisal)}
                    disabled={isGeneratingQdez || loading}
                    icon={Sparkles}
                  >
                    {isGeneratingQdez ? 'Gerando Relatórios QDEZ...' : 'Preencher com IA (Método Cartilha QDEZ)'}
                  </Button>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    );
  };

  // --- AUTH COMPONENT ---
  const AuthScreen = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState<'admin' | 'corretor'>('corretor');
    const [authError, setAuthError] = useState('');
    const [authSubmitting, setAuthSubmitting] = useState(false);

    const handleGoogleLogin = async () => {
      setAuthError('');
      setAuthSubmitting(true);
      try {
        const provider = new GoogleAuthProvider();
        const userCred = await signInWithPopup(auth, provider);
        const user = userCred.user;
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
          const isMaster = user.email === 'qdezimoveis@gmail.com';
          const newAppUser: AppUser = {
            uid: user.uid,
            email: user.email || '',
            name: user.displayName || 'Corretor (Google)',
            role: isMaster ? 'admin' : 'corretor',
            createdAt: new Date().toISOString()
          };
          await setDoc(userRef, newAppUser);
          setAppUser(newAppUser);
        } else {
          setAppUser(userDoc.data() as AppUser);
        }
      } catch (err: any) {
        console.error("Google Auth error:", err);
        let msg = "Erro ao fazer login com Google: " + (err.message || err);
        if (err.code === 'auth/operation-not-allowed') {
          msg = "O login com Google está desativado no console do seu Firebase.\n\nPara ativá-lo:\n1. Vá no console do Firebase > Authentication > aba 'Sign-in method'.\n2. Ative o provedor 'Google'.\n\nCaso prefira testar sem configurações, clique no botão 'Entrar em Modo de Demonstração' abaixo!";
        } else if (err.code === 'auth/admin-restricted-operation') {
          msg = "A criação de novas contas via Google está desabilitada no console do seu Firebase.\n\nPara habilitá-la:\n1. Acesse seu console do Firebase > Authentication > aba 'Settings' (Configurações).\n2. Em 'User actions' (Ações do usuário), marque a caixa de seleção 'Enable create (sign-up)' (Ativar criação de conta).\n\nComo alternativa, você pode usar o botão 'Entrar em Modo de Demonstração' abaixo para acessar o sistema instantaneamente sem precisar configurar o Firebase!";
        }
        setAuthError(msg);
      } finally {
        setAuthSubmitting(false);
      }
    };

    const handleEnterDemoMode = () => {
      const demoUser: AppUser = {
        uid: 'demo_user',
        email: 'qdezimoveis@gmail.com',
        name: 'Administrador Master (Demo)',
        role: 'admin',
        createdAt: new Date().toISOString()
      };
      localStorage.setItem('qdez_demo_db_active', 'true');
      setAppUser(demoUser);
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setAuthError('');
      setAuthSubmitting(true);

      try {
        if (isLogin) {
          await signInWithEmailAndPassword(auth, email.trim(), password);
        } else {
          const forcedRole = email.trim().toLowerCase() === 'qdezimoveis@gmail.com' ? 'admin' : role;
          const userCred = await createUserWithEmailAndPassword(auth, email.trim(), password);
          const userRef = doc(db, 'users', userCred.user.uid);
          const newAppUser: AppUser = {
            uid: userCred.user.uid,
            email: email.trim().toLowerCase(),
            name: name.trim() || 'Usuário',
            role: forcedRole,
            createdAt: new Date().toISOString()
          };
          await setDoc(userRef, newAppUser);
          setAppUser(newAppUser);
        }
      } catch (err: any) {
        console.error("Auth error:", err);
        let msg = "Erro na autenticação. Verifique os dados.";
        if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
          msg = "E-mail ou senha incorretos.";
        } else if (err.code === 'auth/invalid-credential') {
          msg = "Credenciais inválidas ou incorretas.";
        } else if (err.code === 'auth/email-already-in-use') {
          msg = "Este e-mail já está cadastrado.";
        } else if (err.code === 'auth/weak-password') {
          msg = "A senha deve ter pelo menos 6 caracteres.";
        } else if (err.code === 'auth/invalid-email') {
          msg = "Formato de e-mail inválido.";
        } else if (err.code === 'auth/operation-not-allowed') {
          msg = "O provedor de E-mail/Senha está desativado no Firebase.\n\nPara ativá-lo no Firebase Console:\n1. Acesse o Firebase Console\n2. Vá em 'Authentication' > aba 'Sign-in method'\n3. Adicione o provedor 'E-mail/Senha' e ative-o.\n\nOu use o botão 'Entrar em Modo de Demonstração' abaixo para acessar o sistema instantaneamente!";
        } else if (err.code === 'auth/admin-restricted-operation') {
          msg = "A criação de contas (sign-up) está desabilitada no console do Firebase.\n\nPara habilitá-la:\n1. Acesse seu console do Firebase > Authentication > aba 'Settings'.\n2. Em 'User actions', marque a caixa 'Enable create (sign-up)'.\n\nVocê também pode acessar tudo agora mesmo clicando em 'Entrar em Modo de Demonstração' abaixo!";
        }
        setAuthError(msg);
      } finally {
        setAuthSubmitting(false);
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-[#FAF9F6] to-[#EAE8E4]">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-2 bg-red-700" />

          <div className="text-center mb-8">
            <div className="bg-red-700 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-200">
              <Home className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-black text-stone-900 tracking-tight uppercase">Q.DEZ IMÓVEIS</h1>
            <p className="text-gray-500 mt-2 text-sm font-medium">
              {isLogin ? 'Faça login para acessar o sistema' : 'Crie sua conta de corretor'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {authError && (
              <div className="p-3.5 bg-red-50 text-red-700 text-sm rounded-xl flex items-start gap-2 border border-red-100">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span className="whitespace-pre-line">{authError}</span>
              </div>
            )}

            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nome Completo</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500/25 focus:border-red-700 outline-none transition-all text-sm"
                  placeholder="Seu nome"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">E-mail corporativo</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500/25 focus:border-red-700 outline-none transition-all text-sm"
                placeholder="seu.email@qdezimoveis.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Senha de acesso</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500/25 focus:border-red-700 outline-none transition-all text-sm"
                placeholder="Sua senha"
              />
            </div>

            {!isLogin && email.trim().toLowerCase() !== 'qdezimoveis@gmail.com' && (
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tipo de Usuário</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500/25 focus:border-red-700 outline-none transition-all text-sm cursor-pointer"
                >
                  <option value="corretor">Corretor de Imóveis</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={authSubmitting}
              className="w-full py-3.5 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl transition-all shadow-md active:scale-98 disabled:opacity-50 text-sm uppercase tracking-wider mt-2"
            >
              {authSubmitting ? 'Processando...' : (isLogin ? 'Entrar no Sistema' : 'Cadastrar Conta')}
            </button>
          </form>

          <div className="relative my-6 text-center">
            <hr className="border-gray-200" />
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Ou</span>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={authSubmitting}
            className="w-full py-3 px-4 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 font-bold rounded-xl transition-all shadow-sm active:scale-98 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.245-3.125C18.29 1.137 15.54 0 12.24 0 5.58 0 0 5.37 0 12s5.58 12 12.24 12c6.96 0 11.57-4.814 11.57-11.79 0-.79-.08-1.4-.18-1.925H12.24z"/>
            </svg>
            <span>Entrar com Google</span>
          </button>

          <div className="mt-6 text-center border-t border-gray-100 pt-6">
            <button 
              onClick={() => {
                setIsLogin(!isLogin);
                setAuthError('');
              }}
              className="text-red-700 text-sm font-bold hover:underline"
            >
              {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já possui conta? Faça o login'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  // --- USERS ADMIN PANEL ---
  const UsersAdminView = () => {
    const [adminName, setAdminName] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [adminRole, setAdminRole] = useState<'admin' | 'corretor'>('corretor');
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const handleCreateUser = async (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMsg('');
      setSuccessMsg('');
      setSubmitting(true);

      let secondaryApp;
      try {
        const timestamp = Date.now();
        secondaryApp = initializeApp(auth.app.options, `secondary-signup-${timestamp}`);
      } catch (err: any) {
        setErrorMsg("Erro ao iniciar sessão secundária: " + err.message);
        setSubmitting(false);
        return;
      }

      const secondaryAuth = getAuth(secondaryApp);

      try {
        const userCred = await createUserWithEmailAndPassword(secondaryAuth, adminEmail.trim(), adminPassword);
        const newUid = userCred.user.uid;

        await setDoc(doc(db, 'users', newUid), {
          uid: newUid,
          name: adminName.trim(),
          email: adminEmail.trim().toLowerCase(),
          role: adminRole,
          createdAt: new Date().toISOString()
        });

        await signOut(secondaryAuth);
        await secondaryApp.delete();

        setSuccessMsg(`Usuário ${adminName} criado com sucesso!`);
        setAdminName('');
        setAdminEmail('');
        setAdminPassword('');
        setAdminRole('corretor');
      } catch (err: any) {
        console.error(err);
        let msg = err.message || "Erro desconhecido ao criar usuário.";
        if (err.code === 'auth/email-already-in-use') {
          msg = "Este e-mail já está em uso.";
        } else if (err.code === 'auth/weak-password') {
          msg = "A senha é muito fraca (mínimo 6 caracteres).";
        } else if (err.code === 'auth/invalid-email') {
          msg = "Formato de e-mail inválido.";
        } else if (err.code === 'auth/operation-not-allowed') {
          msg = "O provedor de E-mail/Senha está desativado no Firebase. Ative o provedor 'E-mail/Senha' nas configurações de Authentication do Firebase para cadastrar novos usuários.";
        }
        setErrorMsg(msg);
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center gap-3 mb-8">
          <button 
            onClick={() => {
              setMainModule('selector');
              setView('dashboard');
            }} 
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-stone-900 uppercase">Gerenciamento de Usuários</h1>
            <p className="text-gray-500">Cadastre e configure o controle de acesso de corretores e administradores</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-fit">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Plus className="text-red-700" size={20} />
              Novo Usuário
            </h2>

            <form onSubmit={handleCreateUser} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100 flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-green-50 text-green-700 text-sm rounded-xl border border-green-100 flex items-center gap-2">
                  <CheckCircle size={16} />
                  <span>{successMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nome Completo</label>
                <input 
                  type="text" 
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500/25 focus:border-red-700 outline-none transition-all text-sm"
                  placeholder="Nome do corretor ou admin"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">E-mail</label>
                <input 
                  type="email" 
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500/25 focus:border-red-700 outline-none transition-all text-sm"
                  placeholder="corretor@qdezimoveis.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Senha de Acesso</label>
                <input 
                  type="password" 
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500/25 focus:border-red-700 outline-none transition-all text-sm"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Perfil de Acesso</label>
                <select
                  value={adminRole}
                  onChange={(e) => setAdminRole(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500/25 focus:border-red-700 outline-none transition-all text-sm cursor-pointer"
                >
                  <option value="corretor">Corretor (Acesso restrito)</option>
                  <option value="admin">Administrador (Acesso total)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl transition-all shadow-md active:scale-98 disabled:opacity-50 text-sm uppercase tracking-wider"
              >
                {submitting ? 'Cadastrando...' : 'Cadastrar Usuário'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Users className="text-red-700" size={20} />
              Usuários Cadastrados ({usersList.length})
            </h2>

            <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto pr-2">
              {usersList.map((usr) => (
                <div key={usr.uid} className="py-4 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-700 font-bold text-sm uppercase">
                      {usr.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{usr.name}</h3>
                      <p className="text-sm text-gray-500">{usr.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={usr.role === 'admin' ? 'red' : 'gray'}>
                      {usr.role === 'admin' ? 'ADMIN' : 'CORRETOR'}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {usr.createdAt ? format(new Date(usr.createdAt), 'dd/MM/yyyy') : '-'}
                    </span>
                  </div>
                </div>
              ))}

              {usersList.length === 0 && (
                <div className="py-12 text-center text-gray-400">
                  Nenhum usuário cadastrado.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] flex flex-col items-center justify-center p-6 text-gray-900 font-sans">
        <div className="bg-red-700 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg animate-pulse mb-4">
          <Home className="text-white" size={24} />
        </div>
        <span className="text-sm font-bold tracking-widest text-stone-500 uppercase animate-pulse">Carregando...</span>
      </div>
    );
  }

  if (!appUser) {
    return <AuthScreen />;
  }

  if (mainModule === 'selector') {
    return <ModuleSelector />;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FC] text-gray-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setMainModule('selector')}>
            <div className="bg-red-700 p-1.5 rounded-lg">
              <Home className="text-white" size={20} />
            </div>
            <span className="font-black text-xl tracking-tight text-stone-900 uppercase">Q.DEZ IMÓVEIS</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-bold text-stone-800">{appUser.name}</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-stone-400">
                {appUser.role === 'admin' ? 'Administrador' : 'Corretor'}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold text-xs uppercase" title={appUser.name}>
              {appUser.name.charAt(0)}
            </div>
            <button 
              onClick={() => {
                localStorage.setItem('qdez_demo_db_active', 'false');
                signOut(auth);
                setCurrentUser(null);
                setAppUser(null);
                setMainModule('selector');
                setView('dashboard');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 hover:border-red-600 hover:bg-red-50 text-gray-600 hover:text-red-700 rounded-lg text-xs font-bold transition-all uppercase tracking-wider"
              title="Sair do Sistema"
            >
              Sair
            </button>
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
            {mainModule === 'inspections' ? (
              <>
                {view === 'dashboard' && <Dashboard />}
                {view === 'new' && <NewInspectionForm />}
                {view === 'detail' && <InspectionDetail />}
                {view === 'budget' && <BudgetView />}
                {view === 'compare' && <ComparisonView />}
                {view === 'registrations' && <RegistrationsView />}
                {view === 'users_admin' as any && <UsersAdminView />}
              </>
            ) : (
              <>
                {view === 'appraisal_list' && <AppraisalList />}
                {(view === 'appraisal_new' || view === 'appraisal_edit') && <AppraisalNew />}
                {view === 'appraisal_detail' && <AppraisalDetail />}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {captureMode && (
          <CameraCapture 
            mode={captureMode.mode}
            onClose={() => setCaptureMode(null)}
            onCapture={async (blob, type) => {
              if (captureMode.target === 'appraisal') {
                handleAppraisalMediaUpload(blob, type);
                return;
              }

              if (!selectedInspection || !captureMode.roomId) return;
              
              const file = new File([blob], `${type}_${Date.now()}.${type === 'photo' ? 'jpg' : 'webm'}`, { type: blob.type });
              
              if (captureMode.itemId) {
                // Direct to item
                handleProcessUpload(file, captureMode.roomId, captureMode.itemId, false);
              } else {
                // Create new item for this media
                const newItem = {
                  roomId: captureMode.roomId,
                  inspectionId: selectedInspection.id,
                  name: `${type === 'photo' ? 'FOTO' : 'VÍDEO'} ${new Date().toLocaleTimeString()}`,
                  condition: 'Bom' as ConservationState,
                  description: '',
                  mediaStatus: 'preview_local' as MediaStatus,
                  aiStatus: 'idle' as AIStatus,
                  photos: [],
                  videos: [],
                  createdAt: new Date().toISOString(),
                };
                
                const docRef = await addDoc(collection(db, `inspections/${selectedInspection.id}/rooms/${captureMode.roomId}/items`), newItem);
                handleProcessUpload(file, captureMode.roomId, docRef.id, true);
              }
            }}
          />
        )}
      </AnimatePresence>

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
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="Novo">Novo</option>
                  <option value="Bom">Bom</option>
                  <option value="Regular">Regular</option>
                  <option value="Ruim">Ruim</option>
                  <option value="Impróprio para uso">Impróprio para uso</option>
                </select>
              </div>

              {/* Useful Life Depreciation Slider & Calculator */}
              {(editingItem.condition === 'Regular' || editingItem.condition === 'Ruim') && (
                <div className="bg-stone-50 p-5 rounded-2xl border border-gray-100 space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-stone-800 flex items-center gap-2">
                      <Percent size={16} className="text-red-700" />
                      Depreciação de Vida Útil (%)
                    </label>
                    <span className="text-xs font-mono font-bold bg-red-700 text-white px-2.5 py-0.5 rounded-full">
                      {editingItem.depreciation || 0}%
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Ajuste o controle deslizante abaixo para aplicar um abatimento proporcional com base no tempo de uso e desgaste natural. Isso reduzirá proporcionalmente o custo de reparo orçado do locatário.
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-stone-400 font-bold shrink-0">0%</span>
                    <input 
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={editingItem.depreciation || 0}
                      onChange={async (e) => {
                        const dep = parseInt(e.target.value);
                        await updateDoc(doc(db, `inspections/${selectedInspection?.id}/rooms/${selectedRoom?.id}/items`, editingItem.id), { 
                          depreciation: dep 
                        });
                      }}
                      className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-700"
                    />
                    <span className="text-[10px] text-stone-400 font-bold shrink-0">100%</span>
                  </div>
                  
                  {/* Mini Calculator Display */}
                  <div className="mt-4 pt-3 border-t border-stone-200">
                    <div className="text-xs text-stone-700 font-bold mb-2">Simulador de Custo de Reposição Proporcional:</div>
                    {editingItem.aiAnalysis?.detectedIssues && editingItem.aiAnalysis.detectedIssues.length > 0 ? (
                      <div className="space-y-1.5">
                        {editingItem.aiAnalysis.detectedIssues.map((issue, idx) => {
                          const origCost = issue.totalCost || ((issue.materialCost || 0) + (issue.laborCost || 0)) || 0;
                          const depPercent = editingItem.depreciation || 0;
                          const depAmount = origCost * (depPercent / 100);
                          const finalCost = origCost - depAmount;
                          return (
                            <div key={idx} className="flex justify-between items-center text-[11px] text-stone-600 bg-white p-2.5 rounded-xl border border-stone-100">
                              <span className="font-semibold text-stone-700 max-w-[40%] truncate">{issue.item}</span>
                              <span className="font-mono text-stone-500">
                                R$ {origCost.toFixed(2)} - {depPercent}% (R$ {depAmount.toFixed(2)}) = <span className="font-bold text-red-700">R$ {finalCost.toFixed(2)}</span>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[11px] text-stone-400 italic">Nenhum custo de reparo cadastrado para este item pela análise de IA.</p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descrição Técnica / Observações</label>
                <textarea 
                  defaultValue={editingItem.description}
                  onBlur={async (e) => {
                    await updateDoc(doc(db, `inspections/${selectedInspection?.id}/rooms/${selectedRoom?.id}/items`, editingItem.id), { description: e.target.value });
                  }}
                  rows={4}
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Transcrição de Áudio do Vídeo</label>
                <textarea 
                  defaultValue={editingItem.audioTranscription || ''}
                  placeholder="Se houver vídeo gravado com observações narradas, a IA transcreverá o áudio automaticamente."
                  onBlur={async (e) => {
                    await updateDoc(doc(db, `inspections/${selectedInspection?.id}/rooms/${selectedRoom?.id}/items`, editingItem.id), { audioTranscription: e.target.value });
                  }}
                  rows={3}
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-500 text-sm"
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
                    <div className="aspect-square bg-red-50 rounded-xl flex flex-col items-center justify-center gap-2 border border-red-100">
                      <div className="w-6 h-6 border-2 border-red-600 border-t-transparent animate-spin rounded-full" />
                      <span className="text-[8px] font-bold text-red-600 uppercase tracking-widest text-center px-1">IA Analisando...</span>
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
                        {selectedInspection?.type !== 'entrada' && (
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
                        )}
                        <div className="text-right">
                          <div className="font-mono font-bold text-red-600">R$ {(issue.totalCost || (issue.materialCost + issue.laborCost) || 0).toFixed(2)}</div>
                          <div className="text-[10px] text-gray-400">Material: R$ {(issue.materialCost || 0).toFixed(2)} | Mão de Obra: R$ {(issue.laborCost || 0).toFixed(2)}</div>
                          {issue.source && <div className="text-[8px] text-gray-400">Fonte: {issue.source}</div>}
                        </div>
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

      {/* Report Progress Overlay */}
      {reportProgress > 0 && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl text-center"
          >
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="text-red-700" size={40} />
            </div>
            <h3 className="text-2xl font-bold text-stone-900 mb-2">Processando</h3>
            <p className="text-gray-500 mb-8">{progressMessage || 'Compilando dados, imagens e análises de IA...'}</p>
            
            <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden mb-4">
              <motion.div 
                className="h-full bg-red-700"
                initial={{ width: 0 }}
                animate={{ width: `${reportProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="flex justify-between text-xs font-bold text-red-700 uppercase tracking-widest">
              <span>Processando</span>
              <span>{reportProgress}%</span>
            </div>
          </motion.div>
        </div>
      )}

      {isEditingFactors && selectedAppraisal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Sliders size={24} className="text-red-700" />
                  Aprimorar Fatores de Homogeneização (NBR-14653)
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Modifique os coeficientes e valores das amostras para recalcular a avaliação técnica com precisão.
                </p>
              </div>
              <button 
                onClick={() => setIsEditingFactors(false)} 
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 overflow-y-auto">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-900 text-sm flex gap-3">
                <AlertCircle size={20} className="text-amber-700 shrink-0 mt-0.5" />
                <p>
                  Altere os fatores de cada amostra de mercado. O <strong>Valor Homogeneizado (Vu)</strong> de cada elemento e as estatísticas gerais (<strong>Valor Médio</strong>, <strong>Desvio Padrão</strong> e <strong>Valor Final de Mercado</strong>) serão recalculados e salvos no laudo de forma definitiva ao clicar em "Salvar Alterações".
                </p>
              </div>

              <div className="space-y-4">
                {editedSamples.map((sample, idx) => {
                  const isTerrainOnly = !selectedAppraisal.propertyBuiltArea || selectedAppraisal.propertyBuiltArea === 0;
                  const areaLabel = isTerrainOnly ? "Área Terreno" : "Área Constr.";
                  
                  // Local calculation for live feedback
                  const areaToUseValue = isTerrainOnly ? (sample.area || 1) : (sample.builtArea || sample.area || 1);
                  const standardFactor = isTerrainOnly ? 1 : (parseFloat(sample.factors.standard as any) || 1);
                  const ageFactor = isTerrainOnly ? 1 : (parseFloat(sample.factors.age as any) || 1);
                  
                  const liveHomogenizedValue = (sample.offerPrice * 
                    (parseFloat(sample.factors.offer as any) || 1) * 
                    (parseFloat(sample.factors.location as any) || 1) * 
                    (parseFloat(sample.factors.area as any) || 1) * 
                    standardFactor * 
                    ageFactor * 
                    (parseFloat(sample.factors.frontage as any) || 1)
                  ) / areaToUseValue;

                  return (
                    <div key={idx} className="bg-gray-50/50 border border-gray-100 rounded-2xl p-5 hover:border-red-100 transition-colors">
                      <div className="flex flex-col md:flex-row justify-between md:items-center gap-2 mb-4">
                        <div>
                          <span className="text-xs font-semibold uppercase tracking-wider text-red-700 bg-red-50 px-2.5 py-1 rounded-full">
                            Elemento {idx + 1}
                          </span>
                          <h4 className="font-bold text-gray-800 text-base mt-2">{sample.description || `Amostra de Mercado ${idx + 1}`}</h4>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">Valor Homogeneizado Atualizado:</p>
                          <p className="text-lg font-black text-red-700">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(liveHomogenizedValue)}/m²
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3 items-end">
                        {/* Preco Oferta */}
                        <div className="col-span-2">
                          <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Valor de Oferta (R$)</label>
                          <input 
                            type="number" 
                            value={sample.offerPrice || 0} 
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setEditedSamples(prev => prev.map((s, i) => i === idx ? { ...s, offerPrice: val } : s));
                            }}
                            className="w-full text-xs p-2 rounded-lg border border-gray-200 outline-none focus:ring-1 focus:ring-red-500 font-bold bg-white"
                          />
                        </div>

                        {/* Area */}
                        <div>
                          <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">{areaLabel} (m²)</label>
                          <input 
                            type="number" 
                            value={isTerrainOnly ? (sample.area || 0) : (sample.builtArea || sample.area || 0)} 
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setEditedSamples(prev => prev.map((s, i) => i === idx ? (isTerrainOnly ? { ...s, area: val } : { ...s, builtArea: val }) : s));
                            }}
                            className="w-full text-xs p-2 rounded-lg border border-gray-200 outline-none focus:ring-1 focus:ring-red-500 bg-white"
                          />
                        </div>

                        {/* Fator Oferta */}
                        <div>
                          <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1" title="Fator Oferta">FO (Oferta)</label>
                          <input 
                            type="number" 
                            step="0.01"
                            value={sample.factors.offer ?? ''} 
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditedSamples(prev => prev.map((s, i) => i === idx ? { ...s, factors: { ...s.factors, offer: val as any } } : s));
                            }}
                            className="w-full text-xs p-2 rounded-lg border border-gray-200 outline-none focus:ring-1 focus:ring-red-500 bg-white"
                          />
                        </div>

                        {/* Fator Localizacao */}
                        <div>
                          <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1" title="Fator Localização">FL (Localiz.)</label>
                          <input 
                            type="number" 
                            step="0.01"
                            value={sample.factors.location ?? ''} 
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditedSamples(prev => prev.map((s, i) => i === idx ? { ...s, factors: { ...s.factors, location: val as any } } : s));
                            }}
                            className="w-full text-xs p-2 rounded-lg border border-gray-200 outline-none focus:ring-1 focus:ring-red-500 bg-white"
                          />
                        </div>

                        {/* Fator Area */}
                        <div>
                          <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1" title="Fator Área">FA (Área)</label>
                          <input 
                            type="number" 
                            step="0.01"
                            value={sample.factors.area ?? ''} 
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditedSamples(prev => prev.map((s, i) => i === idx ? { ...s, factors: { ...s.factors, area: val as any } } : s));
                            }}
                            className="w-full text-xs p-2 rounded-lg border border-gray-200 outline-none focus:ring-1 focus:ring-red-500 bg-white"
                          />
                        </div>

                        {/* Fator Padrao (construcao) */}
                        {!isTerrainOnly ? (
                          <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1" title="Fator Padrão">FP (Padrão)</label>
                            <input 
                              type="number" 
                              step="0.01"
                              value={sample.factors.standard ?? ''} 
                              onChange={(e) => {
                                const val = e.target.value;
                                setEditedSamples(prev => prev.map((s, i) => i === idx ? { ...s, factors: { ...s.factors, standard: val as any } } : s));
                              }}
                              className="w-full text-xs p-2 rounded-lg border border-gray-200 outline-none focus:ring-1 focus:ring-red-500 bg-white"
                            />
                          </div>
                        ) : <div className="hidden md:block"></div>}

                        {/* Fator Idade */}
                        {!isTerrainOnly ? (
                          <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1" title="Fator Idade ou Depreciação">FId (Idade)</label>
                            <input 
                              type="number" 
                              step="0.01"
                              value={sample.factors.age ?? ''} 
                              onChange={(e) => {
                                const val = e.target.value;
                                setEditedSamples(prev => prev.map((s, i) => i === idx ? { ...s, factors: { ...s.factors, age: val as any } } : s));
                              }}
                              className="w-full text-xs p-2 rounded-lg border border-gray-200 outline-none focus:ring-1 focus:ring-red-500 bg-white"
                            />
                          </div>
                        ) : <div className="hidden md:block"></div>}

                        {/* Fator Frente */}
                        <div>
                          <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1" title="Fator Frente/Topografia">FT (Frente)</label>
                          <input 
                            type="number" 
                            step="0.01"
                            value={sample.factors.frontage ?? ''} 
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditedSamples(prev => prev.map((s, i) => i === idx ? { ...s, factors: { ...s.factors, frontage: val as any } } : s));
                            }}
                            className="w-full text-xs p-2 rounded-lg border border-gray-200 outline-none focus:ring-1 focus:ring-red-500 bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white">
              <Button variant="outline" onClick={() => setIsEditingFactors(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button onClick={() => handleSaveFactors(editedSamples)} disabled={loading}>
                {loading ? "Gravando Alterações..." : "Salvar Alterações e Recalcular"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {isEditingContract && contractFormData && selectedAppraisal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[95vh] overflow-y-auto shadow-2xl flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2 mr-2">
                  <FileText size={24} className="text-red-700" />
                  Contrato de Representação Comercial Exclusiva
                </h3>
                <p className="text-xs md:text-sm text-gray-500 mt-1">
                  Preencha as informações do proprietário, do imóvel e prazos. A impressão e exportação só serão habilitadas após salvar o contrato na base de dados.
                </p>
              </div>
              <button 
                onClick={() => setIsEditingContract(false)} 
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form Content */}
            <div className="p-6 space-y-6 overflow-y-auto">
              {/* Visual Disclaimer */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-900 text-sm flex gap-3">
                <AlertCircle size={20} className="text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-xs md:text-sm">Condição de Emissão COFECI-CRECI:</p>
                  <p className="text-[11px] md:text-xs text-amber-800 mt-0.5">
                    Para emitir este documento de acordo com as normas da imobiliária QDEZ, preencha todos os campos do proprietário e do imóvel. Conforme as regras de segurança do sistema, <strong>somente após clicar em "Salvar Contrato" a impressão deste documento será desbloqueada.</strong>
                  </p>
                </div>
              </div>

              {/* Grid inputs divided in Bento sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-none">
                
                {/* CARD 1: PARTES & TIPO */}
                <Card className="p-5 space-y-4 border border-gray-100 animate-none">
                  <h4 className="font-bold text-red-700 text-sm md:text-base border-b pb-1 flex items-center gap-2">
                    <User size={18} /> Partes e Representação
                  </h4>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Tipo de Representação Exclusiva</label>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-1.5 text-xs md:text-sm cursor-pointer">
                        <input 
                          type="radio" 
                          name="representationType" 
                          checked={contractFormData.representationType === 'venda'} 
                          onChange={() => setContractFormData(prev => prev ? { ...prev, representationType: 'venda' } : null)}
                          className="text-red-700 focus:ring-red-500"
                        />
                        Venda
                      </label>
                      <label className="flex items-center gap-1.5 text-xs md:text-sm cursor-pointer">
                        <input 
                          type="radio" 
                          name="representationType" 
                          checked={contractFormData.representationType === 'locacao'} 
                          onChange={() => setContractFormData(prev => prev ? { ...prev, representationType: 'locacao' } : null)}
                          className="text-red-700 focus:ring-red-500"
                        />
                        Locação
                      </label>
                      <label className="flex items-center gap-1.5 text-xs md:text-sm cursor-pointer">
                        <input 
                          type="radio" 
                          name="representationType" 
                          checked={contractFormData.representationType === 'ambos'} 
                          onChange={() => setContractFormData(prev => prev ? { ...prev, representationType: 'ambos' } : null)}
                          className="text-red-700 focus:ring-red-500"
                        />
                        Ambos (Venda & Locação)
                      </label>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nome do Proprietário / Outorgante</label>
                      <input 
                        type="text" 
                        value={contractFormData.ownerName ?? ''} 
                        onChange={(e) => setContractFormData(prev => prev ? { ...prev, ownerName: e.target.value } : null)}
                        className="w-full text-xs md:text-sm p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none bg-white font-medium animate-none"
                        placeholder="Nome completo do outorgante"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">CPF ou CNPJ do Proprietário</label>
                      <input 
                        type="text" 
                        value={contractFormData.ownerCpfCnpj ?? ''} 
                        onChange={(e) => setContractFormData(prev => prev ? { ...prev, ownerCpfCnpj: e.target.value } : null)}
                        className="w-full text-xs md:text-sm p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none bg-white"
                        placeholder="CPF/CNPJ"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Telefone Celular</label>
                        <input 
                          type="text" 
                          value={contractFormData.ownerPhone ?? ''} 
                          onChange={(e) => setContractFormData(prev => prev ? { ...prev, ownerPhone: e.target.value } : null)}
                          className="w-full text-xs md:text-sm p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none bg-white font-mono"
                          placeholder="WhatsApp"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">E-mail</label>
                        <input 
                          type="email" 
                          value={contractFormData.ownerEmail ?? ''} 
                          onChange={(e) => setContractFormData(prev => prev ? { ...prev, ownerEmail: e.target.value } : null)}
                          className="w-full text-xs md:text-sm p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none bg-white"
                          placeholder="E-mail"
                        />
                      </div>
                    </div>
                  </div>
                </Card>

                {/* CARD 2: IMÓVEL E REGISTRO CARTÓRIO */}
                <Card className="p-5 space-y-4 border border-gray-100 animate-none">
                  <h4 className="font-bold text-red-700 text-sm md:text-base border-b pb-1 flex items-center gap-2">
                    <Home size={18} /> Imóvel e Registro Público
                  </h4>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Endereço Completo do Imóvel Solicitado</label>
                    <input 
                      type="text" 
                      value={contractFormData.address ?? ''} 
                      onChange={(e) => setContractFormData(prev => prev ? { ...prev, address: e.target.value } : null)}
                      className="w-full text-xs md:text-sm p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none bg-white font-medium animate-none"
                      placeholder="Endereço, nº, Bairro, Cidade/UF"
                    />
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Título de Matrícula Imobiliária nº</label>
                      <input 
                        type="text" 
                        value={contractFormData.registryNumber ?? ''} 
                        onChange={(e) => setContractFormData(prev => prev ? { ...prev, registryNumber: e.target.value } : null)}
                        className="w-full text-xs md:text-sm p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none bg-white"
                        placeholder="Número da matrícula do cartório"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Ofício de Registro (Cartório)</label>
                        <input 
                          type="text" 
                          value={contractFormData.registryOffice ?? ''} 
                          onChange={(e) => setContractFormData(prev => prev ? { ...prev, registryOffice: e.target.value } : null)}
                          className="w-full text-xs md:text-sm p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none bg-white animate-none"
                          placeholder="Ex: 2º Ofício de RI"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Comarca Registro City</label>
                        <input 
                          type="text" 
                          value={contractFormData.registryCity ?? ''} 
                          onChange={(e) => setContractFormData(prev => prev ? { ...prev, registryCity: e.target.value } : null)}
                          className="w-full text-xs md:text-sm p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none bg-white animate-none"
                          placeholder="Cidade"
                        />
                      </div>
                    </div>
                  </div>
                </Card>

                {/* CARD 3: CONDIÇÕES COMERCIAIS & HONORÁRIOS */}
                <Card className="p-5 space-y-4 border border-gray-100 col-span-1 md:col-span-2 animate-none">
                  <h4 className="font-bold text-red-700 text-sm md:text-base border-b pb-1 flex items-center gap-2">
                    <DollarSign size={18} /> Condições de Comercialização e Honorários de Corretagem
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {contractFormData.representationType !== 'locacao' && (
                      <>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Valor de Oferta para Venda (R$)</label>
                          <input 
                            type="number" 
                            value={contractFormData.salePrice ?? 0} 
                            onChange={(e) => setContractFormData(prev => prev ? { ...prev, salePrice: parseFloat(e.target.value) || 0 } : null)}
                            className="w-full text-xs md:text-sm p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none bg-white font-medium font-mono"
                            placeholder="R$"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Valor por Extenso (Venda)</label>
                          <input 
                            type="text" 
                            value={contractFormData.salePriceWords ?? ''} 
                            onChange={(e) => setContractFormData(prev => prev ? { ...prev, salePriceWords: e.target.value } : null)}
                            className="w-full text-xs md:text-sm p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none bg-white"
                            placeholder="Ex: Seiscentos mil reais"
                          />
                        </div>
                      </>
                    )}

                    {contractFormData.representationType !== 'venda' && (
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Valor de Locação (R$ Mensais)</label>
                        <input 
                          type="number" 
                          value={contractFormData.rentPrice ?? 0} 
                          onChange={(e) => setContractFormData(prev => prev ? { ...prev, rentPrice: parseFloat(e.target.value) || 0 } : null)}
                          className="w-full text-xs md:text-sm p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none bg-white font-medium font-mono"
                          placeholder="R$"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Taxas de Corretagem Venda (%)</label>
                      <input 
                        type="number" 
                        step="0.1"
                        value={contractFormData.commissionPercentVenda ?? 0} 
                        onChange={(e) => setContractFormData(prev => prev ? { ...prev, commissionPercentVenda: parseFloat(e.target.value) || 0 } : null)}
                        className="w-full text-xs md:text-sm p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none bg-white font-bold font-mono"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Regra de Honorários Locação (Geral)</label>
                      <input 
                        type="text" 
                        value={contractFormData.commissionRent ?? ''} 
                        onChange={(e) => setContractFormData(prev => prev ? { ...prev, commissionRent: e.target.value } : null)}
                        className="w-full text-xs md:text-sm p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4 border-gray-100">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Prazo de Exclusividade (Dias)</label>
                      <input 
                        type="number" 
                        value={contractFormData.exclusivityDays ?? 0} 
                        onChange={(e) => {
                          const days = parseInt(e.target.value) || 0;
                          handleStartDateOrDaysChange(contractFormData.startDate ?? '', days);
                        }}
                        className="w-full text-xs md:text-sm p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none bg-white font-medium font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Data de Início da Vigência</label>
                      <input 
                        type="date" 
                        value={contractFormData.startDate ?? ''} 
                        onChange={(e) => handleStartDateOrDaysChange(e.target.value, contractFormData.exclusivityDays ?? 0)}
                        className="w-full text-xs md:text-sm p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Data do Término Vigência</label>
                      <input 
                        type="date" 
                        value={contractFormData.endDate ?? ''} 
                        onChange={(e) => setContractFormData(prev => prev ? { ...prev, endDate: e.target.value } : null)}
                        className="w-full text-xs md:text-sm p-2 rounded-lg border border-gray-200 bg-stone-50 text-gray-500"
                        readOnly
                      />
                    </div>
                  </div>
                </Card>

                {/* CARD 4: MÍDIAS, CHAVES E OCUPAÇÃO */}
                <Card className="p-5 space-y-4 border border-gray-100 animate-none">
                  <h4 className="font-bold text-red-700 text-sm md:text-base border-b pb-1 flex items-center gap-2">
                    <Layers size={18} /> Publicidade e Visitação
                  </h4>
                  <div>
                    <span className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Canais de Publicidade Autorizadas</span>
                    <div className="grid grid-cols-2 gap-2 text-[11px] md:text-xs">
                      {['site', 'portais', 'redes', 'placa', 'trafego', 'parcerias', 'WhatsApp'].map((media, key) => {
                        const isChecked = (contractFormData.authorizedMedia || []).includes(media);
                        return (
                          <label key={key} className="flex items-center gap-2 cursor-pointer py-1">
                            <input 
                              type="checkbox" 
                              checked={isChecked} 
                              onChange={() => handleToggleMedia(media)}
                              className="rounded text-red-700 focus:ring-red-500"
                            />
                            <span className="capitalize">{media === 'trafego' ? 'Tráfego Pago' : media === 'redes' ? 'Redes Sociais' : media}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border-t pt-4 border-gray-100 grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Guarda e Controle de Chaves</label>
                      <select 
                        value={contractFormData.keySituation ?? 'proprietario'} 
                        onChange={(e) => setContractFormData(prev => prev ? { ...prev, keySituation: e.target.value } : null)}
                        className="w-full text-[11px] md:text-xs p-2 rounded-lg border border-gray-200 bg-white"
                      >
                        <option value="proprietario">Com o Proprietário</option>
                        <option value="qdez">Na QDEZ Imóveis</option>
                        <option value="ocupante">Com o Ocupante</option>
                        <option value="outro">Outro (especificar)</option>
                      </select>
                      {contractFormData.keySituation === 'outro' && (
                        <input 
                          type="text" 
                          value={contractFormData.keySituationOther ?? ''} 
                          onChange={(e) => setContractFormData(prev => prev ? { ...prev, keySituationOther: e.target.value } : null)}
                          className="w-full text-[11px] p-2 rounded-lg border border-gray-200 mt-2" 
                          placeholder="Descreva..."
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Situação de Ocupação Atual</label>
                      <select 
                        value={contractFormData.occupancyStatus ?? 'vazio'} 
                        onChange={(e) => setContractFormData(prev => prev ? { ...prev, occupancyStatus: e.target.value } : null)}
                        className="w-full text-[11px] md:text-xs p-2 rounded-lg border border-gray-200 bg-white"
                      >
                        <option value="vazio">Imóvel Vazio</option>
                        <option value="proprietario">Ocupado pelo proprietário</option>
                        <option value="inquilino">Alugado para terceiro</option>
                        <option value="cedido">Cedido/Comodato</option>
                        <option value="outro">Outra situação</option>
                      </select>
                      {contractFormData.occupancyStatus === 'outro' && (
                        <input 
                          type="text" 
                          value={contractFormData.occupancyStatusOther ?? ''} 
                          onChange={(e) => setContractFormData(prev => prev ? { ...prev, occupancyStatusOther: e.target.value } : null)}
                          className="w-full text-[11px] p-2 rounded-lg border border-gray-200 mt-2 animate-none" 
                          placeholder="Descreva..."
                        />
                      )}
                    </div>
                  </div>
                </Card>

                {/* CARD 5: FORO, INTERMOS E CORRETOR */}
                <Card className="p-5 space-y-4 border border-gray-100 animate-none">
                  <h4 className="font-bold text-red-700 text-sm md:text-base border-b pb-1 flex items-center gap-2">
                    <Briefcase size={18} /> Foro, Datilografia e Corretor
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Comarca do Foro Civil</label>
                      <input 
                        type="text" 
                        value={contractFormData.forumCity ?? ''} 
                        onChange={(e) => setContractFormData(prev => prev ? { ...prev, forumCity: e.target.value } : null)}
                        className="w-full text-xs md:text-sm p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Estado de Eleição</label>
                      <input 
                        type="text" 
                        value={contractFormData.forumState ?? ''} 
                        onChange={(e) => setContractFormData(prev => prev ? { ...prev, forumState: e.target.value } : null)}
                        className="w-full text-xs md:text-sm p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none bg-white animate-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Local e Data por Extenso</label>
                    <input 
                      type="text" 
                      value={contractFormData.localDate ?? ''} 
                      onChange={(e) => setContractFormData(prev => prev ? { ...prev, localDate: e.target.value } : null)}
                      className="w-full text-xs md:text-sm p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none bg-white font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-stone-50 p-3 rounded-xl border border-stone-100 animate-none">
                    <div>
                      <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Corretor Responsável</label>
                      <input 
                        type="text" 
                        value={contractFormData.brokerName ?? ''} 
                        onChange={(e) => setContractFormData(prev => prev ? { ...prev, brokerName: e.target.value } : null)}
                        className="w-full text-[10px] p-2 rounded border border-gray-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">CRECI Corretor</label>
                      <input 
                        type="text" 
                        value={contractFormData.brokerCreci ?? ''} 
                        onChange={(e) => setContractFormData(prev => prev ? { ...prev, brokerCreci: e.target.value } : null)}
                        className="w-full text-[10px] p-2 rounded border border-gray-200 bg-white"
                      />
                    </div>
                  </div>
                </Card>

              </div>

            </div>

            {/* Sticky Footer */}
            <div className="p-6 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center bg-white sticky bottom-0 gap-4">
              
              {/* Save confirmation & badge status */}
              <div>
                {selectedAppraisal.exclusivityContract ? (
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full flex items-center gap-1">
                    <CheckCircle size={14} /> Contrato Gravado no Sistema
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full flex items-center gap-1">
                    <AlertCircle size={14} /> Requer Salvar para Liberar Impressão
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
                <Button variant="outline" onClick={() => setIsEditingContract(false)} disabled={loading || isGeneratingPDF}>
                  Fechar
                </Button>
                
                <Button 
                  onClick={() => handleSaveContract(contractFormData)} 
                  disabled={loading || isGeneratingPDF}
                  className="bg-red-700 hover:bg-red-800 text-white"
                >
                  {loading ? "Gravando..." : "Salvar Contrato"}
                </Button>

                <Button 
                  variant="outline" 
                  icon={Printer} 
                  onClick={() => generateExclusivityContractPDF(selectedAppraisal, contractFormData, true)}
                  disabled={!selectedAppraisal.exclusivityContract || loading || isGeneratingPDF}
                  title={!selectedAppraisal.exclusivityContract ? "Clique em 'Salvar Contrato' primeiro para habilitar a visualização e impressão de via física." : "Imprimir Contrato de Exclusividade"}
                >
                  Imprimir
                </Button>

                <Button 
                  variant="outline" 
                  icon={Download} 
                  onClick={() => generateExclusivityContractPDF(selectedAppraisal, contractFormData, false)}
                  disabled={!selectedAppraisal.exclusivityContract || loading || isGeneratingPDF}
                  title={!selectedAppraisal.exclusivityContract ? "Clique em 'Salvar Contrato' primeiro para habilitar a exportação do PDF formatado." : "Baixar PDF Oficial"}
                >
                  Baixar Contrato (PDF)
                </Button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Upload Progress Overlay */}
      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="fixed bottom-6 right-6 bg-white p-4 rounded-2xl shadow-2xl border border-gray-100 flex items-center gap-4 z-[100]">
          <div className="w-12 h-12 rounded-full border-4 border-red-50 border-t-red-700 animate-spin" />
          <div>
            <p className="font-bold text-sm">Enviando mídia...</p>
            <p className="text-xs text-gray-400">{Math.round(uploadProgress)}% concluído</p>
          </div>
        </div>
      )}
    </div>
  );
}
