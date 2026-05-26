import { useEffect, useState } from 'react';
import { db } from '../db';
import type { PublishLogEntry } from '../types';

export default function PublishHistoryPage() {
  const [logs, setLogs] = useState<PublishLogEntry[]>([]);

  useEffect(() => {
    db.publishLog.orderBy('timestamp').reverse().toArray().then(setLogs);
  }, []);

  const handleRollback = async (entry: PublishLogEntry) => {
    if (!confirm(`回退到 ${new Date(entry.timestamp).toLocaleString('zh-CN')} 的版本？这将覆盖当前公开内容。`)) return;

    // Reload current manifest
    let currentManifest: any = { notes: {}, folders: {} };
    try {
      const resp = await fetch('/data/manifest.json');
      if (resp.ok) currentManifest = await resp.json();
    } catch { /* ok */ }

    // Calculate changes: old snapshot notes that are no longer in current
    const oldNoteIds = Object.keys(entry.snapshot.notes);
    const removedNoteIds = Object.keys(currentManifest.notes).filter(
      (id) => !oldNoteIds.includes(id)
    );

    // Fetch old note data from the deployed files
    const newNotes: any[] = [];
    for (const id of oldNoteIds) {
      try {
        const resp = await fetch(`./data/notes/${id}.json`);
        if (resp.ok) {
          const note = await resp.json();
          newNotes.push(note);
        }
      } catch { /* skip */ }
    }

    try {
      const resp = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newNotes, modifiedNotes: [], removedNoteIds, folders: undefined }),
      });
      const result = await resp.json();
      if (result.ok) {
        alert('已回退！运行 npm run deploy 即可上线。');
      } else {
        alert('回退失败：' + (result.error || '未知错误'));
      }
    } catch {
      alert('回退失败，请重试');
    }
  };

  if (logs.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400 text-sm">暂无发布记录</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-lg font-bold text-gray-800 mb-4">发布历史</h1>
      <div className="space-y-2">
        {logs.map((entry) => (
          <div
            key={entry.id}
            className="bg-white rounded-lg border border-gray-100 px-4 py-3 flex items-center justify-between"
          >
            <div>
              <p className="text-sm text-gray-700">
                {new Date(entry.timestamp).toLocaleString('zh-CN')}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {entry.folderCount} 个文件夹，{entry.noteCount} 条笔记
              </p>
            </div>
            <button
              onClick={() => handleRollback(entry)}
              className="text-xs text-blue-500 hover:text-blue-700 transition-colors"
            >
              回退
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
