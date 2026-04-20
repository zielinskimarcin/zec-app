import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, Globe, MapPin, Building2, Star, Mail, Check,
  ArrowRight, Coins, ChevronDown, ChevronUp, AlertCircle,
  Loader2, Users, TrendingUp, BarChart2,
  ExternalLink, SlidersHorizontal, Phone, Eye, X, Briefcase,
  BookmarkPlus, Sparkles, PlusCircle
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
  brief: string | null;
  briefSources: string[];
  status: 'new' | 'saved';
  package: string | null;
  instagram: { available: boolean; followers: number | null; handle: string | null; bio: string | null };
  linkedin: { available: boolean; industry: string | null; employeeCount: number | null; size: string | null };
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
  { id: 'google',    label: 'Google',    tokenCost: 1, icon: <Globe className="size-3.5" />,     activeClass: 'bg-white/[0.06] border-white/[0.12] text-[#EAE8E1]' },
  { id: 'instagram', label: 'Instagram', tokenCost: 2, icon: <Instagram className="size-3.5" />, activeClass: 'bg-white/[0.06] border-white/[0.12] text-[#EAE8E1]' },
  { id: 'linkedin',  label: 'LinkedIn',  tokenCost: 3, icon: <Linkedin className="size-3.5" />,  activeClass: 'bg-white/[0.06] border-white/[0.12] text-[#EAE8E1]' },
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
        <span className="flex items-center gap-1.5 text-[11px] text-[#A3A09A] font-medium uppercase tracking-wider">{icon}{label}</span>
        <span className="text-[12px] font-mono font-semibold text-[#827E78]">{format(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-px bg-white/[0.08] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#EAE8E1]" />
    </div>
  );
}

