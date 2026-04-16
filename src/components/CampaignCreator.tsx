import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, ArrowRight, ArrowLeft, Check, Search, Loader2,
  AlertCircle, Plus, RotateCcw, Edit3, ChevronLeft,
  ChevronRight, Clock, Building2, Globe, Hash, Info,
  Server, CheckCircle2
} from 'lucide-react';

// ─── Brand logos ──────────────────────────────────────────────────────────────

function GoogleLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function MicrosoftLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M11.4 2H2v9.4h9.4V2z" fill="#F25022"/>
      <path d="M22 2h-9.4v9.4H22V2z" fill="#7FBA00"/>
      <path d="M11.4 12.6H2V22h9.4v-9.4z" fill="#00A4EF"/>
      <path d="M22 12.6h-9.4V22H22v-9.4z" fill="#FFB900"/>
    </svg>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4 | 5;
type LeadReviewStatus = 'pending' | 'accepted' | 'skipped';
type Provider = 'gmail' | 'outlook' | 'other' | null;

interface DatabaseLead {
  id: string;
  company: string;
  industry: string;
  email: string;
  city?: string;
}

interface Mailbox {
  id: string;
  email: string;
  provider: 'google' | 'microsoft' | 'other';
}

interface GeneratedLead {
  id: number;
  company: string;
  person: string;
  industry: string;
  website: string;
  intel: {
    social: string;
    keywords: string[];
    summary: string;
  };
  subject: string;
  body: string;
  reviewStatus: LeadReviewStatus;
  isGenerating: boolean;
}

interface CampaignCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedLeadIds?: string[];
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockDatabaseLeads: DatabaseLead[] = [
  { id: '101', company: 'Studio Nowak', industry: 'Architektura', email: 'kontakt@studionowak.pl', city: 'Kraków' },
  { id: '102', company: 'TechFlow Sp. z o.o.', industry: 'Software House', email: 'hello@techflow.dev', city: 'Wrocław' },
  { id: '103', company: 'BudMaster', industry: 'Budownictwo', email: 'biuro@budmaster.pl', city: 'Warszawa' },
  { id: '104', company: 'Green Build', industry: 'Nieruchomości', email: 'info@greenbuild.com', city: 'Gdańsk' },
  { id: '105', company: 'SEO Ninjas', industry: 'Marketing', email: 'contact@seoninjas.pl', city: 'Poznań' },
  { id: '106', company: 'Architekci Krakowscy', industry: 'Architektura', email: 'hello@ark.pl', city: 'Kraków' },
  { id: '107', company: 'Metropolis Invest', industry: 'Nieruchomości', email: 'office@metropolis.pl', city: 'Warszawa' },
];

const mockMailboxes: Mailbox[] = [
  { id: 'm1', email: 'jan.kowalski@twojafirma.pl', provider: 'google' },
  { id: 'm2', email: 'kontakt@twojafirma.pl', provider: 'microsoft' },
  { id: 'm3', email: 'sales@twojafirma.pl', provider: 'google' },
];

const mockGeneratedLeads: Omit<GeneratedLead, 'reviewStatus' | 'isGenerating'>[] = [
  {
    id: 1, company: 'Studio Nowak', person: 'Michał Nowak', industry: 'Architektura', website: 'studionowak.pl',
    intel: {
      social: '"Właśnie oddaliśmy klucze do nowej inwestycji na Żoliborzu! Dziękujemy całemu zespołowi za ciężką pracę. #architektura #premium"',
      keywords: ['Premium', 'Wnętrza', 'Nieruchomości', 'Projekty pod klucz'],
      summary: 'Krakowskie biuro architektoniczne specjalizujące się w wysokiej klasy apartamentach i przestrzeniach komercjalnych. Aktywni na Instagramie i LinkedIn.',
    },
    subject: 'Szybkie pytanie o realizację na Żoliborzu',
    body: 'Cześć Michał,\n\nGratuluję oddania nowej inwestycji na Żoliborzu! Widziałem zdjęcia na LinkedIn – dbałość o detale w częściach wspólnych robi niesamowite wrażenie.\n\nZauważyłem, że przy tego typu projektach premium, biura architektoniczne często tracą mnóstwo czasu na ręczne przepisywanie specyfikacji materiałowych dla podwykonawców.\n\nZbudowaliśmy system, który automatyzuje ten proces, oszczędzając ok. 10 godzin tygodniowo na każdym projekcie.\n\nCzy to jest obszar, w którym szukacie obecnie optymalizacji?\n\nPozdrawiam,\nJan',
  },
  {
    id: 2, company: 'TechFlow Sp. z o.o.', person: 'Anna Kowal', industry: 'Software House', website: 'techflow.dev',
    intel: {
      social: '"Szukamy React Developerów do naszego nowego, zagranicznego projektu z branży FinTech. Aplikujcie!"',
      keywords: ['React', 'FinTech', 'Outsourcing', 'Skalowanie'],
      summary: 'Szybko rosnący software house z Wrocławia. Obsługują głównie klientów z USA i UK. Skupieni na skalowaniu zespołu.',
    },
    subject: 'Optymalizacja procesów rekrutacyjnych w TechFlow',
    body: 'Dzień dobry Pani Anno,\n\nWidziałem Wasze ostatnie ogłoszenia o rekrutacji React Developerów do projektów FinTech. Szybki wzrost to świetna wiadomość, ale często oznacza też wąskie gardła w onboardingu.\n\nPomagamy software house\'om takim jak TechFlow automatyzować proces wdrażania nowych pracowników, co skraca time-to-productivity o 40%.\n\nCzy chwila na krótką rozmowę w przyszłym tygodniu miałaby sens?\n\nZ poważaniem,\nJan',
  },
  {
    id: 3, company: 'BudMaster', person: 'Tomasz Budny', industry: 'Budownictwo', website: 'budmaster.pl',
    intel: {
      social: '"Zaczynamy kolejny etap budowy osiedla przy ul. Klonowej. Postęp prac zgodny z harmonogramem!"',
      keywords: ['Budownictwo', 'Osiedle', 'Harmonogram', 'Deweloper'],
      summary: 'Średniej wielkości firma budowlana działająca w Warszawie i okolicach. Specjalizują się w budownictwie mieszkaniowym.',
    },
    subject: 'Automatyzacja dokumentacji budowlanej — BudMaster',
    body: 'Dzień dobry,\n\nGratulacje z postępami przy osiedlu Klonowa — harmonogram na plus!\n\nWiemy, że przy prowadzeniu kilku budów jednocześnie, dokumentacja potrafi zajmować więcej czasu niż sama robota. Nasz system pomaga automatyzować raporty i koordynację z podwykonawcami.\n\nCzy warto porozmawiać?\n\nPozdrawiam,\nJan',
  },
];

