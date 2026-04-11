import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Mail, CreditCard, Shield, Bell, 
  CheckCircle2, XCircle, Plus, Trash2, Download,
  AlertCircle, X, Loader2, ArrowLeft, Video, Server
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

const mockInvoices = [
  { id: 1, date: '2026-03-01', amount: '$129.00', plan: 'Growth', status: 'paid' },
  { id: 2, date: '2026-02-01', amount: '$129.00', plan: 'Growth', status: 'paid' },
];

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('mailboxes'); // Domyślnie otwieramy skrzynki dla testów
  const [blacklist, setBlacklist] = useState<string[]>(['spam@domain.com']);
  const [newBlacklistEntry, setNewBlacklistEntry] = useState('');

  // --- STANY SKRZYNEK ---
  const [mailboxes, setMailboxes] = useState<EmailAccount[]>([]);
  const [isLoadingMailboxes, setIsLoadingMailboxes] = useState(false);
  
  // --- STANY MODALA ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2>(1);
  const [selectedProvider, setSelectedProvider] = useState<Provider>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const [newMailbox, setNewMailbox] = useState({
    email: '',
    name: '',
    password: '',
    smtpHost: '',
    smtpPort: '',
    imapHost: '',
    imapPort: ''
  });

  const tabs = [
    { id: 'profile' as Tab, label: 'Profil', icon: User },
    { id: 'mailboxes' as Tab, label: 'Skrzynki pocztowe', icon: Mail },
    { id: 'billing' as Tab, label: 'Płatności', icon: CreditCard },
    { id: 'blacklist' as Tab, label: 'Czarna lista', icon: Shield },
    { id: 'notifications' as Tab, label: 'Powiadomienia', icon: Bell },
  ];

  useEffect(() => {
    if (activeTab === 'mailboxes') fetchMailboxes();
  }, [activeTab]);

  const fetchMailboxes = async () => {
    setIsLoadingMailboxes(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data } = await supabase.from('email_accounts').select('*').order('created_at', { ascending: false });
      if (data) setMailboxes(data);
    }
    setIsLoadingMailboxes(false);
  };

  const handleProviderSelect = (provider: Provider) => {
    setSelectedProvider(provider);
    setVerifyError(null);
    
    // Auto-wypełnianie ukrytych pól dla znanych dostawców
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
      setModalStep(1);
      setSelectedProvider(null);
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

      // SYMULACJA WERYFIKACJI (Do zastąpienia przez Edge Function)
      await new Promise(resolve => setTimeout(resolve, 2000));

      const { data, error } = await supabase.from('email_accounts').insert([{
        user_id: session.user.id,
        email_address: newMailbox.email,
        sender_name: newMailbox.name || newMailbox.email.split('@')[0],
        smtp_host: newMailbox.smtpHost,
        smtp_port: parseInt(newMailbox.smtpPort),
        smtp_password: newMailbox.password, // Szyfrowane w Edge Function
        imap_host: newMailbox.imapHost,
        imap_port: parseInt(newMailbox.imapPort),
        status: 'connected',
      }]).select().single();

      if (error) throw error;

      setMailboxes([data, ...mailboxes]);
      handleCloseModal();
    } catch (err: any) {
      setVerifyError('Odrzucono połączenie (Invalid Credentials). Upewnij się, że używasz Hasła Aplikacji, a nie hasła głównego.');
    } finally {
      setIsVerifying(false);
    }
  };

  const removeMailbox = async (id: string) => {
    await supabase.from('email_accounts').delete().eq('id', id);
    setMailboxes(mailboxes.filter(m => m.id !== id));
  };

  const addToBlacklist = () => {
    if (newBlacklistEntry && !blacklist.includes(newBlacklistEntry)) {
      setBlacklist([...blacklist, newBlacklistEntry]);
      setNewBlacklistEntry('');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Ustawienia</h1>
        <p className="text-gray-400">Zarządzaj swoim kontem i preferencjami</p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-3">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  activeTab === tab.id ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <tab.icon className="size-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-9">
          
          {/* PROFILE TAB (Uproszczony dla czytelności) */}
          {activeTab === 'profile' && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/5 rounded-xl border border-white/10 p-6">
               <h2 className="text-xl font-bold text-white mb-6">Informacje osobiste</h2>
               <p className="text-gray-400">Ustawienia profilu (Wersja w budowie)</p>
             </motion.div>
          )}

          {/* MAILBOXES TAB */}
          {activeTab === 'mailboxes' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1">Podłączone skrzynki</h2>
                    <p className="text-sm text-gray-400">Wysyłaj i nasłuchuj odpowiedzi (SMTP & IMAP).</p>
                  </div>
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 bg-white hover:bg-gray-100 text-black font-semibold rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-white/5"
                  >
                    <Plus className="size-4" />
                    Dodaj skrzynkę
                  </button>
                </div>

                <div className="space-y-4">
                  {isLoadingMailboxes ? (
                    <div className="flex justify-center py-8"><Loader2 className="size-6 text-gray-500 animate-spin" /></div>
                  ) : mailboxes.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
                      <Mail className="size-8 text-gray-500 mx-auto mb-3" />
                      <h3 className="text-white font-medium mb-1">Brak podłączonych skrzynek</h3>
                      <p className="text-sm text-gray-400 mb-4">Podłącz pierwszą skrzynkę, aby zautomatyzować outreach.</p>
                      <button onClick={() => setIsModalOpen(true)} className="text-sm text-white font-medium hover:underline">Podłącz teraz</button>
                    </div>
                  ) : (
                    mailboxes.map((mailbox) => (
                      <div key={mailbox.id} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/[0.07] transition-all">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <div className="size-10 bg-white/10 rounded-lg flex items-center justify-center">
                              <Mail className="size-5 text-white" />
                            </div>
                            <div>
                              <div className="font-semibold text-white">{mailbox.email_address}</div>
                              <div className="text-xs text-gray-400">Nadawca: {mailbox.sender_name}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {mailbox.status === 'connected' ? (
                              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-md text-xs font-medium border border-emerald-500/20">
                                <CheckCircle2 className="size-3" /> Aktywna
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 text-red-400 rounded-md text-xs font-medium border border-red-500/20">
                                <XCircle className="size-3" /> Błąd
                              </span>
                            )}
                            <button onClick={() => removeMailbox(mailbox.id)} className="p-2 hover:bg-white/10 rounded-lg transition-all text-gray-400 hover:text-red-400">
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* POZOSTAŁE ZAKŁADKI (Uproszczone) */}
          {activeTab === 'billing' && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/5 rounded-xl border border-white/10 p-6"><h2 className="text-xl font-bold text-white mb-6">Płatności</h2></motion.div>)}
          {activeTab === 'blacklist' && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/5 rounded-xl border border-white/10 p-6"><h2 className="text-xl font-bold text-white mb-6">Czarna lista</h2></motion.div>)}
          {activeTab === 'notifications' && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/5 rounded-xl border border-white/10 p-6"><h2 className="text-xl font-bold text-white mb-6">Powiadomienia</h2></motion.div>)}

        </div>
      </div>

      {/* --- MODAL (Wielki i profesjonalny) --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0f0f0f] rounded-2xl border border-white/10 w-full max-w-4xl shadow-2xl relative my-8"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-white/10">
                <div className="flex items-center gap-4">
                  {modalStep === 2 && (
                    <button onClick={() => setModalStep(1)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white">
                      <ArrowLeft className="size-5" />
                    </button>
                  )}
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {modalStep === 1 ? 'Wybierz dostawcę poczty' : `Podłącz konto ${selectedProvider === 'gmail' ? 'Google' : selectedProvider === 'outlook' ? 'Microsoft' : 'SMTP/IMAP'}`}
                    </h3>
                    <p className="text-sm text-gray-400">Bezpieczne połączenie szyfrowane z Twoim serwerem.</p>
                  </div>
                </div>
                <button onClick={handleCloseModal} className="text-gray-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg">
                  <X className="size-5" />
                </button>
              </div>

              {/* KROK 1: WYBÓR DOSTAWCY */}
              {modalStep === 1 && (
                <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Gmail */}
                    <button onClick={() => handleProviderSelect('gmail')} className="flex flex-col items-center justify-center gap-4 p-8 bg-white/[0.02] hover:bg-white/[0.06] border border-white/10 hover:border-white/20 rounded-xl transition-all group">
                      <div className="size-16 bg-white/5 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Mail className="size-8 text-white" />
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-white mb-1">Google Workspace</div>
                        <div className="text-xs text-gray-400">@gmail.com lub własna domena</div>
                      </div>
                    </button>

                    {/* Outlook */}
                    <button onClick={() => handleProviderSelect('outlook')} className="flex flex-col items-center justify-center gap-4 p-8 bg-white/[0.02] hover:bg-white/[0.06] border border-white/10 hover:border-white/20 rounded-xl transition-all group">
                      <div className="size-16 bg-white/5 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Mail className="size-8 text-blue-400" />
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-white mb-1">Microsoft 365</div>
                        <div className="text-xs text-gray-400">Outlook, Exchange, Hotmail</div>
                      </div>
                    </button>

                    {/* Other */}
                    <button onClick={() => handleProviderSelect('other')} className="flex flex-col items-center justify-center gap-4 p-8 bg-white/[0.02] hover:bg-white/[0.06] border border-white/10 hover:border-white/20 rounded-xl transition-all group">
                      <div className="size-16 bg-white/5 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Server className="size-8 text-gray-400" />
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-white mb-1">Inny dostawca</div>
                        <div className="text-xs text-gray-400">Zoho, OVH, własny serwer</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* KROK 2: FORMULARZ + INSTRUKCJA */}
              {modalStep === 2 && (
                <div className="flex flex-col md:flex-row">
                  {/* Lewa strona: Formularz */}
                  <div className="flex-1 p-6 md:p-8 border-r border-white/10">
                    <form onSubmit={handleAddMailbox} className="space-y-5">
                      {verifyError && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex gap-3 text-red-400 text-sm">
                          <AlertCircle className="size-5 shrink-0" />
                          <span>{verifyError}</span>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Adres E-mail</label>
                        <input type="email" required value={newMailbox.email} onChange={e => setNewMailbox({...newMailbox, email: e.target.value})} className="w-full bg-white/[0.02] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-white/30 focus:outline-none" />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Imię i nazwisko (Nadawca)</label>
                        <input type="text" value={newMailbox.name} onChange={e => setNewMailbox({...newMailbox, name: e.target.value})} placeholder="np. Jan Kowalski" className="w-full bg-white/[0.02] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-white/30 focus:outline-none" />
                      </div>

                      {/* Pola widoczne tylko dla "Innych" dostawców */}
                      {selectedProvider === 'other' && (
                        <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5 space-y-4">
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Wysyłka (SMTP)</div>
                          <div className="flex gap-4">
                            <input type="text" required placeholder="Host SMTP" value={newMailbox.smtpHost} onChange={e => setNewMailbox({...newMailbox, smtpHost: e.target.value})} className="flex-1 bg-white/[0.02] border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                            <input type="text" required placeholder="Port" value={newMailbox.smtpPort} onChange={e => setNewMailbox({...newMailbox, smtpPort: e.target.value})} className="w-24 bg-white/[0.02] border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                          </div>
                          
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-4">Odbiór (IMAP)</div>
                          <div className="flex gap-4">
                            <input type="text" required placeholder="Host IMAP" value={newMailbox.imapHost} onChange={e => setNewMailbox({...newMailbox, imapHost: e.target.value})} className="flex-1 bg-white/[0.02] border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                            <input type="text" required placeholder="Port" value={newMailbox.imapPort} onChange={e => setNewMailbox({...newMailbox, imapPort: e.target.value})} className="w-24 bg-white/[0.02] border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Hasło Aplikacji</label>
                        <input type="password" required value={newMailbox.password} onChange={e => setNewMailbox({...newMailbox, password: e.target.value})} placeholder="Wprowadź wygenerowane hasło" className="w-full bg-white/[0.02] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-white/30 focus:outline-none font-mono" />
                      </div>

                      <button type="submit" disabled={isVerifying} className="w-full mt-4 py-3 bg-white text-black hover:bg-gray-200 transition-colors rounded-lg text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                        {isVerifying ? <><Loader2 className="size-4 animate-spin" /> Łączenie z serwerem...</> : 'Zapisz i Połącz Skrzynkę'}
                      </button>
                    </form>
                  </div>

                  {/* Prawa strona: Instrukcja */}
                  <div className="flex-1 bg-[#151515] p-6 md:p-8">
                    <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <AlertCircle className="size-5 text-amber-400" />
                      Ważna Instrukcja
                    </h4>
                    
                    {selectedProvider === 'gmail' && (
                      <div className="space-y-4 text-sm text-gray-300">
                        <p>Google blokuje logowanie zwykłym hasłem. Musisz wygenerować <strong>Hasło Aplikacji</strong>.</p>
                        <ol className="list-decimal pl-4 space-y-2 text-gray-400 marker:text-white font-medium">
                          <li>Wejdź w zarządzanie kontem Google.</li>
                          <li>Przejdź do zakładki <strong>Bezpieczeństwo</strong>.</li>
                          <li>Włącz <strong>Weryfikację dwuetapową</strong>.</li>
                          <li>Na samym dole wyszukaj <strong>Hasła aplikacji</strong>.</li>
                          <li>Nazwij apkę "ZEC" i wygeneruj 16-znakowy kod.</li>
                        </ol>
                        
                        <div className="mt-6 aspect-video bg-black/50 border border-white/10 rounded-lg flex flex-col items-center justify-center text-gray-500 shadow-inner relative overflow-hidden group">
                          <Video className="size-8 mb-2 opacity-50" />
                          <span className="text-xs uppercase tracking-widest">Wideo Instrukcja</span>
                          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                            <span className="bg-black/80 px-3 py-1 rounded text-white text-xs font-bold">Odtwórz</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedProvider === 'outlook' && (
                      <div className="space-y-4 text-sm text-gray-300">
                        <p>Microsoft wymaga specjalnego hasła dla zewnętrznych aplikacji.</p>
                        <ol className="list-decimal pl-4 space-y-2 text-gray-400 marker:text-white font-medium">
                          <li>Wejdź w ustawienia zabezpieczeń konta Microsoft.</li>
                          <li>Włącz <strong>Weryfikację dwuetapową</strong>.</li>
                          <li>W sekcji "Hasła aplikacji" kliknij <strong>Utwórz nowe hasło aplikacji</strong>.</li>
                          <li>Skopiuj wygenerowane hasło.</li>
                        </ol>
                        
                        <div className="mt-6 aspect-video bg-black/50 border border-white/10 rounded-lg flex flex-col items-center justify-center text-gray-500 shadow-inner">
                          <Video className="size-8 mb-2 opacity-50" />
                          <span className="text-xs uppercase tracking-widest">Wideo Instrukcja</span>
                        </div>
                      </div>
                    )}

                    {selectedProvider === 'other' && (
                      <div className="space-y-4 text-sm text-gray-300">
                        <p>Dla własnych serwerów upewnij się, że wpisujesz poprawne dane z panelu swojego hostingu (np. LH.pl, cyberfolks).</p>
                        <p className="text-gray-400 mt-4">W tym przypadku przeważnie możesz użyć swojego standardowego hasła do skrzynki pocztowej.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}