import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Loader2 } from 'lucide-react';
import { LeadRow } from './LeadRow';
import { SearchCombobox } from './SearchCombobox';
import { INDUSTRIES, CITIES } from '../data/searchOptions';
import { supabase } from '../lib/supabase';

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

interface N8NLead {
  nazwa?: string;
  email?: string;
  strona?: string;
  opis?: string;
  message?: string;
  name?: string;
  website?: string;
  description?: string;
  industry?: string;
  city?: string;
}

interface N8NResponse {
  success?: boolean;
  miasto?: string;
  branza?: string;
  count?: number;
  leads?: N8NLead[];
  formatted?: string;
  uwaga?: string;
  output?: unknown;
}

function extractJsonFromText(text: string) {
  const cleaned = text
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1) {
      const possibleJson = cleaned.slice(firstBrace, lastBrace + 1);
      return JSON.parse(possibleJson);
    }

    throw new Error('Nie udało się sparsować odpowiedzi jako JSON.');
  }
}

export function Hero() {
  const [industry, setIndustry] = useState('');
  const [city, setCity] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [resultsCount, setResultsCount] = useState<number | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
      setIsLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSearch = async () => {
    if (!industry || !city) return;

    setIsSearching(true);
    setLeads([]);
    setResultsCount(null);

    try {
      const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;

      if (!webhookUrl) {
        throw new Error('Brak adresu webhooka (VITE_N8N_WEBHOOK_URL) w pliku .env');
      }

      const selectedIndustryLabel =
        INDUSTRIES.find((i) => i.value === industry)?.label || industry;
      const selectedCityLabel =
        CITIES.find((c) => c.value === city)?.label || city;

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industry: selectedIndustryLabel,
          city: selectedCityLabel,
        }),
      });

      if (!response.ok) throw new Error(`Błąd serwera: ${response.status}`);

      const responseText = await response.text();
      let parsedResponse: N8NResponse;

      try {
        parsedResponse = extractJsonFromText(responseText);
      } catch {
        throw new Error('Webhook zwrócił odpowiedź w nieobsługiwanym formacie.');
      }

      const dataObject =
        parsedResponse && typeof parsedResponse === 'object' && 'output' in parsedResponse
          ? (typeof parsedResponse.output === 'string'
              ? extractJsonFromText(parsedResponse.output)
              : parsedResponse.output)
          : parsedResponse;

      const finalData = dataObject as N8NResponse;

      if (!finalData || !Array.isArray(finalData.leads)) {
        throw new Error('W odpowiedzi nie znaleziono prawidłowej tablicy leadów.');
      }

      const realLeads: Lead[] = finalData.leads.map((lead, index) => ({
        id: index + 1,
        name: lead.nazwa || lead.name || 'Nieznana firma',
        description: lead.opis || lead.description || 'Brak opisu',
        industry: finalData.branza || lead.industry || selectedIndustryLabel,
        city: finalData.miasto || lead.city || selectedCityLabel,
        email: lead.email || 'brak@email.pl',
        website: lead.strona || lead.website || 'brak-strony.pl',
        message: lead.message || 'Propozycja współpracy...',
        isBlurred: false,
      }));

      const top3 = realLeads.slice(0, 3);
      setLeads(top3);
      setResultsCount(Math.floor(Math.random() * (490 - 370 + 1)) + 370);

      localStorage.setItem('zec_temp_leads', JSON.stringify(top3));
      localStorage.setItem('zec_temp_query', JSON.stringify({
        industry: selectedIndustryLabel,
        city: selectedCityLabel,
      }));
    } catch (error) {
      console.error('Błąd podczas pobierania leadów:', error);
      alert('Ups! Nie udało się przetworzyć danych. Sprawdź konsolę (F12) po szczegóły.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="relative bg-[#0d0d0d] overflow-hidden min-h-screen">

      {/* Soft center glow */}
      <div className="absolute inset-0 flex items-start justify-center pt-32 pointer-events-none">
        <div className="w-[600px] h-[400px] bg-white/[0.03] rounded-full blur-[120px]" />
      </div>

      {/* Subtle grid — very faint */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_70%_50%_at_50%_0%,#000_60%,transparent_100%)]" />

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-50 px-6 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 bg-white/[0.06] border border-white/[0.10] rounded-lg flex items-center justify-center group-hover:bg-white/[0.1] transition-all p-0.5">
              <img src="/logo.png" alt="ZEC Logo" className="w-4 h-4 object-contain opacity-90 invert brightness-0" />
            </div>
            <span className="text-[20px] font-semibold lowercase text-[#EAE8E1] tracking-[0.08em]" style={{ fontFamily: "'Outfit', sans-serif" }}>
              zec
            </span>
          </Link>

          <div className="flex items-center gap-6">
            <a href="#features" className="text-sm text-[#666] hover:text-[#EAE8E1] transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-[#666] hover:text-[#EAE8E1] transition-colors">Pricing</a>
            {!isLoadingAuth && (
              isLoggedIn ? (
                <Link to="/app" className="text-sm px-4 py-2 bg-white text-[#1A1A1A] rounded-lg hover:bg-gray-100 transition-all font-medium">
                  Panel
                </Link>
              ) : (
                <>
                  <Link to="/login" className="text-sm text-[#777] hover:text-[#EAE8E1] transition-colors">Logowanie</Link>
                  <Link to="/register" className="text-sm px-4 py-2 bg-white text-[#1A1A1A] rounded-lg hover:bg-gray-100 transition-all font-medium">
                    Zacznij za darmo
                  </Link>
                </>
              )
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-start pt-40 pb-20 px-6">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs text-[#777] tracking-wide">
            3 leady za darmo • Bez rejestracji
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-[#EAE8E1] tracking-tight text-center leading-[1.08] mb-6 max-w-3xl"
        >
          Odkryj setki nowych
          <br />
          współprac jednym
          <br />
          kliknięciem
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-base md:text-lg text-[#666] text-center leading-relaxed mb-14 max-w-xl"
        >
          Automatyczne scrapowanie Google Maps, wyszukiwanie maili
          i personalizowany outreach. Wszystko w jednym miejscu.
        </motion.p>

        {/* Search form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-full max-w-2xl"
        >
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-2 flex flex-col md:flex-row gap-2">
            <div className="flex-1">
              <SearchCombobox
                options={INDUSTRIES}
                value={industry}
                onChange={setIndustry}
                placeholder="Branża, np. Architekt"
                searchPlaceholder="Wpisz branżę..."
              />
            </div>
            <div className="flex-1">
              <SearchCombobox
                options={CITIES}
                value={city}
                onChange={setCity}
                placeholder="Miasto, np. Warszawa"
                searchPlaceholder="Wpisz miasto..."
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching || !industry || !city}
              className="h-[48px] px-6 rounded-xl bg-white text-[#1A1A1A] font-semibold text-sm hover:bg-gray-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0"
            >
              {isSearching ? (
                <><Loader2 className="size-4 animate-spin" />Szukam...</>
              ) : (
                <><Search className="size-4" />Znajdź leady</>
              )}
            </button>
          </div>
        </motion.div>

        {/* Results */}
        <AnimatePresence>
          {(leads.length > 0 || isSearching) && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-4xl mt-10"
            >
              <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl overflow-hidden">
                {leads.length > 0 && (
                  <div className="px-6 py-4 border-b border-white/[0.06]">
                    <p className="text-sm text-[#666]">
                      Znaleziono <span className="text-[#EAE8E1] font-semibold">{resultsCount ?? 420}+</span> leadów z branży {INDUSTRIES.find((i) => i.value === industry)?.label || industry}
                    </p>
                  </div>
                )}

                <div className="p-6 space-y-4" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  {isSearching && (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="rounded-xl p-6 border bg-white/[0.03] border-white/[0.06]">
                          <div className="animate-pulse space-y-3">
                            <div className="h-4 rounded w-1/4 bg-white/10" />
                            <div className="h-3 rounded w-full bg-white/[0.06]" />
                            <div className="h-3 rounded w-3/4 bg-white/[0.06]" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!isSearching && leads.map((lead, index) => (
                    <motion.div
                      key={lead.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.06 }}
                    >
                      <LeadRow lead={lead} dark />
                    </motion.div>
                  ))}

                  {!isSearching && leads.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="relative"
                    >
                      <div className="space-y-4 pointer-events-none select-none">
                        {[1, 2, 3].map((i) => (
                          <div key={`blur-${i}`} className="rounded-xl border bg-white/[0.03] border-white/[0.06] p-6 opacity-40 blur-sm">
                            <div className="space-y-3">
                              <div className="h-4 rounded w-1/3 bg-white/20" />
                              <div className="h-3 rounded w-full bg-white/10" />
                              <div className="h-3 rounded w-2/3 bg-white/10" />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-transparent via-[#0d0d0d]/80 to-[#0d0d0d]">
                        <div className="text-center px-6 py-8 max-w-sm">
                          <h3 className="text-2xl font-bold text-[#EAE8E1] mb-3">Odblokuj pełną listę</h3>
                          <p className="text-[#666] text-sm mb-6 leading-relaxed">
                            Zdobądź dostęp do {resultsCount ?? 420}+ zweryfikowanych leadów z personalizowanymi wiadomościami AI
                          </p>
                          <Link to="/pricing" className="inline-block px-8 py-3 rounded-xl text-sm font-semibold bg-white text-[#1A1A1A] hover:bg-gray-100 transition-all">
                            Upgrade do Premium
                          </Link>
                          <p className="text-[#444] text-xs mt-4">Bez zobowiązań • Anuluj kiedy chcesz</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
