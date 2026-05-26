import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../db';
import type { Note } from '../types';
import NoteCard from '../components/NoteCard';
import { isLocalhost } from '../lib/env';
import { exportAll, importData } from '../lib/transfer';

type SortMode = 'updated-desc' | 'updated-asc' | 'title-asc';

export default function AllNotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [sort, setSort] = useState<SortMode>('updated-desc');
  const importRef = useRef<HTMLInputElement>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const result = await importData(text);
      alert(`导入完成：${result.foldersAdded} 个文件夹，${result.notesAdded} 条笔记${result.notesSkipped > 0 ? `，${result.notesSkipped} 条跳过（重复）` : ''}`);
      loadNotes();
    } catch (err) {
      alert(err instanceof Error ? err.message : '导入失败');
    }
    // Reset input so same file can be re-imported
    e.target.value = '';
  };

  const loadNotes = useCallback(() => {
    db.notes.orderBy('updatedAt').reverse().toArray().then((list) => {
      setNotes(list);
      const tagSet = new Set<string>();
      list.forEach((n) => n.tags?.forEach((t) => tagSet.add(t)));
      setAllTags([...tagSet].sort());
    });
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleDelete = async (id: string) => {
    await db.notes.delete(id);
    loadNotes();
  };

  const handlePublish = async () => {
    const allFolders = await db.folders.toArray();
    const allNotes = await db.notes.toArray();
    const publishedFolders = allFolders.filter((f) => f.published);
    const publishedFolderIds = new Set(publishedFolders.map((f) => f.id));

    // Collect descendant folder IDs
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

    // Include ancestor folders needed for tree structure
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

    try {
      const resp = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folders: allFolders.filter((f) => neededFolderIds.has(f.id)),
          notes: publishedNotes,
        }),
      });
      if (resp.ok) {
        alert('已生成 published.json！在终端运行 npm run deploy 即可上线。');
      } else {
        alert('发布失败');
      }
    } catch {
      alert('无法连接发布服务，请确认在 localhost 运行');
    }
  };

  const filtered = activeTag
    ? notes.filter((n) => n.tags?.includes(activeTag))
    : notes;

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'updated-desc') return b.updatedAt - a.updatedAt;
    if (sort === 'updated-asc') return a.updatedAt - b.updatedAt;
    if (sort === 'title-asc') return (a.title || '未命名').localeCompare(b.title || '未命名');
    return 0;
  });

  const sortLabel: Record<SortMode, string> = {
    'updated-desc': '最近更新',
    'updated-asc': '最早更新',
    'title-asc': 'A-Z',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-gray-800">全部笔记</h1>
        <div className="flex items-center gap-2">
          {isLocalhost() && (
            <>
              <button
                onClick={handlePublish}
                className="text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors"
              >
                发布
              </button>
              <button
                onClick={exportAll}
                className="text-xs text-gray-500 hover:text-blue-600 transition-colors"
              >
                导出
              </button>
              <button
                onClick={() => importRef.current?.click()}
                className="text-xs text-gray-500 hover:text-blue-600 transition-colors"
              >
                导入
              </button>
              <input
                ref={importRef}
                type="file"
                accept=".klog,application/json"
                className="hidden"
                onChange={handleImport}
              />
              <Link
                to="/notes/new"
                className="bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium
                           hover:bg-blue-600 transition-colors no-underline"
              >
                + 新笔记
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Tags filter */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          <button
            onClick={() => setActiveTag(null)}
            className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
              !activeTag
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            全部
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag === activeTag ? null : tag)}
              className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                tag === activeTag
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Sort */}
      <div className="flex gap-1 mb-4">
        {(['updated-desc', 'updated-asc', 'title-asc'] as SortMode[]).map((m) => (
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

      {/* Notes list */}
      {sorted.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-sm">
            {activeTag ? `没有「${activeTag}」标签的笔记` : '还没有笔记'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {sorted.map((note) => (
            <NoteCard
              key={note.id}
              id={note.id}
              title={note.title}
              content={note.content}
              tags={note.tags || []}
              imageCount={note.images.length}
                  published={note.published}
              updatedAt={note.updatedAt}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
