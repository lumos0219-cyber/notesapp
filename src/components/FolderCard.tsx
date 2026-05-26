import { Link } from 'react-router-dom';

interface Props {
  id: string;
  name: string;
}

export default function FolderCard({ id, name }: Props) {
  return (
    <Link
      to={`/?folder=${id}`}
      className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3
                 hover:bg-blue-100 hover:border-blue-200 transition-colors no-underline"
    >
      <span className="text-xl">📁</span>
      <span className="text-sm font-medium text-gray-700">{name}</span>
    </Link>
  );
}
