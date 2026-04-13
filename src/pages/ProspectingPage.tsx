git add . && git commit -m "fix getPackage" && git push
git add . && git commit -m "fix getPackage" && git push
Search, Globe, MapPin, Building2, Star, Mail, Check,
  ArrowRight, Coins, ChevronDown, ChevronUp, AlertCircle,
  Loader2, Users, TrendingUp, Briefcase, BarChart2,
  ExternalLink, SlidersHorizontal
} from 'lucide-react';
import { Instagram, Linkedin } from 'lucide-react';
import { supabase } from '../lib/supabase';

// ── Typy ──────────────────────────────────────────────────────────────────────

type Platform = 'google' | 'instagram' | 'linkedin';

interface PlatformConfig {
  id: Platform;
  label: string;
  icon: React.ReactNode;
  tokenCost: number;
  activeClass: string;
}

interface UserProfile {
  full_name: string;
  offer: string;
  package: string;
}

// ── Stałe ─────────────────────────────────────────────────────────────────────

const PLATFORMS: PlatformConfig[] = [
  { id: 'google',    label: 'Google',    tokenCost: 1, icon: <Globe className="size-3.5" />,     activeClass: 'bg-white/[0.06] border-white/[0.12] text-[#c8c8c8]' },
  { id: 'instagram', label: 'Instagram', tokenCost: 2, icon: <Instagram className="size-3.5" />, activeClass: 'bg-white/[0.06] border-white/[0.12] text-[#c8c8c8]' },
  { id: 'linkedin',  label: 'LinkedIn',  tokenCost: 3, icon: <Linkedin className="size-3.5" />,  activeClass: 'bg-white/[0.06] border-white/[0.12] text-[#c8c8c8]' },
];

const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001+'];

const mockLeads = [
  { id: 1, platform: 'google' as Platform, name: 'Studio Architektoniczne Nowak', website: 'nowakarchitekci.pl', email: 'kontakt@nowakarchitekci.pl', rating: 4.8, reviews: 127, city: 'Warszawa', industry: 'Architektura', description: 'Nowoczesne projekty budowlane.' },
  { id: 2, platform: 'google' as Platform, name: 'BudMaster Deweloper', website: 'budmaster.com', email: 'biuro@budmaster.com', rating: 4.9, reviews: 203, city: 'Kraków', industry: 'Deweloper', description: 'Lider na rynku deweloperskim w Małopolsce.' },
];

// ── Helper: package z wybranych platform ──────────────────────────────────────

function getPackage(platforms: Platform[]): string {
  const hasIG = platforms.includes('instagram');
  const hasLI = platforms.includes('linkedin');
  if (hasIG && hasLI) return 'full';
  if (hasLI) return 'linkedin';
  if (hasIG) return 'instagram';
  return 'basic';
}

// ── Komponenty pomocnicze ──────────────────────────────────────────────────────

