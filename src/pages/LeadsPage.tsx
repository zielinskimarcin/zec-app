import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Mail, Globe, Calendar, X, 
  Clock, Send, ArrowUpDown, ChevronRight, 
  Loader2, Instagram, Linkedin, Lock, Trash2, Plus, SlidersHorizontal
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type LeadStatus = 'pending' | 'sent';

interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  website: string;
  status: LeadStatus;
  city: string;
  industry: string;
  addedDate: string;
  campaignId?: string;
  campaignName?: string;
  summary?: string;
  hasInstagram: boolean;
  hasLinkedin: boolean;
  instagramData?: any;
  linkedinData?: any;
  history: any[];
}

const statusConfig: Record<LeadStatus, { label: string; colorClass: string; icon: any }> = {
  pending: { label: 'Oczekujący', colorClass: 'text-[#A3A09A] bg-white/[0.06] border-white/[0.08]', icon: Clock },
  sent: { label: 'W kampanii', colorClass: 'text-[#6a9bc9] bg-[#6a9bc9]/10 border-[#6a9bc9]/20', icon: Send },
};

export function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'overview' | 'ig' | 'in'>('overview');

  // Stany filtrów i sortowania
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<LeadStatus | 'all'>('all');
  const [filterSource, setFilterSource] = useState<'all' | 'ig' | 'in'>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'name_asc' | 'city_asc' | 'industry_asc'>('date_desc');

  useEffect(() => {
  async function loadAndTransferLeads() {
    setIsLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      setIsLoading(false);
      return;
    }

    // 1. KRADNIEMY ZE SCHOWKA (Transfer z Landingu)
    const tempLeads = localStorage.getItem('zec_temp_leads');
    const tempQuery = localStorage.getItem('zec_temp_query');

    if (tempLeads && tempQuery) {
      try {
        const userCreatedAt = new Date(session.user.created_at).getTime();
        const isNewAccount = ((Date.now() - userCreatedAt) / (1000 * 60)) < 5;

        if (isNewAccount) {
          const parsedLeads = JSON.parse(tempLeads);
          const parsedQuery = JSON.parse(tempQuery);

          console.log("Nowe konto: Transferuję 3 darmowe leady z landingu do CRM...");

          // Dla każdego leada z landingu:
          for (const leadData of parsedLeads) {
            // A. Dodajemy do global_leads (skarbiec)
            const { data: globalLead, error: globalError } = await supabase
              .from('global_leads')
              .insert({
                query_hash: 'landing-page-free',
                company_name: leadData.company || leadData.name || 'Brak nazwy',
                email: leadData.email || 'brak@email.pl',
                website: leadData.website || `brak-${Math.random()}.pl`, // Zabezpieczenie przed duplikatem UNIQUE
                city: parsedQuery.city,
                industry: parsedQuery.industry
              })
              .select('id')
              .single();

            if (globalError) {
              console.error("Błąd zapisu do global_leads:", globalError);
              continue; // Pomijamy, jeśli coś poszło nie tak
            }

            // B. Przypisujemy leada bezpośrednio do użytkownika (Magazyn CRM)
            await supabase
              .from('user_leads')
              .insert({
                user_id: session.user.id,
                global_lead_id: globalLead.id,
                name: leadData.name || 'Kontakt',
                status: 'pending',
                summary: 'Lead pozyskany z darmowego pakietu testowego na stronie głównej.',
                history: [
                  { 
                    date: new Date().toISOString(), 
                    action: 'Zarejestrowano z Landingu', 
                    details: 'Lead został automatycznie przeniesiony z Twojego darmowego testu.' 
                  }
                ]
              });
          }
          console.log("✅ Sukces! Darmowe leady są w nowym systemie.");
        }
        
        // SPRZĄTAMY, żeby nie dodało ich podwójnie przy odświeżeniu
        localStorage.removeItem('zec_temp_leads');
        localStorage.removeItem('zec_temp_query');

      } catch (err) {
        console.error("Błąd podczas transferu leadów:", err);
      }
    }

    // 2. POBIERAMY Z BAZY I RYSUJEMY FRONTEND (Tak jak w poprzednim kodzie)
    const { data, error } = await supabase
      .from('user_leads')
      .select(`
        id, name, status, created_at, summary, has_instagram, has_linkedin, instagram_data, linkedin_data, history, campaign_id,
        global_leads ( company_name, email, website, city, industry ),
        campaigns ( name )
      `)
      .eq('user_id', session.user.id);

    if (data) {
      const mappedLeads: Lead[] = data.map((item: any) => ({
        id: item.id,
        name: item.name || item.global_leads?.company_name || 'Brak nazwy',
        company: item.global_leads?.company_name || 'Brak firmy',
        email: item.global_leads?.email || 'brak@email.pl',
        website: item.global_leads?.website || '',
        city: item.global_leads?.city || '',
        industry: item.global_leads?.industry || '',
        status: item.status as LeadStatus || 'pending',
        addedDate: item.created_at,
        campaignId: item.campaign_id,
        campaignName: item.campaigns?.name,
        summary: item.summary,
        hasInstagram: item.has_instagram || false,
        hasLinkedin: item.has_linkedin || false,
        instagramData: item.instagram_data,
        linkedinData: item.linkedin_data,
        history: item.history || []
      }));
      setLeads(mappedLeads);
    }
    setIsLoading(false);
  }

  loadAndTransferLeads();
}, []);

  // Przetwarzanie leadów (Szukanie -> Filtrowanie -> Sortowanie)
  const processedLeads = useMemo(() => {
    let result = leads.filter(lead => {
      // Wyszukiwanie
      const searchMatch = 
        lead.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        lead.company.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Status
      const statusMatch = filterStatus === 'all' || lead.status === filterStatus;
      
      // Źródło / Wzbogacenie
      let sourceMatch = true;
      if (filterSource === 'ig') sourceMatch = lead.hasInstagram;
      if (filterSource === 'in') sourceMatch = lead.hasLinkedin;

      return searchMatch && statusMatch && sourceMatch;
    });

    // Sortowanie
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date_desc': return new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime();
        case 'date_asc': return new Date(a.addedDate).getTime() - new Date(b.addedDate).getTime();
        case 'name_asc': return a.name.localeCompare(b.name);
        case 'city_asc': return a.city.localeCompare(b.city);
        case 'industry_asc': return a.industry.localeCompare(b.industry);
        default: return 0;
      }
    });

    return result;
  }, [leads, searchQuery, filterStatus, filterSource, sortBy]);

  const toggleSelectAll = () => {
    if (selectedIds.size === processedLeads.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(processedLeads.map(l => l.id)));
  };

  const toggleSelect = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="size-5 text-[#827E78] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24">
      
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-[28px] font-serif text-[#EAE8E1] tracking-tight mb-1">Magazyn leadów.</h1>
        <p className="text-[15px] text-[#A3A09A]">Zarządzaj swoimi kontaktami. Wzbogacaj dane i przypisuj do kampanii.</p>
      </motion.div>

      {/* Pasek narzędzi (Szukajka + Zaawansowane Filtry) */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
        
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#827E78]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Szukaj firmy, nazwiska lub branży..."
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-10 pr-4 py-3 text-[14px] text-[#EAE8E1] placeholder:text-[#827E78] focus:border-white/[0.2] focus:bg-white/[0.06] transition-all outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 p-1">
          <div className="flex items-center gap-2 text-[#827E78] text-[13px] mr-2">
            <SlidersHorizontal className="size-4" /> Filtruj:
          </div>
          
          <select 
            value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)}
            className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-[13px] text-[#EAE8E1] outline-none"
          >
            <option value="all">Wszystkie statusy</option>
            <option value="pending">Tylko Oczekujące</option>
            <option value="sent">Tylko W Kampanii</option>
          </select>

          <select 
            value={filterSource} onChange={(e) => setFilterSource(e.target.value as any)}
            className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-[13px] text-[#EAE8E1] outline-none"
          >
            <option value="all">Wszystkie źródła</option>
            <option value="ig">Zbadany Instagram</option>
            <option value="in">Zbadany LinkedIn</option>
          </select>

          <div className="w-px h-4 bg-white/[0.1] mx-1" />

          <select 
            value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-[13px] text-[#EAE8E1] outline-none"
          >
            <option value="date_desc">Najnowsze wpierw</option>
            <option value="date_asc">Najstarsze wpierw</option>
            <option value="name_asc">Alfabetycznie (A-Z)</option>
            <option value="city_asc">Według Miasta</option>
            <option value="industry_asc">Według Branży</option>
          </select>
        </div>
      </motion.div>

      {/* Główna Tabela */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
        
        {/* Nagłówki Tabeli */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/[0.06] bg-white/[0.02]">
          <div className="col-span-5 flex items-center gap-4">
            <button onClick={toggleSelectAll} className={`size-4 rounded border flex items-center justify-center transition-all ${selectedIds.size > 0 && selectedIds.size === processedLeads.length ? 'bg-[#EAE8E1] border-[#EAE8E1]' : 'border-white/[0.15] bg-white/[0.04] hover:border-white/[0.3]'}`}>
              {selectedIds.size > 0 && <CheckCircle2 className="size-3 text-[#0a0a0a]" />}
            </button>
            <span className="text-[13px] font-medium text-[#827E78] flex items-center gap-1.5">Kontakt & Firma <ArrowUpDown className="size-3" /></span>
          </div>
          <div className="col-span-3 text-[13px] font-medium text-[#827E78]">Dane kontaktowe</div>
          <div className="col-span-2 text-[13px] font-medium text-[#827E78]">Status</div>
          <div className="col-span-2 text-[13px] font-medium text-[#827E78] text-right">Data</div>
        </div>

        {/* Lista */}
        <div className="divide-y divide-white/[0.04]">
          {processedLeads.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-[15px] text-[#A3A09A]">Brak leadów spełniających kryteria.</p>
            </div>
          ) : (
            processedLeads.map((lead) => {
              const statusInfo = statusConfig[lead.status] || statusConfig.pending;
              const isSelected = selectedIds.has(lead.id);

              return (
                <div key={lead.id} onClick={() => setSelectedLead(lead)} className={`grid grid-cols-12 gap-4 px-6 py-4 items-center cursor-pointer transition-all ${isSelected ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]'}`}>
                  {/* Kontakt & Firma */}
                  <div className="col-span-5 flex items-center gap-4">
                    <button onClick={(e) => toggleSelect(e, lead.id)} className={`size-4 rounded border flex items-center justify-center transition-all shrink-0 ${isSelected ? 'bg-[#EAE8E1] border-[#EAE8E1]' : 'border-white/[0.15] bg-white/[0.04] hover:border-white/[0.3]'}`}>
                      {isSelected && <CheckCircle2 className="size-3 text-[#0a0a0a]" />}
                    </button>
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium text-[#EAE8E1] truncate">{lead.name}</p>
                      <p className="text-[13px] text-[#827E78] truncate flex items-center gap-1.5">
                        {lead.company} {lead.city && <><span className="w-1 h-1 rounded-full bg-white/[0.15]" /> {lead.city}</>}
                      </p>
                    </div>
                  </div>

                  {/* Dane kontaktowe */}
                  <div className="col-span-3 flex flex-col justify-center min-w-0">
                    <div className="flex items-center gap-1.5 text-[13px] text-[#A3A09A] truncate mb-1">
                      <Mail className="size-3.5 shrink-0" /> <span className="truncate">{lead.email}</span>
                    </div>
                    <div className="flex gap-1.5">
                      {lead.website && <Globe className="size-3 text-[#5d9970]" />}
                      {lead.hasInstagram && <Instagram className="size-3 text-[#b56060]" />}
                      {lead.hasLinkedin && <Linkedin className="size-3 text-[#6a9bc9]" />}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="col-span-2 flex flex-col justify-center items-start">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border ${statusInfo.colorClass}`}>
                      <statusInfo.icon className="size-3" /> {statusInfo.label}
                    </span>
                    {lead.campaignName && (
                      <span className="text-[11px] text-[#827E78] mt-1.5 truncate max-w-full" title={lead.campaignName}>
                        {lead.campaignName}
                      </span>
                    )}
                  </div>

                  {/* Data */}
                  <div className="col-span-2 flex items-center justify-end gap-4">
                    <span className="text-[13px] text-[#827E78] font-mono">
                      {new Date(lead.addedDate).toLocaleDateString('pl-PL')}
                    </span>
                    <ChevronRight className="size-4 text-[#3a3a3a] group-hover:text-[#A3A09A] transition-colors" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.div>

      {/* --- PŁYWAJĄCY PASEK AKCJI --- */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0, x: '-50%' }} animate={{ y: 0, opacity: 1, x: '-50%' }} exit={{ y: 100, opacity: 0, x: '-50%' }}
            className="fixed bottom-8 left-1/2 z-30 flex items-center gap-6 px-6 py-4 bg-[#1A1A1A] border border-white/[0.1] shadow-2xl rounded-2xl"
          >
            <div className="flex items-center gap-3 border-r border-white/[0.1] pr-6">
              <div className="flex items-center justify-center size-6 rounded-full bg-white/[0.08] text-[12px] font-mono text-[#EAE8E1]">
                {selectedIds.size}
              </div>
              <span className="text-[14px] text-[#A3A09A]">Wybrano leadów</span>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-[#b56060] hover:bg-[#b56060]/10 rounded-xl transition-all">
                <Trash2 className="size-4" /> Usuń
              </button>
              <button className="flex items-center gap-2 px-5 py-2 bg-[#EAE8E1] hover:bg-white text-[#0a0a0a] text-[13px] font-semibold rounded-xl transition-all">
                <Plus className="size-4" /> Utwórz Kampanię
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- SIDEBAR (DOSSIER LEADA) --- */}
      <AnimatePresence>
        {selectedLead && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedLead(null)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />

            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-[#0a0a0a] border-l border-white/[0.08] z-50 flex flex-col shadow-2xl">
              
              {/* Sidebar Header */}
              <div className="px-8 py-6 border-b border-white/[0.06] flex justify-between items-start bg-white/[0.02]">
                <div>
                  <h2 className="text-[22px] font-serif font-bold text-[#EAE8E1] mb-1">{selectedLead.name}</h2>
                  <p className="text-[14px] text-[#A3A09A] flex items-center gap-2">
                    {selectedLead.company} {selectedLead.industry && <><span className="size-1 rounded-full bg-white/[0.15]" /> {selectedLead.industry}</>}
                  </p>
                </div>
                <button onClick={() => setSelectedLead(null)} className="p-2 bg-white/[0.04] hover:bg-white/[0.08] rounded-xl text-[#827E78] hover:text-[#EAE8E1] transition-all">
                  <X className="size-4" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                
                {/* Minimalistyczne Podsumowanie AI */}
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
                  <h3 className="text-[12px] font-medium text-[#A3A09A] mb-3 uppercase tracking-wider">
                    Podsumowanie
                  </h3>
                  <p className="text-[14px] text-[#EAE8E1] leading-relaxed">
                    {selectedLead.summary || "Brak wygenerowanego podsumowania dla tego leada."}
                  </p>
                </div>

                {/* Zakładki z danymi */}
                <div>
                  <div className="flex gap-2 border-b border-white/[0.06] pb-4 mb-6">
                    {[{ id: 'overview', label: 'Ogólne', icon: Globe }, { id: 'ig', label: 'Instagram', icon: Instagram }, { id: 'in', label: 'LinkedIn', icon: Linkedin }].map(tab => (
                      <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${activeTab === tab.id ? 'bg-white/[0.08] text-[#EAE8E1]' : 'text-[#827E78] hover:bg-white/[0.02] hover:text-[#A3A09A]'}`}>
                        <tab.icon className="size-3.5" /> {tab.label}
                      </button>
                    ))}
                  </div>

                  {activeTab === 'overview' && (
                    <div className="space-y-3">
                      {[
                        { icon: Mail, label: 'Email', value: selectedLead.email },
                        { icon: Globe, label: 'WWW', value: selectedLead.website || '-' },
                        { icon: Calendar, label: 'Dodano', value: new Date(selectedLead.addedDate).toLocaleDateString('pl-PL') }
                      ].map((info, i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-white/[0.04] bg-white/[0.01]">
                          <div className="flex items-center gap-3 text-[14px] text-[#A3A09A]"><info.icon className="size-4" /> {info.label}</div>
                          <span className="text-[14px] font-medium text-[#EAE8E1]">{info.value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'ig' && (
                    !selectedLead.hasInstagram ? (
                      <div className="text-center p-8 border border-dashed border-white/[0.1] rounded-2xl bg-white/[0.01]">
                        <Lock className="size-5 text-[#827E78] mx-auto mb-4" />
                        <h4 className="text-[14px] font-medium text-[#EAE8E1] mb-2">Brak danych z Instagrama</h4>
                        <button className="px-5 py-2 mt-2 bg-white/[0.06] hover:bg-white/[0.1] text-[#EAE8E1] text-[13px] rounded-xl border border-white/[0.1] transition-all">
                          Zescrapuj profil (1 Kredyt)
                        </button>
                      </div>
                    ) : (
                      <div className="p-5 border border-white/[0.06] rounded-xl bg-white/[0.02]">
                        <pre className="text-[12px] text-[#A3A09A] font-mono whitespace-pre-wrap">
                          {JSON.stringify(selectedLead.instagramData, null, 2)}
                        </pre>
                      </div>
                    )
                  )}

                  {activeTab === 'in' && (
                    !selectedLead.hasLinkedin ? (
                      <div className="text-center p-8 border border-dashed border-white/[0.1] rounded-2xl bg-white/[0.01]">
                        <Lock className="size-5 text-[#827E78] mx-auto mb-4" />
                        <h4 className="text-[14px] font-medium text-[#EAE8E1] mb-2">Brak danych z LinkedIn</h4>
                        <button className="px-5 py-2 mt-2 bg-white/[0.06] hover:bg-white/[0.1] text-[#EAE8E1] text-[13px] rounded-xl border border-white/[0.1] transition-all">
                          Zescrapuj LinkedIn (2 Kredyty)
                        </button>
                      </div>
                    ) : (
                      <div className="p-5 border border-white/[0.06] rounded-xl bg-white/[0.02]">
                        <pre className="text-[12px] text-[#A3A09A] font-mono whitespace-pre-wrap">
                          {JSON.stringify(selectedLead.linkedinData, null, 2)}
                        </pre>
                      </div>
                    )
                  )}
                </div>
              </div>
              
              <div className="p-6 border-t border-white/[0.06] bg-[#0a0a0a] flex gap-3">
                <button className="flex-1 px-4 py-3 bg-[#EAE8E1] hover:bg-white text-[#0a0a0a] text-[14px] font-semibold rounded-xl transition-all">
                  Dodaj do Kampanii
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}