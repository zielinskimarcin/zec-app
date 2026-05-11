import { useEffect, useMemo, useRef, useState, type ElementType, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertCircle,
  ArrowRight,
  BookmarkPlus,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Coins,
  ExternalLink,
  Globe,
  Instagram,
  Layers3,
  Linkedin,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Target,
  X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CampaignCreator } from '../components/CampaignCreator';
import { CITIES, COUNTRIES, INDUSTRIES } from '../data/searchOptions';

type SearchDepth = 'basic' | 'enriched';
type ResultSource = 'preview' | SearchDepth;

interface LeadSignal {
  label?: string | null;
  value?: string | null;
}

interface LeadSource {
  type?: string | null;
  label?: string | null;
  url?: string | null;
}

interface GlobalLeadRow {
  id: string;
  query_hash?: string | null;
  company_name: string;
  email: string | null;
  website: string | null;
  city: string | null;
  industry: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  facebook_url: string | null;
  linkedin_bio: string | null;
  instagram_last_post: string | null;
  ai_icebreaker: string | null;
  email_source: string | null;
  enrichment_status: string | null;
  enriched_at: string | null;
  created_at: string;
  country?: string | null;
  region?: string | null;
  address?: string | null;
  phone?: string | null;
  contact_page_url?: string | null;
  description?: string | null;
  category_tags?: string[] | null;
  technologies?: string[] | null;
  business_signals?: LeadSignal[] | null;
  data_sources?: LeadSource[] | null;
  contact_status?: string | null;
  data_quality_score?: number | null;
  source_confidence?: number | null;
  last_checked_at?: string | null;
  public_profile?: Record<string, unknown> | null;
  is_unlocked?: boolean | null;
  unlock_depth?: string | null;
  email_available?: boolean | null;
}

interface SearchGlobalLeadRow extends GlobalLeadRow {
  credits_after: number | null;
  charged_credits: number | null;
  total_matches: number | null;
}

interface ProspectLead {
  id: string;
  companyName: string;
  email: string | null;
  website: string | null;
  city: string | null;
  industry: string | null;
  instagramUrl: string | null;
  linkedinUrl: string | null;
  facebookUrl: string | null;
  linkedinBio: string | null;
  instagramLastPost: string | null;
  aiIcebreaker: string | null;
  emailSource: string | null;
  enrichmentStatus: string | null;
  enrichedAt: string | null;
  createdAt: string;
  country: string | null;
  region: string | null;
  address: string | null;
  phone: string | null;
  contactPageUrl: string | null;
  description: string | null;
  categoryTags: string[];
  technologies: string[];
  businessSignals: LeadSignal[];
  dataSources: LeadSource[];
  contactStatus: string | null;
  dataQualityScore: number;
  sourceConfidence: number;
  lastCheckedAt: string | null;
  publicProfile: Record<string, unknown>;
  isUnlocked: boolean;
  unlockDepth: string | null;
  emailAvailable: boolean;
}

const DEPTH_CONFIG: Record<SearchDepth, { label: string; tokenCost: number }> = {
  basic: {
    label: 'Podstawowe',
    tokenCost: 1,
  },
  enriched: {
    label: 'Rozszerzone',
    tokenCost: 3,
  },
};

function normalize(value: string | null | undefined) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function tokenize(value: string) {
  return normalize(value)
    .split(/[^a-z0-9]+/i)
    .filter(token => token.length > 2 && !['dla', 'oraz', 'the', 'and', 'firm', 'firma', 'uslugi', 'uslug'].includes(token));
}

function getOptionLabel(options: { value: string; label: string }[], value: string) {
  return options.find(option => option.value === value)?.label || value;
}

function getCitySearchValue(value: string) {
  if (!value || value === 'Polska') return null;
  const option = CITIES.find(item => item.value === value);
  return (option?.value || value).replace(/_/g, ' ');
}

function getCountrySearchValue(value: string) {
  if (!value || value === 'Global') return null;
  return value;
}

function getDomain(website: string | null) {
  if (!website) return '';
  try {
    const url = website.startsWith('http') ? new URL(website) : new URL(`https://${website}`);
    return url.hostname.replace(/^www\./, '');
  } catch {
    return website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  }
}

function ensureUrl(website: string | null) {
  if (!website) return '#';
  return website.startsWith('http') ? website : `https://${website}`;
}

function mapLead(row: GlobalLeadRow): ProspectLead {
  const businessSignals = Array.isArray(row.business_signals) ? row.business_signals : [];
  const dataSources = Array.isArray(row.data_sources) ? row.data_sources : [];

  return {
    id: row.id,
    companyName: row.company_name,
    email: row.email,
    website: row.website,
    city: row.city,
    industry: row.industry,
    instagramUrl: row.instagram_url,
    linkedinUrl: row.linkedin_url,
    facebookUrl: row.facebook_url,
    linkedinBio: row.linkedin_bio,
    instagramLastPost: row.instagram_last_post,
    aiIcebreaker: row.ai_icebreaker,
    emailSource: row.email_source,
    enrichmentStatus: row.enrichment_status,
    enrichedAt: row.enriched_at,
    createdAt: row.created_at,
    country: row.country || null,
    region: row.region || null,
    address: row.address || null,
    phone: row.phone || null,
    contactPageUrl: row.contact_page_url || null,
    description: row.description || null,
    categoryTags: row.category_tags || [],
    technologies: row.technologies || [],
    businessSignals,
    dataSources,
    contactStatus: row.contact_status || null,
    dataQualityScore: row.data_quality_score || 0,
    sourceConfidence: row.source_confidence || 0,
    lastCheckedAt: row.last_checked_at || null,
    publicProfile: row.public_profile || {},
    isUnlocked: Boolean(row.is_unlocked || row.email),
    unlockDepth: row.unlock_depth || null,
    emailAvailable: Boolean(row.email_available || row.email),
  };
}

function hasSocialData(lead: ProspectLead) {
  return Boolean(lead.instagramUrl || lead.linkedinUrl || lead.facebookUrl);
}

