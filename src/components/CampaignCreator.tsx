import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, ArrowRight, ArrowLeft, Check, Search, Loader2,
  AlertCircle, Plus, RotateCcw, Edit3, ChevronLeft,
  ChevronRight, Clock, Building2, Globe, Hash, Info,
  Server, CheckCircle2
} from 'lucide-react';
import { supabase } from '../lib/supabase';

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
  website?: string;
  city?: string;
  person?: string;
  summary?: string;
  instagramData?: unknown;
  linkedinData?: unknown;
  history?: unknown;
}

interface Mailbox {
  id: string;
  email: string;
  sender_name?: string;
  provider: 'google' | 'microsoft' | 'other';
  daily_limit?: number;
  sent_today?: number;
  status?: string;
}

interface CompanyInfo {
  name: string;
  website: string;
  industry: string;
  short_description: string;
  ideal_customer_profile: string;
  competitive_advantages: string;
  ai_context: string;
}

interface GeneratedLead {
  id: string;
  emailId?: string;
  leadId: string;
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
  generationError?: string;
}

interface GeneratedEmailDraft {
  lead_id: string;
  subject: string;
  body: string;
  person?: string;
  website?: string;
  intel?: {
    social?: string;
    keywords?: string[];
    summary?: string;
  };
}

interface EmailGenerationResponse {
  success?: boolean;
  count?: number;
  mails?: GeneratedEmailDraft[];
}

interface CampaignCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedLeadIds?: string[];
}

interface CampaignDraft {
  step: Step;
  selectedLeadIds: string[];
  campaignName: string;
  promptAngle: string;
  selectedMailboxIds: string[];
  savedAt: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function detectMailboxProvider(email: string, smtpHost?: string): 'google' | 'microsoft' | 'other' {
  const e = email.toLowerCase();
  const h = (smtpHost || '').toLowerCase();
  if (e.includes('@gmail.com') || h.includes('gmail') || h.includes('google')) return 'google';
  if (e.includes('@outlook.') || e.includes('@hotmail.') || h.includes('office365') || h.includes('microsoft')) return 'microsoft';
  return 'other';
}

const DRAFT_KEY = 'zec_campaign_draft';
const CAMPAIGN_EMAIL_WEBHOOK_URL =
  import.meta.env.VITE_N8N_CAMPAIGN_EMAIL_WEBHOOK_URL ||
  'https://n8n.srv1579942.hstgr.cloud/webhook/zec-campaign-email-generator';

async function requestCampaignEmailGeneration(payload: unknown): Promise<EmailGenerationResponse> {
  const response = await fetch(CAMPAIGN_EMAIL_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  if (!response.ok) throw new Error(`n8n zwrócił błąd ${response.status}`);
  try {
    return JSON.parse(text) as EmailGenerationResponse;
  } catch {
    throw new Error("n8n zwrócił niepoprawny JSON");
  }
}

function saveDraftToStorage(draft: CampaignDraft) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch {}
}

function loadDraftFromStorage(): CampaignDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as CampaignDraft;
    const age = Date.now() - new Date(d.savedAt).getTime();
    if (age > 7 * 24 * 60 * 60 * 1000) { localStorage.removeItem(DRAFT_KEY); return null; }
    return d;
  } catch { return null; }
}

function clearDraftFromStorage() {
  try { localStorage.removeItem(DRAFT_KEY); } catch {}
}

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