function SliderRow({ label, value, min, max, step, format, onChange, icon }: {
  label: string; value: number; min: number; max: number; step: number;
  format: (v: number) => string; onChange: (v: number) => void; icon?: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="flex items-center gap-1.5 text-[11px] text-[#4a4a4a] font-medium uppercase tracking-wider">
          {icon}{label}
        </span>
        <span className="text-[12px] font-mono font-semibold text-[#888]">{format(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-px bg-white/[0.08] rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-3
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#c8c8c8]" />
    </div>
  );
}

function CheckRow({ label, checked, onChange }: {
  label: string; checked: boolean; onChange: (v: boolean) => void;
}) {
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

// ── Komponent główny ───────────────────────────────────────────────────────────

export function ProspectingPage() {
  const [leads, setLeads] = useState<typeof mockLeads>([]);
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [availableTokens, setAvailableTokens] = useState<number>(0);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['google']);

  const [common, setCommon] = useState({
    industry: '',
    country: 'Polska',
    city: '',
    keywords: '',
    maxLeads: 10,
  });

  const [gFilters, setGFilters] = useState({
    minRating: 4.0,
    minReviews: 10,
    requireWebsite: true,
    requireEmail: false,
    requirePhone: false,
    requireOpenNow: false,
  });

  const [igFilters, setIgFilters] = useState({
    minFollowers: 1000,
    maxFollowers: 500000,
    minEngagementRate: 1,
    minPosts: 12,
    businessAccountOnly: true,
    requireEmail: false,
    requireWebsite: false,
  });

  const [liFilters, setLiFilters] = useState({
    minEmployees: 1,
    maxEmployees: 250,
    companySize: [] as string[],
    requireWebsite: true,
    hasActiveJobs: false,
    requireEmail: false,
    foundedAfter: '',
  });

  useEffect(() => {
    async function fetchUserData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserEmail(session.user.email ?? null);
        const { data } = await supabase
          .from('profiles')
          .select('credits, full_name, offer, package')
          .eq('id', session.user.id)
          .single();
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
    setSelectedPlatforms(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  };

  const toggleCompanySize = (size: string) => {
    setLiFilters(prev => ({
      ...prev,
      companySize: prev.companySize.includes(size)
        ? prev.companySize.filter(s => s !== size)
        : [...prev.companySize, size],
    }));
  };

  const tokenCostPerLead = selectedPlatforms.reduce((acc, p) => {
    return acc + (PLATFORMS.find(x => x.id === p)?.tokenCost ?? 0);
  }, 0);

  const handleSearch = async () => {
    setError(null);
    if (!common.industry || !common.city) {
      setError('Branża i miasto są wymagane.');
      return;
    }
    setIsSearching(true);
    try {
      const webhookUrl = 'https://n8n.srv1579942.hstgr.cloud/webhook/36f18c9a-7027-4260-a666-fecbc697eedb';

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'test_user_001',
          package: getPackage(selectedPlatforms),

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
      setLeads(data.leads && data.leads.length > 0 ? data.leads : mockLeads);
    } catch (err: any) {
      console.error(err);
      setLeads(mockLeads);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleLead = (id: number) =>
    setSelectedLeads(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const toggleAll = () =>
    selectedLeads.length === leads.length ? setSelectedLeads([]) : setSelectedLeads(leads.map(l => l.id));

  return (
    <div className="space-y-4 max-w-7xl mx-auto">

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
          <button className="text-[12px] text-[#444] hover:text-[#888] border border-white/[0.07] hover:border-white/[0.12] px-3 py-1.5 rounded-xl transition-all">
            Doładuj
          </button>
        </div>
      </motion.div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400">
          <AlertCircle className="size-4 shrink-0" />
          <span className="text-[13px]">{error}</span>
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
      >
        <p className="text-[11px] font-medium text-[#3a3a3a] uppercase tracking-wider mb-3">Źródło danych</p>
        <div className="flex gap-2 flex-wrap">
          {PLATFORMS.map(p => {
            const active = selectedPlatforms.includes(p.id);
            return (
              <button key={p.id} onClick={() => togglePlatform(p.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-[13px] font-medium transition-all ${
                  active ? p.activeClass : 'bg-transparent border-white/[0.05] text-[#444] hover:border-white/[0.1] hover:text-[#777]'
                } ${p.id === 'google' ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <span className={active ? 'text-[#888]' : 'text-[#333]'}>{p.icon}</span>
                {p.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-lg font-mono ${active ? 'bg-white/[0.07] text-[#777]' : 'bg-white/[0.03] text-[#333]'}`}>
                  {p.tokenCost} tok/lead
                </span>
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
              <span className="text-[10px] px-2 py-0.5 bg-white/[0.03] border border-white/[0.05] rounded-full font-mono text-[#333]">
                {selectedPlatforms.join(' + ')}
              </span>
            </span>
            {showAdvanced ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-5 space-y-4">
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <div className="flex items-center gap-2 mb-4">
                      <Globe className="size-3.5 text-[#555]" />
                      <p className="text-[11px] font-semibold text-[#555] uppercase tracking-wider">Filtry Google Maps</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-4">
                        <SliderRow label="Min. ocena Google" value={gFilters.minRating} min={1} max={5} step={0.1}
                          format={v => `${v.toFixed(1)} ★`} onChange={v => setGFilters({ ...gFilters, minRating: v })}
                          icon={<Star className="size-3 text-[#777]" />} />
                        <SliderRow label="Min. liczba opinii" value={gFilters.minReviews} min={0} max={200} step={5}
                          format={v => `${v}+`} onChange={v => setGFilters({ ...gFilters, minReviews: v })}
                          icon={<BarChart2 className="size-3 text-[#777]" />} />
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
                          <SliderRow label="Min. obserwujący" value={igFilters.minFollowers} min={0} max={100000} step={500}
                            format={v => v >= 1000 ? `${(v/1000).toFixed(1)}K` : `${v}`}
                            onChange={v => setIgFilters({ ...igFilters, minFollowers: v })}
                            icon={<Users className="size-3 text-[#777]" />} />
                          <SliderRow label="Max. obserwujący" value={igFilters.maxFollowers} min={1000} max={1000000} step={1000}
                            format={v => `${(v/1000).toFixed(0)}K`}
                            onChange={v => setIgFilters({ ...igFilters, maxFollowers: v })}
                            icon={<Users className="size-3 text-[#777]" />} />
                          <SliderRow label="Min. engagement rate" value={igFilters.minEngagementRate} min={0} max={20} step={0.1}
                            format={v => `${v.toFixed(1)}%`}
                            onChange={v => setIgFilters({ ...igFilters, minEngagementRate: v })}
                            icon={<TrendingUp className="size-3 text-[#777]" />} />
                          <SliderRow label="Min. liczba postów" value={igFilters.minPosts} min={0} max={200} step={1}
                            format={v => `${v}+`}
                            onChange={v => setIgFilters({ ...igFilters, minPosts: v })}
                            icon={<BarChart2 className="size-3 text-[#777]" />} />
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
                          <SliderRow label="Min. pracowników" value={liFilters.minEmployees} min={1} max={500} step={1}
                            format={v => `${v}+`} onChange={v => setLiFilters({ ...liFilters, minEmployees: v })}
                            icon={<Users className="size-3 text-[#777]" />} />
                          <SliderRow label="Max. pracowników" value={liFilters.maxEmployees} min={1} max={10000} step={10}
                            format={v => v >= 1000 ? `${(v/1000).toFixed(1)}k` : `${v}`}
                            onChange={v => setLiFilters({ ...liFilters, maxEmployees: v })}
                            icon={<Users className="size-3 text-[#777]" />} />
                          <div>
                            <p className="text-[11px] font-medium text-[#4a4a4a] uppercase tracking-wider mb-2">Założona po roku</p>
                            <input type="number" min={1900} max={2024} placeholder="np. 2015"
                              value={liFilters.foundedAfter}
                              onChange={e => setLiFilters({ ...liFilters, foundedAfter: e.target.value })}
                              className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.07] rounded-xl text-[13px] text-[#c8c8c8] placeholder:text-[#3a3a3a] focus:outline-none focus:border-white/[0.14] transition-all"
                            />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <p className="text-[11px] font-medium text-[#4a4a4a] uppercase tracking-wider mb-2">Wielkość firmy</p>
                            <div className="flex flex-wrap gap-1.5">
                              {COMPANY_SIZES.map(size => (
                                <button key={size} onClick={() => toggleCompanySize(size)}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-all ${
                                    liFilters.companySize.includes(size)
                                      ? 'bg-white/[0.08] border-white/[0.15] text-[#c8c8c8]'
                                      : 'bg-transparent border-white/[0.06] text-[#555] hover:border-white/[0.12] hover:text-[#888]'
                                  }`}
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
              <input type="range" min={1} max={500} step={1} value={common.maxLeads}
                onChange={e => setCommon({ ...common, maxLeads: parseInt(e.target.value) })}
                className="flex-1 h-px bg-white/[0.08] rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-3
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#c8c8c8]"
              />
              <span className="text-[11px] text-[#333] font-mono shrink-0">500</span>
            </div>
            <p className="text-[11px] text-[#2e2e2e] mt-1.5">Jeśli w danym mieście jest mniej wyników, zwrócimy tyle ile znajdziemy</p>
          </div>

          <button onClick={handleSearch} disabled={isSearching}
            className="shrink-0 w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-[#d4d4d4] hover:bg-white text-[#111] text-[13px] font-semibold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSearching
              ? <><Loader2 className="size-4 animate-spin" /> Skanowanie sieci...</>
              : <><Briefcase className="size-4" /> Rozpocznij skanowanie</>
            }
          </button>
        </div>
      </motion.div>

      {leads.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-white/[0.05] flex items-center justify-between">
            <div>
              <p className="text-[14px] font-semibold text-[#c8c8c8]">Wyniki</p>
              <p className="text-[12px] text-[#444] mt-0.5">Pobrano {leads.length} leadów spełniających kryteria</p>
            </div>
            {selectedLeads.length > 0 && (
              <span className="text-[12px] font-medium text-[#888]">{selectedLeads.length} zaznaczonych</span>
            )}
          </div>

          <div className="grid grid-cols-12 gap-4 px-5 py-2.5 text-[10px] font-medium text-[#333] uppercase tracking-wider border-b border-white/[0.04]">
            <div className="col-span-1 flex items-center">
              <label className="relative flex items-center justify-center size-3.5 cursor-pointer">
                <input type="checkbox" checked={selectedLeads.length === leads.length && leads.length > 0} onChange={toggleAll} className="peer sr-only" />
                <div className="absolute inset-0 rounded border border-white/[0.12] bg-white/[0.03] peer-checked:bg-[#c8c8c8] peer-checked:border-[#c8c8c8] transition-all" />
                <Check className="size-2.5 text-black opacity-0 peer-checked:opacity-100 relative z-10" strokeWidth={3} />
              </label>
            </div>
            <div className="col-span-4">Firma</div>
            <div className="col-span-4">Kontakt</div>
            <div className="col-span-3">Metryki</div>
          </div>

          <div className="divide-y divide-white/[0.04]">
            {leads.map(lead => (
              <div key={lead.id} className={`grid grid-cols-12 gap-4 px-5 py-3.5 transition-all hover:bg-white/[0.02] ${selectedLeads.includes(lead.id) ? 'bg-white/[0.03]' : ''}`}>
                <div className="col-span-1 flex items-center">
                  <label className="relative flex items-center justify-center size-3.5 cursor-pointer">
                    <input type="checkbox" checked={selectedLeads.includes(lead.id)} onChange={() => toggleLead(lead.id)} className="peer sr-only" />
                    <div className="absolute inset-0 rounded border border-white/[0.12] bg-white/[0.03] peer-checked:bg-[#c8c8c8] peer-checked:border-[#c8c8c8] transition-all" />
                    <Check className="size-2.5 text-black opacity-0 peer-checked:opacity-100 relative z-10" strokeWidth={3} />
                  </label>
                </div>
                <div className="col-span-4 flex flex-col justify-center">
                  <p className="text-[13px] font-semibold text-[#c8c8c8] leading-tight">{lead.name}</p>
                  <p className="text-[11px] text-[#444] mt-0.5 flex items-center gap-1">
                    <MapPin className="size-2.5" />{lead.city} · {lead.industry}
                  </p>
                </div>
                <div className="col-span-4 flex flex-col justify-center gap-1">
                  {lead.website && (
                    <a href={`https://${lead.website}`} target="_blank" rel="noopener noreferrer"
                      className="text-[11px] text-[#444] hover:text-[#888] flex items-center gap-1 truncate transition-colors">
                      <ExternalLink className="size-2.5 shrink-0" />{lead.website}
                    </a>
                  )}
                  {lead.email && (
                    <p className="text-[11px] text-[#444] flex items-center gap-1 truncate">
                      <Mail className="size-2.5 shrink-0" />{lead.email}
                    </p>
                  )}
                </div>
                <div className="col-span-3 flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1 px-2 py-1 bg-white/[0.03] rounded-lg border border-white/[0.06] text-[11px]">
                    <Star className="size-2.5 text-[#777]" />
                    <span className="text-[#b0b0b0] font-mono font-semibold">{lead.rating}</span>
                  </div>
                  <span className="text-[11px] text-[#444]">{lead.reviews} opinii</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {selectedLeads.length > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
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
              <button className="flex items-center gap-1.5 bg-[#111] hover:bg-[#222] text-white text-[13px] font-semibold px-5 py-2.5 rounded-xl transition-all group">
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