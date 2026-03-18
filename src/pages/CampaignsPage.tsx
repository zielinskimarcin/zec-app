import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Mail, Clock, CheckCircle2, Pause, Play, Trash2, 
  ChevronRight, ChevronLeft, Eye, Send, Calendar, Zap,
  X, Sparkles
} from 'lucide-react';

// Mock campaigns data
const mockCampaigns = [
  {
    id: 1,
    name: 'Architekci Warszawa',
    status: 'active',
    progress: 65,
    sent: 195,
    total: 300,
    opened: 84,
    replied: 24,
    createdAt: '2026-03-15',
  },
  {
    id: 2,
    name: 'Deweloperzy Kraków',
    status: 'active',
    progress: 42,
    sent: 84,
    total: 200,
    opened: 35,
    replied: 11,
    createdAt: '2026-03-14',
  },
  {
    id: 3,
    name: 'Marketing Agencies',
    status: 'paused',
    progress: 30,
    sent: 45,
    total: 150,
    opened: 18,
    replied: 7,
    createdAt: '2026-03-10',
  },
];

const mockLeadsForPreview = [
  { name: 'Jan Kowalski', company: 'Studio Architektoniczne Nowak', city: 'Warszawa' },
  { name: 'Anna Wiśniewska', company: 'BudMaster Deweloper', city: 'Kraków' },
  { name: 'Piotr Nowak', company: 'Creative Marketing', city: 'Wrocław' },
];

type Step = 'template' | 'preview' | 'schedule';

