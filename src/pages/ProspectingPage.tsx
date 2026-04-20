import { useState, useEffect, useRef } from 'react';
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

// IMPORT TWOICH DANYCH Z LISTY
import { INDUSTRIES, CITIES, COUNTRIES } from '../data/searchOptions';

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
  { id: 'google',    label: 'Google Maps',    tokenCost: 1, icon: <Globe className="size-3.5" />,     activeClass: 'bg-white/[0.08] border-white/[0.2] text-[#EAE8E1]' },
  { id: 'instagram', label: 'Instagram', tokenCost: 2, icon: <Instagram className="size-3.5" />, activeClass: 'bg-white/[0.08] border-white/[0.2] text-[#EAE8E1]' },
  { id: 'linkedin',  label: 'LinkedIn',  tokenCost: 3, icon: <Linkedin className="size-3.5" />,  activeClass: 'bg-white/[0.08] border-white/[0.2] text-[#EAE8E1]' },
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

// --- KOMPONENT AUTOCOMPLETE (Wymuszający wybór z listy) ---

function Autocomplete({
  value, onChange, options, placeholder, icon: Icon
}: {
  value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; placeholder: string; icon: React.ElementType;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Synchronizacja query z podanym `value`
  useEffect(() => {
    const selectedOpt = options.find(o => o.value === value);
    setQuery(selectedOpt ? selectedOpt.label : '');
  }, [value, options]);

  const filtered = options.filter(o => 
    o.label.toLowerCase().includes(query.toLowerCase()) || 
    o.value.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        const selectedOpt = options.find(o => o.value === value);
        setQuery(selectedOpt ? selectedOpt.label : '');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value, options]);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#827E78] pointer-events-none z-10" />
      <input
        type="text"
        value={query}
        onChange={e => { setQuery(e.target.value); setIsOpen(true); }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-[14px] text-[#EAE8E1] placeholder:text-[#827E78] focus:border-white/[0.2] outline-none transition-all relative z-0"
      />
      <AnimatePresence>
        {isOpen && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.15 }}
            className="absolute top-[calc(100%+8px)] left-0 right-0 max-h-64 overflow-y-auto bg-[#1A1A1A] border border-white/[0.12] rounded-xl shadow-2xl z-50 p-1 custom-scrollbar"
          >
            {filtered.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-[13px] text-[#EAE8E1] hover:bg-white/[0.06] rounded-lg transition-colors"
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Pozostałe komponenty pomocnicze ---

function SliderRow({ label, value, min, max, step, format, onChange, icon }: {
  label: string; value: number; min: number; max: number; step: number;
  format: (v: number) => string; onChange: (v: number) => void; icon?: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="flex items-center gap-1.5 text-[11px] text-[#827E78] font-medium uppercase tracking-wider">{icon}{label}</span>
        <span className="text-[12px] font-mono font-medium text-[#A3A09A]">{format(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-px bg-white/[0.08] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#EAE8E1]" />
    </div>
  );
}

function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div className={`size-4 rounded flex items-center justify-center transition-all border shrink-0 ${checked ? 'bg-[#EAE8E1] border-[#EAE8E1]' : 'border-white/[0.15] bg-transparent group-hover:border-white/[0.3]'}`}>
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="sr-only" />
        {checked && <Check strokeWidth={3} className="size-2.5 text-[#0a0a0a]" />}
      </div>
      <span className="text-[13px] text-[#A3A09A] group-hover:text-[#EAE8E1] transition-colors">{label}</span>
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

  // PANCERNE POBIERANIE SESJI I KREDYTÓW
  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async (currentUserId: string) => {
      try {
        const { data, error: dbError } = await supabase
          .from('profiles')
          .select('credits, full_name, offer, package')
          .eq('id', currentUserId)
          .single();

        if (dbError) {
          console.error("Błąd pobierania danych profilu z bazy:", dbError);
          return;
        }

        if (data && isMounted) {
          setAvailableTokens(data.credits ?? 0);
          setUserProfile({ 
            full_name: data.full_name ?? '', 
            offer: data.offer ?? '', 
            package: data.package ?? 'basic' 
          });
        }
      } catch (err) {
        console.error("Nieoczekiwany błąd pobierania:", err);
      }
    };

    // 1. Inicjalne pobranie przy wejściu na widok
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && isMounted) {
        setUserId(session.user.id);
        setUserEmail(session.user.email ?? null);
        fetchProfile(session.user.id);
      }
    });

    // 2. Nasłuchiwanie na wszelkie zmiany sesji w tle
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user && isMounted) {
        setUserId(session.user.id);
        setUserEmail(session.user.email ?? null);
        fetchProfile(session.user.id);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
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

    if (!common.industry || !common.city || !common.country) { 
      setError('Wybierz poprawną branżę, kraj i miasto z rozwijanej listy.'); 
      return; 
    }

    const requiredTokens = common.maxLeads * tokenCostPerLead;
    if (availableTokens < requiredTokens) {
      setError(`Masz za mało kredytów. Potrzebujesz ${requiredTokens} tokenów, a masz ${availableTokens}. Kliknij przycisk "+" w prawym górnym rogu, aby doładować konto.`);
      return;
    }

    setIsSearching(true);
    try {
      const pkg = getPackage(selectedPlatforms);
      const webhookUrl = `https://n8n.srv1579942.hstgr.cloud/webhook/c09267cb-9b52-45e1-84a4-cdb53bbeaa77?package=${pkg}`;
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId ?? 'test_user_001',
          package: pkg,
          meta: { package: pkg },
          client: {
            name: userProfile?.full_name || 'Użytkownik ZEC',
            email: userEmail || '',
            offer: userProfile?.offer || '',
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
            google: gFilters,
            instagram: igFilters,
            linkedin: liFilters,
          },
        }),
      });
      
      if (!response.ok) throw new Error('Błąd serwera n8n.');
      const data = await response.json();
      
      if (data.leads && data.leads.length > 0) {
        setLeads(data.leads.map((l: any, i: number) => ({ ...l, id: i + 1, status: 'new' })));
        
        // Zaktualizuj stan tokenów zaraz po udanym wyszukaniu
        if (userId) {
           const { data: profile } = await supabase.from('profiles').select('credits').eq('id', userId).single();
           if (profile) setAvailableTokens(profile.credits);
        }
      } else {
        setError('Brak wyników dla podanych kryteriów.');
      }
    } catch (err: any) {
      console.error(err);
      setError('Błąd połączenia z silnikiem skanującym.');
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
      .upsert({ 
        query_hash: queryHash, 
        company_name: lead.companyName, 
        email: lead.emailAddress, 
        city: lead.city, 
        industry: lead.category, 
        website: lead.website 
      }, { onConflict: 'query_hash' })
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
      history: [{ date: new Date().toISOString(), action: 'Wyszukano', details: 'Znaleziono przez prospecting ZEC.' }],
    });
  };

  const handleSaveSelected = () => {
    leads.filter(l => selectedLeads.includes(l.id) && l.status !== 'saved').forEach(l => handleSaveLead(l));
    setSelectedLeads([]);
  };

  const toggleLead = (id: number) => setSelectedLeads(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const toggleAll = () => selectedLeads.length === leads.length ? setSelectedLeads([]) : setSelectedLeads(leads.map(l => l.id));

  const handleAddDevCredits = async () => {
    setIsAddingCredits(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      // Pobierz z bazy absolutnie najnowszy stan
      const { data: profile } = await supabase.from('profiles').select('credits').eq('id', session.user.id).single();
      const currentCredits = profile?.credits || 0;
      
      const newCreditsAmount = currentCredits + 500;
      
      const { error } = await supabase.from('profiles').update({ credits: newCreditsAmount }).eq('id', session.user.id);
      if (error) throw error;
      
      // Aktualizuj na żywo w interfejsie
      setAvailableTokens(newCreditsAmount);
    } catch (err) {
      console.error("Błąd podczas dodawania kredytów:", err);
    } finally {
      setIsAddingCredits(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div>
          <h1 className="text-[28px] font-serif text-[#EAE8E1] tracking-tight mb-1">Wyszukiwarka</h1>
          <p className="text-[15px] text-[#A3A09A]">Przeszukaj sieć, zidentyfikuj leady i wzbogać swoją bazę.</p>
        </div>
        <div className="flex items-center gap-4 bg-white/[0.04] border border-white/[0.08] px-5 py-2.5 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="size-8 bg-[#EAE8E1]/10 rounded-lg flex items-center justify-center">
              <Coins className="size-4 text-[#EAE8E1]" />
            </div>
            <div>
              <p className="text-[10px] text-[#827E78] uppercase tracking-wider font-medium">Kredyty</p>
              <p className="text-[16px] font-bold text-[#EAE8E1] font-mono leading-none">{availableTokens.toLocaleString('pl-PL')}</p>
            </div>
          </div>
          <div className="w-px h-8 bg-white/[0.08] mx-1" />
          <button onClick={handleAddDevCredits} disabled={isAddingCredits} className="p-2 text-[#827E78] hover:text-[#5d9970] transition-colors disabled:opacity-50" title="DEV: Dodaj 500 kredytów">
            {isAddingCredits ? <Loader2 className="size-4 animate-spin" /> : <PlusCircle className="size-4" />}
          </button>
        </div>
      </motion.div>

      {error && (
        <div className="p-4 rounded-xl bg-[#b56060]/10 border border-[#b56060]/20 flex items-center gap-3 text-[#b56060]">
          <AlertCircle className="size-4 shrink-0" /><span className="text-[13px]">{error}</span>
        </div>
      )}

      {/* Platformy */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6"
      >
        <p className="text-[11px] font-medium text-[#827E78] uppercase tracking-wider mb-4">Źródło danych</p>
        <div className="flex gap-3 flex-wrap">
          {PLATFORMS.map(p => {
            const active = selectedPlatforms.includes(p.id);
            return (
              <button key={p.id} onClick={() => togglePlatform(p.id)}
                className={`flex items-center gap-2.5 px-5 py-3 rounded-xl border text-[13px] font-medium transition-all ${active ? p.activeClass : 'bg-transparent border-white/[0.08] text-[#A3A09A] hover:border-white/[0.15] hover:text-[#EAE8E1]'} ${p.id === 'google' ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <span className={active ? 'text-[#EAE8E1]' : 'text-[#827E78]'}>{p.icon}</span>
                {p.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-lg font-mono ${active ? 'bg-white/[0.1] text-[#EAE8E1]' : 'bg-white/[0.04] text-[#827E78]'}`}>{p.tokenCost} tok</span>
              </button>
            );
          })}
        </div>
        {selectedPlatforms.length > 1 && (
          <p className="text-[12px] text-[#A3A09A] mt-3">
            Koszt łączony: <span className="text-[#EAE8E1] font-mono font-medium">{tokenCostPerLead} tok/lead</span>
            <span className="ml-2 text-[#827E78]">· pakiet: <span className="font-mono text-[#A3A09A]">{getPackage(selectedPlatforms)}</span></span>
          </p>
        )}
      </motion.div>

      {/* Główne Filtry (Z AUTOCOMPLETE) */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden"
      >
        <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <p className="text-[11px] font-medium text-[#827E78] uppercase tracking-wider mb-2.5">Branża *</p>
            <Autocomplete 
              icon={Building2}
              placeholder="np. Architektura..."
              options={INDUSTRIES}
              value={common.industry}
              onChange={val => setCommon({ ...common, industry: val })}
            />
          </div>
          <div>
            <p className="text-[11px] font-medium text-[#827E78] uppercase tracking-wider mb-2.5">Kraj *</p>
            <Autocomplete 
              icon={Globe}
              placeholder="Wybierz kraj..."
              options={COUNTRIES}
              value={common.country}
              onChange={val => setCommon({ ...common, country: val })}
            />
          </div>
          <div>
            <p className="text-[11px] font-medium text-[#827E78] uppercase tracking-wider mb-2.5">Miasto *</p>
            <Autocomplete 
              icon={MapPin}
              placeholder="Wybierz miasto..."
              options={CITIES}
              value={common.city}
              onChange={val => setCommon({ ...common, city: val })}
            />
          </div>
          <div>
            <p className="text-[11px] font-medium text-[#827E78] uppercase tracking-wider mb-2.5">Słowa kluczowe</p>
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#827E78] pointer-events-none z-10" />
              <input type="text" value={common.keywords} onChange={e => setCommon({ ...common, keywords: e.target.value })}
                placeholder="np. luksusowe, b2b..."
                className="w-full pl-10 pr-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-[14px] text-[#EAE8E1] placeholder:text-[#827E78] focus:border-white/[0.2] outline-none transition-all relative z-0"
              />
            </div>
          </div>
        </div>

        {/* Zaawansowane sekcje */}
        <div className="border-t border-white/[0.06]">
          <button onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between px-6 py-4 text-[13px] text-[#A3A09A] hover:text-[#EAE8E1] hover:bg-white/[0.02] transition-all"
          >
            <span className="flex items-center gap-2.5 font-medium">
              <SlidersHorizontal className="size-4" />
              Parametry szczegółowe
              <span className="text-[11px] px-2 py-0.5 bg-white/[0.04] border border-white/[0.08] rounded-full font-mono text-[#827E78] lowercase">{selectedPlatforms.join(' + ')}</span>
            </span>
            {showAdvanced ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-white/[0.01]">
                <div className="p-6 space-y-6">
                  {/* Google Maps Filters */}
                  <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <div className="flex items-center gap-2.5 mb-5">
                      <Globe className="size-4 text-[#827E78]" />
                      <p className="text-[12px] font-medium text-[#A3A09A] uppercase tracking-wider">Filtry Google Maps</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-5">
                        <SliderRow label="Min. ocena Google" value={gFilters.minRating} min={1} max={5} step={0.1} format={v => `${v.toFixed(1)} ★`} onChange={v => setGFilters({ ...gFilters, minRating: v })} icon={<Star className="size-3.5 text-[#827E78]" />} />
                        <SliderRow label="Min. liczba opinii" value={gFilters.minReviews} min={0} max={500} step={10} format={v => `${v}+`} onChange={v => setGFilters({ ...gFilters, minReviews: v })} icon={<BarChart2 className="size-3.5 text-[#827E78]" />} />
                      </div>
                      <div className="space-y-3.5">
                        <CheckRow label="Wymagaj strony WWW" checked={gFilters.requireWebsite} onChange={v => setGFilters({ ...gFilters, requireWebsite: v })} />
                        <CheckRow label="Tylko firmy z widocznym adresem e-mail" checked={gFilters.requireEmail} onChange={v => setGFilters({ ...gFilters, requireEmail: v })} />
                        <CheckRow label="Wymagaj numeru telefonu" checked={gFilters.requirePhone} onChange={v => setGFilters({ ...gFilters, requirePhone: v })} />
                        <CheckRow label="Tylko aktualnie otwarte" checked={gFilters.requireOpenNow} onChange={v => setGFilters({ ...gFilters, requireOpenNow: v })} />
                      </div>
                    </div>
                  </div>

                  {/* Social Filters if selected */}
                  {(selectedPlatforms.includes('instagram') || selectedPlatforms.includes('linkedin')) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-white/[0.04]">
                      {selectedPlatforms.includes('instagram') && (
                        <div className="space-y-5">
                          <p className="text-[11px] font-bold text-[#827E78] uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Instagram className="size-3" /> Social Proof (IG)
                          </p>
                          <SliderRow label="Min. Followers" value={igFilters.minFollowers} min={0} max={100000} step={1000} format={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : `${v}`} onChange={v => setIgFilters({ ...igFilters, minFollowers: v })} icon={<Users className="size-3.5 text-[#827E78]" />} />
                          <CheckRow label="Tylko konta biznesowe" checked={igFilters.businessAccountOnly} onChange={v => setIgFilters({ ...igFilters, businessAccountOnly: v })} />
                        </div>
                      )}
                      {selectedPlatforms.includes('linkedin') && (
                        <div className="space-y-5">
                          <p className="text-[11px] font-bold text-[#827E78] uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Linkedin className="size-3" /> Skala (LinkedIn)
                          </p>
                          <SliderRow label="Min. pracowników" value={liFilters.minEmployees} min={1} max={500} step={5} format={v => `${v}+`} onChange={v => setLiFilters({ ...liFilters, minEmployees: v })} icon={<Users className="size-3.5 text-[#827E78]" />} />
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {COMPANY_SIZES.slice(0, 4).map(size => (
                              <button key={size} onClick={() => toggleCompanySize(size)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono border transition-all ${liFilters.companySize.includes(size) ? 'bg-white/[0.08] border-white/[0.2] text-[#EAE8E1]' : 'bg-transparent border-white/[0.06] text-[#827E78]'}`}
                              >{size}</button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer sterujący skanowaniem */}
        <div className="border-t border-white/[0.06] p-6 flex flex-col md:flex-row items-center gap-8 bg-white/[0.01]">
          <div className="flex-1 w-full">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[12px] font-medium text-[#827E78] uppercase tracking-wider">Ilość leadów do pobrania</p>
              <div className="flex items-center gap-2">
                <span className="text-[16px] font-bold text-[#EAE8E1] font-mono">{common.maxLeads}</span>
                <span className="text-[12px] text-[#3a3a3a]">/ {common.maxLeads * tokenCostPerLead} tokenów</span>
              </div>
            </div>
            <input type="range" min={1} max={50} step={1} value={common.maxLeads} onChange={e => setCommon({ ...common, maxLeads: parseInt(e.target.value) })}
              className="w-full h-px bg-white/[0.08] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#EAE8E1] [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-[#1a1a1a]" />
          </div>
          <button onClick={handleSearch} disabled={isSearching}
            className="shrink-0 w-full md:w-auto flex items-center justify-center gap-2.5 px-10 py-4 bg-[#EAE8E1] hover:bg-white text-[#0a0a0a] text-[14px] font-bold rounded-2xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-black/20"
          >
            {isSearching ? <><Loader2 className="size-5 animate-spin" /> Skanowanie sieci...</> : <><Search className="size-5" /> Rozpocznij skanowanie</>}
          </button>
        </div>
      </motion.div>

      {/* Sekcja Wyników */}
      {leads.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.01]">
            <div>
              <p className="text-[15px] font-medium text-[#EAE8E1]">Wyniki wyszukiwania ({leads.length})</p>
              <p className="text-[12px] text-[#827E78] mt-0.5">Zidentyfikowano e-mail dla {leads.filter(l => l.emailFound).length} podmiotów</p>
            </div>
            {selectedLeads.length > 0 && (
              <button onClick={handleSaveSelected} className="flex items-center gap-2 px-4 py-2 bg-[#EAE8E1] hover:bg-white text-[#0a0a0a] text-[13px] font-semibold rounded-xl transition-all">
                <BookmarkPlus className="size-4" /> Zapisz wybrane ({selectedLeads.length})
              </button>
            )}
          </div>

          <div className="grid grid-cols-12 gap-3 px-5 py-2.5 text-[10px] font-medium text-[#333] uppercase tracking-wider border-b border-white/[0.04]">
            <div className="col-span-1 flex items-center">
              <label className="relative flex items-center justify-center size-3.5 cursor-pointer">
                <input type="checkbox" checked={selectedLeads.length === leads.length && leads.length > 0} onChange={toggleAll} className="peer sr-only" />
                <div className="absolute inset-0 rounded border border-white/[0.12] bg-white/[0.03] peer-checked:bg-[#EAE8E1] peer-checked:border-[#EAE8E1] transition-all" />
                <Check className="size-2.5 text-[#1A1A1A] opacity-0 peer-checked:opacity-100 relative z-10" strokeWidth={3} />
              </label>
            </div>
            <div className="col-span-3">Firma</div>
            <div className="col-span-2">Kontakt</div>
            <div className="col-span-2">Metryki</div>
            <div className="col-span-3">Brief AI</div>
            <div className="col-span-1 text-right">Zapisz</div>
          </div>

          <div className="divide-y divide-white/[0.04]">
            {leads.map(lead => (
              <div key={lead.id} className={`grid grid-cols-12 gap-3 px-5 py-3.5 transition-all hover:bg-white/[0.02] ${selectedLeads.includes(lead.id) ? 'bg-white/[0.03]' : ''}`}>

                <div className="col-span-1 flex items-center">
                  <label className="relative flex items-center justify-center size-3.5 cursor-pointer">
                    <input type="checkbox" checked={selectedLeads.includes(lead.id)} onChange={() => toggleLead(lead.id)} className="peer sr-only" />
                    <div className="absolute inset-0 rounded border border-white/[0.12] bg-white/[0.03] peer-checked:bg-[#EAE8E1] peer-checked:border-[#EAE8E1] transition-all" />
                    <Check className="size-2.5 text-[#1A1A1A] opacity-0 peer-checked:opacity-100 relative z-10" strokeWidth={3} />
                  </label>
                </div>

                {/* Firma */}
                <div className="col-span-3 flex flex-col justify-center">
                  <p className="text-[13px] font-semibold text-[#EAE8E1] leading-tight">{lead.companyName}</p>
                  <p className="text-[11px] text-[#827E78] mt-0.5 flex items-center gap-1"><MapPin className="size-2.5" />{lead.city}</p>
                  {lead.category && <p className="text-[11px] text-[#A3A09A] mt-0.5">{lead.category}</p>}
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
                        <span className="text-[#827E78]">obserwujących</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-[11px] text-[#827E78]">
                        <Instagram className="size-2.5 shrink-0 opacity-50" /><span>Brak IG</span>
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
                            <span className="text-[#827E78]">pracowników</span>
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
                        <Linkedin className="size-2.5 shrink-0 opacity-50" /><span>Brak LI</span>
                      </div>
                    )
                  )}
                </div>

                {/* Brief AI */}
                <div className="col-span-3 flex flex-col justify-center pr-4">
                  {lead.brief ? (
                    <div className="group/brief relative cursor-pointer" onClick={() => setPreviewLead(lead)}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Sparkles className="size-3 text-[#A3A09A]" />
                        <span className="text-[10px] text-[#827E78] uppercase tracking-wider font-medium">Brief AI</span>
                      </div>
                      <p className="text-[12px] text-[#A3A09A] group-hover/brief:text-[#EAE8E1] transition-colors line-clamp-2 leading-relaxed">{lead.brief}</p>
                      <span className="text-[11px] text-[#827E78] group-hover/brief:text-[#EAE8E1] font-medium mt-1.5 block flex items-center gap-1">Czytaj więcej <ArrowRight className="size-3" /></span>
                    </div>
                  ) : (
                    <p className="text-[12px] text-[#827E78] italic">Brak briefu do wyświetlenia.</p>
                  )}
                </div>

                {/* Akcja */}
                <div className="col-span-1 flex items-center justify-end">
                  {lead.status === 'saved' ? (
                    <div className="flex items-center gap-1.5 text-[#5d9970] text-[12px] font-medium">
                      <Check className="size-3.5" strokeWidth={3} /> Zapisano
                    </div>
                  ) : (
                    <button onClick={() => handleSaveLead(lead)}
                      className="p-2.5 bg-white/[0.04] border border-white/[0.08] text-[#827E78] hover:text-[#EAE8E1] hover:border-white/[0.2] hover:bg-white/[0.06] rounded-xl transition-all"
                      title="Zapisz lead"
                    >
                      <BookmarkPlus className="size-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Następny krok */}
          {leads.filter(l => l.status === 'saved').length > 0 && (
            <div className="px-6 py-4 border-t border-white/[0.06] flex items-center justify-between bg-white/[0.02]">
              <p className="text-[13px] text-[#A3A09A]">
                Zapisano <span className="text-[#EAE8E1] font-medium">{leads.filter(l => l.status === 'saved').length}</span> leadów w Twojej bazie.
              </p>
              <a href="/app/campaigns" className="flex items-center gap-2 text-[13px] font-medium text-[#EAE8E1] hover:text-white transition-colors bg-white/[0.06] hover:bg-white/[0.1] px-4 py-2 rounded-lg border border-white/[0.08]">
                Przejdź do kampanii
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
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-[#1A1A1A] border border-white/[0.08] rounded-3xl p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-8">
                <div>
                  <h2 className="text-[24px] font-serif text-[#EAE8E1] mb-1.5">{previewLead.companyName}</h2>
                  <p className="text-[14px] text-[#A3A09A] flex items-center gap-1.5">
                    <MapPin className="size-3.5" /> {previewLead.city} <span className="mx-1 text-white/[0.1]">•</span> {previewLead.category}
                  </p>
                </div>
                <button onClick={() => setPreviewLead(null)} className="p-2 bg-white/[0.04] hover:bg-white/[0.08] rounded-xl text-[#827E78] hover:text-[#EAE8E1] transition-colors border border-white/[0.08]">
                  <X className="size-4" />
                </button>
              </div>

              <div className="space-y-6">
                {previewLead.brief && (
                  <div className="p-6 bg-white/[0.02] rounded-2xl border border-white/[0.06]">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="size-4 text-[#A3A09A]" />
                      <p className="text-[12px] text-[#827E78] uppercase tracking-wider font-medium">Intel & Brief AI</p>
                    </div>
                    <p className="text-[14px] text-[#EAE8E1] leading-relaxed">{previewLead.brief}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {previewLead.emailFound && (
                    <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                      <p className="text-[11px] text-[#827E78] uppercase tracking-wider mb-1.5">E-mail</p>
                      <p className="text-[14px] font-medium text-[#5d9970] truncate">{previewLead.emailAddress}</p>
                    </div>
                  )}
                  {previewLead.phone && (
                    <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                      <p className="text-[11px] text-[#827E78] uppercase tracking-wider mb-1.5">Telefon</p>
                      <p className="text-[14px] font-medium text-[#EAE8E1]">{previewLead.phone}</p>
                    </div>
                  )}
                  <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                    <p className="text-[11px] text-[#827E78] uppercase tracking-wider mb-1.5">Ocena Google</p>
                    <p className="text-[14px] font-medium text-[#EAE8E1]">{previewLead.rating}/5.0 <span className="text-[#827E78] font-normal">({previewLead.reviewsCount} opinii)</span></p>
                  </div>
                  {previewLead.instagram?.available && (
                    <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                      <p className="text-[11px] text-[#827E78] uppercase tracking-wider mb-1.5">Instagram</p>
                      <p className="text-[14px] font-medium text-[#EAE8E1]">{previewLead.instagram.followers?.toLocaleString()} <span className="text-[#827E78] font-normal">obserwujących</span></p>
                    </div>
                  )}
                  {previewLead.linkedin?.available && (
                    <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                      <p className="text-[11px] text-[#827E78] uppercase tracking-wider mb-1.5">LinkedIn</p>
                      <p className="text-[14px] font-medium text-[#EAE8E1] truncate">{previewLead.linkedin.employeeCount} <span className="text-[#827E78] font-normal">pracowników</span></p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4 mt-8 pt-6 border-t border-white/[0.06]">
                <button onClick={() => setPreviewLead(null)} className="flex-[1] py-3.5 border border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.02] text-[#A3A09A] hover:text-[#EAE8E1] text-[13px] font-medium rounded-xl transition-all">
                  Zamknij
                </button>
                {previewLead.status !== 'saved' && (
                  <button onClick={() => { handleSaveLead(previewLead); setPreviewLead(null); }}
                    className="flex-[2] py-3.5 bg-[#EAE8E1] hover:bg-white text-[#1A1A1A] text-[14px] font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <BookmarkPlus className="size-4" /> Zapisz do bazy leadów
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Bar Multiple Selection */}
      <AnimatePresence>
        {selectedLeads.length > 0 && (
          <motion.div initial={{ y: 80, opacity: 0, x: '-50%' }} animate={{ y: 0, opacity: 1, x: '-50%' }} exit={{ y: 80, opacity: 0, x: '-50%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-8 left-1/2 z-40 flex items-center gap-6 px-6 py-4 bg-[#1A1A1A] border border-white/[0.1] shadow-2xl rounded-2xl"
          >
            <div className="flex items-center gap-3 border-r border-white/[0.1] pr-6">
              <div className="flex items-center justify-center size-6 rounded-full bg-white/[0.08] text-[12px] font-mono text-[#EAE8E1]">
                {selectedLeads.length}
              </div>
              <span className="text-[14px] text-[#A3A09A]">Wybrano do zapisu</span>
            </div>
            <button onClick={handleSaveSelected} className="flex items-center gap-2.5 px-6 py-2.5 bg-[#EAE8E1] hover:bg-white text-[#1A1A1A] text-[13px] font-semibold rounded-xl transition-all shadow-md">
              <BookmarkPlus className="size-4" /> Zapisz wybrane
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}