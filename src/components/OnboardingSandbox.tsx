import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight, Search, Check, Loader2, BookmarkPlus, ChevronDown, Mail
} from 'lucide-react';
import { useOnboarding } from '../contexts/OnboardingContext';

type SandboxStep = 1 | 2 | 3 | 4 | 5;

const MOCK_LEADS = [
  { id: 1, company: 'Studio Interio', city: 'Warszawa', category: 'Architektura wnętrz' },
  { id: 2, company: 'Smaczna Chatka', city: 'Kraków', category: 'Restauracja' },
  { id: 3, company: 'BuildPro', city: 'Gdańsk', category: 'Budownictwo' },
];

const MOCK_EMAIL = {
  subject: 'Szybkie pytanie — Studio Interio',
  body: `Cześć,\n\nZauważyłem, że Studio Interio specjalizuje się w projektach premium — robota naprawdę robi wrażenie.\n\nPomagam firmom z branży wnętrzarskiej automatyzować pozyskiwanie klientów B2B. Skracamy czas od leada do rozmowy z 3 tygodni do 3 dni.\n\nCzy to temat, o którym warto porozmawiać?\n\nPozdrawiam,\nJan`,
};

interface OnboardingSandboxProps {
  onComplete: () => Promise<void>;
}

export function OnboardingSandbox({ onComplete }: OnboardingSandboxProps) {
  const { setSandboxStep } = useOnboarding();
  const [step, setStep] = useState<SandboxStep>(1);

  const [isSearching, setIsSearching] = useState(false);
  const [leadsVisible, setLeadsVisible] = useState(false);
  const [savedId, setSavedId] = useState<number | null>(null);

  const [selectedMailbox, setSelectedMailbox] = useState('system@zec.app');
  const [promptAngle, setPromptAngle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [emailReady, setEmailReady] = useState(false);

  const [isCompleting, setIsCompleting] = useState(false);

  const advance = (s: SandboxStep) => {
    setStep(s);
    setSandboxStep(s);
  };

  const handleSearch = async () => {
    setIsSearching(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsSearching(false);
    setLeadsVisible(true);
  };

  const handleSave = (id: number) => {
    setSavedId(id);
    setTimeout(() => advance(3), 900);
  };

  const handleGenerate = async () => {
    if (!promptAngle.trim()) return;
    setIsGenerating(true);
    await new Promise(r => setTimeout(r, 2000));
    setIsGenerating(false);
    setEmailReady(true);
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    await onComplete();
  };

  const STEP_LABELS = ['Witaj', 'Leady', 'Kampania', 'Generuj', 'Gotowe'];

  return (
    <div className="fixed inset-0 z-[45] flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      <div className="relative z-10 w-full max-w-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.985 }}
            transition={{ duration: 0.22 }}
            className="bg-[#0f0f0f] border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="px-8 py-5 border-b border-white/[0.06] flex items-center justify-between">
              <p className="text-[13px] text-[#827E78]">
                Szybka konfiguracja · <span className="text-[#A3A09A]">krok {step}/5</span>
              </p>
              <div className="flex items-center gap-1.5">
                {STEP_LABELS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      i + 1 < step ? 'w-6 bg-[#EAE8E1]' :
                      i + 1 === step ? 'w-8 bg-[#EAE8E1]' :
                      'w-6 bg-white/[0.1]'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="p-8">

              {/* ─── STEP 1: Witaj ─── */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-[26px] font-serif text-[#EAE8E1] tracking-tight mb-2">Witaj w ZEC.</h2>
                    <p className="text-[15px] text-[#A3A09A] leading-relaxed">
                      W ciągu 2 minut zobaczysz, jak ZEC znajduje dla Ciebie klientów i pisze do nich spersonalizowane maile — bez żadnej ręcznej pracy.
                    </p>
                  </div>

                  <div className="aspect-video bg-white/[0.03] border border-white/[0.06] rounded-2xl flex flex-col items-center justify-center gap-3">
                    <div className="size-12 rounded-2xl bg-white/[0.05] border border-white/[0.06] flex items-center justify-center">
                      <Search className="size-6 text-[#827E78]" />
                    </div>
                    <p className="text-[13px] text-[#3a3a3a]">GIF: Kursor szukający leadów</p>
                  </div>

                  <button
                    onClick={() => advance(2)}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#EAE8E1] hover:bg-white text-[#0a0a0a] text-[14px] font-semibold rounded-xl transition-all"
                  >
                    Zaczynamy <ArrowRight className="size-4" />
                  </button>
                </div>
              )}

              {/* ─── STEP 2: Mini wyszukiwarka ─── */}
              {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-[22px] font-serif text-[#EAE8E1] tracking-tight mb-1">
                      Znajdź swoje pierwsze leady
                    </h2>
                    <p className="text-[14px] text-[#A3A09A]">
                      Wpisz branżę i miasto — ZEC zeskanuje sieć w poszukiwaniu idealnych firm.
                    </p>
                  </div>

                  <div className="flex gap-2.5">
                    <input
                      type="text"
                      defaultValue="Agencje marketingowe"
                      readOnly
                      className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-[14px] text-[#EAE8E1] cursor-default"
                    />
                    <input
                      type="text"
                      defaultValue="Warszawa"
                      readOnly
                      className="w-32 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-[14px] text-[#EAE8E1] cursor-default"
                    />
                    <button
                      onClick={handleSearch}
                      disabled={isSearching || leadsVisible}
                      className="flex items-center gap-2 px-5 py-3 bg-[#EAE8E1] hover:bg-white text-[#0a0a0a] text-[13px] font-semibold rounded-xl transition-all disabled:opacity-60"
                    >
                      {isSearching
                        ? <Loader2 className="size-4 animate-spin" />
                        : <Search className="size-4" />
                      }
                      {isSearching ? 'Szukam...' : 'Szukaj'}
                    </button>
                  </div>

                  <AnimatePresence>
                    {leadsVisible && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2.5"
                      >
                        <p className="text-[12px] text-[#827E78]">
                          Znaleziono 3 firmy — kliknij <span className="text-[#A3A09A] font-medium">Zapisz</span> przy jednej z nich, żeby przejść dalej.
                        </p>
                        {MOCK_LEADS.map(lead => (
                          <div key={lead.id} className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                            <div>
                              <p className="text-[14px] font-medium text-[#EAE8E1]">{lead.company}</p>
                              <p className="text-[12px] text-[#827E78] mt-0.5">{lead.city} · {lead.category}</p>
                            </div>
                            {savedId === lead.id ? (
                              <div className="flex items-center gap-1.5 text-[#5d9970] text-[12px] font-medium">
                                <Check className="size-3.5" strokeWidth={3} /> Zapisano!
                              </div>
                            ) : (
                              <button
                                onClick={() => handleSave(lead.id)}
                                disabled={savedId !== null}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-[#EAE8E1] text-[12px] font-medium rounded-lg transition-all disabled:opacity-30"
                              >
                                <BookmarkPlus className="size-3.5" /> Zapisz
                              </button>
                            )}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* ─── STEP 3: Intro do kampanii ─── */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-[22px] font-serif text-[#EAE8E1] tracking-tight mb-1">Teraz: kampania AI</h2>
                    <p className="text-[15px] text-[#A3A09A] leading-relaxed">
                      ZEC przejrzy stronę firmy, social media i na podstawie Twojego{' '}
                      <span className="text-[#EAE8E1]">angle'u</span> napisze spersonalizowanego maila —
                      jakbyś robił to ręcznie, ale 100× szybciej.
                    </p>
                  </div>

                  <div className="aspect-video bg-white/[0.03] border border-white/[0.06] rounded-2xl flex flex-col items-center justify-center gap-3">
                    <div className="size-12 rounded-2xl bg-white/[0.05] border border-white/[0.06] flex items-center justify-center">
                      <Mail className="size-6 text-[#827E78]" />
                    </div>
                    <p className="text-[13px] text-[#3a3a3a]">GIF: Tworzenie i akceptacja kampanii AI</p>
                  </div>

                  <button
                    onClick={() => advance(4)}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#EAE8E1] hover:bg-white text-[#0a0a0a] text-[14px] font-semibold rounded-xl transition-all"
                  >
                    Skonfiguruj kampanię <ArrowRight className="size-4" />
                  </button>
                </div>
              )}

              {/* ─── STEP 4: Mini kreator + Tinder ─── */}
              {step === 4 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-[22px] font-serif text-[#EAE8E1] tracking-tight mb-1">
                      Stwórz swoją pierwszą kampanię
                    </h2>
                    <p className="text-[14px] text-[#A3A09A]">
                      Wybierz skrzynkę, opisz swój angle i kliknij Generuj.
                    </p>
                  </div>

                  {!emailReady ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-[11px] font-medium text-[#827E78] uppercase tracking-wider mb-2">Skrzynka nadawcza</p>
                        <div className="relative">
                          <select
                            value={selectedMailbox}
                            onChange={e => setSelectedMailbox(e.target.value)}
                            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-[14px] text-[#EAE8E1] outline-none appearance-none cursor-pointer"
                          >
                            <option value="system@zec.app" className="bg-[#1A1A1A]">system@zec.app (systemowa skrzynka ZEC)</option>
                            <option value="własna" className="bg-[#1A1A1A]">Podłącz własną skrzynkę →</option>
                          </select>
                          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-[#827E78] pointer-events-none" />
                        </div>
                      </div>

                      <div>
                        <p className="text-[11px] font-medium text-[#827E78] uppercase tracking-wider mb-2">Twój angle (co oferujesz?)</p>
                        <textarea
                          value={promptAngle}
                          onChange={e => setPromptAngle(e.target.value)}
                          placeholder="np. Pomagam agencjom marketingowym automatyzować pozyskiwanie klientów B2B. Główna korzyść: skrócenie cyklu sprzedaży z 3 tygodni do 3 dni."
                          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3.5 text-[14px] text-[#EAE8E1] placeholder:text-[#3a3a3a] resize-none outline-none focus:border-white/[0.2] transition-all leading-relaxed"
                          rows={4}
                        />
                      </div>

                      <button
                        onClick={handleGenerate}
                        disabled={isGenerating || !promptAngle.trim()}
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#EAE8E1] hover:bg-white text-[#0a0a0a] text-[14px] font-semibold rounded-xl transition-all disabled:opacity-40"
                      >
                        {isGenerating
                          ? <><Loader2 className="size-4 animate-spin" /> AI pisze maila...</>
                          : <>Generuj <ArrowRight className="size-4" /></>
                        }
                      </button>
                    </div>
                  ) : (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                      <p className="text-[12px] text-[#827E78]">
                        AI wygenerowało wiadomość. Zaakceptuj ją, żeby wysłać.
                      </p>

                      {/* Email preview */}
                      <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
                        <div className="px-6 py-4 border-b border-gray-100">
                          <p className="text-[11px] text-gray-400 mb-1.5">{selectedMailbox} → Studio Interio</p>
                          <p className="text-[16px] font-semibold text-gray-900">{MOCK_EMAIL.subject}</p>
                        </div>
                        <div className="px-6 py-4 max-h-[80vh] overflow-y-auto overscroll-contain">
                          <p className="text-[13px] text-gray-700 leading-[1.8] whitespace-pre-wrap font-serif">{MOCK_EMAIL.body}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => advance(5)}
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#5d9970] hover:bg-[#6aaa7d] text-white text-[14px] font-semibold rounded-xl transition-all"
                      >
                        <Check className="size-4" strokeWidth={3} /> Akceptuj i wyślij
                      </button>
                    </motion.div>
                  )}
                </div>
              )}

              {/* ─── STEP 5: Finał ─── */}
              {step === 5 && (
                <div className="space-y-6 text-center py-4">
                  <div className="size-16 bg-[#5d9970]/10 border border-[#5d9970]/20 rounded-full flex items-center justify-center mx-auto">
                    <Check className="size-8 text-[#5d9970]" strokeWidth={2.5} />
                  </div>

                  <div>
                    <h2 className="text-[28px] font-serif text-[#EAE8E1] tracking-tight mb-2">To działa.</h2>
                    <p className="text-[15px] text-[#A3A09A] leading-relaxed max-w-sm mx-auto">
                      Twoja pierwsza kampania trafiła do kolejki. Odkryj pełną moc ZEC — bez żadnych ograniczeń.
                    </p>
                  </div>

                  <button
                    onClick={handleComplete}
                    disabled={isCompleting}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#EAE8E1] hover:bg-white text-[#0a0a0a] text-[14px] font-semibold rounded-xl transition-all disabled:opacity-60"
                  >
                    {isCompleting
                      ? <Loader2 className="size-4 animate-spin" />
                      : <>Przejdź do aplikacji <ArrowRight className="size-4" /></>
                    }
                  </button>
                </div>
              )}

            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
