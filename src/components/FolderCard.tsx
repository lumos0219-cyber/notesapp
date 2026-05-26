import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

const COLORS = [
  { value: '', label: '默认' },
  { value: '#E3F2FD', label: '淡蓝' },
  { value: '#E8F5E9', label: '淡绿' },
  { value: '#EDE7F6', label: '淡紫' },
  { value: '#FFF9C4', label: '淡黄' },
  { value: '#FCE4EC', label: '淡粉' },
  { value: '#E0F2F1', label: '淡青' },
];

interface Props {
  id: string;
  name: string;
  color?: string;
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string, deleteContents: boolean) => void;
  onColor: (id: string, color: string) => void;
}

export default function FolderCard({ id, name, color, onRename, onDelete, onColor }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(name);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const handleStartRename = () => {
    setMenuOpen(false);
    setEditing(true);
    setEditName(name);
    setTimeout(() => inputRef.current?.select(), 50);
  };

  const handleConfirmRename = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== name) {
      onRename(id, trimmed);
    }
    setEditing(false);
  };

  const handleDelete = () => {
    setMenuOpen(false);
    const deleteAll = confirm(
      `删除文件夹「${name}」？\n\n确定：同时删除文件夹内的所有笔记和子文件夹\n取消：仅删除文件夹，笔记和子文件夹移到上层`
    );
    onDelete(id, deleteAll);
  };

  return (
    <div
      className="flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors group relative"
      style={color ? { backgroundColor: color, borderColor: color } : {}}
    >
      <Link
        to={`/?folder=${id}`}
        className="flex items-center gap-3 flex-1 min-w-0 no-underline"
        onClick={(e) => { if (editing) e.preventDefault(); }}
      >
        <span className="text-xl">📁</span>
        {editing ? (
          <input
            ref={inputRef}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleConfirmRename();
              if (e.key === 'Escape') setEditing(false);
            }}
            onBlur={handleConfirmRename}
            onClick={(e) => e.stopPropagation()}
            className="text-sm font-medium bg-white/80 rounded px-2 py-0.5 border border-gray-200
                       focus:outline-none focus:border-blue-300 w-full"
          />
        ) : (
          <span className="text-sm font-medium text-gray-700 truncate">{name}</span>
        )}
      </Link>

      {/* ⋮ Menu button */}
      <div ref={menuRef} className="relative shrink-0">
        <button
          onClick={(e) => { e.preventDefault(); setMenuOpen(!menuOpen); }}
          className="w-6 h-6 flex items-center justify-center rounded text-gray-400
                     hover:text-gray-600 hover:bg-gray-200/50 transition-colors
                     opacity-0 group-hover:opacity-100 text-lg leading-none"
        >
          ⋮
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-7 w-40 bg-white rounded-lg shadow-lg border
                          border-gray-200 py-1 z-20">
            <button
              onClick={handleStartRename}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50
                         transition-colors"
            >
              重命名
            </button>
            <button
              onClick={handleDelete}
              className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50
                         transition-colors"
            >
              删除
            </button>
            <div className="border-t border-gray-100 mt-1 pt-1">
              <p className="text-xs text-gray-400 px-3 mb-1">颜色</p>
              <div className="flex gap-1.5 px-3 pb-1.5 flex-wrap">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => { onColor(id, c.value); setMenuOpen(false); }}
                    title={c.label}
                    className="w-5 h-5 rounded-full border-2 transition-colors"
                    style={{
                      backgroundColor: c.value || '#fff',
                      borderColor: color === c.value || (!color && !c.value) ? '#1976D2' : '#e5e7eb',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
