import { Link, Outlet, useLocation } from 'react-router';
import { Sparkles, LayoutDashboard, Search, Mail, Database, Settings, Bell, ChevronDown } from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/app', icon: LayoutDashboard },
  { name: 'Wyszukiwarka', href: '/app/prospecting', icon: Search },
  { name: 'Kampanie', href: '/app/campaigns', icon: Mail },
  { name: 'Leady', href: '/app/leads', icon: Database },
  { name: 'Ustawienia', href: '/app/settings', icon: Settings },
];

export function DashboardLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="size-7 bg-white rounded-md flex items-center justify-center">
                <Sparkles className="size-4 text-black fill-black" />
              </div>
              <span className="text-xl font-bold text-white">ZEC</span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      isActive
                        ? 'bg-white/10 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <item.icon className="size-4" />
                    <span className="text-sm font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Right side - Notifications & User */}
            <div className="flex items-center gap-3">
              {/* Notifications */}
              <button className="relative p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-all">
                <Bell className="size-5" />
                <span className="absolute top-1.5 right-1.5 size-2 bg-red-500 rounded-full" />
              </button>

              {/* User Menu */}
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-all group">
                <div className="size-8 bg-white/10 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">JK</span>
                </div>
                <ChevronDown className="size-4 text-gray-400 group-hover:text-white transition-colors" />
              </button>

              {/* Upgrade Button */}
              <Link
                to="/app/settings"
                className="hidden lg:block px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition-all text-sm"
              >
                Upgrade
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
