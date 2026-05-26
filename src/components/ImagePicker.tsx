import { useRef, useState } from 'react';

interface Props {
  images: string[];
  onChange: (images: string[]) => void;
}

export default function ImagePicker({ images, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const handleFiles = (files: FileList) => {
    const readers: Promise<string>[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        readers.push(
          new Promise((resolve) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result as string);
            r.readAsDataURL(file);
          })
        );
      }
    }
    Promise.all(readers).then((newImages) => {
      onChange([...images, ...newImages]);
    });
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, _index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragIndex === null || dragIndex === dropIndex) return;

    const reordered = [...images];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(dropIndex, 0, moved);
    onChange(reordered);
    setDragIndex(null);
  };

  return (
    <div>
      <div
        onDrop={handleFileDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center
                   cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
      >
        <div className="text-3xl mb-1">🖼️</div>
        <p className="text-sm text-gray-500">点击或拖拽上传照片</p>
        <p className="text-xs text-gray-400 mt-0.5">支持多选</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mt-3">
          {images.map((img, i) => (
            <div
              key={i}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDrop={(e) => handleDrop(e, i)}
              onDragEnd={() => setDragIndex(null)}
              className={`relative group cursor-grab active:cursor-grabbing ${
                dragIndex === i ? 'opacity-40' : ''
              }`}
            >
              <img
                src={img}
                alt={`第${i + 1}页`}
                className="w-full h-24 object-cover rounded-lg border border-gray-100"
              />
              {/* Page number */}
              <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px]
                               px-1.5 py-0.5 rounded font-medium leading-tight">
                {i + 1}
              </span>
              {/* Delete button */}
              <button
                onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                className="absolute top-1 right-1 w-5 h-5 bg-black/50 text-white text-xs
                           rounded-full opacity-0 group-hover:opacity-100 transition-opacity
                           flex items-center justify-center"
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
