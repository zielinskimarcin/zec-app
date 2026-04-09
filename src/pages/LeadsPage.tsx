import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Filter, Mail, Globe, Calendar, X, 
  CheckCircle2, XCircle, Clock, Eye, Send,
  ArrowUpDown, ChevronRight, Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type LeadStatus = 'pending' | 'sent' | 'opened' | 'replied' | 'bounced';

interface Lead {
  id: string | number;
  name: string;
  company: string;
  email: string;
  website: string;
  status: LeadStatus;
  city: string;
  industry: string;
  addedDate: string;
  lastContact?: string;
  campaign?: string;
  notes?: string;
  history: {
    date: string;
    action: string;
    details: string;
  }[];
}

const statusConfig: Record<LeadStatus, { label: string; color: string; icon: any }> = {
  pending: { label: 'Oczekujący', color: 'gray', icon: Clock },
  sent: { label: 'Wysłany', color: 'blue', icon: Send },
  opened: { label: 'Otwarty', color: 'yellow', icon: Eye },
  replied: { label: 'Odpowiedział', color: 'green', icon: CheckCircle2 },
  bounced: { label: 'Odbity', color: 'red', icon: XCircle },
};

export function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');

  // GŁÓWNY SILNIK DANYCH
  useEffect(() => {
    async function loadAndTransferLeads() {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsLoading(false);
        return;
      }

      // 1. KRADNIEMY ZE SCHOWKA (Transfer z Hero.tsx)
      const tempLeads = localStorage.getItem('zec_temp_leads');
      const tempQuery = localStorage.getItem('zec_temp_query');

      if (tempLeads && tempQuery) {
        try {
          const parsedLeads = JSON.parse(tempLeads);
          const parsedQuery = JSON.parse(tempQuery);

          // Wrzucamy do bazy do tabeli saved_searches
          await supabase.from('saved_searches').insert({
            user_id: session.user.id,
            industry: parsedQuery.industry,
            city: parsedQuery.city,
            leads_data: parsedLeads
          });

          // Sprzątamy po sobie
          localStorage.removeItem('zec_temp_leads');
          localStorage.removeItem('zec_temp_query');
          console.log("Leady z landingu pomyślnie przeniesione do bazy!");
        } catch (err) {
          console.error("Błąd podczas transferu leadów:", err);
        }
      }

      // 2. POBIERAMY Z BAZY I RYSUJEMY
      const { data: searchesData, error } = await supabase
        .from('saved_searches')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Błąd pobierania leadów z bazy:", error);
      }

      if (searchesData) {
        // Spłaszczamy tablicę do wyświetlenia
        const flatLeads: Lead[] = searchesData.flatMap((searchQuery) => {
          // Zabezpieczenie przed pustymi/zepsutymi danymi
          if (!searchQuery.leads_data || !Array.isArray(searchQuery.leads_data)) return [];

          return searchQuery.leads_data.map((leadData: any, index: number) => ({
            id: `${searchQuery.id}-${index}`,
            name: leadData.name || 'Brak nazwy',
            company: leadData.name || 'Brak firmy',
            email: leadData.email || 'brak@email.pl',
            website: leadData.website || '',
            status: 'pending',
            city: searchQuery.city,
            industry: searchQuery.industry,
            addedDate: searchQuery.created_at,
            campaign: `${searchQuery.industry} - ${searchQuery.city}`,
            history: [
              { 
                date: searchQuery.created_at, 
                action: 'Dodano', 
                details: 'Wygenerowane przez ZEC AI' 
              }
            ]
          }));
        });
        
        setLeads(flatLeads);
      }
      setIsLoading(false);
    }

    loadAndTransferLeads();
  }, []);

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = [
    { label: 'Wszystkie leady', value: leads.length, color: 'white' },
    { label: 'Oczekujące', value: leads.filter(l => l.status === 'pending').length, color: 'gray' },
    { label: 'Odpowiedzi', value: leads.filter(l => l.status === 'replied').length, color: 'green' },
    { label: 'Odbite', value: leads.filter(l => l.status === 'bounced').length, color: 'red' },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-400">
        <Loader2 className="size-8 animate-spin mb-4" />
        <p>Synchronizacja bazy leadów...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Baza leadów
        </h1>
        <p className="text-gray-400">
          Zarządzaj wszystkimi swoimi kontaktami biznesowymi
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6"
          >
            <div className={`text-3xl font-bold text-${stat.color}-400 mb-1`}>
              {stat.value}
            </div>
            <div className="text-sm text-gray-400">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Szukaj po nazwie, firmie lub emailu..."
            className="w-full bg-white/10 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-gray-500 focus:border-white/20 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="size-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as LeadStatus | 'all')}
            className="bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-white/20 focus:outline-none"
          >
            <option value="all">Wszystkie statusy</option>
            {Object.entries(statusConfig).map(([key, config]) => (
              <option key={key} value={key}>
                {config.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
        {/* Table Header */}
        <div className="border-b border-white/10">
          <div className="grid grid-cols-12 gap-4 px-6 py-4 text-sm font-medium text-gray-400">
            <div className="col-span-3 flex items-center gap-2">
              Kontakt
              <ArrowUpDown className="size-4" />
            </div>
            <div className="col-span-2">Firma</div>
            <div className="col-span-3">Email</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Ostatni kontakt</div>
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-white/10">
          {filteredLeads.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Brak leadów do wyświetlenia. Wyszukaj firmy na stronie głównej, aby dodać je do bazy!
            </div>
          ) : (
            filteredLeads.map((lead, index) => {
              const statusInfo = statusConfig[lead.status];
              const StatusIcon = statusInfo.icon;

              return (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedLead(lead)}
                  className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-white/5 transition-all cursor-pointer group"
                >
                  {/* Contact */}
                  <div className="col-span-3">
                    <div className="font-semibold text-white group-hover:text-blue-400 transition-colors truncate">
                      {lead.name}
                    </div>
                    <div className="text-sm text-gray-400 truncate">
                      {lead.city} • {lead.industry}
                    </div>
                  </div>

                  {/* Company */}
                  <div className="col-span-2 flex items-center">
                    <div className="text-sm text-white truncate">
                      {lead.company}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="col-span-3 flex items-center">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Mail className="size-4 text-gray-400 shrink-0" />
                      <span className="text-sm text-white truncate">{lead.email}</span>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="col-span-2 flex items-center">
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-${statusInfo.color}-500/10 text-${statusInfo.color}-400`}>
                      <StatusIcon className="size-3" />
                      {statusInfo.label}
                    </span>
                  </div>

                  {/* Last Contact */}
                  <div className="col-span-2 flex items-center justify-between">
                    <div className="text-sm text-gray-400">
                      {lead.lastContact 
                        ? new Date(lead.lastContact).toLocaleDateString('pl-PL')
                        : '-'
                      }
                    </div>
                    <ChevronRight className="size-5 text-gray-600 group-hover:text-white transition-colors" />
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Lead Detail Slide-over */}
      <AnimatePresence>
        {selectedLead && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLead(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-[#1a1a1a] border-l border-white/10 z-50 overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">
                      {selectedLead.name}
                    </h2>
                    <p className="text-gray-400">{selectedLead.company}</p>
                  </div>
                  <button
                    onClick={() => setSelectedLead(null)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-all text-gray-400 hover:text-white"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                <div className="mb-6">
                  {(() => {
                    const statusInfo = statusConfig[selectedLead.status];
                    const StatusIcon = statusInfo.icon;
                    return (
                      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-${statusInfo.color}-500/10 text-${statusInfo.color}-400`}>
                        <StatusIcon className="size-4" />
                        {statusInfo.label}
                      </span>
                    );
                  })()}
                </div>

                <div className="bg-white/5 rounded-xl border border-white/10 p-6 mb-6 space-y-4">
                  <h3 className="font-semibold text-white mb-4">Informacje kontaktowe</h3>
                  
                  <div className="flex items-center gap-3">
                    <Mail className="size-5 text-gray-400" />
                    <div>
                      <div className="text-xs text-gray-400">Email</div>
                      <a href={`mailto:${selectedLead.email}`} className="text-white hover:text-blue-400 transition-colors break-all">
                        {selectedLead.email}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Globe className="size-5 text-gray-400" />
                    <div>
                      <div className="text-xs text-gray-400">Strona WWW</div>
                      <a 
                        href={selectedLead.website.startsWith('http') ? selectedLead.website : `https://${selectedLead.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white hover:text-blue-400 transition-colors break-all"
                      >
                        {selectedLead.website}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="size-5 text-gray-400" />
                    <div>
                      <div className="text-xs text-gray-400">Data dodania</div>
                      <div className="text-white">
                        {new Date(selectedLead.addedDate).toLocaleDateString('pl-PL', {
                          year: 'numeric', month: 'long', day: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>

                  {selectedLead.campaign && (
                    <div className="pt-4 border-t border-white/10">
                      <div className="text-xs text-gray-400 mb-1">Kampania</div>
                      <div className="text-white font-medium">{selectedLead.campaign}</div>
                    </div>
                  )}
                </div>

                <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                  <h3 className="font-semibold text-white mb-6">Historia kontaktu</h3>
                  <div className="space-y-6">
                    {selectedLead.history.map((event, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="size-8 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <div className="size-2 bg-white rounded-full" />
                          </div>
                          {index < selectedLead.history.length - 1 && (
                            <div className="w-px flex-1 bg-white/10 mt-2" />
                          )}
                        </div>
                        <div className="flex-1 pb-6">
                          <div className="flex items-center justify-between mb-1">
                            <div className="font-medium text-white">{event.action}</div>
                            <div className="text-xs text-gray-400">
                              {new Date(event.date).toLocaleDateString('pl-PL')}
                            </div>
                          </div>
                          <div className="text-sm text-gray-400">
                            {event.details}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button className="flex-1 px-4 py-3 bg-white hover:bg-gray-100 text-black font-semibold rounded-lg transition-all">
                    Wyślij email
                  </button>
                  <button className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all">
                    Edytuj
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}