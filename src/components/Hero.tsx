import { useState } from 'react';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Search, Loader2 } from 'lucide-react';
import { LeadRow } from './LeadRow';

interface Lead {
  id: number;
  name: string;
  description: string;
  industry: string;
  city: string;
  email: string;
  website: string;
  message: string;
  isBlurred: boolean;
}

export function Hero() {
  const [industry, setIndustry] = useState('');
  const [city, setCity] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);

  const handleSearch = () => {
    if (!industry.trim() || !city.trim()) return;

    setIsSearching(true);
    setLeads([]);

    setTimeout(() => {
      const realLeads: Lead[] = [
        {
          id: 1,
          name: 'Atelier Kowalski',
          description: 'Nowoczesna pracownia architektoniczna specjalizująca się w projektach minimalistycznych budynków mieszkalnych i biurowych. Zdobywca nagrody Architekt Roku 2024.',
          industry: 'Architektura',
          city: 'Warszawa',
          email: 'kontakt@atelier-kowalski.pl',
          website: 'www.atelier-kowalski.pl',
          message: 'Cześć! Widziałem Twoje projekty i jestem pod wrażeniem minimalistycznego podejścia do architektury. Pracuję nad nowym projektem deweloperskim w centrum Warszawy i szukam partnera, który pomoże nam stworzyć coś wyjątkowego. Czy mógłbyś znaleźć 15 minut w tym tygodniu na szybką rozmowę?',
          isBlurred: false,
        },
        {
          id: 2,
          name: 'Studio Nowak Design',
          description: 'Butikowa pracownia projektowa oferująca kompleksowe usługi architektoniczne dla klientów komercyjnych. Eksperci w sustainable design i LEED certification.',
          industry: 'Architektura',
          city: 'Warszawa',
          email: 'biuro@nowak-design.pl',
          website: 'www.nowak-design.pl',
          message: 'Dzień dobry! Szukamy architekta z doświadczeniem w zrównoważonym budownictwie dla naszego nowego projektu biurowego. Widzę, że specjalizujecie się w sustainable design - dokładnie tego potrzebujemy. Czy bylibyście zainteresowani współpracą? Chętnie opowiem więcej szczegółów.',
          isBlurred: false,
        },
        {
          id: 3,
          name: 'Wiśniewski Architects',
          description: 'Międzynarodowa pracownia architektoniczna z 15-letnim doświadczeniem. Realizujemy projekty od concept do execution w Polsce, Niemczech i Francji.',
          industry: 'Architektura',
          city: 'Warszawa',
          email: 'hello@wisniewski-arch.com',
          website: 'www.wisniewski-architects.com',
          message: 'Hi! Interesuje nas współpraca przy dużym projekcie mieszkaniowym w Warszawie (200+ jednostek). Potrzebujemy doświadczonego partnera, który pomoże nam z local regulations i execution. Czy moglibyśmy umówić się na call w przyszłym tygodniu, żeby omówić szczegóły?',
          isBlurred: false,
        },
      ];

      setLeads(realLeads);
      setIsSearching(false);
    }, 1500);
  };

  return (
    <div className="relative bg-[#111111] overflow-hidden min-h-screen">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-50 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="size-7 bg-white rounded-md flex items-center justify-center">
              <Sparkles className="size-4 text-black fill-black" />
            </div>
            <span className="text-xl font-bold text-white">ZEC</span>
          </Link>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
              Pricing
            </a>
            <Link to="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
              Logowanie
            </Link>
            <Link to="/register" className="text-sm px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-all font-medium">
              Zacznij za darmo
            </Link>
          </div>
        </div>
      </header>

      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* Hero Content */}
      <div className="relative z-10 pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          {/* Title Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto mb-16"
          >
            <div className="mb-6">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-sm text-white/60 backdrop-blur-sm">
                3 free leads • No signup required
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight leading-[1.1]" style={{ fontFamily: "'Libre Baskerville', serif" }}>
              Znajdź setki klientów
              <br />
              jednym kliknięciem
            </h1>

            <p className="text-lg md:text-xl text-gray-400 leading-relaxed">
              Automatyczne scrapowanie Google Maps, wyszukiwanie maili i personalizowany outreach.
              <br className="hidden md:block" />
              Wszystko w jednym miejscu.
            </p>
          </motion.div>

          {/* macOS Window */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="rounded-2xl overflow-hidden shadow-2xl max-w-6xl mx-auto relative"
          >
            {/* Subtle border glow */}
            <div className="absolute -inset-[1px] bg-gradient-to-b from-white/20 to-white/5 rounded-2xl" />
            
            {/* Main container */}
            <div className="relative bg-[#0f0f0f] border border-[#1f1f1f] rounded-2xl">
              {/* Search Section */}
              <div className="p-6 md:p-8 border-b border-white/10">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1">
                    <label className="block text-sm text-gray-400 mb-2 font-medium">
                      Branża
                    </label>
                    <input
                      type="text"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      placeholder="np. architekt"
                      className="w-full px-4 py-3 rounded-lg transition-all focus:outline-none focus:ring-2 bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:ring-white/20 focus:border-white/20"
                    />
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm text-gray-400 mb-2 font-medium">
                      Miasto
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="np. Warszawa"
                      className="w-full px-4 py-3 rounded-lg transition-all focus:outline-none focus:ring-2 bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:ring-white/20 focus:border-white/20"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={handleSearch}
                      disabled={isSearching || !industry.trim() || !city.trim()}
                      className="w-full md:w-auto px-8 py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium bg-white text-black hover:bg-gray-200 shadow-lg shadow-white/10"
                    >
                      {isSearching ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Szukam...
                        </>
                      ) : (
                        <>
                          <Search className="size-4" />
                          Znajdź leady
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Results Area */}
              <div className="bg-black/20 backdrop-blur-sm" style={{ height: '500px', overflowY: 'auto' }}>
                <div className="p-6 md:p-8">
                  <AnimatePresence>
                    {leads.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6"
                      >
                        <h3 className="text-lg font-semibold text-white">
                          Znaleziono 500+ leadów
                        </h3>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Leads List */}
                  <div className="space-y-4 relative">
                    <AnimatePresence mode="popLayout">
                      {leads.map((lead, index) => (
                        <motion.div
                          key={lead.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{
                            duration: 0.3,
                            delay: index * 0.05,
                          }}
                        >
                          <LeadRow lead={lead} dark />
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {/* Premium Blur Overlay - shows after 3 free leads */}
                    {leads.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="relative"
                      >
                        {/* Blurred preview cards */}
                        <div className="space-y-4 pointer-events-none select-none">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div
                              key={`blur-${i}`}
                              className="rounded-xl border bg-white/5 border-white/10 backdrop-blur-xl p-6 opacity-50 blur-sm"
                            >
                              <div className="space-y-4">
                                <div className="h-5 rounded w-1/3 bg-white/20" />
                                <div className="h-4 rounded w-full bg-white/10" />
                                <div className="h-4 rounded w-3/4 bg-white/10" />
                                <div className="flex gap-4">
                                  <div className="h-4 rounded w-32 bg-white/10" />
                                  <div className="h-4 rounded w-32 bg-white/10" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* CTA Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-transparent via-[#0a0a0a]/90 to-[#0a0a0a] backdrop-blur-md">
                          <div className="text-center px-6 py-12 max-w-md">
                            <div className="mb-6">
                              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl mb-4">
                                <div className="size-2 bg-gray-400 rounded-full" />
                                <span className="text-gray-300 text-sm font-medium">500+ więcej leadów gotowych</span>
                              </div>
                            </div>
                            
                            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                              Odblokuj pełną listę
                            </h3>
                            
                            <p className="text-gray-400 text-base mb-8 leading-relaxed">
                              Zdobądź dostęp do 500+ zweryfikowanych leadów z personalizowanymi wiadomościami AI
                            </p>

                            <button className="w-full px-8 py-4 rounded-lg text-base font-semibold transition-all bg-white text-black hover:bg-gray-100">
                              Upgrade do Premium
                            </button>

                            <p className="text-gray-500 text-sm mt-4">
                              Bez zobowiązań • Anuluj kiedy chcesz
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Loading state */}
                  {isSearching && (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="rounded-lg p-6 border bg-white/5 border-white/10"
                        >
                          <div className="animate-pulse space-y-4">
                            <div className="h-5 rounded w-1/4 bg-white/10" />
                            <div className="h-4 rounded w-full bg-white/5" />
                            <div className="h-4 rounded w-3/4 bg-white/5" />
                            <div className="flex gap-4">
                              <div className="h-4 rounded w-32 bg-white/5" />
                              <div className="h-4 rounded w-32 bg-white/5" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Empty state */}
                  {!isSearching && leads.length === 0 && (
                    <div className="text-center py-20">
                      <div className="size-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-white/5">
                        <Search className="size-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium mb-2 text-white">
                        Wprowadź branżę i miasto
                      </h3>
                      <p className="text-gray-400">
                        Znajdziemy setki leadów w kilka sekund
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}