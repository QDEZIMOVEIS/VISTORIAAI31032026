export type InspectionType = 'entrada' | 'constatacao' | 'saida' | 'comparativa';
export type ConservationState = 'Novo' | 'Bom' | 'Regular' | 'Ruim' | 'Impróprio para uso';
export type Responsibility = 'Locador' | 'Locatário' | 'N/A';
export type MediaType = 'foto' | 'video';

export interface Owner {
  id: string;
  name: string;
  document: string; // CPF/CNPJ
  phone: string;
  email: string;
  observations: string;
  createdAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  document: string; // CPF/CNPJ
  phone: string;
  email: string;
  observations: string;
  createdAt: string;
}

export interface Inspection {
  id: string;
  type: InspectionType;
  propertyId?: string;
  propertyAddress: string;
  date: string;
  status: 'rascunho' | 'concluido';
  inspectorName: string;
  ownerId?: string;
  tenantId?: string;
  ownerName?: string;
  tenantName?: string;
  createdAt: string;
}

export interface Room {
  id: string;
  inspectionId: string;
  name: string;
  description: string;
  status: string;
  createdAt: string;
}

export interface ItemIssue {
  item: string;
  issue: string;
  responsibility: Responsibility;
  materialCost?: number;
  laborCost?: number;
  totalCost?: number;
  source?: string;
}

export interface Property {
  id: string;
  address: string;
  ownerId: string;
  ownerName: string;
  type: 'Casa' | 'Apartamento' | 'Comercial' | 'Outros';
  observations: string;
  createdAt: string;
}

export interface MediaAttachment {
  id: string;
  inspectionId: string;
  roomId: string;
  itemId: string;
  type: 'photo' | 'video';
  fileName: string;
  storagePath: string;
  downloadURL: string;
  contentType: string;
  ownerType?: string;
  createdAt: string;
}

export type MediaStatus = 
  | 'preview_local' 
  | 'uploading' 
  | 'uploaded' 
  | 'ready_for_analysis' 
  | 'analyzing' 
  | 'analyzed' 
  | 'error'
  | 'metadata_syncing'
  | 'metadata_error';

export type AIStatus = 
  | 'idle'
  | 'analyzing' 
  | 'analyzed' 
  | 'error';

export interface Item {
  id: string;
  roomId: string;
  inspectionId: string;
  name: string;
  condition: ConservationState;
  description: string;
  photos: string[]; // URLs (legacy support)
  videos: string[]; // URLs (legacy support)
  attachments?: MediaAttachment[];
  audioUrl?: string;
  mediaStatus?: MediaStatus;
  aiStatus?: AIStatus;
  aiError?: string;
  localPreviewUrl?: string;
  uploadProgress?: number;
  aiAnalysis?: {
    roomType: string;
    technicalDescription: string;
    detectedIssues: ItemIssue[];
    conservationState: ConservationState;
  };
  budget?: {
    material: number;
    labor: number;
    total: number;
    responsibility: Responsibility;
  };
}

export interface AppraisalSample {
  description: string;
  area: number;
  builtArea: number;
  offerPrice: number;
  factors: {
    offer: number;
    location: number;
    area: number;
    standard: number;
    age: number;
    frontage: number;
  };
  unitValue: number; // Valor unitário (R$/m²)
  homogenizedValue: number; // Valor unitário homogeneizado
}

export interface Appraisal {
  id: string;
  userId: string;
  propertyDescription: string;
  propertyAddress: string;
  propertyArea: number;
  propertyBuiltArea: number;
  propertyAge: number;
  propertyConservation: string;
  samples: AppraisalSample[];
  finalValue: number;
  meanValue: number;
  stdDev: number;
  status: 'rascunho' | 'concluido';
  createdAt: string;
  requesterName: string;
  requesterDocument: string;
  requesterEmail: string;
  requesterPhone: string;
  appraiserName: string;
  appraiserCreci: string;
  photos: string[];
  videos: string[];
  aiAnalysis?: string;
}