function leadScore(lead: ProspectLead) {
  if (lead.dataQualityScore > 0) return lead.dataQualityScore;

  let score = 0;
  if (lead.email) score += 30;
  if (lead.website) score += 15;
  if (lead.aiIcebreaker) score += 20;
  if (lead.instagramLastPost) score += 15;
  if (lead.linkedinBio) score += 15;
  if (lead.instagramUrl) score += 8;
  if (lead.linkedinUrl) score += 8;
  if (lead.facebookUrl) score += 4;
  if (lead.enrichmentStatus === 'enriched') score += 10;
  return Math.min(100, score);
}

function getLeadSignalText(lead: ProspectLead) {
  const signal = lead.businessSignals.find(item => item?.value || item?.label);

  if (signal) {
    return [signal.label, signal.value].filter(Boolean).join(': ');
  }

  return lead.description
    || lead.linkedinBio
    || lead.instagramLastPost
    || 'Publiczny rekord firmowy w bazie ZEC.';
}

function formatNumber(value: number) {
  return value.toLocaleString('pl-PL');
}

function isShowcaseLead(lead: ProspectLead) {
  const value = lead.publicProfile?.showcase_full_profile;
  return value === true || value === 'true';
}

function canViewExtendedLead(lead: ProspectLead) {
  return isShowcaseLead(lead) || lead.unlockDepth === 'enriched';
}

function hasUnlockDepth(lead: ProspectLead, depth: SearchDepth) {
  if (isShowcaseLead(lead)) return true;
  if (!lead.isUnlocked) return false;
  return depth === 'basic' || lead.unlockDepth === 'enriched';
}

function buildSummary(lead: ProspectLead, source: ResultSource) {
  const signals = lead.businessSignals
    .slice(0, 3)
    .map(signal => [signal.label, signal.value].filter(Boolean).join(': '))
    .filter(Boolean);

  const base = `${lead.companyName}. ${lead.description || `${lead.industry ? `Branża: ${lead.industry}. ` : ''}${lead.city ? `Lokalizacja: ${lead.city}.` : ''}`}`;

  if (source === 'basic' || signals.length === 0) return base;

  return `${base} Sygnały publiczne: ${signals.join(' | ')}.`;
}

function makeHistory(source: ResultSource) {
  return [{
    date: new Date().toISOString(),
    action: source === 'preview' ? 'Zapisano z darmowego preview' : 'Zapisano z prospectingu',
    details: source === 'enriched'
      ? 'Lead zapisany z dodatkowymi danymi z globalnej bazy ZEC.'
      : 'Lead dodany z globalnej bazy ZEC.',
  }];
}

const LOCKED_SECTION_PREVIEW: Record<string, string[]> = {
  public: ['Sygnały z publicznych stron i katalogów', 'Aktywność, zmiany i kontekst firmy', 'Źródła do szybkiej weryfikacji'],
  instagram: ['Ostatnia aktywność profilu', 'Tematy komunikacji i aktualne posty', 'Link do profilu firmowego'],
  linkedin: ['Opis firmy i pozycjonowanie', 'Profil firmowy lub decyzyjny', 'Kontekst pod kampanię B2B'],
  facebook: ['Publiczny profil firmy', 'Dodatkowy kanał kontaktu', 'Ślad aktywności w social media'],
  sources: ['Strona firmowa', 'Profile social media', 'Publiczne źródła danych'],
};

function InsightSection({
  icon: Icon,
  title,
  href,
  isLocked,
  previewKey,
  emptyText,
  children,
  accentClass = 'text-[#827E78]',
}: {
  icon: ElementType;
  title: string;
  href?: string | null;
  isLocked: boolean;
  previewKey: keyof typeof LOCKED_SECTION_PREVIEW;
  emptyText: string;
  children?: ReactNode;
  accentClass?: string;
}) {
  const previewLines = LOCKED_SECTION_PREVIEW[previewKey];

  return (
    <div className={`p-5 rounded-xl border overflow-hidden ${isLocked ? 'relative border-white/[0.08] bg-white/[0.015]' : 'border-white/[0.06] bg-white/[0.02]'}`}>
      <div className="flex items-center gap-2 mb-3 text-[#EAE8E1]">
        <Icon className={`size-4 ${accentClass}`} />
        <span className="text-[13px] font-medium">{title}</span>
        {!isLocked && href && (
          <a href={ensureUrl(href)} target="_blank" rel="noopener noreferrer" className="ml-auto text-[#827E78] hover:text-[#EAE8E1] transition-colors">
            <ExternalLink className="size-3.5" />
          </a>
        )}
        {isLocked && (
          <span className="ml-auto inline-flex items-center gap-1.5 text-[10px] text-[#827E78] bg-white/[0.04] border border-white/[0.08] rounded-full px-2 py-0.5">
            <Lock className="size-3" />
            rozszerzone
          </span>
        )}
      </div>

      {isLocked ? (
        <div className="relative min-h-[104px] overflow-hidden rounded-lg border border-white/[0.06] bg-white/[0.025]">
          <div className="absolute inset-0 space-y-2 p-4 blur-md opacity-70 select-none pointer-events-none">
            {previewLines.map(line => (
              <p key={line} className="text-[13px] text-[#A3A09A] leading-relaxed">{line}</p>
            ))}
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-[#050505]/75 backdrop-blur-sm">
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.12] bg-[#111]/95 text-[12px] text-[#EAE8E1] shadow-xl">
              <Lock className="size-3.5 text-[#827E78]" />
              Odblokuj rozszerzony profil
            </div>
          </div>
        </div>
      ) : (
        children || <p className="text-[13px] text-[#827E78] leading-relaxed">{emptyText}</p>
      )}
    </div>
  );
}

function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div className={`size-4 rounded flex items-center justify-center transition-all border shrink-0 ${checked ? 'bg-[#EAE8E1] border-[#EAE8E1]' : 'border-white/[0.15] bg-transparent group-hover:border-white/[0.3]'}`}>
        <input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} className="sr-only" />
        {checked && <Check strokeWidth={3} className="size-2.5 text-[#0a0a0a]" />}
      </div>
      <span className="text-[13px] text-[#A3A09A] group-hover:text-[#EAE8E1] transition-colors">{label}</span>
    </label>
  );
}

