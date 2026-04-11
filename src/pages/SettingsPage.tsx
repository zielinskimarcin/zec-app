import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User, Mail, CreditCard, Shield, Bell,
  CheckCircle2, XCircle, Plus, Trash2,
  AlertCircle, X, Loader2, ArrowLeft, Server,
  Sparkles, Eye, EyeOff, Download, Check, Search
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type Tab = 'profile' | 'mailboxes' | 'billing' | 'blacklist' | 'notifications';
type Provider = 'gmail' | 'outlook' | 'other' | null;

interface EmailAccount {
  id: string;
  email_address: string;
  sender_name: string;
  status: 'connected' | 'error';
  daily_limit: number;
  sent_today: number;
  last_sync: string;
}

// ─── Brand logos ──────────────────────────────────────────────────────────────

function GoogleLogo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function MicrosoftLogo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M11.4 2H2v9.4h9.4V2z" fill="#F25022"/>
      <path d="M22 2h-9.4v9.4H22V2z" fill="#7FBA00"/>
      <path d="M11.4 12.6H2V22h9.4v-9.4z" fill="#00A4EF"/>
      <path d="M22 12.6h-9.4V22H22v-9.4z" fill="#FFB900"/>
    </svg>
  );
}

// ─── Shared primitives ────────────────────────────────────────────────────────

const inputCls = `w-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-4 py-3
  text-[14px] text-[#d4d4d4] placeholder:text-[#3d3d3d]
  focus:outline-none focus:border-white/[0.14] focus:bg-white/[0.05]
  transition-all duration-200 disabled:opacity-25 disabled:cursor-not-allowed`;

function FLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[12px] font-medium text-[#5a5a5a] mb-2">{children}</p>;
}

function FInput({ className = '', ...p }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${inputCls} ${className}`} {...p} />;
}

function FTextarea({ className = '', ...p }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`${inputCls} resize-none leading-relaxed ${className}`}
      {...p}
    />
  );
}

function FSelect({ className = '', children, ...p }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`${inputCls} appearance-none cursor-pointer ${className}`} {...p}>
      {children}
    </select>
  );
}

function Rule() { return <div className="h-px bg-white/[0.05]" />; }

function SoftToggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative shrink-0 w-9 h-5 rounded-full transition-colors duration-200 ${checked ? 'bg-[#d4d4d4]' : 'bg-white/[0.08]'}`}
    >
      <span className={`absolute top-[3px] left-[3px] size-[14px] rounded-full transition-transform duration-200 shadow-sm ${checked ? 'translate-x-4 bg-[#111]' : 'bg-[#444]'}`} />
    </button>
  );
}

function SaveBtn({ saving, saved, onClick }: { saving: boolean; saved: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className="flex items-center gap-2 px-5 py-2.5 bg-[#d4d4d4] hover:bg-white text-[#111] text-[13px] font-semibold rounded-xl transition-all disabled:opacity-40"
    >
      {saving ? <><Loader2 className="size-3.5 animate-spin" />Zapisuję...</>
        : saved ? <><Check className="size-3.5" />Zapisano</>
          : 'Zapisz zmiany'}
    </button>
  );
}

// ─── Profile ──────────────────────────────────────────────────────────────────

