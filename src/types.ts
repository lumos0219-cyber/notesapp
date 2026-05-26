export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: number;
  color?: string;
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
}

export interface CorrectionEntry {
  id?: number;
  original: string;
  corrected: string;
  count: number;
}
