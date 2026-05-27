import { NavLink, Outlet } from 'react-router-dom';
import { Dumbbell, Apple, Users, LogOut, LayoutDashboard, BarChart2, ListChecks, Ticket, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { logout } from '@/lib/auth-api';

const NAV_ITEMS = [
  { to: '/dashboard', icon: BarChart2, label: 'Tổng quan' },
  { to: '/exercises', icon: Dumbbell, label: 'Bài tập' },
  { to: '/programs', icon: ListChecks, label: 'Chương trình' },
  { to: '/food-items', icon: Apple, label: 'Thực phẩm' },
  { to: '/campaigns', icon: Ticket, label: 'Mã scan AI' },
  { to: '/ratings', icon: Star, label: 'Đánh giá' },
  { to: '/users', icon: Users, label: 'Người dùng' },
];

export function AppShell() {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-56 border-r bg-card flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5" />
            <span className="font-semibold text-sm">Ủ Admin</span>
          </div>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-2 border-t">
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm w-full text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
