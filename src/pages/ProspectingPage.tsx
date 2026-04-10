import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, Globe, MapPin, Building2, Star, Mail, Check, Sparkles, ArrowRight, Coins } from 'lucide-react';

// Mock data dla demonstracji
const mockLeads = [
  {
    id: 1,
    name: 'Studio Architektoniczne Nowak',
    website: 'www.nowakarchitekci.pl',
    email: 'kontakt@nowakarchitekci.pl',
    rating: 4.8,
    reviews: 127,
    city: 'Warszawa',
    industry: 'Architektura',
    description: 'Specjalizujemy się w projektowaniu nowoczesnych budynków mieszkalnych i komercyjnych'
  },
  {
    id: 2,
    name: 'BudMaster Deweloper',
    website: 'www.budmaster.com',
    email: 'biuro@budmaster.com',
    rating: 4.9,
    reviews: 203,
    city: 'Kraków',
    industry: 'Deweloper',
    description: 'Lider na rynku deweloperskim w Małopolsce, tworzymy przestrzenie do życia'
  },
  {
    id: 3,
    name: 'Creative Marketing Agency',
    website: 'www.creativeagency.io',
    email: 'hello@creativeagency.io',
    rating: 4.7,
    reviews: 89,
    city: 'Wrocław',
    industry: 'Marketing',
    description: 'Kompleksowe usługi marketingowe dla firm B2B i B2C'
  },
  {
    id: 4,
    name: 'Tech Solutions Poland',
    website: 'www.techsolutions.pl',
    email: 'info@techsolutions.pl',
    rating: 4.6,
    reviews: 156,
    city: 'Poznań',
    industry: 'IT',
    description: 'Rozwiązania IT dla przedsiębiorstw, cloud computing i cybersecurity'
  },
  {
    id: 5,
    name: 'Elegance Interiors',
    website: 'www.eleganceinteriors.com',
    email: 'studio@eleganceinteriors.com',
    rating: 5.0,
    reviews: 94,
    city: 'Warszawa',
    industry: 'Wnętrza',
    description: 'Projektowanie i aranżacja luksusowych wnętrz'
  },
];

