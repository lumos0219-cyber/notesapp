import { Link } from 'react-router-dom';

export default function EmptyState() {
  return (
    <div className="text-center py-20">
      <div className="text-6xl mb-4">📝</div>
      <h2 className="text-xl font-medium text-gray-700 mb-2">还没有笔记</h2>
      <p className="text-gray-400 mb-6">拍下你的纸质笔记，自动转为电子版</p>
      <Link
        to="/notes/new"
        className="inline-block bg-blue-500 text-white px-6 py-3 rounded-xl text-base font-medium
                   hover:bg-blue-600 transition-colors no-underline"
      >
        创建第一条笔记
      </Link>
    </div>
  );
}