function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <div className="relative flex items-center justify-center size-4 shrink-0">
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="peer sr-only" />
        <div className="absolute inset-0 rounded border border-white/[0.12] bg-white/[0.03] peer-checked:bg-[#EAE8E1] peer-checked:border-[#EAE8E1] transition-all" />
        <Check className="size-2.5 text-black opacity-0 peer-checked:opacity-100 relative z-10" strokeWidth={3} />
      </div>
      <span className="text-[12px] text-[#A3A09A] group-hover:text-[#EAE8E1] transition-colors">{label}</span>
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
  const [savedLeads, setSavedLeads] = useState<number[]>([]);

  const [availableTokens, setAvailableTokens] = useState<number>(0);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [isAddingCredits, setIsAddingCredits] = useState(false);

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
        setUserId(session.user.id);
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
      const webhookUrl = `https://n8n.srv1579942.hstgr.cloud/webhook/c09267cb-9b52-45e1-84a4-cdb53bbeaa77?package=${getPackage(selectedPlatforms)}`;
      const pkg = getPackage(selectedPlatforms);
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId ?? 'test_user_001',
          package: pkg,
          meta: {
            package: pkg,
          },
          client: {
            name: userProfile?.full_name || 'Jan Kowalski',
            email: userEmail || 'jan@test.pl',
            offer: userProfile?.offer || 'Automatyzacja lead generation B2B',
            language: 'pl',
          },
          common: {
            industry: common.industry,
            country: common.country,
            city: common.city,
            keywords: common.keywords,
            maxLeads: common.maxLeads,
          },
          filters: {
            google: {
              minRating: gFilters.minRating,
              minReviews: gFilters.minReviews,
              requireWebsite: gFilters.requireWebsite,
              requireEmail: gFilters.requireEmail,
              requirePhone: gFilters.requirePhone,
              requireOpenNow: gFilters.requireOpenNow,
            },
            instagram: {
              minFollowers: igFilters.minFollowers,
              maxFollowers: igFilters.maxFollowers,
              minEngagementRate: igFilters.minEngagementRate,
              minPosts: igFilters.minPosts,
              businessAccountOnly: igFilters.businessAccountOnly,
              requireEmail: igFilters.requireEmail,
              requireWebsite: igFilters.requireWebsite,
            },
            linkedin: {
              minEmployees: liFilters.minEmployees,
              maxEmployees: liFilters.maxEmployees,
              companySize: liFilters.companySize,
              requireWebsite: liFilters.requireWebsite,
              hasActiveJobs: liFilters.hasActiveJobs,
              requireEmail: liFilters.requireEmail,
              foundedAfter: liFilters.foundedAfter,
            },
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

  const handleSaveLead = async (lead: Lead) => {
    if (!userId || lead.status === 'saved') return;
    setSavedLeads(prev => [...prev, lead.id]);
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: 'saved' } : l));

    const queryHash = `${lead.companyName}_${lead.city}`.toLowerCase().replace(/\s+/g, '_');
    const { data: globalData, error: globalErr } = await supabase
      .from('global_leads')
      .upsert({ query_hash: queryHash, company_name: lead.companyName, email: lead.emailAddress, city: lead.city, industry: lead.category, website: lead.website }, { onConflict: 'query_hash' })
      .select('id')
      .single();

    if (globalErr || !globalData) { console.error('global_leads error:', globalErr); return; }

    await supabase.from('user_leads').insert({
      user_id: userId,
      global_lead_id: globalData.id,
      status: 'pending',
      summary: lead.brief,
      has_instagram: lead.instagram?.available ?? false,
      has_linkedin: lead.linkedin?.available ?? false,
      instagram_data: lead.instagram?.available ? lead.instagram : null,
      linkedin_data: lead.linkedin?.available ? lead.linkedin : null,
      history: [{ date: new Date().toISOString(), action: 'Wyszukano', details: 'Znaleziono przez wyszukiwarkę ZEC.' }],
    });
  };

  const handleSaveSelected = () => {
    leads.filter(l => selectedLeads.includes(l.id) && l.status !== 'saved').forEach(l => handleSaveLead(l));
  };

  const toggleLead = (id: number) => setSelectedLeads(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const toggleAll = () => selectedLeads.length === leads.length ? setSelectedLeads([]) : setSelectedLeads(leads.map(l => l.id));

  const handleAddDevCredits = async () => {
    setIsAddingCredits(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { alert('Musisz być zalogowany, aby dodać kredyty.'); setIsAddingCredits(false); return; }
      const newCreditsAmount = availableTokens + 9999;
      const { error } = await supabase.from('profiles').update({ credits: newCreditsAmount }).eq('id', session.user.id);
      if (error) throw error;
      setAvailableTokens(newCreditsAmount);
      alert('Dodano 9999 kredytów (DEV).');
    } catch (err: any) {
      console.error('Błąd dodawania kredytów:', err);
      alert('Nie udało się dodać kredytów.');
    } finally {
      setIsAddingCredits(false);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">

      {/* Top bar */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between bg-white/[0.04] border border-white/[0.08] rounded-2xl px-5 py-3.5"
      >
        <div>
          <h1 className="text-[18px] font-semibold text-[#EAE8E1] tracking-tight">Wyszukiwarka leadów</h1>
          <p className="text-[12px] text-[#A3A09A] mt-0.5">Znajdź firmy, poznaj je i zapisz do bazy leadów</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Coins className="size-4 text-[#A3A09A]" />
            <div>
              <p className="text-[10px] text-[#827E78] uppercase tracking-wider">Kredyty</p>
              <p className="text-[15px] font-bold text-[#EAE8E1] font-mono leading-none">{availableTokens.toLocaleString('pl-PL')}</p>
            </div>
            <button
              onClick={handleAddDevCredits}
              disabled={isAddingCredits}
              title="DEV: Dodaj 9999 Kredytów"
              className="ml-2 text-[#5d9970]/70 hover:text-[#5d9970] bg-[#5d9970]/10 hover:bg-[#5d9970]/20 p-1.5 rounded-lg transition-colors flex items-center justify-center border border-[#5d9970]/20 disabled:opacity-50"
            >
              {isAddingCredits ? <Loader2 className="size-3 animate-spin" /> : <PlusCircle className="size-3" />}
            </button>
          </div>
          <button className="text-[12px] text-[#A3A09A] hover:text-[#EAE8E1] border border-white/[0.08] hover:border-white/[0.15] px-3 py-1.5 rounded-xl transition-all">Doładuj</button>
        </div>
      </motion.div>

      {error && (
        <div className="p-4 rounded-xl bg-[#b56060]/10 border border-[#b56060]/20 flex items-center gap-3 text-[#b56060]">
          <AlertCircle className="size-4 shrink-0" /><span className="text-[13px]">{error}</span>
        </div>
      )}

      {/* Platformy */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5"
      >
        <p className="text-[11px] font-medium text-[#A3A09A] uppercase tracking-wider mb-3">Źródło danych</p>
        <div className="flex gap-2 flex-wrap">
          {PLATFORMS.map(p => {
            const active = selectedPlatforms.includes(p.id);
            return (
              <button key={p.id} onClick={() => togglePlatform(p.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-[13px] font-medium transition-all ${active ? p.activeClass : 'bg-transparent border-white/[0.05] text-[#827E78] hover:border-white/[0.1] hover:text-[#A3A09A]'} ${p.id === 'google' ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <span className={active ? 'text-[#EAE8E1]' : 'text-[#827E78]'}>{p.icon}</span>
                {p.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-lg font-mono ${active ? 'bg-white/[0.1] text-[#EAE8E1]' : 'bg-white/[0.05] text-[#827E78]'}`}>{p.tokenCost} tok/lead</span>
              </button>
            );
          })}
        </div>
        {selectedPlatforms.length > 1 && (
          <p className="text-[12px] text-[#A3A09A] mt-2.5">
            Koszt łączony: <span className="text-[#EAE8E1] font-mono font-semibold">{tokenCostPerLead} tok/lead</span>
            <span className="ml-2 text-[#827E78]">· pakiet: <span className="font-mono text-[#A3A09A]">{getPackage(selectedPlatforms)}</span></span>
          </p>
        )}
      </motion.div>

      {/* Filtry */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="rounded-2xl border border-white/[0.08] bg-white/[0.04] overflow-hidden"
      >
        <div className="p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-[11px] font-medium text-[#A3A09A] uppercase tracking-wider mb-2">Branża *</p>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#827E78] pointer-events-none" />
              <select value={common.industry} onChange={e => setCommon({ ...common, industry: e.target.value })}
                className="w-full pl-9 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-[13px] text-[#EAE8E1] focus:outline-none focus:border-white/[0.2] transition-all appearance-none cursor-pointer"
              >
                <option value="" className="bg-[#1a1a1a] text-[#A3A09A]">Wybierz branżę...</option>
                <option value="architektura" className="bg-[#1a1a1a] text-[#EAE8E1]">Architektura i Projektowanie</option>
                <option value="deweloper" className="bg-[#1a1a1a] text-[#EAE8E1]">Nieruchomości / Deweloper</option>
                <option value="marketing" className="bg-[#1a1a1a] text-[#EAE8E1]">Agencje Marketingowe</option>
                <option value="it" className="bg-[#1a1a1a] text-[#EAE8E1]">Software House / IT</option>
                <option value="meble" className="bg-[#1a1a1a] text-[#EAE8E1]">Meble i Wyposażenie</option>
                <option value="produkcja" className="bg-[#1a1a1a] text-[#EAE8E1]">Produkcja / Manufacturing</option>
                <option value="finanse" className="bg-[#1a1a1a] text-[#EAE8E1]">Finanse / Doradztwo</option>
                <option value="handel" className="bg-[#1a1a1a] text-[#EAE8E1]">Handel / E-commerce</option>
                <option value="restauracje" className="bg-[#1a1a1a] text-[#EAE8E1]">Restauracje / HoReCa</option>
              </select>
            </div>
          </div>
          <div>
            <p className="text-[11px] font-medium text-[#A3A09A] uppercase tracking-wider mb-2">Kraj</p>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#827E78] pointer-events-none" />
              <select value={common.country} onChange={e => setCommon({ ...common, country: e.target.value })}
                className="w-full pl-9 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-[13px] text-[#EAE8E1] focus:outline-none focus:border-white/[0.2] transition-all appearance-none cursor-pointer"
              >
                <option value="Polska" className="bg-[#1a1a1a] text-[#EAE8E1]">Polska</option>
                <option value="Niemcy" className="bg-[#1a1a1a] text-[#EAE8E1]">Niemcy</option>
                <option value="Francja" className="bg-[#1a1a1a] text-[#EAE8E1]">Francja</option>
                <option value="UK" className="bg-[#1a1a1a] text-[#EAE8E1]">Wielka Brytania</option>
                <option value="Global" className="bg-[#1a1a1a] text-[#EAE8E1]">Cały świat</option>
              </select>
            </div>
          </div>
          <div>
            <p className="text-[11px] font-medium text-[#A3A09A] uppercase tracking-wider mb-2">Miasto *</p>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#827E78] pointer-events-none" />
              <input type="text" value={common.city} onChange={e => setCommon({ ...common, city: e.target.value })}
                placeholder="np. Warszawa"
                className="w-full pl-9 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-[13px] text-[#EAE8E1] placeholder:text-[#827E78] focus:outline-none focus:border-white/[0.2] transition-all"
              />
            </div>
          </div>
          <div>
            <p className="text-[11px] font-medium text-[#A3A09A] uppercase tracking-wider mb-2">Słowa kluczowe</p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#827E78] pointer-events-none" />
              <input type="text" value={common.keywords} onChange={e => setCommon({ ...common, keywords: e.target.value })}
                placeholder="np. eksport, B2B, premium"
                className="w-full pl-9 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-[13px] text-[#EAE8E1] placeholder:text-[#827E78] focus:outline-none focus:border-white/[0.2] transition-all"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-white/[0.06]">
          <button onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between px-5 py-3.5 text-[13px] text-[#A3A09A] hover:text-[#EAE8E1] transition-colors"
          >
            <span className="flex items-center gap-2 font-medium">
              <SlidersHorizontal className="size-3.5" />
              Filtry zaawansowane
              <span className="text-[10px] px-2 py-0.5 bg-white/[0.04] border border-white/[0.08] rounded-full font-mono text-[#EAE8E1]">{selectedPlatforms.join(' + ')}</span>
            </span>
            {showAdvanced ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="p-5 space-y-4">
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <div className="flex items-center gap-2 mb-4">
                      <Globe className="size-3.5 text-[#A3A09A]" />
                      <p className="text-[11px] font-semibold text-[#A3A09A] uppercase tracking-wider">Filtry Google Maps</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-4">
                        <SliderRow label="Min. ocena Google" value={gFilters.minRating} min={1} max={5} step={0.1} format={v => `${v.toFixed(1)} ★`} onChange={v => setGFilters({ ...gFilters, minRating: v })} icon={<Star className="size-3 text-[#A3A09A]" />} />
                        <SliderRow label="Min. liczba opinii" value={gFilters.minReviews} min={0} max={200} step={5} format={v => `${v}+`} onChange={v => setGFilters({ ...gFilters, minReviews: v })} icon={<BarChart2 className="size-3 text-[#A3A09A]" />} />
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
                        <Instagram className="size-3.5 text-[#A3A09A]" />
                        <p className="text-[11px] font-semibold text-[#A3A09A] uppercase tracking-wider">Filtry Instagram</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-4">
                          <SliderRow label="Min. obserwujący" value={igFilters.minFollowers} min={0} max={100000} step={500} format={v => v >= 1000 ? `${(v/1000).toFixed(1)}K` : `${v}`} onChange={v => setIgFilters({ ...igFilters, minFollowers: v })} icon={<Users className="size-3 text-[#A3A09A]" />} />
                          <SliderRow label="Max. obserwujący" value={igFilters.maxFollowers} min={1000} max={1000000} step={1000} format={v => `${(v/1000).toFixed(0)}K`} onChange={v => setIgFilters({ ...igFilters, maxFollowers: v })} icon={<Users className="size-3 text-[#A3A09A]" />} />
                          <SliderRow label="Min. engagement rate" value={igFilters.minEngagementRate} min={0} max={20} step={0.1} format={v => `${v.toFixed(1)}%`} onChange={v => setIgFilters({ ...igFilters, minEngagementRate: v })} icon={<TrendingUp className="size-3 text-[#A3A09A]" />} />
                          <SliderRow label="Min. liczba postów" value={igFilters.minPosts} min={0} max={200} step={1} format={v => `${v}+`} onChange={v => setIgFilters({ ...igFilters, minPosts: v })} icon={<BarChart2 className="size-3 text-[#A3A09A]" />} />
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
                        <Linkedin className="size-3.5 text-[#A3A09A]" />
                        <p className="text-[11px] font-semibold text-[#A3A09A] uppercase tracking-wider">Filtry LinkedIn</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-4">
                          <SliderRow label="Min. pracowników" value={liFilters.minEmployees} min={1} max={500} step={1} format={v => `${v}+`} onChange={v => setLiFilters({ ...liFilters, minEmployees: v })} icon={<Users className="size-3 text-[#A3A09A]" />} />
                          <SliderRow label="Max. pracowników" value={liFilters.maxEmployees} min={1} max={10000} step={10} format={v => v >= 1000 ? `${(v/1000).toFixed(1)}k` : `${v}`} onChange={v => setLiFilters({ ...liFilters, maxEmployees: v })} icon={<Users className="size-3 text-[#A3A09A]" />} />
                          <div>
                            <p className="text-[11px] font-medium text-[#A3A09A] uppercase tracking-wider mb-2">Założona po roku</p>
                            <input type="number" min={1900} max={2024} placeholder="np. 2015" value={liFilters.foundedAfter} onChange={e => setLiFilters({ ...liFilters, foundedAfter: e.target.value })}
                              className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-[13px] text-[#EAE8E1] placeholder:text-[#827E78] focus:outline-none focus:border-white/[0.2] transition-all" />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <p className="text-[11px] font-medium text-[#A3A09A] uppercase tracking-wider mb-2">Wielkość firmy</p>
                            <div className="flex flex-wrap gap-1.5">
                              {COMPANY_SIZES.map(size => (
                                <button key={size} onClick={() => toggleCompanySize(size)}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-all ${liFilters.companySize.includes(size) ? 'bg-white/[0.08] border-white/[0.15] text-[#EAE8E1]' : 'bg-transparent border-white/[0.06] text-[#A3A09A] hover:border-white/[0.12] hover:text-[#EAE8E1]'}`}
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

        <div className="border-t border-white/[0.06] p-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex-1 w-full">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-medium text-[#A3A09A] uppercase tracking-wider">Maksymalna liczba leadów</p>
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-bold text-[#EAE8E1] font-mono">{common.maxLeads}</span>
                <span className="text-[11px] text-[#827E78]">· maks. {common.maxLeads * tokenCostPerLead} tokenów</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-[#827E78] font-mono shrink-0">1</span>
              <input type="range" min={1} max={500} step={1} value={common.maxLeads} onChange={e => setCommon({ ...common, maxLeads: parseInt(e.target.value) })}
                className="flex-1 h-px bg-white/[0.08] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#EAE8E1]" />
              <span className="text-[11px] text-[#827E78] font-mono shrink-0">500</span>
            </div>
            <p className="text-[11px] text-[#A3A09A] mt-1.5">Jeśli w danym mieście jest mniej wyników, zwrócimy tyle ile znajdziemy</p>
          </div>
          <button onClick={handleSearch} disabled={isSearching}
            className="shrink-0 w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-[#EAE8E1] hover:bg-white text-[#1A1A1A] text-[13px] font-semibold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSearching ? <><Loader2 className="size-4 animate-spin" /> Skanowanie sieci...</> : <><Search className="size-4" /> Rozpocznij skanowanie</>}
          </button>
        </div>
      </motion.div>

      {/* Wyniki */}
      {leads.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/[0.08] bg-white/[0.04] overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <div>
              <p className="text-[14px] font-semibold text-[#EAE8E1]">Wyniki — {leads.length} firm</p>
              <p className="text-[12px] text-[#A3A09A] mt-0.5">
                {leads.filter(l => l.emailFound).length} z e-mailem · {leads.filter(l => l.status === 'saved').length} zapisanych
              </p>
            </div>
            {selectedLeads.length > 0 && (
              <button onClick={handleSaveSelected}
                className="flex items-center gap-2 px-4 py-2 bg-[#EAE8E1] hover:bg-white text-[#1A1A1A] text-[12px] font-semibold rounded-xl transition-all"
              >
                <BookmarkPlus className="size-3.5" />
                Zapisz zaznaczone do leadów ({selectedLeads.length})
              </button>
            )}
          </div>

          {/* Header */}
          <div className="grid grid-cols-12 gap-3 px-5 py-2.5 text-[10px] font-medium text-[#A3A09A] uppercase tracking-wider border-b border-white/[0.06]">
            <div className="col-span-1 flex items-center">
              <label className="relative flex items-center justify-center size-3.5 cursor-pointer">
                <input type="checkbox" checked={selectedLeads.length === leads.length && leads.length > 0} onChange={toggleAll} className="peer sr-only" />
                <div className="absolute inset-0 rounded border border-white/[0.12] bg-white/[0.03] peer-checked:bg-[#EAE8E1] peer-checked:border-[#EAE8E1] transition-all" />
                <Check className="size-2.5 text-black opacity-0 peer-checked:opacity-100 relative z-10" strokeWidth={3} />
              </label>
            </div>
            <div className="col-span-3">Firma</div>
            <div className="col-span-2">Kontakt</div>
            <div className="col-span-2">Metryki</div>
            <div className="col-span-3">Brief AI</div>
            <div className="col-span-1">Akcja</div>
          </div>

          {/* Wiersze */}
          <div className="divide-y divide-white/[0.04]">
            {leads.map(lead => (
              <div key={lead.id} className={`grid grid-cols-12 gap-3 px-5 py-3.5 transition-all hover:bg-white/[0.02] ${selectedLeads.includes(lead.id) ? 'bg-white/[0.06]' : ''}`}>

                <div className="col-span-1 flex items-center">
                  <label className="relative flex items-center justify-center size-3.5 cursor-pointer">
                    <input type="checkbox" checked={selectedLeads.includes(lead.id)} onChange={() => toggleLead(lead.id)} className="peer sr-only" />
                    <div className="absolute inset-0 rounded border border-white/[0.12] bg-white/[0.03] peer-checked:bg-[#EAE8E1] peer-checked:border-[#EAE8E1] transition-all" />
                    <Check className="size-2.5 text-black opacity-0 peer-checked:opacity-100 relative z-10" strokeWidth={3} />
                  </label>
                </div>

                {/* Firma */}
                <div className="col-span-3 flex flex-col justify-center">
                  <p className="text-[13px] font-semibold text-[#EAE8E1] leading-tight">{lead.companyName}</p>
                  <p className="text-[11px] text-[#A3A09A] mt-0.5 flex items-center gap-1"><MapPin className="size-2.5" />{lead.city}</p>
                  {lead.category && <p className="text-[11px] text-[#827E78] mt-0.5">{lead.category}</p>}
                </div>

                {/* Kontakt */}
                <div className="col-span-2 flex flex-col justify-center gap-1">
                  {lead.website && (
                    <a href={`https://${lead.domain}`} target="_blank" rel="noopener noreferrer" className="text-[11px] text-[#A3A09A] hover:text-[#EAE8E1] flex items-center gap-1 truncate transition-colors">
                      <ExternalLink className="size-2.5 shrink-0" />{lead.domain}
                    </a>
                  )}
                  {lead.phone && (
                    <p className="text-[11px] text-[#A3A09A] flex items-center gap-1">
                      <Phone className="size-2.5 shrink-0" />{lead.phone}
                    </p>
                  )}
                  {lead.emailFound
                    ? <p className="text-[11px] text-[#5d9970] flex items-center gap-1 truncate"><Mail className="size-2.5 shrink-0" />{lead.emailAddress}</p>
                    : <p className="text-[11px] text-[#827E78] flex items-center gap-1"><Mail className="size-2.5 shrink-0" />Brak e-maila</p>
                  }
                </div>

                {/* Metryki */}
                <div className="col-span-2 flex flex-col justify-center gap-1">
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white/[0.04] rounded-lg border border-white/[0.08] text-[11px]">
                      <Star className="size-2.5 text-[#A3A09A]" />
                      <span className="text-[#EAE8E1] font-mono font-semibold">{lead.rating}</span>
                    </div>
                    <span className="text-[11px] text-[#A3A09A]">{lead.reviewsCount} op.</span>
                  </div>
                  {(lead.package === 'instagram' || lead.package === 'full') && (
                    lead.instagram?.available && lead.instagram?.followers ? (
                      <div className="flex items-center gap-1 text-[11px] text-[#EAE8E1]">
                        <Instagram className="size-2.5 shrink-0 text-[#A3A09A]" />
                        <span className="font-mono">{lead.instagram.followers.toLocaleString()}</span>
                        <span className="text-[#A3A09A]">obserwujących</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-[11px] text-[#827E78]">
                        <Instagram className="size-2.5 shrink-0" /><span>Brak profilu IG</span>
                      </div>
                    )
                  )}
                  {(lead.package === 'linkedin' || lead.package === 'full') && (
                    lead.linkedin?.available ? (
                      <>
                        {lead.linkedin.employeeCount && (
                          <div className="flex items-center gap-1 text-[11px] text-[#EAE8E1]">
                            <Users className="size-2.5 shrink-0 text-[#A3A09A]" />
                            <span className="font-mono">{lead.linkedin.employeeCount}</span>
                            <span className="text-[#A3A09A]">pracowników</span>
                          </div>
                        )}
                        {lead.linkedin.industry && (
                          <div className="flex items-center gap-1 text-[11px] text-[#A3A09A]">
                            <Briefcase className="size-2.5 shrink-0" />
                            <span className="truncate">{lead.linkedin.industry}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center gap-1 text-[11px] text-[#827E78]">
                        <Linkedin className="size-2.5 shrink-0" /><span>Brak profilu LI</span>
                      </div>
                    )
                  )}
                </div>

                {/* Brief AI */}
                <div className="col-span-3 flex flex-col justify-center">
                  {lead.brief ? (
                    <>
                      <div className="flex items-center gap-1 mb-1">
                        <Sparkles className="size-2.5 text-[#A3A09A]" />
                        <span className="text-[10px] text-[#A3A09A] uppercase tracking-wider font-medium">Brief AI</span>
                      </div>
                      <p className="text-[11px] text-[#827E78] leading-relaxed line-clamp-3">{lead.brief}</p>
                      <button onClick={() => setPreviewLead(lead)} className="text-[11px] text-[#A3A09A] hover:text-[#EAE8E1] flex items-center gap-1 mt-1 transition-colors">
                        <Eye className="size-3" /> Czytaj więcej
                      </button>
                    </>
                  ) : (
                    <p className="text-[11px] text-[#827E78]">Brak briefu</p>
                  )}
                </div>

                {/* Akcja */}
                <div className="col-span-1 flex items-center justify-center">
                  {lead.status === 'saved' ? (
                    <div className="flex items-center gap-1 text-[#5d9970] text-[11px]">
                      <Check className="size-3" strokeWidth={3} /> Zapisano
                    </div>
                  ) : (
                    <button onClick={() => handleSaveLead(lead)}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-[#A3A09A] hover:text-[#EAE8E1] text-[11px] rounded-lg transition-all"
                    >
                      <BookmarkPlus className="size-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Następny krok */}
          {leads.filter(l => l.status === 'saved').length > 0 && (
            <div className="px-5 py-4 border-t border-white/[0.06] flex items-center justify-between bg-white/[0.02]">
              <p className="text-[12px] text-[#A3A09A]">
                Zapisano {leads.filter(l => l.status === 'saved').length} leadów do bazy
              </p>
              <a href="/app/campaigns" className="flex items-center gap-2 text-[13px] font-semibold text-[#EAE8E1] hover:text-white transition-colors">
                Stwórz kampanię dla tych leadów
                <ArrowRight className="size-4" />
              </a>
            </div>
          )}
        </motion.div>
      )}

      {/* Modal podglądu briefu */}
      <AnimatePresence>
        {previewLead && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6 backdrop-blur-sm"
            onClick={() => setPreviewLead(null)}
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1a1a1a] border border-white/[0.1] rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-[14px] font-semibold text-[#EAE8E1]">{previewLead.companyName}</p>
                  <p className="text-[12px] text-[#A3A09A] mt-0.5">{previewLead.city} · {previewLead.category}</p>
                </div>
                <button onClick={() => setPreviewLead(null)} className="text-[#827E78] hover:text-[#EAE8E1] transition-colors">
                  <X className="size-5" />
                </button>
              </div>

              <div className="space-y-4">
                {previewLead.brief && (
                  <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.08]">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="size-3.5 text-[#A3A09A]" />
                      <p className="text-[11px] text-[#A3A09A] uppercase tracking-wider font-medium">Brief AI</p>
                    </div>
                    <p className="text-[13px] text-[#EAE8E1] leading-relaxed">{previewLead.brief}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {previewLead.emailFound && (
                    <div className="p-3 bg-white/[0.02] rounded-xl border border-white/[0.08]">
                      <p className="text-[10px] text-[#A3A09A] uppercase tracking-wider mb-1">E-mail</p>
                      <p className="text-[12px] text-[#5d9970]">{previewLead.emailAddress}</p>
                    </div>
                  )}
                  {previewLead.phone && (
                    <div className="p-3 bg-white/[0.02] rounded-xl border border-white/[0.08]">
                      <p className="text-[10px] text-[#A3A09A] uppercase tracking-wider mb-1">Telefon</p>
                      <p className="text-[12px] text-[#EAE8E1]">{previewLead.phone}</p>
                    </div>
                  )}
                  <div className="p-3 bg-white/[0.02] rounded-xl border border-white/[0.08]">
                    <p className="text-[10px] text-[#A3A09A] uppercase tracking-wider mb-1">Ocena Google</p>
                    <p className="text-[12px] text-[#EAE8E1]">{previewLead.rating}/5 · {previewLead.reviewsCount} opinii</p>
                  </div>
                  {previewLead.instagram?.available && (
                    <div className="p-3 bg-white/[0.02] rounded-xl border border-white/[0.08]">
                      <p className="text-[10px] text-[#A3A09A] uppercase tracking-wider mb-1">Instagram</p>
                      <p className="text-[12px] text-[#EAE8E1]">{previewLead.instagram.followers?.toLocaleString()} obserwujących</p>
                    </div>
                  )}
                  {previewLead.linkedin?.available && (
                    <div className="p-3 bg-white/[0.02] rounded-xl border border-white/[0.08]">
                      <p className="text-[10px] text-[#A3A09A] uppercase tracking-wider mb-1">LinkedIn</p>
                      <p className="text-[12px] text-[#EAE8E1]">{previewLead.linkedin.employeeCount} pracowników · {previewLead.linkedin.industry}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setPreviewLead(null)} className="flex-1 py-2.5 border border-white/[0.1] text-[#A3A09A] hover:text-[#EAE8E1] text-[13px] rounded-xl transition-all">
                  Zamknij
                </button>
                {previewLead.status !== 'saved' && (
                  <button onClick={() => { handleSaveLead(previewLead); setPreviewLead(null); }}
                    className="flex-1 py-2.5 bg-[#EAE8E1] hover:bg-white text-[#1A1A1A] text-[13px] font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <BookmarkPlus className="size-4" /> Zapisz do leadów
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
            <div className="bg-[#1A1A1A] border border-white/[0.1] rounded-2xl shadow-2xl px-6 py-3.5 flex items-center gap-5">
              <div className="flex items-center gap-2.5">
                <div className="size-7 bg-[#EAE8E1] rounded-full flex items-center justify-center">
                  <Check className="size-3 text-[#1A1A1A]" strokeWidth={3} />
                </div>
                <span className="font-semibold text-[#EAE8E1] text-[13px]">
                  {selectedLeads.length} {selectedLeads.length === 1 ? 'firma wybrana' : 'firm wybranych'}
                </span>
              </div>
              <button onClick={handleSaveSelected}
                className="flex items-center gap-1.5 bg-[#EAE8E1] hover:bg-white text-[#1A1A1A] text-[13px] font-semibold px-5 py-2.5 rounded-xl transition-all group"
              >
                <BookmarkPlus className="size-3.5" />
                Zapisz do leadów
                <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}