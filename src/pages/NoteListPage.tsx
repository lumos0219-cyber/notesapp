import { useEffect, useState, useCallback } from 'react';
import { db } from '../db';
import type { Note } from '../types';
import NoteCard from '../components/NoteCard';
import EmptyState from '../components/EmptyState';

export default function NoteListPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbStats, setDbStats] = useState('');

  const loadNotes = useCallback(() => {
    db.notes.orderBy('updatedAt').reverse().toArray()
      .then(async (list) => {
        console.log('[NoteSnap] Loaded', list.length, 'notes');
        if (list.length > 0) {
          console.log('[NoteSnap] Note IDs:', list.map((n) => n.id.slice(0, 8)));
        }
        const dump = await db.debugDump();
        console.log('[NoteSnap] DB state on list load:', dump);
        setDbStats(dump);
        setNotes(list);
      })
      .catch((err) => {
        console.error('[NoteSnap] Failed to load notes:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // Re-fetch when the page becomes visible (tab focus, navigation back)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        loadNotes();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [loadNotes]);

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-4 animate-pulse text-blue-500">📝</div>
        <p className="text-gray-400">加载中...</p>
      </div>
    );
  }

  if (notes.length === 0) return <EmptyState />;

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">我的笔记</h1>
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          id={note.id}
          title={note.title}
          content={note.content}
          tags={note.tags}
          imageCount={note.images.length}
          updatedAt={note.updatedAt}
          onDelete={() => {}}
        />
      ))}
      <details className="mt-6">
        <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-500">
          调试信息
        </summary>
        <pre className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 mt-2 overflow-x-auto whitespace-pre-wrap">
          {dbStats || '暂无数据'}
        </pre>
      </details>
    </div>
  );
}