function ProfileTab() {
  const [form, setForm] = useState({
    firstName: 'Jan', lastName: 'Kowalski',
    company: 'Moja Firma Sp. z o.o.', phone: '', website: '', password: '',
    industry: '', targetMarket: '', usp: '', companyDesc: '',
  });
  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [refining, setRefining] = useState(false);

  const save = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 700));
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  const refine = async () => {
    if (!form.companyDesc && !form.industry) return;
    setRefining(true);
    await new Promise(r => setTimeout(r, 1500));
    setForm(p => ({
      ...p,
      companyDesc: `${p.company || 'Nasza firma'} to ${p.industry ? p.industry.toLowerCase() + ' ' : ''}specjalizujące się w dostarczaniu rozwiązań B2B najwyższej jakości.${p.usp ? ' Wyróżnia nas ' + p.usp + '.' : ''}${p.targetMarket ? ' Działamy na rynku ' + p.targetMarket + ', budując trwałe relacje oparte na mierzalnych efektach.' : ''}`
    }));
    setRefining(false);
  };

  const industries = ['IT / Software', 'Marketing / Agencja', 'Produkcja', 'Meble / Wyposażenie', 'Nieruchomości', 'Finanse / Doradztwo', 'Handel / E-commerce', 'Inne'];

  return (
    <div className="space-y-10">
      {/* Dane osobowe */}
      <section className="space-y-5">
        <div>
          <h2 className="text-[15px] font-semibold text-[#c8c8c8]">Dane osobowe</h2>
          <p className="text-[13px] text-[#484848] mt-0.5">Widoczne dla odbiorców jako nadawca wiadomości</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div><FLabel>Imię</FLabel><FInput value={form.firstName} onChange={f('firstName')} placeholder="Jan" /></div>
          <div><FLabel>Nazwisko</FLabel><FInput value={form.lastName} onChange={f('lastName')} placeholder="Kowalski" /></div>
        </div>

        <div><FLabel>E-mail</FLabel><FInput value="jan@firma.pl" disabled /></div>

        <div>
          <FLabel>Nowe hasło</FLabel>
          <div className="relative">
            <FInput type={showPass ? 'text' : 'password'} value={form.password} onChange={f('password')} placeholder="Zostaw puste jeśli nie zmieniasz" />
            <button onClick={() => setShowPass(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#3d3d3d] hover:text-[#777] transition-colors">
              {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div><FLabel>Telefon</FLabel><FInput value={form.phone} onChange={f('phone')} placeholder="+48 000 000 000" /></div>
          <div><FLabel>Strona WWW</FLabel><FInput value={form.website} onChange={f('website')} placeholder="https://firma.pl" /></div>
        </div>

        <div><FLabel>Nazwa firmy</FLabel><FInput value={form.company} onChange={f('company')} placeholder="Firma Sp. z o.o." /></div>
      </section>

      <Rule />

      {/* Profil AI */}
      <section className="space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-[#c8c8c8]">Profil firmy dla AI</h2>
            <p className="text-[13px] text-[#484848] mt-0.5">Im więcej szczegółów, tym trafniej AI personalizuje maile</p>
          </div>
          <span className="flex items-center gap-1.5 text-[11px] text-[#3d3d3d] bg-white/[0.03] border border-white/[0.05] px-2.5 py-1 rounded-full mt-0.5">
            <Sparkles className="size-3" /> Używane przy generowaniu
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FLabel>Branża</FLabel>
            <FSelect value={form.industry} onChange={f('industry')}>
              <option value="" className="bg-[#1a1a1a] text-[#484848]">Wybierz branżę...</option>
              {industries.map(b => <option key={b} value={b} className="bg-[#1a1a1a] text-[#d4d4d4]">{b}</option>)}
            </FSelect>
          </div>
          <div><FLabel>Rynek docelowy</FLabel><FInput value={form.targetMarket} onChange={f('targetMarket')} placeholder="np. Polska, Niemcy, cała UE" /></div>
        </div>

        <div><FLabel>Główna przewaga (USP)</FLabel><FInput value={form.usp} onChange={f('usp')} placeholder="np. 10 lat doświadczenia, ekspresowa realizacja, certyfikaty ISO" /></div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <FLabel>Opis firmy</FLabel>
            <button
              onClick={refine}
              disabled={refining || (!form.companyDesc && !form.industry)}
              className="flex items-center gap-1.5 text-[12px] text-[#484848] hover:text-[#888] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              {refining ? <><Loader2 className="size-3 animate-spin" />Ulepszam...</> : <><Sparkles className="size-3" />AI Refine</>}
            </button>
          </div>
          <FTextarea
            value={form.companyDesc}
            onChange={f('companyDesc') as any}
            placeholder="Opisz swoją firmę — czym się zajmujesz, co oferujesz, co wyróżnia cię na tle konkurencji. Im więcej szczegółów, tym lepiej AI spersonalizuje każdy mail."
            rows={5}
          />
          <p className="text-[11px] text-[#2e2e2e] mt-2">{form.companyDesc.length} znaków · zalecane minimum 200</p>
        </div>
      </section>

      <div className="flex justify-end"><SaveBtn saving={saving} saved={saved} onClick={save} /></div>
    </div>
  );
}

// ─── Mailboxes ────────────────────────────────────────────────────────────────

function MailboxesTab() {
  const [mailboxes, setMailboxes] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [provider, setProvider] = useState<Provider>(null);
  const [verifying, setVerifying] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [mb, setMb] = useState({ email: '', name: '', password: '', smtpHost: '', smtpPort: '', imapHost: '', imapPort: '' });

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data } = await supabase.from('email_accounts').select('*').order('created_at', { ascending: false });
      if (data) setMailboxes(data);
    }
    setLoading(false);
  };

  const pick = (p: Provider) => {
    setProvider(p); setErr(null);
    const presets: Record<string, Partial<typeof mb>> = {
      gmail: { smtpHost: 'smtp.gmail.com', smtpPort: '465', imapHost: 'imap.gmail.com', imapPort: '993' },
      outlook: { smtpHost: 'smtp.office365.com', smtpPort: '587', imapHost: 'outlook.office365.com', imapPort: '993' },
    };
    setMb(prev => ({ ...prev, ...(presets[p as string] ?? { smtpHost: '', smtpPort: '', imapHost: '', imapPort: '' }) }));
    setStep(2);
  };

  const close = () => {
    setOpen(false);
    setTimeout(() => { setStep(1); setProvider(null); setMb({ email: '', name: '', password: '', smtpHost: '', smtpPort: '', imapHost: '', imapPort: '' }); setErr(null); }, 300);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(null); setVerifying(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Brak autoryzacji');
      const URL = import.meta.env.DEV ? 'http://localhost:3000/verify' : '/api/verify';
      const res = await fetch(URL, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ZEC_SECRET_2026' }, body: JSON.stringify({ email: mb.email, password: mb.password, host: mb.smtpHost, port: mb.smtpPort }) });
      const r = await res.json();
      if (!res.ok || !r.success) throw new Error(r.error || 'Błędne dane SMTP.');
      const { data, error } = await supabase.from('email_accounts').insert([{ user_id: session.user.id, email_address: mb.email, sender_name: mb.name || mb.email.split('@')[0], smtp_host: mb.smtpHost, smtp_port: parseInt(mb.smtpPort), smtp_password: mb.password, imap_host: mb.imapHost, imap_port: parseInt(mb.imapPort), status: 'connected' }]).select().single();
      if (error) throw error;
      setMailboxes(p => [data, ...p]); close();
    } catch (e: any) { setErr(e.message); } finally { setVerifying(false); }
  };

  const remove = async (id: string) => {
    await supabase.from('email_accounts').delete().eq('id', id);
    setMailboxes(p => p.filter(m => m.id !== id));
  };

  return (
    <>
      <div className="flex items-start justify-between mb-1">
        <div>
          <h2 className="text-[15px] font-semibold text-[#c8c8c8]">Podłączone skrzynki</h2>
          <p className="text-[13px] text-[#484848] mt-0.5">Maile wysyłane są rotacyjnie ze wszystkich aktywnych skrzynek</p>
        </div>
        <button onClick={() => setOpen(true)} className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-[#d4d4d4] hover:bg-white text-[#111] text-[13px] font-semibold rounded-xl transition-all">
          <Plus className="size-3.5" /> Dodaj skrzynkę
        </button>
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="size-5 text-[#333] animate-spin" /></div>
        ) : mailboxes.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-white/[0.06]">
            <div className="size-10 bg-white/[0.03] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Mail className="size-5 text-[#333]" />
            </div>
            <p className="text-[14px] text-[#555] mb-1">Brak podłączonych skrzynek</p>
            <p className="text-[13px] text-[#333] mb-5">Podłącz skrzynkę żeby zacząć wysyłać kampanie</p>
            <button onClick={() => setOpen(true)} className="text-[13px] text-[#555] hover:text-[#999] transition-colors">Podłącz teraz →</button>
          </div>
        ) : (
          <div className="space-y-3">
            {mailboxes.map(m => {
              const pct = m.daily_limit > 0 ? (m.sent_today / m.daily_limit) * 100 : 0;
              return (
                <div key={m.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3.5">
                      <div className="size-9 bg-white/[0.04] rounded-xl flex items-center justify-center"><Mail className="size-4 text-[#444]" /></div>
                      <div>
                        <p className="text-[14px] font-semibold text-[#d0d0d0]">{m.email_address}</p>
                        <p className="text-[12px] text-[#444] mt-0.5">{m.sender_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      {m.status === 'connected'
                        ? <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#5d9970] bg-[#5d9970]/10 px-2.5 py-1 rounded-full"><span className="size-1.5 bg-[#5d9970] rounded-full" />Aktywna</span>
                        : <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#b56060] bg-[#b56060]/10 px-2.5 py-1 rounded-full"><span className="size-1.5 bg-[#b56060] rounded-full" />Błąd</span>}
                      <button onClick={() => remove(m.id)} className="p-1.5 text-[#2e2e2e] hover:text-[#b56060] hover:bg-[#b56060]/5 rounded-lg transition-all"><Trash2 className="size-3.5" /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-4 text-[12px]">
                    <div><p className="text-[#3a3a3a] mb-1">Wysłano dziś</p><p className="font-semibold text-[#aaa]">{m.sent_today} / {m.daily_limit}</p></div>
                    <div><p className="text-[#3a3a3a] mb-1">Limit dzienny</p><p className="font-semibold text-[#aaa]">{m.daily_limit} maili</p></div>
                    <div><p className="text-[#3a3a3a] mb-1">Ostatnia sync</p><p className="font-semibold text-[#aaa]">{m.last_sync || '—'}</p></div>
                  </div>
                  <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden"><div className="h-full bg-[#555] rounded-full" style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ duration: 0.16 }}
              className="bg-[#161616] border border-white/[0.07] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-7 py-5 border-b border-white/[0.05]">
                <div className="flex items-center gap-3">
                  {step === 2 && <button onClick={() => setStep(1)} className="p-1.5 hover:bg-white/[0.05] rounded-lg text-[#444] hover:text-[#888] transition-all"><ArrowLeft className="size-4" /></button>}
                  <div>
                    <p className="text-[14px] font-semibold text-[#d0d0d0]">{step === 1 ? 'Wybierz dostawcę poczty' : `Podłącz ${provider === 'gmail' ? 'Google' : provider === 'outlook' ? 'Microsoft 365' : 'własny serwer'}`}</p>
                    <p className="text-[11px] text-[#383838] mt-0.5">Połączenie szyfrowane end-to-end</p>
                  </div>
                </div>
                <button onClick={close} className="p-1.5 text-[#383838] hover:text-[#888] hover:bg-white/[0.05] rounded-lg transition-all"><X className="size-4" /></button>
              </div>

              {/* Step 1 — provider pick */}
              {step === 1 && (
                <div className="p-7 grid grid-cols-3 gap-3">
                  {[
                    { id: 'gmail' as Provider, name: 'Google', sub: 'Gmail, Workspace', logo: <GoogleLogo size={28} /> },
                    { id: 'outlook' as Provider, name: 'Microsoft', sub: 'Outlook, Exchange', logo: <MicrosoftLogo size={26} /> },
                    { id: 'other' as Provider, name: 'Inny', sub: 'Zoho, OVH, własny', logo: <Server className="size-6 text-[#555]" /> },
                  ].map(p => (
                    <button
                      key={p.id}
                      onClick={() => pick(p.id)}
                      className="flex flex-col items-center gap-4 p-5 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-white/[0.1] rounded-2xl transition-all group"
                    >
                      <div className="size-12 flex items-center justify-center">{p.logo}</div>
                      <div className="text-center">
                        <p className="text-[13px] font-semibold text-[#c8c8c8] mb-0.5">{p.name}</p>
                        <p className="text-[11px] text-[#3d3d3d]">{p.sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Step 2 — form */}
              {step === 2 && (
                <div className="flex">
                  <form onSubmit={submit} className="flex-1 p-7 space-y-4">
                    {err && (
                      <div className="flex items-start gap-2.5 p-3.5 bg-[#b56060]/8 border border-[#b56060]/15 rounded-xl text-[#b56060] text-[13px]">
                        <AlertCircle className="size-4 shrink-0 mt-0.5" />{err}
                      </div>
                    )}
                    <div><FLabel>Adres e-mail</FLabel><FInput type="email" required value={mb.email} onChange={e => setMb(p => ({ ...p, email: e.target.value }))} placeholder="jan@firma.pl" /></div>
                    <div><FLabel>Nazwa nadawcy</FLabel><FInput value={mb.name} onChange={e => setMb(p => ({ ...p, name: e.target.value }))} placeholder="Jan Kowalski" /></div>

                    {provider === 'other' && (
                      <div className="space-y-3 p-4 bg-white/[0.02] rounded-xl border border-white/[0.05]">
                        <div>
                          <FLabel>SMTP</FLabel>
                          <div className="flex gap-2">
                            <FInput required placeholder="smtp.domena.pl" value={mb.smtpHost} onChange={e => setMb(p => ({ ...p, smtpHost: e.target.value }))} />
                            <FInput required placeholder="465" value={mb.smtpPort} onChange={e => setMb(p => ({ ...p, smtpPort: e.target.value }))} className="w-20" />
                          </div>
                        </div>
                        <div>
                          <FLabel>IMAP</FLabel>
                          <div className="flex gap-2">
                            <FInput required placeholder="imap.domena.pl" value={mb.imapHost} onChange={e => setMb(p => ({ ...p, imapHost: e.target.value }))} />
                            <FInput required placeholder="993" value={mb.imapPort} onChange={e => setMb(p => ({ ...p, imapPort: e.target.value }))} className="w-20" />
                          </div>
                        </div>
                      </div>
                    )}

                    <div><FLabel>Hasło aplikacji</FLabel><FInput type="password" required value={mb.password} onChange={e => setMb(p => ({ ...p, password: e.target.value }))} placeholder="16-znakowy kod aplikacji" className="font-mono tracking-widest" /></div>

                    <button type="submit" disabled={verifying} className="w-full py-3 bg-[#d4d4d4] hover:bg-white text-[#111] text-[13px] font-semibold rounded-xl transition-all disabled:opacity-40 flex items-center justify-center gap-2 mt-2">
                      {verifying ? <><Loader2 className="size-4 animate-spin" />Weryfikuję...</> : 'Połącz skrzynkę'}
                    </button>
                  </form>

                  {/* Instructions sidebar */}
                  <div className="w-52 p-6 border-l border-white/[0.05] bg-white/[0.01]">
                    <p className="text-[10px] font-semibold text-[#333] uppercase tracking-wider mb-4">Instrukcja</p>
                    {provider === 'gmail' && (
                      <ol className="space-y-3 text-[12px] text-[#3d3d3d] list-decimal pl-4 marker:text-[#2e2e2e]">
                        <li className="leading-relaxed">Otwórz zarządzanie kontem Google</li>
                        <li className="leading-relaxed">Bezpieczeństwo → Weryfikacja dwuetapowa</li>
                        <li className="leading-relaxed">Wyszukaj <span className="text-[#666]">Hasła aplikacji</span></li>
                        <li className="leading-relaxed">Nazwij apkę "ZEC" i wygeneruj kod</li>
                        <li className="leading-relaxed">Wklej 16-znakowy kod tutaj</li>
                      </ol>
                    )}
                    {provider === 'outlook' && (
                      <ol className="space-y-3 text-[12px] text-[#3d3d3d] list-decimal pl-4 marker:text-[#2e2e2e]">
                        <li className="leading-relaxed">Otwórz ustawienia konta Microsoft</li>
                        <li className="leading-relaxed">Bezpieczeństwo → Weryfikacja dwuetapowa</li>
                        <li className="leading-relaxed">Utwórz <span className="text-[#666]">Hasło aplikacji</span></li>
                        <li className="leading-relaxed">Wklej wygenerowany kod tutaj</li>
                      </ol>
                    )}
                    {provider === 'other' && (
                      <p className="text-[12px] text-[#3d3d3d] leading-relaxed">Dane SMTP/IMAP znajdziesz w panelu hostingu. Zazwyczaj możesz użyć standardowego hasła do skrzynki.</p>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Billing ──────────────────────────────────────────────────────────────────

function BillingTab() {
  const invoices = [
    { id: 1, date: '1.03.2026', plan: 'Growth', amount: '$129.00' },
    { id: 2, date: '1.02.2026', plan: 'Growth', amount: '$129.00' },
    { id: 3, date: '1.01.2026', plan: 'Starter', amount: '$49.00' },
  ];

  return (
    <div className="space-y-10">
      {/* Current plan */}
      <section>
        <h2 className="text-[15px] font-semibold text-[#c8c8c8] mb-1">Obecny plan</h2>
        <p className="text-[13px] text-[#484848] mb-6">Zarządzaj subskrypcją i kredytami</p>

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 mb-4">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-[11px] text-[#3a3a3a] uppercase tracking-wider mb-1.5">Twój plan</p>
              <p className="text-[24px] font-bold text-[#d0d0d0] tracking-tight">Growth</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-[#3a3a3a] uppercase tracking-wider mb-1.5">Cena</p>
              <p className="text-[24px] font-bold text-[#d0d0d0] tracking-tight">$129<span className="text-[14px] font-normal text-[#444]">/msc</span></p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 mb-6">
            {['2000 leadów miesięcznie', '3 podpięte skrzynki', 'AI Hyper-Personalization', 'Auto-Follow-upy'].map(f => (
              <div key={f} className="flex items-center gap-2 text-[13px] text-[#555]">
                <CheckCircle2 className="size-3.5 text-[#5d9970] shrink-0" />{f}
              </div>
            ))}
          </div>

          <div>
            <div className="flex justify-between text-[12px] mb-2">
              <span className="text-[#3a3a3a]">Wykorzystanie kredytów</span>
              <span className="text-[#666] font-mono">1450 / 2000</span>
            </div>
            <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden"><div className="h-full bg-[#555] rounded-full" style={{ width: '72.5%' }} /></div>
            <p className="text-[11px] text-[#2e2e2e] mt-2">Odnawia się 1 kwietnia 2026</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button className="flex-1 py-3 bg-[#d4d4d4] hover:bg-white text-[#111] text-[13px] font-semibold rounded-xl transition-all">Zmień plan</button>
          <button className="px-5 py-3 border border-white/[0.07] text-[#444] hover:text-[#777] hover:border-white/[0.12] text-[13px] rounded-xl transition-all">Anuluj subskrypcję</button>
        </div>
      </section>

      <Rule />

      {/* Payment method */}
      <section>
        <h2 className="text-[15px] font-semibold text-[#c8c8c8] mb-6">Metoda płatności</h2>
        <div className="flex items-center justify-between p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center gap-3.5">
            <div className="size-9 bg-white/[0.04] rounded-xl flex items-center justify-center"><CreditCard className="size-4 text-[#444]" /></div>
            <div>
              <p className="text-[14px] font-medium text-[#c0c0c0]">•••• •••• •••• 4242</p>
              <p className="text-[12px] text-[#3a3a3a] mt-0.5">Wygasa 12/27</p>
            </div>
          </div>
          <button className="text-[13px] font-medium text-[#444] hover:text-[#888] border border-white/[0.07] hover:border-white/[0.12] px-4 py-2 rounded-xl transition-all">Zmień</button>
        </div>
      </section>

      <Rule />

      {/* Invoices */}
      <section>
        <h2 className="text-[15px] font-semibold text-[#c8c8c8] mb-6">Historia faktur</h2>
        <div className="space-y-1.5">
          {invoices.map(inv => (
            <div key={inv.id} className="flex items-center justify-between px-5 py-4 rounded-2xl hover:bg-white/[0.02] transition-all group">
              <div className="flex items-center gap-3.5">
                <div className="size-8 bg-white/[0.03] rounded-lg flex items-center justify-center"><CreditCard className="size-3.5 text-[#333]" /></div>
                <div>
                  <p className="text-[13px] font-medium text-[#b8b8b8]">{inv.plan}</p>
                  <p className="text-[12px] text-[#3a3a3a]">{inv.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[13px] font-semibold text-[#5d9970]">{inv.amount}</span>
                <button className="p-1.5 text-[#2e2e2e] hover:text-[#777] hover:bg-white/[0.05] rounded-lg transition-all opacity-0 group-hover:opacity-100"><Download className="size-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ─── Blacklist ────────────────────────────────────────────────────────────────

function BlacklistTab() {
  const [entries, setEntries] = useState(['spam@domain.com', 'noreply@automaticsystem.com']);
  const [newEntry, setNewEntry] = useState('');
  const [filter, setFilter] = useState('');

  const add = () => {
    const t = newEntry.trim();
    if (t && !entries.includes(t)) { setEntries([t, ...entries]); setNewEntry(''); }
  };

  return (
    <div>
      <h2 className="text-[15px] font-semibold text-[#c8c8c8] mb-1">Czarna lista</h2>
      <p className="text-[13px] text-[#484848] mb-8">Adresy i domeny które nigdy nie trafią do kampanii</p>

      <div className="flex gap-2 mb-4">
        <FInput value={newEntry} onChange={e => setNewEntry(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder="adres@email.pl lub @cała-domena.pl" className="flex-1" />
        <button onClick={add} className="px-5 py-3 bg-[#d4d4d4] hover:bg-white text-[#111] text-[13px] font-semibold rounded-xl transition-all whitespace-nowrap">Dodaj</button>
      </div>

      {entries.length > 5 && (
        <div className="relative mb-3">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-3.5 text-[#2e2e2e]" />
          <FInput value={filter} onChange={e => setFilter(e.target.value)} placeholder="Szukaj..." className="pl-10" />
        </div>
      )}

      <div className="space-y-1 max-h-72 overflow-y-auto">
        {entries.filter(e => e.includes(filter)).map(entry => (
          <div key={entry} className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/[0.02] group transition-all">
            <div className="flex items-center gap-3">
              <Shield className="size-3.5 text-[#2e2e2e]" />
              <span className="text-[13px] font-mono text-[#5a5a5a]">{entry}</span>
            </div>
            <button onClick={() => setEntries(entries.filter(e => e !== entry))} className="opacity-0 group-hover:opacity-100 p-1 text-[#2e2e2e] hover:text-[#b56060] transition-all"><X className="size-3.5" /></button>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-[#2a2a2a] mt-6">{entries.length} wpisów · Możesz dodawać całe domeny np. @spam.pl</p>
    </div>
  );
}

// ─── Notifications ────────────────────────────────────────────────────────────

function NotificationsTab() {
  const [s, setS] = useState({ campaignFinished: true, newReply: true, dailyReport: false, weeklyReport: true, lowCredits: true, mailboxError: true, newLead: false, productUpdates: true });
  const tog = (k: keyof typeof s) => setS(p => ({ ...p, [k]: !p[k] }));

  const groups = [
    { title: 'Kampanie', items: [{ k: 'campaignFinished' as const, l: 'Kampania zakończona', d: 'Gdy wszystkie maile zostaną wysłane' }, { k: 'newReply' as const, l: 'Nowa odpowiedź', d: 'Ktoś odpowiedział na Twój mail' }, { k: 'newLead' as const, l: 'Lead zakwalifikowany', d: 'AI oznaczyło lead jako gorący' }] },
    { title: 'Raporty', items: [{ k: 'dailyReport' as const, l: 'Raport dzienny', d: 'Podsumowanie aktywności każdego dnia' }, { k: 'weeklyReport' as const, l: 'Raport tygodniowy', d: 'Podsumowanie wyników co tydzień' }] },
    { title: 'System', items: [{ k: 'lowCredits' as const, l: 'Niski stan kredytów', d: 'Gdy pozostanie mniej niż 10% kredytów' }, { k: 'mailboxError' as const, l: 'Błąd skrzynki', d: 'Gdy skrzynka straci połączenie' }, { k: 'productUpdates' as const, l: 'Aktualizacje produktu', d: 'Nowe funkcje i poprawki' }] },
  ];

  return (
    <div className="space-y-10">
      {groups.map((g, gi) => (
        <section key={g.title}>
          <h2 className="text-[15px] font-semibold text-[#c8c8c8] mb-6">{g.title}</h2>
          <div className="space-y-0">
            {g.items.map((item, i) => (
              <div key={item.k}>
                <div className="flex items-center justify-between py-4">
                  <div>
                    <p className="text-[14px] font-medium text-[#b8b8b8]">{item.l}</p>
                    <p className="text-[12px] text-[#3d3d3d] mt-0.5">{item.d}</p>
                  </div>
                  <SoftToggle checked={s[item.k]} onChange={() => tog(item.k)} />
                </div>
                {i < g.items.length - 1 && <div className="h-px bg-white/[0.04]" />}
              </div>
            ))}
          </div>
          {gi < groups.length - 1 && <div className="h-px bg-white/[0.05] mt-6" />}
        </section>
      ))}
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'mailboxes', label: 'Skrzynki pocztowe', icon: Mail },
    { id: 'billing', label: 'Płatności', icon: CreditCard },
    { id: 'blacklist', label: 'Czarna lista', icon: Shield },
    { id: 'notifications', label: 'Powiadomienia', icon: Bell },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-10">
        <h1 className="text-[20px] font-semibold text-[#c8c8c8] tracking-tight">Ustawienia</h1>
        <p className="text-[13px] text-[#444] mt-1">Zarządzaj kontem, skrzynkami i preferencjami</p>
      </div>

      <div className="grid grid-cols-12 gap-10">
        {/* Sidebar nav */}
        <nav className="col-span-12 lg:col-span-3 space-y-0.5">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all text-left ${
                activeTab === tab.id
                  ? 'bg-white/[0.05] text-[#c8c8c8]'
                  : 'text-[#3a3a3a] hover:text-[#666] hover:bg-white/[0.02]'
              }`}
            >
              <tab.icon className="size-4 shrink-0" />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="col-span-12 lg:col-span-9">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.12 }}
            >
              {activeTab === 'profile' && <ProfileTab />}
              {activeTab === 'mailboxes' && <MailboxesTab />}
              {activeTab === 'billing' && <BillingTab />}
              {activeTab === 'blacklist' && <BlacklistTab />}
              {activeTab === 'notifications' && <NotificationsTab />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}