// ─── Mailbox add modal (kept for reference) ───────────────────────────────────

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

  // Supabase
  const [dbCampaignId, setDbCampaignId] = useState<string | null>(null);
  const [lastScheduledTime, setLastScheduledTime] = useState<Date>(new Date());
  const [isGeneratingMails, setIsGeneratingMails] = useState(false);

  // Step 1
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [databaseLeads, setDatabaseLeads] = useState<DatabaseLead[]>([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);

  // Step 2
  const [campaignName, setCampaignName] = useState('');
  const [promptAngle, setPromptAngle] = useState('');
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: '', website: '', industry: '', short_description: '',
    ideal_customer_profile: '', competitive_advantages: '', ai_context: ''
  });
  const [companyInfoLoading, setCompanyInfoLoading] = useState(false);
  const [companyInfoSaving, setCompanyInfoSaving] = useState(false);
  const [companyInfoSaved, setCompanyInfoSaved] = useState(false);

  // Step 3
  const [mailboxes, setMailboxes] = useState<Mailbox[]>([]);
  const [loadingMailboxes, setLoadingMailboxes] = useState(false);
  const [selectedMailboxIds, setSelectedMailboxIds] = useState<string[]>([]);
  const [showAddMailbox, setShowAddMailbox] = useState(false);

  // Step 4
  const [generatedLeads, setGeneratedLeads] = useState<GeneratedLead[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');
  const [justActioned, setJustActioned] = useState<{ id: string; action: 'accepted' | 'skipped' } | null>(null);

  // Step 5
  const [launching, setLaunching] = useState(false);
  const [launched, setLaunched] = useState(false);
  const [completedAction, setCompletedAction] = useState<'saved' | 'launched' | null>(null);

  // Draft
  const [draftExists, setDraftExists] = useState(false);

  const totalSelected = selectedLeadIds.length;
  const generatedCount = generatedLeads.filter(l => !l.isGenerating && !l.generationError && l.body.trim()).length;
  const generatingCount = generatedLeads.filter(l => l.isGenerating).length;
  const remainingGenerationCount = step === 4 && generatedLeads.length > 0
    ? generatingCount
    : totalSelected;
  const estimatedMinutes = Math.ceil((remainingGenerationCount * 8) / 60) || 1;

  // Reset on open + fetch data
  useEffect(() => {
    if (!isOpen) return;
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
    setCompletedAction(null);
    setDbCampaignId(null);
    setLastScheduledTime(new Date());

    const draft = loadDraftFromStorage();
    setDraftExists(!!draft);

    const fetchLeads = async () => {
      setIsLoadingLeads(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setIsLoadingLeads(false); return; }
      const { data, error } = await supabase
        .from('user_leads')
        .select(`
          id, name, summary, instagram_data, linkedin_data, history,
          global_leads ( company_name, email, city, industry, website )
        `)
        .eq('user_id', session.user.id);
      if (!error && data) {
        setDatabaseLeads(data.map((item: any) => ({
          id: item.id,
          company: item.global_leads?.company_name || 'Brak firmy',
          industry: item.global_leads?.industry || '',
          email: item.global_leads?.email || '',
          website: item.global_leads?.website || '',
          city: item.global_leads?.city || '',
          person: item.name || '',
          summary: item.summary || '',
          instagramData: item.instagram_data || null,
          linkedinData: item.linkedin_data || null,
          history: item.history || [],
        })));
      }
      setIsLoadingLeads(false);
    };

    const fetchMailboxes = async () => {
      setLoadingMailboxes(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoadingMailboxes(false); return; }
      const { data } = await supabase
        .from('email_accounts')
        .select('id, email_address, sender_name, smtp_host, daily_limit, sent_today, status')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      if (data) {
        setMailboxes(data.map((m: any) => ({
          id: m.id,
          email: m.email_address,
          sender_name: m.sender_name,
          provider: detectMailboxProvider(m.email_address, m.smtp_host),
          daily_limit: m.daily_limit ?? 40,
          sent_today: m.sent_today ?? 0,
          status: m.status,
        })));
      }
      setLoadingMailboxes(false);
    };

    const fetchCompanyInfo = async () => {
      setCompanyInfoLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setCompanyInfoLoading(false); return; }
      const { data } = await supabase.from('companies').select('*').eq('user_id', session.user.id).single();
      if (data) {
        setCompanyInfo({
          name: data.name || '',
          website: data.website || '',
          industry: data.industry || '',
          short_description: data.short_description || '',
          ideal_customer_profile: data.ideal_customer_profile || '',
          competitive_advantages: data.competitive_advantages || '',
          ai_context: data.ai_context || '',
        });
      }
      setCompanyInfoLoading(false);
    };

    fetchLeads();
    fetchMailboxes();
    fetchCompanyInfo();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const resumeDraft = () => {
    const draft = loadDraftFromStorage();
    if (!draft) return;
    setStep(draft.step);
    setSelectedLeadIds(draft.selectedLeadIds);
    setCampaignName(draft.campaignName);
    setPromptAngle(draft.promptAngle);
    setSelectedMailboxIds(draft.selectedMailboxIds);
    setDraftExists(false);
  };

  const discardDraft = () => {
    clearDraftFromStorage();
    setDraftExists(false);
  };

  const handleClose = () => {
    if (dbCampaignId) {
      clearDraftFromStorage();
      setDraftExists(false);
      onClose();
      return;
    }

    if (!launched && (step > 1 || selectedLeadIds.length > 0 || campaignName.trim())) {
      saveDraftToStorage({
        step,
        selectedLeadIds,
        campaignName,
        promptAngle,
        selectedMailboxIds,
        savedAt: new Date().toISOString(),
      });
    }
    onClose();
  };

  const saveCompanyInfo = async () => {
    setCompanyInfoSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.from('companies').upsert({ user_id: session.user.id, ...companyInfo }, { onConflict: 'user_id' });
    }
    setCompanyInfoSaving(false);
    setCompanyInfoSaved(true);
    setTimeout(() => setCompanyInfoSaved(false), 2200);
  };

  // ─── Generation + Supabase ────────────────────────────────────────────────

  const createPlaceholderLead = (lead: DatabaseLead, emailId?: string): GeneratedLead => ({
    id: lead.id,
    emailId,
    leadId: lead.id,
    company: lead.company || 'Brak danych',
    industry: lead.industry || 'Brak branży',
    person: lead.person || '—',
    website: lead.website || '—',
    intel: {
      social: lead.summary || '',
      keywords: [],
      summary: lead.summary || '',
    },
    subject: '',
    body: '',
    reviewStatus: 'pending',
    isGenerating: true,
  });

  const buildGenerationPayload = (campaignId: string, selectedMailboxes: Mailbox[], leads: DatabaseLead[]) => ({
    campaign: {
      id: campaignId,
      name: campaignName,
      promptAngle,
    },
    company: companyInfo,
    mailboxes: selectedMailboxes,
    leads: leads.map(lead => ({
      id: lead.id,
      company: lead.company,
      email: lead.email,
      website: lead.website,
      industry: lead.industry,
      city: lead.city,
      person: lead.person,
      summary: lead.summary,
      instagram_data: lead.instagramData,
      linkedin_data: lead.linkedinData,
      history: lead.history,
    })),
  });

  const generateAndStoreLeadEmail = async (campaignId: string, lead: DatabaseLead, selectedMailboxes: Mailbox[], emailId?: string) => {
    try {
      const generation = await requestCampaignEmailGeneration(
        buildGenerationPayload(campaignId, selectedMailboxes, [lead])
      );
      const generated = generation.mails?.find(mail => mail.lead_id === lead.id) || generation.mails?.[0];
      if (!generation.success || !generated?.body) {
        throw new Error("n8n nie zwrócił wygenerowanego maila");
      }

      const emailPayload = {
        subject: generated.subject || 'Szybkie pytanie',
        body: generated.body,
        status: 'pending_review',
      };

      const { data: dbEmail, error: emailErr } = emailId
        ? await supabase
            .from('campaign_emails')
            .update(emailPayload)
            .eq('id', emailId)
            .select()
            .single()
        : await supabase
            .from('campaign_emails')
            .insert({
              campaign_id: campaignId,
              lead_id: lead.id,
              ...emailPayload
            })
            .select()
            .single();

      if (emailErr || !dbEmail) throw emailErr;

      const intel = generated.intel || {};
      setGeneratedLeads(prev => prev.map(item =>
        item.leadId === lead.id
          ? {
              ...item,
              emailId: dbEmail.id,
              person: generated.person || lead.person || '—',
              website: generated.website || lead.website || '—',
              intel: {
                social: intel.social || lead.summary || '',
                keywords: intel.keywords || [],
                summary: intel.summary || lead.summary || '',
              },
              subject: dbEmail.subject,
              body: dbEmail.body,
              reviewStatus: 'pending',
              isGenerating: false,
              generationError: undefined,
            }
          : item
      ));
    } catch (error) {
      console.error(`Błąd generowania maila dla ${lead.company}:`, error);
      setGeneratedLeads(prev => prev.map(item =>
        item.leadId === lead.id
          ? {
              ...item,
              isGenerating: false,
              generationError: error instanceof Error ? error.message : "Nie udało się wygenerować maila.",
            }
          : item
      ));
    }
  };

  const handleStartGeneration = async () => {
    if (!canGoNext()) return;
    setIsGeneratingMails(true);
    let createdCampaignId: string | null = null;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Brak sesji użytkownika");

      const selectedLeads = selectedLeadIds
        .map(id => databaseLeads.find(lead => lead.id === id))
        .filter(Boolean) as DatabaseLead[];

      if (selectedLeads.length === 0) throw new Error("Nie znaleziono wybranych leadów");

      if (Object.values(companyInfo).some(value => value.trim().length > 0)) {
        await supabase
          .from('companies')
          .upsert({ user_id: session.user.id, ...companyInfo }, { onConflict: 'user_id' });
      }

      const { data: campaign, error: campErr } = await supabase
        .from('campaigns')
        .insert({
          user_id: session.user.id,
          name: campaignName,
          prompt_angle: promptAngle,
          status: 'draft',
          total_count: selectedLeads.length,
          email_account_id: selectedMailboxIds[0] || null
        })
        .select()
        .single();

      if (campErr || !campaign) throw campErr;
      createdCampaignId = campaign.id;
      setDbCampaignId(campaign.id);
      clearDraftFromStorage();
      setDraftExists(false);

      const selectedMailboxes = mailboxes.filter(mailbox => selectedMailboxIds.includes(mailbox.id));
      const mailboxIdForIndex = (index: number) =>
        selectedMailboxes.length > 0 ? selectedMailboxes[index % selectedMailboxes.length].id : null;

      if (selectedMailboxes.length > 0) {
        const { error: senderErr } = await supabase
          .from('campaign_email_accounts')
          .insert(selectedMailboxes.map(mailbox => ({
            campaign_id: campaign.id,
            email_account_id: mailbox.id,
            daily_limit: mailbox.daily_limit ?? 40,
          })));
        if (senderErr) throw senderErr;
      }

      await supabase
        .from('user_leads')
        .update({ campaign_id: campaign.id, status: 'pending' })
        .in('id', selectedLeads.map(lead => lead.id));

      const { data: placeholderEmails, error: placeholderErr } = await supabase
        .from('campaign_emails')
        .insert(selectedLeads.map((lead, index) => ({
          campaign_id: campaign.id,
          lead_id: lead.id,
          subject: '',
          body: '',
          status: 'pending_review',
          queue_position: index + 1,
          email_account_id: mailboxIdForIndex(index),
        })))
        .select();

      if (placeholderErr || !placeholderEmails) throw placeholderErr;

      const emailIdByLeadId = new Map((placeholderEmails as any[]).map(email => [email.lead_id, email.id]));

      setGeneratedLeads(selectedLeads.map(lead => createPlaceholderLead(lead, emailIdByLeadId.get(lead.id))));
      setCurrentIndex(0);
      setLastScheduledTime(new Date());
      setStep(4);
      setIsGeneratingMails(false);

      const [firstLead, ...remainingLeads] = selectedLeads;
      void (async () => {
        if (firstLead) await generateAndStoreLeadEmail(campaign.id, firstLead, selectedMailboxes, emailIdByLeadId.get(firstLead.id));
        remainingLeads.forEach(lead => {
          void generateAndStoreLeadEmail(campaign.id, lead, selectedMailboxes, emailIdByLeadId.get(lead.id));
        });
      })();

    } catch (error) {
      console.error("Błąd podczas zapisywania kampanii do Supabase:", error);
      if (createdCampaignId) {
        await supabase.from('campaign_emails').delete().eq('campaign_id', createdCampaignId);
        await supabase.from('campaigns').delete().eq('id', createdCampaignId);
        setDbCampaignId(null);
      }
      alert(error instanceof Error ? error.message : "Nie udało się wygenerować kampanii.");
    } finally {
      setIsGeneratingMails(false);
    }
  };

  const filteredLeads = databaseLeads.filter((l: DatabaseLead) =>
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
    if (!currentLead || currentLead.isGenerating || currentLead.generationError) return;
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

  const regenerateCurrentLead = async () => {
    if (!currentLead || !dbCampaignId) return;
    const leadDb = databaseLeads.find(lead => lead.id === currentLead.leadId);
    if (!leadDb) return;

    setGeneratedLeads(prev => prev.map((lead, index) =>
      index === currentIndex ? { ...lead, isGenerating: true } : lead
    ));

    try {
      const selectedMailboxes = mailboxes.filter(mailbox => selectedMailboxIds.includes(mailbox.id));
      const generation = await requestCampaignEmailGeneration(
        buildGenerationPayload(dbCampaignId, selectedMailboxes, [leadDb])
      );
      const generated = generation.mails?.[0];
      if (!generation.success || !generated?.body) {
        throw new Error("n8n nie zwrócił nowej wersji maila");
      }

      const emailPayload = {
        subject: generated.subject || 'Szybkie pytanie',
        body: generated.body,
        status: 'pending_review',
        scheduled_at: null,
      };

      const { data: dbEmail, error: emailErr } = currentLead.emailId
        ? await supabase
            .from('campaign_emails')
            .update(emailPayload)
            .eq('id', currentLead.emailId)
            .select()
            .single()
        : await supabase
            .from('campaign_emails')
            .insert({
              campaign_id: dbCampaignId,
              lead_id: leadDb.id,
              subject: generated.subject || 'Szybkie pytanie',
              body: generated.body,
              status: 'pending_review'
            })
            .select()
            .single();

      if (emailErr || !dbEmail) throw emailErr;

      await supabase
        .from('user_leads')
        .update({ campaign_id: dbCampaignId, status: 'pending' })
        .eq('id', leadDb.id);

      const intel = generated.intel || {};
      setGeneratedLeads(prev => prev.map((lead, index) =>
        index === currentIndex
          ? {
              ...lead,
              emailId: dbEmail.id,
              subject: dbEmail.subject,
              body: dbEmail.body,
              person: generated.person || leadDb.person || '—',
              website: generated.website || leadDb.website || '—',
              intel: {
                social: intel.social || leadDb.summary || '',
                keywords: intel.keywords || [],
                summary: intel.summary || leadDb.summary || '',
              },
              reviewStatus: 'pending',
              isGenerating: false,
              generationError: undefined,
            }
          : lead
      ));
    } catch (error) {
      console.error("Błąd regenerowania maila:", error);
      alert(error instanceof Error ? error.message : "Nie udało się zregenerować maila.");
      setGeneratedLeads(prev => prev.map((lead, index) =>
        index === currentIndex ? { ...lead, isGenerating: false } : lead
      ));
    }
  };

  const handleAction = async (action: 'accepted' | 'skipped') => {
    const lead = currentLead;
    if (!lead || lead.isGenerating || lead.generationError || !lead.emailId) return;
    try {
      if (action === 'accepted') {
        const nextTime = new Date(lastScheduledTime.getTime() + 20 * 60000);
        setLastScheduledTime(nextTime);
        await supabase.from('campaign_emails').update({
          status: 'queued',
          subject: lead.subject,
          body: lead.body,
          queue_position: currentIndex + 1,
        }).eq('id', lead.emailId);
      } else {
        await supabase.from('campaign_emails').update({ status: 'failed' }).eq('id', lead.emailId);
      }
    } catch (err) {
      console.error("Błąd podczas aktualizacji rekordu w Supabase:", err);
    }
    setGeneratedLeads(prev => prev.map((l, i) =>
      i === currentIndex ? { ...l, reviewStatus: action } : l
    ));
    setJustActioned({ id: lead.id, action });
    setTimeout(() => {
      setJustActioned(null);
      const nextIndex = generatedLeads.findIndex((item, index) =>
        index !== currentIndex && (item.isGenerating || item.reviewStatus === 'pending')
      );
      if (nextIndex >= 0) {
        setCurrentIndex(nextIndex);
      } else {
        setStep(5);
      }
    }, 600);
  };

  const handleBulkApprove = async () => {
    let currentTime = lastScheduledTime;
    const newLeads = [...generatedLeads];
    const updatePromises = [];
    for (let i = currentIndex; i < newLeads.length; i++) {
      const lead = newLeads[i];
      if (lead.reviewStatus === 'pending' && !lead.isGenerating && !lead.generationError && lead.emailId) {
        currentTime = new Date(currentTime.getTime() + 20 * 60000);
        updatePromises.push(
          supabase.from('campaign_emails').update({
            status: 'queued',
            queue_position: i + 1,
            subject: lead.subject,
            body: lead.body
          }).eq('id', lead.emailId)
        );
        lead.reviewStatus = 'accepted';
      }
    }
    setLastScheduledTime(currentTime);
    setGeneratedLeads(newLeads);
    try { await Promise.all(updatePromises); } catch (err) { console.error(err); }
    setTimeout(() => setStep(5), 400);
  };

  const handleLaunch = async () => {
    setLaunching(true);
    if (dbCampaignId) {
      const { error } = await supabase.rpc('zec_start_campaign_sending', { p_campaign_id: dbCampaignId });
      if (error) {
        console.error('Nie udało się uruchomić wysyłki:', error);
        alert(error.message || 'Nie udało się uruchomić wysyłki.');
        setLaunching(false);
        return;
      }
    }
    await new Promise(r => setTimeout(r, 1200));
    setLaunching(false);
    setLaunched(true);
    setCompletedAction('launched');
    setTimeout(() => onClose(), 2000);
  };

  const handleSaveCampaign = async () => {
    setLaunching(true);
    if (dbCampaignId) {
      await supabase.from('campaigns').update({ status: 'draft' }).eq('id', dbCampaignId);
    }
    await new Promise(r => setTimeout(r, 700));
    setLaunching(false);
    setLaunched(true);
    setCompletedAction('saved');
    setTimeout(() => onClose(), 1600);
  };

  const canGoNext = () => {
    if (step === 1) return selectedLeadIds.length > 0;
    if (step === 2) return campaignName.trim().length > 0 && promptAngle.trim().length > 0;
    if (step === 3) return true; // mailbox is optional
    return true;
  };

  const handleNext = () => {
    if (step < 3) setStep((step + 1) as Step);
    else if (step === 3) handleStartGeneration();
  };

  const accepted = generatedLeads.filter(l => l.reviewStatus === 'accepted').length;
  const skipped = generatedLeads.filter(l => l.reviewStatus === 'skipped').length;
  const hasSelectedMailbox = selectedMailboxIds.length > 0;

  if (!isOpen) return null;

  const cif = (k: keyof CompanyInfo) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setCompanyInfo(p => ({ ...p, [k]: e.target.value }));

  const ciInputCls = `w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-[14px] text-[#EAE8E1] placeholder:text-[#827E78] focus:outline-none focus:border-white/[0.2] transition-all`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">

          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={step === 4 ? undefined : handleClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
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
                    <span>
                      Wygenerowano <span className="text-[#A3A09A] font-mono">{generatedCount}</span>
                      <span className="text-[#3a3a3a]"> / </span>
                      <span className="text-[#A3A09A] font-mono">{generatedLeads.length}</span>
                    </span>
                    <span className="text-[#3a3a3a] mx-1">·</span>
                    <span>Pozostało ok. <span className="text-[#A3A09A]">{estimatedMinutes} min</span></span>
                    <span className="text-[#3a3a3a] mx-1">·</span>
                    <span className="text-[#A3A09A]">Możesz zamknąć i wrócić później</span>
                  </div>
                )}
                <button onClick={handleClose} className="p-2 text-[#827E78] hover:text-[#EAE8E1] hover:bg-white/[0.06] rounded-lg transition-all">
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

                      {/* Draft resume banner */}
                      {draftExists && (
                        <div className="mb-5 flex items-center justify-between gap-4 px-5 py-3.5 rounded-xl bg-white/[0.04] border border-white/[0.1]">
                          <div className="flex items-center gap-3">
                            <Clock className="size-4 text-[#A3A09A] shrink-0" />
                            <p className="text-[13px] text-[#A3A09A]">Masz niedokończoną kampanię. Chcesz kontynuować od miejsca, w którym skończyłeś?</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button onClick={discardDraft} className="text-[12px] text-[#827E78] hover:text-[#A3A09A] transition-colors px-3 py-1.5">Zacznij od nowa</button>
                            <button onClick={resumeDraft} className="text-[12px] font-medium text-[#EAE8E1] bg-white/[0.08] hover:bg-white/[0.12] px-4 py-1.5 rounded-lg transition-all">Kontynuuj szkic</button>
                          </div>
                        </div>
                      )}

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
                          {isLoadingLeads ? (
                            <div className="flex items-center justify-center py-16">
                              <Loader2 className="size-5 text-[#827E78] animate-spin" />
                            </div>
                          ) : filteredLeads.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center px-8">
                              <p className="text-[15px] font-medium text-[#EAE8E1] mb-2">Brak leadów w bazie</p>
                              <p className="text-[13px] text-[#A3A09A]">Najpierw znajdź firmy w zakładce Prospecting i zapisz je do bazy.</p>
                            </div>
                          ) : filteredLeads.map(lead => {
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

                      {/* Company info section */}
                      <div className="pt-2">
                        <div className="h-px bg-white/[0.06] mb-8" />
                        <div className="flex items-start justify-between mb-6">
                          <div>
                            <h4 className="text-[16px] font-medium text-[#EAE8E1]">Informacje o firmie</h4>
                            <p className="text-[13px] text-[#A3A09A] mt-1">Sprawdź i zaktualizuj dane, które AI wykorzysta do personalizacji.</p>
                          </div>
                          {companyInfoLoading && <Loader2 className="size-4 text-[#827E78] animate-spin mt-1" />}
                        </div>

                        <div className="space-y-5">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[13px] font-medium text-[#A3A09A] mb-2">Nazwa firmy</p>
                              <input value={companyInfo.name} onChange={cif('name')} placeholder="np. TechFlow Sp. z o.o." className={ciInputCls} />
                            </div>
                            <div>
                              <p className="text-[13px] font-medium text-[#A3A09A] mb-2">Strona WWW</p>
                              <input value={companyInfo.website} onChange={cif('website')} placeholder="https://techflow.pl" className={ciInputCls} />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[13px] font-medium text-[#A3A09A] mb-2">Branża</p>
                              <input value={companyInfo.industry} onChange={cif('industry')} placeholder="np. SaaS / Automatyzacja" className={ciInputCls} />
                            </div>
                            <div>
                              <p className="text-[13px] font-medium text-[#A3A09A] mb-2">Krótki opis działalności</p>
                              <input value={companyInfo.short_description} onChange={cif('short_description')} placeholder="np. Tworzymy dedykowane oprogramowanie dla logistyki." className={ciInputCls} />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[13px] font-medium text-[#A3A09A] mb-2">Profil idealnego klienta</p>
                              <input value={companyInfo.ideal_customer_profile} onChange={cif('ideal_customer_profile')} placeholder="np. Dyrektorzy operacyjni w firmach 50+ pracowników" className={ciInputCls} />
                            </div>
                            <div>
                              <p className="text-[13px] font-medium text-[#A3A09A] mb-2">Kluczowe wyróżniki</p>
                              <input value={companyInfo.competitive_advantages} onChange={cif('competitive_advantages')} placeholder="np. Wdrożenie w 14 dni, darmowy audyt na start" className={ciInputCls} />
                            </div>
                          </div>

                          <div>
                            <p className="text-[13px] font-medium text-[#A3A09A] mb-2">Szczegółowy opis działalności</p>
                            <textarea value={companyInfo.ai_context} onChange={cif('ai_context')}
                              placeholder="Opisz wszystko, co AI powinno wiedzieć: wielkość firmy, kluczowi klienci, wasza historia, szczegóły oferty..."
                              rows={4}
                              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-[14px] text-[#EAE8E1] placeholder:text-[#827E78] focus:outline-none focus:border-white/[0.2] transition-all resize-none leading-relaxed"
                            />
                          </div>

                          <div className="flex justify-end">
                            <button onClick={saveCompanyInfo} disabled={companyInfoSaving}
                              className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-[#EAE8E1] text-[13px] font-medium rounded-xl transition-all disabled:opacity-40">
                              {companyInfoSaving ? <><Loader2 className="size-3.5 animate-spin" />Zapisuję...</>
                                : companyInfoSaved ? <><Check className="size-3.5" />Zapisano</>
                                  : 'Zapisz informacje o firmie'}
                            </button>
                          </div>
                        </div>
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

                      <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                        <Info className="size-4 text-[#827E78] shrink-0 mt-0.5" />
                        <p className="text-[13px] text-[#827E78] leading-relaxed">
                          Dzienny limit to <span className="text-[#A3A09A]">40 maili / skrzynka</span> — celowe opóźnienie chroni Twoją domenę przed spamem.
                          Wybierz więcej skrzynek, żeby wysyłać szybciej.
                        </p>
                      </div>

                      {loadingMailboxes ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="size-5 text-[#827E78] animate-spin" />
                        </div>
                      ) : mailboxes.length === 0 ? (
                        <div className="text-center py-12 rounded-2xl border border-dashed border-white/[0.1]">
                          <div className="size-11 bg-white/[0.04] rounded-xl flex items-center justify-center mx-auto mb-4">
                            <Server className="size-5 text-[#A3A09A]" />
                          </div>
                          <p className="text-[14px] font-medium text-[#EAE8E1] mb-1">Brak podłączonych skrzynek</p>
                          <p className="text-[13px] text-[#A3A09A] mb-1">Skrzynki nadawcze dodasz w <span className="text-[#EAE8E1]">Ustawienia → Skrzynki pocztowe</span></p>
                        </div>
                      ) : (
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
                                  <div className="size-9 bg-white/[0.05] rounded-xl flex items-center justify-center">
                                    {mb.provider === 'google' ? <GoogleLogo size={20} /> : mb.provider === 'microsoft' ? <MicrosoftLogo size={18} /> : <Server className="size-5 text-[#A3A09A]" />}
                                  </div>
                                  <div>
                                    <p className="text-[14px] font-medium text-[#EAE8E1]">{mb.email}</p>
                                    <div className="flex items-center gap-3 mt-0.5">
                                      {mb.sender_name && <p className="text-[12px] text-[#A3A09A]">{mb.sender_name}</p>}
                                      <p className="text-[12px] text-[#827E78]">Limit: {mb.daily_limit ?? 40} maili / dzień</p>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  {mb.status === 'connected'
                                    ? <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#5d9970] bg-[#5d9970]/10 px-2.5 py-1 rounded-full"><span className="size-1.5 bg-[#5d9970] rounded-full" />Aktywna</span>
                                    : mb.status === 'error'
                                    ? <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#b56060] bg-[#b56060]/10 px-2.5 py-1 rounded-full"><span className="size-1.5 bg-[#b56060] rounded-full" />Błąd</span>
                                    : null}
                                  {sel && <span className="text-[11px] font-medium text-[#5d9970] bg-[#5d9970]/10 px-2.5 py-1 rounded-full">Wybrana</span>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <p className="text-[13px] text-[#827E78]">
                          Aby dodać skrzynkę, przejdź do <span className="text-[#A3A09A]">Ustawienia → Skrzynki pocztowe</span>
                        </p>
                        <button
                          onClick={handleStartGeneration}
                          disabled={isGeneratingMails}
                          className="text-[13px] text-[#827E78] hover:text-[#A3A09A] transition-colors underline underline-offset-4 decoration-white/[0.15]"
                        >
                          Kontynuuj bez skrzynki →
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ═══ STEP 4: TINDER ═══ */}
                {step === 4 && (
                  <motion.div key="s4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col">

                    <div className="flex items-center justify-between px-8 py-3 border-b border-white/[0.06] bg-[#141414] shrink-0">
                      <div className="flex items-center gap-4">
                        <span className="text-[12px] text-[#3a3a3a] uppercase tracking-wider font-medium">Weryfikacja wiadomości</span>
                        <span className="px-2.5 py-1 bg-white/[0.04] border border-white/[0.06] text-[#A3A09A] text-[12px] font-mono rounded-lg">
                          {currentIndex + 1} / {generatedLeads.length}
                        </span>
                        <div className="flex items-center gap-1.5 ml-2">
                          {generatedLeads.map((l, i) => (
                            <div key={l.id} className={`h-1 rounded-full transition-all ${
                              l.generationError
                                ? 'w-4 bg-[#b56060]'
                                : l.isGenerating
                                ? 'w-3 bg-white/[0.08] animate-pulse'
                                : i < currentIndex
                                ? l.reviewStatus === 'accepted' ? 'w-4 bg-[#5d9970]' : 'w-4 bg-[#827E78]'
                                : i === currentIndex ? 'w-4 bg-[#EAE8E1]' : 'w-3 bg-white/[0.08]'
                            }`} />
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <button onClick={handleBulkApprove} disabled={generatingCount > 0 || generatedCount === 0}
                          className="text-[12px] font-medium text-[#827E78] hover:text-[#EAE8E1] transition-colors underline underline-offset-4 decoration-white/[0.15] disabled:opacity-30 disabled:cursor-not-allowed">
                          Zatwierdź wszystkie i przejdź dalej
                        </button>
                        <div className="w-px h-4 bg-white/[0.08]" />
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

                    <div className="flex-1 grid grid-cols-10 overflow-hidden">

                      {/* LEFT: Mail preview / editor (60%) */}
                      <div className="col-span-6 flex flex-col bg-[#0f0f0f] border-r border-white/[0.06] overflow-hidden">

                        {currentLead?.isGenerating ? (
                          <div className="flex-1 flex flex-col items-center justify-center p-8">
                            <div className="w-full max-w-lg">
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
                        ) : currentLead?.generationError ? (
                          <div className="flex-1 flex flex-col items-center justify-center p-8">
                            <div className="w-full max-w-lg text-center">
                              <div className="bg-white rounded-2xl p-8 shadow-lg">
                                <div className="size-11 bg-[#b56060]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                  <AlertCircle className="size-5 text-[#b56060]" />
                                </div>
                                <h3 className="text-[18px] font-semibold text-gray-900 mb-2">Nie udało się wygenerować wiadomości</h3>
                                <p className="text-[14px] text-gray-500 leading-relaxed mb-6">{currentLead.generationError}</p>
                                <button onClick={regenerateCurrentLead}
                                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-[13px] font-medium rounded-xl hover:bg-gray-700 transition-all">
                                  <RotateCcw className="size-3.5" /> Spróbuj ponownie
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : currentLead ? (
                          <div className="flex-1 flex flex-col overflow-hidden">
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

                            <div className="flex-1 overflow-y-auto p-6">
                              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
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

                            {editingIndex !== currentIndex && (
                              <div className="px-6 py-4 border-t border-white/[0.06] flex items-center gap-3 shrink-0">
                                <button onClick={() => handleAction('skipped')}
                                  className="flex items-center gap-2 px-5 py-2.5 border border-[#b56060]/30 bg-[#b56060]/8 text-[#b56060] text-[13px] font-medium rounded-xl hover:bg-[#b56060]/15 transition-all">
                                  Pomiń leada
                                </button>

                                <button onClick={regenerateCurrentLead} disabled={currentLead.isGenerating}
                                  className="flex items-center gap-2 px-5 py-2.5 border border-white/[0.08] text-[#A3A09A] text-[13px] font-medium rounded-xl hover:text-[#EAE8E1] hover:border-white/[0.15] transition-all ml-auto disabled:opacity-40">
                                  <RotateCcw className="size-3.5" /> Regeneruj
                                </button>

                                <button onClick={() => handleAction('accepted')} disabled={!currentLead.emailId}
                                  className="flex items-center gap-2 px-8 py-2.5 bg-[#EAE8E1] hover:bg-white text-[#1A1A1A] text-[14px] font-semibold rounded-xl transition-all disabled:opacity-40">
                                  Akceptuj <ArrowRight className="size-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        ) : null}
                      </div>

                      {/* RIGHT: Intel panel (40%) */}
                      <div className="col-span-4 bg-[#111111] overflow-y-auto p-6">
                        {currentLead && !currentLead.isGenerating && !currentLead.generationError && (
                          <div className="space-y-5">
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

                            <div className="p-4 bg-white/[0.02] border border-white/[0.04] rounded-xl">
                              <span className="flex items-center gap-2 text-[10px] font-medium text-[#3a3a3a] uppercase tracking-wider mb-3">
                                <Hash className="size-3" /> Ostatnia aktywność
                              </span>
                              <p className="text-[13px] text-[#A3A09A] leading-relaxed italic">
                                {currentLead.intel.social}
                              </p>
                            </div>

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

                        {currentLead?.generationError && (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center max-w-xs">
                              <AlertCircle className="size-6 text-[#b56060] mx-auto mb-3" />
                              <p className="text-[13px] text-[#827E78] leading-relaxed">Ten lead czeka na ponowną próbę generowania.</p>
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
                          <h3 className="text-[26px] font-serif text-[#EAE8E1] tracking-tight">
                            {completedAction === 'saved' ? 'Kampania zapisana' : 'Kampania uruchomiona'}
                          </h3>
                          <p className="text-[15px] text-[#A3A09A] leading-relaxed">
                            {completedAction === 'saved'
                              ? 'Wiadomości są zapisane. Wyślesz je później z zakładki Kampanie.'
                              : 'Wiadomości trafiły do kolejki. Możesz śledzić postęp w zakładce Kampanie.'}
                          </p>
                        </div>
                      ) : (
                        <>
                          <div>
                            <h3 className="text-[26px] font-serif text-[#EAE8E1] tracking-tight mb-3">Gotowe do wysyłki</h3>
                            <p className="text-[15px] text-[#A3A09A] leading-relaxed">Przejrzyj podsumowanie i uruchom kampanię.</p>
                          </div>

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

                          <div className="p-5 rounded-2xl border border-white/[0.08] bg-white/[0.02] text-left">
                            <p className="text-[11px] font-medium text-[#3a3a3a] uppercase tracking-wider mb-2">Nazwa kampanii</p>
                            <p className="text-[15px] font-medium text-[#EAE8E1]">{campaignName}</p>
                          </div>

                          <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] text-left">
                            <Info className="size-4 text-[#827E78] shrink-0 mt-0.5" />
                            <p className="text-[13px] text-[#827E78] leading-relaxed">
                              System wyśle <span className="text-[#A3A09A]">{accepted} wiadomości</span> w losowych odstępach między 9:00–15:00, po ok. 40 maili dziennie z każdej skrzynki. Chroni to Twoją domenę przed spamem.
                            </p>
                          </div>

                          {hasSelectedMailbox ? (
                            <div className="space-y-3">
                              <button onClick={handleLaunch} disabled={launching || accepted === 0}
                                className="w-full py-4 bg-[#EAE8E1] hover:bg-white text-[#1A1A1A] text-[15px] font-semibold rounded-xl transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                                {launching ? <><Loader2 className="size-4 animate-spin" />Uruchamiam...</> : `Uruchom kampanię (${accepted} maili)`}
                              </button>
                              <button onClick={handleSaveCampaign} disabled={launching || accepted === 0}
                                className="w-full py-2.5 text-[13px] font-medium text-[#827E78] hover:text-[#EAE8E1] transition-colors disabled:opacity-40">
                                Zapisz i wyślij później
                              </button>
                            </div>
                          ) : (
                            <button onClick={handleSaveCampaign} disabled={launching || accepted === 0}
                              className="w-full py-4 bg-[#EAE8E1] hover:bg-white text-[#1A1A1A] text-[15px] font-semibold rounded-xl transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                              {launching ? <><Loader2 className="size-4 animate-spin" />Zapisuję...</> : `Zapisz kampanię (${accepted} maili)`}
                            </button>
                          )}
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
                <button onClick={() => step > 1 ? setStep((step - 1) as Step) : handleClose()}
                  className="flex items-center gap-2 px-5 py-2.5 text-[#A3A09A] hover:text-[#EAE8E1] text-[13px] font-medium transition-colors">
                  <ArrowLeft className="size-4" /> {step === 1 ? 'Anuluj' : 'Wstecz'}
                </button>

                {step < 3 ? (
                  <button onClick={handleNext} disabled={!canGoNext()}
                    className="flex items-center gap-2 px-6 py-2.5 bg-white/[0.08] border border-white/[0.1] hover:bg-white/[0.12] text-[#EAE8E1] text-[13px] font-semibold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                    Dalej <ArrowRight className="size-4" />
                  </button>
                ) : (
                  <button onClick={handleStartGeneration} disabled={isGeneratingMails}
                    className="flex items-center gap-2 px-8 py-2.5 bg-[#EAE8E1] hover:bg-white text-[#1A1A1A] text-[14px] font-semibold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                    {isGeneratingMails ? <><Loader2 className="size-4 animate-spin" /> Inicjowanie...</> : <>Generuj kampanię <ArrowRight className="size-4" /></>}
                  </button>
                )}
              </div>
            )}

          </motion.div>

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