function Autocomplete({
  value,
  onChange,
  options,
  placeholder,
  icon: Icon,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  icon: ElementType;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const selected = options.find(option => option.value === value);
    setQuery(selected ? selected.label : value);
  }, [value, options]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        const selected = options.find(option => option.value === value);
        setQuery(selected ? selected.label : value);
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value, options]);

  const filtered = options
    .filter(option => normalize(option.label).includes(normalize(query)) || normalize(option.value).includes(normalize(query)))
    .slice(0, 40);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#827E78] pointer-events-none z-10" />
      <input
        type="text"
        value={query}
        onChange={event => {
          setQuery(event.target.value);
          onChange(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-[14px] text-[#EAE8E1] placeholder:text-[#827E78] focus:border-white/[0.2] outline-none transition-all"
      />

      <AnimatePresence>
        {isOpen && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute top-[calc(100%+8px)] left-0 right-0 max-h-64 overflow-y-auto bg-[#1A1A1A] border border-white/[0.12] rounded-xl shadow-2xl z-50 p-1"
          >
            {filtered.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setQuery(option.label);
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2.5 text-[13px] text-[#EAE8E1] hover:bg-white/[0.06] rounded-lg transition-colors"
              >
                {option.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ProspectingPage() {
  const [leads, setLeads] = useState<ProspectLead[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [savedByGlobalId, setSavedByGlobalId] = useState<Record<string, string>>({});
  const [detailLead, setDetailLead] = useState<ProspectLead | null>(null);
  const [resultSource, setResultSource] = useState<ResultSource>('preview');
  const [totalMatches, setTotalMatches] = useState<number | null>(null);
  const [searchDepth, setSearchDepth] = useState<SearchDepth>('basic');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [savingAction, setSavingAction] = useState<'save' | 'campaign' | 'single-campaign' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [availableTokens, setAvailableTokens] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [creatorLeadIds, setCreatorLeadIds] = useState<string[]>([]);

  const [common, setCommon] = useState({
    industry: '',
    country: 'Polska',
    city: '',
    keywords: '',
    maxLeads: 10,
  });
  const [advanced, setAdvanced] = useState({
    requireEmail: true,
    requireWebsite: false,
    requireSocial: false,
    onlyEnriched: false,
  });

  const selectedLeads = useMemo(
    () => leads.filter(lead => selectedIds.has(lead.id)),
    [leads, selectedIds],
  );

  const tokenCostPerLead = DEPTH_CONFIG[searchDepth].tokenCost;
  const selectedUnlockCost = selectedLeads
    .filter(lead => lead.emailAvailable && !savedByGlobalId[lead.id] && !hasUnlockDepth(lead, searchDepth))
    .length * tokenCostPerLead;
  const displayedTotal = resultSource === 'preview' ? leads.length : (totalMatches ?? leads.length);
  const isPartialResult = resultSource !== 'preview' && displayedTotal > leads.length;

  useEffect(() => {
    let isMounted = true;

    async function fetchPreview() {
      const { data, error: previewError } = await supabase
        .rpc('zec_preview_global_leads', { p_limit: 10 });

      if (previewError) {
        console.error('Błąd pobierania preview:', previewError);
        return;
      }

      if (!isMounted) return;

      const preview = ((data || []) as GlobalLeadRow[])
        .map(mapLead)
        .sort((a, b) => Number(isShowcaseLead(b)) - Number(isShowcaseLead(a)) || leadScore(b) - leadScore(a))
        .slice(0, 10);

      setLeads(preview);
      setResultSource('preview');
      setTotalMatches(null);
    }

    async function fetchUserData(currentUserId: string) {
      setUserId(currentUserId);

      const [{ data: profileData, error: profileError }, { data: savedData }] = await Promise.all([
        supabase.from('profiles').select('credits').eq('id', currentUserId).single(),
        supabase.from('user_leads').select('id, global_lead_id').eq('user_id', currentUserId),
      ]);

      if (profileError) console.error('Błąd pobierania profilu:', profileError);
      if (!isMounted) return;

      setAvailableTokens(profileData?.credits ?? 0);

      const nextSaved = Object.fromEntries(
        (savedData || [])
          .filter((item: { id: string; global_lead_id: string | null }) => item.global_lead_id)
          .map((item: { id: string; global_lead_id: string | null }) => [item.global_lead_id as string, item.id]),
      );
      setSavedByGlobalId(nextSaved);
    }

    async function bootstrap() {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        await fetchUserData(session.user.id);
      }

      await fetchPreview();
      if (isMounted) setIsLoading(false);
    }

    void bootstrap();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        void fetchUserData(session.user.id);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSearch = async () => {
    setError(null);

    if (!common.industry && !common.city && !common.keywords.trim()) {
      setError('Dodaj przynajmniej jedną rzecz: branżę, lokalizację albo słowo kluczowe.');
      return;
    }

    if (!userId) {
      setError('Musisz być zalogowany, żeby używać wyszukiwania w bazie.');
      return;
    }

    setIsSearching(true);

    try {
      const cityValue = getCitySearchValue(common.city);
      const countryValue = getCountrySearchValue(common.country);
      const industryLabel = getOptionLabel(INDUSTRIES, common.industry);
      const industryTokens = common.industry
        ? [...tokenize(common.industry.replace(/_/g, ' ')), ...tokenize(industryLabel)]
        : [];
      const keywordTokens = tokenize(common.keywords);

      const { data, error: searchError } = await supabase.rpc('zec_search_global_leads', {
        p_city: cityValue,
        p_industry_tokens: industryTokens,
        p_keyword_tokens: keywordTokens,
        p_max_leads: common.maxLeads,
        p_search_depth: searchDepth,
        p_require_email: advanced.requireEmail,
        p_require_website: advanced.requireWebsite,
        p_require_social: advanced.requireSocial,
        p_only_enriched: advanced.onlyEnriched,
        p_country: countryValue,
      });
      if (searchError) throw searchError;

      const rows = (data || []) as SearchGlobalLeadRow[];
      const matches = rows.map(mapLead);

      if (matches.length === 0) {
        setLeads([]);
        setResultSource(searchDepth);
        setTotalMatches(0);
        setError('Brak wyników dla tych kryteriów. Spróbuj poluzować filtry albo zmienić miasto.');
        return;
      }

      const meta = rows[0];
      const totalMatches = meta?.total_matches ?? matches.length;
      const nextCredits = meta?.credits_after;

      if (typeof nextCredits === 'number') setAvailableTokens(nextCredits);
      setLeads(matches);
      setResultSource(searchDepth);
      setTotalMatches(totalMatches);
      setSelectedIds(new Set());
    } catch (err) {
      console.error(err);
      setError('Nie udało się wykonać wyszukiwania w bazie.');
    } finally {
      setIsSearching(false);
    }
  };

  const unlockLeads = async (leadsToUnlock: ProspectLead[], depth: SearchDepth = searchDepth) => {
    const candidates = leadsToUnlock.filter(lead => !savedByGlobalId[lead.id] && !hasUnlockDepth(lead, depth));
    const withoutEmail = candidates.filter(lead => !lead.emailAvailable && !lead.email);

    if (withoutEmail.length > 0) {
      throw new Error('Wybrane leady nie mają jeszcze publicznego emaila.');
    }

    if (candidates.length === 0) return leadsToUnlock;

    const { data, error: unlockError } = await (supabase as any).rpc('zec_unlock_global_leads', {
      p_lead_ids: candidates.map(lead => lead.id),
      p_unlock_depth: depth,
    });

    if (unlockError) throw unlockError;

    const rows = (data || []) as SearchGlobalLeadRow[];
    const unlocked = rows.map(mapLead);
    const unlockedById = new Map(unlocked.map(lead => [lead.id, lead]));
    const nextCredits = rows[0]?.credits_after;

    if (typeof nextCredits === 'number') setAvailableTokens(nextCredits);

    if (unlocked.length > 0) {
      setLeads(prev => prev.map(lead => unlockedById.get(lead.id) || lead));
      setDetailLead(prev => prev ? unlockedById.get(prev.id) || prev : prev);
    }

    return leadsToUnlock.map(lead => unlockedById.get(lead.id) || lead);
  };

  const saveLeadRecord = async (lead: ProspectLead, source: ResultSource = resultSource) => {
    if (!userId) throw new Error('Brak użytkownika.');
    if (savedByGlobalId[lead.id]) return savedByGlobalId[lead.id];

    const { data, error: saveError } = await supabase
      .from('user_leads')
      .insert({
        user_id: userId,
        global_lead_id: lead.id,
        status: 'pending',
        summary: buildSummary(lead, source),
        ai_icebreaker: lead.aiIcebreaker,
        has_instagram: Boolean(lead.instagramUrl || lead.instagramLastPost),
        has_linkedin: Boolean(lead.linkedinUrl || lead.linkedinBio),
        instagram_data: lead.instagramUrl || lead.instagramLastPost ? {
          url: lead.instagramUrl,
          last_post: lead.instagramLastPost,
        } : null,
        linkedin_data: lead.linkedinUrl || lead.linkedinBio ? {
          url: lead.linkedinUrl,
          bio: lead.linkedinBio,
        } : null,
        history: makeHistory(source),
      })
      .select('id')
      .single();

    if (saveError?.code === '23505') {
      const { data: existingLead, error: existingError } = await supabase
        .from('user_leads')
        .select('id')
        .eq('user_id', userId)
        .eq('global_lead_id', lead.id)
        .single();

      if (!existingError && existingLead?.id) {
        setSavedByGlobalId(prev => ({ ...prev, [lead.id]: existingLead.id }));
        return existingLead.id;
      }
    }

    if (saveError || !data) throw saveError || new Error('Nie udało się zapisać leada.');

    setSavedByGlobalId(prev => ({ ...prev, [lead.id]: data.id }));
    return data.id as string;
  };

  const saveLead = async (lead: ProspectLead, source: ResultSource = resultSource) => {
    const [unlockedLead] = await unlockLeads([lead], searchDepth);
    return saveLeadRecord(unlockedLead || lead, source);
  };

  const handleSaveSelected = async () => {
    if (selectedLeads.length === 0) return;
    setSavingAction('save');
    setError(null);

    try {
      const unlockedLeads = await unlockLeads(selectedLeads, searchDepth);
      await Promise.all(unlockedLeads.map(lead => saveLeadRecord(lead)));
      setSelectedIds(new Set());
    } catch (err) {
      console.error(err);
      setError(err instanceof Error && err.message.includes('Insufficient credits')
        ? 'Masz za mało tokenów, żeby odblokować wybrane leady.'
        : 'Nie udało się zapisać wybranych leadów.');
    } finally {
      setSavingAction(null);
    }
  };

  const openCampaignWithLeads = async (leadsToUse: ProspectLead[], action: 'campaign' | 'single-campaign') => {
    if (leadsToUse.length === 0) return;
    setSavingAction(action);
    setError(null);

    try {
      const unlockedLeads = await unlockLeads(leadsToUse, searchDepth);
      const userLeadIds = await Promise.all(unlockedLeads.map(lead => saveLeadRecord(lead)));
      setCreatorLeadIds(userLeadIds);
      setIsCreatorOpen(true);
      setSelectedIds(new Set());
      setDetailLead(null);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error && err.message.includes('Insufficient credits')
        ? 'Masz za mało tokenów, żeby odblokować leady do kampanii.'
        : 'Nie udało się przygotować leadów do kampanii.');
    } finally {
      setSavingAction(null);
    }
  };

  const toggleLead = (leadId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(leadId)) next.delete(leadId);
      else next.add(leadId);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedIds(prev => prev.size === leads.length ? new Set() : new Set(leads.map(lead => lead.id)));
  };

  const detailCanViewExtended = detailLead ? canViewExtendedLead(detailLead) : false;

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="size-5 text-[#827E78] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-28">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-[28px] font-serif text-[#EAE8E1] tracking-tight mb-1">Wyszukiwarka</h1>
          <p className="text-[15px] text-[#A3A09A] max-w-2xl">
            Wyszukuj leady w globalnej bazie ZEC, odblokowuj dane tokenami i zapisuj najlepsze firmy do kampanii.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white/[0.04] border border-white/[0.08] px-5 py-2.5 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="size-8 bg-[#EAE8E1]/10 rounded-lg flex items-center justify-center">
              <Coins className="size-4 text-[#EAE8E1]" />
            </div>
            <div>
              <p className="text-[10px] text-[#827E78] uppercase tracking-wider font-medium">Tokeny</p>
              <p className="text-[16px] font-bold text-[#EAE8E1] font-mono leading-none">{availableTokens.toLocaleString('pl-PL')}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {error && (
        <div className="p-4 rounded-xl bg-[#b56060]/10 border border-[#b56060]/20 flex items-center gap-3 text-[#b56060]">
          <AlertCircle className="size-4 shrink-0" />
          <span className="text-[13px]">{error}</span>
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <p className="text-[11px] font-medium text-[#827E78] uppercase tracking-wider">Zakres danych</p>
            <div className="inline-flex items-center rounded-xl border border-white/[0.08] bg-white/[0.03] p-1">
              {Object.entries(DEPTH_CONFIG).map(([depth, config]) => {
                const active = searchDepth === depth;

                return (
                  <button
                    key={depth}
                    type="button"
                    onClick={() => setSearchDepth(depth as SearchDepth)}
                    className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${active ? 'bg-[#EAE8E1] text-[#0a0a0a]' : 'text-[#A3A09A] hover:text-[#EAE8E1] hover:bg-white/[0.04]'}`}
                  >
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-[12px] text-[#827E78]">
            Odblokowanie: <span className="text-[#EAE8E1] font-mono">{DEPTH_CONFIG[searchDepth].tokenCost} tok/lead</span>
            <span className="mx-2 text-white/[0.14]">·</span>
            wyszukiwanie bez tokenów
          </p>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-5">
          <div>
            <p className="text-[11px] font-medium text-[#827E78] uppercase tracking-wider mb-2.5">Branża</p>
            <Autocomplete
              icon={Building2}
              placeholder="np. Architektura..."
              options={INDUSTRIES}
              value={common.industry}
              onChange={value => setCommon(prev => ({ ...prev, industry: value }))}
            />
          </div>
          <div>
            <p className="text-[11px] font-medium text-[#827E78] uppercase tracking-wider mb-2.5">Kraj</p>
            <Autocomplete
              icon={Globe}
              placeholder="Wybierz kraj..."
              options={COUNTRIES}
              value={common.country}
              onChange={value => setCommon(prev => ({ ...prev, country: value }))}
            />
          </div>
          <div>
            <p className="text-[11px] font-medium text-[#827E78] uppercase tracking-wider mb-2.5">Miasto</p>
            <Autocomplete
              icon={MapPin}
              placeholder="Wybierz miasto..."
              options={CITIES}
              value={common.city}
              onChange={value => setCommon(prev => ({ ...prev, city: value }))}
            />
          </div>
          <div>
            <p className="text-[11px] font-medium text-[#827E78] uppercase tracking-wider mb-2.5">Słowa kluczowe</p>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#827E78]" />
              <input
                type="text"
                value={common.keywords}
                onChange={event => setCommon(prev => ({ ...prev, keywords: event.target.value }))}
                placeholder="np. luksusowe, B2B..."
                className="w-full pl-10 pr-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-[14px] text-[#EAE8E1] placeholder:text-[#827E78] focus:border-white/[0.2] outline-none transition-all"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-white/[0.06]">
          <button
            type="button"
            onClick={() => setShowAdvanced(prev => !prev)}
            className="w-full flex items-center justify-between px-6 py-4 text-[13px] text-[#A3A09A] hover:text-[#EAE8E1] hover:bg-white/[0.02] transition-all"
          >
            <span className="flex items-center gap-2.5 font-medium">
              <SlidersHorizontal className="size-4" />
              Filtry jakości
              <span className="text-[11px] px-2 py-0.5 bg-white/[0.04] border border-white/[0.08] rounded-full font-mono text-[#827E78]">
                {DEPTH_CONFIG[searchDepth].label.toLowerCase()}
              </span>
            </span>
            {showAdvanced ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-white/[0.01]">
                <div className="p-6">
                  <div className="space-y-3.5">
                    <CheckRow label="Tylko leady z e-mailem" checked={advanced.requireEmail} onChange={value => setAdvanced(prev => ({ ...prev, requireEmail: value }))} />
                    <CheckRow label="Wymagaj strony WWW" checked={advanced.requireWebsite} onChange={value => setAdvanced(prev => ({ ...prev, requireWebsite: value }))} />
                    <CheckRow label="Wymagaj przynajmniej jednego sociala" checked={advanced.requireSocial} onChange={value => setAdvanced(prev => ({ ...prev, requireSocial: value }))} />
                    <CheckRow label="Tylko z dodatkowymi danymi" checked={advanced.onlyEnriched} onChange={value => setAdvanced(prev => ({ ...prev, onlyEnriched: value }))} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="border-t border-white/[0.06] px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-5 bg-white/[0.01]">
          <div className="w-full md:max-w-xs">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-medium text-[#827E78] uppercase tracking-wider">Liczba wyników</p>
              <span className="text-[13px] font-mono text-[#EAE8E1]">{common.maxLeads}</span>
            </div>
            <input
              type="range"
              min={5}
              max={50}
              step={5}
              value={common.maxLeads}
              onChange={event => setCommon(prev => ({ ...prev, maxLeads: Number(event.target.value) }))}
              className="w-full h-1 bg-white/[0.08] rounded-full appearance-none cursor-pointer accent-[#EAE8E1] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#EAE8E1] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#1a1a1a]"
            />
          </div>

          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="w-full md:w-auto shrink-0 flex items-center justify-center gap-2.5 px-9 py-4 bg-[#EAE8E1] hover:bg-white text-[#0a0a0a] text-[14px] font-bold rounded-2xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-black/20"
          >
            {isSearching ? <><Loader2 className="size-5 animate-spin" /> Szukam w bazie...</> : <><Search className="size-5" /> Szukaj w bazie</>}
          </button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between gap-4 bg-white/[0.01]">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <p className="text-[15px] font-medium text-[#EAE8E1]">
                {resultSource === 'preview' ? 'Podgląd bazy' : `Wyniki: ${DEPTH_CONFIG[resultSource].label.toLowerCase()}`}
              </p>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-[#A3A09A]">
                {formatNumber(leads.length)} leadów
              </span>
            </div>
            <p className="text-[12px] text-[#827E78]">
              {resultSource === 'preview'
                ? 'Przykładowe leady z najwyższą kompletnością danych.'
                : `Znaleziono ${formatNumber(displayedTotal)}${isPartialResult ? '+' : ''} wyników · pokazano ${formatNumber(leads.length)}. Tokeny pobieramy dopiero przy zapisie lub kampanii.`}
            </p>
          </div>

          <div className="hidden md:flex items-center gap-2 text-[12px] text-[#827E78]">
            <ShieldCheck className="size-4" />
            <span>{leads.filter(canViewExtendedLead).length} pełnych podglądów</span>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/[0.04] text-[10px] font-medium text-[#3a3a3a] uppercase tracking-wider">
          <div className="col-span-1 flex items-center">
            <button onClick={toggleAll} className={`size-4 rounded border flex items-center justify-center transition-all ${selectedIds.size === leads.length && leads.length > 0 ? 'bg-[#EAE8E1] border-[#EAE8E1]' : 'border-white/[0.2] hover:border-white/[0.4]'}`}>
              {selectedIds.size === leads.length && leads.length > 0 && <Check className="size-2.5 text-[#1A1A1A]" strokeWidth={3} />}
            </button>
          </div>
          <div className="col-span-4">Firma</div>
          <div className="col-span-2">Kontakt</div>
          <div className="col-span-2">Jakość</div>
          <div className="col-span-3">Dodatkowe dane</div>
        </div>

        <div className="divide-y divide-white/[0.04]">
          {leads.length === 0 ? (
            <div className="px-8 py-20 text-center">
              <div className="size-14 bg-white/[0.03] border border-white/[0.06] rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Target className="size-6 text-[#A3A09A]" />
              </div>
              <p className="text-[18px] font-medium text-[#EAE8E1] mb-2">Brak wyników</p>
              <p className="text-[14px] text-[#A3A09A] max-w-[360px] mx-auto leading-relaxed">
                Zmień miasto, branżę albo poluzuj filtry jakości. Tokeny nie zostały pobrane za puste wyszukiwanie.
              </p>
            </div>
          ) : leads.map(lead => {
            const selected = selectedIds.has(lead.id);
            const saved = Boolean(savedByGlobalId[lead.id]);
            const showcase = isShowcaseLead(lead);
            const extendedVisible = canViewExtendedLead(lead);

            return (
              <div
                key={lead.id}
                onClick={() => setDetailLead(lead)}
                className={`grid grid-cols-12 gap-4 px-6 py-4 items-center cursor-pointer transition-all border-l-2 ${selected ? 'bg-white/[0.04] border-l-[#EAE8E1]/50' : showcase ? 'bg-[#5d9970]/[0.035] hover:bg-[#5d9970]/[0.06] border-l-[#5d9970]/50' : 'hover:bg-white/[0.02] border-l-transparent'}`}
              >
                <div className="col-span-1 flex items-center">
                  <button
                    onClick={event => {
                      event.stopPropagation();
                      toggleLead(lead.id);
                    }}
                    className={`size-4 rounded border flex items-center justify-center transition-all ${selected ? 'bg-[#EAE8E1] border-[#EAE8E1]' : 'border-white/[0.2] hover:border-white/[0.4]'}`}
                  >
                    {selected && <Check className="size-2.5 text-[#1A1A1A]" strokeWidth={3} />}
                  </button>
                </div>

                <div className="col-span-4 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[14px] font-medium text-[#EAE8E1] truncate">{lead.companyName}</p>
                    {saved && <span className="text-[10px] text-[#5d9970] bg-[#5d9970]/10 border border-[#5d9970]/20 rounded-full px-2 py-0.5 shrink-0">zapisany</span>}
                  </div>
                  <p className="text-[13px] text-[#827E78] truncate flex items-center gap-1.5">
                    {lead.industry || 'Brak branży'} {lead.city && <><span className="w-1 h-1 rounded-full bg-white/[0.15]" /> {lead.city}</>}
                  </p>
                </div>

                <div className="col-span-2 min-w-0">
                  <div className="flex items-center gap-1.5 text-[12px] text-[#A3A09A] truncate mb-1">
                    <Mail className="size-3.5 shrink-0" />
                    {lead.email ? (
                      <span className="truncate">{lead.email}</span>
                    ) : resultSource === 'preview' ? (
                      <span className="text-[#827E78]">{lead.emailAvailable ? 'email do odblokowania' : 'brak emaila'}</span>
                    ) : (
                      <span className="truncate">{lead.emailAvailable ? 'email do odblokowania' : 'brak emaila'}</span>
                    )}
                  </div>
                  {lead.website && (
                    <a
                      href={ensureUrl(lead.website)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={event => event.stopPropagation()}
                      className="flex items-center gap-1.5 text-[12px] text-[#827E78] hover:text-[#EAE8E1] truncate transition-colors"
                    >
                      <ExternalLink className="size-3 shrink-0" />
                      {getDomain(lead.website)}
                    </a>
                  )}
                </div>

                <div className="col-span-2">
                  <div className="mb-2">
                    <p className={`text-[12px] font-medium ${showcase ? 'text-[#7fcf95]' : 'text-[#A3A09A]'}`}>
                      {showcase ? 'darmowy full' : extendedVisible ? 'pełny profil' : 'podstawowy'}
                    </p>
                    {!extendedVisible && <p className="text-[11px] text-[#827E78]">rozszerzone ukryte</p>}
                  </div>
                  <div className="relative inline-flex min-w-[92px] h-6 items-center gap-1.5 overflow-hidden rounded-md border border-white/[0.08] bg-white/[0.025]">
                    {extendedVisible ? (
                      <div className="flex items-center gap-1.5 px-2">
                        {lead.instagramUrl && <Instagram className="size-3.5 text-[#b56060]" />}
                        {lead.linkedinUrl && <Linkedin className="size-3.5 text-[#6a9bc9]" />}
                        {lead.facebookUrl && <Globe className="size-3.5 text-[#827E78]" />}
                        {!hasSocialData(lead) && <span className="text-[11px] text-[#3a3a3a]">brak sociali</span>}
                      </div>
                    ) : (
                      <>
                        <div className="absolute inset-0 flex items-center gap-2 px-2 blur-sm opacity-70">
                          <Instagram className="size-3.5 text-[#827E78]" />
                          <Linkedin className="size-3.5 text-[#827E78]" />
                          <Globe className="size-3.5 text-[#827E78]" />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center bg-[#050505]/70 backdrop-blur-sm">
                          <Lock className="size-3 text-[#A3A09A]" />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="col-span-3 min-w-0 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Layers3 className="size-3 text-[#A3A09A]" />
                        <span className="text-[10px] text-[#827E78] uppercase tracking-wider font-medium">Sygnały publiczne</span>
                      </div>
                      {extendedVisible ? (
                        <p className="text-[12px] text-[#A3A09A] truncate">
                          {getLeadSignalText(lead)}
                        </p>
                      ) : (
                        <div className="relative h-8 max-w-full overflow-hidden rounded-md border border-white/[0.08] bg-white/[0.025]">
                          <div className="absolute inset-0 px-2 py-1.5 blur-sm opacity-70 select-none">
                            <p className="text-[12px] text-[#A3A09A] truncate">
                              Sygnały publiczne, ostatnie posty i źródła profilu
                            </p>
                          </div>
                          <div className="absolute inset-0 flex items-center justify-end px-2 bg-[#050505]/70 backdrop-blur-sm">
                            <div className="inline-flex items-center gap-1.5 text-[11px] text-[#A3A09A]">
                              <Lock className="size-3" />
                              ukryte
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  </div>
                  <ChevronRight className="size-4 text-[#3a3a3a] shrink-0" />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      <AnimatePresence>
        {detailLead && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDetailLead(null)} className="fixed left-0 right-0 top-[72px] h-[calc(100vh-72px)] bg-black/60 backdrop-blur-sm z-30" />

            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed right-0 top-[72px] h-[calc(100vh-72px)] w-full max-w-xl bg-[#0a0a0a] border-l border-white/[0.08] z-40 flex flex-col shadow-2xl">
              <div className="px-8 py-6 border-b border-white/[0.06] flex justify-between items-start bg-white/[0.02]">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[12px] font-medium ${isShowcaseLead(detailLead) ? 'text-[#7fcf95]' : 'text-[#827E78]'}`}>
                      {isShowcaseLead(detailLead) ? 'darmowy full' : detailCanViewExtended ? 'pełny profil' : 'podstawowy'}
                    </span>
                    {!detailCanViewExtended && <Lock className="size-3 text-[#827E78]" />}
                  </div>
                  <h2 className="text-[22px] font-serif text-[#EAE8E1] mb-1 truncate">{detailLead.companyName}</h2>
                  <p className="text-[14px] text-[#A3A09A] flex items-center gap-2">
                    {detailLead.industry || 'Brak branży'} {detailLead.city && <><span className="size-1 rounded-full bg-white/[0.15]" /> {detailLead.city}</>}
                  </p>
                </div>
                <button onClick={() => setDetailLead(null)} className="p-2 bg-white/[0.04] hover:bg-white/[0.08] rounded-xl text-[#827E78] hover:text-[#EAE8E1] transition-all">
                  <X className="size-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
                  <h3 className="text-[12px] font-medium text-[#A3A09A] mb-3 uppercase tracking-wider">Podsumowanie</h3>
                  <p className="text-[14px] text-[#EAE8E1] leading-relaxed">
                    {buildSummary(detailLead, detailCanViewExtended ? 'enriched' : 'basic')}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {[
                    { icon: Mail, label: 'Email', value: detailLead.email || (detailLead.emailAvailable ? 'Dostępny po odblokowaniu' : '-') },
                    { icon: Globe, label: 'WWW', value: detailLead.website || '-' },
                    { icon: MapPin, label: 'Lokalizacja', value: detailLead.city || '-' },
                    { icon: Building2, label: 'Branża', value: detailLead.industry || '-' },
                  ].map((info, index) => (
                    <div key={index} className="flex items-center justify-between gap-4 p-4 rounded-xl border border-white/[0.04] bg-white/[0.01]">
                      <div className="flex items-center gap-3 text-[14px] text-[#A3A09A]">
                        <info.icon className="size-4" />
                        {info.label}
                      </div>
                      <span className="text-[14px] font-medium text-[#EAE8E1] truncate">{info.value}</span>
                    </div>
                  ))}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Layers3 className="size-4 text-[#827E78]" />
                    <h3 className="text-[14px] font-medium text-[#EAE8E1]">Źródła i sygnały</h3>
                  </div>

                  <div className="space-y-3">
                    <InsightSection
                      icon={ShieldCheck}
                      title="Sygnały publiczne"
                      isLocked={!detailCanViewExtended}
                      previewKey="public"
                      emptyText="Brak potwierdzonych sygnałów publicznych w tym profilu."
                      accentClass="text-[#5d9970]"
                    >
                      <div className="space-y-2">
                        {detailLead.businessSignals.length > 0 ? (
                          detailLead.businessSignals.slice(0, 5).map((signal, index) => (
                            <p key={index} className="text-[13px] text-[#A3A09A] leading-relaxed">
                              {[signal.label, signal.value].filter(Boolean).join(': ')}
                            </p>
                          ))
                        ) : (
                          <p className="text-[13px] text-[#827E78] leading-relaxed">Brak potwierdzonych sygnałów publicznych w tym profilu.</p>
                        )}
                      </div>
                    </InsightSection>

                    <InsightSection
                      icon={Instagram}
                      title="Instagram"
                      href={detailLead.instagramUrl}
                      isLocked={!detailCanViewExtended}
                      previewKey="instagram"
                      emptyText="Brak potwierdzonego profilu lub ostatniej aktywności Instagram."
                      accentClass="text-[#b56060]"
                    >
                      {detailLead.instagramLastPost || detailLead.instagramUrl ? (
                        <p className="text-[13px] text-[#A3A09A] leading-relaxed whitespace-pre-wrap">
                          {detailLead.instagramLastPost || detailLead.instagramUrl}
                        </p>
                      ) : (
                        <p className="text-[13px] text-[#827E78] leading-relaxed">Brak potwierdzonego profilu lub ostatniej aktywności Instagram.</p>
                      )}
                    </InsightSection>

                    <InsightSection
                      icon={Linkedin}
                      title="LinkedIn"
                      href={detailLead.linkedinUrl}
                      isLocked={!detailCanViewExtended}
                      previewKey="linkedin"
                      emptyText="Brak potwierdzonego profilu lub opisu LinkedIn."
                      accentClass="text-[#6a9bc9]"
                    >
                      {detailLead.linkedinBio || detailLead.linkedinUrl ? (
                        <p className="text-[13px] text-[#A3A09A] leading-relaxed whitespace-pre-wrap">
                          {detailLead.linkedinBio || detailLead.linkedinUrl}
                        </p>
                      ) : (
                        <p className="text-[13px] text-[#827E78] leading-relaxed">Brak potwierdzonego profilu lub opisu LinkedIn.</p>
                      )}
                    </InsightSection>

                    <InsightSection
                      icon={Globe}
                      title="Facebook"
                      href={detailLead.facebookUrl}
                      isLocked={!detailCanViewExtended}
                      previewKey="facebook"
                      emptyText="Brak potwierdzonego profilu Facebook."
                    >
                      {detailLead.facebookUrl ? (
                        <a href={ensureUrl(detailLead.facebookUrl)} target="_blank" rel="noopener noreferrer" className="text-[13px] text-[#A3A09A] hover:text-[#EAE8E1] transition-colors">Otwórz profil</a>
                      ) : (
                        <p className="text-[13px] text-[#827E78] leading-relaxed">Brak potwierdzonego profilu Facebook.</p>
                      )}
                    </InsightSection>

                    <InsightSection
                      icon={ExternalLink}
                      title="Źródła"
                      isLocked={!detailCanViewExtended}
                      previewKey="sources"
                      emptyText="Brak zapisanych źródeł dla tego profilu."
                    >
                      <div className="space-y-2">
                        {detailLead.dataSources.length > 0 ? (
                          detailLead.dataSources.slice(0, 4).map((source, index) => (
                            source.url ? (
                              <a
                                key={index}
                                href={ensureUrl(source.url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-[13px] text-[#A3A09A] hover:text-[#EAE8E1] truncate transition-colors"
                              >
                                {source.label || source.url}
                              </a>
                            ) : null
                          ))
                        ) : (
                          <p className="text-[13px] text-[#827E78] leading-relaxed">Brak zapisanych źródeł dla tego profilu.</p>
                        )}
                      </div>
                    </InsightSection>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-white/[0.06] bg-[#0a0a0a] flex gap-3">
                <button
                  onClick={() => void saveLead(detailLead).then(() => setDetailLead(null)).catch((err) => setError(err instanceof Error && err.message.includes('Insufficient credits') ? 'Masz za mało tokenów, żeby odblokować tego leada.' : 'Nie udało się zapisać leada.'))}
                  disabled={Boolean(savedByGlobalId[detailLead.id]) || savingAction === 'save'}
                  className="px-4 py-3 border border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.02] text-[#A3A09A] hover:text-[#EAE8E1] text-[13px] font-medium rounded-xl transition-all disabled:opacity-50"
                >
                  {savedByGlobalId[detailLead.id] ? 'Zapisany' : detailLead.isUnlocked ? 'Zapisz' : 'Odblokuj i zapisz'}
                </button>
                <button
                  onClick={() => void openCampaignWithLeads([detailLead], 'single-campaign')}
                  disabled={savingAction === 'single-campaign'}
                  className="flex-1 px-4 py-3 bg-[#EAE8E1] hover:bg-white text-[#0a0a0a] text-[14px] font-semibold rounded-xl transition-all disabled:opacity-50"
                >
                  {savingAction === 'single-campaign' ? 'Przygotowuję...' : 'Utwórz kampanię'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0, x: '-50%' }}
            animate={{ y: 0, opacity: 1, x: '-50%' }}
            exit={{ y: 100, opacity: 0, x: '-50%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-8 left-1/2 z-40 flex items-center gap-6 px-6 py-4 bg-[#1A1A1A] border border-white/[0.1] shadow-2xl rounded-2xl"
          >
            <div className="flex items-center gap-3 border-r border-white/[0.1] pr-6">
              <div className="flex items-center justify-center size-6 rounded-full bg-white/[0.08] text-[12px] font-mono text-[#EAE8E1]">
                {selectedIds.size}
              </div>
              <div>
                <span className="text-[14px] text-[#A3A09A]">Wybrano leadów</span>
                {selectedUnlockCost > 0 && (
                  <p className="text-[11px] text-[#827E78] font-mono">{selectedUnlockCost} tok. do odblokowania</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveSelected}
                disabled={savingAction === 'save'}
                className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-[#EAE8E1] hover:bg-white/[0.08] rounded-xl transition-all disabled:opacity-50"
              >
                {savingAction === 'save' ? <Loader2 className="size-4 animate-spin" /> : <BookmarkPlus className="size-4" />}
                Zapisz
              </button>
              <button
                onClick={() => void openCampaignWithLeads(selectedLeads, 'campaign')}
                disabled={savingAction === 'campaign'}
                className="flex items-center gap-2 px-5 py-2 bg-[#EAE8E1] hover:bg-white text-[#0a0a0a] text-[13px] font-semibold rounded-xl transition-all disabled:opacity-50"
              >
                {savingAction === 'campaign' ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
                Do kampanii
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CampaignCreator
        isOpen={isCreatorOpen}
        onClose={() => setIsCreatorOpen(false)}
        preselectedLeadIds={creatorLeadIds}
      />
    </div>
  );
}
