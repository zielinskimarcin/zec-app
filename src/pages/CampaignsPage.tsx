import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, ArrowLeft, Loader2, Mail, Check, Clock,
  AlertCircle, ChevronUp, Trash2, Pause, Play,
  Eye, X, Download, ArrowRight, Info, Archive, SlidersHorizontal, Search, ChevronDown
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CampaignCreator } from "../components/CampaignCreator";

// ─── Types ────────────────────────────────────────────────────────────────────

type CampaignStatus = 'active' | 'paused' | 'completed' | 'draft' | 'canceled';
type LeadStatus = 'queued' | 'sent' | 'replied' | 'bounced' | 'skipped';

interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  created_at: string;
  sent: number;
  total: number;
  replies: number;
  bounced: number;
  queued: number;
  estimated_end: string | null;
  isArchived?: boolean;
}

interface CampaignLead {
  id: string;
  company_name: string;
  email: string;
  status: LeadStatus;
  sent_at: string | null;
  sent_from: string | null;
  mail_content: string | null;
  priority: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusLabel(s: CampaignStatus) {
  const map: Record<CampaignStatus, { label: string; cls: string }> = {
    active:    { label: 'W toku',      cls: 'text-[#5d9970] bg-[#5d9970]/10' },
    paused:    { label: 'Wstrzymana',  cls: 'text-[#a3956a] bg-[#a3956a]/10' },
    completed: { label: 'Zakończona',  cls: 'text-[#A3A09A] bg-white/[0.06]' },
    canceled:  { label: 'Zakończona',  cls: 'text-[#827E78] bg-transparent border border-white/[0.1]' },
    draft:     { label: 'Szkic',       cls: 'text-[#827E78] bg-white/[0.04]' },
  };
  return map[s] || { label: 'Nieznany', cls: 'text-[#827E78] bg-white/[0.04]' };
}

function leadStatusLabel(s: LeadStatus) {
  const map: Record<LeadStatus, { label: string; cls: string; icon: React.ReactNode }> = {
    queued:  { label: 'W kolejce',    cls: 'text-[#827E78]',  icon: <Clock className="size-3.5" /> },
    sent:    { label: 'Wysłany',      cls: 'text-[#A3A09A]',  icon: <Mail className="size-3.5" /> },
    replied: { label: 'Odpowiedział', cls: 'text-[#5d9970]',  icon: <Check className="size-3.5" /> },
    bounced: { label: 'Odbity',       cls: 'text-[#b56060]',  icon: <AlertCircle className="size-3.5" /> },
    skipped: { label: 'Pominięty',    cls: 'text-[#3a3a3a]',  icon: <X className="size-3.5" /> },
  };
  return map[s];
}

function mapDbEmailStatus(dbStatus: string | null): LeadStatus {
  switch (dbStatus) {
    case 'queued': return 'queued';
    case 'sent': return 'sent';
    case 'replied': return 'replied';
    case 'bounced': return 'bounced';
    case 'failed': return 'skipped';
    case 'pending_review': return 'queued';
    default: return 'queued';
  }
}

function mapDbCampaign(c: any): Campaign {
  const isArchived = c.status === 'archived';
  let status: CampaignStatus = isArchived ? 'canceled' : (c.status as CampaignStatus) ?? 'draft';
  const sent = c.sent_count ?? 0;
  const total = c.total_count ?? 0;
  return {
    id: c.id,
    name: c.name,
    status,
    created_at: c.created_at,
    sent,
    total,
    replies: c.replies_count ?? 0,
    bounced: 0,
    queued: Math.max(0, total - sent),
    estimated_end: null,
    isArchived,
  };
}

function formatDate(d: string | null) {
  if (!d) return '—';
  try {
    return new Intl.DateTimeFormat('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(d));
  } catch { return d; }
}

function Rule() { return <div className="h-px bg-white/[0.06]" />; }

// ─── Delete confirm modal ─────────────────────────────────────────────────────

function DeleteModal({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        className="bg-[#1e1e1e] border border-white/[0.08] rounded-2xl w-full max-w-md p-8"
      >
        <div className="size-12 bg-[#b56060]/10 border border-[#b56060]/20 rounded-2xl flex items-center justify-center mb-6">
          <Trash2 className="size-5 text-[#b56060]" />
        </div>
        <h3 className="text-[18px] font-medium text-[#EAE8E1] mb-2">Usuń trwale</h3>
        <p className="text-[15px] text-[#A3A09A] leading-relaxed mb-2">
          Czy na pewno chcesz trwale usunąć kampanię <span className="text-[#EAE8E1] font-medium">"{name}"</span> z archiwum?
        </p>
        <p className="text-[14px] text-[#827E78] leading-relaxed mb-8">
          Tej operacji nie można cofnąć. Wszystkie dane powiązane z kampanią przepadną.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 border border-white/[0.1] text-[#A3A09A] hover:text-[#EAE8E1] hover:border-white/[0.2] text-[14px] font-medium rounded-xl transition-all">
            Anuluj
          </button>
          <button onClick={onConfirm} className="flex-1 py-3 bg-[#b56060] hover:bg-[#c47070] text-white text-[14px] font-medium rounded-xl transition-all">
            Usuń trwale
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Archive confirm modal ────────────────────────────────────────────────────

function ArchiveModal({ name, onConfirm, onCancel }: { name: string; onConfirm: (skipWarning: boolean) => void; onCancel: () => void }) {
  const [skipWarning, setSkipWarning] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        className="bg-[#1e1e1e] border border-white/[0.08] rounded-2xl w-full max-w-md p-8"
      >
        <div className="size-12 bg-white/[0.04] border border-white/[0.08] rounded-2xl flex items-center justify-center mb-6">
          <Archive className="size-5 text-[#EAE8E1]" />
        </div>
        <h3 className="text-[18px] font-medium text-[#EAE8E1] mb-2">Zakończ i Archiwizuj</h3>
        <p className="text-[15px] text-[#A3A09A] leading-relaxed mb-2">
          Czy na pewno chcesz anulować kampanię <span className="text-[#EAE8E1] font-medium">"{name}"</span>?
        </p>
        <p className="text-[14px] text-[#827E78] leading-relaxed mb-6">
          Wszystkie maile oczekujące w kolejce zostaną anulowane, a kampania zostanie przeniesiona do archiwum.
        </p>

        <div className="flex items-center gap-3 mb-8 cursor-pointer group w-fit" onClick={() => setSkipWarning(!skipWarning)}>
          <div className={`size-4 rounded flex items-center justify-center border transition-colors ${skipWarning ? 'bg-[#EAE8E1] border-[#EAE8E1]' : 'border-white/[0.15] group-hover:border-white/[0.3]'}`}>
            {skipWarning && <Check className="size-3 text-[#1A1A1A]" strokeWidth={3} />}
          </div>
          <span className="text-[13px] text-[#827E78] group-hover:text-[#A3A09A] transition-colors select-none">Nie pokazuj ponownie</span>
        </div>

        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 border border-white/[0.1] text-[#A3A09A] hover:text-[#EAE8E1] hover:border-white/[0.2] text-[14px] font-medium rounded-xl transition-all">
            Wróć
          </button>
          <button onClick={() => onConfirm(skipWarning)} className="flex-1 py-3 bg-[#EAE8E1] hover:bg-white text-[#1A1A1A] text-[14px] font-medium rounded-xl transition-all">
            Zakończ kampanię
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Mail preview drawer ──────────────────────────────────────────────────────

function MailPreview({ lead, onClose }: { lead: CampaignLead; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 z-30 bg-black/40"
      />
      <motion.div
        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.18 }}
        className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-[#1a1a1a] border-l border-white/[0.08] z-40 flex flex-col shadow-2xl"
      >
        <div className="flex items-center justify-between px-8 py-6 border-b border-white/[0.06]">
          <div>
            <p className="text-[16px] font-medium text-[#EAE8E1]">{lead.company_name}</p>
            <p className="text-[13px] text-[#827E78] mt-0.5">{lead.email}</p>
          </div>
          <button onClick={onClose} className="p-2 text-[#827E78] hover:text-[#EAE8E1] hover:bg-white/[0.06] rounded-lg transition-all">
            <X className="size-4" />
          </button>
        </div>

        <div className="px-8 py-4 border-b border-white/[0.06] flex items-center gap-5 text-[13px] text-[#827E78]">
          <span>Wysłano: <span className="text-[#A3A09A]">{formatDate(lead.sent_at)}</span></span>
          <span className="text-white/[0.1]">·</span>
          <span>Ze skrzynki: <span className="text-[#A3A09A]">{lead.sent_from || '—'}</span></span>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6">
          {lead.mail_content ? (
            <p className="text-[15px] text-[#EAE8E1] leading-[1.8] whitespace-pre-wrap font-sans font-bold">
              {lead.mail_content}
            </p>
          ) : (
            <p className="text-[14px] text-[#827E78]">Brak treści do wyświetlenia.</p>
          )}
        </div>

        <div className="px-8 py-5 border-t border-white/[0.06]">
          <button className="flex items-center gap-2 text-[13px] font-medium text-[#827E78] hover:text-[#EAE8E1] transition-colors">
            <Download className="size-4" /> Eksportuj jako .txt
          </button>
        </div>
      </motion.div>
    </>
  );
}

// ─── Campaign Detail ──────────────────────────────────────────────────────────

function CampaignDetail({ campaign: initialCampaign, onBack }: { campaign: Campaign; onBack: () => void }) {
  const [campaign, setCampaign] = useState<Campaign>(initialCampaign);
  const [leads, setLeads] = useState<CampaignLead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [previewLead, setPreviewLead] = useState<CampaignLead | null>(null);

  useEffect(() => {
    const fetchLeads = async () => {
      setLoadingLeads(true); 
      try {
        const { data: emails } = await supabase
          .from('campaign_emails')
          .select('id, lead_id, subject, body, status, scheduled_at')
          .eq('campaign_id', campaign.id)
          .order('created_at', { ascending: true });

        if (!emails || emails.length === 0) {
          setLeads([]);
          setLoadingLeads(false);
          return;
        }

        const leadIds = emails.map((e: any) => e.lead_id).filter(Boolean);
        const { data: leadsData } = await supabase
          .from('user_leads')
          .select('id, global_leads(company_name, email)')
          .in('id', leadIds);

        const leadMap = new Map((leadsData || []).map((l: any) => [l.id, l]));

        const mapped: CampaignLead[] = emails.map((email: any) => {
          const leadRow = leadMap.get(email.lead_id) as any;
          const gl = leadRow?.global_leads;
          return {
            id: email.id,
            company_name: gl?.company_name || 'Nieznana firma',
            email: gl?.email || '—',
            status: mapDbEmailStatus(email.status),
            sent_at: email.scheduled_at || null,
            sent_from: null,
            mail_content: email.body || null,
            priority: false,
          };
        });

        setLeads(mapped);
      } catch (err) {
        console.error('Błąd pobierania leadów kampanii:', err);
      } finally {
        setLoadingLeads(false);
      }
    };

    fetchLeads();
  }, [campaign.id]);

  const togglePriority = (id: string) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, priority: !l.priority } : l));
  };

  const markReplied = async (id: string) => {
    await supabase.from('campaign_emails').update({ status: 'replied' }).eq('id', id);
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status: 'replied' as LeadStatus } : l));
  };

  const togglePause = async () => {
    const newStatus = campaign.status === 'active' ? 'paused' : 'active';
    await supabase.from('campaigns').update({ status: newStatus }).eq('id', campaign.id);
    setCampaign(prev => ({ ...prev, status: newStatus as CampaignStatus }));
  };

  const pct = campaign.total > 0 ? (campaign.sent / campaign.total) * 100 : 0;
  const st = statusLabel(campaign.status);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">

      <div>
        <button onClick={onBack} className="flex items-center gap-2 text-[13px] text-[#827E78] hover:text-[#EAE8E1] transition-colors mb-6">
          <ArrowLeft className="size-4" /> Wszystkie kampanie
        </button>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-[28px] font-sans font-bold text-[#EAE8E1] tracking-tight">{campaign.name}</h1>
              <span className={`text-[12px] font-medium px-3 py-1.5 rounded-full ${st.cls}`}>{st.label}</span>
            </div>
            <p className="text-[14px] text-[#827E78]">
              Utworzona {formatDate(campaign.created_at)}
              {campaign.estimated_end && campaign.status !== 'completed' && (
                <> · Szacowane zakończenie: <span className="text-[#A3A09A]">{campaign.estimated_end}</span></>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {campaign.status === 'active' && (
              <button onClick={togglePause} className="flex items-center gap-2 px-4 py-2.5 border border-white/[0.1] hover:border-white/[0.2] text-[#A3A09A] hover:text-[#EAE8E1] text-[13px] font-medium rounded-xl transition-all">
                <Pause className="size-3.5" /> Wstrzymaj
              </button>
            )}
            {campaign.status === 'paused' && (
              <button onClick={togglePause} className="flex items-center gap-2 px-4 py-2.5 border border-white/[0.1] hover:border-white/[0.2] text-[#A3A09A] hover:text-[#EAE8E1] text-[13px] font-medium rounded-xl transition-all">
                <Play className="size-3.5" /> Wznów
              </button>
            )}
            <button className="flex items-center gap-2 px-4 py-2.5 border border-white/[0.1] hover:border-white/[0.2] text-[#A3A09A] hover:text-[#EAE8E1] text-[13px] font-medium rounded-xl transition-all">
              <Download className="size-3.5" /> Eksport CSV
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6 text-[14px] py-5 border-y border-white/[0.06]">
        {[
          { label: 'Wysłanych', value: campaign.sent },
          { label: 'Odpowiedzi', value: campaign.replies },
          { label: 'Odbitych', value: campaign.bounced },
          { label: 'W kolejce', value: campaign.queued },
        ].map((s, i) => (
          <div key={s.label} className="flex items-center gap-6">
            {i > 0 && <div className="h-4 w-px bg-white/[0.08]" />}
            <div>
              <span className="text-[24px] font-medium text-[#EAE8E1] tracking-tight">{s.value}</span>
              <span className="text-[#827E78] ml-2">{s.label}</span>
            </div>
          </div>
        ))}
        <div className="flex-1 ml-4">
          <div className="flex justify-between text-[12px] text-[#827E78] mb-2">
            <span>Postęp wysyłki</span>
            <span className="font-mono">{campaign.sent} / {campaign.total}</span>
          </div>
          <div className="h-px bg-white/[0.06] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-[#A3A09A] rounded-full"
            />
          </div>
        </div>
      </div>

      {campaign.status === 'active' && (
        <div className="flex items-start gap-3 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
          <Info className="size-4 text-[#827E78] shrink-0 mt-0.5" />
          <p className="text-[13px] text-[#827E78] leading-relaxed">
            Wysyłka jest celowo rozłożona w czasie — ok. 40 maili dziennie w losowych odstępach między 9:00 a 15:00.
            Chroni to reputację Twojej domeny i minimalizuje ryzyko trafienia do spamu.
            Podłącz więcej skrzynek w <span className="text-[#A3A09A] cursor-pointer hover:text-[#EAE8E1] transition-colors">ustawieniach</span>, żeby wysyłać szybciej.
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/[0.06] text-[11px] font-medium text-[#3a3a3a] uppercase tracking-wider">
          <div className="col-span-4">Firma</div>
          <div className="col-span-3">E-mail</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Wysłano</div>
          <div className="col-span-1"></div>
        </div>

        {loadingLeads ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-5 text-[#827E78] animate-spin" />
          </div>
        ) : leads.length === 0 ? (
          <div className="px-6 py-10 text-center text-[13px] text-[#827E78]">
            Brak leadów przypisanych do tej kampanii.
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {leads.map(lead => {
              const ls = leadStatusLabel(lead.status);
              return (
                <div key={lead.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-white/[0.02] transition-all">

                  <div className="col-span-4 flex items-center gap-2.5">
                    {lead.priority && (
                      <span className="size-1.5 bg-[#a3956a] rounded-full shrink-0" title="Priorytet" />
                    )}
                    <p className="text-[14px] font-medium text-[#EAE8E1] truncate">{lead.company_name}</p>
                  </div>

                  <div className="col-span-3">
                    <p className="text-[13px] text-[#827E78] truncate">{lead.email}</p>
                  </div>

                  <div className="col-span-2">
                    <div className={`flex items-center gap-1.5 text-[12px] font-medium ${ls.cls}`}>
                      {ls.icon}
                      {ls.label}
                      {lead.status === 'bounced' && (
                        <span className="ml-1 text-[10px] text-[#5d9970]" title="Kredyty zostają zwrócone">+kredyty</span>
                      )}
                    </div>
                  </div>

                  <div className="col-span-2">
                    <p className="text-[12px] text-[#3a3a3a]">{lead.sent_at ? formatDate(lead.sent_at) : '—'}</p>
                  </div>

                  <div className="col-span-1 flex items-center justify-end gap-1">
                    {(lead.status === 'sent' || lead.status === 'replied') && (
                      <button onClick={() => setPreviewLead(lead)} className="p-1.5 text-[#3a3a3a] hover:text-[#A3A09A] hover:bg-white/[0.06] rounded-lg transition-all" title="Podgląd maila">
                        <Eye className="size-3.5" />
                      </button>
                    )}
                    {lead.status === 'sent' && (
                      <button onClick={() => markReplied(lead.id)} className="p-1.5 text-[#3a3a3a] hover:text-[#5d9970] hover:bg-[#5d9970]/5 rounded-lg transition-all" title="Oznacz jako odpowiedział">
                        <Check className="size-3.5" />
                      </button>
                    )}
                    {lead.status === 'queued' && (
                      <button onClick={() => togglePriority(lead.id)} className={`p-1.5 rounded-lg transition-all ${lead.priority ? 'text-[#a3956a]' : 'text-[#2e2e2e] hover:text-[#a3956a]'} hover:bg-white/[0.04]`} title={lead.priority ? 'Usuń priorytet' : 'Ustaw jako priorytet'}>
                        <ChevronUp className="size-3.5" />
                      </button>
                    )}
                    {lead.mail_content && lead.status !== 'sent' && lead.status !== 'replied' && (
                      <button onClick={() => setPreviewLead(lead)} className="p-1.5 text-[#3a3a3a] hover:text-[#A3A09A] hover:bg-white/[0.06] rounded-lg transition-all" title="Podgląd maila">
                        <Eye className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {previewLead && (
          <MailPreview lead={previewLead} onClose={() => setPreviewLead(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Campaigns List ───────────────────────────────────────────────────────────

function CampaignsList({ onSelect }: { onSelect: (c: Campaign) => void }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  const [deleteTarget, setDeleteTarget] = useState<Campaign | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Campaign | null>(null);
  const [skipArchiveWarning, setSkipArchiveWarning] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [toast, setToast] = useState<{ icon: any, text: string, type: 'success' | 'error' } | null>(null);

  const [isCreatorOpen, setIsCreatorOpen] = useState(false);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      const { data, error } = await supabase
        .from('campaigns')
        .select('id, name, status, created_at, sent_count, total_count, replies_count')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
        
      if (error) console.error("Error fetching campaigns:", error);
      if (data) setCampaigns(data.map(mapDbCampaign));
    } catch (err) {
      console.error('Błąd pobierania kampanii:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  const filteredCampaigns = campaigns.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCampaignsList = campaigns.filter(c => !c.isArchived);
  const displayedActive = filteredCampaigns.filter(c => !c.isArchived);
  const displayedArchived = filteredCampaigns.filter(c => c.isArchived);

  const totalSent = activeCampaignsList.reduce((sum, c) => sum + c.sent, 0);
  const totalQueued = activeCampaignsList.reduce((sum, c) => sum + c.queued, 0);
  const totalBounced = activeCampaignsList.reduce((sum, c) => sum + c.bounced, 0);

  const showToast = (Icon: any, text: string, type: 'success' | 'error' = 'success') => {
    setToast({ icon: Icon, text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const togglePause = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const c = campaigns.find(x => x.id === id);
    if (!c) return;
    const newStatus = c.status === 'active' ? 'paused' : 'active';
    
    const { error } = await supabase.from('campaigns').update({ status: newStatus }).eq('id', id);
    
    if (error) {
      showToast(AlertCircle, 'Nie udało się zmienić statusu: ' + error.message, 'error');
      return;
    }

    setCampaigns(prev => prev.map(x => {
      if (x.id === id) {
        showToast(newStatus === 'active' ? Play : Pause, newStatus === 'active' ? 'Kampania wznowiona' : 'Kampania wstrzymana');
        return { ...x, status: newStatus as CampaignStatus };
      }
      return x;
    }));
  };

  const handleArchiveClick = (c: Campaign, e: React.MouseEvent) => {
    e.stopPropagation();
    if (skipArchiveWarning) {
      executeArchive(c.id);
    } else {
      setArchiveTarget(c);
    }
  };

  const executeArchive = async (id: string, updateSkipWarning: boolean = false) => {
    if (updateSkipWarning) setSkipArchiveWarning(true);
    
    const { error } = await supabase.from('campaigns').update({ status: 'archived' }).eq('id', id);

    if (error) {
      showToast(AlertCircle, 'Błąd zapisu do bazy. Sprawdź statusy w SQL.', 'error');
      setArchiveTarget(null);
      return;
    }

    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: 'canceled' as CampaignStatus, isArchived: true } : c));
    setArchiveTarget(null);
    showToast(Archive, 'Przeniesiono do archiwum');
  };

  const handlePermanentDelete = async (c: Campaign) => {
    const { error } = await supabase.from('campaigns').delete().eq('id', c.id);

    if (error) {
      showToast(AlertCircle, 'Błąd usuwania kampanii.', 'error');
      setDeleteTarget(null);
      return;
    }

    setCampaigns(prev => prev.filter(x => x.id !== c.id));
    setDeleteTarget(null);
    showToast(Trash2, 'Kampania została trwale usunięta');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12 relative">

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[28px] font-sans font-bold text-[#EAE8E1] tracking-tight">Kampanie</h1>
          <p className="text-[15px] text-[#A3A09A] mt-1.5">Zarządzaj kampaniami i śledź postęp wysyłki</p>
        </div>
        <button onClick={() => setIsCreatorOpen(true)} className="flex items-center gap-2.5 px-5 py-3 bg-[#EAE8E1] hover:bg-white text-[#1A1A1A] text-[14px] font-medium rounded-xl transition-all">
          <Plus className="size-4" /> Nowa kampania
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 text-[#827E78] animate-spin" />
        </div>
      ) : activeCampaignsList.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-white/[0.08]">
          <div className="size-12 bg-white/[0.04] rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Mail className="size-6 text-[#A3A09A]" />
          </div>
          <p className="text-[16px] text-[#EAE8E1] mb-1">Brak kampanii</p>
          <p className="text-[14px] text-[#A3A09A] mb-7 max-w-xs mx-auto leading-relaxed">
            Stwórz pierwszą kampanię i zacznij wysyłać spersonalizowane maile.
          </p>
          <button onClick={() => setIsCreatorOpen(true)} className="inline-flex items-center gap-2 px-6 py-3 bg-[#EAE8E1] hover:bg-white text-[#1A1A1A] text-[14px] font-medium rounded-xl transition-all">
            <Plus className="size-4" /> Nowa kampania
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-5 border-y border-white/[0.06] gap-4">
            <div className="flex flex-wrap items-center gap-6 text-[14px]">
              {[
                { label: 'Wysłanych', value: totalSent },
                { label: 'W kolejce', value: totalQueued },
                { label: 'Zwrócone kredyty', value: totalBounced },
              ].map((s, i) => (
                <div key={s.label} className="flex items-center gap-6">
                  {i > 0 && <div className="hidden sm:block h-4 w-px bg-white/[0.08]" />}
                  <div>
                    <span className="text-[24px] font-medium text-[#EAE8E1] tracking-tight">{s.value}</span>
                    <span className="text-[#827E78] ml-2">{s.label}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              <AnimatePresence>
                {showFilters && (
                  <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="overflow-hidden">
                    <div className="relative w-48 mr-2">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[#827E78]" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Szukaj..."
                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg pl-8 pr-3 py-2 text-[12px] text-[#EAE8E1] placeholder:text-[#827E78] outline-none focus:border-white/[0.2]"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <button onClick={() => setShowFilters(!showFilters)} className={`p-2 rounded-xl border transition-colors ${showFilters ? 'bg-white/[0.08] border-white/[0.15] text-[#EAE8E1]' : 'border-transparent text-[#827E78] hover:text-[#EAE8E1] hover:bg-white/[0.04]'}`}>
                <SlidersHorizontal className="size-4" />
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/[0.06] text-[11px] font-medium text-[#3a3a3a] uppercase tracking-wider">
              <div className="col-span-4">Nazwa kampanii</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-4">Postęp i statystyki</div>
              <div className="col-span-2"></div>
            </div>

            <div className="divide-y divide-white/[0.04]">
              {displayedActive.length === 0 ? (
                <div className="px-6 py-8 text-center text-[13px] text-[#827E78]">Brak wyników wyszukiwania.</div>
              ) : (
                displayedActive.map(campaign => {
                  const st = statusLabel(campaign.status);
                  const pct = campaign.total > 0 ? (campaign.sent / campaign.total) * 100 : 0;

                  return (
                    <div
                      key={campaign.id}
                      className="grid grid-cols-12 gap-4 px-6 py-5 items-center hover:bg-white/[0.02] transition-all cursor-pointer group"
                      onClick={() => onSelect(campaign)}
                    >
                      <div className="col-span-4">
                        <p className="text-[15px] font-medium text-[#EAE8E1] group-hover:text-white transition-colors truncate pr-2">
                          {campaign.name}
                        </p>
                        <p className="text-[12px] text-[#3a3a3a] mt-0.5">{formatDate(campaign.created_at)}</p>
                      </div>

                      <div className="col-span-2">
                        <span className={`text-[12px] font-medium px-2.5 py-1 rounded-full ${st.cls}`}>
                          {st.label}
                        </span>
                      </div>

                      <div className="col-span-4 pr-2 xl:pr-6">
                        <div className="flex items-center gap-2 lg:gap-2.5 text-[11.5px] lg:text-[12px] text-[#827E78] mb-2 whitespace-nowrap">
                          <span><span className="text-[#A3A09A] font-mono">{campaign.sent}</span> wysłanych</span>
                          <span>·</span>
                          <span><span className="text-[#5d9970] font-mono">{campaign.replies}</span> odpowiedzi</span>
                          <span>·</span>
                          <span><span className="text-[#827E78] font-mono">{campaign.queued}</span> w kolejce</span>
                        </div>
                        <div className="h-px bg-white/[0.06] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#A3A09A] rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      <div className="col-span-2 flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                        {(campaign.status === 'active' || campaign.status === 'paused') && (
                          <button
                            onClick={(e) => togglePause(campaign.id, e)}
                            className="p-2 text-[#827E78] hover:text-[#EAE8E1] hover:bg-white/[0.06] rounded-lg transition-all"
                            title={campaign.status === 'active' ? 'Wstrzymaj' : 'Wznów'}
                          >
                            {campaign.status === 'active' ? <Pause className="size-4" /> : <Play className="size-4" />}
                          </button>
                        )}
                        <button
                          onClick={(e) => handleArchiveClick(campaign, e)}
                          className="p-2 text-[#827E78] hover:text-[#a3956a] hover:bg-[#a3956a]/10 rounded-lg transition-all"
                          title="Zakończ i przenieś do archiwum"
                        >
                          <X className="size-4" />
                        </button>
                        <ArrowRight className="size-4 text-[#827E78] group-hover:text-[#EAE8E1] transition-colors ml-1" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}

      <div className="pt-8">
        <button onClick={() => setIsArchiveOpen(!isArchiveOpen)} className="flex items-center w-full gap-4 group cursor-pointer outline-none">
          <span className="text-[12px] font-medium uppercase tracking-wider text-[#827E78] group-hover:text-[#A3A09A] transition-colors">Archiwum ({displayedArchived.length})</span>
          <div className="flex-1 h-px bg-white/[0.04] group-hover:bg-white/[0.08] transition-colors" />
          <ChevronDown className={`size-4 text-[#827E78] group-hover:text-[#A3A09A] transition-all ${isArchiveOpen ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {isArchiveOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="mt-4">
                {displayedArchived.length === 0 ? (
                  <div className="py-8 text-center text-[13px] text-[#827E78]">Archiwum jest puste.</div>
                ) : (
                  <div className="divide-y divide-white/[0.02]">
                    {displayedArchived.map(campaign => {
                      const st = statusLabel(campaign.status);
                      return (
                        <div key={campaign.id} className="flex items-center justify-between py-3 group cursor-pointer" onClick={() => onSelect(campaign)}>
                          <div className="flex items-center gap-6">
                            <div className="w-64">
                              <p className="text-[13px] font-medium text-[#A3A09A] group-hover:text-[#EAE8E1] transition-colors truncate">{campaign.name}</p>
                            </div>
                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${st.cls}`}>{st.label}</span>
                            <span className="text-[12px] text-[#827E78] font-mono whitespace-nowrap">{campaign.sent} wysłanych</span>
                          </div>

                          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                            <button onClick={() => setDeleteTarget(campaign)} className="p-1.5 text-[#827E78] hover:text-[#b56060] hover:bg-[#b56060]/10 rounded-lg transition-all" title="Trwale usuń z bazy">
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {deleteTarget && (
          <DeleteModal
            name={deleteTarget.name}
            onConfirm={() => handlePermanentDelete(deleteTarget)}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {archiveTarget && (
          <ArchiveModal
            name={archiveTarget.name}
            onConfirm={(skip) => executeArchive(archiveTarget.id, skip)}
            onCancel={() => setArchiveTarget(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: 20, x: '-50%' }} 
            className={`fixed bottom-8 left-1/2 z-50 border shadow-2xl rounded-full px-5 py-2.5 flex items-center gap-2 ${
              toast.type === 'error' ? 'bg-[#b56060]/10 border-[#b56060]/20 text-[#b56060]' : 'bg-[#1A1A1A] border-white/[0.1] text-[#EAE8E1]'
            }`}>
            <toast.icon className="size-4" />
            <span className="text-[13px] font-medium">{toast.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <CampaignCreator
        isOpen={isCreatorOpen}
        onClose={() => { setIsCreatorOpen(false); fetchCampaigns(); }}
      />
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export function CampaignsPage() {
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  return (
    <AnimatePresence mode="wait">
      {selectedCampaign ? (
        <motion.div
          key="detail"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.14 }}
        >
          <CampaignDetail campaign={selectedCampaign} onBack={() => setSelectedCampaign(null)} />
        </motion.div>
      ) : (
        <motion.div
          key="list"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.14 }}
        >
          <CampaignsList onSelect={setSelectedCampaign} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}