// ─── Step progress bar ────────────────────────────────────────────────────────

function StepBar({ current, total }: { current: Step; total: number }) {
  const steps = [
    { n: 1, label: 'Odbiorcy' },
    { n: 2, label: 'Konfiguracja' },
    { n: 3, label: 'Wysyłka' },
    { n: 4, label: 'Weryfikacja' },
    { n: 5, label: 'Podsumowanie' },
  ];

  return (
    <div className="flex items-center gap-1">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center gap-1">
          <div className="flex items-center gap-1.5">
            <div className={`size-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
              current > s.n
                ? 'bg-[#EAE8E1] text-[#1A1A1A]'
                : current === s.n
                ? 'bg-white/[0.15] text-[#EAE8E1] ring-1 ring-white/[0.3]'
                : 'bg-white/[0.05] text-[#3a3a3a]'
            }`}>
              {current > s.n ? <Check className="size-3" strokeWidth={3} /> : s.n}
            </div>
            <span className={`text-[12px] font-medium hidden sm:block transition-colors ${
              current === s.n ? 'text-[#EAE8E1]' : current > s.n ? 'text-[#A3A09A]' : 'text-[#3a3a3a]'
            }`}>{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`w-8 h-px mx-1 transition-all ${current > s.n ? 'bg-[#A3A09A]' : 'bg-white/[0.08]'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Mailbox add modal (same as settings) ────────────────────────────────────

function AddMailboxModal({ onClose, onAdd }: { onClose: () => void; onAdd: (m: Mailbox) => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [provider, setProvider] = useState<Provider>(null);
  const [form, setForm] = useState({ email: '', name: '', password: '', smtpHost: '', smtpPort: '', imapHost: '', imapPort: '' });
  const [verifying, setVerifying] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const pick = (p: Provider) => {
    setProvider(p);
    const presets: Record<string, Partial<typeof form>> = {
      gmail: { smtpHost: 'smtp.gmail.com', smtpPort: '465', imapHost: 'imap.gmail.com', imapPort: '993' },
      outlook: { smtpHost: 'smtp.office365.com', smtpPort: '587', imapHost: 'outlook.office365.com', imapPort: '993' },
    };
    setForm(prev => ({ ...prev, ...(presets[p as string] ?? {}) }));
    setStep(2);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    await new Promise(r => setTimeout(r, 1200));
    onAdd({ id: `m${Date.now()}`, email: form.email, provider: provider === 'gmail' ? 'google' : provider === 'outlook' ? 'microsoft' : 'other' });
    onClose();
    setVerifying(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        className="bg-[#1a1a1a] border border-white/[0.08] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-7 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            {step === 2 && <button onClick={() => setStep(1)} className="p-1.5 hover:bg-white/[0.06] rounded-lg text-[#A3A09A] hover:text-[#EAE8E1] transition-all"><ArrowLeft className="size-4" /></button>}
            <p className="text-[15px] font-medium text-[#EAE8E1]">{step === 1 ? 'Dodaj skrzynkę' : `Podłącz ${provider === 'gmail' ? 'Google' : provider === 'outlook' ? 'Microsoft 365' : 'własny serwer'}`}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#827E78] hover:text-[#EAE8E1] hover:bg-white/[0.06] rounded-lg transition-all"><X className="size-4" /></button>
        </div>

        {step === 1 && (
          <div className="p-7 grid grid-cols-3 gap-3">
            {[
              { id: 'gmail' as Provider, name: 'Google', sub: 'Gmail, Workspace', logo: <GoogleLogo size={28} /> },
              { id: 'outlook' as Provider, name: 'Microsoft', sub: 'Outlook, Exchange', logo: <MicrosoftLogo size={26} /> },
              { id: 'other' as Provider, name: 'Inny', sub: 'Zoho, OVH, własny', logo: <Server className="size-6 text-[#A3A09A]" /> },
            ].map(p => (
              <button key={p.id} onClick={() => pick(p.id)}
                className="flex flex-col items-center gap-3 p-5 bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/[0.15] rounded-2xl transition-all">
                <div className="size-11 flex items-center justify-center">{p.logo}</div>
                <div className="text-center">
                  <p className="text-[13px] font-medium text-[#EAE8E1] mb-0.5">{p.name}</p>
                  <p className="text-[11px] text-[#827E78]">{p.sub}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <form onSubmit={submit} className="p-7 space-y-4">
            {err && <div className="flex items-start gap-2 p-3 bg-[#b56060]/10 border border-[#b56060]/20 rounded-xl text-[#b56060] text-[13px]"><AlertCircle className="size-4 shrink-0 mt-0.5" />{err}</div>}
            <div>
              <p className="text-[13px] font-medium text-[#A3A09A] mb-2">Adres e-mail</p>
              <input type="email" required value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="jan@firma.pl"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-[14px] text-[#EAE8E1] placeholder:text-[#827E78] focus:outline-none focus:border-white/[0.25] transition-all" />
            </div>
            {provider === 'other' && (
              <div className="space-y-3 p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                <div><p className="text-[12px] text-[#827E78] mb-1.5">SMTP</p>
                  <div className="flex gap-2">
                    <input required placeholder="smtp.domena.pl" value={form.smtpHost} onChange={e => setForm(p => ({ ...p, smtpHost: e.target.value }))} className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-[13px] text-[#EAE8E1] placeholder:text-[#827E78] focus:outline-none focus:border-white/[0.2] transition-all" />
                    <input required placeholder="465" value={form.smtpPort} onChange={e => setForm(p => ({ ...p, smtpPort: e.target.value }))} className="w-20 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-[13px] text-[#EAE8E1] placeholder:text-[#827E78] focus:outline-none focus:border-white/[0.2] transition-all" />
                  </div>
                </div>
                <div><p className="text-[12px] text-[#827E78] mb-1.5">IMAP</p>
                  <div className="flex gap-2">
                    <input required placeholder="imap.domena.pl" value={form.imapHost} onChange={e => setForm(p => ({ ...p, imapHost: e.target.value }))} className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-[13px] text-[#EAE8E1] placeholder:text-[#827E78] focus:outline-none focus:border-white/[0.2] transition-all" />
                    <input required placeholder="993" value={form.imapPort} onChange={e => setForm(p => ({ ...p, imapPort: e.target.value }))} className="w-20 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-[13px] text-[#EAE8E1] placeholder:text-[#827E78] focus:outline-none focus:border-white/[0.2] transition-all" />
                  </div>
                </div>
              </div>
            )}
            <div>
              <p className="text-[13px] font-medium text-[#A3A09A] mb-2">Hasło aplikacji</p>
              <input type="password" required value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="16-znakowy kod"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-[14px] text-[#EAE8E1] placeholder:text-[#827E78] focus:outline-none focus:border-white/[0.25] transition-all font-mono tracking-widest" />
            </div>
            <button type="submit" disabled={verifying}
              className="w-full py-3 bg-[#EAE8E1] hover:bg-white text-[#1A1A1A] text-[14px] font-medium rounded-xl transition-all disabled:opacity-40 flex items-center justify-center gap-2 mt-2">
              {verifying ? <><Loader2 className="size-4 animate-spin" />Weryfikuję...</> : 'Połącz skrzynkę'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CampaignCreator({ isOpen, onClose, preselectedLeadIds }: CampaignCreatorProps) {
  const [step, setStep] = useState<Step>(1);

  // Step 1
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);

  // Step 2
  const [campaignName, setCampaignName] = useState('');
  const [promptAngle, setPromptAngle] = useState('');

  // Step 3
  const [mailboxes, setMailboxes] = useState<Mailbox[]>(mockMailboxes);
  const [selectedMailboxIds, setSelectedMailboxIds] = useState<string[]>([]);
  const [showAddMailbox, setShowAddMailbox] = useState(false);

  // Step 4 — Tinder mode
  const [generatedLeads, setGeneratedLeads] = useState<GeneratedLead[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');
  const [justActioned, setJustActioned] = useState<{ id: number; action: 'accepted' | 'skipped' } | null>(null);

  // Step 5
  const [launching, setLaunching] = useState(false);
  const [launched, setLaunched] = useState(false);

  const totalSelected = selectedLeadIds.length;
  const estimatedMinutes = Math.ceil((totalSelected * 8) / 60) || 1;

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSearchQuery('');
      setSelectedLeadIds(preselectedLeadIds?.length ? preselectedLeadIds : []);
      setCampaignName('');
      setPromptAngle('');
      setSelectedMailboxIds([]);
      setGeneratedLeads([]);
      setCurrentIndex(0);
      setEditingIndex(null);
      setLaunched(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Simulate generating leads when entering step 4
  useEffect(() => {
    if (step !== 4) return;

    const leads: GeneratedLead[] = mockGeneratedLeads.map((l, i) => ({
      ...l,
      reviewStatus: 'pending',
      isGenerating: i > 0, // first one ready immediately
    }));
    setGeneratedLeads(leads);
    setCurrentIndex(0);

    // Simulate generation delays for subsequent leads
    leads.forEach((_, i) => {
      if (i === 0) return;
      setTimeout(() => {
        setGeneratedLeads(prev => prev.map((l, idx) => idx === i ? { ...l, isGenerating: false } : l));
      }, (i + 1) * 2000);
    });
  }, [step]);

  const filteredLeads = mockDatabaseLeads.filter(l =>
    l.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.city || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleLead = (id: string) =>
    setSelectedLeadIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const toggleAll = () =>
    setSelectedLeadIds(selectedLeadIds.length === filteredLeads.length ? [] : filteredLeads.map(l => l.id));

  const toggleMailbox = (id: string) =>
    setSelectedMailboxIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const currentLead = generatedLeads[currentIndex];

  const startEdit = () => {
    if (!currentLead) return;
    setEditingIndex(currentIndex);
    setEditSubject(currentLead.subject);
    setEditBody(currentLead.body);
  };

  const saveEdit = () => {
    setGeneratedLeads(prev => prev.map((l, i) =>
      i === editingIndex ? { ...l, subject: editSubject, body: editBody } : l
    ));
    setEditingIndex(null);
  };

  const handleAction = (action: 'accepted' | 'skipped') => {
    setGeneratedLeads(prev => prev.map((l, i) =>
      i === currentIndex ? { ...l, reviewStatus: action } : l
    ));
    setJustActioned({ id: currentLead.id, action });
    setTimeout(() => {
      setJustActioned(null);
      if (currentIndex < generatedLeads.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setStep(5);
      }
    }, 600);
  };

  const handleBulkApprove = () => {
    setGeneratedLeads(prev => prev.map(l => ({ ...l, reviewStatus: 'accepted' })));
    setTimeout(() => setStep(5), 400);
  };

  const handleLaunch = async () => {
    setLaunching(true);
    await new Promise(r => setTimeout(r, 1200));
    setLaunching(false);
    setLaunched(true);
    setTimeout(() => onClose(), 2000);
  };

  const canGoNext = () => {
    if (step === 1) return selectedLeadIds.length > 0;
    if (step === 2) return campaignName.trim().length > 0 && promptAngle.trim().length > 0;
    if (step === 3) return selectedMailboxIds.length > 0;
    return true;
  };

  const handleNext = () => {
    if (step < 4) setStep((step + 1) as Step);
    else if (step === 3) setStep(4);
  };

  const accepted = generatedLeads.filter(l => l.reviewStatus === 'accepted').length;
  const skipped = generatedLeads.filter(l => l.reviewStatus === 'skipped').length;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10">

          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={step === 4 ? undefined : onClose}
            className="absolute inset-0 bg-black/75 backdrop-blur-md"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 12 }}
            transition={{ duration: 0.18 }}
            className="relative w-full max-w-[1280px] h-[88vh] min-h-[600px] bg-[#0f0f0f] border border-white/[0.08] rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >

            {/* ── Header ── */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-white/[0.06] bg-[#1A1A1A] shrink-0">
              <div className="flex items-center gap-6">
                <h2 className="text-[17px] font-serif text-[#EAE8E1] tracking-tight shrink-0">Kreator kampanii</h2>
                <div className="h-4 w-px bg-white/[0.1]" />
                <StepBar current={step} total={5} />
              </div>

              <div className="flex items-center gap-4">
                {step === 4 && (
                  <div className="flex items-center gap-2 text-[12px] text-[#827E78]">
                    <Clock className="size-3.5" />
                    <span>Szacowany czas: ok. <span className="text-[#A3A09A]">{estimatedMinutes} min</span></span>
                    <span className="text-[#3a3a3a] mx-1">·</span>
                    <span className="text-[#A3A09A]">Możesz zamknąć i wrócić później</span>
                  </div>
                )}
                <button onClick={onClose} className="p-2 text-[#827E78] hover:text-[#EAE8E1] hover:bg-white/[0.06] rounded-lg transition-all">
                  <X className="size-5" />
                </button>
              </div>
            </div>

            {/* ── Content ── */}
            <div className="flex-1 overflow-hidden relative">
              <AnimatePresence mode="wait">

                {/* ═══ STEP 1: LEADS ═══ */}
                {step === 1 && (
                  <motion.div key="s1" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} className="absolute inset-0 flex flex-col p-8">
                    <div className="max-w-4xl mx-auto w-full h-full flex flex-col">
                      <div className="mb-6">
                        <h3 className="text-[20px] font-medium text-[#EAE8E1] mb-1">Wybierz odbiorców</h3>
                        <p className="text-[14px] text-[#A3A09A]">Zaznacz firmy ze swojej bazy, do których chcesz wysłać tę kampanię.</p>
                      </div>

                      <div className="flex items-center justify-between mb-4 gap-4">
                        <div className="relative flex-1 max-w-xs">
                          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#827E78]" />
                          <input
                            type="text" placeholder="Szukaj firmy, branży, miasta..."
                            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-[13px] text-[#EAE8E1] placeholder:text-[#827E78] focus:outline-none focus:border-white/[0.2] transition-all"
                          />
                        </div>
                        <span className="text-[13px] font-medium text-[#EAE8E1] shrink-0">
                          Wybrano: <span className="text-[#A3A09A] font-mono">{selectedLeadIds.length}</span>
                        </span>
                      </div>

                      <div className="flex-1 rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden flex flex-col">
                        <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/[0.06] bg-white/[0.02] text-[11px] font-medium text-[#3a3a3a] uppercase tracking-wider">
                          <div className="col-span-1 flex items-center">
                            <button onClick={toggleAll} className={`size-4 rounded border flex items-center justify-center transition-all ${selectedLeadIds.length === filteredLeads.length && filteredLeads.length > 0 ? 'bg-[#EAE8E1] border-[#EAE8E1]' : 'border-white/[0.2] hover:border-white/[0.4]'}`}>
                              {selectedLeadIds.length === filteredLeads.length && filteredLeads.length > 0 && <Check className="size-2.5 text-[#1A1A1A]" strokeWidth={3} />}
                            </button>
                          </div>
                          <div className="col-span-4">Firma</div>
                          <div className="col-span-3">Branża</div>
                          <div className="col-span-2">Miasto</div>
                          <div className="col-span-2">Email</div>
                        </div>
                        <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04]">
                          {filteredLeads.map(lead => {
                            const sel = selectedLeadIds.includes(lead.id);
                            return (
                              <div key={lead.id} onClick={() => toggleLead(lead.id)}
                                className={`grid grid-cols-12 gap-4 px-6 py-4 items-center cursor-pointer transition-all ${sel ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]'}`}>
                                <div className="col-span-1 flex items-center">
                                  <div className={`size-4 rounded border flex items-center justify-center transition-all ${sel ? 'bg-[#EAE8E1] border-[#EAE8E1]' : 'border-white/[0.2]'}`}>
                                    {sel && <Check className="size-2.5 text-[#1A1A1A]" strokeWidth={3} />}
                                  </div>
                                </div>
                                <div className="col-span-4 text-[14px] font-medium text-[#EAE8E1]">{lead.company}</div>
                                <div className="col-span-3 text-[13px] text-[#A3A09A]">{lead.industry}</div>
                                <div className="col-span-2 text-[13px] text-[#827E78]">{lead.city || '—'}</div>
                                <div className="col-span-2 text-[12px] text-[#3a3a3a] truncate">{lead.email}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ═══ STEP 2: CONFIG ═══ */}
                {step === 2 && (
                  <motion.div key="s2" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} className="absolute inset-0 p-8 overflow-y-auto">
                    <div className="max-w-2xl mx-auto space-y-8">
                      <div>
                        <h3 className="text-[20px] font-medium text-[#EAE8E1] mb-1">Szczegóły kampanii</h3>
                        <p className="text-[14px] text-[#A3A09A]">Nadaj nazwę i poinstruuj AI, jak ma pisać wiadomości.</p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[14px] font-medium text-[#A3A09A]">Nazwa kampanii *</p>
                        <input type="text" value={campaignName} onChange={e => setCampaignName(e.target.value)}
                          placeholder="np. Agencje SEO — Oferta Automatyzacji Q2"
                          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-5 py-3.5 text-[15px] text-[#EAE8E1] placeholder:text-[#827E78] focus:outline-none focus:border-white/[0.25] transition-all" />
                      </div>

                      <div className="space-y-2">
                        <p className="text-[14px] font-medium text-[#A3A09A]">Kąt uderzenia *</p>
                        <p className="text-[13px] text-[#827E78] mb-3">Poinstruuj AI na co zwrócić uwagę i jak ułożyć wiadomość na podstawie danych o firmie.</p>
                        <textarea value={promptAngle} onChange={e => setPromptAngle(e.target.value)}
                          placeholder="np. Skup się na ich ostatnich projektach z portfolio. Zaproponuj nasze narzędzie do automatyzacji, wspomnij że zaoszczędzi im to 10h tygodniowo. Ton: profesjonalny, ale luźny. CTA: zaproszenie na 15-minutową rozmowę."
                          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-5 py-4 text-[14px] text-[#EAE8E1] placeholder:text-[#827E78] focus:outline-none focus:border-white/[0.25] transition-all resize-none leading-relaxed min-h-[180px]"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ═══ STEP 3: MAILBOXES ═══ */}
                {step === 3 && (
                  <motion.div key="s3" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} className="absolute inset-0 p-8 overflow-y-auto">
                    <div className="max-w-2xl mx-auto space-y-6">
                      <div>
                        <h3 className="text-[20px] font-medium text-[#EAE8E1] mb-1">Skrzynki nadawcze</h3>
                        <p className="text-[14px] text-[#A3A09A]">Wybierz z jakich adresów mają być wysyłane wiadomości.</p>
                      </div>

                      {/* Subtelny alert o limicie */}
                      <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                        <Info className="size-4 text-[#827E78] shrink-0 mt-0.5" />
                        <p className="text-[13px] text-[#827E78] leading-relaxed">
                          Dzienny limit to <span className="text-[#A3A09A]">40 maili / skrzynka</span> — celowe opóźnienie chroni Twoją domenę przed spamem.
                          Wybierz więcej skrzynek, żeby wysyłać szybciej.
                        </p>
                      </div>

                      <div className="space-y-3">
                        {mailboxes.map(mb => {
                          const sel = selectedMailboxIds.includes(mb.id);
                          return (
                            <div key={mb.id} onClick={() => toggleMailbox(mb.id)}
                              className={`flex items-center justify-between p-5 rounded-2xl border cursor-pointer transition-all ${sel ? 'bg-white/[0.05] border-white/[0.15]' : 'bg-white/[0.02] border-white/[0.07] hover:border-white/[0.12]'}`}>
                              <div className="flex items-center gap-4">
                                <div className={`size-5 rounded border flex items-center justify-center transition-all ${sel ? 'bg-[#EAE8E1] border-[#EAE8E1]' : 'border-white/[0.2]'}`}>
                                  {sel && <Check className="size-3 text-[#1A1A1A]" strokeWidth={3} />}
                                </div>
                                <div className="size-8 flex items-center justify-center">
                                  {mb.provider === 'google' ? <GoogleLogo size={20} /> : mb.provider === 'microsoft' ? <MicrosoftLogo size={18} /> : <Server className="size-5 text-[#A3A09A]" />}
                                </div>
                                <div>
                                  <p className="text-[14px] font-medium text-[#EAE8E1]">{mb.email}</p>
                                  <p className="text-[12px] text-[#827E78] mt-0.5">Limit: 40 maili / dzień</p>
                                </div>
                              </div>
                              {sel && <span className="text-[11px] font-medium text-[#5d9970] bg-[#5d9970]/10 px-2.5 py-1 rounded-full">Wybrana</span>}
                            </div>
                          );
                        })}
                      </div>

                      <button onClick={() => setShowAddMailbox(true)}
                        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-dashed border-white/[0.1] hover:border-white/[0.2] text-[13px] font-medium text-[#827E78] hover:text-[#A3A09A] transition-all">
                        <Plus className="size-4" /> Dodaj nową skrzynkę
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* ═══ STEP 4: TINDER ═══ */}
                {step === 4 && (
                  <motion.div key="s4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col">

                    {/* Tinder top bar */}
                    <div className="flex items-center justify-between px-8 py-3 border-b border-white/[0.06] bg-[#141414] shrink-0">
                      <div className="flex items-center gap-4">
                        <span className="text-[12px] text-[#3a3a3a] uppercase tracking-wider font-medium">Weryfikacja wiadomości</span>
                        <span className="px-2.5 py-1 bg-white/[0.04] border border-white/[0.06] text-[#A3A09A] text-[12px] font-mono rounded-lg">
                          {currentIndex + 1} / {generatedLeads.length}
                        </span>
                        <div className="flex items-center gap-1.5 ml-2">
                          {generatedLeads.map((l, i) => (
                            <div key={l.id} className={`h-1 rounded-full transition-all ${
                              i < currentIndex
                                ? l.reviewStatus === 'accepted' ? 'w-4 bg-[#5d9970]' : 'w-4 bg-[#827E78]'
                                : i === currentIndex ? 'w-4 bg-[#EAE8E1]' : 'w-3 bg-white/[0.08]'
                            }`} />
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <button onClick={handleBulkApprove}
                          className="text-[12px] font-medium text-[#827E78] hover:text-[#EAE8E1] transition-colors underline underline-offset-4 decoration-white/[0.15]">
                          Zatwierdź wszystkie i przejdź dalej
                        </button>
                        <div className="w-px h-4 bg-white/[0.08]" />
                        {/* Nav arrows */}
                        <div className="flex items-center gap-1">
                          <button onClick={() => setCurrentIndex(i => Math.max(0, i - 1))} disabled={currentIndex === 0}
                            className="p-1.5 text-[#3a3a3a] hover:text-[#A3A09A] disabled:opacity-20 hover:bg-white/[0.04] rounded-lg transition-all">
                            <ChevronLeft className="size-4" />
                          </button>
                          <button onClick={() => setCurrentIndex(i => Math.min(generatedLeads.length - 1, i + 1))} disabled={currentIndex === generatedLeads.length - 1}
                            className="p-1.5 text-[#3a3a3a] hover:text-[#A3A09A] disabled:opacity-20 hover:bg-white/[0.04] rounded-lg transition-all">
                            <ChevronRight className="size-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 60/40 split */}
                    <div className="flex-1 grid grid-cols-10 overflow-hidden">

                      {/* LEFT: Mail preview / editor (60%) */}
                      <div className="col-span-6 flex flex-col bg-[#0f0f0f] border-r border-white/[0.06] overflow-hidden">

                        {currentLead?.isGenerating ? (
                          // Generating state
                          <div className="flex-1 flex flex-col items-center justify-center p-8">
                            <div className="w-full max-w-lg">
                              {/* Fake email skeleton */}
                              <div className="bg-white rounded-2xl p-8 shadow-lg">
                                <div className="mb-6 pb-4 border-b border-gray-100">
                                  <div className="flex items-center gap-3 mb-2">
                                    <div className="size-8 bg-gray-100 rounded-full animate-pulse" />
                                    <div className="flex-1">
                                      <div className="h-3 bg-gray-100 rounded animate-pulse w-32 mb-1" />
                                      <div className="h-2.5 bg-gray-50 rounded animate-pulse w-48" />
                                    </div>
                                  </div>
                                  <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4 mt-3" />
                                </div>
                                <div className="space-y-3">
                                  {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className={`h-3 bg-gray-50 rounded animate-pulse ${i === 3 ? 'w-2/3' : i === 5 ? 'w-1/2' : 'w-full'}`} />
                                  ))}
                                </div>
                              </div>
                              <div className="flex items-center justify-center gap-2 mt-4 text-[13px] text-[#827E78]">
                                <Loader2 className="size-4 animate-spin" />
                                AI generuje wiadomość...
                              </div>
                            </div>
                          </div>
                        ) : currentLead ? (
                          <div className="flex-1 flex flex-col overflow-hidden">
                            {/* Action overlay */}
                            <AnimatePresence>
                              {justActioned && justActioned.id === currentLead.id && (
                                <motion.div
                                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                  className={`absolute inset-0 z-10 flex items-center justify-center pointer-events-none ${justActioned.action === 'accepted' ? 'bg-[#5d9970]/10' : 'bg-[#b56060]/10'}`}
                                >
                                  <div className={`flex items-center gap-2 px-5 py-3 rounded-2xl border text-[15px] font-medium ${justActioned.action === 'accepted' ? 'bg-[#5d9970]/20 border-[#5d9970]/30 text-[#5d9970]' : 'bg-[#b56060]/20 border-[#b56060]/30 text-[#b56060]'}`}>
                                    <Check className="size-5" strokeWidth={3} />
                                    {justActioned.action === 'accepted' ? 'Zaakceptowano' : 'Pominięto'}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* Email preview on white background */}
                            <div className="flex-1 overflow-y-auto p-6">
                              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                                {/* Gmail-like header */}
                                <div className="px-8 py-5 border-b border-gray-100">
                                  <div className="flex items-start justify-between mb-1">
                                    {editingIndex === currentIndex ? (
                                      <input value={editSubject} onChange={e => setEditSubject(e.target.value)}
                                        className="text-[18px] font-semibold text-gray-900 bg-transparent border-b border-gray-200 focus:border-gray-400 focus:outline-none w-full pb-1"
                                      />
                                    ) : (
                                      <h3 className="text-[18px] font-semibold text-gray-900">{currentLead.subject}</h3>
                                    )}
                                    {editingIndex !== currentIndex && (
                                      <button onClick={startEdit} className="ml-3 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all shrink-0">
                                        <Edit3 className="size-4" />
                                      </button>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-[13px] text-gray-400 mt-1">
                                    <div className="size-6 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-600">
                                      {selectedMailboxIds[0] ? mailboxes.find(m => m.id === selectedMailboxIds[0])?.email[0].toUpperCase() : 'J'}
                                    </div>
                                    <span>{mailboxes.find(m => m.id === selectedMailboxIds[0])?.email || 'jan@firma.pl'}</span>
                                    <span className="text-gray-200">→</span>
                                    <span>{currentLead.company}</span>
                                  </div>
                                </div>

                                {/* Body */}
                                <div className="px-8 py-6">
                                  {editingIndex === currentIndex ? (
                                    <div className="space-y-4">
                                      <textarea value={editBody} onChange={e => setEditBody(e.target.value)}
                                        className="w-full text-[14px] text-gray-800 leading-[1.8] font-serif bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-gray-300 resize-none min-h-[240px] transition-all"
                                      />
                                      <div className="flex gap-2 justify-end">
                                        <button onClick={() => setEditingIndex(null)} className="px-4 py-2 text-[13px] text-gray-500 hover:text-gray-700 transition-colors">Anuluj</button>
                                        <button onClick={saveEdit} className="px-4 py-2 bg-gray-900 text-white text-[13px] font-medium rounded-xl hover:bg-gray-700 transition-all">Zapisz zmiany</button>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-[14px] text-gray-800 leading-[1.9] font-serif whitespace-pre-wrap">{currentLead.body}</p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Action buttons */}
                            {editingIndex !== currentIndex && (
                              <div className="px-6 py-4 border-t border-white/[0.06] flex items-center gap-3 shrink-0">
                                <button onClick={() => handleAction('skipped')}
                                  className="flex items-center gap-2 px-5 py-2.5 border border-[#b56060]/30 bg-[#b56060]/8 text-[#b56060] text-[13px] font-medium rounded-xl hover:bg-[#b56060]/15 transition-all">
                                  Pomiń leada
                                </button>

                                <button onClick={() => {
                                  setGeneratedLeads(prev => prev.map((l, i) => i === currentIndex ? { ...l, isGenerating: true } : l));
                                  setTimeout(() => {
                                    setGeneratedLeads(prev => prev.map((l, i) => i === currentIndex ? { ...l, isGenerating: false } : l));
                                  }, 1500);
                                }} className="flex items-center gap-2 px-5 py-2.5 border border-white/[0.08] text-[#A3A09A] text-[13px] font-medium rounded-xl hover:text-[#EAE8E1] hover:border-white/[0.15] transition-all ml-auto">
                                  <RotateCcw className="size-3.5" /> Regeneruj
                                </button>

                                <button onClick={() => handleAction('accepted')}
                                  className="flex items-center gap-2 px-8 py-2.5 bg-[#EAE8E1] hover:bg-white text-[#1A1A1A] text-[14px] font-semibold rounded-xl transition-all">
                                  Akceptuj <ArrowRight className="size-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        ) : null}
                      </div>

                      {/* RIGHT: Intel panel (40%) */}
                      <div className="col-span-4 bg-[#111111] overflow-y-auto p-6">
                        {currentLead && !currentLead.isGenerating && (
                          <div className="space-y-5">
                            {/* Company header */}
                            <div className="flex items-center gap-3 pb-5 border-b border-white/[0.06]">
                              <div className="size-12 bg-white/[0.04] border border-white/[0.08] rounded-2xl flex items-center justify-center text-[#EAE8E1] font-serif text-xl shrink-0">
                                {currentLead.company.charAt(0)}
                              </div>
                              <div>
                                <h3 className="text-[16px] font-medium text-[#EAE8E1]">{currentLead.company}</h3>
                                <p className="text-[13px] text-[#A3A09A] flex items-center gap-1.5 mt-0.5">
                                  <Building2 className="size-3.5" /> {currentLead.industry}
                                </p>
                              </div>
                            </div>

                            {/* Basic info */}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="p-3.5 bg-white/[0.02] border border-white/[0.04] rounded-xl">
                                <span className="block text-[10px] font-medium text-[#3a3a3a] uppercase tracking-wider mb-1">Osoba</span>
                                <span className="text-[13px] text-[#EAE8E1]">{currentLead.person}</span>
                              </div>
                              <div className="p-3.5 bg-white/[0.02] border border-white/[0.04] rounded-xl">
                                <span className="block text-[10px] font-medium text-[#3a3a3a] uppercase tracking-wider mb-1">WWW</span>
                                <span className="text-[13px] text-[#A3A09A] flex items-center gap-1.5">
                                  <Globe className="size-3" /> {currentLead.website}
                                </span>
                              </div>
                            </div>

                            {/* Social activity */}
                            <div className="p-4 bg-white/[0.02] border border-white/[0.04] rounded-xl">
                              <span className="flex items-center gap-2 text-[10px] font-medium text-[#3a3a3a] uppercase tracking-wider mb-3">
                                <Hash className="size-3" /> Ostatnia aktywność
                              </span>
                              <p className="text-[13px] text-[#A3A09A] leading-relaxed italic">
                                {currentLead.intel.social}
                              </p>
                            </div>

                            {/* AI context */}
                            <div className="p-4 bg-white/[0.02] border border-white/[0.04] rounded-xl">
                              <span className="flex items-center gap-2 text-[10px] font-medium text-[#3a3a3a] uppercase tracking-wider mb-3">
                                <Info className="size-3" /> Kontekst (AI)
                              </span>
                              <p className="text-[13px] text-[#EAE8E1] leading-relaxed">
                                {currentLead.intel.summary}
                              </p>
                              <div className="flex flex-wrap gap-1.5 mt-3">
                                {currentLead.intel.keywords.map(kw => (
                                  <span key={kw} className="px-2 py-0.5 bg-white/[0.04] border border-white/[0.06] text-[#A3A09A] text-[11px] rounded-md">{kw}</span>
                                ))}
                              </div>
                            </div>

                            {/* Review status of current lead */}
                            {currentLead.reviewStatus !== 'pending' && (
                              <div className={`flex items-center gap-2 p-3.5 rounded-xl text-[13px] font-medium ${currentLead.reviewStatus === 'accepted' ? 'bg-[#5d9970]/10 border border-[#5d9970]/20 text-[#5d9970]' : 'bg-[#827E78]/10 border border-[#827E78]/20 text-[#827E78]'}`}>
                                <Check className="size-4" strokeWidth={3} />
                                {currentLead.reviewStatus === 'accepted' ? 'Zaakceptowano' : 'Pominięto'}
                              </div>
                            )}
                          </div>
                        )}

                        {currentLead?.isGenerating && (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                              <Loader2 className="size-6 text-[#827E78] animate-spin mx-auto mb-3" />
                              <p className="text-[13px] text-[#827E78]">Ładowanie danych firmy...</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ═══ STEP 5: SUMMARY ═══ */}
                {step === 5 && (
                  <motion.div key="s5" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col items-center justify-center p-8">
                    <div className="max-w-lg w-full text-center space-y-8">

                      {launched ? (
                        <div className="space-y-4">
                          <div className="size-16 bg-[#5d9970]/10 border border-[#5d9970]/20 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle2 className="size-8 text-[#5d9970]" />
                          </div>
                          <h3 className="text-[26px] font-serif text-[#EAE8E1] tracking-tight">Kampania uruchomiona</h3>
                          <p className="text-[15px] text-[#A3A09A] leading-relaxed">Wiadomości trafiły do kolejki. Możesz śledzić postęp w zakładce Kampanie.</p>
                        </div>
                      ) : (
                        <>
                          <div>
                            <h3 className="text-[26px] font-serif text-[#EAE8E1] tracking-tight mb-3">Gotowe do wysyłki</h3>
                            <p className="text-[15px] text-[#A3A09A] leading-relaxed">Przejrzyj podsumowanie i uruchom kampanię.</p>
                          </div>

                          {/* Summary stats */}
                          <div className="grid grid-cols-3 gap-4 text-center">
                            {[
                              { label: 'Zaakceptowane', value: accepted, color: 'text-[#5d9970]' },
                              { label: 'Pominięte', value: skipped, color: 'text-[#827E78]' },
                              { label: 'Skrzynki', value: selectedMailboxIds.length, color: 'text-[#A3A09A]' },
                            ].map(s => (
                              <div key={s.label} className="p-5 rounded-2xl border border-white/[0.08] bg-white/[0.04]">
                                <p className={`text-[28px] font-medium tracking-tight ${s.color}`}>{s.value}</p>
                                <p className="text-[12px] text-[#827E78] mt-1">{s.label}</p>
                              </div>
                            ))}
                          </div>

                          {/* Campaign name */}
                          <div className="p-5 rounded-2xl border border-white/[0.08] bg-white/[0.02] text-left">
                            <p className="text-[11px] font-medium text-[#3a3a3a] uppercase tracking-wider mb-2">Nazwa kampanii</p>
                            <p className="text-[15px] font-medium text-[#EAE8E1]">{campaignName}</p>
                          </div>

                          {/* Info o kolejkowaniu */}
                          <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] text-left">
                            <Info className="size-4 text-[#827E78] shrink-0 mt-0.5" />
                            <p className="text-[13px] text-[#827E78] leading-relaxed">
                              System wyśle <span className="text-[#A3A09A]">{accepted} wiadomości</span> w losowych odstępach między 9:00–15:00, po ok. 40 maili dziennie z każdej skrzynki. Chroni to Twoją domenę przed spamem.
                            </p>
                          </div>

                          <button onClick={handleLaunch} disabled={launching || accepted === 0}
                            className="w-full py-4 bg-[#EAE8E1] hover:bg-white text-[#1A1A1A] text-[15px] font-semibold rounded-xl transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                            {launching ? <><Loader2 className="size-4 animate-spin" />Uruchamiam...</> : `Uruchom kampanię (${accepted} maili)`}
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            {/* ── Footer navigation (steps 1-3 only) ── */}
            {step <= 3 && (
              <div className="px-8 py-5 border-t border-white/[0.06] bg-[#1A1A1A] flex items-center justify-between shrink-0">
                <button onClick={() => step > 1 ? setStep((step - 1) as Step) : onClose()}
                  className="flex items-center gap-2 px-5 py-2.5 text-[#A3A09A] hover:text-[#EAE8E1] text-[13px] font-medium transition-colors">
                  <ArrowLeft className="size-4" /> {step === 1 ? 'Anuluj' : 'Wstecz'}
                </button>

                {step < 3 ? (
                  <button onClick={handleNext} disabled={!canGoNext()}
                    className="flex items-center gap-2 px-6 py-2.5 bg-white/[0.08] border border-white/[0.1] hover:bg-white/[0.12] text-[#EAE8E1] text-[13px] font-semibold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                    Dalej <ArrowRight className="size-4" />
                  </button>
                ) : (
                  <button onClick={() => { if (canGoNext()) setStep(4); }} disabled={!canGoNext()}
                    className="flex items-center gap-2 px-8 py-2.5 bg-[#EAE8E1] hover:bg-white text-[#1A1A1A] text-[14px] font-semibold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                    Generuj kampanię <ArrowRight className="size-4" />
                  </button>
                )}
              </div>
            )}

          </motion.div>

          {/* Add mailbox nested modal */}
          <AnimatePresence>
            {showAddMailbox && (
              <AddMailboxModal
                onClose={() => setShowAddMailbox(false)}
                onAdd={mb => { setMailboxes(prev => [...prev, mb]); setSelectedMailboxIds(prev => [...prev, mb.id]); }}
              />
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
}