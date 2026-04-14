import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, Globe, MapPin, Building2, Star, Mail, Check,
  ArrowRight, Coins, ChevronDown, ChevronUp, AlertCircle,
  Loader2, Users, TrendingUp, BarChart2,
  ExternalLink, SlidersHorizontal, Phone, Send, Eye, X
} from 'lucide-react';
import { Instagram, Linkedin } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Platform = 'google' | 'instagram' | 'linkedin';

interface Lead {
  id: number;
  companyName: string;
  website: string;
  domain: string;
  city: string;
  address: string;
  phone: string;
  category: string;
  rating: number;
  reviewsCount: number;
  emailFound: boolean;
  emailAddress: string | null;
  subject: string | null;
  body: string | null;
  status: 'ready' | 'no_email' | 'sent';
  instagram: { available: boolean; followers: number | null; handle: string | null; bio: string | null };
  linkedin: { available: boolean; industry: string | null; employeeCount: number | null };
  personalizationUsed: string[];
}

interface UserProfile {
  full_name: string;
  offer: string;
  package: string;
}

interface PlatformConfig {
  id: Platform;
  label: string;
  icon: React.ReactNode;
  tokenCost: number;
  activeClass: string;
}

const PLATFORMS: PlatformConfig[] = [
  { id: 'google',    label: 'Google',    tokenCost: 1, icon: <Globe className="size-3.5" />,     activeClass: 'bg-white/[0.06] border-white/[0.12] text-[#c8c8c8]' },
  { id: 'instagram', label: 'Instagram', tokenCost: 2, icon: <Instagram className="size-3.5" />, activeClass: 'bg-white/[0.06] border-white/[0.12] text-[#c8c8c8]' },
  { id: 'linkedin',  label: 'LinkedIn',  tokenCost: 3, icon: <Linkedin className="size-3.5" />,  activeClass: 'bg-white/[0.06] border-white/[0.12] text-[#c8c8c8]' },
];

const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001+'];

function getPackage(platforms: Platform[]): string {
  const hasIG = platforms.includes('instagram');
  const hasLI = platforms.includes('linkedin');
  if (hasIG && hasLI) return 'full';
  if (hasLI) return 'linkedin';
  if (hasIG) return 'instagram';
  return 'basic';
}

function SliderRow({ label, value, min, max, step, format, onChange, icon }: {
  label: string; value: number; min: number; max: number; step: number;
  format: (v: number) => string; onChange: (v: number) => void; icon?: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="flex items-center gap-1.5 text-[11px] text-[#4a4a4a] font-medium uppercase tracking-wider">{icon}{label}</span>
        <span className="text-[12px] font-mono font-semibold text-[#888]">{format(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-px bg-white/[0.08] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#c8c8c8]" />
    </div>
  );
}

function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <div className="relative flex items-center justify-center size-4 shrink-0">
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="peer sr-only" />
        <div className="absolute inset-0 rounded border border-white/[0.12] bg-white/[0.03] peer-checked:bg-[#c8c8c8] peer-checked:border-[#c8c8c8] transition-all" />
        <Check className="size-2.5 text-black opacity-0 peer-checked:opacity-100 relative z-10" strokeWidth={3} />
      </div>
      <span className="text-[12px] text-[#555] group-hover:text-[#888] transition-colors">{label}</span>
    </label>
  );
}

