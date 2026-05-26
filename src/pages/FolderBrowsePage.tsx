import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { db } from '../db';
import type { Note, Folder } from '../types';
import { generateId } from '../lib/uuid';
import { isLocalhost } from '../lib/env';
import { exportFolder } from '../lib/transfer';
import NoteCard from '../components/NoteCard';
import FolderCard from '../components/FolderCard';
import BreadcrumbNav from '../components/BreadcrumbNav';

type SortMode = 'updated-desc' | 'updated-asc' | 'title-asc' | 'custom';

export default function FolderBrowsePage() {
  const [searchParams] = useSearchParams();
  const folderId = searchParams.get('folder') || null;

  const [folders, setFolders] = useState<Folder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null; name: string }[]>([]);
  const [sort, setSort] = useState<SortMode>('updated-desc');
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [noteDragIdx, setNoteDragIdx] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    // Load all folders
    const allFolders = await db.folders.toArray();

    // Get subfolders
    const subFolders = allFolders.filter((f) => f.parentId === folderId);
    setFolders(subFolders);

    // Load notes in this folder (null = root)
    const allNotes = await db.notes.toArray();
    const folderNotes = allNotes.filter((n) => n.folderId === folderId);
    setNotes(folderNotes);

    // Build breadcrumb path
    const crumbs: { id: string | null; name: string }[] = [
      { id: null, name: '全部笔记' },
    ];
    if (folderId) {
      // Walk up the parent chain
      const chain: Folder[] = [];
      let current = allFolders.find((f) => f.id === folderId);
      while (current) {
        chain.unshift(current);
        current = current.parentId
          ? allFolders.find((f) => f.id === current!.parentId)
          : undefined;
      }
      for (const f of chain) {
        crumbs.push({ id: f.id, name: f.name });
      }
    }
    setBreadcrumbs(crumbs);
  }, [folderId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeleteNote = async (id: string) => {
    await db.notes.delete(id);
    loadData();
  };

  const handleRenameFolder = async (id: string, newName: string) => {
    await db.folders.update(id, { name: newName });
    loadData();
  };

  const handleDeleteFolder = async (folderIdToDelete: string, deleteContents: boolean) => {
    if (deleteContents) {
      // Delete folder and all descendants + their notes
      const allFolders = await db.folders.toArray();
      const allNotes = await db.notes.toArray();

      const descendantIds = new Set<string>();
      const queue = [folderIdToDelete];
      while (queue.length > 0) {
        const fid = queue.pop()!;
        descendantIds.add(fid);
        allFolders.filter((f) => f.parentId === fid).forEach((f) => queue.push(f.id));
      }

      // Delete all descendant folders
      for (const fid of descendantIds) {
        await db.folders.delete(fid);
      }
      // Delete all notes in those folders
      for (const n of allNotes) {
        if (n.folderId && descendantIds.has(n.folderId)) {
          await db.notes.delete(n.id);
        }
      }
    } else {
      // Delete folder only, move contents to parent
      const folder = await db.folders.get(folderIdToDelete);
      if (!folder) return;
      const targetParentId = folder.parentId;

      // Move subfolders
      const subFolders = await db.folders.where('parentId').equals(folderIdToDelete).toArray();
      for (const sf of subFolders) {
        await db.folders.update(sf.id, { parentId: targetParentId });
      }
      // Move notes
      const notesInFolder = await db.notes.where('folderId').equals(folderIdToDelete).toArray();
      for (const n of notesInFolder) {
        await db.notes.update(n.id, { folderId: targetParentId });
      }
      await db.folders.delete(folderIdToDelete);
    }
    loadData();
  };

  const handleFolderColor = async (id: string, color: string) => {
    await db.folders.update(id, { color: color || undefined });
    loadData();
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    await db.folders.add({
      id: generateId(),
      name: newFolderName.trim(),
      parentId: folderId,
      createdAt: Date.now(),
    });
    setNewFolderName('');
    setShowNewFolder(false);
    loadData();
  };

  const sortedFolders = [...folders].sort((a, b) => (a.order ?? a.createdAt) - (b.order ?? b.createdAt));

  const handleFolderDragStart = (index: number) => {
    setDragIdx(index);
  };

  const handleFolderDragOver = (e: React.DragEvent, _index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleFolderDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === dropIndex) return;

    const reordered = [...sortedFolders];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(dropIndex, 0, moved);

    // Persist: assign sequential order values
    for (let i = 0; i < reordered.length; i++) {
      await db.folders.update(reordered[i].id, { order: i });
    }
    setDragIdx(null);
    loadData();
  };

  const sortedNotes = [...notes].sort((a, b) => {
    if (sort === 'updated-desc') return b.updatedAt - a.updatedAt;
    if (sort === 'updated-asc') return a.updatedAt - b.updatedAt;
    if (sort === 'title-asc') return (a.title || '未命名').localeCompare(b.title || '未命名');
    if (sort === 'custom') return (a.order ?? a.createdAt) - (b.order ?? b.createdAt);
    return 0;
  });

  const handleNoteDragStart = (index: number) => {
    setNoteDragIdx(index);
  };

  const handleNoteDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleNoteDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (noteDragIdx === null || noteDragIdx === dropIndex) return;

    const reordered = [...sortedNotes];
    const [moved] = reordered.splice(noteDragIdx, 1);
    reordered.splice(dropIndex, 0, moved);

    for (let i = 0; i < reordered.length; i++) {
      await db.notes.update(reordered[i].id, { order: i });
    }
    setNoteDragIdx(null);
    loadData();
  };

  const sortLabel: Record<SortMode, string> = {
    'updated-desc': '最近更新',
    'updated-asc': '最早更新',
    'title-asc': 'A-Z',
    'custom': '自定义排序',
  };

  return (
    <div>
      <BreadcrumbNav path={breadcrumbs} />

      {/* Sort + Actions bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1">
          {(['updated-desc', 'updated-asc', 'title-asc', ...(isLocalhost() ? ['custom' as SortMode] : [])] as SortMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setSort(m)}
              className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                sort === m
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {sortLabel[m]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {isLocalhost() && (
            <>
              {folderId && (
                <button
                  onClick={() => exportFolder(folderId)}
                  className="text-xs text-gray-500 hover:text-blue-600 transition-colors"
                >
                  导出
                </button>
              )}
              <Link
                to={`/notes/new${folderId ? `?folder=${folderId}` : ''}`}
                className="bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium
                           hover:bg-blue-600 transition-colors no-underline"
              >
                + 新笔记
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Folders section */}
      {folders.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">文件夹</p>
          <div className="space-y-2">
            {sortedFolders.map((f, i) => (
              <div
                key={f.id}
                draggable={isLocalhost()}
                onDragStart={() => isLocalhost() && handleFolderDragStart(i)}
                onDragOver={(e) => isLocalhost() && handleFolderDragOver(e, i)}
                onDrop={(e) => isLocalhost() && handleFolderDrop(e, i)}
                onDragEnd={() => setDragIdx(null)}
                className={dragIdx === i ? 'opacity-40' : ''}
              >
                <FolderCard
                  id={f.id}
                  name={f.name}
                  color={f.color}
                  published={f.published}
                  onRename={handleRenameFolder}
                  onDelete={handleDeleteFolder}
                  onColor={handleFolderColor}
                  onTogglePublished={async (id, published) => {
                    await db.folders.update(id, { published });
                    loadData();
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes section */}
      <div>
        {folders.length > 0 && (
          <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">笔记</p>
        )}
        {sortedNotes.length === 0 && folders.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">📝</div>
            <p className="text-gray-500 font-medium mb-1">还没有笔记</p>
            {isLocalhost() ? (
              <>
                <p className="text-sm text-gray-400 mb-4">点击右上角创建第一条笔记</p>
                <Link
                  to={`/notes/new${folderId ? `?folder=${folderId}` : ''}`}
                  className="inline-block bg-blue-500 text-white px-5 py-2 rounded-xl text-sm
                             font-medium hover:bg-blue-600 transition-colors no-underline"
                >
                  创建笔记
                </Link>
              </>
            ) : (
              <p className="text-sm text-gray-400">暂无公开笔记</p>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {sortedNotes.map((note, i) => (
              <div
                key={note.id}
                draggable={sort === 'custom' && isLocalhost()}
                onDragStart={() => sort === 'custom' && isLocalhost() && handleNoteDragStart(i)}
                onDragOver={(e) => sort === 'custom' && isLocalhost() && handleNoteDragOver(e)}
                onDrop={(e) => sort === 'custom' && isLocalhost() && handleNoteDrop(e, i)}
                onDragEnd={() => setNoteDragIdx(null)}
                className={noteDragIdx === i ? 'opacity-40' : ''}
              >
                <NoteCard
                  id={note.id}
                  title={note.title}
                  content={note.content}
                  tags={note.tags}
                  imageCount={note.images.length}
                  published={note.published}
                  updatedAt={note.updatedAt}
                  onDelete={handleDeleteNote}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New folder — only on localhost */}
      {isLocalhost() && (
      <div className="mt-6">
        {showNewFolder ? (
          <div className="flex gap-2">
            <input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              placeholder="文件夹名称"
              className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-lg
                         focus:outline-none focus:border-blue-300"
              autoFocus
            />
            <button
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim()}
              className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg
                         hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              创建
            </button>
            <button
              onClick={() => { setShowNewFolder(false); setNewFolderName(''); }}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              取消
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowNewFolder(true)}
            className="text-sm text-blue-500 hover:text-blue-600 transition-colors"
          >
            + 新建文件夹
          </button>
        )}
      </div>
      )}
    </div>
  );
}
