import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Filter, Globe, MapPin, Building2, Star, Mail, Check, 
  Sparkles, ArrowRight, Coins, ChevronDown, ChevronUp, AlertCircle, Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const mockLeads = [
  { id: 1, name: 'Studio Architektoniczne Nowak', website: 'nowakarchitekci.pl', email: 'kontakt@nowakarchitekci.pl', rating: 4.8, reviews: 127, city: 'Warszawa', industry: 'Architektura', description: 'Nowoczesne projekty budowlane.' },
  { id: 2, name: 'BudMaster Deweloper', website: 'budmaster.com', email: 'biuro@budmaster.com', rating: 4.9, reviews: 203, city: 'Kraków', industry: 'Deweloper', description: 'Lider na rynku deweloperskim w Małopolsce.' },
];

interface UserProfile {
  full_name: string;
  offer: string;
  package: string;
}

export function ProspectingPage() {
  const [leads, setLeads] = useState<typeof mockLeads>([]);
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [availableTokens, setAvailableTokens] = useState<number>(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [filters, setFilters] = useState({
    industry: '',
    country: 'Polska',
    city: '',
    keywords: '',
    requireWebsite: true,
    requireEmail: false,
    requireSocials: false,
    minRating: 4.0,
    minReviews: 10,
    leadsCount: 50,
  });

  useEffect(() => {
    async function fetchUserData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
        setUserEmail(session.user.email ?? null);

        const { data } = await supabase
          .from('profiles')
          .select('credits, full_name, offer, package')
          .eq('id', session.user.id)
          .single();

        if (data) {
          setAvailableTokens(data.credits ?? 0);
          setUserProfile({
            full_name: data.full_name ?? '',
            offer: data.offer ?? '',
            package: data.package ?? 'basic',
          });
        }
      }
    }
    fetchUserData();
  }, []);

  const handleSearch = async () => {
    setError(null);

    if (!filters.industry || !filters.city) {
      setError('Branża i miasto są wymagane.');
      return;
    }

    if (filters.leadsCount > availableTokens) {
      setError(`Nie masz wystarczającej liczby tokenów. Brakuje: ${filters.leadsCount - availableTokens}`);
      return;
    }

    setIsSearching(true);

    try {
      const webhookUrl = 'https://n8n.srv1579942.hstgr.cloud/webhook/36f18c9a-7027-4260-a666-fecbc697eedb';

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          package: userProfile?.package ?? 'basic',

          client: {
            name: userProfile?.full_name ?? '',
            email: userEmail ?? '',
            offer: userProfile?.offer ?? '',
            language: 'pl',
          },

          common: {
            industry: filters.industry,
            country: filters.country,
            city: filters.city,
            keywords: filters.keywords,
            maxLeads: filters.leadsCount,
          },

          googleFilters: {
            minRating: filters.minRating,
            minReviews: filters.minReviews,
            requireWebsite: filters.requireWebsite,
            requireEmail: filters.requireEmail,
            requirePhone: false,
            requireOpenNow: false,
          },

          igFilters: {
            minFollowers: 1000,
            maxFollowers: 500000,
            minEngagementRate: 1,
            minPosts: 12,
            businessAccountOnly: true,
            requireEmail: false,
            requireWebsite: false,
          },

          liFilters: {
            minEmployees: 1,
            maxEmployees: 250,
            companySize: [],
            requireWebsite: true,
            hasActiveJobs: false,
            requireEmail: false,
            foundedAfter: '',
          },
        }),
      });

      if (!response.ok) throw new Error('Błąd połączenia z serwerem wyszukiwania.');

      const data = await response.json();
      setLeads(data.leads && data.leads.length > 0 ? data.leads : mockLeads);

    } catch (err: any) {
      console.error(err);
      setLeads(mockLeads);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleLead = (id: number) => {
    setSelectedLeads(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    selectedLeads.length === leads.length
      ? setSelectedLeads([])
      : setSelectedLeads(leads.map(l => l.id));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      <motion.div
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4"
      >
        <div className="flex items-center gap-3">
          <div className="size-10 bg-gradient-to-br from-amber-400/20 to-amber-600/20 border border-amber-500/30 rounded-lg flex items-center justify-center">
            <Coins className="size-5 text-amber-400" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-400">Dostępne tokeny</div>
            <div className="text-xl font-bold text-white tracking-tight">{availableTokens.toLocaleString()}</div>
          </div>
        </div>
        <button className="px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm font-medium rounded-lg transition-colors">
          Doładuj portfel
        </button>
      </motion.div>

      <div>
        <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "'Libre Baskerville', serif" }}>
          Wyszukiwarka leadów
        </h1>
        <p className="text-gray-400">Precyzyjnie filtruj i pobieraj firmy gotowe na Twój outreach.</p>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400">
          <AlertCircle className="size-5 shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-2xl p-6 shadow-2xl relative"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Branża *</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500 pointer-events-none" />
              <select
                value={filters.industry}
                onChange={(e) => setFilters({ ...filters, industry: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-white/[0.02] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-white/30 focus:bg-white/5 transition-all appearance-none cursor-pointer"
              >
                <option value="" className="bg-[#111111] text-gray-400">Wybierz branżę...</option>
                <option value="architektura" className="bg-[#111111] text-white">Architektura i Projektowanie</option>
                <option value="deweloper" className="bg-[#111111] text-white">Nieruchomości / Deweloper</option>
                <option value="marketing" className="bg-[#111111] text-white">Agencje Marketingowe</option>
                <option value="it" className="bg-[#111111] text-white">Software House / IT</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Kraj</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500 pointer-events-none" />
              <select
                value={filters.country}
                onChange={(e) => setFilters({ ...filters, country: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-white/[0.02] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-white/30 focus:bg-white/5 transition-all appearance-none cursor-pointer"
              >
                <option value="Polska" className="bg-[#111111] text-white">Polska</option>
                <option value="Global" className="bg-[#111111] text-white">Cały świat (Global)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Miasto *</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
              <input
                type="text"
                value={filters.city}
                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                placeholder="np. Warszawa"
                className="w-full pl-10 pr-4 py-2.5 bg-white/[0.02] border border-white/10 rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-white/30 focus:bg-white/5 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Słowa kluczowe (Opcjonalnie)</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
              <input
                type="text"
                value={filters.keywords}
                onChange={(e) => setFilters({ ...filters, keywords: e.target.value })}
                placeholder="np. B2B, luksusowe"
                className="w-full pl-10 pr-4 py-2.5 bg-white/[0.02] border border-white/10 rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-white/30 focus:bg-white/5 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-4 mb-6">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <Filter className="size-4" />
            Zaawansowane filtry
            {showAdvanced ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-4 bg-white/[0.01] rounded-xl border border-white/5">
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Wymagania firmy</h3>
                    {[
                      { id: 'requireWebsite', label: 'Wymagaj strony WWW (Zalecane)' },
                      { id: 'requireEmail', label: 'Wymagaj widocznego e-maila' },
                      { id: 'requireSocials', label: 'Wymagaj profili Social Media (LinkedIn/FB)' },
                    ].map(checkbox => (
                      <label key={checkbox.id} className="flex items-start gap-2.5 pt-1 cursor-pointer group">
                        <div className="relative flex items-center justify-center size-4 shrink-0 mt-[1px]">
                          <input
                            type="checkbox"
                            checked={filters[checkbox.id as keyof typeof filters] as boolean}
                            onChange={(e) => setFilters({ ...filters, [checkbox.id]: e.target.checked })}
                            className="peer sr-only"
                          />
                          <div className="absolute inset-0 rounded border border-white/20 bg-white/5 peer-checked:bg-white peer-checked:border-white transition-all group-hover:border-white/40" />
                          <Check className="size-3 text-black opacity-0 peer-checked:opacity-100 relative z-10 transition-opacity" strokeWidth={3} />
                        </div>
                        <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">{checkbox.label}</span>
                      </label>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Jakość firmy (Google Maps)</h3>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">Minimalna ocena:</span>
                        <span className="text-white font-medium">{filters.minRating} <Star className="inline size-3 text-amber-400 mb-0.5" /></span>
                      </div>
                      <input
                        type="range" min="1" max="5" step="0.1"
                        value={filters.minRating}
                        onChange={(e) => setFilters({ ...filters, minRating: parseFloat(e.target.value) })}
                        className="w-full accent-white"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">Minimalna liczba opinii:</span>
                        <span className="text-white font-medium">{filters.minReviews}+</span>
                      </div>
                      <input
                        type="range" min="0" max="100" step="5"
                        value={filters.minReviews}
                        onChange={(e) => setFilters({ ...filters, minReviews: parseInt(e.target.value) })}
                        className="w-full accent-white"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-white/[0.02] rounded-xl border border-white/10">
          <div className="flex-1 w-full md:w-auto">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Ile leadów potrzebujesz?</label>
            <div className="flex items-center gap-4">
              <input
                type="range" min="10" max="500" step="10"
                value={filters.leadsCount}
                onChange={(e) => setFilters({ ...filters, leadsCount: parseInt(e.target.value) })}
                className="w-48 accent-white"
              />
              <div className="bg-[#111111] px-4 py-1.5 rounded-lg border border-white/10 text-white font-mono font-bold">
                {filters.leadsCount}
              </div>
              <div className="text-sm text-gray-400 hidden sm:block">
                Szacunkowy koszt: <span className="text-amber-400 font-bold">{filters.leadsCount} tokenów</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="w-full md:w-auto px-8 py-3 bg-white text-black font-bold rounded-lg text-sm hover:bg-gray-200 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,255,255,0.05)] disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {isSearching ? (
              <><Loader2 className="size-4 animate-spin" /> Skanowanie sieci...</>
            ) : (
              <><Sparkles className="size-4" /> Rozpocznij skanowanie</>
            )}
          </button>
        </div>
      </motion.div>

      {leads.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-2xl overflow-hidden shadow-2xl relative"
        >
          <div className="p-6 border-b border-white/5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Wyniki wyszukiwania</h2>
                <p className="text-sm text-gray-400">Pobrano {leads.length} leadów spełniających kryteria.</p>
              </div>
            </div>
          </div>

          <div className="border-b border-white/5 bg-white/[0.02]">
            <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="col-span-1 flex items-center">
                <label className="relative flex items-center justify-center size-4 cursor-pointer">
                  <input type="checkbox" checked={selectedLeads.length === leads.length && leads.length > 0} onChange={toggleAll} className="peer sr-only" />
                  <div className="absolute inset-0 rounded border border-white/20 bg-white/5 peer-checked:bg-white peer-checked:border-white transition-all" />
                  <Check className="size-3 text-black opacity-0 peer-checked:opacity-100 relative z-10" strokeWidth={3} />
                </label>
              </div>
              <div className="col-span-4">Firma</div>
              <div className="col-span-3">Kontakt</div>
              <div className="col-span-3">Jakość (Maps)</div>
            </div>
          </div>

          <div className="divide-y divide-white/5">
            {leads.map((lead) => (
              <div key={lead.id} className={`grid grid-cols-12 gap-4 px-6 py-4 transition-all hover:bg-white/[0.02] ${selectedLeads.includes(lead.id) ? 'bg-white/[0.04]' : ''}`}>
                <div className="col-span-1 flex items-center">
                  <label className="relative flex items-center justify-center size-4 cursor-pointer">
                    <input type="checkbox" checked={selectedLeads.includes(lead.id)} onChange={() => toggleLead(lead.id)} className="peer sr-only" />
                    <div className="absolute inset-0 rounded border border-white/20 bg-white/5 peer-checked:bg-white peer-checked:border-white transition-all" />
                    <Check className="size-3 text-black opacity-0 peer-checked:opacity-100 relative z-10" strokeWidth={3} />
                  </label>
                </div>

                <div className="col-span-4 pr-4">
                  <div className="font-semibold text-white mb-1">{lead.name}</div>
                  <div className="text-xs text-gray-500 line-clamp-1">{lead.description}</div>
                </div>

                <div className="col-span-3 flex flex-col justify-center gap-1.5">
                  <a href={`https://${lead.website}`} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 truncate">
                    <Globe className="size-3" /> {lead.website}
                  </a>
                  <div className="text-xs text-gray-400 flex items-center gap-1.5 truncate">
                    <Mail className="size-3" /> {lead.email || 'Brak'}
                  </div>
                </div>

                <div className="col-span-3 flex items-center gap-2">
                  <div className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded-md border border-white/10">
                    <Star className="size-3 text-amber-400 fill-amber-400/20" />
                    <span className="text-xs font-bold text-white">{lead.rating}</span>
                  </div>
                  <span className="text-xs text-gray-500">({lead.reviews} opinii)</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {selectedLeads.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="bg-white backdrop-blur-sm rounded-2xl shadow-2xl px-8 py-4 flex items-center gap-6 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="size-10 bg-black rounded-full flex items-center justify-center">
                  <Check className="size-5 text-white" />
                </div>
                <div>
                  <div className="font-bold text-black leading-tight">
                    {selectedLeads.length} {selectedLeads.length === 1 ? 'lead wybrany' : 'leadów wybranych'}
                  </div>
                </div>
              </div>
              <button className="px-6 py-3 bg-black hover:bg-gray-800 text-white font-bold text-sm rounded-xl transition-all flex items-center gap-2 group shadow-lg">
                Dodaj do Kampanii <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}