export function ProspectingPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewLead, setPreviewLead] = useState<Lead | null>(null);
  const [sendingLeads, setSendingLeads] = useState<number[]>([]);

  const [availableTokens, setAvailableTokens] = useState<number>(0);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['google']);

  const [common, setCommon] = useState({ industry: '', country: 'Polska', city: '', keywords: '', maxLeads: 10 });

  const [gFilters, setGFilters] = useState({ minRating: 4.0, minReviews: 10, requireWebsite: true, requireEmail: false, requirePhone: false, requireOpenNow: false });
  const [igFilters, setIgFilters] = useState({ minFollowers: 1000, maxFollowers: 500000, minEngagementRate: 1, minPosts: 12, businessAccountOnly: true, requireEmail: false, requireWebsite: false });
  const [liFilters, setLiFilters] = useState({ minEmployees: 1, maxEmployees: 250, companySize: [] as string[], requireWebsite: true, hasActiveJobs: false, requireEmail: false, foundedAfter: '' });

  useEffect(() => {
    async function fetchUserData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserEmail(session.user.email ?? null);
        const { data } = await supabase.from('profiles').select('credits, full_name, offer, package').eq('id', session.user.id).single();
        if (data) {
          setAvailableTokens(data.credits ?? 0);
          setUserProfile({ full_name: data.full_name ?? '', offer: data.offer ?? '', package: data.package ?? 'basic' });
        } else {
          setUserProfile({ full_name: '', offer: '', package: 'basic' });
        }
      }
    }
    fetchUserData();
  }, []);

  const togglePlatform = (p: Platform) => {
    if (p === 'google') return;
    setSelectedPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const toggleCompanySize = (size: string) => {
    setLiFilters(prev => ({ ...prev, companySize: prev.companySize.includes(size) ? prev.companySize.filter(s => s !== size) : [...prev.companySize, size] }));
  };

  const tokenCostPerLead = selectedPlatforms.reduce((acc, p) => acc + (PLATFORMS.find(x => x.id === p)?.tokenCost ?? 0), 0);

  const handleSearch = async () => {
    setError(null);
    if (!common.industry || !common.city) { setError('Branża i miasto są wymagane.'); return; }
    setIsSearching(true);
    try {
      const webhookUrl = 'https://n8n.srv1579942.hstgr.cloud/webhook/36f18c9a-7027-4260-a666-fecbc697eedb';
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'test_user_001',
          package: getPackage(selectedPlatforms),
          client: { name: userProfile?.full_name || 'Jan Kowalski', email: userEmail || 'jan@test.pl', offer: userProfile?.offer || 'Automatyzacja lead generation B2B', language: 'pl' },
          common: { industry: common.industry, country: common.country, city: common.city, keywords: common.keywords, maxLeads: common.maxLeads },
          filters: {
            google: { minRating: gFilters.minRating, minReviews: gFilters.minReviews, requireWebsite: gFilters.requireWebsite, requireEmail: gFilters.requireEmail, requirePhone: gFilters.requirePhone, requireOpenNow: gFilters.requireOpenNow },
            instagram: { minFollowers: igFilters.minFollowers, maxFollowers: igFilters.maxFollowers, minEngagementRate: igFilters.minEngagementRate, minPosts: igFilters.minPosts, businessAccountOnly: igFilters.businessAccountOnly, requireEmail: igFilters.requireEmail, requireWebsite: igFilters.requireWebsite },
            linkedin: { minEmployees: liFilters.minEmployees, maxEmployees: liFilters.maxEmployees, companySize: liFilters.companySize, requireWebsite: liFilters.requireWebsite, hasActiveJobs: liFilters.hasActiveJobs, requireEmail: liFilters.requireEmail, foundedAfter: liFilters.foundedAfter },
          },
        }),
      });
      if (!response.ok) throw new Error('Błąd serwera.');
      const data = await response.json();
      if (data.leads && data.leads.length > 0) {
        setLeads(data.leads.map((l: any, i: number) => ({ ...l, id: i + 1 })));
      } else {
        setError('Brak wyników dla podanych kryteriów.');
      }
    } catch (err: any) {
      console.error(err);
      setError('Błąd połączenia z serwerem.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendEmail = async (lead: Lead) => {
    if (!lead.emailAddress || !lead.subject || !lead.body) return;
    setSendingLeads(prev => [...prev, lead.id]);
    try {
      await fetch('https://n8n.srv1579942.hstgr.cloud/webhook/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: lead.emailAddress, subject: lead.subject, body: lead.body, fromName: userProfile?.full_name, fromEmail: userEmail }),
      });
      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: 'sent' } : l));
    } catch(e) {
      console.error(e);
    } finally {
      setSendingLeads(prev => prev.filter(id => id !== lead.id));
    }
  };

  const handleSendSelected = () => {
    leads.filter(l => selectedLeads.includes(l.id) && l.status === 'ready').forEach(l => handleSendEmail(l));
  };

  const toggleLead = (id: number) => setSelectedLeads(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const toggleAll = () => selectedLeads.length === leads.length ? setSelectedLeads([]) : setSelectedLeads(leads.map(l => l.id));

  return (
    <div className="space-y-4 max-w-7xl mx-auto">

      {/* Top bar */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between bg-white/[0.02] border border-white/[0.06] rounded-2xl px-5 py-3.5"
      >
        <div>
          <h1 className="text-[18px] font-semibold text-[#c8c8c8] tracking-tight">Wyszukiwarka leadów</h1>
          <p className="text-[12px] text-[#444] mt-0.5">Wybierz platformy, ustaw filtry i pobierz gotowe leady B2B</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Coins className="size-4 text-[#444]" />
            <div>
              <p className="text-[10px] text-[#333] uppercase tracking-wider">Kredyty</p>
              <p className="text-[15px] font-bold text-[#c8c8c8] font-mono leading-none">{availableTokens.toLocaleString('pl-PL')}</p>
            </div>
          </div>
          <button className="text-[12px] text-[#444] hover:text-[#888] border border-white/[0.07] hover:border-white/[0.12] px-3 py-1.5 rounded-xl transition-all">Doładuj</button>
        </div>
      </motion.div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400">
          <AlertCircle className="size-4 shrink-0" /><span className="text-[13px]">{error}</span>
        </div>
      )}

      {/* Platformy */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
      >
        <p className="text-[11px] font-medium text-[#3a3a3a] uppercase tracking-wider mb-3">Źródło danych</p>
        <div className="flex gap-2 flex-wrap">
          {PLATFORMS.map(p => {
            const active = selectedPlatforms.includes(p.id);
            return (
              <button key={p.id} onClick={() => togglePlatform(p.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-[13px] font-medium transition-all ${active ? p.activeClass : 'bg-transparent border-white/[0.05] text-[#444] hover:border-white/[0.1] hover:text-[#777]'} ${p.id === 'google' ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <span className={active ? 'text-[#888]' : 'text-[#333]'}>{p.icon}</span>
                {p.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-lg font-mono ${active ? 'bg-white/[0.07] text-[#777]' : 'bg-white/[0.03] text-[#333]'}`}>{p.tokenCost} tok/lead</span>
              </button>
            );
          })}
        </div>
        {selectedPlatforms.length > 1 && (
          <p className="text-[12px] text-[#444] mt-2.5">
            Koszt łączony: <span className="text-[#888] font-mono font-semibold">{tokenCostPerLead} tok/lead</span>
            <span className="ml-2 text-[#333]">· pakiet: <span className="font-mono text-[#666]">{getPackage(selectedPlatforms)}</span></span>
          </p>
        )}
      </motion.div>

      {/* Filtry */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden"
      >
        <div className="p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-[11px] font-medium text-[#4a4a4a] uppercase tracking-wider mb-2">Branża *</p>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#3a3a3a] pointer-events-none" />
              <select value={common.industry} onChange={e => setCommon({ ...common, industry: e.target.value })}
                className="w-full pl-9 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.07] rounded-xl text-[13px] text-[#c8c8c8] focus:outline-none focus:border-white/[0.14] transition-all appearance-none cursor-pointer"
              >
                <option value="" className="bg-[#161616] text-[#555]">Wybierz branżę...</option>
                <option value="architektura" className="bg-[#161616] text-[#d4d4d4]">Architektura i Projektowanie</option>
                <option value="deweloper" className="bg-[#161616] text-[#d4d4d4]">Nieruchomości / Deweloper</option>
                <option value="marketing" className="bg-[#161616] text-[#d4d4d4]">Agencje Marketingowe</option>
                <option value="it" className="bg-[#161616] text-[#d4d4d4]">Software House / IT</option>
                <option value="meble" className="bg-[#161616] text-[#d4d4d4]">Meble i Wyposażenie</option>
                <option value="produkcja" className="bg-[#161616] text-[#d4d4d4]">Produkcja / Manufacturing</option>
                <option value="finanse" className="bg-[#161616] text-[#d4d4d4]">Finanse / Doradztwo</option>
                <option value="handel" className="bg-[#161616] text-[#d4d4d4]">Handel / E-commerce</option>
                <option value="restauracje" className="bg-[#161616] text-[#d4d4d4]">Restauracje / HoReCa</option>
              </select>
            </div>
          </div>
          <div>
            <p className="text-[11px] font-medium text-[#4a4a4a] uppercase tracking-wider mb-2">Kraj</p>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#3a3a3a] pointer-events-none" />
              <select value={common.country} onChange={e => setCommon({ ...common, country: e.target.value })}
                className="w-full pl-9 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.07] rounded-xl text-[13px] text-[#c8c8c8] focus:outline-none focus:border-white/[0.14] transition-all appearance-none cursor-pointer"
              >
                <option value="Polska" className="bg-[#161616] text-[#d4d4d4]">Polska</option>
                <option value="Niemcy" className="bg-[#161616] text-[#d4d4d4]">Niemcy</option>
                <option value="Francja" className="bg-[#161616] text-[#d4d4d4]">Francja</option>
                <option value="UK" className="bg-[#161616] text-[#d4d4d4]">Wielka Brytania</option>
                <option value="Global" className="bg-[#161616] text-[#d4d4d4]">Cały świat</option>
              </select>
            </div>
          </div>
          <div>
            <p className="text-[11px] font-medium text-[#4a4a4a] uppercase tracking-wider mb-2">Miasto *</p>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#3a3a3a] pointer-events-none" />
              <input type="text" value={common.city} onChange={e => setCommon({ ...common, city: e.target.value })}
                placeholder="np. Warszawa"
                className="w-full pl-9 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.07] rounded-xl text-[13px] text-[#c8c8c8] placeholder:text-[#3a3a3a] focus:outline-none focus:border-white/[0.14] transition-all"
              />
            </div>
          </div>
          <div>
            <p className="text-[11px] font-medium text-[#4a4a4a] uppercase tracking-wider mb-2">Słowa kluczowe</p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#3a3a3a] pointer-events-none" />
              <input type="text" value={common.keywords} onChange={e => setCommon({ ...common, keywords: e.target.value })}
                placeholder="np. eksport, B2B, premium"
                className="w-full pl-9 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.07] rounded-xl text-[13px] text-[#c8c8c8] placeholder:text-[#3a3a3a] focus:outline-none focus:border-white/[0.14] transition-all"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-white/[0.05]">
          <button onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between px-5 py-3.5 text-[13px] text-[#444] hover:text-[#888] transition-colors"
          >
            <span className="flex items-center gap-2 font-medium">
              <SlidersHorizontal className="size-3.5" />
              Filtry zaawansowane
              <span className="text-[10px] px-2 py-0.5 bg-white/[0.03] border border-white/[0.05] rounded-full font-mono text-[#333]">{selectedPlatforms.join(' + ')}</span>
            </span>
            {showAdvanced ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="p-5 space-y-4">
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <div className="flex items-center gap-2 mb-4">
                      <Globe className="size-3.5 text-[#555]" />
                      <p className="text-[11px] font-semibold text-[#555] uppercase tracking-wider">Filtry Google Maps</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-4">
                        <SliderRow label="Min. ocena Google" value={gFilters.minRating} min={1} max={5} step={0.1} format={v => `${v.toFixed(1)} ★`} onChange={v => setGFilters({ ...gFilters, minRating: v })} icon={<Star className="size-3 text-[#777]" />} />
                        <SliderRow label="Min. liczba opinii" value={gFilters.minReviews} min={0} max={200} step={5} format={v => `${v}+`} onChange={v => setGFilters({ ...gFilters, minReviews: v })} icon={<BarChart2 className="size-3 text-[#777]" />} />
                      </div>
                      <div className="space-y-2.5">
                        <CheckRow label="Wymagaj strony WWW" checked={gFilters.requireWebsite} onChange={v => setGFilters({ ...gFilters, requireWebsite: v })} />
                        <CheckRow label="Wymagaj widocznego e-maila" checked={gFilters.requireEmail} onChange={v => setGFilters({ ...gFilters, requireEmail: v })} />
                        <CheckRow label="Wymagaj numeru telefonu" checked={gFilters.requirePhone} onChange={v => setGFilters({ ...gFilters, requirePhone: v })} />
                        <CheckRow label="Tylko aktualnie otwarte" checked={gFilters.requireOpenNow} onChange={v => setGFilters({ ...gFilters, requireOpenNow: v })} />
                      </div>
                    </div>
                  </div>

                  {selectedPlatforms.includes('instagram') && (
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                      <div className="flex items-center gap-2 mb-4">
                        <Instagram className="size-3.5 text-[#555]" />
                        <p className="text-[11px] font-semibold text-[#555] uppercase tracking-wider">Filtry Instagram</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-4">
                          <SliderRow label="Min. obserwujący" value={igFilters.minFollowers} min={0} max={100000} step={500} format={v => v >= 1000 ? `${(v/1000).toFixed(1)}K` : `${v}`} onChange={v => setIgFilters({ ...igFilters, minFollowers: v })} icon={<Users className="size-3 text-[#777]" />} />
                          <SliderRow label="Max. obserwujący" value={igFilters.maxFollowers} min={1000} max={1000000} step={1000} format={v => `${(v/1000).toFixed(0)}K`} onChange={v => setIgFilters({ ...igFilters, maxFollowers: v })} icon={<Users className="size-3 text-[#777]" />} />
                          <SliderRow label="Min. engagement rate" value={igFilters.minEngagementRate} min={0} max={20} step={0.1} format={v => `${v.toFixed(1)}%`} onChange={v => setIgFilters({ ...igFilters, minEngagementRate: v })} icon={<TrendingUp className="size-3 text-[#777]" />} />
                          <SliderRow label="Min. liczba postów" value={igFilters.minPosts} min={0} max={200} step={1} format={v => `${v}+`} onChange={v => setIgFilters({ ...igFilters, minPosts: v })} icon={<BarChart2 className="size-3 text-[#777]" />} />
                        </div>
                        <div className="space-y-2.5">
                          <CheckRow label="Tylko konta biznesowe" checked={igFilters.businessAccountOnly} onChange={v => setIgFilters({ ...igFilters, businessAccountOnly: v })} />
                          <CheckRow label="Wymagaj e-maila w bio" checked={igFilters.requireEmail} onChange={v => setIgFilters({ ...igFilters, requireEmail: v })} />
                          <CheckRow label="Wymagaj linku do strony w bio" checked={igFilters.requireWebsite} onChange={v => setIgFilters({ ...igFilters, requireWebsite: v })} />
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedPlatforms.includes('linkedin') && (
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                      <div className="flex items-center gap-2 mb-4">
                        <Linkedin className="size-3.5 text-[#555]" />
                        <p className="text-[11px] font-semibold text-[#555] uppercase tracking-wider">Filtry LinkedIn</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-4">
                          <SliderRow label="Min. pracowników" value={liFilters.minEmployees} min={1} max={500} step={1} format={v => `${v}+`} onChange={v => setLiFilters({ ...liFilters, minEmployees: v })} icon={<Users className="size-3 text-[#777]" />} />
                          <SliderRow label="Max. pracowników" value={liFilters.maxEmployees} min={1} max={10000} step={10} format={v => v >= 1000 ? `${(v/1000).toFixed(1)}k` : `${v}`} onChange={v => setLiFilters({ ...liFilters, maxEmployees: v })} icon={<Users className="size-3 text-[#777]" />} />
                          <div>
                            <p className="text-[11px] font-medium text-[#4a4a4a] uppercase tracking-wider mb-2">Założona po roku</p>
                            <input type="number" min={1900} max={2024} placeholder="np. 2015" value={liFilters.foundedAfter} onChange={e => setLiFilters({ ...liFilters, foundedAfter: e.target.value })}
                              className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.07] rounded-xl text-[13px] text-[#c8c8c8] placeholder:text-[#3a3a3a] focus:outline-none focus:border-white/[0.14] transition-all" />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <p className="text-[11px] font-medium text-[#4a4a4a] uppercase tracking-wider mb-2">Wielkość firmy</p>
                            <div className="flex flex-wrap gap-1.5">
                              {COMPANY_SIZES.map(size => (
                                <button key={size} onClick={() => toggleCompanySize(size)}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-all ${liFilters.companySize.includes(size) ? 'bg-white/[0.08] border-white/[0.15] text-[#c8c8c8]' : 'bg-transparent border-white/[0.06] text-[#555] hover:border-white/[0.12] hover:text-[#888]'}`}
                                >{size}</button>
                              ))}
                            </div>
                          </div>
                          <CheckRow label="Wymagaj strony WWW" checked={liFilters.requireWebsite} onChange={v => setLiFilters({ ...liFilters, requireWebsite: v })} />
                          <CheckRow label="Aktywne oferty pracy" checked={liFilters.hasActiveJobs} onChange={v => setLiFilters({ ...liFilters, hasActiveJobs: v })} />
                          <CheckRow label="Szukaj adresu e-mail" checked={liFilters.requireEmail} onChange={v => setLiFilters({ ...liFilters, requireEmail: v })} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="border-t border-white/[0.05] p-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex-1 w-full">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-medium text-[#4a4a4a] uppercase tracking-wider">Maksymalna liczba leadów</p>
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-bold text-[#c8c8c8] font-mono">{common.maxLeads}</span>
                <span className="text-[11px] text-[#333]">· maks. {common.maxLeads * tokenCostPerLead} tokenów</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-[#333] font-mono shrink-0">1</span>
              <input type="range" min={1} max={500} step={1} value={common.maxLeads} onChange={e => setCommon({ ...common, maxLeads: parseInt(e.target.value) })}
                className="flex-1 h-px bg-white/[0.08] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#c8c8c8]" />
              <span className="text-[11px] text-[#333] font-mono shrink-0">500</span>
            </div>
            <p className="text-[11px] text-[#2e2e2e] mt-1.5">Jeśli w danym mieście jest mniej wyników, zwrócimy tyle ile znajdziemy</p>
          </div>
          <button onClick={handleSearch} disabled={isSearching}
            className="shrink-0 w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-[#d4d4d4] hover:bg-white text-[#111] text-[13px] font-semibold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSearching ? <><Loader2 className="size-4 animate-spin" /> Skanowanie sieci...</> : <><Search className="size-4" /> Rozpocznij skanowanie</>}
          </button>
        </div>
      </motion.div>

      {/* Wyniki */}
      {leads.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-white/[0.05] flex items-center justify-between">
            <div>
              <p className="text-[14px] font-semibold text-[#c8c8c8]">Wyniki — {leads.length} leadów</p>
              <p className="text-[12px] text-[#444] mt-0.5">
                {leads.filter(l => l.emailFound).length} z e-mailem · {leads.filter(l => l.status === 'sent').length} wysłanych
              </p>
            </div>
            {selectedLeads.length > 0 && (
              <button onClick={handleSendSelected}
                className="flex items-center gap-2 px-4 py-2 bg-[#c8c8c8] hover:bg-white text-[#111] text-[12px] font-semibold rounded-xl transition-all"
              >
                <Send className="size-3.5" />
                Wyślij zaznaczone ({selectedLeads.filter(id => leads.find(l => l.id === id)?.status === 'ready').length})
              </button>
            )}
          </div>

          {/* Header */}
          <div className="grid grid-cols-12 gap-3 px-5 py-2.5 text-[10px] font-medium text-[#333] uppercase tracking-wider border-b border-white/[0.04]">
            <div className="col-span-1 flex items-center">
              <label className="relative flex items-center justify-center size-3.5 cursor-pointer">
                <input type="checkbox" checked={selectedLeads.length === leads.length && leads.length > 0} onChange={toggleAll} className="peer sr-only" />
                <div className="absolute inset-0 rounded border border-white/[0.12] bg-white/[0.03] peer-checked:bg-[#c8c8c8] peer-checked:border-[#c8c8c8] transition-all" />
                <Check className="size-2.5 text-black opacity-0 peer-checked:opacity-100 relative z-10" strokeWidth={3} />
              </label>
            </div>
            <div className="col-span-3">Firma</div>
            <div className="col-span-2">Kontakt</div>
            <div className="col-span-2">Metryki</div>
            <div className="col-span-3">Mail AI</div>
            <div className="col-span-1">Akcja</div>
          </div>

          {/* Wiersze */}
          <div className="divide-y divide-white/[0.04]">
            {leads.map(lead => (
              <div key={lead.id} className={`grid grid-cols-12 gap-3 px-5 py-3.5 transition-all hover:bg-white/[0.02] ${selectedLeads.includes(lead.id) ? 'bg-white/[0.03]' : ''}`}>

                {/* Checkbox */}
                <div className="col-span-1 flex items-center">
                  <label className="relative flex items-center justify-center size-3.5 cursor-pointer">
                    <input type="checkbox" checked={selectedLeads.includes(lead.id)} onChange={() => toggleLead(lead.id)} className="peer sr-only" />
                    <div className="absolute inset-0 rounded border border-white/[0.12] bg-white/[0.03] peer-checked:bg-[#c8c8c8] peer-checked:border-[#c8c8c8] transition-all" />
                    <Check className="size-2.5 text-black opacity-0 peer-checked:opacity-100 relative z-10" strokeWidth={3} />
                  </label>
                </div>

                {/* Firma */}
                <div className="col-span-3 flex flex-col justify-center">
                  <p className="text-[13px] font-semibold text-[#c8c8c8] leading-tight">{lead.companyName}</p>
                  <p className="text-[11px] text-[#444] mt-0.5 flex items-center gap-1"><MapPin className="size-2.5" />{lead.city}</p>
                  {lead.phone && <p className="text-[11px] text-[#444] flex items-center gap-1 mt-0.5"><Phone className="size-2.5" />{lead.phone}</p>}
                </div>

                {/* Kontakt */}
                <div className="col-span-2 flex flex-col justify-center gap-1">
                  {lead.website && (
                    <a href={`https://${lead.domain}`} target="_blank" rel="noopener noreferrer" className="text-[11px] text-[#444] hover:text-[#888] flex items-center gap-1 truncate transition-colors">
                      <ExternalLink className="size-2.5 shrink-0" />{lead.domain}
                    </a>
                  )}
                  {lead.emailFound
                    ? <p className="text-[11px] text-green-600/70 flex items-center gap-1 truncate"><Mail className="size-2.5 shrink-0" />{lead.emailAddress}</p>
                    : <p className="text-[11px] text-[#333] flex items-center gap-1"><Mail className="size-2.5 shrink-0" />Brak e-maila</p>
                  }
                </div>

                {/* Metryki */}
                <div className="col-span-2 flex flex-col justify-center gap-1">
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-white/[0.03] rounded-lg border border-white/[0.06] text-[11px]">
                      <Star className="size-2.5 text-[#777]" />
                      <span className="text-[#b0b0b0] font-mono font-semibold">{lead.rating}</span>
                    </div>
                    <span className="text-[11px] text-[#444]">{lead.reviewsCount} op.</span>
                  </div>
                  {lead.instagram.available && (
                    <p className="text-[11px] text-[#444] flex items-center gap-1">
                      <Instagram className="size-2.5" />{lead.instagram.followers?.toLocaleString()} obserwujących
                    </p>
                  )}
                  {lead.linkedin.available && (
                    <p className="text-[11px] text-[#444] flex items-center gap-1">
                      <Linkedin className="size-2.5" />{lead.linkedin.employeeCount} pracowników
                    </p>
                  )}
                </div>

                {/* Mail AI */}
                <div className="col-span-3 flex flex-col justify-center">
                  {lead.subject ? (
                    <>
                      <p className="text-[12px] font-medium text-[#888] leading-tight truncate">{lead.subject}</p>
                      <p className="text-[11px] text-[#444] mt-0.5 line-clamp-2 leading-relaxed">{lead.body}</p>
                      <button onClick={() => setPreviewLead(lead)} className="text-[11px] text-[#555] hover:text-[#888] flex items-center gap-1 mt-1 transition-colors">
                        <Eye className="size-3" /> Podgląd maila
                      </button>
                    </>
                  ) : (
                    <p className="text-[11px] text-[#333]">Brak — e-mail nieznaleziony</p>
                  )}
                </div>

                {/* Akcja */}
                <div className="col-span-1 flex items-center justify-center">
                  {lead.status === 'sent' ? (
                    <div className="flex items-center gap-1 text-green-600/70 text-[11px]">
                      <Check className="size-3" strokeWidth={3} /> Wysłano
                    </div>
                  ) : lead.emailFound ? (
                    <button onClick={() => handleSendEmail(lead)} disabled={sendingLeads.includes(lead.id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-[#888] hover:text-[#c8c8c8] text-[11px] rounded-lg transition-all disabled:opacity-50"
                    >
                      {sendingLeads.includes(lead.id) ? <Loader2 className="size-3 animate-spin" /> : <Send className="size-3" />}
                    </button>
                  ) : (
                    <span className="text-[11px] text-[#2e2e2e]">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Modal podglądu maila */}
      <AnimatePresence>
        {previewLead && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6"
            onClick={() => setPreviewLead(null)}
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111] border border-white/[0.1] rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-[14px] font-semibold text-[#c8c8c8]">Podgląd maila</p>
                  <p className="text-[12px] text-[#444] mt-0.5">Do: {previewLead.emailAddress}</p>
                </div>
                <button onClick={() => setPreviewLead(null)} className="text-[#444] hover:text-[#888] transition-colors">
                  <X className="size-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-3 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                  <p className="text-[10px] text-[#444] uppercase tracking-wider mb-1">Temat</p>
                  <p className="text-[13px] font-medium text-[#c8c8c8]">{previewLead.subject}</p>
                </div>

                <div className="p-3 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                  <p className="text-[10px] text-[#444] uppercase tracking-wider mb-2">Treść</p>
                  <p className="text-[13px] text-[#888] leading-relaxed whitespace-pre-wrap">{previewLead.body}</p>
                </div>

                {previewLead.personalizationUsed?.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    <p className="text-[11px] text-[#444] w-full">Użyta personalizacja:</p>
                    {previewLead.personalizationUsed.map(p => (
                      <span key={p} className="text-[10px] px-2 py-0.5 bg-white/[0.05] border border-white/[0.08] rounded-full text-[#666] font-mono">{p}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setPreviewLead(null)} className="flex-1 py-2.5 border border-white/[0.08] text-[#555] hover:text-[#888] text-[13px] rounded-xl transition-all">
                  Zamknij
                </button>
                {previewLead.status !== 'sent' && (
                  <button onClick={() => { handleSendEmail(previewLead); setPreviewLead(null); }}
                    className="flex-1 py-2.5 bg-[#d4d4d4] hover:bg-white text-[#111] text-[13px] font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Send className="size-4" /> Wyślij ten mail
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating bar */}
      <AnimatePresence>
        {selectedLeads.length > 0 && (
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="bg-[#e8e8e8] rounded-2xl shadow-2xl shadow-black/50 px-6 py-3.5 flex items-center gap-5">
              <div className="flex items-center gap-2.5">
                <div className="size-7 bg-[#111] rounded-full flex items-center justify-center">
                  <Check className="size-3 text-white" strokeWidth={3} />
                </div>
                <span className="font-semibold text-[#111] text-[13px]">
                  {selectedLeads.length} {selectedLeads.length === 1 ? 'lead wybrany' : 'leadów wybranych'}
                </span>
              </div>
              <button onClick={handleSendSelected}
                className="flex items-center gap-1.5 bg-[#111] hover:bg-[#222] text-white text-[13px] font-semibold px-5 py-2.5 rounded-xl transition-all group"
              >
                <Send className="size-3.5" />
                Wyślij zaznaczone
                <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}