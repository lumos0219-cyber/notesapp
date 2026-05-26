export function isLocalhost(): boolean {
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.');
}

export interface PublishedData {
  folders: Array<{
    id: string; name: string; parentId: string | null; createdAt: number;
    color?: string; order?: number;
  }>;
  notes: Array<{
    id: string; title: string; content: string; images: string[];
    attachments: Array<{ id: string; name: string; type: string; size: number; data: string }>;
    folderId: string | null; tags: string[]; createdAt: number; updatedAt: number; order?: number;
  }>;
}

export async function fetchPublishedData(): Promise<PublishedData | null> {
  try {
    // Load manifest
    const manifestResp = await fetch('./data/manifest.json');
    if (!manifestResp.ok) return null;
    const manifest = await manifestResp.json();

    // Load folders
    const foldersResp = await fetch('./data/folders.json');
    const folders = foldersResp.ok ? await foldersResp.json() : [];

    // Load individual notes
    const noteIds = Object.keys(manifest.notes || {});
    const notes: PublishedData['notes'] = [];
    for (const id of noteIds) {
      try {
        const noteResp = await fetch(`./data/notes/${id}.json`);
        if (noteResp.ok) {
          notes.push(await noteResp.json());
        }
      } catch { /* skip failed loads */ }
    }

    return { folders, notes };
  } catch {
    return null;
  }
}
