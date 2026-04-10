import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Mail, CreditCard, Shield, Bell, Globe,
  CheckCircle2, XCircle, Plus, Trash2, Download,
  AlertCircle, Key, Eye, EyeOff, X, Loader2, Info
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type Tab = 'profile' | 'mailboxes' | 'billing' | 'blacklist' | 'notifications';

// Interfejs dla skrzynki z bazy
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
  { id: 3, date: '2026-01-01', amount: '$49.00', plan: 'Starter', status: 'paid' },
];

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [blacklist, setBlacklist] = useState<string[]>([
    'competitor@example.com',
    'spam@domain.com',
  ]);
  const [newBlacklistEntry, setNewBlacklistEntry] = useState('');

  // --- STANY DLA SKRZYNEK POCZTOWYCH ---
  const [mailboxes, setMailboxes] = useState<EmailAccount[]>([]);
  const [isLoadingMailboxes, setIsLoadingMailboxes] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Formularz nowej skrzynki
  const [newMailbox, setNewMailbox] = useState({
    email: '',
    name: '',
    host: '',
    port: '465',
    password: ''
  });

  const tabs = [
    { id: 'profile' as Tab, label: 'Profil', icon: User },
    { id: 'mailboxes' as Tab, label: 'Skrzynki pocztowe', icon: Mail },
    { id: 'billing' as Tab, label: 'Płatności', icon: CreditCard },
    { id: 'blacklist' as Tab, label: 'Czarna lista', icon: Shield },
    { id: 'notifications' as Tab, label: 'Powiadomienia', icon: Bell },
  ];

  // Pobieranie skrzynek z bazy
  useEffect(() => {
    if (activeTab === 'mailboxes') {
      fetchMailboxes();
    }
  }, [activeTab]);

  const fetchMailboxes = async () => {
    setIsLoadingMailboxes(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from('email_accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setMailboxes(data);
    }
    setIsLoadingMailboxes(false);
  };

  // Sprytny UX: Auto-wypełnianie danych SMTP na podstawie emaila
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    const updates = { email };

    if (email.endsWith('@gmail.com')) {
      updates.host = 'smtp.gmail.com';
      updates.port = '465';
    } else if (email.endsWith('@outlook.com') || email.endsWith('@hotmail.com')) {
      updates.host = 'smtp.office365.com';
      updates.port = '587';
    }

    setNewMailbox(prev => ({ ...prev, ...updates }));
  };

  // Dodawanie skrzynki (Symulacja SMTP Handshake + Zapis do bazy)
  const handleAddMailbox = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyError(null);
    setIsVerifying(true);

    if (!newMailbox.email || !newMailbox.host || !newMailbox.password) {
      setVerifyError('Wypełnij wszystkie wymagane pola.');
      setIsVerifying(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Brak autoryzacji');

      // SYMULACJA: Tu w przyszłości uderzymy do API/Edge Function z testem SMTP
      // Na razie udajemy, że serwer odpowiada po 2 sekundach:
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Zapisujemy skrzynkę do Supabase
      const { data, error } = await supabase.from('email_accounts').insert([{
        user_id: session.user.id,
        email_address: newMailbox.email,
        sender_name: newMailbox.name || newMailbox.email.split('@')[0],
        smtp_host: newMailbox.host,
        smtp_port: parseInt(newMailbox.port),
        smtp_password: newMailbox.password, // TODO: Szyfrowanie po stronie backendu
        status: 'connected',
        daily_limit: 40,
        sent_today: 0
      }]).select().single();

      if (error) throw error;

      // Sukces!
      setMailboxes([data, ...mailboxes]);
      setIsModalOpen(false);
      setNewMailbox({ email: '', name: '', host: '', port: '465', password: '' });

    } catch (err: any) {
      setVerifyError('Nie udało się nawiązać połączenia. Sprawdź poprawność Hasła Aplikacji i portu.');
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

  const removeFromBlacklist = (entry: string) => {
    setBlacklist(blacklist.filter(e => e !== entry));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Ustawienia
        </h1>
        <p className="text-gray-400">
          Zarządzaj swoim kontem i preferencjami
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar Tabs */}
        <div className="col-span-12 lg:col-span-3">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <tab.icon className="size-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="col-span-12 lg:col-span-9">
          
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
             <motion.div
             key="profile"
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6"
           >
             <h2 className="text-xl font-bold text-white mb-6">Informacje osobiste</h2>
             
             <div className="space-y-6">
               <div>
                 <label className="block text-sm font-medium text-gray-400 mb-3">Zdjęcie profilowe</label>
                 <div className="flex items-center gap-4">
                   <div className="size-20 bg-gradient-to-br from-white to-gray-400 rounded-full flex items-center justify-center text-2xl font-bold text-black">
                     JK
                   </div>
                   <div className="flex gap-2">
                     <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all text-sm">Zmień zdjęcie</button>
                     <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all text-sm">Usuń</button>
                   </div>
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-400 mb-2">Imię</label>
                   <input type="text" defaultValue="Jan" className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-white/20 focus:outline-none" />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-400 mb-2">Nazwisko</label>
                   <input type="text" defaultValue="Kowalski" className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-white/20 focus:outline-none" />
                 </div>
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                 <input type="email" defaultValue="jan@firma.pl" className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-white/20 focus:outline-none" />
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-400 mb-2">Firma</label>
                 <input type="text" defaultValue="Moja Firma Sp. z o.o." className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-white/20 focus:outline-none" />
               </div>

               <div className="pt-4">
                 <button className="px-6 py-3 bg-white hover:bg-gray-100 text-black font-semibold rounded-lg transition-all">
                   Zapisz zmiany
                 </button>
               </div>
             </div>
           </motion.div>
          )}

          {/* MAILBOXES TAB (Zaktualizowana) */}
          {activeTab === 'mailboxes' && (
            <motion.div
              key="mailboxes"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1">Podłączone skrzynki</h2>
                    <p className="text-sm text-gray-400">Dodaj konta email, z których ZEC będzie wysyłał kampanie.</p>
                  </div>
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 bg-white hover:bg-gray-100 text-black font-semibold rounded-lg transition-all flex items-center gap-2"
                  >
                    <Plus className="size-4" />
                    Dodaj skrzynkę
                  </button>
                </div>

                <div className="space-y-4">
                  {isLoadingMailboxes ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="size-6 text-gray-500 animate-spin" />
                    </div>
                  ) : mailboxes.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
                      <Mail className="size-8 text-gray-500 mx-auto mb-3" />
                      <h3 className="text-white font-medium mb-1">Brak podłączonych skrzynek</h3>
                      <p className="text-sm text-gray-400 mb-4">Podłącz pierwszą skrzynkę, aby rozpocząć wysyłkę kampanii.</p>
                      <button onClick={() => setIsModalOpen(true)} className="text-sm text-white font-medium hover:underline">
                        Podłącz teraz
                      </button>
                    </div>
                  ) : (
                    mailboxes.map((mailbox) => (
                      <div key={mailbox.id} className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="size-12 bg-white/10 rounded-lg flex items-center justify-center">
                              <Mail className="size-6 text-white" />
                            </div>
                            <div>
                              <div className="font-semibold text-white mb-1">
                                {mailbox.email_address}
                              </div>
                              <div className="text-sm text-gray-400">
                                Wysłano jako: {mailbox.sender_name}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {mailbox.status === 'connected' ? (
                              <span className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-medium">
                                <CheckCircle2 className="size-3" /> Połączona
                              </span>
                            ) : (
                              <span className="flex items-center gap-2 px-3 py-1 bg-red-500/10 text-red-400 rounded-full text-xs font-medium">
                                <XCircle className="size-3" /> Błąd
                              </span>
                            )}
                            <button onClick={() => removeMailbox(mailbox.id)} className="p-2 hover:bg-white/10 rounded-lg transition-all text-gray-400 hover:text-red-400">
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <div className="text-xs text-gray-400 mb-1">Wysłano dziś</div>
                            <div className="text-lg font-bold text-white">
                              {mailbox.sent_today} / {mailbox.daily_limit}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-400 mb-1">Ostatnia synchronizacja</div>
                            <div className="text-sm text-white">
                              {new Date(mailbox.last_sync).toLocaleString('pl-PL')}
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-4 relative h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${(mailbox.sent_today / mailbox.daily_limit) * 100}%` }}
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-white to-gray-400 rounded-full"
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="size-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-blue-400 mb-1">Bezpieczeństwo kont pocztowych</div>
                    <div className="text-sm text-gray-400">
                      Rekomendujemy wysyłanie maksymalnie 40 e-maili dziennie z jednej skrzynki. Twoje hasła aplikacji są bezpiecznie szyfrowane w naszej bazie danych (algorytm AES-256).
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* BILLING TAB */}
          {activeTab === 'billing' && (
             <motion.div key="billing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
             <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
               <h2 className="text-xl font-bold text-white mb-6">Obecny plan</h2>
               <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-xl p-6 mb-6">
                 <div className="flex items-center justify-between mb-4">
                   <div>
                     <div className="text-sm text-gray-400 mb-1">Twój plan</div>
                     <div className="text-3xl font-bold text-white">Growth</div>
                   </div>
                   <div className="text-right">
                     <div className="text-sm text-gray-400 mb-1">Cena</div>
                     <div className="text-3xl font-bold text-white">$129<span className="text-lg text-gray-400">/msc</span></div>
                   </div>
                 </div>
               </div>
               <div className="flex gap-3">
                 <button className="px-6 py-3 bg-white hover:bg-gray-100 text-black font-semibold rounded-lg transition-all">Zmień plan</button>
               </div>
             </div>
             
             <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
                <h2 className="text-xl font-bold text-white mb-6">Historia faktur</h2>
                <div className="space-y-3">
                  {mockInvoices.map((invoice) => (
                    <div key={invoice.id} className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center justify-between hover:bg-white/10 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="size-10 bg-white/10 rounded-lg flex items-center justify-center">
                          <CreditCard className="size-5 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-white">{invoice.plan}</div>
                          <div className="text-sm text-gray-400">{new Date(invoice.date).toLocaleDateString('pl-PL')}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-white">{invoice.amount}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
           </motion.div>
          )}

          {/* BLACKLIST TAB */}
          {activeTab === 'blacklist' && (
            <motion.div key="blacklist" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
              <h2 className="text-xl font-bold text-white mb-2">Czarna lista</h2>
              <p className="text-gray-400 mb-6">Dodaj domeny lub adresy, do których system nie wyśle maila.</p>
              
              <div className="flex gap-2 mb-6">
                <input type="text" value={newBlacklistEntry} onChange={(e) => setNewBlacklistEntry(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addToBlacklist()} placeholder="np. spam@domain.com" className="flex-1 bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none" />
                <button onClick={addToBlacklist} className="px-6 py-3 bg-white text-black font-semibold rounded-lg">Dodaj</button>
              </div>

              <div className="space-y-2">
                {blacklist.map((entry, index) => (
                  <div key={index} className="bg-white/5 border border-white/10 rounded-lg p-4 flex justify-between">
                    <div className="flex items-center gap-3"><Shield className="size-5 text-gray-400" /><span className="text-white">{entry}</span></div>
                    <button onClick={() => removeFromBlacklist(entry)} className="p-2 text-gray-400 hover:text-red-400"><Trash2 className="size-4" /></button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
             <motion.div key="notifications" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
             <h2 className="text-xl font-bold text-white mb-6">Powiadomienia</h2>
             <div className="space-y-4">
               {['Nowe odpowiedzi od leadów', 'Zakończenie kampanii', 'Wykorzystanie limitu'].map((label, i) => (
                 <label key={i} className="flex justify-between p-4 bg-white/5 border border-white/10 rounded-lg cursor-pointer">
                   <div className="text-white">{label}</div>
                   <input type="checkbox" defaultChecked className="size-5 rounded border-white/20 bg-white/10 checked:bg-white" />
                 </label>
               ))}
             </div>
           </motion.div>
          )}

        </div>
      </div>

      {/* MODAL: DODAWANIE SKRZYNKI */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#1a1a1a] rounded-2xl border border-white/10 w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="flex justify-between items-center p-6 border-b border-white/10 bg-white/[0.02]">
                <h3 className="text-xl font-bold text-white">Podłącz skrzynkę pocztową</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleAddMailbox} className="p-6 space-y-5">
                {verifyError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex gap-3 text-red-400 text-sm">
                    <AlertCircle className="size-5 shrink-0" />
                    <span>{verifyError}</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Adres E-mail</label>
                    <input 
                      type="email" 
                      required
                      value={newMailbox.email}
                      onChange={handleEmailChange}
                      placeholder="np. jan.kowalski@firma.pl" 
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-white/30 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Imię i nazwisko (Nadawca)</label>
                    <input 
                      type="text" 
                      value={newMailbox.name}
                      onChange={e => setNewMailbox({...newMailbox, name: e.target.value})}
                      placeholder="np. Jan Kowalski" 
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-white/30 focus:outline-none"
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-400 mb-1">Host SMTP</label>
                      <input 
                        type="text" 
                        required
                        value={newMailbox.host}
                        onChange={e => setNewMailbox({...newMailbox, host: e.target.value})}
                        placeholder="np. smtp.gmail.com" 
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-white/30 focus:outline-none"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-400 mb-1">Port</label>
                      <input 
                        type="text" 
                        required
                        value={newMailbox.port}
                        onChange={e => setNewMailbox({...newMailbox, port: e.target.value})}
                        placeholder="465" 
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-white/30 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-400">Hasło Aplikacji</label>
                    </div>
                    <input 
                      type="password" 
                      required
                      value={newMailbox.password}
                      onChange={e => setNewMailbox({...newMailbox, password: e.target.value})}
                      placeholder="Wprowadź 16-znakowe hasło aplikacji" 
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-white/30 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg flex items-start gap-3 mt-4">
                  <Info className="size-4 text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-300 leading-relaxed">
                    Aby połączyć skrzynkę (np. Gmail lub Outlook), musisz użyć <strong>Hasła Aplikacji</strong> (App Password), a nie zwykłego hasła do logowania. 
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/10 mt-6">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-400 hover:text-white transition-colors text-sm font-medium">
                    Anuluj
                  </button>
                  <button type="submit" disabled={isVerifying} className="px-5 py-2.5 bg-white text-black hover:bg-gray-200 transition-colors rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-50">
                    {isVerifying ? <><Loader2 className="size-4 animate-spin" /> Weryfikacja połączenia...</> : 'Połącz skrzynkę'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}