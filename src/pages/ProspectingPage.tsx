import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, Filter, Globe, MapPin, Building2, Star, Mail, Check,
  Sparkles, ArrowRight, Coins, ChevronDown, ChevronUp, AlertCircle,
  Loader2, Users, Instagram, Linkedin, Plus, Minus, TrendingUp,
  Briefcase, Hash, BarChart2, UserCheck, ShieldCheck, ExternalLink
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// ─── Typy ────────────────────────────────────────────────────────────────────

type Platform = 'google' | 'instagram' | 'linkedin';

interface PlatformConfig {
  id: Platform;
  label: string;
  icon: React.ReactNode;
  tokenCost: number; // koszt za lead
  color: string;
  borderColor: string;
  bgColor: string;
}

const PLATFORMS: PlatformConfig[] = [
  {
    id: 'google',
    label: 'Google',
    icon: <Globe className="size-4" />,
    tokenCost: 1,
    color: 'text-blue-400',
    borderColor: 'border-blue-500/40',
    bgColor: 'bg-blue-500/10',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    icon: <Instagram className="size-4" />,
    tokenCost: 2,
    color: 'text-pink-400',
    borderColor: 'border-pink-500/40',
    bgColor: 'bg-pink-500/10',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    icon: <Linkedin className="size-4" />,
    tokenCost: 3,
    color: 'text-sky-400',
    borderColor: 'border-sky-500/40',
    bgColor: 'bg-sky-500/10',
  },
];

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockLeads = [
  {
    id: 1,
    name: 'Studio Architektoniczne Nowak',
    website: 'nowakarchitekci.pl',
    email: 'kontakt@nowakarchitekci.pl',
    rating: 4.8,
    reviews: 127,
    city: 'Warszawa',
    industry: 'Architektura',
    description: 'Nowoczesne projekty budowlane i wnętrz premium.',
    platform: 'google',
  },
  {
    id: 2,
    name: 'BudMaster Deweloper',
    website: 'budmaster.com',
    email: 'biuro@budmaster.com',
    rating: 4.9,
    reviews: 203,
    city: 'Kraków',
    industry: 'Deweloper',
    description: 'Lider na rynku deweloperskim w Małopolsce.',
    platform: 'google',
  },
  {
    id: 3,
    name: '@meblowawarszawa',
    website: 'meblowawarszawa.pl',
    email: 'hello@meblowawarszawa.pl',
    followers: 48200,
    posts: 312,
    engagementRate: 3.4,
    city: 'Warszawa',
    industry: 'Meble / Wnętrza',
    description: 'Sklep z meblami premium dla domu i biura.',
    platform: 'instagram',
    isBusinessAccount: true,
  },
  {
    id: 4,
    name: 'Softlab Solutions',
    website: 'softlab.io',
    email: 'sales@softlab.io',
    employeeCount: 45,
    followers: 1230,
    city: 'Wrocław',
    industry: 'IT / Software',
    description: 'Software house specjalizujący się w aplikacjach B2B.',
    platform: 'linkedin',
    companyType: 'Private',
  },
];

// ─── Helper ───────────────────────────────────────────────────────────────────

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
  icon,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
  icon?: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400 flex items-center gap-1.5">
          {icon}
          {label}
        </span>
        <span className="text-white font-mono font-semibold tabular-nums">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
      />
    </div>
  );
}

function CheckRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <div className="relative flex items-center justify-center size-4 shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <div className="absolute inset-0 rounded border border-white/20 bg-white/[0.03] peer-checked:bg-white peer-checked:border-white transition-all group-hover:border-white/40" />
        <Check className="size-2.5 text-black opacity-0 peer-checked:opacity-100 relative z-10 transition-opacity" strokeWidth={3} />
      </div>
      <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">{label}</span>
    </label>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.15em] mb-3">
      {children}
    </h3>
  );
}

// ─── Główny komponent ─────────────────────────────────────────────────────────

