import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import {
  LayoutDashboard, Search, Mail, Database, Settings, Bell, ChevronDown, LogOut,
  CheckCircle2, AlertTriangle, XCircle, Circle, CheckCheck, Inbox
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
  type NotificationSeverity,
} from '../lib/notifications';
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
            <CreditMeter />
            <Link to="/app/settings" className="hidden lg:block px-5 py-1.5 border border-white/[0.15] text-[#EAE8E1] text-[13px] font-medium rounded-full hover:bg-white/[0.08] hover:border-white/[0.25] transition-all tracking-wide">
              Upgrade
            </Link>
            <div className="hidden lg:block w-px h-5 bg-white/[0.1] mx-1" />
            <NotificationBell />

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

function formatNotificationTime(value: string) {
  const time = new Date(value).getTime();
  const diffMs = Date.now() - time;
  if (!Number.isFinite(diffMs)) return '';

  const minutes = Math.max(0, Math.floor(diffMs / 60000));
  if (minutes < 1) return 'teraz';
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} godz.`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} dni`;

  return new Intl.DateTimeFormat('pl-PL', { day: '2-digit', month: '2-digit' }).format(new Date(value));
}

function notificationTone(severity: NotificationSeverity) {
  switch (severity) {
    case 'success':
      return { icon: CheckCircle2, bg: 'bg-[#5d9970]/10', text: 'text-[#5d9970]', dot: 'bg-[#5d9970]' };
    case 'warning':
      return { icon: AlertTriangle, bg: 'bg-[#a3956a]/10', text: 'text-[#a3956a]', dot: 'bg-[#a3956a]' };
    case 'error':
      return { icon: XCircle, bg: 'bg-[#b56060]/10', text: 'text-[#b56060]', dot: 'bg-[#b56060]' };
    default:
      return { icon: Circle, bg: 'bg-white/[0.06]', text: 'text-[#A3A09A]', dot: 'bg-[#A3A09A]' };
  }
}

