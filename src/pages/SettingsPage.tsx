import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  User, Mail, CreditCard, Shield, Bell, Globe,
  CheckCircle2, XCircle, Plus, Trash2, Download,
  AlertCircle, Key, Eye, EyeOff
} from 'lucide-react';

type Tab = 'profile' | 'mailboxes' | 'billing' | 'blacklist' | 'notifications';

const mockMailboxes = [
  {
    id: 1,
    email: 'jan@firma.pl',
    provider: 'Gmail',
    status: 'connected',
    dailyLimit: 40,
    sentToday: 23,
    lastSync: '2026-03-18 14:30',
  },
  {
    id: 2,
    email: 'kontakt@firma.pl',
    provider: 'Outlook',
    status: 'connected',
    dailyLimit: 40,
    sentToday: 15,
    lastSync: '2026-03-18 14:25',
  },
  {
    id: 3,
    email: 'biuro@firma.pl',
    provider: 'Gmail',
    status: 'error',
    dailyLimit: 40,
    sentToday: 0,
    lastSync: '2026-03-17 09:15',
  },
];

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

  const tabs = [
    { id: 'profile' as Tab, label: 'Profil', icon: User },
    { id: 'mailboxes' as Tab, label: 'Skrzynki pocztowe', icon: Mail },
    { id: 'billing' as Tab, label: 'Płatności', icon: CreditCard },
    { id: 'blacklist' as Tab, label: 'Czarna lista', icon: Shield },
    { id: 'notifications' as Tab, label: 'Powiadomienia', icon: Bell },
  ];

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
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6"
            >
              <h2 className="text-xl font-bold text-white mb-6">Informacje osobiste</h2>
              
              <div className="space-y-6">
                {/* Avatar */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-3">
                    Zdjęcie profilowe
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="size-20 bg-gradient-to-br from-white to-gray-400 rounded-full flex items-center justify-center text-2xl font-bold text-black">
                      JK
                    </div>
                    <div className="flex gap-2">
                      <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all text-sm">
                        Zmień zdjęcie
                      </button>
                      <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all text-sm">
                        Usuń
                      </button>
                    </div>
                  </div>
                </div>

                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Imię
                    </label>
                    <input
                      type="text"
                      defaultValue="Jan"
                      className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-white/20 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Nazwisko
                    </label>
                    <input
                      type="text"
                      defaultValue="Kowalski"
                      className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-white/20 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    defaultValue="jan@firma.pl"
                    className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-white/20 focus:outline-none"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Hasło
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      defaultValue="password123"
                      className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-white/20 focus:outline-none pr-12"
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                    </button>
                  </div>
                </div>

                {/* Company */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Firma
                  </label>
                  <input
                    type="text"
                    defaultValue="Moja Firma Sp. z o.o."
                    className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-white/20 focus:outline-none"
                  />
                </div>

                {/* Save Button */}
                <div className="pt-4">
                  <button className="px-6 py-3 bg-white hover:bg-gray-100 text-black font-semibold rounded-lg transition-all">
                    Zapisz zmiany
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Mailboxes Tab */}
          {activeTab === 'mailboxes' && (
            <motion.div
              key="mailboxes"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">Podłączone skrzynki</h2>
                  <button className="px-4 py-2 bg-white hover:bg-gray-100 text-black font-semibold rounded-lg transition-all flex items-center gap-2">
                    <Plus className="size-4" />
                    Dodaj skrzynkę
                  </button>
                </div>

                <div className="space-y-4">
                  {mockMailboxes.map((mailbox) => (
                    <div
                      key={mailbox.id}
                      className="bg-white/5 border border-white/10 rounded-xl p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="size-12 bg-white/10 rounded-lg flex items-center justify-center">
                            <Mail className="size-6 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold text-white mb-1">
                              {mailbox.email}
                            </div>
                            <div className="text-sm text-gray-400">
                              {mailbox.provider}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {mailbox.status === 'connected' ? (
                            <span className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-medium">
                              <CheckCircle2 className="size-3" />
                              Połączona
                            </span>
                          ) : (
                            <span className="flex items-center gap-2 px-3 py-1 bg-red-500/10 text-red-400 rounded-full text-xs font-medium">
                              <XCircle className="size-3" />
                              Błąd połączenia
                            </span>
                          )}
                          <button className="p-2 hover:bg-white/10 rounded-lg transition-all text-gray-400 hover:text-red-400">
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Wysłano dziś</div>
                          <div className="text-lg font-bold text-white">
                            {mailbox.sentToday} / {mailbox.dailyLimit}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Limit dzienny</div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              defaultValue={mailbox.dailyLimit}
                              className="w-20 bg-white/10 border border-white/10 rounded px-2 py-1 text-white text-sm focus:border-white/20 focus:outline-none"
                            />
                            <span className="text-sm text-gray-400">e-maili</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Ostatnia synchronizacja</div>
                          <div className="text-sm text-white">
                            {mailbox.lastSync}
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-4">
                        <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${(mailbox.sentToday / mailbox.dailyLimit) * 100}%` }}
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-white to-gray-400 rounded-full"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="size-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-blue-400 mb-1">
                      Zalecenia dotyczące limitów
                    </div>
                    <div className="text-sm text-gray-400">
                      Rekomendujemy wysyłanie maksymalnie 40-50 e-maili dziennie z jednej skrzynki, 
                      aby uniknąć filtrów antyspamowych i zachować wysoką dostarczalność.
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Billing Tab */}
          {activeTab === 'billing' && (
            <motion.div
              key="billing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Current Plan */}
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

                  <div className="border-t border-white/10 pt-4 space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-white">
                      <CheckCircle2 className="size-4 text-emerald-400" />
                      2000 leadów miesięcznie
                    </div>
                    <div className="flex items-center gap-2 text-white">
                      <CheckCircle2 className="size-4 text-emerald-400" />
                      3 podpięte skrzynki
                    </div>
                    <div className="flex items-center gap-2 text-white">
                      <CheckCircle2 className="size-4 text-emerald-400" />
                      AI Hyper-Personalization
                    </div>
                    <div className="flex items-center gap-2 text-white">
                      <CheckCircle2 className="size-4 text-emerald-400" />
                      Auto-Follow-upy
                    </div>
                  </div>
                </div>

                {/* Usage */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-400">Wykorzystanie kredytów</div>
                    <div className="text-sm font-medium text-white">1450 / 2000</div>
                  </div>
                  <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
                    <div
                      style={{ width: '72.5%' }}
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-white to-gray-400 rounded-full"
                    />
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    Odnawia się 1 kwietnia 2026
                  </div>
                </div>

                <div className="flex gap-3">
                  <button className="flex-1 px-6 py-3 bg-white hover:bg-gray-100 text-black font-semibold rounded-lg transition-all">
                    Zmień plan
                  </button>
                  <button className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all">
                    Anuluj subskrypcję
                  </button>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
                <h2 className="text-xl font-bold text-white mb-6">Metoda płatności</h2>
                
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="size-12 bg-white/10 rounded-lg flex items-center justify-center">
                      <CreditCard className="size-6 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-white">•••• •••• •••• 4242</div>
                      <div className="text-sm text-gray-400">Wygasa 12/27</div>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all text-sm">
                    Zmień
                  </button>
                </div>
              </div>

              {/* Invoices */}
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
                <h2 className="text-xl font-bold text-white mb-6">Historia faktur</h2>
                
                <div className="space-y-3">
                  {mockInvoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center justify-between hover:bg-white/10 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="size-10 bg-white/10 rounded-lg flex items-center justify-center">
                          <CreditCard className="size-5 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-white">{invoice.plan}</div>
                          <div className="text-sm text-gray-400">
                            {new Date(invoice.date).toLocaleDateString('pl-PL')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-semibold text-white">{invoice.amount}</div>
                          <div className="text-xs text-emerald-400">Opłacona</div>
                        </div>
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-all text-gray-400 hover:text-white">
                          <Download className="size-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Blacklist Tab */}
          {activeTab === 'blacklist' && (
            <motion.div
              key="blacklist"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6"
            >
              <h2 className="text-xl font-bold text-white mb-2">Czarna lista</h2>
              <p className="text-gray-400 mb-6">
                Dodaj domeny lub adresy email, do których ZEC nigdy nie wyśle wiadomości
              </p>

              {/* Add Entry */}
              <div className="flex gap-2 mb-6">
                <input
                  type="text"
                  value={newBlacklistEntry}
                  onChange={(e) => setNewBlacklistEntry(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addToBlacklist()}
                  placeholder="np. competitor@example.com lub @domain.com"
                  className="flex-1 bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-gray-500 focus:border-white/20 focus:outline-none"
                />
                <button
                  onClick={addToBlacklist}
                  className="px-6 py-3 bg-white hover:bg-gray-100 text-black font-semibold rounded-lg transition-all flex items-center gap-2"
                >
                  <Plus className="size-5" />
                  Dodaj
                </button>
              </div>

              {/* Blacklist Entries */}
              <div className="space-y-2">
                {blacklist.map((entry, index) => (
                  <div
                    key={index}
                    className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center justify-between hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <Shield className="size-5 text-gray-400" />
                      <span className="text-white font-mono">{entry}</span>
                    </div>
                    <button
                      onClick={() => removeFromBlacklist(entry)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-all text-gray-400 hover:text-red-400"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>

              {blacklist.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  Brak wpisów na czarnej liście
                </div>
              )}
            </motion.div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6"
            >
              <h2 className="text-xl font-bold text-white mb-6">Powiadomienia</h2>

              <div className="space-y-4">
                {[
                  { label: 'Nowe odpowiedzi od leadów', description: 'Otrzymuj email gdy ktoś odpowie na kampanię' },
                  { label: 'Zakończenie kampanii', description: 'Powiadomienie gdy kampania wyśle wszystkie e-maile' },
                  { label: 'Wykorzystanie limitu', description: 'Alert gdy wykorzystasz 80% kredytów miesięcznych' },
                  { label: 'Problemy z połączeniem', description: 'Powiadomienie o błędach z podłączonymi skrzynkami' },
                  { label: 'Newsletter i aktualizacje', description: 'Informacje o nowych funkcjach ZEC' },
                ].map((setting, index) => (
                  <label
                    key={index}
                    className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 transition-all"
                  >
                    <div>
                      <div className="font-medium text-white mb-1">{setting.label}</div>
                      <div className="text-sm text-gray-400">{setting.description}</div>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked={index < 4}
                      className="size-5 rounded border-white/20 bg-white/10 checked:bg-white checked:border-white cursor-pointer"
                    />
                  </label>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
