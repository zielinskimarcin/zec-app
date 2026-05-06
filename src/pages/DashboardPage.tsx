import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mail, ArrowRight, Search, Loader2, Circle,
  CheckCircle2, Settings, ChevronDown, ChevronUp, ShieldAlert
} from 'lucide-react';
import { Link } from 'react-router';
import { supabase } from '../lib/supabase';
import { useOnboarding } from '../contexts/OnboardingContext';

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
  const onboarding = useOnboarding();
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [hasMailbox, setHasMailbox] = useState(false);
  const [hasCompany, setHasCompany] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [sentCount, setSentCount] = useState(0);
  const [checklistOpen, setChecklistOpen] = useState(false);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase
        .from('profiles').select('full_name').eq('id', session.user.id).single();
      const fullName = profile?.full_name || session.user.email?.split('@')[0] || '';
      setUserName(fullName.split(' ')[0] || fullName);

      const { count: mailboxCount } = await supabase
        .from('email_accounts').select('*', { count: 'exact', head: true }).eq('user_id', session.user.id);
      setHasMailbox((mailboxCount || 0) > 0);

      const { data: company } = await supabase
        .from('companies').select('name').eq('user_id', session.user.id).single();
      setHasCompany(!!company?.name);

      try {
        const { data: campaignsData } = await supabase
          .from('campaigns').select('*').eq('user_id', session.user.id)
          .order('created_at', { ascending: false }).limit(3);
        if (campaignsData) setCampaigns(campaignsData);
      } catch { setCampaigns([]); }

      setSentCount(1247);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const hasCampaigns = campaigns.length > 0;

  const onboardingSteps = [
    { id: 1, title: 'Podłącz skrzynkę pocztową', isCompleted: hasMailbox, href: '/app/settings', actionText: 'Ustawienia' },
    { id: 2, title: 'Uzupełnij informacje o firmie', isCompleted: hasCompany, href: '/app/settings', actionText: 'Profil firmy' },
    { id: 3, title: 'Znajdź pierwszych leadów', isCompleted: hasCampaigns, href: '/app/prospecting', actionText: 'Wyszukiwarka' },
    { id: 4, title: 'Utwórz i odpal kampanię', isCompleted: hasCampaigns, href: '/app/campaigns', actionText: 'Kampanie' },
  ];

  const completedSteps = onboardingSteps.filter(s => s.isCompleted).length;
  const showOnboarding = completedSteps < onboardingSteps.length;
  const nextStep = onboardingSteps.find(s => !s.isCompleted);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="size-5 text-[#827E78] animate-spin" />
      </div>
    );
  }

  return (
    <>
    <div className="max-w-5xl mx-auto space-y-8 pb-12">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-[28px] font-serif text-[#EAE8E1] tracking-tight">
          Dzień dobry{userName ? `, ${userName}` : ''}.
        </h1>
        <p className="text-[15px] text-[#A3A09A] mt-1.5">
          {showOnboarding ? 'Skonfiguruj konto, żeby zacząć wysyłać kampanie.' : 'Oto co dzieje się z Twoim outreachem.'}
        </p>
      </motion.div>

      {/* ── Kompaktowy baner onboardingowy ── */}
      <AnimatePresence>
        {showOnboarding && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="rounded-2xl border border-white/[0.08] bg-white/[0.04] overflow-hidden"
          >
            {/* Główny wiersz banera — zawsze widoczny */}
            <button
              onClick={() => setChecklistOpen(v => !v)}
              className="w-full flex items-center justify-between px-7 py-5 hover:bg-white/[0.02] transition-all"
            >
              <div className="flex items-center gap-5">
                {/* Mini pasek postępu kołowy / licznik */}
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    {onboardingSteps.map(step => (
                      <div
                        key={step.id}
                        className={`h-1 w-6 rounded-full transition-all ${step.isCompleted ? 'bg-[#EAE8E1]' : 'bg-white/[0.1]'}`}
                      />
                    ))}
                  </div>
                  <span className="text-[13px] text-[#827E78] font-mono">{completedSteps}/{onboardingSteps.length}</span>
                </div>

                <div className="h-4 w-px bg-white/[0.08]" />

                {/* Następny krok */}
                <div className="flex items-center gap-2.5">
                  <Circle className="size-3.5 text-[#3a3a3a]" />
                  <span className="text-[14px] text-[#A3A09A]">
                    Następny krok:{' '}
                    <span className="text-[#EAE8E1] font-medium">{nextStep?.title}</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {nextStep && (
                  <Link
                    to={nextStep.href}
                    onClick={e => e.stopPropagation()}
                    className="flex items-center gap-1.5 text-[12px] font-medium text-[#A3A09A] hover:text-[#EAE8E1] border border-white/[0.08] hover:border-white/[0.15] px-3 py-1.5 rounded-lg transition-all"
                  >
                    {nextStep.actionText} <ArrowRight className="size-3" />
                  </Link>
                )}
                {checklistOpen
                  ? <ChevronUp className="size-4 text-[#827E78]" />
                  : <ChevronDown className="size-4 text-[#827E78]" />}
              </div>
            </button>

            {/* Rozwijana lista kroków */}
            <AnimatePresence>
              {checklistOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="overflow-hidden border-t border-white/[0.05]"
                >
                  <div className="px-7 py-4 space-y-0">
                    {onboardingSteps.map((step, i) => (
                      <div key={step.id}>
                        <div className="flex items-center justify-between py-3.5">
                          <div className="flex items-center gap-3.5">
                            {step.isCompleted
                              ? <CheckCircle2 className="size-4 text-[#5d9970] shrink-0" />
                              : <Circle className="size-4 text-[#2e2e2e] shrink-0" />}
                            <span className={`text-[14px] ${step.isCompleted ? 'text-[#4a4a4a] line-through decoration-[#2e2e2e]' : 'text-[#c8c8c8]'}`}>
                              {step.title}
                            </span>
                          </div>
                          {!step.isCompleted && (
                            <Link
                              to={step.href}
                              className="text-[12px] font-medium text-[#827E78] hover:text-[#EAE8E1] transition-colors"
                            >
                              {step.actionText} →
                            </Link>
                          )}
                        </div>
                        {i < onboardingSteps.length - 1 && <div className="h-px bg-white/[0.04]" />}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista kroków — tylko gdy onboarding ukończony */}
      {!showOnboarding && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="rounded-2xl border border-white/[0.08] bg-white/[0.04] overflow-hidden"
        >
          <button
            onClick={() => setChecklistOpen(v => !v)}
            className="w-full flex items-center justify-between px-7 py-5 hover:bg-white/[0.02] transition-all"
          >
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  {onboardingSteps.map(step => (
                    <div
                      key={step.id}
                      className={`h-1 w-6 rounded-full transition-all ${step.isCompleted ? 'bg-[#EAE8E1]' : 'bg-white/[0.1]'}`}
                    />
                  ))}
                </div>
                <span className="text-[13px] text-[#827E78] font-mono">{completedSteps}/{onboardingSteps.length}</span>
              </div>

              <div className="h-4 w-px bg-white/[0.08]" />

              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="size-3.5 text-[#5d9970]" />
                <span className="text-[14px] text-[#A3A09A]">
                  Wszystkie kroki ukończone
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {checklistOpen
                ? <ChevronUp className="size-4 text-[#827E78]" />
                : <ChevronDown className="size-4 text-[#827E78]" />}
            </div>
          </button>

          <AnimatePresence>
            {checklistOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden border-t border-white/[0.05]"
              >
                <div className="px-7 py-4 space-y-0">
                  {onboardingSteps.map((step, i) => (
                    <div key={step.id}>
                      <div className="flex items-center justify-between py-3.5">
                        <div className="flex items-center gap-3.5">
                          {step.isCompleted
                            ? <CheckCircle2 className="size-4 text-[#5d9970] shrink-0" />
                            : <Circle className="size-4 text-[#2e2e2e] shrink-0" />}
                          <span className={`text-[14px] ${step.isCompleted ? 'text-[#4a4a4a] line-through decoration-[#2e2e2e]' : 'text-[#c8c8c8]'}`}>
                            {step.title}
                          </span>
                        </div>
                        {!step.isCompleted && (
                          <Link
                            to={step.href}
                            className="text-[12px] font-medium text-[#827E78] hover:text-[#EAE8E1] transition-colors"
                          >
                            {step.actionText} →
                          </Link>
                        )}
                      </div>
                      {i < onboardingSteps.length - 1 && <div className="h-px bg-white/[0.04]" />}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Kampanie + Akcje */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* Kampanie */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="lg:col-span-2 rounded-2xl border border-white/[0.08] bg-white/[0.04] overflow-hidden"
        >
          <div className="flex items-center justify-between px-8 py-6 border-b border-white/[0.06]">
            <div>
              <h2 className="text-[18px] font-medium text-[#EAE8E1]">Twoje kampanie</h2>
              <p className="text-[14px] text-[#A3A09A] mt-0.5">Postęp wysyłki w czasie rzeczywistym</p>
            </div>
            <Link
              to="/app/campaigns"
              className="flex items-center gap-2 text-[13px] font-medium text-[#A3A09A] hover:text-[#EAE8E1] border border-white/[0.08] hover:border-white/[0.15] px-4 py-2 rounded-xl transition-all"
            >
              Wszystkie <ArrowRight className="size-3.5" />
            </Link>
          </div>

          {campaigns.length === 0 ? (
            <div className="px-8 py-16 text-center">
              <div className="size-12 bg-white/[0.04] border border-white/[0.06] rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Mail className="size-6 text-[#A3A09A]" />
              </div>
              <p className="text-[16px] text-[#EAE8E1] mb-1">Brak aktywnych kampanii</p>
              <p className="text-[14px] text-[#A3A09A] mb-7 max-w-xs mx-auto leading-relaxed">
                Znajdź leady i stwórz pierwszą kampanię outboundową.
              </p>
              <Link
                to="/app/campaigns"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#EAE8E1] hover:bg-white text-[#1A1A1A] text-[14px] font-medium rounded-xl transition-all"
              >
                Stwórz kampanię
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.05]">
              {campaigns.map(campaign => (
                <div key={campaign.id} className="px-8 py-6 hover:bg-white/[0.02] transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <p className="text-[15px] font-medium text-[#EAE8E1]">{campaign.name}</p>
                      <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${
                        campaign.status === 'active' ? 'text-[#5d9970] bg-[#5d9970]/10'
                        : campaign.status === 'paused' ? 'text-[#a3956a] bg-[#a3956a]/10'
                        : 'text-[#827E78] bg-white/[0.05]'
                      }`}>
                        {campaign.status === 'active' ? 'Aktywna' : campaign.status === 'paused' ? 'Wstrzymana' : 'Szkic'}
                      </span>
                    </div>
                    <p className="text-[14px] text-[#A3A09A] font-mono">{campaign.sent} / {campaign.total}</p>
                  </div>
                  <div className="h-px bg-white/[0.06] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${campaign.progress}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full bg-[#A3A09A] rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Szybkie akcje */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col gap-4"
        >
          <Link
            to="/app/prospecting"
            className="flex-1 rounded-2xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.06] hover:border-white/[0.14] p-7 transition-all group"
          >
            <div className="size-10 bg-white/[0.06] border border-white/[0.08] rounded-xl flex items-center justify-center mb-5 group-hover:bg-white/[0.1] transition-all">
              <Search className="size-5 text-[#A3A09A]" />
            </div>
            <p className="text-[16px] font-medium text-[#EAE8E1] mb-2">Znajdź nowych leadów</p>
            <p className="text-[14px] text-[#827E78] leading-relaxed mb-5">
              Przeszukaj Google Maps, Instagram lub LinkedIn i zbierz kontakty do kampanii.
            </p>
            <div className="flex items-center gap-2 text-[13px] font-medium text-[#A3A09A] group-hover:text-[#EAE8E1] transition-colors">
              Rozpocznij wyszukiwanie <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>

          <Link
            to="/app/settings"
            className="flex-1 rounded-2xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.06] hover:border-white/[0.14] p-7 transition-all group"
          >
            <div className="size-10 bg-white/[0.06] border border-white/[0.08] rounded-xl flex items-center justify-center mb-5 group-hover:bg-white/[0.1] transition-all">
              <Settings className="size-5 text-[#A3A09A]" />
            </div>
            <p className="text-[16px] font-medium text-[#EAE8E1] mb-2">Ustawienia konta</p>
            <p className="text-[14px] text-[#827E78] leading-relaxed mb-5">
              Skonfiguruj skrzynki, profil firmy i preferencje kampanii.
            </p>
            <div className="flex items-center gap-2 text-[13px] font-medium text-[#A3A09A] group-hover:text-[#EAE8E1] transition-colors">
              Przejdź do ustawień <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
        </motion.div>
      </div>
    </div>

      {/* DEV: toggle onboarding */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => onboarding.toggleDev()}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#b56060]/10 border border-[#b56060]/30 hover:bg-[#b56060]/20 text-[#b56060] text-[11px] font-mono rounded-md transition-all opacity-50 hover:opacity-100"
        >
          <ShieldAlert className="size-3" /> DEV: onboarding {onboarding.needsOnboarding ? 'ON→OFF' : 'OFF→ON'}
        </button>
      </div>
    </>
  );
} 