export function ProspectingPage() {
  const [leads, setLeads] = useState<typeof mockLeads>([]);
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [availableTokens, setAvailableTokens] = useState<number>(1240);
  const [userId, setUserId] = useState<string | null>(null);

  // Wybrane platformy (domyślnie tylko Google)
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['google']);

  // Filtry wspólne
  const [common, setCommon] = useState({
    industry: '',
    country: 'Polska',
    city: '',
    keywords: '',
    leadsCount: 50,
  });

  // Filtry Google
  const [googleFilters, setGoogleFilters] = useState({
    minRating: 4.0,
    minReviews: 10,
    requireWebsite: true,
    requireEmail: false,
    requirePhone: false,
    requireOpenNow: false,
  });

  // Filtry Instagram
  const [igFilters, setIgFilters] = useState({
    minFollowers: 1000,
    maxFollowers: 500000,
    minEngagementRate: 1.0,
    minPosts: 12,
    businessAccountOnly: true,
    requireEmail: false,
    requireWebsite: false,
  });

  // Filtry LinkedIn
  const [liFilters, setLiFilters] = useState({
    minEmployees: 1,
    maxEmployees: 250,
    companySize: [] as string[],
    requireWebsite: true,
    hasActiveJobs: false,
    requireEmail: false,
    foundedAfter: '',
  });

  // Pobierz kredyty
  useEffect(() => {
    async function fetchCredits() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
        const { data } = await supabase
          .from('profiles')
          .select('credits')
          .eq('id', session.user.id)
          .single();
        if (data) setAvailableTokens(data.credits);
      }
    }
    fetchCredits();
  }, []);

  // Oblicz koszt
  const tokenCost = common.leadsCount * selectedPlatforms.reduce((acc, p) => {
    const cfg = PLATFORMS.find((x) => x.id === p)!;
    return acc + cfg.tokenCost;
  }, 0);

  const togglePlatform = (p: Platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(p)
        ? prev.length > 1 ? prev.filter((x) => x !== p) : prev // min 1
        : [...prev, p]
    );
  };

  const toggleCompanySize = (size: string) => {
    setLiFilters((prev) => ({
      ...prev,
      companySize: prev.companySize.includes(size)
        ? prev.companySize.filter((s) => s !== size)
        : [...prev.companySize, size],
    }));
  };

  const handleSearch = async () => {
    setError(null);
    if (!common.industry || !common.city) {
      setError('Branża i miasto są wymagane.');
      return;
    }
    if (tokenCost > availableTokens) {
      setError(`Niewystarczająca liczba tokenów. Brakuje: ${tokenCost - availableTokens}`);
      return;
    }
    setIsSearching(true);
    try {
      const webhookUrl = 'https://twoj-adres-n8n.com/webhook/szukaj-leadow';
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          platforms: selectedPlatforms,
          common,
          googleFilters,
          igFilters,
          liFilters,
        }),
      });
      if (!response.ok) throw new Error('Błąd serwera.');
      const data = await response.json();
      setLeads(data.leads?.length ? data.leads : mockLeads);
    } catch {
      setLeads(mockLeads);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleLead = (id: number) =>
    setSelectedLeads((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );

  const toggleAll = () =>
    setSelectedLeads(selectedLeads.length === leads.length ? [] : leads.map((l) => l.id));

  const platformIcon = (p: string) => {
    if (p === 'google') return <Globe className="size-3 text-blue-400" />;
    if (p === 'instagram') return <Instagram className="size-3 text-pink-400" />;
    if (p === 'linkedin') return <Linkedin className="size-3 text-sky-400" />;
    return null;
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-32">

      {/* ── Top bar ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between bg-[#0a0a0a] border border-[#1c1c1c] rounded-xl px-5 py-3.5"
      >
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Coins className="size-4 text-amber-400" />
          </div>
          <div>
            <div className="text-[11px] text-gray-600 uppercase tracking-wider font-medium">Dostępne kredyty</div>
            <div className="text-lg font-bold text-white font-mono leading-none mt-0.5">
              {availableTokens.toLocaleString('pl-PL')}
            </div>
          </div>
        </div>
        <button className="text-xs font-semibold text-gray-400 hover:text-white border border-[#222] hover:border-[#333] px-3 py-1.5 rounded-lg transition-all">
          Doładuj
        </button>
      </motion.div>

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Wyszukiwarka leadów</h1>
        <p className="text-sm text-gray-600 mt-1">Wybierz platformy, ustaw filtry i pobierz gotowe leady B2B.</p>
      </div>

      {/* ── Error ── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-2.5 text-sm text-red-400 bg-red-500/8 border border-red-500/20 rounded-lg px-4 py-3"
          >
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Wybór platform ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="bg-[#0a0a0a] border border-[#1c1c1c] rounded-xl p-5"
      >
        <div className="text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-3">Źródło danych</div>
        <div className="flex gap-2 flex-wrap">
          {PLATFORMS.map((p) => {
            const active = selectedPlatforms.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => togglePlatform(p.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                  active
                    ? `${p.bgColor} ${p.borderColor} ${p.color}`
                    : 'bg-white/[0.02] border-[#1c1c1c] text-gray-500 hover:border-[#2a2a2a] hover:text-gray-400'
                }`}
              >
                {p.icon}
                {p.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${active ? 'bg-white/10' : 'bg-white/5'}`}>
                  {p.tokenCost} tok/lead
                </span>
              </button>
            );
          })}
        </div>
        {selectedPlatforms.length > 1 && (
          <p className="text-xs text-gray-600 mt-2.5">
            Koszt łączony: <span className="text-amber-400 font-mono font-semibold">
              {selectedPlatforms.reduce((a, p) => a + PLATFORMS.find(x => x.id === p)!.tokenCost, 0)} tok/lead
            </span>
          </p>
        )}
      </motion.div>

      {/* ── Główny moduł filtrów ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-[#0a0a0a] border border-[#1c1c1c] rounded-xl overflow-hidden"
      >
        {/* Filtry bazowe */}
        <div className="p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Branża */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wider mb-2">Branża *</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-600 pointer-events-none" />
              <select
                value={common.industry}
                onChange={(e) => setCommon({ ...common, industry: e.target.value })}
                className="w-full pl-9 pr-4 py-2.5 bg-[#111] border border-[#1e1e1e] rounded-lg text-sm text-white focus:outline-none focus:border-[#333] transition-all appearance-none cursor-pointer"
              >
                <option value="" className="bg-[#111] text-gray-500">Wybierz branżę...</option>
                <option value="architektura" className="bg-[#111] text-white">Architektura i Projektowanie</option>
                <option value="deweloper" className="bg-[#111] text-white">Nieruchomości / Deweloper</option>
                <option value="marketing" className="bg-[#111] text-white">Agencje Marketingowe</option>
                <option value="it" className="bg-[#111] text-white">Software House / IT</option>
                <option value="meble" className="bg-[#111] text-white">Meble i Wyposażenie</option>
                <option value="produkcja" className="bg-[#111] text-white">Produkcja / Manufacturing</option>
                <option value="finanse" className="bg-[#111] text-white">Finanse / Doradztwo</option>
                <option value="handel" className="bg-[#111] text-white">Handel / E-commerce</option>
              </select>
            </div>
          </div>

          {/* Kraj */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wider mb-2">Kraj</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-600 pointer-events-none" />
              <select
                value={common.country}
                onChange={(e) => setCommon({ ...common, country: e.target.value })}
                className="w-full pl-9 pr-4 py-2.5 bg-[#111] border border-[#1e1e1e] rounded-lg text-sm text-white focus:outline-none focus:border-[#333] transition-all appearance-none cursor-pointer"
              >
                <option value="Polska" className="bg-[#111] text-white">🇵🇱 Polska</option>
                <option value="Niemcy" className="bg-[#111] text-white">🇩🇪 Niemcy</option>
                <option value="Francja" className="bg-[#111] text-white">🇫🇷 Francja</option>
                <option value="UK" className="bg-[#111] text-white">🇬🇧 Wielka Brytania</option>
                <option value="Global" className="bg-[#111] text-white">🌐 Cały świat</option>
              </select>
            </div>
          </div>

          {/* Miasto */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wider mb-2">Miasto *</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-600" />
              <input
                type="text"
                value={common.city}
                onChange={(e) => setCommon({ ...common, city: e.target.value })}
                placeholder="np. Warszawa"
                className="w-full pl-9 pr-4 py-2.5 bg-[#111] border border-[#1e1e1e] rounded-lg text-sm text-white placeholder:text-gray-700 focus:outline-none focus:border-[#333] transition-all"
              />
            </div>
          </div>

          {/* Słowa kluczowe */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wider mb-2">Słowa kluczowe</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-600" />
              <input
                type="text"
                value={common.keywords}
                onChange={(e) => setCommon({ ...common, keywords: e.target.value })}
                placeholder="np. eksport, B2B, premium"
                className="w-full pl-9 pr-4 py-2.5 bg-[#111] border border-[#1e1e1e] rounded-lg text-sm text-white placeholder:text-gray-700 focus:outline-none focus:border-[#333] transition-all"
              />
            </div>
          </div>
        </div>

        {/* ── Zaawansowane filtry – toggle ── */}
        <div className="border-t border-[#141414]">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between px-5 py-3.5 text-sm text-gray-500 hover:text-gray-300 transition-colors group"
          >
            <span className="flex items-center gap-2 font-medium">
              <Filter className="size-3.5" />
              Zaawansowane filtry
              {selectedPlatforms.length > 0 && (
                <span className="text-[10px] px-2 py-0.5 bg-white/5 rounded-full font-mono">
                  {selectedPlatforms.join(' + ')}
                </span>
              )}
            </span>
            {showAdvanced
              ? <ChevronUp className="size-4" />
              : <ChevronDown className="size-4" />}
          </button>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 space-y-5">

                  {/* ── Google Filters ── */}
                  {selectedPlatforms.includes('google') && (
                    <div className="p-4 rounded-xl bg-blue-500/[0.04] border border-blue-500/10">
                      <div className="flex items-center gap-2 mb-4">
                        <Globe className="size-3.5 text-blue-400" />
                        <SectionTitle>Filtry Google Maps</SectionTitle>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-4">
                          <SliderRow
                            label="Min. ocena Google"
                            value={googleFilters.minRating}
                            min={1} max={5} step={0.1}
                            format={(v) => `${v.toFixed(1)} ★`}
                            onChange={(v) => setGoogleFilters({ ...googleFilters, minRating: v })}
                            icon={<Star className="size-3 text-amber-400" />}
                          />
                          <SliderRow
                            label="Min. liczba opinii"
                            value={googleFilters.minReviews}
                            min={0} max={500} step={5}
                            format={(v) => `${v}+`}
                            onChange={(v) => setGoogleFilters({ ...googleFilters, minReviews: v })}
                            icon={<Hash className="size-3 text-gray-500" />}
                          />
                        </div>
                        <div className="space-y-2.5">
                          <CheckRow label="Wymagaj strony WWW" checked={googleFilters.requireWebsite} onChange={(v) => setGoogleFilters({ ...googleFilters, requireWebsite: v })} />
                          <CheckRow label="Wymagaj widocznego e-maila" checked={googleFilters.requireEmail} onChange={(v) => setGoogleFilters({ ...googleFilters, requireEmail: v })} />
                          <CheckRow label="Wymagaj numeru telefonu" checked={googleFilters.requirePhone} onChange={(v) => setGoogleFilters({ ...googleFilters, requirePhone: v })} />
                          <CheckRow label="Tylko aktualnie otwarte" checked={googleFilters.requireOpenNow} onChange={(v) => setGoogleFilters({ ...googleFilters, requireOpenNow: v })} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Instagram Filters ── */}
                  {selectedPlatforms.includes('instagram') && (
                    <div className="p-4 rounded-xl bg-pink-500/[0.04] border border-pink-500/10">
                      <div className="flex items-center gap-2 mb-4">
                        <Instagram className="size-3.5 text-pink-400" />
                        <SectionTitle>Filtry Instagram</SectionTitle>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-4">
                          <SliderRow
                            label="Min. obserwujący"
                            value={igFilters.minFollowers}
                            min={0} max={100000} step={500}
                            format={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}K` : `${v}`}
                            onChange={(v) => setIgFilters({ ...igFilters, minFollowers: v })}
                            icon={<Users className="size-3 text-gray-500" />}
                          />
                          <SliderRow
                            label="Max. obserwujący"
                            value={igFilters.maxFollowers}
                            min={1000} max={1000000} step={1000}
                            format={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : `${v}`}
                            onChange={(v) => setIgFilters({ ...igFilters, maxFollowers: v })}
                            icon={<Users className="size-3 text-gray-500" />}
                          />
                          <SliderRow
                            label="Min. engagement rate"
                            value={igFilters.minEngagementRate}
                            min={0} max={20} step={0.1}
                            format={(v) => `${v.toFixed(1)}%`}
                            onChange={(v) => setIgFilters({ ...igFilters, minEngagementRate: v })}
                            icon={<TrendingUp className="size-3 text-gray-500" />}
                          />
                          <SliderRow
                            label="Min. liczba postów"
                            value={igFilters.minPosts}
                            min={0} max={200} step={1}
                            format={(v) => `${v}+`}
                            onChange={(v) => setIgFilters({ ...igFilters, minPosts: v })}
                            icon={<BarChart2 className="size-3 text-gray-500" />}
                          />
                        </div>
                        <div className="space-y-2.5">
                          <CheckRow label="Tylko konta biznesowe" checked={igFilters.businessAccountOnly} onChange={(v) => setIgFilters({ ...igFilters, businessAccountOnly: v })} />
                          <CheckRow label="Wymagaj e-maila w bio" checked={igFilters.requireEmail} onChange={(v) => setIgFilters({ ...igFilters, requireEmail: v })} />
                          <CheckRow label="Wymagaj linku do strony w bio" checked={igFilters.requireWebsite} onChange={(v) => setIgFilters({ ...igFilters, requireWebsite: v })} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── LinkedIn Filters ── */}
                  {selectedPlatforms.includes('linkedin') && (
                    <div className="p-4 rounded-xl bg-sky-500/[0.04] border border-sky-500/10">
                      <div className="flex items-center gap-2 mb-4">
                        <Linkedin className="size-3.5 text-sky-400" />
                        <SectionTitle>Filtry LinkedIn</SectionTitle>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-4">
                          <SliderRow
                            label="Min. pracowników"
                            value={liFilters.minEmployees}
                            min={1} max={500} step={1}
                            format={(v) => `${v}+`}
                            onChange={(v) => setLiFilters({ ...liFilters, minEmployees: v })}
                            icon={<Users className="size-3 text-gray-500" />}
                          />
                          <SliderRow
                            label="Max. pracowników"
                            value={liFilters.maxEmployees}
                            min={1} max={10000} step={10}
                            format={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`}
                            onChange={(v) => setLiFilters({ ...liFilters, maxEmployees: v })}
                            icon={<Users className="size-3 text-gray-500" />}
                          />
                          <div>
                            <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wider mb-2">Założona po roku</label>
                            <input
                              type="number"
                              min={1900}
                              max={2024}
                              placeholder="np. 2015"
                              value={liFilters.foundedAfter}
                              onChange={(e) => setLiFilters({ ...liFilters, foundedAfter: e.target.value })}
                              className="w-full px-3 py-2 bg-[#111] border border-[#1e1e1e] rounded-lg text-sm text-white placeholder:text-gray-700 focus:outline-none focus:border-[#333] transition-all"
                            />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <div className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider mb-2">Wielkość firmy</div>
                            <div className="flex flex-wrap gap-1.5">
                              {['1-10', '11-50', '51-200', '201-500', '501-1000', '1001+'].map((size) => (
                                <button
                                  key={size}
                                  onClick={() => toggleCompanySize(size)}
                                  className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium border transition-all ${
                                    liFilters.companySize.includes(size)
                                      ? 'bg-sky-500/15 border-sky-500/40 text-sky-300'
                                      : 'bg-white/[0.02] border-[#222] text-gray-500 hover:border-[#333]'
                                  }`}
                                >
                                  {size}
                                </button>
                              ))}
                            </div>
                          </div>
                          <CheckRow label="Wymagaj strony WWW" checked={liFilters.requireWebsite} onChange={(v) => setLiFilters({ ...liFilters, requireWebsite: v })} />
                          <CheckRow label="Aktywne oferty pracy" checked={liFilters.hasActiveJobs} onChange={(v) => setLiFilters({ ...liFilters, hasActiveJobs: v })} />
                          <CheckRow label="Szukaj adresu e-mail" checked={liFilters.requireEmail} onChange={(v) => setLiFilters({ ...liFilters, requireEmail: v })} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Pasek wyszukiwania ── */}
        <div className="border-t border-[#141414] px-5 py-4 flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1 w-full">
            <div className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider mb-2">Liczba leadów</div>
            <div className="flex items-center gap-4">
              <input
                type="range" min={10} max={500} step={10}
                value={common.leadsCount}
                onChange={(e) => setCommon({ ...common, leadsCount: parseInt(e.target.value) })}
                className="w-40 h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
              />
              <span className="text-white font-mono font-bold text-sm tabular-nums w-8">{common.leadsCount}</span>
              <div className="text-xs text-gray-600 hidden sm:block">
                Koszt:{' '}
                <span className={`font-mono font-semibold ${tokenCost > availableTokens ? 'text-red-400' : 'text-amber-400'}`}>
                  {tokenCost} tokenów
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="w-full md:w-auto shrink-0 flex items-center justify-center gap-2 px-7 py-2.5 bg-white text-black text-sm font-bold rounded-lg hover:bg-gray-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSearching
              ? <><Loader2 className="size-4 animate-spin" /> Skanowanie...</>
              : <><Sparkles className="size-4" /> Rozpocznij skanowanie</>
            }
          </button>
        </div>
      </motion.div>

      {/* ── Wyniki ── */}
      <AnimatePresence>
        {leads.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0a0a0a] border border-[#1c1c1c] rounded-xl overflow-hidden"
          >
            {/* Nagłówek tabeli */}
            <div className="px-5 py-4 border-b border-[#141414] flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Wyniki</h2>
                <p className="text-xs text-gray-600 mt-0.5">Pobrano {leads.length} leadów spełniających kryteria</p>
              </div>
              <div className="text-xs text-gray-600">
                {selectedLeads.length > 0 && (
                  <span className="text-white font-semibold">{selectedLeads.length} zaznaczonych</span>
                )}
              </div>
            </div>

            {/* Header kolumn */}
            <div className="grid grid-cols-12 gap-4 px-5 py-2.5 text-[10px] font-bold text-gray-700 uppercase tracking-wider border-b border-[#0f0f0f] bg-[#080808]">
              <div className="col-span-1 flex items-center">
                <label className="relative flex items-center justify-center size-3.5 cursor-pointer">
                  <input type="checkbox" checked={selectedLeads.length === leads.length && leads.length > 0} onChange={toggleAll} className="peer sr-only" />
                  <div className="absolute inset-0 rounded border border-white/20 bg-white/[0.03] peer-checked:bg-white peer-checked:border-white transition-all" />
                  <Check className="size-2.5 text-black opacity-0 peer-checked:opacity-100 relative z-10" strokeWidth={3} />
                </label>
              </div>
              <div className="col-span-1">Źródło</div>
              <div className="col-span-4">Firma / Profil</div>
              <div className="col-span-3">Kontakt</div>
              <div className="col-span-3">Metryki</div>
            </div>

            {/* Wiersze */}
            <div className="divide-y divide-[#0f0f0f]">
              {leads.map((lead) => (
                <div
                  key={lead.id}
                  className={`grid grid-cols-12 gap-4 px-5 py-3.5 transition-colors hover:bg-white/[0.015] ${
                    selectedLeads.includes(lead.id) ? 'bg-white/[0.025]' : ''
                  }`}
                >
                  {/* Checkbox */}
                  <div className="col-span-1 flex items-center">
                    <label className="relative flex items-center justify-center size-3.5 cursor-pointer">
                      <input type="checkbox" checked={selectedLeads.includes(lead.id)} onChange={() => toggleLead(lead.id)} className="peer sr-only" />
                      <div className="absolute inset-0 rounded border border-white/20 bg-white/[0.03] peer-checked:bg-white peer-checked:border-white transition-all" />
                      <Check className="size-2.5 text-black opacity-0 peer-checked:opacity-100 relative z-10" strokeWidth={3} />
                    </label>
                  </div>

                  {/* Platforma */}
                  <div className="col-span-1 flex items-center">
                    {platformIcon(lead.platform)}
                  </div>

                  {/* Firma */}
                  <div className="col-span-4 flex flex-col justify-center">
                    <div className="text-sm font-semibold text-white leading-tight">{lead.name}</div>
                    <div className="text-xs text-gray-600 mt-0.5 flex items-center gap-1">
                      <MapPin className="size-2.5" />
                      {lead.city} · {lead.industry}
                    </div>
                  </div>

                  {/* Kontakt */}
                  <div className="col-span-3 flex flex-col justify-center gap-1">
                    {lead.website && (
                      <a
                        href={`https://${lead.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-gray-500 hover:text-white flex items-center gap-1 truncate transition-colors"
                      >
                        <ExternalLink className="size-2.5 shrink-0" />
                        {lead.website}
                      </a>
                    )}
                    {lead.email && (
                      <div className="text-xs text-gray-500 flex items-center gap-1 truncate">
                        <Mail className="size-2.5 shrink-0" />
                        {lead.email}
                      </div>
                    )}
                  </div>

                  {/* Metryki – zależne od platformy */}
                  <div className="col-span-3 flex items-center gap-2 flex-wrap">
                    {lead.platform === 'google' && (
                      <>
                        <div className="flex items-center gap-1 px-2 py-1 bg-white/[0.03] rounded-md border border-white/[0.06] text-xs">
                          <Star className="size-2.5 text-amber-400 fill-amber-400/30" />
                          <span className="text-white font-mono font-bold">{(lead as any).rating}</span>
                        </div>
                        <span className="text-xs text-gray-600">{(lead as any).reviews} opinii</span>
                      </>
                    )}
                    {lead.platform === 'instagram' && (
                      <>
                        <div className="flex items-center gap-1 px-2 py-1 bg-pink-500/[0.06] rounded-md border border-pink-500/10 text-xs">
                          <Users className="size-2.5 text-pink-400" />
                          <span className="text-pink-300 font-mono font-bold">
                            {((lead as any).followers / 1000).toFixed(1)}K
                          </span>
                        </div>
                        {(lead as any).engagementRate && (
                          <span className="text-xs text-gray-600">{(lead as any).engagementRate}% eng.</span>
                        )}
                      </>
                    )}
                    {lead.platform === 'linkedin' && (
                      <>
                        <div className="flex items-center gap-1 px-2 py-1 bg-sky-500/[0.06] rounded-md border border-sky-500/10 text-xs">
                          <Briefcase className="size-2.5 text-sky-400" />
                          <span className="text-sky-300 font-mono font-bold">{(lead as any).employeeCount}</span>
                        </div>
                        <span className="text-xs text-gray-600">pracowników</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating action bar ── */}
      <AnimatePresence>
        {selectedLeads.length > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="bg-white rounded-2xl shadow-2xl shadow-black/60 px-6 py-3.5 flex items-center gap-5">
              <div className="flex items-center gap-2.5">
                <div className="size-8 bg-black rounded-full flex items-center justify-center">
                  <Check className="size-3.5 text-white" strokeWidth={3} />
                </div>
                <span className="font-bold text-black text-sm">
                  {selectedLeads.length} {selectedLeads.length === 1 ? 'lead' : 'leadów'} zaznaczonych
                </span>
              </div>
              <button className="flex items-center gap-1.5 bg-black hover:bg-gray-900 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all group">
                Dodaj do kampanii
                <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
