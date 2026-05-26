import Dexie, { type Table } from 'dexie';
import type { Note, Folder, CorrectionEntry } from './types';

class NotesDB extends Dexie {
  notes!: Table<Note, string>;
  folders!: Table<Folder, string>;
  corrections!: Table<CorrectionEntry, number>;

  constructor() {
    super('NotesAppDB');
    this.version(3).stores({
      folders: 'id, parentId, createdAt',
      notes: 'id, folderId, createdAt, updatedAt',
      corrections: '++id, original',
    }).upgrade(async (tx) => {
      // Migrate old notes: rename originalImages → images, add folderId + tags
      const oldNotes = await tx.table('notes').toArray();
      for (const n of oldNotes) {
        await tx.table('notes').put({
          id: n.id,
          title: n.title || '',
          content: n.content || '',
          images: n.originalImages || n.images || [],
          folderId: n.folderId ?? null,
          tags: n.tags || [],
          createdAt: n.createdAt || Date.now(),
          updatedAt: n.updatedAt || Date.now(),
        });
      }
    });
  }

  async debugDump(): Promise<string> {
    const noteCount = await this.notes.count();
    const folderCount = await this.folders.count();
    const notes = await this.notes.toArray();
    const folders = await this.folders.toArray();
    const previews = notes.map((n) => ({
      id: n.id.slice(0, 8),
      title: n.title,
      imageCount: n.images.length,
      folderId: n.folderId,
      tags: n.tags,
    }));
    return JSON.stringify({ noteCount, folderCount, folders, previews }, null, 2);
  }
}

export const db = new NotesDB();
