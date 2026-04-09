import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Mail, Clock, CheckCircle2, Pause, Play, Trash2, 
  ChevronRight, ChevronLeft, Eye, Send, Calendar, Zap,
  X, Sparkles, Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// Definicja kampanii dopasowana do danych z bazy
interface Campaign {
  id: string | number;
  name: string;
  city: string;
  status: 'active' | 'paused';
  progress: number;
  sent: number;
  total: number;
  opened: number;
  replied: number;
  createdAt: string;
}

const mockLeadsForPreview = [
  { name: 'Jan Kowalski', company: 'Studio Architektoniczne Nowak', city: 'Warszawa' },
  { name: 'Anna Wiśniewska', company: 'BudMaster Deweloper', city: 'Kraków' },
  { name: 'Piotr Nowak', company: 'Creative Marketing', city: 'Wrocław' },
];

type Step = 'template' | 'preview' | 'schedule';

export function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Stany Modala (Twoja oryginalna logika)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>('template');
  const [previewIndex, setPreviewIndex] = useState(0);
  
  const [template, setTemplate] = useState({
    subject: '',
    body: `Cześć {{Imię}},

Zauważyłem, że {{Firma}} działa w branży {{Branża}} w {{Miasto}}. 

Chciałbym zaprezentować Ci nasze rozwiązanie, które pomogło firmom takim jak Wasza zwiększyć efektywność o 40%.

Masz 15 minut na szybką rozmowę w tym tygodniu?

Pozdrawiam,
Jan Kowalski`,
    useAiIcebreaker: true,
  });

  const [schedule, setSchedule] = useState({
    emailAccount: 'jan@firma.pl',
    days: ['mon', 'tue', 'wed', 'thu', 'fri'],
    startHour: '09:00',
    endHour: '17:00',
    timezone: 'Europe/Warsaw',
    dailyLimit: 40,
  });

  // SILNIK DANYCH: Synchronizacja z landingiem + Pobieranie kampanii
  useEffect(() => {
    async function syncAndFetch() {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsLoading(false);
        return;
      }

      // 1. MECHANIZM LAZY REGISTRATION (Transfer danych z Landingu)
      const tempLeads = localStorage.getItem('zec_temp_leads');
      const tempQuery = localStorage.getItem('zec_temp_query');

      if (tempLeads && tempQuery) {
        try {
          const userCreatedAt = new Date(session.user.created_at).getTime();
          const accountAgeInMinutes = (Date.now() - userCreatedAt) / (1000 * 60);

          // Jeśli konto jest świeże (nowy użytkownik), dodajemy leady jako kampanię
          if (accountAgeInMinutes < 5) {
            const parsedLeads = JSON.parse(tempLeads);
            const parsedQuery = JSON.parse(tempQuery);

            await supabase.from('saved_searches').insert({
              user_id: session.user.id,
              industry: parsedQuery.industry,
              city: parsedQuery.city,
              leads_data: parsedLeads
            });
          }
        } catch (err) {
          console.error("Błąd transferu danych:", err);
        } finally {
          // Zawsze czyścimy localStorage, żeby nie dublować akcji
          localStorage.removeItem('zec_temp_leads');
          localStorage.removeItem('zec_temp_query');
        }
      }

      // 2. POBIERANIE REALNYCH KAMPANII Z BAZY
      const { data: searchesData, error } = await supabase
        .from('saved_searches')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Błąd pobierania kampanii:", error);
      } else if (searchesData) {
        const formattedCampaigns: Campaign[] = searchesData.map(item => ({
          id: item.id,
          name: item.industry, // Używamy branży jako nazwy kampanii
          city: item.city,
          status: 'active',
          progress: 0, // Nowe kampanie startują od 0%
          sent: 0,
          total: Array.isArray(item.leads_data) ? item.leads_data.length : 0,
          opened: 0,
          replied: 0,
          createdAt: item.created_at,
        }));
        setCampaigns(formattedCampaigns);
      }
      setIsLoading(false);
    }

    syncAndFetch();
  }, []);

  const steps: { id: Step; label: string; icon: any }[] = [
    { id: 'template', label: 'Szablon i AI', icon: Sparkles },
    { id: 'preview', label: 'Podgląd', icon: Eye },
    { id: 'schedule', label: 'Harmonogram', icon: Calendar },
  ];

  const insertVariable = (variable: string) => {
    setTemplate({
      ...template,
      body: template.body + `{{${variable}}}`
    });
  };

  const generatePreview = () => {
    const lead = mockLeadsForPreview[previewIndex] || mockLeadsForPreview[0];
    let preview = template.body
      .replace('{{Imię}}', lead.name.split(' ')[0])
      .replace('{{Firma}}', lead.company)
      .replace('{{Branża}}', 'architektura')
      .replace('{{Miasto}}', lead.city);

    if (template.useAiIcebreaker) {
      preview = `Widziałem, że niedawno realizowaliście projekt w centrum ${lead.city} - gratulacje!\n\n` + preview;
    }

    return preview;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-400">
        <Loader2 className="size-8 animate-spin mb-4" />
        <p>Synchronizacja Twoich kampanii...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Kampanie
          </h1>
          <p className="text-gray-400">
            Zarządzaj swoimi kampaniami mailowymi
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-white hover:bg-gray-100 text-black font-semibold rounded-lg transition-all flex items-center gap-2"
        >
          <Plus className="size-5" />
          Nowa kampania
        </button>
      </div>

      {/* Dynamiczne Statystyki */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Aktywne kampanie', value: campaigns.length, icon: Play, color: 'emerald' },
          { label: 'Wysłane e-maile', value: '0', icon: Mail, color: 'blue' },
          { label: 'Otwarte', value: '0', icon: Eye, color: 'yellow' },
          { label: 'Odpowiedzi', value: '0', icon: CheckCircle2, color: 'green' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6"
          >
            <div className={`size-10 bg-${stat.color}-500/10 rounded-lg flex items-center justify-center mb-4`}>
              <stat.icon className={`size-5 text-${stat.color}-400`} />
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {stat.value}
            </div>
            <div className="text-sm text-gray-400">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Campaigns List (Realne Dane) */}
      <div className="space-y-4">
        {campaigns.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
            <p className="text-gray-500 mb-4 text-lg">Brak aktywnych kampanii.</p>
            <p className="text-gray-600 text-sm italic">Wyszukaj firmy na stronie głównej, aby odblokować leady i stworzyć swoją pierwszą kampanię.</p>
          </div>
        ) : (
          campaigns.map((campaign, index) => (
            <motion.div
              key={campaign.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 hover:border-white/20 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <h3 className="text-xl font-bold text-white lowercase first-letter:uppercase">
                    {campaign.name}
                  </h3>
                  <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold bg-white/5 px-2 py-1 rounded">
                    {campaign.city}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400">
                    Aktywna
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-white/10 rounded-lg transition-all text-gray-400 hover:text-white">
                    <Pause className="size-5" />
                  </button>
                  <button className="p-2 hover:bg-white/10 rounded-lg transition-all text-gray-400 hover:text-red-400">
                    <Trash2 className="size-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-6 mb-4">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Leady</div>
                  <div className="text-2xl font-bold text-white">
                    {campaign.total}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Wysłano</div>
                  <div className="text-2xl font-bold text-white">
                    {campaign.sent}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Otwarte</div>
                  <div className="text-2xl font-bold text-white">
                    0%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Utworzono</div>
                  <div className="text-sm font-medium text-white">
                    {new Date(campaign.createdAt).toLocaleDateString('pl-PL')}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-white to-gray-400 rounded-full"
                  style={{ width: '0%' }}
                />
              </div>
              <div className="mt-2 text-xs text-gray-400">
                Oczekiwanie na rozpoczęcie wysyłki
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Create Campaign Modal (Twoja Pełna Logika) */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1a1a1a] rounded-2xl border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Nowa kampania</h2>
                  <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-white/10 rounded-lg transition-all text-gray-400 hover:text-white">
                    <X className="size-5" />
                  </button>
                </div>

                {/* Steps */}
                <div className="flex items-center gap-4">
                  {steps.map((step, index) => (
                    <div key={step.id} className="flex items-center gap-4 flex-1">
                      <button
                        onClick={() => setCurrentStep(step.id)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all flex-1 ${
                          currentStep === step.id ? 'bg-white/10 border border-white/20' : 'bg-white/5 border border-white/10'
                        }`}
                      >
                        <div className={`size-8 rounded-lg flex items-center justify-center ${currentStep === step.id ? 'bg-white text-black' : 'bg-white/10 text-gray-400'}`}>
                          <step.icon className="size-4" />
                        </div>
                        <span className={`text-sm font-medium ${currentStep === step.id ? 'text-white' : 'text-gray-400'}`}>{step.label}</span>
                      </button>
                      {index < steps.length - 1 && <ChevronRight className="size-5 text-gray-600" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {currentStep === 'template' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Temat wiadomości</label>
                      <input type="text" value={template.subject} onChange={(e) => setTemplate({ ...template, subject: e.target.value })} placeholder="np. Współpraca z {{Firma}}" className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-400">Treść wiadomości</label>
                        <div className="flex items-center gap-2">
                          {['Imię', 'Firma', 'Miasto', 'Branża'].map((variable) => (
                            <button key={variable} onClick={() => insertVariable(variable)} className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white text-xs rounded">{variable}</button>
                          ))}
                        </div>
                      </div>
                      <textarea value={template.body} onChange={(e) => setTemplate({ ...template, body: e.target.value })} rows={10} className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-white/30" />
                    </div>
                    <label className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-lg cursor-pointer">
                      <input type="checkbox" checked={template.useAiIcebreaker} onChange={(e) => setTemplate({ ...template, useAiIcebreaker: e.target.checked })} className="size-5 rounded bg-white/10" />
                      <div>
                        <div className="text-white font-medium mb-1 flex items-center gap-2"><Sparkles className="size-4" /> AI Icebreaker</div>
                        <div className="text-xs text-gray-400">Unikalne otwarcie wiadomości wygenerowane dla każdego leada</div>
                      </div>
                    </label>
                  </div>
                )}

                {currentStep === 'preview' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-400">Podgląd dla: <span className="text-white font-medium">{mockLeadsForPreview[previewIndex].company}</span></div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setPreviewIndex(Math.max(0, previewIndex - 1))} disabled={previewIndex === 0} className="p-2 bg-white/10 rounded-lg disabled:opacity-50"><ChevronLeft className="size-5" /></button>
                        <span className="text-sm text-gray-400">{previewIndex + 1} / {mockLeadsForPreview.length}</span>
                        <button onClick={() => setPreviewIndex(Math.min(mockLeadsForPreview.length - 1, previewIndex + 1))} disabled={previewIndex === mockLeadsForPreview.length - 1} className="p-2 bg-white/10 rounded-lg disabled:opacity-50"><ChevronRight className="size-5" /></button>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-6 border border-gray-200">
                      <div className="border-b border-gray-200 pb-4 mb-4 font-semibold text-black">Temat: {template.subject.replace('{{Firma}}', mockLeadsForPreview[previewIndex].company) || "Brak tematu"}</div>
                      <div className="whitespace-pre-wrap text-gray-800 leading-relaxed text-sm">{generatePreview()}</div>
                    </div>
                  </div>
                )}

                {currentStep === 'schedule' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Skrzynka wysyłająca</label>
                      <select value={schedule.emailAccount} onChange={(e) => setSchedule({ ...schedule, emailAccount: e.target.value })} className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-white outline-none">
                        <option value="jan@firma.pl">jan@firma.pl</option>
                        <option value="kontakt@firma.pl">kontakt@firma.pl</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Godzina rozpoczęcia</label>
                        <input type="time" value={schedule.startHour} onChange={(e) => setSchedule({ ...schedule, startHour: e.target.value })} className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-white outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Godzina zakończenia</label>
                        <input type="time" value={schedule.endHour} onChange={(e) => setSchedule({ ...schedule, endHour: e.target.value })} className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-white outline-none" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-white/10 flex justify-between">
                <button
                  onClick={() => { const stepIndex = steps.findIndex(s => s.id === currentStep); if (stepIndex > 0) setCurrentStep(steps[stepIndex - 1].id); }}
                  disabled={currentStep === 'template'}
                  className="px-6 py-3 bg-white/10 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
                >
                  <ChevronLeft className="size-5" /> Wstecz
                </button>

                {currentStep === 'schedule' ? (
                  <button onClick={() => setShowCreateModal(false)} className="px-8 py-3 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600 flex items-center gap-2">
                    <Send className="size-5" /> Rozpocznij kampanię
                  </button>
                ) : (
                  <button
                    onClick={() => { const stepIndex = steps.findIndex(s => s.id === currentStep); if (stepIndex < steps.length - 1) setCurrentStep(steps[stepIndex + 1].id); }}
                    className="px-6 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 flex items-center gap-2"
                  >
                    Dalej <ChevronRight className="size-5" />
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}