export function CampaignsPage() {
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
    const lead = mockLeadsForPreview[previewIndex];
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Aktywne kampanie', value: '2', icon: Play, color: 'emerald' },
          { label: 'Wysłane e-maile', value: '324', icon: Mail, color: 'blue' },
          { label: 'Otwarte', value: '137', icon: Eye, color: 'yellow' },
          { label: 'Odpowiedzi', value: '42', icon: CheckCircle2, color: 'green' },
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

      {/* Campaigns List */}
      <div className="space-y-4">
        {mockCampaigns.map((campaign, index) => (
          <motion.div
            key={campaign.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 hover:border-white/20 transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <h3 className="text-xl font-bold text-white">
                  {campaign.name}
                </h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  campaign.status === 'active'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-yellow-500/10 text-yellow-400'
                }`}>
                  {campaign.status === 'active' ? 'Aktywna' : 'Wstrzymana'}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-white/10 rounded-lg transition-all text-gray-400 hover:text-white">
                  {campaign.status === 'active' ? (
                    <Pause className="size-5" />
                  ) : (
                    <Play className="size-5" />
                  )}
                </button>
                <button className="p-2 hover:bg-white/10 rounded-lg transition-all text-gray-400 hover:text-red-400">
                  <Trash2 className="size-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-6 mb-4">
              <div>
                <div className="text-sm text-gray-400 mb-1">Wysłano</div>
                <div className="text-2xl font-bold text-white">
                  {campaign.sent}/{campaign.total}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Otwarte</div>
                <div className="text-2xl font-bold text-white">
                  {campaign.opened}
                  <span className="text-sm text-gray-400 ml-2">
                    {Math.round((campaign.opened / campaign.sent) * 100)}%
                  </span>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Odpowiedzi</div>
                <div className="text-2xl font-bold text-emerald-400">
                  {campaign.replied}
                  <span className="text-sm text-gray-400 ml-2">
                    {Math.round((campaign.replied / campaign.sent) * 100)}%
                  </span>
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
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${campaign.progress}%` }}
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-white to-gray-400 rounded-full"
              />
            </div>
            <div className="mt-2 text-xs text-gray-400">
              {campaign.progress}% ukończone
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create Campaign Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1a1a1a] rounded-2xl border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">
                    Nowa kampania
                  </h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-all text-gray-400 hover:text-white"
                  >
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
                          currentStep === step.id
                            ? 'bg-white/10 border border-white/20'
                            : 'bg-white/5 border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div className={`size-8 rounded-lg flex items-center justify-center ${
                          currentStep === step.id
                            ? 'bg-white text-black'
                            : 'bg-white/10 text-gray-400'
                        }`}>
                          <step.icon className="size-4" />
                        </div>
                        <span className={`text-sm font-medium ${
                          currentStep === step.id ? 'text-white' : 'text-gray-400'
                        }`}>
                          {step.label}
                        </span>
                      </button>
                      {index < steps.length - 1 && (
                        <ChevronRight className="size-5 text-gray-600 flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Step 1: Template */}
                {currentStep === 'template' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Temat wiadomości
                      </label>
                      <input
                        type="text"
                        value={template.subject}
                        onChange={(e) => setTemplate({ ...template, subject: e.target.value })}
                        placeholder="np. Współpraca z {{Firma}}"
                        className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-gray-500 focus:border-white/20 focus:outline-none"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-400">
                          Treść wiadomości
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-400">Zmienne:</span>
                          {['Imię', 'Firma', 'Miasto', 'Branża'].map((variable) => (
                            <button
                              key={variable}
                              onClick={() => insertVariable(variable)}
                              className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white text-xs rounded transition-all"
                            >
                              {variable}
                            </button>
                          ))}
                        </div>
                      </div>
                      <textarea
                        value={template.body}
                        onChange={(e) => setTemplate({ ...template, body: e.target.value })}
                        rows={12}
                        className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-gray-500 focus:border-white/20 focus:outline-none font-mono text-sm"
                      />
                    </div>

                    <label className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 transition-all">
                      <input
                        type="checkbox"
                        checked={template.useAiIcebreaker}
                        onChange={(e) => setTemplate({ ...template, useAiIcebreaker: e.target.checked })}
                        className="size-5 rounded border-white/20 bg-white/10 checked:bg-white checked:border-white cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-white font-medium mb-1">
                          <Sparkles className="size-4" />
                          AI Icebreaker
                        </div>
                        <div className="text-sm text-gray-400">
                          AI dopisze pierwsze unikalne zdanie na podstawie strony www leada
                        </div>
                      </div>
                    </label>
                  </div>
                )}

                {/* Step 2: Preview */}
                {currentStep === 'preview' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-400">
                        Podgląd dla: <span className="text-white font-medium">{mockLeadsForPreview[previewIndex].company}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPreviewIndex(Math.max(0, previewIndex - 1))}
                          disabled={previewIndex === 0}
                          className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="size-5 text-white" />
                        </button>
                        <span className="text-sm text-gray-400">
                          {previewIndex + 1} / {mockLeadsForPreview.length}
                        </span>
                        <button
                          onClick={() => setPreviewIndex(Math.min(mockLeadsForPreview.length - 1, previewIndex + 1))}
                          disabled={previewIndex === mockLeadsForPreview.length - 1}
                          className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="size-5 text-white" />
                        </button>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 border border-gray-200">
                      <div className="border-b border-gray-200 pb-4 mb-4">
                        <div className="text-sm text-gray-600 mb-2">Temat:</div>
                        <div className="font-semibold text-black">
                          {template.subject.replace('{{Firma}}', mockLeadsForPreview[previewIndex].company)}
                        </div>
                      </div>
                      <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                        {generatePreview()}
                      </div>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Zap className="size-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="text-sm font-medium text-blue-400 mb-1">
                            Możesz edytować każdą wiadomość
                          </div>
                          <div className="text-sm text-gray-400">
                            Kliknij w treść, aby wprowadzić ręczne zmiany dla konkretnego leada
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Schedule */}
                {currentStep === 'schedule' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Skrzynka wysyłająca
                      </label>
                      <select
                        value={schedule.emailAccount}
                        onChange={(e) => setSchedule({ ...schedule, emailAccount: e.target.value })}
                        className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-white/20 focus:outline-none"
                      >
                        <option value="jan@firma.pl">jan@firma.pl</option>
                        <option value="kontakt@firma.pl">kontakt@firma.pl</option>
                        <option value="biuro@firma.pl">biuro@firma.pl</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Dni wysyłki
                      </label>
                      <div className="flex gap-2">
                        {[
                          { id: 'mon', label: 'Pon' },
                          { id: 'tue', label: 'Wt' },
                          { id: 'wed', label: 'Śr' },
                          { id: 'thu', label: 'Czw' },
                          { id: 'fri', label: 'Pt' },
                          { id: 'sat', label: 'Sob' },
                          { id: 'sun', label: 'Ndz' },
                        ].map((day) => (
                          <button
                            key={day.id}
                            onClick={() => {
                              const newDays = schedule.days.includes(day.id)
                                ? schedule.days.filter(d => d !== day.id)
                                : [...schedule.days, day.id];
                              setSchedule({ ...schedule, days: newDays });
                            }}
                            className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                              schedule.days.includes(day.id)
                                ? 'bg-white text-black'
                                : 'bg-white/10 text-gray-400 hover:bg-white/20'
                            }`}
                          >
                            {day.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                          Godzina rozpoczęcia
                        </label>
                        <input
                          type="time"
                          value={schedule.startHour}
                          onChange={(e) => setSchedule({ ...schedule, startHour: e.target.value })}
                          className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-white/20 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                          Godzina zakończenia
                        </label>
                        <input
                          type="time"
                          value={schedule.endHour}
                          onChange={(e) => setSchedule({ ...schedule, endHour: e.target.value })}
                          className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-white/20 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Limit dzienny (e-maili na skrzynkę)
                      </label>
                      <input
                        type="number"
                        value={schedule.dailyLimit}
                        onChange={(e) => setSchedule({ ...schedule, dailyLimit: parseInt(e.target.value) })}
                        className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-white/20 focus:outline-none"
                      />
                      <div className="mt-2 text-sm text-gray-400">
                        Zalecamy max 40-50 e-maili dziennie, aby uniknąć filtrów antyspamowych
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      const stepIndex = steps.findIndex(s => s.id === currentStep);
                      if (stepIndex > 0) {
                        setCurrentStep(steps[stepIndex - 1].id);
                      }
                    }}
                    disabled={currentStep === 'template'}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <ChevronLeft className="size-5" />
                    Wstecz
                  </button>

                  {currentStep === 'schedule' ? (
                    <button
                      onClick={() => {
                        setShowCreateModal(false);
                        // Here would be API call to create campaign
                      }}
                      className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-all flex items-center gap-2"
                    >
                      <Send className="size-5" />
                      Rozpocznij kampanię
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        const stepIndex = steps.findIndex(s => s.id === currentStep);
                        if (stepIndex < steps.length - 1) {
                          setCurrentStep(steps[stepIndex + 1].id);
                        }
                      }}
                      className="px-6 py-3 bg-white hover:bg-gray-100 text-black font-semibold rounded-lg transition-all flex items-center gap-2"
                    >
                      Dalej
                      <ChevronRight className="size-5" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
