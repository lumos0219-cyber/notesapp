import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../db';
import type { Note, Folder, Attachment } from '../types';
import RichTextEditor from '../components/RichTextEditor';
import TagInput from '../components/TagInput';
import AttachmentPicker, { openAttachment } from '../components/AttachmentPicker';
import { isLocalhost } from '../lib/env';

export default function EditNotePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [readonly, setReadonly] = useState(!isLocalhost());
  const [published, setPublished] = useState(false);

  useEffect(() => {
    if (!id) return;
    db.notes.get(id).then((n) => {
      if (n) {
        setNote(n);
        setTitle(n.title);
        setContent(n.content);
        setImages(n.images || []);
        setAttachments(n.attachments || []);
        setTags(n.tags || []);
        setFolderId(n.folderId);
        setPublished(n.published || false);
      }
    });
    db.folders.toArray().then(setFolders);
  }, [id]);

  const handleSave = async () => {
    if (!note) return;
    setSaving(true);
    try {
      await db.notes.update(note.id, {
        title: title || '未命名笔记',
        content,
        images,
        attachments,
        tags,
        folderId,
        published,
        updatedAt: Date.now(),
      });
      setToast('保存成功');
    } catch (err) {
      console.error('[NoteSnap] Failed to save:', err);
      setToast('保存失败');
    } finally {
      setSaving(false);
      setTimeout(() => setToast(''), 2000);
    }
  };

  const handleBack = () => {
    navigate(folderId ? `/?folder=${folderId}` : '/');
  };

  const buildOptions = (
    parentId: string | null,
    depth: number
  ): { id: string | null; label: string }[] => {
    const result: { id: string | null; label: string }[] = [];
    if (depth === 0) {
      result.push({ id: null, label: '根目录（无文件夹）' });
    }
    folders
      .filter((f) => f.parentId === parentId)
      .forEach((f) => {
        result.push({ id: f.id, label: '  '.repeat(depth + 1) + '📁 ' + f.name });
        result.push(...buildOptions(f.id, depth + 1));
      });
    return result;
  };

  if (!note) {
    return (
      <div className="text-center py-20 text-gray-400">
        笔记不存在
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Top bar: back, mode toggle, save */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleBack}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← 返回
        </button>
        <div className="flex items-center gap-3">
          {toast && (
            <span className="text-sm text-green-600 font-medium">{toast}</span>
          )}
          <button
            onClick={() => setPublished(!published)}
            className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
              published
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-400 hover:text-gray-600'
            }`}
          >
            {published ? '已公开' : '私密'}
          </button>
          {/* Edit / Read-only segmented control */}
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setReadonly(false)}
              className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                !readonly
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              编辑
            </button>
            <button
              onClick={() => setReadonly(true)}
              className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                readonly
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              只读
            </button>
          </div>
          {!readonly && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-500 text-white px-5 py-1.5 rounded-lg text-sm font-medium
                         hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {saving ? '保存中...' : '保存'}
            </button>
          )}
        </div>
      </div>

      {/* Title */}
      {readonly ? (
        <h1 className="text-2xl font-bold text-gray-800">
          {title || '未命名笔记'}
        </h1>
      ) : (
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="笔记标题"
          className="w-full text-lg font-semibold text-gray-800 px-3 py-2 bg-transparent
                     border-b border-gray-100 focus:outline-none focus:border-blue-300
                     placeholder:text-gray-300"
        />
      )}

      {/* Summary */}
      <div>
        {!readonly && (
          <p className="text-sm text-gray-400 mb-2">摘录 & 要点</p>
        )}
        <RichTextEditor
          content={content}
          onChange={setContent}
          readonly={readonly}
        />
      </div>

      {/* Photos */}
      {images.length > 0 && (
        <div>
          {readonly ? (
            <p className="text-sm text-gray-500 mb-2">照片 ({images.length})</p>
          ) : (
            <p className="text-sm text-gray-500 mb-2">
              照片 ({images.length}) — 拖拽可调整顺序
            </p>
          )}
          <div className="grid grid-cols-3 gap-2">
            {images.map((img, i) => (
              <div
                key={i}
                draggable={!readonly}
                onDragStart={() => !readonly && setDragIdx(i)}
                onDragOver={(e) => {
                  if (!readonly) {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                  }
                }}
                onDrop={(e) => {
                  if (readonly) return;
                  e.preventDefault();
                  if (dragIdx === null || dragIdx === i) return;
                  const reordered = [...images];
                  const [moved] = reordered.splice(dragIdx, 1);
                  reordered.splice(i, 0, moved);
                  setImages(reordered);
                  setDragIdx(null);
                }}
                onDragEnd={() => setDragIdx(null)}
                className={`relative ${!readonly ? 'group cursor-grab active:cursor-grabbing' : ''} ${
                  dragIdx === i ? 'opacity-40' : ''
                }`}
              >
                <img
                  src={img}
                  alt={`第${i + 1}页`}
                  className="w-full h-24 object-cover rounded-lg border border-gray-100"
                />
                <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px]
                                 px-1.5 py-0.5 rounded font-medium leading-tight">
                  {i + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attachments */}
      {(attachments.length > 0 || !readonly) && (
        <div>
          <p className="text-sm text-gray-500 mb-2">
            附件{attachments.length > 0 ? ` (${attachments.length})` : ''}
          </p>
          {readonly ? (
            <div className="space-y-1.5">
              {attachments.map((a) => (
                <div
                  key={a.id}
                  onClick={() => openAttachment(a)}
                  className="flex items-center gap-3 bg-white rounded-lg border border-gray-100
                             px-3 py-2.5 cursor-pointer hover:bg-gray-50 hover:border-blue-200
                             transition-colors"
                >
                  <span className="text-lg">{a.type.includes('pdf') ? '📄' : '📝'}</span>
                  <div>
                    <p className="text-sm text-gray-700">{a.name}</p>
                    <p className="text-xs text-gray-400">
                      {(a.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <AttachmentPicker attachments={attachments} onChange={setAttachments} />
          )}
        </div>
      )}

      {/* Tags + Folder (edit mode only) */}
      {!readonly && (
        <>
          <div>
            <p className="text-sm text-gray-500 mb-2">标签</p>
            <TagInput tags={tags} onChange={setTags} />
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-2">所属文件夹</p>
            <select
              value={folderId ?? ''}
              onChange={(e) => setFolderId(e.target.value || null)}
              className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg
                         focus:outline-none focus:border-blue-300 bg-white"
            >
              {buildOptions(null, 0).map((opt) => (
                <option key={opt.id ?? '__root'} value={opt.id ?? ''}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      <div className="h-4" />
    </div>
  );
}
