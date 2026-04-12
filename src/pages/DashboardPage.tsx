import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, Eye, Reply, Clock, TrendingUp, ArrowRight, Search, 
  CheckCircle2, Circle, Sparkles, Loader2, ArrowUpRight, Rocket
} from 'lucide-react';
import { Link } from 'react-router';
import { supabase } from '../lib/supabase';

interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'draft';
  progress: number;
  sent: number;
  total: number;
  replies: number;
}

export function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState<string>('');
  
  // Stany z bazy danych
  const [hasMailbox, setHasMailbox] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState({
    sent: 0,
    openRate: '0%',
    replyRate: '0%',
    savedHours: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // 1. Pobieranie imienia (lub części maila przed @)
      const emailName = session.user.email?.split('@')[0] || 'Nieznajomy';
      setUserName(emailName.charAt(0).toUpperCase() + emailName.slice(1));

      // 2. Sprawdzanie czy ma podpiętą skrzynkę
      const { count: mailboxCount } = await supabase
        .from('email_accounts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id);
      
      setHasMailbox((mailboxCount || 0) > 0);

      // 3. Pobieranie kampanii (Zabezpieczone try/catch na wypadek braku tabeli)
      try {
        const { data: campaignsData } = await supabase
          .from('campaigns')
          .select('*')
          .eq('user_id', session.user.id)
          .limit(3);
        
        if (campaignsData) {
          setCampaigns(campaignsData);
        }
      } catch (e) {
        // Fallback jeśli jeszcze nie ma tabeli campaigns
        setCampaigns([]);
      }

      // 4. Mockowane statystyki (Tu w przyszłości wstawisz agregację z bazy)
      setStats({
        sent: 1247,
        openRate: '43.2%',
        replyRate: '12.8%',
        savedHours: 45
      });

    } catch (error) {
      console.error('Błąd pobierania danych dashboardu:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Logika Checklisty
  const hasCampaigns = campaigns.length > 0;
  // Zakładamy, że jeśli ma kampanię, to znalazł też leady. 
  // W przyszłości możesz to podpiąć pod tabelę user_leads.
  const hasLeads = hasCampaigns; 
  
  const onboardingSteps = [
    {
      id: 1,
      title: 'Podłącz skrzynkę pocztową',
      description: 'Dodaj konto SMTP/IMAP, z którego wyślemy e-maile.',
      isCompleted: hasMailbox,
      href: '/app/settings',
      actionText: 'Przejdź do ustawień'
    },
    {
      id: 2,
      title: 'Znajdź pierwszych leadów',
      description: 'Użyj wyszukiwarki n8n, aby znaleźć klientów z Google Maps.',
      isCompleted: hasLeads,
      href: '/app/prospecting',
      actionText: 'Szukaj leadów'
    },
    {
      id: 3,
      title: 'Utwórz i odpal kampanię',
      description: 'Wygeneruj personalizowane e-maile AI i rozpocznij wysyłkę.',
      isCompleted: hasCampaigns,
      href: '/app/campaigns',
      actionText: 'Stwórz kampanię'
    }
  ];

  const completedSteps = onboardingSteps.filter(step => step.isCompleted).length;
  const progressPercentage = (completedSteps / onboardingSteps.length) * 100;
  const showOnboarding = completedSteps < onboardingSteps.length;

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="size-8 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative space-y-8 pb-12">
      {/* Tło z Hero (Siatka) */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none -z-10" />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "'Libre Baskerville', serif" }}>
          Cześć, {userName}! 👋
        </h1>
        <p className="text-gray-400">
          Oto podsumowanie Twoich działań sprzedażowych.
        </p>
      </motion.div>

      {/* ONBOARDING CHECKLIST WIDGET */}
      <AnimatePresence>
        {showOnboarding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
              {/* Ozdobny blask */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
                      <Rocket className="size-5 text-white" />
                      Przygotuj się do startu
                    </h2>
                    <p className="text-sm text-gray-400">Wykonaj te kroki, aby w pełni zautomatyzować swój outreach.</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="text-2xl font-bold text-white">{Math.round(progressPercentage)}%</div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Ukończono</div>
                  </div>
                </div>

                <div className="relative h-2 bg-black/40 rounded-full overflow-hidden mb-6">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="absolute inset-y-0 left-0 bg-white rounded-full"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  {onboardingSteps.map((step, index) => (
                    <div 
                      key={step.id} 
                      className={`relative p-5 rounded-xl border transition-all ${
                        step.isCompleted 
                          ? 'bg-white/5 border-emerald-500/30' 
                          : 'bg-black/40 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        {step.isCompleted ? (
                          <CheckCircle2 className="size-5 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="size-5 text-white/30 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className={`font-semibold mb-1 ${step.isCompleted ? 'text-white' : 'text-gray-300'}`}>
                            Krok {index + 1}: {step.title}
                          </div>
                          <div className="text-xs text-gray-500 leading-relaxed mb-4">
                            {step.description}
                          </div>
                          {!step.isCompleted && (
                            <Link 
                              to={step.href}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              {step.actionText}
                              <ArrowUpRight className="size-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Wysłane e-maile', value: stats.sent.toLocaleString(), change: '+12%', trend: 'up', icon: Mail },
          { label: 'Open Rate', value: stats.openRate, change: '+5.3%', trend: 'up', icon: Eye },
          { label: 'Reply Rate', value: stats.replyRate, change: '+2.1%', trend: 'up', icon: Reply },
          { label: 'Zaoszczędzony czas', value: `${stats.savedHours}h`, change: 'ten miesiąc', trend: 'neutral', icon: Clock },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="bg-[#0f0f0f] rounded-xl border border-white/10 p-6 hover:border-white/20 hover:bg-white/[0.02] transition-all group shadow-lg"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="size-10 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-all">
                <stat.icon className="size-5 text-gray-300 group-hover:text-white transition-colors" />
              </div>
              {stat.trend !== 'neutral' && (
                <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
                  stat.trend === 'up' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                }`}>
                  <TrendingUp className={`size-3 ${stat.trend === 'down' && 'rotate-180'}`} />
                  {stat.change}
                </div>
              )}
            </div>
            <div className="text-3xl font-bold text-white mb-1 tracking-tight">
              {stat.value}
            </div>
            <div className="text-sm text-gray-500 font-medium">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid (Campaigns & Quick Actions) */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Active Campaigns */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="lg:col-span-2 bg-[#0f0f0f] rounded-xl border border-white/10 overflow-hidden shadow-lg flex flex-col"
        >
          <div className="p-6 border-b border-white/10 bg-white/[0.01]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white mb-1">Twoje Kampanie</h2>
                <p className="text-sm text-gray-400">Postęp wysyłki w czasie rzeczywistym</p>
              </div>
              <Link to="/app/campaigns" className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all text-sm font-medium border border-white/5">
                Wszystkie
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>

          <div className="divide-y divide-white/5 flex-1 flex flex-col justify-center">
            {campaigns.length === 0 ? (
              <div className="p-12 text-center">
                <div className="size-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                  <Mail className="size-8 text-gray-500" />
                </div>
                <h3 className="text-white font-medium mb-2">Brak aktywnych kampanii</h3>
                <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">
                  Nie masz jeszcze żadnych uruchomionych kampanii. Znajdź leady i stwórz pierwszą wysyłkę.
                </p>
                <Link to="/app/campaigns" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors">
                  Stwórz kampanię
                </Link>
              </div>
            ) : (
              campaigns.map((campaign) => (
                <div key={campaign.id} className="p-6 hover:bg-white/[0.02] transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-white">{campaign.name}</h3>
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                        campaign.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                        campaign.status === 'paused' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                        'bg-gray-500/10 text-gray-400 border-gray-500/20'
                      }`}>
                        {campaign.status === 'active' ? 'Aktywna' : campaign.status === 'paused' ? 'Pauza' : 'Szkic'}
                      </span>
                    </div>
                    <div className="flex items-center gap-6 text-sm bg-black/20 px-4 py-2 rounded-lg border border-white/5 w-fit">
                      <div><span className="text-gray-500">Wysłano: </span><span className="text-white font-medium">{campaign.sent}/{campaign.total}</span></div>
                      <div className="w-px h-4 bg-white/10" />
                      <div><span className="text-gray-500">Odpowiedzi: </span><span className="text-emerald-400 font-bold">{campaign.replies}</span></div>
                    </div>
                  </div>

                  <div className="relative h-2.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${campaign.progress}%` }}
                      transition={{ duration: 1, delay: 0.2 }}
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-white to-gray-400 rounded-full"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Quick Actions (Vertical) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="flex flex-col gap-6"
        >
          <Link to="/app/prospecting" className="flex-1 bg-[#0f0f0f] rounded-xl border border-white/10 p-6 hover:border-white/30 transition-all group shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <Search className="size-24" />
            </div>
            <div className="relative z-10 h-full flex flex-col">
              <div className="size-12 bg-white text-black rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-white/10">
                <Search className="size-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Znajdź nowych leadów</h3>
              <p className="text-gray-400 text-sm mb-6 flex-1">
                Uruchom radar n8n, przeszukaj Google Maps i zbierz potencjalnych klientów.
              </p>
              <div className="flex items-center gap-2 text-white text-sm font-bold group-hover:gap-3 transition-all mt-auto">
                Rozpocznij wyszukiwanie <ArrowRight className="size-4" />
              </div>
            </div>
          </Link>

          <Link to="/app/settings" className="flex-1 bg-gradient-to-br from-[#0f0f0f] to-[#151515] rounded-xl border border-white/10 p-6 hover:border-white/30 transition-all group shadow-lg">
            <div className="size-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-white/10 transition-colors">
              <Sparkles className="size-5 text-gray-300" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Skonfiguruj Konto</h3>
            <p className="text-gray-400 text-sm mb-4">
              Dostosuj limity, ustaw powiadomienia i zoptymalizuj deliverability.
            </p>
            <div className="flex items-center gap-2 text-gray-300 text-sm font-medium group-hover:text-white transition-colors">
              Ustawienia <ArrowRight className="size-4" />
            </div>
          </Link>
        </motion.div>

      </div>
    </div>
  );
}