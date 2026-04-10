import Dexie, { type Table } from 'dexie';

export interface OfflineMedia {
  id?: number;
  inspectionId: string;
  roomId: string;
  itemId: string;
  type: 'photo' | 'video';
  file: Blob;
  fileName: string;
  contentType: string;
  createdAt: string;
  synced: boolean;
}

export class OfflineDB extends Dexie {
  media!: Table<OfflineMedia>;

  constructor() {
    super('VistoriaOfflineDB');
    this.version(1).stores({
      media: '++id, inspectionId, roomId, itemId, synced, createdAt'
    });
  }
}

export const offlineDB = new OfflineDB();
