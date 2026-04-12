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

const inputCls = `w-full bg-transparent border border-white/[0.12] rounded-xl px-5 py-3.5
  text-[15px] text-[#EAE8E1] placeholder:text-[#71717A]
  focus:outline-none focus:border-white/[0.25] focus:bg-white/[0.02]
  transition-all duration-200 disabled:opacity-25 disabled:cursor-not-allowed`;

function FLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[14px] font-medium text-[#A1A1AA] mb-2.5">{children}</p>;
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

function Rule() { return <div className="h-px bg-white/[0.06]" />; }

function SoftToggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative shrink-0 w-10 h-6 rounded-full transition-colors duration-200 ${checked ? 'bg-[#EAE8E1]' : 'bg-white/[0.1]'}`}
    >
      <span className={`absolute top-[4px] left-[4px] size-[16px] rounded-full transition-transform duration-200 shadow-sm ${checked ? 'translate-x-4 bg-[#1A1A1A]' : 'bg-[#71717A]'}`} />
    </button>
  );
}

function SaveBtn({ saving, saved, onClick }: { saving: boolean; saved: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className="flex items-center gap-2.5 px-6 py-3 bg-[#EAE8E1] hover:bg-white text-[#1A1A1A] text-[14px] font-medium rounded-xl transition-all disabled:opacity-40"
    >
      {saving ? <><Loader2 className="size-4 animate-spin" />Zapisuję...</>
        : saved ? <><Check className="size-4" />Zapisano</>
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
    <div className="space-y-12">
      {/* Dane osobowe */}
      <section className="space-y-6">
        <div>
          <h2 className="text-[18px] font-medium text-[#EAE8E1]">Dane osobowe</h2>
          <p className="text-[15px] text-[#A1A1AA] mt-1">Widoczne dla odbiorców jako nadawca wiadomości</p>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div><FLabel>Imię</FLabel><FInput value={form.firstName} onChange={f('firstName')} placeholder="Jan" /></div>
          <div><FLabel>Nazwisko</FLabel><FInput value={form.lastName} onChange={f('lastName')} placeholder="Kowalski" /></div>
        </div>

        <div><FLabel>E-mail</FLabel><FInput value="jan@firma.pl" disabled /></div>

        <div>
          <FLabel>Nowe hasło</FLabel>
          <div className="relative">
            <FInput type={showPass ? 'text' : 'password'} value={form.password} onChange={f('password')} placeholder="Zostaw puste jeśli nie zmieniasz" />
            <button onClick={() => setShowPass(v => !v)} className="absolute right-5 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#A1A1AA] transition-colors">
              {showPass ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div><FLabel>Telefon</FLabel><FInput value={form.phone} onChange={f('phone')} placeholder="+48 000 000 000" /></div>
          <div><FLabel>Strona WWW</FLabel><FInput value={form.website} onChange={f('website')} placeholder="https://firma.pl" /></div>
        </div>

        <div><FLabel>Nazwa firmy</FLabel><FInput value={form.company} onChange={f('company')} placeholder="Firma Sp. z o.o." /></div>
      </section>

      <Rule />

      {/* Profil AI */}
      <section className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[18px] font-medium text-[#EAE8E1]">Profil firmy dla AI</h2>
            <p className="text-[15px] text-[#A1A1AA] mt-1">Im więcej szczegółów, tym trafniej AI personalizuje maile</p>
          </div>
          <span className="flex items-center gap-2 text-[13px] text-[#A1A1AA] bg-white/[0.03] border border-white/[0.08] px-3 py-1.5 rounded-full mt-0.5">
            <Sparkles className="size-3.5" /> Używane przy generowaniu
          </span>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div>
            <FLabel>Branża</FLabel>
            <FSelect value={form.industry} onChange={f('industry')}>
              <option value="" className="bg-[#1a1a1a] text-[#A1A1AA]">Wybierz branżę...</option>
              {industries.map(b => <option key={b} value={b} className="bg-[#1a1a1a] text-[#EAE8E1]">{b}</option>)}
            </FSelect>
          </div>
          <div><FLabel>Rynek docelowy</FLabel><FInput value={form.targetMarket} onChange={f('targetMarket')} placeholder="np. Polska, Niemcy, cała UE" /></div>
        </div>

        <div><FLabel>Główna przewaga (USP)</FLabel><FInput value={form.usp} onChange={f('usp')} placeholder="np. 10 lat doświadczenia, ekspresowa realizacja, certyfikaty ISO" /></div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <FLabel>Opis firmy</FLabel>
            <button
              onClick={refine}
              disabled={refining || (!form.companyDesc && !form.industry)}
              className="flex items-center gap-2 text-[14px] text-[#A1A1AA] hover:text-[#EAE8E1] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              {refining ? <><Loader2 className="size-3.5 animate-spin" />Ulepszam...</> : <><Sparkles className="size-3.5" />AI Refine</>}
            </button>
          </div>
          <FTextarea
            value={form.companyDesc}
            onChange={f('companyDesc') as any}
            placeholder="Opisz swoją firmę — czym się zajmujesz, co oferujesz, co wyróżnia cię na tle konkurencji. Im więcej szczegółów, tym lepiej AI spersonalizuje każdy mail."
            rows={5}
          />
          <p className="text-[13px] text-[#71717A] mt-2.5">{form.companyDesc.length} znaków · zalecane minimum 200</p>
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
      <div className="flex items-start justify-between mb-2">
        <div>
          <h2 className="text-[18px] font-medium text-[#EAE8E1]">Podłączone skrzynki</h2>
          <p className="text-[15px] text-[#A1A1AA] mt-1">Maile wysyłane są rotacyjnie ze wszystkich aktywnych skrzynek</p>
        </div>
        <button onClick={() => setOpen(true)} className="shrink-0 flex items-center gap-2.5 px-5 py-3 bg-[#EAE8E1] hover:bg-white text-[#1A1A1A] text-[14px] font-medium rounded-xl transition-all">
          <Plus className="size-4" /> Dodaj skrzynkę
        </button>
      </div>

      <div className="mt-10">
        {loading ? (
          <div className="flex justify-center py-14"><Loader2 className="size-6 text-[#71717A] animate-spin" /></div>
        ) : mailboxes.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-dashed border-white/[0.12]">
            <div className="size-12 bg-white/[0.04] rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Mail className="size-6 text-[#A1A1AA]" />
            </div>
            <p className="text-[16px] text-[#EAE8E1] mb-1">Brak podłączonych skrzynek</p>
            <p className="text-[15px] text-[#A1A1AA] mb-6">Podłącz skrzynkę żeby zacząć wysyłać kampanie</p>
            <button onClick={() => setOpen(true)} className="text-[14px] font-medium text-[#A1A1AA] hover:text-[#EAE8E1] transition-colors">Podłącz teraz →</button>
          </div>
        ) : (
          <div className="space-y-4">
            {mailboxes.map(m => {
              const pct = m.daily_limit > 0 ? (m.sent_today / m.daily_limit) * 100 : 0;
              return (
                <div key={m.id} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="size-11 bg-white/[0.05] rounded-xl flex items-center justify-center"><Mail className="size-5 text-[#A1A1AA]" /></div>
                      <div>
                        <p className="text-[16px] font-medium text-[#EAE8E1]">{m.email_address}</p>
                        <p className="text-[14px] text-[#A1A1AA] mt-0.5">{m.sender_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {m.status === 'connected'
                        ? <span className="flex items-center gap-2 text-[13px] font-medium text-[#5d9970] bg-[#5d9970]/10 px-3 py-1.5 rounded-full"><span className="size-2 bg-[#5d9970] rounded-full" />Aktywna</span>
                        : <span className="flex items-center gap-2 text-[13px] font-medium text-[#b56060] bg-[#b56060]/10 px-3 py-1.5 rounded-full"><span className="size-2 bg-[#b56060] rounded-full" />Błąd</span>}
                      <button onClick={() => remove(m.id)} className="p-2 text-[#71717A] hover:text-[#b56060] hover:bg-[#b56060]/10 rounded-lg transition-all"><Trash2 className="size-4" /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-6 mb-5 text-[14px]">
                    <div><p className="text-[#71717A] mb-1.5">Wysłano dziś</p><p className="font-medium text-[#EAE8E1]">{m.sent_today} / {m.daily_limit}</p></div>
                    <div><p className="text-[#71717A] mb-1.5">Limit dzienny</p><p className="font-medium text-[#EAE8E1]">{m.daily_limit} maili</p></div>
                    <div><p className="text-[#71717A] mb-1.5">Ostatnia sync</p><p className="font-medium text-[#EAE8E1]">{m.last_sync || '—'}</p></div>
                  </div>
                  <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden"><div className="h-full bg-[#A1A1AA] rounded-full" style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ duration: 0.16 }}
              className="bg-[#1e1e1e] border border-white/[0.08] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-8 py-6 border-b border-white/[0.06]">
                <div className="flex items-center gap-4">
                  {step === 2 && <button onClick={() => setStep(1)} className="p-2 hover:bg-white/[0.06] rounded-lg text-[#A1A1AA] hover:text-[#EAE8E1] transition-all"><ArrowLeft className="size-5" /></button>}
                  <div>
                    <p className="text-[16px] font-medium text-[#EAE8E1]">{step === 1 ? 'Wybierz dostawcę poczty' : `Podłącz ${provider === 'gmail' ? 'Google' : provider === 'outlook' ? 'Microsoft 365' : 'własny serwer'}`}</p>
                    <p className="text-[13px] text-[#71717A] mt-1">Połączenie szyfrowane end-to-end</p>
                  </div>
                </div>
                <button onClick={close} className="p-2 text-[#71717A] hover:text-[#EAE8E1] hover:bg-white/[0.06] rounded-lg transition-all"><X className="size-5" /></button>
              </div>

              {/* Step 1 — provider pick */}
              {step === 1 && (
                <div className="p-8 grid grid-cols-3 gap-4">
                  {[
                    { id: 'gmail' as Provider, name: 'Google', sub: 'Gmail, Workspace', logo: <GoogleLogo size={32} /> },
                    { id: 'outlook' as Provider, name: 'Microsoft', sub: 'Outlook, Exchange', logo: <MicrosoftLogo size={30} /> },
                    { id: 'other' as Provider, name: 'Inny', sub: 'Zoho, OVH, własny', logo: <Server className="size-7 text-[#A1A1AA]" /> },
                  ].map(p => (
                    <button
                      key={p.id}
                      onClick={() => pick(p.id)}
                      className="flex flex-col items-center gap-5 p-6 bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/[0.15] rounded-2xl transition-all group"
                    >
                      <div className="size-14 flex items-center justify-center">{p.logo}</div>
                      <div className="text-center">
                        <p className="text-[15px] font-medium text-[#EAE8E1] mb-1">{p.name}</p>
                        <p className="text-[13px] text-[#71717A]">{p.sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Step 2 — form */}
              {step === 2 && (
                <div className="flex">
                  <form onSubmit={submit} className="flex-1 p-8 space-y-5">
                    {err && (
                      <div className="flex items-start gap-3 p-4 bg-[#b56060]/10 border border-[#b56060]/20 rounded-xl text-[#b56060] text-[14px]">
                        <AlertCircle className="size-5 shrink-0 mt-0.5" />{err}
                      </div>
                    )}
                    <div><FLabel>Adres e-mail</FLabel><FInput type="email" required value={mb.email} onChange={e => setMb(p => ({ ...p, email: e.target.value }))} placeholder="jan@firma.pl" /></div>
                    <div><FLabel>Nazwa nadawcy</FLabel><FInput value={mb.name} onChange={e => setMb(p => ({ ...p, name: e.target.value }))} placeholder="Jan Kowalski" /></div>

                    {provider === 'other' && (
                      <div className="space-y-4 p-5 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                        <div>
                          <FLabel>SMTP</FLabel>
                          <div className="flex gap-3">
                            <FInput required placeholder="smtp.domena.pl" value={mb.smtpHost} onChange={e => setMb(p => ({ ...p, smtpHost: e.target.value }))} />
                            <FInput required placeholder="465" value={mb.smtpPort} onChange={e => setMb(p => ({ ...p, smtpPort: e.target.value }))} className="w-24" />
                          </div>
                        </div>
                        <div>
                          <FLabel>IMAP</FLabel>
                          <div className="flex gap-3">
                            <FInput required placeholder="imap.domena.pl" value={mb.imapHost} onChange={e => setMb(p => ({ ...p, imapHost: e.target.value }))} />
                            <FInput required placeholder="993" value={mb.imapPort} onChange={e => setMb(p => ({ ...p, imapPort: e.target.value }))} className="w-24" />
                          </div>
                        </div>
                      </div>
                    )}

                    <div><FLabel>Hasło aplikacji</FLabel><FInput type="password" required value={mb.password} onChange={e => setMb(p => ({ ...p, password: e.target.value }))} placeholder="16-znakowy kod aplikacji" className="font-mono tracking-widest" /></div>

                    <button type="submit" disabled={verifying} className="w-full py-3.5 bg-[#EAE8E1] hover:bg-white text-[#1A1A1A] text-[15px] font-medium rounded-xl transition-all disabled:opacity-40 flex items-center justify-center gap-2.5 mt-3">
                      {verifying ? <><Loader2 className="size-4 animate-spin" />Weryfikuję...</> : 'Połącz skrzynkę'}
                    </button>
                  </form>

                  {/* Instructions sidebar */}
                  <div className="w-64 p-8 border-l border-white/[0.06] bg-white/[0.01]">
                    <p className="text-[12px] font-medium text-[#71717A] uppercase tracking-wider mb-5">Instrukcja</p>
                    {provider === 'gmail' && (
                      <ol className="space-y-4 text-[14px] text-[#A1A1AA] list-decimal pl-5 marker:text-[#71717A]">
                        <li className="leading-relaxed">Otwórz zarządzanie kontem Google</li>
                        <li className="leading-relaxed">Bezpieczeństwo → Weryfikacja dwuetapowa</li>
                        <li className="leading-relaxed">Wyszukaj <span className="text-[#EAE8E1]">Hasła aplikacji</span></li>
                        <li className="leading-relaxed">Nazwij apkę "ZEC" i wygeneruj kod</li>
                        <li className="leading-relaxed">Wklej 16-znakowy kod tutaj</li>
                      </ol>
                    )}
                    {provider === 'outlook' && (
                      <ol className="space-y-4 text-[14px] text-[#A1A1AA] list-decimal pl-5 marker:text-[#71717A]">
                        <li className="leading-relaxed">Otwórz ustawienia konta Microsoft</li>
                        <li className="leading-relaxed">Bezpieczeństwo → Weryfikacja dwuetapowa</li>
                        <li className="leading-relaxed">Utwórz <span className="text-[#EAE8E1]">Hasło aplikacji</span></li>
                        <li className="leading-relaxed">Wklej wygenerowany kod tutaj</li>
                      </ol>
                    )}
                    {provider === 'other' && (
                      <p className="text-[14px] text-[#A1A1AA] leading-relaxed">Dane SMTP/IMAP znajdziesz w panelu hostingu. Zazwyczaj możesz użyć standardowego hasła do skrzynki.</p>
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
    <div className="space-y-12">
      {/* Current plan */}
      <section>
        <h2 className="text-[18px] font-medium text-[#EAE8E1] mb-1">Obecny plan</h2>
        <p className="text-[15px] text-[#A1A1AA] mb-6">Zarządzaj subskrypcją i kredytami</p>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 mb-5">
          <div className="flex items-start justify-between mb-8">
            <div>
              <p className="text-[13px] text-[#71717A] uppercase tracking-wider mb-2">Twój plan</p>
              <p className="text-[32px] font-medium text-[#EAE8E1] tracking-tight">Growth</p>
            </div>
            <div className="text-right">
              <p className="text-[13px] text-[#71717A] uppercase tracking-wider mb-2">Cena</p>
              <p className="text-[32px] font-medium text-[#EAE8E1] tracking-tight">$129<span className="text-[16px] text-[#A1A1AA]">/msc</span></p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-y-3.5 gap-x-5 mb-8">
            {['2000 leadów miesięcznie', '3 podpięte skrzynki', 'AI Hyper-Personalization', 'Auto-Follow-upy'].map(f => (
              <div key={f} className="flex items-center gap-3 text-[15px] text-[#A1A1AA]">
                <CheckCircle2 className="size-4 text-[#5d9970] shrink-0" />{f}
              </div>
            ))}
          </div>

          <div>
            <div className="flex justify-between text-[14px] mb-3">
              <span className="text-[#A1A1AA]">Wykorzystanie kredytów</span>
              <span className="text-[#EAE8E1] font-mono">1450 / 2000</span>
            </div>
            <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden"><div className="h-full bg-[#A1A1AA] rounded-full" style={{ width: '72.5%' }} /></div>
            <p className="text-[13px] text-[#71717A] mt-3">Odnawia się 1 kwietnia 2026</p>
          </div>
        </div>

        <div className="flex gap-4">
          <button className="flex-1 py-3.5 bg-[#EAE8E1] hover:bg-white text-[#1A1A1A] text-[14px] font-medium rounded-xl transition-all">Zmień plan</button>
          <button className="px-6 py-3.5 border border-white/[0.1] text-[#A1A1AA] hover:text-[#EAE8E1] hover:border-white/[0.2] text-[14px] rounded-xl transition-all">Anuluj subskrypcję</button>
        </div>
      </section>

      <Rule />

      {/* Payment method */}
      <section>
        <h2 className="text-[18px] font-medium text-[#EAE8E1] mb-6">Metoda płatności</h2>
        <div className="flex items-center justify-between p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="size-11 bg-white/[0.05] rounded-xl flex items-center justify-center"><CreditCard className="size-5 text-[#A1A1AA]" /></div>
            <div>
              <p className="text-[16px] font-medium text-[#EAE8E1]">•••• •••• •••• 4242</p>
              <p className="text-[14px] text-[#A1A1AA] mt-0.5">Wygasa 12/27</p>
            </div>
          </div>
          <button className="text-[14px] font-medium text-[#A1A1AA] hover:text-[#EAE8E1] border border-white/[0.1] hover:border-white/[0.2] px-5 py-2.5 rounded-xl transition-all">Zmień</button>
        </div>
      </section>

      <Rule />

      {/* Invoices */}
      <section>
        <h2 className="text-[18px] font-medium text-[#EAE8E1] mb-6">Historia faktur</h2>
        <div className="space-y-2">
          {invoices.map(inv => (
            <div key={inv.id} className="flex items-center justify-between px-6 py-4 rounded-2xl hover:bg-white/[0.03] transition-all group border border-transparent hover:border-white/[0.06]">
              <div className="flex items-center gap-4">
                <div className="size-10 bg-white/[0.04] rounded-lg flex items-center justify-center"><CreditCard className="size-4 text-[#A1A1AA]" /></div>
                <div>
                  <p className="text-[15px] font-medium text-[#EAE8E1]">{inv.plan}</p>
                  <p className="text-[13px] text-[#71717A] mt-0.5">{inv.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[15px] font-medium text-[#5d9970]">{inv.amount}</span>
                <button className="p-2 text-[#71717A] hover:text-[#EAE8E1] hover:bg-white/[0.06] rounded-lg transition-all opacity-0 group-hover:opacity-100"><Download className="size-4" /></button>
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
      <h2 className="text-[18px] font-medium text-[#EAE8E1] mb-1">Czarna lista</h2>
      <p className="text-[15px] text-[#A1A1AA] mb-8">Adresy i domeny które nigdy nie trafią do kampanii</p>

      <div className="flex gap-3 mb-6">
        <FInput value={newEntry} onChange={e => setNewEntry(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder="adres@email.pl lub @cała-domena.pl" className="flex-1" />
        <button onClick={add} className="px-6 py-3.5 bg-[#EAE8E1] hover:bg-white text-[#1A1A1A] text-[14px] font-medium rounded-xl transition-all whitespace-nowrap">Dodaj</button>
      </div>

      {entries.length > 5 && (
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[#71717A]" />
          <FInput value={filter} onChange={e => setFilter(e.target.value)} placeholder="Szukaj..." className="pl-11" />
        </div>
      )}

      <div className="space-y-1.5 max-h-96 overflow-y-auto pr-2">
        {entries.filter(e => e.includes(filter)).map(entry => (
          <div key={entry} className="flex items-center justify-between px-5 py-3.5 rounded-xl border border-transparent hover:border-white/[0.06] hover:bg-white/[0.02] group transition-all">
            <div className="flex items-center gap-3.5">
              <Shield className="size-4 text-[#71717A]" />
              <span className="text-[15px] font-mono text-[#EAE8E1]">{entry}</span>
            </div>
            <button onClick={() => setEntries(entries.filter(e => e !== entry))} className="opacity-0 group-hover:opacity-100 p-1.5 text-[#71717A] hover:text-[#b56060] transition-all"><X className="size-4" /></button>
          </div>
        ))}
      </div>

      <p className="text-[13px] text-[#71717A] mt-6">{entries.length} wpisów · Możesz dodawać całe domeny np. @spam.pl</p>
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
          <h2 className="text-[18px] font-medium text-[#EAE8E1] mb-6">{g.title}</h2>
          <div className="space-y-0">
            {g.items.map((item, i) => (
              <div key={item.k}>
                <div className="flex items-center justify-between py-5">
                  <div>
                    <p className="text-[15px] font-medium text-[#EAE8E1]">{item.l}</p>
                    <p className="text-[14px] text-[#A1A1AA] mt-1">{item.d}</p>
                  </div>
                  <SoftToggle checked={s[item.k]} onChange={() => tog(item.k)} />
                </div>
                {i < g.items.length - 1 && <div className="h-px bg-white/[0.06]" />}
              </div>
            ))}
          </div>
          {gi < groups.length - 1 && <div className="h-px bg-white/[0.08] mt-8" />}
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
    <div className="max-w-5xl mx-auto">
      <div className="mb-12">
        <h1 className="text-[28px] font-serif text-[#EAE8E1] tracking-tight">Ustawienia</h1>
        <p className="text-[15px] text-[#A1A1AA] mt-2">Zarządzaj kontem, skrzynkami i preferencjami</p>
      </div>

      <div className="grid grid-cols-12 gap-12">
        {/* Sidebar nav */}
        <nav className="col-span-12 lg:col-span-3 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-[15px] font-medium transition-all text-left ${
                activeTab === tab.id
                  ? 'bg-white/[0.08] text-[#EAE8E1]'
                  : 'text-[#A1A1AA] hover:text-[#EAE8E1] hover:bg-white/[0.03]'
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