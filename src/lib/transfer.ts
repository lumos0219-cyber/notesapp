import { db } from '../db';
import type { Note, Folder } from '../types';

interface ExportData {
  version: number;
  exportedAt: string;
  folders: Folder[];
  notes: Note[];
}

export async function exportAll(): Promise<void> {
  const folders = await db.folders.toArray();
  const notes = await db.notes.toArray();

  const data: ExportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    folders,
    notes,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `notesnap-${new Date().toISOString().slice(0, 10)}.notesnap`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportFolder(folderId: string): Promise<void> {
  const allFolders = await db.folders.toArray();
  const allNotes = await db.notes.toArray();

  // Collect folder and all its descendants
  const folderSet = new Set<string>();
  const queue = [folderId];
  while (queue.length > 0) {
    const id = queue.pop()!;
    folderSet.add(id);
    allFolders.filter((f) => f.parentId === id).forEach((f) => queue.push(f.id));
  }

  const folders = allFolders.filter((f) => folderSet.has(f.id) || f.id === folderId);
  const notes = allNotes.filter((n) => n.folderId && folderSet.has(n.folderId));

  const data: ExportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    folders,
    notes,
  };

  const folderName = allFolders.find((f) => f.id === folderId)?.name || 'folder';
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `notesnap-${folderName}.notesnap`;
  a.click();
  URL.revokeObjectURL(url);
}

export interface ImportResult {
  foldersAdded: number;
  notesAdded: number;
  notesSkipped: number;
}

export async function importData(json: string): Promise<ImportResult> {
  let data: ExportData;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error('文件格式无效，请确认是 .notesnap 文件');
  }

  if (!data.version || !Array.isArray(data.folders) || !Array.isArray(data.notes)) {
    throw new Error('文件格式不正确');
  }

  // Check for ID conflicts
  const existingFolderIds = new Set((await db.folders.toArray()).map((f) => f.id));
  const existingNoteIds = new Set((await db.notes.toArray()).map((n) => n.id));

  const conflictFolders = data.folders.filter((f) => existingFolderIds.has(f.id));
  const conflictNotes = data.notes.filter((n) => existingNoteIds.has(n.id));

  if (conflictFolders.length > 0 || conflictNotes.length > 0) {
    const names = [
      ...conflictFolders.map((f) => `文件夹「${f.name}」`),
      ...conflictNotes.map((n) => `笔记「${n.title || '未命名'}」`),
    ].slice(0, 5);
    const extra =
      conflictFolders.length + conflictNotes.length > 5
        ? ` 等 ${conflictFolders.length + conflictNotes.length} 项`
        : '';
    const ok = confirm(
      `以下 ${conflictFolders.length + conflictNotes.length} 项已存在，将跳过重复项：\n${names.join('\n')}${extra}\n\n点击确定继续导入`
    );
    if (!ok) return { foldersAdded: 0, notesAdded: 0, notesSkipped: 0 };
  }

  let foldersAdded = 0;
  let notesAdded = 0;
  let notesSkipped = 0;

  for (const f of data.folders) {
    if (!existingFolderIds.has(f.id)) {
      await db.folders.add(f);
      foldersAdded++;
    }
  }

  for (const n of data.notes) {
    if (!existingNoteIds.has(n.id)) {
      // Ensure attachments field exists for old exports
      await db.notes.add({
        ...n,
        attachments: n.attachments || [],
      });
      notesAdded++;
    } else {
      notesSkipped++;
    }
  }

  return { foldersAdded, notesAdded, notesSkipped };
}
