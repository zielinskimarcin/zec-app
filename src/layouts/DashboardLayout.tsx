import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { Sparkles, LayoutDashboard, Search, Mail, Database, Settings, Bell, ChevronDown, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';

const navigation = [
  { name: 'Dashboard', href: '/app', icon: LayoutDashboard },
  { name: 'Wyszukiwarka', href: '/app/prospecting', icon: Search },
  { name: 'Kampanie', href: '/app/campaigns', icon: Mail },
  { name: 'Leady', href: '/app/leads', icon: Database },
  { name: 'Ustawienia', href: '/app/settings', icon: Settings },
];

export function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Funkcja wylogowywania
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

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

              {/* User Menu z Dropdownem */}
              <div className="relative">
                <button 
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-all group"
                >
                  <div className="size-8 bg-white/10 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">JK</span>
                  </div>
                  <ChevronDown className={`size-4 text-gray-400 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : 'group-hover:text-white'}`} />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <>
                    {/* Niewidzialna warstwa do zamykania menu po kliknięciu w tło */}
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsUserMenuOpen(false)} 
                    />
                    
                    <div className="absolute right-0 mt-2 w-48 bg-[#0f0f0f] border border-white/10 rounded-xl shadow-2xl py-1 z-50 overflow-hidden">
                      <Link
                        to="/app/settings"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <Settings className="size-4" />
                        Ustawienia konta
                      </Link>
                      
                      <div className="h-px bg-white/10 my-1" />
                      
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut className="size-4" />
                        Wyloguj się
                      </button>
                    </div>
                  </>
                )}
              </div>

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