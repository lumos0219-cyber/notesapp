import { useRef } from 'react';

interface Props {
  onUpload: (file: File) => void;
}

export default function UploadZone({ onUpload }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      onUpload(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onClick={() => inputRef.current?.click()}
      className="border-2 border-dashed border-blue-200 rounded-2xl p-12 text-center
                 cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
    >
      <div className="text-5xl mb-3">📷</div>
      <p className="text-gray-600 font-medium mb-1">点击上传或拖拽照片到此处</p>
      <p className="text-sm text-gray-400">支持 JPG、PNG 格式</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
