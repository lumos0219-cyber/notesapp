import { Link } from 'react-router-dom';

interface Crumb {
  id: string | null;
  name: string;
}

interface Props {
  path: Crumb[];
}

export default function BreadcrumbNav({ path }: Props) {
  return (
    <div className="flex items-center gap-1.5 text-sm mb-4 flex-wrap">
      {path.map((crumb, i) => (
        <span key={crumb.id ?? 'root'} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-gray-300">›</span>}
          {i === path.length - 1 ? (
            <span className="text-blue-600 font-medium">{crumb.name}</span>
          ) : (
            <Link
              to={crumb.id ? `/?folder=${crumb.id}` : '/'}
              className="text-gray-400 hover:text-gray-600 no-underline transition-colors"
            >
              {crumb.name}
            </Link>
          )}
        </span>
      ))}
    </div>
  );
}
