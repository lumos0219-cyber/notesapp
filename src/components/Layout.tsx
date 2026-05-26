import { Link, Outlet, useLocation } from 'react-router-dom';

export default function Layout() {
  const location = useLocation();
  const isRoot = location.pathname === '/';
  const isAll = location.pathname === '/all';

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-white border-b border-blue-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="text-lg no-underline font-mono tracking-wide">
            <span className="font-bold text-blue-600">K</span><span className="font-normal text-blue-400">log</span>
          </Link>
          <div className="flex gap-1">
            <Link
              to="/"
              className={`text-sm px-3 py-1.5 rounded-lg no-underline transition-colors ${
                isRoot || location.pathname.startsWith('/?folder=')
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              文件夹
            </Link>
            <Link
              to="/all"
              className={`text-sm px-3 py-1.5 rounded-lg no-underline transition-colors ${
                isAll
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              全部笔记
            </Link>
          </div>
        </div>
      </nav>
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
