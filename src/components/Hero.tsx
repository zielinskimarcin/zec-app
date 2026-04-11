import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User, Mail, CreditCard, Shield, Bell,
  CheckCircle2, XCircle, Plus, Trash2,
  AlertCircle, X, Loader2, ArrowLeft, Video, Server,
  Sparkles, Building2, Tag, FileText, ChevronRight,
  Eye, EyeOff, Download, ToggleLeft, ToggleRight,
  Zap, Clock, TrendingUp, AlertTriangle, Check,
  Globe, Phone, MapPin, Briefcase
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Tiny helpers ─────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
      {children}
    </label>
  );
}

function Input({
  type = 'text', value, onChange, placeholder, required, className = '', ...rest
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className={`w-full bg-[#111] border border-[#1e1e1e] rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-gray-700 focus:outline-none focus:border-[#333] transition-all ${className}`}
      {...rest}
    />
  );
}

function SectionCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-6 ${className}`}>
      {children}
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-base font-bold text-white">{title}</h2>
      {subtitle && <p className="text-xs text-gray-600 mt-0.5">{subtitle}</p>}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-9 h-5 rounded-full transition-colors ${checked ? 'bg-white' : 'bg-[#222]'}`}
    >
      <span className={`absolute top-0.5 left-0.5 size-4 rounded-full transition-transform bg-black ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
  );
}

// ─── Tab: Profil ──────────────────────────────────────────────────────────────

function ProfileTab() {
  const [firstName, setFirstName] = useState('Jan');
  const [lastName, setLastName] = useState('Kowalski');
  const [email] = useState('jan@firma.pl');
  const [company, setCompany] = useState('Moja Firma Sp. z o.o.');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('••••••••••');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Opis firmy
  const [companyDesc, setCompanyDesc] = useState('');
  const [industry, setIndustry] = useState('');
  const [targetMarket, setTargetMarket] = useState('');
  const [usp, setUsp] = useState('');
  const [isRefining, setIsRefining] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleAiRefine = async () => {
    if (!companyDesc && !industry) return;
    setIsRefining(true);
    await new Promise(r => setTimeout(r, 1400));
    const refined = `${company || 'Nasza firma'} to ${industry ? industry.toLowerCase() + ' ' : ''}specjalizujące się w dostarczaniu wysokiej jakości rozwiązań dla klientów B2B. ${usp ? 'Nasza główna przewaga to ' + usp + '.' : ''} ${targetMarket ? 'Działamy głównie na rynku ' + targetMarket + '.' : ''} Jesteśmy nastawieni na długoterminowe relacje i mierzalne efekty dla naszych klientów.`.trim();
    setCompanyDesc(refined);
    setIsRefining(false);
  };

  return (
    <div className="space-y-4">
      {/* Dane osobowe */}
      <SectionCard>
        <SectionHeader title="Dane osobowe" subtitle="Widoczne dla odbiorców jako nadawca wiadomości" />
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Imię</Label>
              <Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Jan" />
            </div>
            <div>
              <Label>Nazwisko</Label>
              <Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Kowalski" />
            </div>
          </div>
          <div>
            <Label>Adres e-mail</Label>
            <Input value={email} disabled className="opacity-40 cursor-not-allowed" />
          </div>
          <div>
            <Label>Nowe hasło</Label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Wpisz nowe hasło..."
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Telefon</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+48 000 000 000" />
            </div>
            <div>
              <Label>Strona WWW</Label>
              <Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://twojafirma.pl" />
            </div>
          </div>
          <div>
            <Label>Nazwa firmy</Label>
            <Input value={company} onChange={e => setCompany(e.target.value)} placeholder="Firma Sp. z o.o." />
          </div>
        </div>
      </SectionCard>

      {/* Profil firmy – kluczowe dla AI */}
      <SectionCard>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="size-4 text-amber-400" />
              Profil firmy dla AI
            </h2>
            <p className="text-xs text-gray-600 mt-0.5">Na podstawie tych danych AI personalizuje każdy wysyłany mail</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Branża</Label>
              <select
                value={industry}
                onChange={e => setIndustry(e.target.value)}
                className="w-full bg-[#111] border border-[#1e1e1e] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#333] transition-all appearance-none cursor-pointer"
              >
                <option value="" className="bg-[#111] text-gray-500">Wybierz branżę...</option>
                <option value="IT / Software" className="bg-[#111]">IT / Software</option>
                <option value="Marketing / Agencja" className="bg-[#111]">Marketing / Agencja</option>
                <option value="Produkcja / Manufacturing" className="bg-[#111]">Produkcja / Manufacturing</option>
                <option value="Meble / Wyposażenie" className="bg-[#111]">Meble / Wyposażenie</option>
                <option value="Nieruchomości" className="bg-[#111]">Nieruchomości</option>
                <option value="Finanse / Doradztwo" className="bg-[#111]">Finanse / Doradztwo</option>
                <option value="Handel / E-commerce" className="bg-[#111]">Handel / E-commerce</option>
                <option value="Inne" className="bg-[#111]">Inne</option>
              </select>
            </div>
            <div>
              <Label>Rynek docelowy</Label>
              <Input value={targetMarket} onChange={e => setTargetMarket(e.target.value)} placeholder="np. Polska, Niemcy, UE" />
            </div>
          </div>

          <div>
            <Label>Główna przewaga (USP)</Label>
            <Input value={usp} onChange={e => setUsp(e.target.value)} placeholder="np. 10 lat doświadczenia, certyfikaty ISO, najniższe ceny" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label>Opis firmy</Label>
              <button
                onClick={handleAiRefine}
                disabled={isRefining || (!companyDesc && !industry)}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-400 hover:text-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {isRefining
                  ? <><Loader2 className="size-3 animate-spin" /> Ulepszam...</>
                  : <><Sparkles className="size-3" /> AI Refine</>
                }
              </button>
            </div>
            <textarea
              value={companyDesc}
              onChange={e => setCompanyDesc(e.target.value)}
              placeholder="Opisz swoją firmę — czym się zajmujesz, co oferujesz, co wyróżnia cię na tle konkurencji. Im więcej szczegółów, tym bardziej spersonalizowane maile wygeneruje AI."
              rows={5}
              className="w-full bg-[#111] border border-[#1e1e1e] rounded-lg px-4 py-3 text-sm text-white placeholder:text-gray-700 focus:outline-none focus:border-[#333] transition-all resize-none leading-relaxed"
            />
            <p className="text-[11px] text-gray-700 mt-1.5">
              {companyDesc.length} znaków · Zalecane minimum: 200 znaków
            </p>
          </div>
        </div>
      </SectionCard>

      {/* Zapisz */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2.5 bg-white text-black text-sm font-bold rounded-lg hover:bg-gray-100 transition-all disabled:opacity-50"
        >
          {isSaving ? <><Loader2 className="size-4 animate-spin" /> Zapisuję...</>
            : saved ? <><Check className="size-4" /> Zapisano!</>
              : 'Zapisz zmiany'}
        </button>
      </div>
    </div>
  );
}

// ─── Tab: Skrzynki ────────────────────────────────────────────────────────────

function MailboxesTab() {
  const [mailboxes, setMailboxes] = useState<EmailAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2>(1);
  const [selectedProvider, setSelectedProvider] = useState<Provider>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [newMailbox, setNewMailbox] = useState({
    email: '', name: '', password: '', smtpHost: '', smtpPort: '', imapHost: '', imapPort: ''
  });

  useEffect(() => { fetchMailboxes(); }, []);

  const fetchMailboxes = async () => {
    setIsLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data } = await supabase.from('email_accounts').select('*').order('created_at', { ascending: false });
      if (data) setMailboxes(data);
    }
    setIsLoading(false);
  };

  const handleProviderSelect = (provider: Provider) => {
    setSelectedProvider(provider);
    setVerifyError(null);
    if (provider === 'gmail') {
      setNewMailbox(prev => ({ ...prev, smtpHost: 'smtp.gmail.com', smtpPort: '465', imapHost: 'imap.gmail.com', imapPort: '993' }));
    } else if (provider === 'outlook') {
      setNewMailbox(prev => ({ ...prev, smtpHost: 'smtp.office365.com', smtpPort: '587', imapHost: 'outlook.office365.com', imapPort: '993' }));
    } else {
      setNewMailbox(prev => ({ ...prev, smtpHost: '', smtpPort: '', imapHost: '', imapPort: '' }));
    }
    setModalStep(2);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setModalStep(1); setSelectedProvider(null);
      setNewMailbox({ email: '', name: '', password: '', smtpHost: '', smtpPort: '', imapHost: '', imapPort: '' });
      setVerifyError(null);
    }, 300);
  };

  const handleAddMailbox = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyError(null);
    setIsVerifying(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Brak autoryzacji');

      const VERIFIER_URL = import.meta.env.DEV ? 'http://localhost:3000/verify' : '/api/verify';
      const response = await fetch(VERIFIER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ZEC_SECRET_2026' },
        body: JSON.stringify({ email: newMailbox.email, password: newMailbox.password, host: newMailbox.smtpHost, port: newMailbox.smtpPort })
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Błędne dane SMTP.');

      const { data, error } = await supabase.from('email_accounts').insert([{
        user_id: session.user.id,
        email_address: newMailbox.email,
        sender_name: newMailbox.name || newMailbox.email.split('@')[0],
        smtp_host: newMailbox.smtpHost,
        smtp_port: parseInt(newMailbox.smtpPort),
        smtp_password: newMailbox.password,
        imap_host: newMailbox.imapHost,
        imap_port: parseInt(newMailbox.imapPort),
        status: 'connected'
      }]).select().single();
      if (error) throw error;

      setMailboxes([data, ...mailboxes]);
      handleCloseModal();
    } catch (err: any) {
      setVerifyError(err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const removeMailbox = async (id: string) => {
    await supabase.from('email_accounts').delete().eq('id', id);
    setMailboxes(mailboxes.filter(m => m.id !== id));
  };

  return (
    <>
      <SectionCard>
        <div className="flex items-center justify-between mb-6">
          <SectionHeader
            title="Podłączone skrzynki"
            subtitle="Kampanie wysyłane są rotacyjnie z wszystkich aktywnych skrzynek"
          />
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black text-sm font-bold rounded-lg hover:bg-gray-100 transition-all shrink-0"
          >
            <Plus className="size-4" /> Dodaj skrzynkę
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="size-5 text-gray-600 animate-spin" /></div>
        ) : mailboxes.length === 0 ? (
          <div className="text-center py-14 border border-dashed border-[#1a1a1a] rounded-xl">
            <Mail className="size-7 text-gray-700 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-400 mb-1">Brak podłączonych skrzynek</p>
            <p className="text-xs text-gray-600 mb-4">Podłącz skrzynkę żeby zacząć wysyłać kampanie</p>
            <button onClick={() => setIsModalOpen(true)} className="text-xs font-semibold text-white hover:text-gray-300 transition-colors">
              Podłącz teraz →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {mailboxes.map((m) => {
              const pct = m.daily_limit > 0 ? Math.round((m.sent_today / m.daily_limit) * 100) : 0;
              return (
                <div key={m.id} className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="size-9 bg-white/5 border border-white/[0.06] rounded-lg flex items-center justify-center">
                        <Mail className="size-4 text-gray-400" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{m.email_address}</div>
                        <div className="text-xs text-gray-600">{m.sender_name}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {m.status === 'connected' ? (
                        <span className="flex items-center gap-1 px-2 py-1 bg-emerald-500/8 border border-emerald-500/15 text-emerald-400 rounded-md text-[10px] font-semibold">
                          <CheckCircle2 className="size-2.5" /> Aktywna
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2 py-1 bg-red-500/8 border border-red-500/15 text-red-400 rounded-md text-[10px] font-semibold">
                          <XCircle className="size-2.5" /> Błąd
                        </span>
                      )}
                      <button onClick={() => removeMailbox(m.id)} className="p-1.5 text-gray-700 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-all">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div>
                      <div className="text-[10px] text-gray-600 mb-0.5">Wysłano dziś</div>
                      <div className="text-sm font-bold text-white font-mono">{m.sent_today} / {m.daily_limit}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-600 mb-0.5">Limit dzienny</div>
                      <div className="text-sm font-bold text-white font-mono">{m.daily_limit} maili</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-600 mb-0.5">Ostatnia synchronizacja</div>
                      <div className="text-xs text-gray-400">{m.last_sync || '—'}</div>
                    </div>
                  </div>
                  <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl w-full max-w-3xl shadow-2xl"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-[#141414]">
                <div className="flex items-center gap-3">
                  {modalStep === 2 && (
                    <button onClick={() => setModalStep(1)} className="p-1.5 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-all">
                      <ArrowLeft className="size-4" />
                    </button>
                  )}
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {modalStep === 1 ? 'Wybierz dostawcę' : `Podłącz ${selectedProvider === 'gmail' ? 'Google' : selectedProvider === 'outlook' ? 'Microsoft 365' : 'SMTP/IMAP'}`}
                    </h3>
                    <p className="text-xs text-gray-600">Połączenie szyfrowane end-to-end</p>
                  </div>
                </div>
                <button onClick={handleCloseModal} className="p-1.5 text-gray-600 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                  <X className="size-4" />
                </button>
              </div>

              {modalStep === 1 && (
                <div className="p-6 grid grid-cols-3 gap-4">
                  {[
                    { id: 'gmail' as Provider, name: 'Google Workspace', sub: '@gmail.com lub własna domena', color: 'text-white' },
                    { id: 'outlook' as Provider, name: 'Microsoft 365', sub: 'Outlook, Exchange, Hotmail', color: 'text-blue-400' },
                    { id: 'other' as Provider, name: 'Inny dostawca', sub: 'Zoho, OVH, własny serwer', color: 'text-gray-400' },
                  ].map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleProviderSelect(p.id)}
                      className="flex flex-col items-center gap-3 p-6 bg-[#0f0f0f] hover:bg-[#141414] border border-[#1a1a1a] hover:border-[#252525] rounded-xl transition-all group"
                    >
                      <div className="size-12 bg-white/5 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                        {p.id === 'other' ? <Server className={`size-6 ${p.color}`} /> : <Mail className={`size-6 ${p.color}`} />}
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-white mb-0.5">{p.name}</div>
                        <div className="text-[11px] text-gray-600">{p.sub}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {modalStep === 2 && (
                <div className="flex">
                  <div className="flex-1 p-6 border-r border-[#141414]">
                    <form onSubmit={handleAddMailbox} className="space-y-4">
                      {verifyError && (
                        <div className="flex items-start gap-2.5 p-3 bg-red-500/8 border border-red-500/15 rounded-lg text-red-400 text-xs">
                          <AlertCircle className="size-4 shrink-0 mt-0.5" />
                          {verifyError}
                        </div>
                      )}
                      <div>
                        <Label>Adres e-mail</Label>
                        <Input type="email" required value={newMailbox.email} onChange={e => setNewMailbox({ ...newMailbox, email: e.target.value })} placeholder="jan@firma.pl" />
                      </div>
                      <div>
                        <Label>Nazwa nadawcy</Label>
                        <Input value={newMailbox.name} onChange={e => setNewMailbox({ ...newMailbox, name: e.target.value })} placeholder="Jan Kowalski" />
                      </div>
                      {selectedProvider === 'other' && (
                        <div className="space-y-3 p-4 bg-[#0f0f0f] rounded-xl border border-[#1a1a1a]">
                          <div>
                            <Label>SMTP</Label>
                            <div className="flex gap-2">
                              <Input required placeholder="smtp.domena.pl" value={newMailbox.smtpHost} onChange={e => setNewMailbox({ ...newMailbox, smtpHost: e.target.value })} />
                              <Input required placeholder="465" value={newMailbox.smtpPort} onChange={e => setNewMailbox({ ...newMailbox, smtpPort: e.target.value })} className="w-20" />
                            </div>
                          </div>
                          <div>
                            <Label>IMAP</Label>
                            <div className="flex gap-2">
                              <Input required placeholder="imap.domena.pl" value={newMailbox.imapHost} onChange={e => setNewMailbox({ ...newMailbox, imapHost: e.target.value })} />
                              <Input required placeholder="993" value={newMailbox.imapPort} onChange={e => setNewMailbox({ ...newMailbox, imapPort: e.target.value })} className="w-20" />
                            </div>
                          </div>
                        </div>
                      )}
                      <div>
                        <Label>Hasło aplikacji</Label>
                        <Input type="password" required value={newMailbox.password} onChange={e => setNewMailbox({ ...newMailbox, password: e.target.value })} placeholder="16-znakowy kod aplikacji" className="font-mono" />
                      </div>
                      <button type="submit" disabled={isVerifying} className="w-full py-2.5 bg-white text-black text-sm font-bold rounded-lg hover:bg-gray-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                        {isVerifying ? <><Loader2 className="size-4 animate-spin" /> Weryfikuję...</> : 'Połącz skrzynkę'}
                      </button>
                    </form>
                  </div>
                  <div className="w-64 p-6 bg-[#080808]">
                    <h4 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                      <AlertCircle className="size-3.5 text-amber-400" /> Instrukcja
                    </h4>
                    {selectedProvider === 'gmail' && (
                      <ol className="space-y-2 text-[11px] text-gray-500 list-decimal pl-4 marker:text-gray-700">
                        <li>Wejdź w ustawienia konta Google</li>
                        <li>Bezpieczeństwo → Weryfikacja dwuetapowa</li>
                        <li>Wyszukaj <span className="text-gray-300 font-medium">Hasła aplikacji</span></li>
                        <li>Nazwij apkę "ZEC Leads"</li>
                        <li>Skopiuj 16-znakowy kod</li>
                      </ol>
                    )}
                    {selectedProvider === 'outlook' && (
                      <ol className="space-y-2 text-[11px] text-gray-500 list-decimal pl-4 marker:text-gray-700">
                        <li>Wejdź w ustawienia konta Microsoft</li>
                        <li>Bezpieczeństwo → Weryfikacja dwuetapowa</li>
                        <li>Utwórz nowe <span className="text-gray-300 font-medium">Hasło aplikacji</span></li>
                        <li>Skopiuj wygenerowany kod</li>
                      </ol>
                    )}
                    {selectedProvider === 'other' && (
                      <p className="text-[11px] text-gray-500 leading-relaxed">
                        Dane SMTP/IMAP znajdziesz w panelu swojego hostingu. Zazwyczaj możesz użyć standardowego hasła do skrzynki.
                      </p>
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

// ─── Tab: Płatności ───────────────────────────────────────────────────────────

function BillingTab() {
  const mockInvoices = [
    { id: 1, date: '1.03.2026', plan: 'Growth', amount: '$129.00', status: 'paid' },
    { id: 2, date: '1.02.2026', plan: 'Growth', amount: '$129.00', status: 'paid' },
    { id: 3, date: '1.01.2026', plan: 'Starter', amount: '$49.00', status: 'paid' },
  ];

  return (
    <div className="space-y-4">
      {/* Aktualny plan */}
      <SectionCard>
        <SectionHeader title="Obecny plan" />
        <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-5 mb-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">Twój plan</div>
              <div className="text-xl font-bold text-white">Growth</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">Cena</div>
              <div className="text-xl font-bold text-white">$129<span className="text-sm font-normal text-gray-600">/msc</span></div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {['2000 leadów miesięcznie', '3 podpięte skrzynki', 'AI Hyper-Personalization', 'Auto-Follow-upy'].map(f => (
              <div key={f} className="flex items-center gap-2 text-xs text-gray-400">
                <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />
                {f}
              </div>
            ))}
          </div>
          <div className="mb-2">
            <div className="flex justify-between text-xs text-gray-600 mb-1.5">
              <span>Wykorzystanie kredytów</span>
              <span className="text-white font-mono">1450 / 2000</span>
            </div>
            <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full" style={{ width: '72.5%' }} />
            </div>
            <div className="text-[10px] text-gray-700 mt-1">Odnawia się 1 kwietnia 2026</div>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="flex-1 py-2.5 bg-white text-black text-sm font-bold rounded-lg hover:bg-gray-100 transition-all">
            Zmień plan
          </button>
          <button className="px-4 py-2.5 border border-[#1a1a1a] text-gray-400 hover:text-white hover:border-[#333] text-sm rounded-lg transition-all">
            Anuluj subskrypcję
          </button>
        </div>
      </SectionCard>

      {/* Metoda płatności */}
      <SectionCard>
        <SectionHeader title="Metoda płatności" />
        <div className="flex items-center justify-between p-4 bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl">
          <div className="flex items-center gap-3">
            <div className="size-8 bg-white/5 border border-white/[0.06] rounded-lg flex items-center justify-center">
              <CreditCard className="size-4 text-gray-400" />
            </div>
            <div>
              <div className="text-sm font-medium text-white">•••• •••• •••• 4242</div>
              <div className="text-xs text-gray-600">Wygasa 12/27</div>
            </div>
          </div>
          <button className="text-xs font-semibold text-gray-400 hover:text-white border border-[#1a1a1a] hover:border-[#333] px-3 py-1.5 rounded-lg transition-all">
            Zmień
          </button>
        </div>
      </SectionCard>

      {/* Historia faktur */}
      <SectionCard>
        <SectionHeader title="Historia faktur" />
        <div className="space-y-2">
          {mockInvoices.map(inv => (
            <div key={inv.id} className="flex items-center justify-between p-4 bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl">
              <div className="flex items-center gap-3">
                <div className="size-8 bg-white/5 border border-white/[0.06] rounded-lg flex items-center justify-center">
                  <CreditCard className="size-3.5 text-gray-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{inv.plan}</div>
                  <div className="text-xs text-gray-600">{inv.date}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-emerald-400">{inv.amount}</span>
                <button className="p-1.5 text-gray-600 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                  <Download className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Tab: Czarna lista ────────────────────────────────────────────────────────

function BlacklistTab() {
  const [entries, setEntries] = useState(['spam@domain.com', 'noreply@automaticsystem.com']);
  const [newEntry, setNewEntry] = useState('');
  const [filter, setFilter] = useState('');

  const add = () => {
    const trimmed = newEntry.trim();
    if (trimmed && !entries.includes(trimmed)) {
      setEntries([trimmed, ...entries]);
      setNewEntry('');
    }
  };

  const filtered = entries.filter(e => e.includes(filter));

  return (
    <div className="space-y-4">
      <SectionCard>
        <SectionHeader
          title="Czarna lista"
          subtitle="Maile z tych adresów i domen nigdy nie zostaną wciągnięte do kampanii"
        />

        <div className="flex gap-2 mb-4">
          <Input
            value={newEntry}
            onChange={e => setNewEntry(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()}
            placeholder="adres@email.pl lub @domena.pl"
            className="flex-1"
          />
          <button
            onClick={add}
            className="px-4 py-2.5 bg-white text-black text-sm font-bold rounded-lg hover:bg-gray-100 transition-all"
          >
            Dodaj
          </button>
        </div>

        {entries.length > 5 && (
          <div className="mb-3">
            <Input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filtruj listę..." />
          </div>
        )}

        <div className="space-y-1.5 max-h-80 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-600">Brak wpisów na czarnej liście</div>
          ) : (
            filtered.map(entry => (
              <div key={entry} className="flex items-center justify-between px-4 py-2.5 bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg group">
                <div className="flex items-center gap-2">
                  <Shield className="size-3 text-gray-600" />
                  <span className="text-xs font-mono text-gray-300">{entry}</span>
                </div>
                <button
                  onClick={() => setEntries(entries.filter(e => e !== entry))}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-600 hover:text-red-400 transition-all"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-[#141414] text-[11px] text-gray-700">
          {entries.length} wpisów · Możesz dodawać całe domeny (np. @spam.pl)
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Tab: Powiadomienia ───────────────────────────────────────────────────────

function NotificationsTab() {
  const [settings, setSettings] = useState({
    campaignFinished: true,
    newReply: true,
    dailyReport: false,
    weeklyReport: true,
    lowCredits: true,
    mailboxError: true,
    newLead: false,
    productUpdates: true,
  });

  const toggle = (key: keyof typeof settings) =>
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));

  const groups = [
    {
      title: 'Kampanie',
      items: [
        { key: 'campaignFinished' as const, label: 'Kampania zakończona', desc: 'Gdy wszystkie maile zostaną wysłane' },
        { key: 'newReply' as const, label: 'Nowa odpowiedź', desc: 'Ktoś odpowiedział na Twój mail' },
        { key: 'newLead' as const, label: 'Nowy lead zakwalifikowany', desc: 'AI zakwalifikowało lead jako gorący' },
      ]
    },
    {
      title: 'Raporty',
      items: [
        { key: 'dailyReport' as const, label: 'Raport dzienny', desc: 'Podsumowanie aktywności każdego dnia' },
        { key: 'weeklyReport' as const, label: 'Raport tygodniowy', desc: 'Podsumowanie wyników co tydzień' },
      ]
    },
    {
      title: 'System',
      items: [
        { key: 'lowCredits' as const, label: 'Niski stan kredytów', desc: 'Gdy pozostanie mniej niż 10% kredytów' },
        { key: 'mailboxError' as const, label: 'Błąd skrzynki', desc: 'Gdy skrzynka pocztowa straci połączenie' },
        { key: 'productUpdates' as const, label: 'Aktualizacje produktu', desc: 'Nowe funkcje i poprawki' },
      ]
    },
  ];

  return (
    <div className="space-y-4">
      {groups.map(group => (
        <SectionCard key={group.title}>
          <SectionHeader title={group.title} />
          <div className="space-y-1">
            {group.items.map((item, i) => (
              <div key={item.key}>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <div className="text-sm font-medium text-white">{item.label}</div>
                    <div className="text-xs text-gray-600 mt-0.5">{item.desc}</div>
                  </div>
                  <Toggle checked={settings[item.key]} onChange={() => toggle(item.key)} />
                </div>
                {i < group.items.length - 1 && <div className="h-px bg-[#141414]" />}
              </div>
            ))}
          </div>
        </SectionCard>
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'mailboxes', label: 'Skrzynki', icon: Mail },
    { id: 'billing', label: 'Płatności', icon: CreditCard },
    { id: 'blacklist', label: 'Czarna lista', icon: Shield },
    { id: 'notifications', label: 'Powiadomienia', icon: Bell },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Ustawienia</h1>
        <p className="text-sm text-gray-600 mt-1">Zarządzaj kontem, skrzynkami i preferencjami</p>
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* Sidebar */}
        <div className="col-span-12 lg:col-span-3">
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-1.5 space-y-0.5">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white/[0.06] text-white'
                    : 'text-gray-600 hover:text-gray-300 hover:bg-white/[0.02]'
                }`}
              >
                <tab.icon className="size-4 shrink-0" />
                {tab.label}
                {activeTab === tab.id && <ChevronRight className="size-3 ml-auto text-gray-600" />}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="col-span-12 lg:col-span-9">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
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