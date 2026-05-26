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
    const resp = await fetch('./published.json');
    if (!resp.ok) return null;
    return await resp.json();
  } catch {
    return null;
  }
}
