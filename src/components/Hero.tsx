import { useState } from 'react';
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

  const handleSearch = async () => {
    if (!industry.trim() || !city.trim()) return;

    setIsSearching(true);
    setLeads([]);

    try {
      const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
      
      if (!webhookUrl) {
        throw new Error("Brak adresu webhooka (VITE_N8N_WEBHOOK_URL) w pliku .env");
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ industry, city }),
      });

      if (!response.ok) {
        throw new Error(`Błąd serwera: ${response.status}`);
      }

      // 1. Pobieramy surową odpowiedź
      const rawData = await response.json();
      console.log("SUROWA ODPOWIEDŹ Z N8N:", rawData);

      // 2. N8n często zwraca webhooki jako tablicę itemów (np. [ { output: "..." } ])
      const dataObject = Array.isArray(rawData) ? rawData[0] : rawData;

      // 3. Szukamy klucza "output" lub bierzemy cały obiekt
      let jsonContent = dataObject.output || dataObject;

      // 4. Jeśli n8n zwróciło JSON-a w formie tekstu (string), musimy go naprawić
      let parsedData = jsonContent;
      if (typeof jsonContent === 'string') {
        try {
          // Usuwamy na twardo ewentualne znaczniki markdown (```json i ```)
          const cleanedString = jsonContent
            .replace(/```json/gi, '')
            .replace(/```/g, '')
            .trim();
          
          parsedData = JSON.parse(cleanedString);
        } catch (e) {
          console.error("Nie udało się sparsować tekstu na obiekt JSON:", e);
        }
      }

      // 5. Wyciągamy tablicę 'leads'
      let fetchedLeads = [];
      if (parsedData && Array.isArray(parsedData.leads)) {
        fetchedLeads = parsedData.leads;
      } else if (Array.isArray(parsedData)) {
        fetchedLeads = parsedData;
      } else {
        console.error("Zrozumiany obiekt:", parsedData);
        throw new Error("W odpowiedzi nie znaleziono prawidłowej tablicy leadów.");
      }

      // 6. Mapujemy prawdziwe wyniki z n8n
      const realLeads: Lead[] = fetchedLeads.map((lead: any, index: number) => ({
        id: index + 1,
        name: lead.name || 'Nieznana firma',
        description: lead.description || 'Brak opisu',
        industry: lead.industry || industry,
        city: lead.city || city,
        email: lead.email || 'brak@email.pl',
        website: lead.website || 'brak-strony.pl',
        message: lead.message || 'Propozycja współpracy...',
        isBlurred: false,
      }));

      // 7. Generujemy "fejkowe" leady, żeby pokazać blur na frontendzie
      const fakeLeads: Lead[] = Array.from({ length: 5 }).map((_, i) => ({
        id: i + 4,
        name: 'Premium Lead',
        description: 'Zablokowany opis dla darmowego konta. Zaloguj się, aby odkryć.',
        industry,
        city,
        email: 'ukryty@email.com',
        website: 'ukryta-strona.pl',
        message: 'Zablokowana wiadomość wygenerowana przez AI...',
        isBlurred: true,
      }));

      // 8. Aktualizujemy stan (łączymy 3 prawdziwe z resztą zblurowanych)
      setLeads([...realLeads, ...fakeLeads]);

    } catch (error) {
      console.error("Błąd podczas pobierania leadów:", error);
      alert("Ups! Nie udało się przetworzyć danych. Sprawdź konsolę (F12) po szczegóły.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="relative bg-black overflow-hidden min-h-screen">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-50 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-7 bg-white rounded-md flex items-center justify-center">
              <Sparkles className="size-4 text-black fill-black" />
            </div>
            <span className="text-xl font-bold text-white">ZEC</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-sm text-gray-400 hover:text-white transition-colors">
              Pricing
            </a>
            <button className="text-sm px-4 py-2 bg-white text-black rounded-md hover:bg-gray-200 transition-all font-medium">
              Sign in
            </button>
          </div>
        </div>
      </header>

      {/* Background gradient */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20" />
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-600/30 rounded-full blur-[150px]"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl bg-purple-600/20"
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

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
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300 backdrop-blur-sm">
                <div className="size-2 bg-green-500 rounded-full animate-pulse" />
                3 free leads • No signup required
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight leading-[1.1]">
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
            {/* Glow effect */}
            <div className="absolute -inset-[1px] bg-gradient-to-r from-blue-500/50 via-purple-500/50 to-pink-500/50 rounded-2xl blur-sm opacity-50" />
            
            {/* Main container */}
            <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl">
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
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-transparent via-black/60 to-black/80 backdrop-blur-md">
                          <div className="text-center px-6 py-12 max-w-md">
                            <div className="mb-6">
                              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/10 border border-white/20 backdrop-blur-xl mb-4">
                                <div className="size-3 bg-purple-500 rounded-full animate-pulse" />
                                <span className="text-white font-medium">500+ więcej leadów gotowych</span>
                              </div>
                            </div>
                            
                            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                              Odblokuj pełną listę
                            </h3>
                            
                            <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                              Zdobądź dostęp do 500+ zweryfikowanych leadów z personalizowanymi wiadomościami AI
                            </p>

                            <button className="w-full px-8 py-4 rounded-xl text-lg font-semibold transition-all bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white hover:shadow-2xl hover:shadow-purple-500/50 hover:scale-105">
                              Upgrade do Premium
                            </button>

                            <p className="text-gray-400 text-sm mt-4">
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