export function ProspectingPage() {
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [leads, setLeads] = useState<typeof mockLeads>([]);
  const [filters, setFilters] = useState({
    industry: '',
    country: 'Polska',
    city: '',
    keywords: ''
  });

  // Przykładowy stan tokenów (w przyszłości pobierany z Supabase z user_profiles)
  const [availableTokens] = useState(1250);

  const handleSearch = () => {
    setIsSearching(true);
    // Symulacja wyszukiwania
    setTimeout(() => {
      setLeads(mockLeads);
      setIsSearching(false);
    }, 1500);
  };

  const toggleLead = (id: number) => {
    setSelectedLeads(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedLeads.length === leads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(leads.map(l => l.id));
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Bar with Tokens - Nowy, designerski pasek portfela */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
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
        
        <button className="px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
          Doładuj portfel
        </button>
      </motion.div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Wyszukiwarka leadów
        </h1>
        <p className="text-gray-400">
          Znajdź idealnych klientów w swojej branży
        </p>
      </div>

      {/* Filters Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6"
      >
        <div className="flex items-center gap-2 mb-6">
          <Filter className="size-5 text-white" />
          <h2 className="text-lg font-semibold text-white">Zaawansowane filtry</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Industry */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Branża
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
              <select
                value={filters.industry}
                onChange={(e) => setFilters({ ...filters, industry: e.target.value })}
                className="w-full bg-white/[0.02] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:border-white/30 focus:bg-white/5 focus:outline-none appearance-none transition-all cursor-pointer"
              >
                <option value="" className="bg-[#111111] text-gray-400">Wszystkie</option>
                <option value="architektura" className="bg-[#111111] text-white">Architektura</option>
                <option value="deweloper" className="bg-[#111111] text-white">Deweloper</option>
                <option value="marketing" className="bg-[#111111] text-white">Marketing</option>
                <option value="it" className="bg-[#111111] text-white">IT</option>
                <option value="wnetrza" className="bg-[#111111] text-white">Wnętrza</option>
              </select>
            </div>
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Kraj
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
              <select
                value={filters.country}
                onChange={(e) => setFilters({ ...filters, country: e.target.value })}
                className="w-full bg-white/[0.02] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:border-white/30 focus:bg-white/5 focus:outline-none appearance-none transition-all cursor-pointer opacity-70"
                disabled
              >
                <option value="Polska" className="bg-[#111111] text-white">Polska</option>
              </select>
            </div>
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Miasto
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <input
                type="text"
                value={filters.city}
                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                placeholder="np. Warszawa"
                className="w-full bg-white/[0.02] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:border-white/30 focus:bg-white/5 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Keywords */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Słowa kluczowe
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <input
                type="text"
                value={filters.keywords}
                onChange={(e) => setFilters({ ...filters, keywords: e.target.value })}
                placeholder="np. luksusowe"
                className="w-full bg-white/[0.02] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:border-white/30 focus:bg-white/5 focus:outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          disabled={isSearching}
          className="w-full md:w-auto px-8 py-3 bg-white text-black font-bold rounded-lg text-sm hover:bg-gray-200 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,255,255,0.05)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSearching ? (
            <>
              <div className="size-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              Szukam leadów...
            </>
          ) : (
            <>
              <Search className="size-4" />
              Szukaj leadów
            </>
          )}
        </button>
      </motion.div>

      {/* Results Table */}
      {leads.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden"
        >
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">
                  Znaleziono {leads.length} leadów
                </h2>
                <p className="text-sm text-gray-400">
                  Zaznacz leady, aby utworzyć kampanię
                </p>
              </div>
              {selectedLeads.length > 0 && (
                <div className="text-sm font-medium text-white bg-white/10 px-4 py-2 rounded-lg">
                  Zaznaczono: {selectedLeads.length}
                </div>
              )}
            </div>
          </div>

          {/* Table Header */}
          <div className="border-b border-white/10">
            <div className="grid grid-cols-12 gap-4 px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
              <div className="col-span-1 flex items-center">
                <div className="relative flex items-center justify-center size-4">
                  <input
                    type="checkbox"
                    checked={selectedLeads.length === leads.length}
                    onChange={toggleAll}
                    className="peer sr-only"
                  />
                  <div className="absolute inset-0 rounded border border-white/20 bg-white/5 peer-checked:bg-white peer-checked:border-white transition-all cursor-pointer" />
                  <Check className="size-3 text-black opacity-0 peer-checked:opacity-100 relative z-10 transition-opacity pointer-events-none" strokeWidth={3} />
                </div>
              </div>
              <div className="col-span-3">Firma</div>
              <div className="col-span-2">Strona WWW</div>
              <div className="col-span-3">Email</div>
              <div className="col-span-2">Ocena</div>
              <div className="col-span-1">Akcje</div>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-white/5">
            {leads.map((lead, index) => (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`grid grid-cols-12 gap-4 px-6 py-4 hover:bg-white/[0.03] transition-all ${
                  selectedLeads.includes(lead.id) ? 'bg-white/[0.04]' : ''
                }`}
              >
                {/* Checkbox */}
                <div className="col-span-1 flex items-center">
                  <div className="relative flex items-center justify-center size-4">
                    <input
                      type="checkbox"
                      checked={selectedLeads.includes(lead.id)}
                      onChange={() => toggleLead(lead.id)}
                      className="peer sr-only"
                    />
                    <div className="absolute inset-0 rounded border border-white/20 bg-white/5 peer-checked:bg-white peer-checked:border-white transition-all cursor-pointer" />
                    <Check className="size-3 text-black opacity-0 peer-checked:opacity-100 relative z-10 transition-opacity pointer-events-none" strokeWidth={3} />
                  </div>
                </div>

                {/* Company Name & Description */}
                <div className="col-span-3 pr-4">
                  <div className="font-semibold text-white mb-1">
                    {lead.name}
                  </div>
                  <div className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                    {lead.description}
                  </div>
                </div>

                {/* Website */}
                <div className="col-span-2 flex items-center">
                  <a
                    href={`https://${lead.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-300 hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <Globe className="size-3 text-gray-500" />
                    <span className="truncate">{lead.website}</span>
                  </a>
                </div>

                {/* Email */}
                <div className="col-span-3 flex items-center pr-4">
                  <div className="flex items-center gap-2 w-full">
                    <Mail className="size-4 text-gray-500 shrink-0" />
                    <span className="text-sm text-gray-300 truncate">{lead.email}</span>
                  </div>
                </div>

                {/* Rating */}
                <div className="col-span-2 flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Star className="size-4 text-amber-400 fill-amber-400/20" />
                    <span className="text-sm font-medium text-white">
                      {lead.rating}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    ({lead.reviews})
                  </span>
                </div>

                {/* Actions */}
                <div className="col-span-1 flex items-center">
                  <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-500 hover:text-white">
                    <Sparkles className="size-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Floating Action Bar */}
      <AnimatePresence>
        {selectedLeads.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="bg-white backdrop-blur-sm rounded-2xl shadow-2xl px-8 py-4 flex items-center gap-6 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="size-10 bg-black rounded-full flex items-center justify-center shadow-inner">
                  <Check className="size-5 text-white" />
                </div>
                <div>
                  <div className="font-bold text-black leading-tight">
                    {selectedLeads.length} {selectedLeads.length === 1 ? 'lead wybrany' : 'leadów wybranych'}
                  </div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-0.5">
                    Gotowe do stworzenia kampanii
                  </div>
                </div>
              </div>
              
              <button className="px-6 py-3 bg-black hover:bg-gray-800 text-white font-bold text-sm rounded-xl transition-all flex items-center gap-2 group shadow-lg">
                Stwórz kampanię
                <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}