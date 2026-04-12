import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User, Mail, CreditCard, Shield, Bell,
  CheckCircle2, Plus, Trash2, AlertCircle, 
  X, Loader2, ArrowLeft, Server, Sparkles, 
  Eye, EyeOff, Download, Check, Search, Info,
  Building, Megaphone, Lock
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// IMPORT TWOICH BRANŻ (Dostosuj ścieżkę jeśli jest inna)
import { INDUSTRIES } from '../data/searchOptions';

type Tab = 'profile' | 'company' | 'mailboxes' | 'campaign' | 'billing' | 'blacklist' | 'notifications';
type Provider = 'gmail' | 'outlook' | 'other' | null;

interface EmailAccount {
  id: string;
  email_address: string;
  sender_name: string;
  status: 'connected' | 'error';
  daily_limit: number;
  sent_today: number;
  last_sync: string | null;
  smtp_host: string;
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

const inputCls = `w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-5 py-3.5
  text-[15px] text-[#EAE8E1] placeholder:text-[#71717A]
  focus:outline-none focus:border-white/[0.25] focus:bg-white/[0.06]
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

// ─── Autocomplete Component ───────────────────────────────────────────────────

function IndustryAutocomplete({ value, onChange }: { value: string, onChange: (v: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const options = INDUSTRIES.map(ind => ind.label);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  return (
    <div className="relative" ref={wrapperRef}>
      <FInput 
        value={query} 
        onChange={(e) => { setQuery(e.target.value); onChange(e.target.value); setIsOpen(true); }}
        onFocus={() => setIsOpen(true)}
        placeholder="Wpisz lub wybierz branżę..."
        required
      />
      <AnimatePresence>
        {isOpen && filtered.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
            className="absolute top-full left-0 right-0 mt-2 max-h-60 overflow-y-auto bg-[#1A1A1A] border border-white/[0.12] rounded-xl shadow-2xl z-50 p-1"
          >
            {filtered.map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => { setQuery(opt); onChange(opt); setIsOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-[14px] text-[#EAE8E1] hover:bg-white/[0.06] rounded-lg transition-colors"
              >
                {opt}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


// ─── Profile Tab (Complex Account & Security) ────────────────────────────────

function ProfileTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', timezone: 'Europe/Warsaw' });
  
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passForm, setPassForm] = useState({ newPass: '', confirmPass: '' });
  const [showPass, setShowPass] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      const fullName = data?.full_name || '';
      const nameParts = fullName.split(' ');
      
      setForm({ 
        firstName: nameParts[0] || '', 
        lastName: nameParts.slice(1).join(' ') || '', 
        email: session.user.email || '', 
        phone: data?.phone || '', 
        timezone: data?.timezone || 'Europe/Warsaw' 
      });
    }
    setLoading(false);
  };

  const save = async () => {
    setErr(null);
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      // 1. Aktualizacja danych profilu
      const fullName = `${form.firstName} ${form.lastName}`.trim();
      await supabase.from('profiles').update({ 
        full_name: fullName, 
        phone: form.phone, 
        timezone: form.timezone 
      }).eq('id', session.user.id);

      // 2. Aktualizacja hasła (jeśli formularz otwarty)
      if (isChangingPassword) {
        if (!passForm.newPass || passForm.newPass !== passForm.confirmPass) {
          setErr("Hasła nie pasują do siebie lub są puste.");
          setSaving(false);
          return;
        }
        const { error } = await supabase.auth.updateUser({ password: passForm.newPass });
        if (error) {
          setErr(error.message);
          setSaving(false);
          return;
        }
        setIsChangingPassword(false);
        setPassForm({ newPass: '', confirmPass: '' });
      }
    }
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(p => ({ ...p, [k]: e.target.value }));
  const pf = (k: keyof typeof passForm) => (e: React.ChangeEvent<HTMLInputElement>) => setPassForm(p => ({ ...p, [k]: e.target.value }));

  const initials = `${form.firstName?.[0] || ''}${form.lastName?.[0] || ''}`.toUpperCase() || 'U';

  if (loading) return <div className="flex justify-center py-14"><Loader2 className="size-6 text-[#71717A] animate-spin" /></div>;

  return (
    <div className="space-y-12">
      {/* Awatar i Informacje podstawowe */}
      <section className="space-y-8">
        <div>
          <h2 className="text-[18px] font-medium text-[#EAE8E1]">Dane konta</h2>
          <p className="text-[15px] text-[#A1A1AA] mt-1">Podstawowe dane logowania i identyfikacja</p>
        </div>

        <div className="flex items-center gap-6">
          <div className="size-20 bg-white/[0.06] border border-white/[0.1] rounded-full flex items-center justify-center text-[24px] font-medium text-[#EAE8E1] tracking-wider">
            {initials}
          </div>
          <div>
            <p className="text-[16px] font-medium text-[#EAE8E1]">{form.firstName} {form.lastName}</p>
            <p className="text-[14px] text-[#71717A] mt-0.5">{form.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div><FLabel>Imię</FLabel><FInput value={form.firstName} onChange={f('firstName')} placeholder="Jan" /></div>
          <div><FLabel>Nazwisko</FLabel><FInput value={form.lastName} onChange={f('lastName')} placeholder="Kowalski" /></div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div><FLabel>E-mail (Login)</FLabel><FInput value={form.email} disabled className="opacity-50" /></div>
          <div><FLabel>Telefon prywatny</FLabel><FInput value={form.phone} onChange={f('phone')} placeholder="+48 000 000 000" /></div>
        </div>

        <div className="w-1/2 pr-2.5">
          <FLabel>Strefa czasowa</FLabel>
          <FSelect value={form.timezone} onChange={f('timezone')}>
            <option value="Europe/Warsaw" className="bg-[#1a1a1a]">Europa / Warszawa (CET)</option>
            <option value="Europe/London" className="bg-[#1a1a1a]">Europa / Londyn (GMT)</option>
            <option value="America/New_York" className="bg-[#1a1a1a]">Ameryka / Nowy Jork (EST)</option>
            <option value="Asia/Dubai" className="bg-[#1a1a1a]">Azja / Dubaj (GST)</option>
          </FSelect>
        </div>
      </section>

      <Rule />

      {/* Bezpieczeństwo / Hasło */}
      <section className="space-y-6">
        <div>
          <h2 className="text-[18px] font-medium text-[#EAE8E1]">Bezpieczeństwo</h2>
          <p className="text-[15px] text-[#A1A1AA] mt-1">Zarządzaj hasłem do swojego konta</p>
        </div>

        {err && (
          <div className="flex items-start gap-3 p-4 bg-[#b56060]/10 border border-[#b56060]/20 rounded-xl text-[#b56060] text-[14px]">
            <AlertCircle className="size-5 shrink-0 mt-0.5" />{err}
          </div>
        )}

        {!isChangingPassword ? (
          <button 
            onClick={() => setIsChangingPassword(true)}
            className="flex items-center gap-2.5 px-5 py-3 border border-white/[0.1] text-[#EAE8E1] text-[14px] font-medium rounded-xl hover:bg-white/[0.04] transition-all"
          >
            <Lock className="size-4" /> Zmień hasło
          </button>
        ) : (
          <div className="p-6 bg-white/[0.02] border border-white/[0.08] rounded-2xl space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <div>
                <FLabel>Nowe hasło</FLabel>
                <div className="relative">
                  <FInput type={showPass ? 'text' : 'password'} value={passForm.newPass} onChange={pf('newPass')} placeholder="Wpisz nowe hasło" />
                  <button onClick={() => setShowPass(v => !v)} className="absolute right-5 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#A1A1AA] transition-colors">
                    {showPass ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
              </div>
              <div>
                <FLabel>Potwierdź nowe hasło</FLabel>
                <FInput type={showPass ? 'text' : 'password'} value={passForm.confirmPass} onChange={pf('confirmPass')} placeholder="Powtórz nowe hasło" />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => { setIsChangingPassword(false); setPassForm({ newPass: '', confirmPass: '' }); setErr(null); }}
                className="px-5 py-3 text-[#A1A1AA] hover:text-[#EAE8E1] text-[14px] font-medium transition-all"
              >
                Anuluj
              </button>
            </div>
          </div>
        )}

      </section>

      <div className="flex justify-end pt-4"><SaveBtn saving={saving} saved={saved} onClick={save} /></div>
    </div>
  );
}

// ─── Company Info ────────────────────────────────────────────────────────────

function CompanyTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '', website: '', industry: '', short_description: '',
    ideal_customer_profile: '', competitive_advantages: '', ai_context: ''
  });

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data } = await supabase.from('companies').select('*').eq('user_id', session.user.id).single();
      if (data) {
        setForm({
          name: data.name || '', website: data.website || '', industry: data.industry || '',
          short_description: data.short_description || '', ideal_customer_profile: data.ideal_customer_profile || '',
          competitive_advantages: data.competitive_advantages || '', ai_context: data.ai_context || ''
        });
      }
    }
    setLoading(false);
  };

  const save = async () => {
    setErr(null);
    if (!form.name || !form.website || !form.industry || !form.short_description) {
      setErr("Proszę wypełnić wszystkie wymagane pola oznaczone gwiazdką.");
      return;
    }

    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.from('companies').upsert({ user_id: session.user.id, ...form }, { onConflict: 'user_id' });
    }
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  if (loading) return <div className="flex justify-center py-14"><Loader2 className="size-6 text-[#71717A] animate-spin" /></div>;

  return (
    <div className="space-y-12">
      {err && (
        <div className="flex items-start gap-3 p-4 bg-[#b56060]/10 border border-[#b56060]/20 rounded-xl text-[#b56060] text-[14px]">
          <AlertCircle className="size-5 shrink-0 mt-0.5" />{err}
        </div>
      )}

      {/* Sekcja 1: Podstawy */}
      <section className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[18px] font-medium text-[#EAE8E1]">Podstawowe informacje o firmie</h2>
            <p className="text-[15px] text-[#A1A1AA] mt-1">Niezbędne minimum do zdefiniowania Twojej działalności</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div>
            <FLabel>Nazwa firmy <span className="text-[#b56060]">*</span></FLabel>
            <FInput value={form.name} onChange={f('name')} placeholder="np. TechFlow Sp. z o.o." required />
          </div>
          <div>
            <FLabel>Strona WWW <span className="text-[#b56060]">*</span></FLabel>
            <FInput value={form.website} onChange={f('website')} placeholder="https://techflow.pl" required />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div className="relative">
            <FLabel>Branża <span className="text-[#b56060]">*</span></FLabel>
            <IndustryAutocomplete value={form.industry} onChange={(val) => setForm(p => ({ ...p, industry: val }))} />
          </div>
          <div>
            <FLabel>Krótki opis (Czym się zajmujecie?) <span className="text-[#b56060]">*</span></FLabel>
            <FInput value={form.short_description} onChange={f('short_description')} placeholder="np. Tworzymy dedykowane oprogramowanie dla logistyki." required />
          </div>
        </div>
      </section>

      <Rule />

      {/* Sekcja 2: Paliwo dla AI */}
      <section className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[18px] font-medium text-[#EAE8E1]">Dodatkowy kontekst dla AI <span className="text-[#71717A] text-[15px] font-normal">(opcjonalne)</span></h2>
            <p className="text-[15px] text-[#A1A1AA] mt-1">Im więcej detali tu podasz, tym trafniejsza będzie personalizacja maili.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div>
            <FLabel>Profil idealnego klienta (Kto jest odbiorcą?)</FLabel>
            <FInput value={form.ideal_customer_profile} onChange={f('ideal_customer_profile')} placeholder="np. Dyrektorzy operacyjni w firmach 50+ pracowników" />
          </div>
          <div>
            <FLabel>Kluczowe wyróżniki (Twoja przewaga)</FLabel>
            <FInput value={form.competitive_advantages} onChange={f('competitive_advantages')} placeholder="np. Wdrożenie w 14 dni, darmowy audyt na start" />
          </div>
        </div>

        <div>
          <FLabel>Szczegółowy opis działalności</FLabel>
          <FTextarea
            value={form.ai_context}
            onChange={f('ai_context') as any}
            placeholder="Opisz wszystko, co AI powinno wiedzieć: wielkość firmy, kluczowi klienci, wasza historia, szczegóły oferty, najczęstsze problemy, które rozwiązujecie..."
            rows={5}
          />
        </div>
      </section>

      <div className="flex justify-end pt-4"><SaveBtn saving={saving} saved={saved} onClick={save} /></div>
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
  const [updatingLimit, setUpdatingLimit] = useState<string | null>(null);
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

  const updateLimit = async (id: string, newLimit: number) => {
    if (!newLimit || isNaN(newLimit) || newLimit < 1) return;
    setUpdatingLimit(id);
    await supabase.from('email_accounts').update({ daily_limit: newLimit }).eq('id', id);
    setMailboxes(prev => prev.map(m => m.id === id ? { ...m, daily_limit: newLimit } : m));
    setUpdatingLimit(null);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    try {
      return new Intl.DateTimeFormat('pl-PL', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }).format(new Date(dateString));
    } catch { return '—'; }
  };

  const detectProvider = (email: string, smtpHost: string) => {
    const lEmail = email.toLowerCase();
    const lHost = (smtpHost || '').toLowerCase();
    if (lEmail.includes('@gmail.com') || lHost.includes('gmail') || lHost.includes('google')) {
      return { name: 'Google', logo: <GoogleLogo size={18} /> };
    }
    if (lEmail.includes('@outlook.') || lEmail.includes('@hotmail.') || lHost.includes('office365') || lHost.includes('microsoft')) {
      return { name: 'Microsoft', logo: <MicrosoftLogo size={18} /> };
    }
    return { name: 'Inny host', logo: <Server className="size-5 text-[#A1A1AA]" /> };
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
              const pInfo = detectProvider(m.email_address, m.smtp_host);
              
              return (
                <div key={m.id} className="rounded-2xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.06] p-6 transition-all duration-300">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="size-11 bg-white/[0.06] rounded-xl flex items-center justify-center">
                        {pInfo.logo}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-0.5">
                          <p className="text-[16px] font-medium text-[#EAE8E1]">{m.email_address}</p>
                          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.06] border border-white/[0.04] text-[11px] text-[#A1A1AA] font-medium uppercase tracking-wider">
                            {pInfo.name}
                          </span>
                        </div>
                        <p className="text-[14px] text-[#A1A1AA]">{m.sender_name}</p>
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
                    <div>
                      <p className="text-[#71717A] mb-2">Wysłano dziś</p>
                      <p className="font-medium text-[#EAE8E1]">{m.sent_today} <span className="text-[#71717A] font-normal">/ {m.daily_limit}</span></p>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-[#71717A]">Limit dzienny</p>
                        <div className="relative group">
                          <Info className="size-3.5 text-[#71717A] cursor-help hover:text-[#EAE8E1] transition-colors" />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 bg-[#1A1A1A] border border-white/[0.12] text-[#A1A1AA] text-[12px] leading-relaxed rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 text-center shadow-xl">
                            Zalecany limit to <strong className="text-[#EAE8E1] font-medium">30-50 maili</strong> dziennie dla jednej skrzynki, aby uniknąć blokady antyspamowej.
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          min="1"
                          defaultValue={m.daily_limit}
                          onBlur={(e) => updateLimit(m.id, parseInt(e.target.value))}
                          className="w-16 bg-transparent border border-white/[0.12] rounded-lg px-2 py-1 text-[14px] text-[#EAE8E1] focus:outline-none focus:border-white/[0.25] focus:bg-white/[0.04] transition-all text-center"
                        />
                        <span className="text-[#71717A] text-[13px]">maili</span>
                        {updatingLimit === m.id && <Loader2 className="size-3.5 text-[#A1A1AA] animate-spin ml-1" />}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-[#71717A] mb-2">Ostatnia sync</p>
                      <p className="font-medium text-[#EAE8E1]">{formatDate(m.last_sync)}</p>
                    </div>
                  </div>
                  <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden"><div className="h-full bg-[#A1A1AA] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal skrzynek */}
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

// ─── Campaign Settings ───────────────────────────────────────────────────────

function CampaignSettingsTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({ tone_of_voice: 'professional', primary_goal: 'meeting' });
  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLSelectElement>) => setForm(p => ({ ...p, [k]: e.target.value }));

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data } = await supabase.from('campaign_defaults').select('*').eq('user_id', session.user.id).single();
      if (data) setForm({ tone_of_voice: data.tone_of_voice || 'professional', primary_goal: data.primary_goal || 'meeting' });
    }
    setLoading(false);
  };

  const save = async () => {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.from('campaign_defaults').upsert({ user_id: session.user.id, ...form }, { onConflict: 'user_id' });
    }
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  if (loading) return <div className="flex justify-center py-14"><Loader2 className="size-6 text-[#71717A] animate-spin" /></div>;

  return (
    <div className="space-y-12">
      <section className="space-y-6">
        <div>
          <h2 className="text-[18px] font-medium text-[#EAE8E1]">Domyślne ustawienia kampanii</h2>
          <p className="text-[15px] text-[#A1A1AA] mt-1">Te wartości będą używane jako podstawa przy tworzeniu nowych sekwencji.</p>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div>
            <FLabel>Ton komunikacji</FLabel>
            <FSelect value={form.tone_of_voice} onChange={f('tone_of_voice')}>
              <option value="professional" className="bg-[#1a1a1a] text-[#EAE8E1]">Profesjonalny i formalny (Korporacje, B2B)</option>
              <option value="direct" className="bg-[#1a1a1a] text-[#EAE8E1]">Bezpośredni i luźny (Startupy, E-commerce)</option>
              <option value="analytical" className="bg-[#1a1a1a] text-[#EAE8E1]">Krótki i analityczny (CTO, Kadra C-level)</option>
            </FSelect>
          </div>
          <div>
            <FLabel>Główny cel maila (Call to Action)</FLabel>
            <FSelect value={form.primary_goal} onChange={f('primary_goal')}>
              <option value="meeting" className="bg-[#1a1a1a] text-[#EAE8E1]">Zaproszenie na krótkie spotkanie / Call</option>
              <option value="material" className="bg-[#1a1a1a] text-[#EAE8E1]">Odesłanie do Case Study / Materiałów</option>
              <option value="interest" className="bg-[#1a1a1a] text-[#EAE8E1]">Miękkie badanie gruntu ("Czy to u was temat?")</option>
            </FSelect>
          </div>
        </div>
      </section>

      <div className="flex justify-end pt-4"><SaveBtn saving={saving} saved={saved} onClick={save} /></div>
    </div>
  );
}

// ─── Billing, Blacklist, Notifications ────────────────────────────────────────

function BillingTab() {
  const invoices = [
    { id: 1, date: '1.04.2026', plan: 'Growth', amount: '$129.00' },
    { id: 2, date: '1.03.2026', plan: 'Growth', amount: '$129.00' },
    { id: 3, date: '1.02.2026', plan: 'Starter', amount: '$49.00' },
  ];

  return (
    <div className="space-y-12">
      <section>
        <h2 className="text-[18px] font-medium text-[#EAE8E1] mb-1">Obecny plan</h2>
        <p className="text-[15px] text-[#A1A1AA] mb-6">Zarządzaj subskrypcją i kredytami</p>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-8 mb-5">
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
            <p className="text-[13px] text-[#71717A] mt-3">Odnawia się 1 maja 2026</p>
          </div>
        </div>

        <div className="flex gap-4">
          <button className="flex-1 py-3.5 bg-[#EAE8E1] hover:bg-white text-[#1A1A1A] text-[14px] font-medium rounded-xl transition-all">Zmień plan</button>
          <button className="px-6 py-3.5 border border-white/[0.1] text-[#A1A1AA] hover:text-[#EAE8E1] hover:border-white/[0.2] text-[14px] rounded-xl transition-all">Anuluj subskrypcję</button>
        </div>
      </section>

      <Rule />

      <section>
        <h2 className="text-[18px] font-medium text-[#EAE8E1] mb-6">Metoda płatności</h2>
        <div className="flex items-center justify-between p-6 rounded-2xl border border-white/[0.08] bg-white/[0.04]">
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

      <section>
        <h2 className="text-[18px] font-medium text-[#EAE8E1] mb-6">Historia faktur</h2>
        <div className="space-y-2">
          {invoices.map(inv => (
            <div key={inv.id} className="flex items-center justify-between px-6 py-4 rounded-2xl hover:bg-white/[0.04] transition-all group border border-transparent hover:border-white/[0.06]">
              <div className="flex items-center gap-4">
                <div className="size-10 bg-white/[0.05] rounded-lg flex items-center justify-center"><CreditCard className="size-4 text-[#A1A1AA]" /></div>
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
          <div key={entry} className="flex items-center justify-between px-5 py-3.5 rounded-xl border border-transparent hover:border-white/[0.06] hover:bg-white/[0.04] group transition-all">
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
    { id: 'company', label: 'Informacje o firmie', icon: Building },
    { id: 'mailboxes', label: 'Skrzynki pocztowe', icon: Mail },
    { id: 'campaign', label: 'Ustawienia kampanii', icon: Megaphone },
    { id: 'billing', label: 'Płatności', icon: CreditCard },
    { id: 'blacklist', label: 'Czarna lista', icon: Shield },
    { id: 'notifications', label: 'Powiadomienia', icon: Bell },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-12">
        <h1 className="text-[28px] font-serif text-[#EAE8E1] tracking-tight">Ustawienia</h1>
        <p className="text-[15px] text-[#A1A1AA] mt-2">Zarządzaj kontem, firmą, skrzynkami i preferencjami</p>
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
                  : 'text-[#A1A1AA] hover:text-[#EAE8E1] hover:bg-white/[0.04]'
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
              {activeTab === 'company' && <CompanyTab />}
              {activeTab === 'mailboxes' && <MailboxesTab />}
              {activeTab === 'campaign' && <CampaignSettingsTab />}
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