export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: number;
  color?: string;
  order?: number;
  published?: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  data: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  images: string[];
  attachments: Attachment[];
  folderId: string | null;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  order?: number;
  published?: boolean;
}

export interface PublishLogEntry {
  id?: number;
  timestamp: number;
  folderCount: number;
  noteCount: number;
  snapshot: { folders: string[]; notes: Record<string, number> };  // folderIds + noteId→updatedAt
}

export interface CorrectionEntry {
  id?: number;
  original: string;
  corrected: string;
  count: number;
}
