import { useState } from 'react';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Search, Loader2 } from 'lucide-react';

// Importy komponentów lokalnych (używamy ścieżek relatywnych)
import { LeadRow } from './LeadRow';
import { SearchCombobox } from './SearchCombobox'; 
import { INDUSTRIES, CITIES } from '../data/searchOptions';

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

  const handleSearch = async () => {
    if (!industry || !city) return;

    setIsSearching(true);
    setLeads([]);

    try {
      const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
      
      if (!webhookUrl) {
        throw new Error("Brak adresu webhooka w pliku .env");
      }

      // Znajdujemy etykiety, żeby AI dostało ładne nazwy a nie techniczne klucze
      const industryLabel = INDUSTRIES.find(i => i.value === industry)?.label || industry;
      const cityLabel = CITIES.find(c => c.value === city)?.label || city;

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry: industryLabel, city: cityLabel }),
      });

      if (!response.ok) throw new Error(`Błąd serwera: ${response.status}`);

      const rawData = await response.json();
      const dataObject = Array.isArray(rawData) ? rawData[0] : rawData;
      let jsonContent = dataObject.output || dataObject;

      // Obsługa stringified JSON z n8n/OpenAI
      let parsedData = jsonContent;
      if (typeof jsonContent === 'string') {
        try {
          const cleanedString = jsonContent.replace(/```json/gi, '').replace(/```/g, '').trim();
          parsedData = JSON.parse(cleanedString);
        } catch (e) {
          console.error("Błąd parsowania AI JSON:", e);
        }
      }

      let fetchedLeads = [];
      if (parsedData && Array.isArray(parsedData.leads)) {
        fetchedLeads = parsedData.leads;
      } else if (Array.isArray(parsedData)) {
        fetchedLeads = parsedData;
      }

      const realLeads: Lead[] = fetchedLeads.map((lead: any, index: number) => ({
        id: index + 1,
        name: lead.name || 'Nieznana firma',
        description: lead.description || 'Analiza profilu działalności...',
        industry: lead.industry || industryLabel,
        city: lead.city || cityLabel,
        email: lead.email || 'kontakt@firma.pl',
        website: lead.website || 'www.firma.pl',
        message: lead.message || 'Cześć, zauważyłem Waszą ostatnią realizację...',
        isBlurred: false,
      }));

      // Pokazujemy 3 darmowe próbki (reszta pod blurem)
      setLeads(realLeads.slice(0, 3));

    } catch (error) {
      console.error("Błąd wyszukiwania:", error);
      alert("Wystąpił błąd podczas łączenia z AI. Spróbuj ponownie za chwilę.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="relative bg-[#111111] overflow-hidden min-h-screen text-white font-sans">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-50 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="size-7 bg-white rounded-md flex items-center justify-center">
              <Sparkles className="size-4 text-black fill-black" />
            </div>
            <span className="text-xl font-bold tracking-tight">ZECLEADS</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link to="/login" className="text-sm text-gray-400 hover:text-white transition-colors">Logowanie</Link>
            <Link to="/register" className="text-sm px-5 py-2.5 bg-white text-black rounded-lg hover:bg-gray-200 transition-all font-semibold">
              Zacznij za darmo
            </Link>
          </div>
        </div>
      </header>

      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      <div className="relative z-10 pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Hero Text */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto mb-16"
          >
            <div className="mb-8">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-xs font-medium text-white/50 backdrop-blur-md">
                <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                Darmowe wyszukiwanie • 3 leady na start
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight leading-[1.05]" style={{ fontFamily: "'Libre Baskerville', serif" }}>
              Znajdź setki klientów<br />jednym kliknięciem
            </h1>
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Zautomatyzowany research, wyszukiwanie maili i personalizacja AI. Wybierz branżę i zobacz magię.
            </p>
          </motion.div>

          {/* Browser Window UI */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-5xl mx-auto"
          >
            <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden shadow-white/[0.02]">
              
              {/* Search Bar Container */}
              <div className="p-6 md:p-8 border-b border-white/10 bg-white/[0.02]">
                <div className="flex flex-col md:flex-row gap-5">
                  <div className="flex-1">
                    <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-2 font-bold px-1">Branża</label>
                    <SearchCombobox
                      options={INDUSTRIES}
                      value={industry}
                      onChange={setIndustry}
                      placeholder="np. Architekt"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-2 font-bold px-1">Lokalizacja</label>
                    <SearchCombobox
                      options={CITIES}
                      value={city}
                      onChange={setCity}
                      placeholder="np. Warszawa"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={handleSearch}
                      disabled={isSearching || !industry || !city}
                      className="w-full md:w-auto h-[50px] px-10 rounded-lg bg-white text-black font-bold hover:bg-gray-200 transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                    >
                      {isSearching ? <Loader2 className="size-5 animate-spin" /> : <Search className="size-5" />}
                      <span>Znajdź leady</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Content Area */}
              <div className="min-h-[400px] max-h-[600px] overflow-y-auto bg-black/40">
                <div className="p-6 md:p-8">
                  {isSearching ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-32 rounded-xl bg-white/[0.03] border border-white/5 animate-pulse" />
                      ))}
                    </div>
                  ) : leads.length > 0 ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">WYNIKI WYSZUKIWANIA (3 / 500+)</h3>
                      </div>
                      
                      {leads.map((lead, idx) => (
                        <motion.div 
                          key={lead.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                        >
                          <LeadRow lead={lead} dark />
                        </motion.div>
                      ))}

                      {/* Paywall Overlay */}
                      <div className="relative mt-8">
                        <div className="space-y-4 blur-[6px] pointer-events-none opacity-40">
                          <div className="h-32 rounded-xl border border-white/10 bg-white/5" />
                          <div className="h-32 rounded-xl border border-white/10 bg-white/5" />
                        </div>
                        
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/80 to-transparent pt-20">
                           <div className="text-center p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl max-w-sm">
                              <h4 className="text-2xl font-bold mb-3">Zobaczyłeś próbkę</h4>
                              <p className="text-gray-400 text-sm mb-6">Mamy jeszcze 497 spersonalizowanych leadów w tej lokalizacji.</p>
                              <Link to="/register" className="block w-full py-4 bg-white text-black rounded-xl font-bold hover:scale-[1.02] transition-transform">
                                Odblokuj pełną listę
                              </Link>
                              <p className="text-[11px] text-gray-600 mt-4 uppercase font-bold tracking-tighter">Brak wymaganej karty na start</p>
                           </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-24 text-center">
                      <div className="size-20 bg-white/[0.02] border border-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Search className="size-8 text-gray-600" />
                      </div>
                      <h3 className="text-xl font-medium text-gray-300">Gotowy do startu?</h3>
                      <p className="text-gray-500 max-w-xs mx-auto mt-2">Wybierz branżę i miasto powyżej, aby wygenerować pierwsze darmowe leady.</p>
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