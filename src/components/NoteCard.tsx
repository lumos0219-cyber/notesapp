import { Link } from 'react-router-dom';

interface Props {
  id: string;
  title: string;
  content: string;
  tags: string[];
  imageCount: number;
  updatedAt: number;
  onDelete: (id: string) => void;
}

function stripPreview(html: string, maxLen = 80): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  const text = div.textContent || '';
  return text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
}

export default function NoteCard({ id, title, content, tags, imageCount, updatedAt, onDelete }: Props) {
  const date = new Date(updatedAt).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('确定删除这条笔记吗？')) {
      onDelete(id);
    }
  };

  return (
    <Link
      to={`/notes/${id}/edit`}
      className="group block bg-white rounded-xl p-4 border border-gray-100 shadow-sm
                 hover:shadow-md hover:border-blue-200 transition-all no-underline relative"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-800 truncate">
            {title || '未命名笔记'}
          </h3>
          <p className="text-sm text-gray-400 mt-1 line-clamp-2">
            {stripPreview(content) || '无摘录'}
          </p>
        </div>
        <button
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500
                     transition-all text-lg leading-none px-1"
          title="删除"
        >
          ×
        </button>
      </div>
      <div className="flex items-center gap-2 mt-3">
        <span className="text-xs text-gray-300">{date}</span>
        {imageCount > 0 && (
          <span className="text-xs text-gray-300">📷 {imageCount}</span>
        )}
        {tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="text-xs bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded"
          >
            {tag}
          </span>
        ))}
      </div>
    </Link>
  );
}
