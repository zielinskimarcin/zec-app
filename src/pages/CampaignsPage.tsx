import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, ArrowLeft, Loader2, Mail, Check, Clock,
  AlertCircle, Trash2, Pause, Play,
  X, Download, ArrowRight, Info, Archive, SlidersHorizontal, Search, ChevronDown,
  ChevronLeft, ChevronRight, Edit3, Building2, Globe, Hash, Save, RotateCcw,
  GripVertical, Zap
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CampaignCreator } from "../components/CampaignCreator";

// ─── Types ────────────────────────────────────────────────────────────────────

type CampaignStatus = 'active' | 'paused' | 'completed' | 'draft' | 'canceled';
type LeadStatus = 'pending_review' | 'queued' | 'paused' | 'processing' | 'sent' | 'replied' | 'bounced' | 'skipped';

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
  lead_id: string | null;
  company_name: string;
  email: string;
  status: LeadStatus;
  raw_status: string | null;
  sent_at: string | null;
  scheduled_at: string | null;
  sent_from: string | null;
  subject: string | null;
  mail_content: string | null;
  website: string | null;
  city: string | null;
  industry: string | null;
  person: string | null;
  summary: string | null;
  instagramData: any;
  linkedinData: any;
  isGenerating: boolean;
  priority: boolean;
  queue_position: number;
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
    pending_review: { label: 'Do akceptacji', cls: 'text-[#a3956a]',  icon: <Edit3 className="size-3.5" /> },
    queued:  { label: 'W kolejce',    cls: 'text-[#827E78]',  icon: <Clock className="size-3.5" /> },
    paused:  { label: 'Wstrzymana',   cls: 'text-[#a3956a]',  icon: <Pause className="size-3.5" /> },
    processing: { label: 'Wysyłanie', cls: 'text-[#a3956a]',  icon: <Loader2 className="size-3.5" /> },
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
    case 'paused': return 'paused';
    case 'processing': return 'processing';
    case 'sent': return 'sent';
    case 'replied': return 'replied';
    case 'bounced': return 'bounced';
    case 'failed': return 'skipped';
    case 'pending_review': return 'pending_review';
    default: return 'queued';
  }
}

function deriveCampaignStatsFromStatuses(statuses: Array<string | null>) {
  const sent = statuses.filter(s => s === 'sent' || s === 'replied').length;
  const replies = statuses.filter(s => s === 'replied').length;
  const bounced = statuses.filter(s => s === 'bounced').length;
  const queued = statuses.filter(s => s === 'queued' || s === 'processing').length;
  const total = statuses.filter(s => s !== 'failed').length;
  return { sent, replies, bounced, queued, total };
}

