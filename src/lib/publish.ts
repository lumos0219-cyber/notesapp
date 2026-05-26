import { db } from '../db';
import type { Note, Folder } from '../types';

interface Manifest {
  notes: Record<string, number>;   // noteId → updatedAt
  folders: Record<string, number>; // folderId → createdAt (for tracking)
}

export interface PublishPlan {
  newNotes: Note[];
  modifiedNotes: Note[];
  removedNoteIds: string[];
  folders: Folder[];
}

export async function analyzePublish(): Promise<PublishPlan> {
  // Get current published data from IndexedDB
  const allFolders = await db.folders.toArray();
  const allNotes = await db.notes.toArray();

  const publishedFolders = allFolders.filter((f) => f.published);
  const publishedFolderIds = new Set(publishedFolders.map((f) => f.id));

  // Descendants of published folders are auto-published
  const queue = [...publishedFolderIds];
  while (queue.length > 0) {
    const fid = queue.pop()!;
    allFolders.filter((f) => f.parentId === fid).forEach((f) => {
      publishedFolderIds.add(f.id);
      queue.push(f.id);
    });
  }

  const publishedNotes = allNotes.filter(
    (n) => n.published || (n.folderId && publishedFolderIds.has(n.folderId))
  );

  // Build ancestor folder set for tree structure
  const neededFolderIds = new Set(publishedFolderIds);
  for (const n of publishedNotes) {
    if (n.folderId) {
      let current = allFolders.find((f) => f.id === n.folderId);
      while (current) {
        neededFolderIds.add(current.id);
        current = current.parentId ? allFolders.find((f) => f.id === current!.parentId) : undefined;
      }
    }
  }

  const folders = allFolders.filter((f) => neededFolderIds.has(f.id));

  // Try to load current manifest
  let manifest: Manifest = { notes: {}, folders: {} };
  try {
    const resp = await fetch('/data/manifest.json');
    if (resp.ok) manifest = await resp.json();
  } catch { /* no manifest yet */ }

  // Compare notes
  const newNotes: Note[] = [];
  const modifiedNotes: Note[] = [];
  const removedNoteIds: string[] = [];
  const publishedNoteIds = new Set(publishedNotes.map((n) => n.id));

  for (const n of publishedNotes) {
    const lastPublished = manifest.notes[n.id];
    if (lastPublished === undefined) {
      newNotes.push(n);
    } else if (lastPublished !== n.updatedAt) {
      modifiedNotes.push(n);
    }
  }

  // Notes that were published before but are no longer published
  for (const id of Object.keys(manifest.notes)) {
    if (!publishedNoteIds.has(id)) {
      removedNoteIds.push(id);
    }
  }

  return { newNotes, modifiedNotes, removedNoteIds, folders };
}
