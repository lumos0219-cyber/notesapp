import { Outlet, useLocation } from 'react-router-dom';

function navTo(hash: string) {
  if (sessionStorage.getItem('klog_dirty')) {
    const ok = confirm('有未保存的修改，确定要离开吗？');
    if (!ok) return;
    sessionStorage.removeItem('klog_dirty');
  }
  window.location.hash = hash;
}

export default function Layout() {
  const location = useLocation();
  const isRoot = location.pathname === '/';
  const isAll = location.pathname === '/all';

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-white border-b border-blue-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <a
            href="#/"
            onClick={(e) => { e.preventDefault(); navTo('#/'); }}
            className="text-xl font-bold no-underline font-mono tracking-wide
                       bg-gradient-to-r from-blue-700 to-blue-400 bg-clip-text text-transparent"
          >
            Klog
          </a>
          <div className="flex gap-1">
            <a
              href="#/"
              onClick={(e) => { e.preventDefault(); navTo('#/'); }}
              className={`text-sm px-3 py-1.5 rounded-lg no-underline transition-colors ${
                isRoot || location.pathname.startsWith('/?folder=')
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              文件夹
            </a>
            <a
              href="#/all"
              onClick={(e) => { e.preventDefault(); navTo('#/all'); }}
              className={`text-sm px-3 py-1.5 rounded-lg no-underline transition-colors ${
                isAll
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              全部笔记
            </a>
          </div>
        </div>
      </nav>
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
