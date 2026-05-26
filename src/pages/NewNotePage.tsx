import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '../db';
import type { Folder, Attachment } from '../types';
import { generateId } from '../lib/uuid';
import ImagePicker from '../components/ImagePicker';
import AttachmentPicker from '../components/AttachmentPicker';
import TagInput from '../components/TagInput';
import RichTextEditor from '../components/RichTextEditor';

export default function NewNotePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedFolder = searchParams.get('folder') || null;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [folderId, setFolderId] = useState<string | null>(preselectedFolder);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    db.folders.toArray().then(setFolders);
  }, []);

  const handleSave = async () => {
    if (!title.trim() && !content.trim() && images.length === 0 && attachments.length === 0) {
      alert('请至少添加标题、摘录内容、照片或附件');
      return;
    }
    setSaving(true);
    const id = generateId();
    const now = Date.now();
    await db.notes.add({
      id,
      title: title.trim(),
      content,
      images,
      attachments,
      folderId,
      tags,
      createdAt: now,
      updatedAt: now,
    });
    navigate(folderId ? `/?folder=${folderId}` : '/');
  };

  // Build folder options with indentation for hierarchy
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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← 返回
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-500 text-white px-5 py-1.5 rounded-lg text-sm font-medium
                     hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>

      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="笔记标题"
        className="w-full text-lg font-semibold text-gray-800 px-3 py-2 bg-transparent
                   border-b border-gray-100 focus:outline-none focus:border-blue-300
                   placeholder:text-gray-300"
      />

      {/* Summary editor */}
      <div>
        <RichTextEditor content={content} onChange={setContent} />
      </div>

      {/* Photos */}
      <div>
        <p className="text-sm text-gray-500 mb-2">照片</p>
        <ImagePicker images={images} onChange={setImages} />
      </div>

      {/* Attachments */}
      <div>
        <p className="text-sm text-gray-500 mb-2">附件</p>
        <AttachmentPicker attachments={attachments} onChange={setAttachments} />
      </div>

      {/* Tags */}
      <div>
        <p className="text-sm text-gray-500 mb-2">标签</p>
        <TagInput tags={tags} onChange={setTags} />
      </div>

      {/* Folder selector */}
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

      <div className="h-4" />
    </div>
  );
}
