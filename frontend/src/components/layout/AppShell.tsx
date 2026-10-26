import { Home } from 'lucide-react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { PageTransition } from '@/components/transitions/PageTransition';
export function AppShell() {
  const { pathname } = useLocation(),
    { data: user } = useAuth();
  const locked = /\/plan$|\/setup\/[34]$|^\/runs\//.test(pathname);
  const expertArea = pathname.startsWith('/experts');
  return (
    <div
      className={`${locked ? 'h-dvh overflow-hidden [contain:layout_paint]' : 'min-h-dvh'} flex flex-col`}
    >
      <a
        href="#main-content"
        className="sr-only z-50 focus:not-sr-only focus:absolute focus:bg-n0 focus:p-3"
      >
        Chuyển đến nội dung
      </a>
      <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-n2 bg-n0 px-4 sm:px-8">
        <div className="flex min-w-0 items-center gap-4">
          <Link
            to="/"
            className="flex shrink-0 items-center gap-2 text-xl font-bold tracking-tight"
            aria-label="DPrism — về trang chủ"
          >
            <img src="/logo.svg" alt="" className="h-7 w-6" />
            DPrism
          </Link>
          {pathname !== '/' && (
            <>
              <NavLink
                to="/"
                aria-label="Về trang chủ"
                className="inline-flex items-center gap-2 rounded-md border border-n2 bg-n1 px-3 py-2 text-xs font-semibold text-n5"
              >
                <Home size={15} />
                <span className="hidden sm:inline">Về trang chủ</span>
              </NavLink>
              <NavLink
                className="hidden border-l border-n2 pl-4 text-sm text-n4 md:block"
                to={expertArea ? '/experts' : '/cases'}
              >
                {expertArea ? 'Chuyên gia AI' : 'Cases'}
              </NavLink>
            </>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {import.meta.env.VITE_ENABLE_MOCKS === 'true' && (
            <span className="rounded border border-n2 px-2 py-1 text-[11px] text-n4">
              Dữ liệu mô phỏng
            </span>
          )}
          <span className="hidden text-xs text-n4 sm:block">VI</span>
          <span
            title={user?.name}
            className="grid h-8 w-8 place-items-center rounded-full bg-n1 text-xs font-semibold text-n5"
          >
            {user?.name.slice(0, 2).toUpperCase()}
          </span>
        </div>
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className={`mx-auto flex w-full max-w-[1600px] flex-1 flex-col px-4 py-5 outline-none sm:px-8 sm:py-6 ${locked ? 'min-h-0' : ''}`}
      >
        <PageTransition key={pathname} className={locked ? 'flex min-h-0 flex-1 flex-col' : ''}>
          <Outlet />
        </PageTransition>
      </main>
    </div>
  );
}
