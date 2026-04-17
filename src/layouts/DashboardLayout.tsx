import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { LayoutDashboard, Search, Mail, Database, Settings, Bell, ChevronDown, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { OnboardingProvider, useOnboarding } from '../contexts/OnboardingContext';
import { OnboardingSandbox } from '../components/OnboardingSandbox';

const NAV_ITEMS = [
  { name: 'Dashboard',    href: '/app',             icon: LayoutDashboard },
  { name: 'Wyszukiwarka', href: '/app/prospecting', icon: Search },
  { name: 'Kampanie',     href: '/app/campaigns',   icon: Mail },
  { name: 'Leady',        href: '/app/leads',       icon: Database },
  { name: 'Ustawienia',   href: '/app/settings',    icon: Settings },
];

// During sandbox: step 2 highlights Wyszukiwarka, step 4 highlights Kampanie
const SANDBOX_HIGHLIGHT: Record<number, string> = {
  2: '/app/prospecting',
  4: '/app/campaigns',
};

function NavBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { sandboxStep, needsOnboarding } = useOnboarding();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [initials, setInitials] = useState('..');

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase.from('profiles').select('full_name').eq('id', session.user.id).single();
        if (data?.full_name) {
          const names = data.full_name.trim().split(' ');
          const first = names[0]?.[0] || '';
          const last = names.length > 1 ? names[names.length - 1]?.[0] : '';
          setInitials((first + last).toUpperCase());
        } else if (session.user.email) {
          setInitials(session.user.email[0].toUpperCase());
        }
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const highlightHref = needsOnboarding ? (SANDBOX_HIGHLIGHT[sandboxStep] ?? null) : null;

  return (
    <nav className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="max-w-[1600px] mx-auto px-6 py-3.5">
        <div className="flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-[10px] group">
            <div className="w-7 h-7 bg-white/[0.06] border border-white/[0.12] rounded-lg flex items-center justify-center shadow-sm group-hover:bg-white/[0.1] transition-all p-0.5">
              <img src="/logo.png" alt="ZEC Logo" className="w-4 h-4 object-contain opacity-90 invert brightness-0" />
            </div>
            <span className="text-[22px] font-semibold lowercase text-[#EAE8E1] tracking-[0.08em] -mt-[2px]" style={{ fontFamily: "'Outfit', sans-serif" }}>
              zec
            </span>
          </Link>

          {/* Navigation */}
          <div className="hidden md:flex items-center gap-1.5">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.href;
              const isHighlighted = item.href === highlightHref;

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-[14px] transition-all ${
                    isHighlighted
                      ? 'font-semibold text-[#EAE8E1] bg-white/[0.1] border border-white/[0.25] ring-1 ring-white/[0.15] shadow-[0_0_14px_rgba(234,232,225,0.15)]'
                      : isActive
                      ? 'font-medium text-[#EAE8E1] bg-white/[0.06] border border-white/[0.02]'
                      : 'font-medium text-[#A3A09A] hover:text-[#EAE8E1] hover:bg-white/[0.04]'
                  }`}
                >
                  <item.icon className="size-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <Link to="/app/settings" className="hidden lg:block px-5 py-1.5 border border-white/[0.15] text-[#EAE8E1] text-[13px] font-medium rounded-full hover:bg-white/[0.08] hover:border-white/[0.25] transition-all tracking-wide">
              Upgrade
            </Link>
            <div className="hidden lg:block w-px h-5 bg-white/[0.1] mx-1" />
            <button className="relative p-2 text-[#827E78] hover:text-[#EAE8E1] transition-colors rounded-lg hover:bg-white/[0.04]">
              <Bell className="size-[18px]" />
              <span className="absolute top-1.5 right-1.5 size-2 bg-[#b56060] rounded-full border-2 border-[#0a0a0a]" />
            </button>

            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.04] transition-all group"
              >
                <div className="size-8 bg-white/[0.06] border border-white/[0.12] rounded-full flex items-center justify-center">
                  <span className="text-[#EAE8E1] text-[12px] font-semibold tracking-wider">{initials}</span>
                </div>
                <ChevronDown className={`size-4 text-[#827E78] transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : 'group-hover:text-[#EAE8E1]'}`} />
              </button>

              {isUserMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-52 bg-[#1A1A1A] border border-white/[0.08] rounded-xl shadow-2xl py-1.5 z-50 overflow-hidden">
                    <Link to="/app/settings" onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-[14px] font-medium text-[#A3A09A] hover:text-[#EAE8E1] hover:bg-white/[0.06] transition-colors">
                      <Settings className="size-4" /> Ustawienia konta
                    </Link>
                    <div className="h-px bg-white/[0.06] my-1" />
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[14px] font-medium text-[#b56060] hover:text-[#c96a6a] hover:bg-[#b56060]/10 transition-colors">
                      <LogOut className="size-4" /> Wyloguj się
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

function DashboardLayoutInner() {
  const { needsOnboarding, completeOnboarding } = useOnboarding();
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <NavBar />
      <main className="max-w-[1600px] mx-auto px-6 py-8">
        <Outlet />
      </main>
      {needsOnboarding && <OnboardingSandbox onComplete={completeOnboarding} />}
    </div>
  );
}

export function DashboardLayout() {
  return (
    <OnboardingProvider>
      <DashboardLayoutInner />
    </OnboardingProvider>
  );
}
