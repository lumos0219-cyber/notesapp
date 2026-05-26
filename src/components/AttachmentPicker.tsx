import { useRef } from 'react';
import type { Attachment } from '../types';
import { generateId } from '../lib/uuid';

interface Props {
  attachments: Attachment[];
  onChange: (attachments: Attachment[]) => void;
}

const MB = 1024 * 1024;
const ACCEPTED = '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

function formatSize(bytes: number): string {
  if (bytes < MB) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / MB).toFixed(1)} MB`;
}

function fileIcon(type: string): string {
  if (type.includes('pdf')) return '📄';
  if (type.includes('word') || type.includes('doc')) return '📝';
  return '📎';
}

export function openAttachment(a: Attachment) {
  // Convert base64 data URL to blob and open in new tab
  const base64 = a.data.split(',')[1] || a.data;
  const byteChars = atob(base64);
  const byteNums = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNums[i] = byteChars.charCodeAt(i);
  }
  const blob = new Blob([new Uint8Array(byteNums)], { type: a.type || 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  // Revoke after a delay so the browser has time to load
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export default function AttachmentPicker({ attachments, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList) => {
    const readers: Promise<Attachment>[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      readers.push(
        new Promise((resolve) => {
          const r = new FileReader();
          r.onload = () => resolve({
            id: generateId(),
            name: file.name,
            type: file.type,
            size: file.size,
            data: r.result as string,
          });
          r.readAsDataURL(file);
        })
      );
    }
    Promise.all(readers).then((newAttachments) => {
      onChange([...attachments, ...newAttachments]);
    });
  };

  const removeAttachment = (id: string) => {
    onChange(attachments.filter((a) => a.id !== id));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  };

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center
                   cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
      >
        <div className="text-2xl mb-1">📎</div>
        <p className="text-sm text-gray-500">点击或拖拽上传 PDF / Word</p>
        <p className="text-xs text-gray-400 mt-0.5">超过 10MB 的文件将自动作为附件存储</p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {attachments.length > 0 && (
        <div className="space-y-1.5 mt-3">
          {attachments.map((a) => (
            <div
              key={a.id}
              onClick={() => openAttachment(a)}
              className="flex items-center gap-3 bg-white rounded-lg border border-gray-100
                         px-3 py-2.5 group hover:border-blue-200 transition-colors
                         cursor-pointer hover:bg-gray-50"
            >
              <span className="text-lg">{fileIcon(a.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 truncate">{a.name}</p>
                <p className="text-xs text-gray-400">
                  {formatSize(a.size)}
                  {a.size > 10 * MB && (
                    <span className="text-yellow-600 ml-1">大文件</span>
                  )}
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); removeAttachment(a.id); }}
                className="text-gray-300 hover:text-red-500 transition-colors text-sm
                           opacity-0 group-hover:opacity-100"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