function NotificationBell() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const unreadCount = notifications.filter(notification => !notification.read_at).length;

  const loadNotifications = async (silent = false) => {
    if (!silent) setLoading(true);
    const next = await fetchNotifications(12);
    setNotifications(next);
    setLoading(false);
  };

  useEffect(() => {
    let isMounted = true;
    let intervalId: number | undefined;

    const load = async (silent = false) => {
      if (!silent) setLoading(true);
      const next = await fetchNotifications(12);
      if (!isMounted) return;
      setNotifications(next);
      setLoading(false);
    };

    load();
    intervalId = window.setInterval(() => load(true), 30000);

    return () => {
      isMounted = false;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, []);

  const handleOpen = () => {
    setIsOpen(prev => !prev);
    void loadNotifications(true);
  };

  const handleReadAll = async () => {
    await markAllNotificationsRead();
    const readAt = new Date().toISOString();
    setNotifications(prev => prev.map(notification => ({
      ...notification,
      read_at: notification.read_at || readAt,
    })));
  };

  const handleNotificationClick = async (notification: AppNotification) => {
    if (!notification.read_at) {
      await markNotificationRead(notification.id);
      setNotifications(prev => prev.map(item =>
        item.id === notification.id
          ? { ...item, read_at: new Date().toISOString() }
          : item
      ));
    }

    if (notification.action_url?.startsWith('/')) {
      navigate(notification.action_url);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className={`relative p-2 transition-colors rounded-lg hover:bg-white/[0.04] ${isOpen ? 'text-[#EAE8E1]' : 'text-[#827E78] hover:text-[#EAE8E1]'}`}
        aria-label="Powiadomienia"
      >
        <Bell className="size-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-[#b56060] text-white text-[9px] font-semibold leading-4 rounded-full border border-[#0a0a0a]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-[360px] max-w-[calc(100vw-2rem)] bg-[#1A1A1A] border border-white/[0.08] rounded-xl shadow-2xl z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.06]">
              <div>
                <h3 className="text-[14px] font-medium text-[#EAE8E1]">Powiadomienia</h3>
                <p className="text-[12px] text-[#827E78] mt-0.5">{unreadCount} nieprzeczytane</p>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleReadAll}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] text-[#A3A09A] hover:text-[#EAE8E1] rounded-lg hover:bg-white/[0.05] transition-colors"
                >
                  <CheckCheck className="size-3.5" />
                  Oznacz
                </button>
              )}
            </div>

            <div className="max-h-[420px] overflow-y-auto">
              {loading ? (
                <div className="px-4 py-10 text-center text-[13px] text-[#827E78]">Ładowanie...</div>
              ) : notifications.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <Inbox className="size-5 text-[#3a3a3a] mx-auto mb-3" />
                  <p className="text-[13px] text-[#827E78]">Brak powiadomień</p>
                </div>
              ) : (
                notifications.map(notification => {
                  const tone = notificationTone(notification.severity);
                  const Icon = tone.icon;

                  return (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full flex gap-3 px-4 py-3.5 text-left border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.04] transition-colors ${notification.read_at ? '' : 'bg-white/[0.025]'}`}
                    >
                      <div className={`mt-0.5 size-8 rounded-lg flex items-center justify-center shrink-0 ${tone.bg}`}>
                        <Icon className={`size-4 ${tone.text}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-2">
                          <p className="text-[13px] font-medium text-[#EAE8E1] leading-snug flex-1">{notification.title}</p>
                          {!notification.read_at && <span className={`mt-1.5 size-1.5 rounded-full shrink-0 ${tone.dot}`} />}
                        </div>
                        {notification.body && (
                          <p
                            className="text-[12px] text-[#A3A09A] leading-relaxed mt-1 overflow-hidden"
                            style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
                          >
                            {notification.body}
                          </p>
                        )}
                        <p className="text-[11px] text-[#5f5b55] mt-2">{formatNotificationTime(notification.created_at)}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function CreditMeter() {
  const [credits, setCredits] = useState<{ left: number; total: number } | null>(null);

  useEffect(() => {
    let isMounted = true;
    let intervalId: number | undefined;

    const loadCredits = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await (supabase as any).rpc('zec_get_billing_overview');
      if (!isMounted) return;

      if (!error && data) {
        const left = Number(data.profile?.credits || 0);
        const total = Number(data.current_plan?.monthly_credits || left || 0);
        setCredits({ left, total });
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', session.user.id)
        .single();

      if (isMounted) {
        const left = Number(profile?.credits || 0);
        setCredits({ left, total: left });
      }
    };

    loadCredits();
    intervalId = window.setInterval(loadCredits, 60000);

    return () => {
      isMounted = false;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, []);

  if (!credits) {
    return (
      <div className="hidden xl:block w-24">
        <div className="h-px rounded-full bg-white/[0.08]" />
      </div>
    );
  }

  const left = Math.max(0, Math.round(credits.left));
  const total = Math.max(0, Math.round(credits.total));
  const remainingPct = total > 0 ? Math.min(100, Math.round((left / total) * 100)) : 0;
  const meterColor = remainingPct > 50
    ? 'bg-[#5d9970]'
    : remainingPct > 20
    ? 'bg-[#a3956a]'
    : 'bg-[#b56060]';

  return (
    <Link
      to="/app/settings"
      className="hidden xl:flex w-[112px] flex-col gap-1 group"
      title={`Tokeny: ${left} / ${total}`}
      aria-label={`Tokeny: ${left} z ${total}`}
    >
      <div className="flex items-center justify-between leading-none">
        <span className="text-[9px] uppercase tracking-wider text-[#827E78] group-hover:text-[#A3A09A] transition-colors">
          Tokeny
        </span>
        <span className="text-[10px] font-mono text-[#A3A09A]">
          {left}/{total}
        </span>
      </div>
      <div className="h-px rounded-full bg-white/[0.08] overflow-hidden">
        <div
          className={`h-full rounded-full transition-[width,background-color] duration-500 ease-out ${meterColor}`}
          style={{ width: `${remainingPct}%` }}
        />
      </div>
    </Link>
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