function mapDbCampaign(c: any): Campaign {
  const isArchived = c.status === 'archived';
  let status: CampaignStatus = isArchived ? 'canceled' : (c.status as CampaignStatus) ?? 'draft';
  const emailStatuses = Array.isArray(c.campaign_emails)
    ? c.campaign_emails.map((email: any) => email.status ?? null)
    : [];
  const stats = emailStatuses.length > 0
    ? deriveCampaignStatsFromStatuses(emailStatuses)
    : {
        sent: c.sent_count ?? 0,
        replies: c.replies_count ?? 0,
        bounced: 0,
        queued: Math.max(0, (c.total_count ?? 0) - (c.sent_count ?? 0)),
        total: c.total_count ?? 0,
      };
  return {
    id: c.id,
    name: c.name,
    status,
    created_at: c.created_at,
    sent: stats.sent,
    total: stats.total,
    replies: stats.replies,
    bounced: stats.bounced,
    queued: stats.queued,
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

function CampaignMailReview({
  campaign,
  leads,
  initialIndex,
  onClose,
  onUpdateLead,
  onAcceptLead,
  onSkipLead,
  onRestoreLead,
  onTogglePriority,
  onToggleReplied,
}: {
  campaign: Campaign;
  leads: CampaignLead[];
  initialIndex: number;
  onClose: () => void;
  onUpdateLead: (lead: CampaignLead) => void;
  onAcceptLead: (lead: CampaignLead) => Promise<void>;
  onSkipLead: (lead: CampaignLead) => Promise<void>;
  onRestoreLead: (lead: CampaignLead) => Promise<void>;
  onTogglePriority: (lead: CampaignLead) => Promise<void>;
  onToggleReplied: (lead: CampaignLead) => Promise<void>;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [acting, setActing] = useState(false);
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');

  useEffect(() => {
    setCurrentIndex(Math.min(initialIndex, Math.max(0, leads.length - 1)));
  }, [initialIndex, leads.length]);

  const lead = leads[currentIndex];

  useEffect(() => {
    if (!lead) return;
    setEditing(false);
    setEditSubject(lead.subject || '');
    setEditBody(lead.mail_content || '');
  }, [lead?.id]);

  if (!lead) return null;

  const ls = leadStatusLabel(lead.status);
  const canEdit = lead.status !== 'sent' && lead.status !== 'replied' && lead.status !== 'processing' && !lead.isGenerating;
  const canAccept = lead.raw_status === 'pending_review' && !lead.isGenerating && !!lead.mail_content;
  const canSkip = (lead.status === 'pending_review' || lead.status === 'queued' || lead.status === 'paused') && !lead.isGenerating;
  const canRestore = lead.status === 'skipped';
  const canPrioritize = lead.status === 'queued';
  const canToggleReply = lead.status === 'sent' || lead.status === 'replied';
  const timingLabel = lead.sent_at
    ? `Wysłany: ${formatDate(lead.sent_at)}`
    : lead.scheduled_at
      ? `Zaplanowany: ${formatDate(lead.scheduled_at)}`
      : lead.isGenerating
        ? 'Generowanie w toku'
        : lead.status === 'paused'
          ? 'Wstrzymana'
        : lead.status === 'pending_review'
          ? 'Czeka na akceptację'
          : 'Bez terminu wysyłki';
  const socialNotes = [lead.instagramData, lead.linkedinData]
    .filter(Boolean)
    .map(item => typeof item === 'string' ? item : JSON.stringify(item))
    .join('\n\n');

  const startEditing = () => {
    setEditSubject(lead.subject || '');
    setEditBody(lead.mail_content || '');
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!canEdit) return;
    setSaving(true);
    const { error } = await supabase
      .from('campaign_emails')
      .update({ subject: editSubject, body: editBody })
      .eq('id', lead.id);

    if (!error) {
      onUpdateLead({ ...lead, subject: editSubject, mail_content: editBody });
      setEditing(false);
    } else {
      console.error('Nie udało się zapisać maila:', error);
    }
    setSaving(false);
  };

  const findNextReviewIndex = () => {
    const isReviewTarget = (item: CampaignLead) => item.isGenerating || item.status === 'pending_review';
    const after = leads.findIndex((item, index) => index > currentIndex && isReviewTarget(item));
    if (after >= 0) return after;
    return leads.findIndex((item, index) => index < currentIndex && isReviewTarget(item));
  };

  const runAction = async (action: () => Promise<void>, advance = false) => {
    setActing(true);
    try {
      await action();
      if (advance) {
        const nextIndex = findNextReviewIndex();
        if (nextIndex >= 0) setCurrentIndex(nextIndex);
      }
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 12 }}
        transition={{ duration: 0.18 }}
        className="relative w-full max-w-[1280px] h-[88vh] min-h-[600px] bg-[#0f0f0f] border border-white/[0.08] rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-8 py-5 border-b border-white/[0.06] bg-[#1A1A1A] shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-3 min-w-0">
              <h2 className="text-[17px] font-serif text-[#EAE8E1] tracking-tight truncate">{campaign.name}</h2>
              <span className={`flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-full shrink-0 ${ls.cls}`}>
                {lead.isGenerating ? <Loader2 className="size-3.5 animate-spin" /> : ls.icon}
                {lead.isGenerating ? 'Generuje się' : ls.label}
              </span>
            </div>
            <p className="text-[12px] text-[#827E78] mt-1 truncate">
              {lead.company_name} · {currentIndex + 1} z {leads.length} · {timingLabel}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {canPrioritize && (
              <button
                onClick={() => runAction(() => onTogglePriority(lead))}
                disabled={acting}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[12px] font-medium transition-all ${lead.priority ? 'border-[#a3956a]/30 text-[#a3956a] bg-[#a3956a]/10' : 'border-white/[0.1] text-[#A3A09A] hover:text-[#EAE8E1] hover:border-white/[0.2]'}`}
              >
                <Zap className="size-3.5" /> {lead.priority ? 'Priorytet' : 'Priorytetyzuj'}
              </button>
            )}
            <button onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))} disabled={currentIndex === 0} className="p-2.5 rounded-xl border border-white/[0.1] text-[#A3A09A] hover:text-[#EAE8E1] hover:border-white/[0.2] disabled:opacity-30 transition-all" title="Poprzedni mail">
              <ChevronLeft className="size-4" />
            </button>
            <button onClick={() => setCurrentIndex(prev => Math.min(leads.length - 1, prev + 1))} disabled={currentIndex === leads.length - 1} className="p-2.5 rounded-xl border border-white/[0.1] text-[#A3A09A] hover:text-[#EAE8E1] hover:border-white/[0.2] disabled:opacity-30 transition-all" title="Następny mail">
              <ChevronRight className="size-4" />
            </button>
            <button onClick={onClose} className="p-2 text-[#827E78] hover:text-[#EAE8E1] hover:bg-white/[0.06] rounded-lg transition-all">
              <X className="size-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="grid grid-cols-12 h-full overflow-hidden">
            <div className="col-span-12 lg:col-span-7 bg-[#F7F5EF] text-[#1A1A1A] p-8 overflow-hidden">
              {lead.isGenerating ? (
                <div className="h-full flex items-center justify-center">
                  <div className="w-full max-w-md bg-white border border-black/[0.06] shadow-sm rounded-sm p-8 animate-pulse">
                    <div className="h-3 bg-black/[0.08] rounded w-2/3 mb-8" />
                    <div className="space-y-3">
                      <div className="h-3 bg-black/[0.08] rounded w-full" />
                      <div className="h-3 bg-black/[0.08] rounded w-11/12" />
                      <div className="h-3 bg-black/[0.08] rounded w-10/12" />
                      <div className="h-3 bg-black/[0.08] rounded w-9/12" />
                    </div>
                    <div className="space-y-3 mt-8">
                      <div className="h-3 bg-black/[0.08] rounded w-11/12" />
                      <div className="h-3 bg-black/[0.08] rounded w-8/12" />
                    </div>
                  </div>
                </div>
              ) : editing ? (
                <div className="h-full flex flex-col gap-5">
                  <input value={editSubject} onChange={(e) => setEditSubject(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white border border-black/[0.08] text-[18px] font-medium outline-none focus:border-black/[0.18]" placeholder="Temat maila" />
                  <textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} className="flex-1 w-full px-4 py-4 rounded-xl bg-white border border-black/[0.08] text-[15px] leading-[1.8] font-serif outline-none resize-none focus:border-black/[0.18]" placeholder="Treść maila" />
                  <div className="flex justify-end gap-3">
                    <button onClick={() => setEditing(false)} className="px-4 py-2.5 text-[13px] font-medium text-[#5f5b55] hover:text-[#1A1A1A] transition-colors">Anuluj</button>
                    <button onClick={saveEdit} disabled={saving} className="flex items-center gap-2 px-4 py-2.5 bg-[#1A1A1A] hover:bg-[#2a2a2a] text-white text-[13px] font-medium rounded-xl transition-all disabled:opacity-50">
                      {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                      Zapisz zmiany
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-full bg-white border border-black/[0.06] shadow-sm p-8 overflow-y-auto">
                  <div className="flex items-start justify-between gap-4 mb-8">
                    <div>
                      <p className="text-[11px] font-medium text-[#8a8680] uppercase tracking-wider mb-2">Temat</p>
                      <h2 className="text-[22px] font-serif text-[#1A1A1A] leading-snug">{lead.subject || 'Bez tematu'}</h2>
                    </div>
                    {canEdit && (
                      <button onClick={startEditing} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-black/[0.08] text-[12px] font-medium text-[#5f5b55] hover:text-[#1A1A1A] hover:border-black/[0.16] transition-all">
                        <Edit3 className="size-3.5" /> Edytuj
                      </button>
                    )}
                  </div>
                  <p className="text-[15px] text-[#2a2a2a] leading-[1.9] whitespace-pre-wrap font-serif">
                    {lead.mail_content || 'Brak treści do wyświetlenia.'}
                  </p>
                </div>
              )}
            </div>

            <div className="col-span-12 lg:col-span-5 p-8 border-l border-white/[0.08] bg-[#1A1A1A] overflow-y-auto">
              <div className="space-y-6">
                <div>
                  <p className="text-[11px] font-medium text-[#3a3a3a] uppercase tracking-wider mb-3">Lead</p>
                  <h3 className="text-[22px] font-serif text-[#EAE8E1] leading-tight">{lead.company_name}</h3>
                  <p className="text-[13px] text-[#827E78] mt-2">{lead.email}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {lead.person && (
                    <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.03]">
                      <p className="flex items-center gap-2 text-[11px] text-[#827E78] mb-2"><Building2 className="size-3.5" /> Osoba</p>
                      <p className="text-[13px] text-[#EAE8E1]">{lead.person}</p>
                    </div>
                  )}
                  {lead.industry && (
                    <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.03]">
                      <p className="flex items-center gap-2 text-[11px] text-[#827E78] mb-2"><Hash className="size-3.5" /> Branża</p>
                      <p className="text-[13px] text-[#EAE8E1]">{lead.industry}</p>
                    </div>
                  )}
                  {lead.website && (
                    <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.03] col-span-2">
                      <p className="flex items-center gap-2 text-[11px] text-[#827E78] mb-2"><Globe className="size-3.5" /> WWW</p>
                      <p className="text-[13px] text-[#EAE8E1] break-all">{lead.website}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-[11px] font-medium text-[#3a3a3a] uppercase tracking-wider mb-2">Status maila</p>
                    <div className={`inline-flex items-center gap-2 text-[13px] font-medium ${ls.cls}`}>
                      {lead.isGenerating ? <Loader2 className="size-3.5 animate-spin" /> : ls.icon}
                      {lead.isGenerating ? 'Generuje się w tle' : ls.label}
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] font-medium text-[#3a3a3a] uppercase tracking-wider mb-2">Termin</p>
                    <p className="text-[13px] text-[#A3A09A]">{timingLabel}</p>
                  </div>

                  {lead.sent_from && (
                    <div>
                      <p className="text-[11px] font-medium text-[#3a3a3a] uppercase tracking-wider mb-2">Skrzynka</p>
                      <p className="text-[13px] text-[#A3A09A]">{lead.sent_from}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {canAccept && (
                    <button onClick={() => runAction(() => onAcceptLead(lead), true)} disabled={acting} className="flex items-center gap-2 px-4 py-2.5 bg-[#EAE8E1] hover:bg-white text-[#1A1A1A] text-[13px] font-medium rounded-xl transition-all disabled:opacity-50">
                      {acting ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />} Akceptuj
                    </button>
                  )}
                  {canSkip && (
                    <button onClick={() => runAction(() => onSkipLead(lead), true)} disabled={acting} className="flex items-center gap-2 px-4 py-2.5 border border-white/[0.1] hover:border-[#b56060]/30 text-[#827E78] hover:text-[#b56060] text-[13px] font-medium rounded-xl transition-all disabled:opacity-50">
                      <X className="size-3.5" /> Pomiń
                    </button>
                  )}
                  {canRestore && (
                    <button onClick={() => runAction(() => onRestoreLead(lead))} disabled={acting} className="flex items-center gap-2 px-4 py-2.5 border border-white/[0.1] hover:border-white/[0.2] text-[#A3A09A] hover:text-[#EAE8E1] text-[13px] font-medium rounded-xl transition-all disabled:opacity-50">
                      <RotateCcw className="size-3.5" /> Przywróć
                    </button>
                  )}
                  {canToggleReply && (
                    <button onClick={() => runAction(() => onToggleReplied(lead))} disabled={acting} className={`flex items-center gap-2 px-4 py-2.5 border text-[13px] font-medium rounded-xl transition-all disabled:opacity-50 ${lead.status === 'replied' ? 'border-[#5d9970]/30 text-[#5d9970] bg-[#5d9970]/10' : 'border-white/[0.1] text-[#827E78] hover:text-[#5d9970] hover:border-[#5d9970]/30'}`}>
                      <Check className="size-3.5" /> {lead.status === 'replied' ? 'Cofnij odpowiedź' : 'Odpowiedział'}
                    </button>
                  )}
                </div>

                {lead.summary && (
                  <div>
                    <p className="text-[11px] font-medium text-[#3a3a3a] uppercase tracking-wider mb-2">Informacje o firmie</p>
                    <p className="text-[13px] text-[#A3A09A] leading-relaxed whitespace-pre-wrap">{lead.summary}</p>
                  </div>
                )}

                {socialNotes && (
                  <div>
                    <p className="text-[11px] font-medium text-[#3a3a3a] uppercase tracking-wider mb-2">Sygnały z sociali</p>
                    <p className="text-[12px] text-[#827E78] leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">{socialNotes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Campaign Detail ──────────────────────────────────────────────────────────

function CampaignDetail({ campaign: initialCampaign, onBack }: { campaign: Campaign; onBack: () => void }) {
  const [campaign, setCampaign] = useState<Campaign>(initialCampaign);
  const [leads, setLeads] = useState<CampaignLead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [reviewIndex, setReviewIndex] = useState<number | null>(null);
  const [reorderMode, setReorderMode] = useState(false);
  const [draggingLeadId, setDraggingLeadId] = useState<string | null>(null);

  const fetchLeads = useCallback(async (showLoader = false) => {
    if (showLoader) setLoadingLeads(true);
    try {
      const { data: emails } = await supabase
        .from('campaign_emails')
        .select('id, lead_id, subject, body, status, scheduled_at, sent_at, sent_from_email, email_account_id, priority_score, queue_position, email_accounts(email_address)')
        .eq('campaign_id', campaign.id)
        .order('queue_position', { ascending: true })
        .order('created_at', { ascending: true });

      if (!emails || emails.length === 0) {
        setLeads([]);
        setCampaign(prev => ({ ...prev, sent: 0, replies: 0, bounced: 0, queued: 0, total: 0 }));
        return;
      }

      const leadIds = emails.map((e: any) => e.lead_id).filter(Boolean);
      let leadsData: any[] = [];
      if (leadIds.length > 0) {
        const { data } = await supabase
          .from('user_leads')
          .select('id, name, summary, instagram_data, linkedin_data, global_leads(company_name, email, website, city, industry)')
          .in('id', leadIds);
        leadsData = data || [];
      }

      const leadMap = new Map((leadsData || []).map((l: any) => [l.id, l]));

      const mapped: CampaignLead[] = emails.map((email: any) => {
        const leadRow = leadMap.get(email.lead_id) as any;
        const gl = leadRow?.global_leads;
        const isGenerating = email.status === 'pending_review' && !email.subject && !email.body;
        return {
          id: email.id,
          lead_id: email.lead_id || null,
          company_name: gl?.company_name || 'Nieznana firma',
          email: gl?.email || '—',
          status: mapDbEmailStatus(email.status),
          raw_status: email.status || null,
          sent_at: email.sent_at || null,
          scheduled_at: email.scheduled_at || null,
          sent_from: email.sent_from_email || email.email_accounts?.email_address || null,
          subject: email.subject || null,
          mail_content: email.body || null,
          website: gl?.website || null,
          city: gl?.city || null,
          industry: gl?.industry || null,
          person: leadRow?.name || null,
          summary: leadRow?.summary || null,
          instagramData: leadRow?.instagram_data || null,
          linkedinData: leadRow?.linkedin_data || null,
          isGenerating,
          priority: (email.priority_score ?? 0) > 0,
          queue_position: email.queue_position ?? 0,
        };
      });

      setLeads(mapped);
      const stats = deriveCampaignStatsFromStatuses(mapped.map(lead => lead.raw_status));
      setCampaign(prev => ({ ...prev, ...stats }));
    } catch (err) {
      console.error('Błąd pobierania leadów kampanii:', err);
    } finally {
      setLoadingLeads(false);
    }
  }, [campaign.id]);

  useEffect(() => {
    fetchLeads(true);
    const interval = window.setInterval(() => fetchLeads(false), 5000);
    return () => window.clearInterval(interval);
  }, [fetchLeads]);

  const togglePriority = async (lead: CampaignLead) => {
    const { error } = await supabase.rpc('zec_set_campaign_email_priority', {
      p_email_id: lead.id,
      p_priority: !lead.priority,
    });
    if (error) {
      console.error('Nie udało się zmienić priorytetu:', error);
      return;
    }
    await fetchLeads(false);
  };

  const isReorderableLead = (lead: CampaignLead) => lead.status === 'queued' || lead.status === 'paused';

  const persistQueueOrder = async (orderedLeads: CampaignLead[]) => {
    await Promise.all(orderedLeads.map((lead, index) =>
      supabase
        .from('campaign_emails')
        .update({ queue_position: index + 1 })
        .eq('id', lead.id)
    ));
    if (campaign.status === 'active') await rescheduleCampaign();
    await fetchLeads(false);
  };

  const handleDragOverLead = (targetLead: CampaignLead, event: React.DragEvent<HTMLDivElement>) => {
    if (!reorderMode || !draggingLeadId || draggingLeadId === targetLead.id || !isReorderableLead(targetLead)) return;
    event.preventDefault();
    setLeads(prev => {
      const from = prev.findIndex(item => item.id === draggingLeadId);
      const to = prev.findIndex(item => item.id === targetLead.id);
      if (from < 0 || to < 0) return prev;
      const dragging = prev[from];
      if (!isReorderableLead(dragging)) return prev;
      const next = [...prev];
      next.splice(from, 1);
      next.splice(to, 0, dragging);
      return next;
    });
  };

  const handleDropLead = async (event: React.DragEvent<HTMLDivElement>) => {
    if (!reorderMode || !draggingLeadId) return;
    event.preventDefault();
    setDraggingLeadId(null);
    await persistQueueOrder(leads);
  };

  const maxQueuePosition = () => Math.max(0, ...leads.map(lead => lead.queue_position || 0));

  const rescheduleCampaign = async () => {
    const { error } = await supabase.rpc('zec_reschedule_campaign', { p_campaign_id: campaign.id });
    if (error) console.error('Nie udało się przeliczyć terminów wysyłki:', error);
  };

  const acceptLead = async (lead: CampaignLead) => {
    const nextPosition = maxQueuePosition() + 1;
    const { error } = await supabase
      .from('campaign_emails')
      .update({
        status: 'queued',
        queue_position: nextPosition,
        subject: lead.subject || '',
        body: lead.mail_content || '',
        last_error: null,
        paused_from_status: null,
      })
      .eq('id', lead.id);
    if (error) {
      console.error('Nie udało się zaakceptować maila:', error);
      return;
    }
    await rescheduleCampaign();
    await fetchLeads(false);
  };

  const skipLead = async (lead: CampaignLead) => {
    const { error } = await supabase
      .from('campaign_emails')
      .update({
        status: 'failed',
        scheduled_at: null,
        claimed_at: null,
        claim_token: null,
        priority_score: 0,
        paused_from_status: null,
      })
      .eq('id', lead.id);
    if (error) {
      console.error('Nie udało się pominąć maila:', error);
      return;
    }
    await rescheduleCampaign();
    await fetchLeads(false);
  };

  const restoreLead = async (lead: CampaignLead) => {
    const nextPosition = maxQueuePosition() + 1;
    const { error } = await supabase
      .from('campaign_emails')
      .update({
        status: 'queued',
        queue_position: nextPosition,
        last_error: null,
        priority_score: 0,
        claimed_at: null,
        claim_token: null,
        paused_from_status: null,
      })
      .eq('id', lead.id);
    if (error) {
      console.error('Nie udało się przywrócić maila:', error);
      return;
    }
    await rescheduleCampaign();
    await fetchLeads(false);
  };

  const toggleReplied = async (lead: CampaignLead) => {
    if (lead.status !== 'sent' && lead.status !== 'replied') return;
    const nextStatus = lead.status === 'replied' ? 'sent' : 'replied';
    const { error } = await supabase.from('campaign_emails').update({ status: nextStatus }).eq('id', lead.id);
    if (error) {
      console.error('Nie udało się zmienić statusu odpowiedzi:', error);
      return;
    }
    await fetchLeads(false);
  };

  const togglePause = async () => {
    const newStatus = campaign.status === 'active' ? 'paused' : 'active';
    const rpcName = campaign.status === 'active' ? 'zec_pause_campaign' : 'zec_resume_campaign';
    const { error } = await supabase.rpc(rpcName, { p_campaign_id: campaign.id });
    if (error) {
      console.error('Nie udało się zmienić statusu kampanii:', error);
      return;
    }
    setCampaign(prev => ({ ...prev, status: newStatus as CampaignStatus }));
    await fetchLeads(false);
  };

  const startSending = async () => {
    const pendingReviewIndex = leads.findIndex(lead => lead.status === 'pending_review' && !lead.isGenerating && !!lead.mail_content);
    if (pendingReviewIndex >= 0) {
      setReviewIndex(pendingReviewIndex);
      return;
    }
    const generatingReviewIndex = leads.findIndex(lead => lead.isGenerating || lead.status === 'pending_review');
    if (generatingReviewIndex >= 0) {
      setReviewIndex(generatingReviewIndex);
      return;
    }

    const { error } = await supabase.rpc('zec_start_campaign_sending', { p_campaign_id: campaign.id });
    if (error) {
      console.error('Nie udało się rozpocząć wysyłki:', error);
      alert(error.message || 'Nie udało się rozpocząć wysyłki.');
      return;
    }
    setCampaign(prev => ({ ...prev, status: 'active' }));
    await fetchLeads(false);
  };

  const updateLead = (updated: CampaignLead) => {
    setLeads(prev => prev.map(lead => lead.id === updated.id ? updated : lead));
  };

  const pct = campaign.total > 0 ? (campaign.sent / campaign.total) * 100 : 0;
  const st = statusLabel(campaign.status);
  const generatingIndex = leads.findIndex(lead => lead.isGenerating);
  const reviewableIndex = leads.findIndex(lead => lead.status === 'pending_review' && !lead.isGenerating && !!lead.mail_content);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">

      <div>
        <button onClick={onBack} className="flex items-center gap-2 text-[13px] text-[#827E78] hover:text-[#EAE8E1] transition-colors mb-6">
          <ArrowLeft className="size-4" /> Wszystkie kampanie
        </button>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-[28px] font-serif text-[#EAE8E1] tracking-tight">{campaign.name}</h1>
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
            {generatingIndex >= 0 && (
              <button onClick={() => setReviewIndex(generatingIndex)} className="flex items-center gap-2 px-4 py-2.5 bg-[#EAE8E1] hover:bg-white text-[#1A1A1A] text-[13px] font-medium rounded-xl transition-all">
                <Loader2 className="size-3.5 animate-spin" /> Powróć do generowania
              </button>
            )}
            {generatingIndex < 0 && campaign.status === 'draft' && (
              <button onClick={startSending} className="flex items-center gap-2 px-4 py-2.5 bg-[#EAE8E1] hover:bg-white text-[#1A1A1A] text-[13px] font-medium rounded-xl transition-all">
                {reviewableIndex >= 0 ? <Check className="size-3.5" /> : <Play className="size-3.5" />}
                {reviewableIndex >= 0 ? 'Powróć do akceptacji' : 'Rozpocznij wysyłkę'}
              </button>
            )}
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
            {leads.some(isReorderableLead) && (
              <button
                onClick={() => setReorderMode(prev => !prev)}
                className={`flex items-center gap-2 px-4 py-2.5 border text-[13px] font-medium rounded-xl transition-all ${reorderMode ? 'border-[#a3956a]/30 bg-[#a3956a]/10 text-[#a3956a]' : 'border-white/[0.1] hover:border-white/[0.2] text-[#A3A09A] hover:text-[#EAE8E1]'}`}
              >
                <GripVertical className="size-3.5" /> {reorderMode ? 'Zakończ układanie' : 'Układaj kolejkę'}
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
          <div className="col-span-2">Termin</div>
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
            {leads.map((lead, index) => {
              const ls = leadStatusLabel(lead.status);
              const reorderable = isReorderableLead(lead);
              return (
                <div
                  key={lead.id}
                  draggable={reorderMode && reorderable}
                  onDragStart={(event) => {
                    if (!reorderMode || !reorderable) return;
                    setDraggingLeadId(lead.id);
                    event.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragOver={(event) => handleDragOverLead(lead, event)}
                  onDrop={handleDropLead}
                  onDragEnd={() => setDraggingLeadId(null)}
                  onClick={() => {
                    if (!reorderMode) setReviewIndex(index);
                  }}
                  className={`grid grid-cols-12 gap-4 px-6 py-4 items-center transition-all ${reorderMode && reorderable ? 'cursor-grab active:cursor-grabbing hover:bg-white/[0.04]' : 'cursor-pointer hover:bg-white/[0.02]'} ${draggingLeadId === lead.id ? 'opacity-45' : ''}`}
                >

                  <div className="col-span-4 flex items-center gap-2.5">
                    {reorderMode && reorderable && (
                      <GripVertical className="size-4 text-[#3a3a3a] shrink-0" />
                    )}
                    {lead.priority && (
                      <span className="size-1.5 bg-[#a3956a] rounded-full shrink-0" title="Priorytet" />
                    )}
                    <p className="text-[14px] font-medium text-[#EAE8E1] truncate">{lead.company_name}</p>
                  </div>

                  <div className="col-span-3">
                    <p className="text-[13px] text-[#827E78] truncate">{lead.email}</p>
                    {lead.sent_from && (
                      <p className="text-[11px] text-[#3a3a3a] truncate">z {lead.sent_from}</p>
                    )}
                  </div>

                  <div className="col-span-2">
                    <div className={`flex items-center gap-1.5 text-[12px] font-medium ${ls.cls}`}>
                      {lead.isGenerating ? <Loader2 className="size-3.5 animate-spin" /> : ls.icon}
                      {lead.isGenerating ? 'Generuje się' : ls.label}
                      {lead.status === 'bounced' && (
                        <span className="ml-1 text-[10px] text-[#5d9970]" title="Kredyty zostają zwrócone">+kredyty</span>
                      )}
                    </div>
                  </div>

                  <div className="col-span-2">
                    <p className="text-[12px] text-[#3a3a3a]">
                      {lead.sent_at ? formatDate(lead.sent_at) : lead.scheduled_at ? formatDate(lead.scheduled_at) : lead.status === 'paused' ? 'Wstrzymana' : '—'}
                    </p>
                  </div>

                  <div className="col-span-1 flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    {(lead.status === 'sent' || lead.status === 'replied') && (
                      <button onClick={() => toggleReplied(lead)} className={`p-1.5 rounded-lg transition-all ${lead.status === 'replied' ? 'text-[#5d9970] bg-[#5d9970]/10 hover:bg-[#5d9970]/15' : 'text-[#3a3a3a] hover:text-[#5d9970] hover:bg-[#5d9970]/5'}`} title={lead.status === 'replied' ? 'Cofnij oznaczenie odpowiedzi' : 'Oznacz jako odpowiedział'}>
                        <Check className="size-3.5" />
                      </button>
                    )}
                    {lead.status === 'queued' && !reorderMode && (
                      <button onClick={() => togglePriority(lead)} className={`p-1.5 rounded-lg transition-all ${lead.priority ? 'text-[#a3956a]' : 'text-[#2e2e2e] hover:text-[#a3956a]'} hover:bg-white/[0.04]`} title={lead.priority ? 'Usuń priorytet' : 'Wyślij wcześniej'}>
                        <Zap className="size-3.5" />
                      </button>
                    )}
                    {(lead.status === 'queued' || lead.status === 'pending_review' || lead.status === 'paused') && !lead.isGenerating && !reorderMode && (
                      <button onClick={() => skipLead(lead)} className="p-1.5 text-[#3a3a3a] hover:text-[#b56060] hover:bg-[#b56060]/10 rounded-lg transition-all" title="Pomiń leada">
                        <X className="size-3.5" />
                      </button>
                    )}
                    {lead.status === 'skipped' && (
                      <button onClick={() => restoreLead(lead)} className="p-1.5 text-[#3a3a3a] hover:text-[#A3A09A] hover:bg-white/[0.06] rounded-lg transition-all" title="Przywróć na koniec kolejki">
                        <RotateCcw className="size-3.5" />
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
        {reviewIndex !== null && leads[reviewIndex] && (
          <CampaignMailReview
            campaign={campaign}
            leads={leads}
            initialIndex={reviewIndex}
            onClose={() => setReviewIndex(null)}
            onUpdateLead={updateLead}
            onAcceptLead={acceptLead}
            onSkipLead={skipLead}
            onRestoreLead={restoreLead}
            onTogglePriority={togglePriority}
            onToggleReplied={toggleReplied}
          />
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

  const fetchCampaigns = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return []; }
      const { data, error } = await supabase
        .from('campaigns')
        .select('id, name, status, created_at, sent_count, total_count, replies_count, campaign_emails!campaign_emails_campaign_id_fkey(status)')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
        
      if (error) console.error("Error fetching campaigns:", error);
      const mapped = data ? data.map(mapDbCampaign) : [];
      setCampaigns(mapped);
      return mapped;
    } catch (err) {
      console.error('Błąd pobierania kampanii:', err);
      return [];
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns(true);
    const interval = window.setInterval(() => fetchCampaigns(false), 10000);
    return () => window.clearInterval(interval);
  }, [fetchCampaigns]);

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
    const rpcName = c.status === 'active' ? 'zec_pause_campaign' : 'zec_resume_campaign';
    const { error } = await supabase.rpc(rpcName, { p_campaign_id: id });
    
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
    await fetchCampaigns(false);
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

  const closeCreator = async (campaignId?: string) => {
    setIsCreatorOpen(false);
    const refreshed = await fetchCampaigns();
    if (!campaignId) return;
    const campaign = refreshed.find(item => item.id === campaignId);
    if (campaign) onSelect(campaign);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12 relative">

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[28px] font-serif text-[#EAE8E1] tracking-tight">Kampanie</h1>
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
        onClose={closeCreator}
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
