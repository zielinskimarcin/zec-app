import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Mail, Globe, Calendar, X, 
  Clock, Send, ArrowUpDown, ChevronRight, 
  Loader2, Instagram, Linkedin, Lock, Trash2, Plus, SlidersHorizontal, Check, Users, ShieldAlert
} from 'lucide-react';
import { Link } from 'react-router';
import { supabase } from '../lib/supabase';
import { CampaignCreator } from '../components/CampaignCreator';

type LeadStatus = 'pending' | 'sent';

interface Lead {
  id: string;
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
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Stany filtrów i sortowania
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<LeadStatus | 'all'>('all');
  const [filterSource, setFilterSource] = useState<'all' | 'ig' | 'in'>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'company_asc' | 'city_asc' | 'industry_asc'>('date_desc');
  const [isAddingMock, setIsAddingMock] = useState(false);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [creatorLeadIds, setCreatorLeadIds] = useState<string[]>([]);

  async function fetchLeads() {
    setIsLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('user_leads')
      .select(`
        id, status, created_at, summary, has_instagram, has_linkedin, instagram_data, linkedin_data, history, campaign_id,
        global_leads ( company_name, email, website, city, industry ),
        campaigns ( name )
      `)
      .eq('user_id', session.user.id);

    if (error) {
      console.error("Błąd pobierania leadów:", error);
    } else if (data) {
      const mappedLeads: Lead[] = data.map((item: any) => ({
        id: item.id,
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
        hasInstagram: item.has_instagram,
        hasLinkedin: item.has_linkedin,
        instagramData: item.instagram_data,
        linkedinData: item.linkedin_data,
        history: item.history || []
      }));
      setLeads(mappedLeads);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    fetchLeads();
  }, []);

  const processedLeads = useMemo(() => {
    let result = leads.filter(lead => {
      const searchStr = searchQuery.toLowerCase();
      const searchMatch = 
        lead.company.toLowerCase().includes(searchStr) || 
        lead.industry.toLowerCase().includes(searchStr) ||
        lead.city.toLowerCase().includes(searchStr);
        
      const statusMatch = filterStatus === 'all' || lead.status === filterStatus;
      
      let sourceMatch = true;
      if (filterSource === 'ig') sourceMatch = lead.hasInstagram;
      if (filterSource === 'in') sourceMatch = lead.hasLinkedin;

      return searchMatch && statusMatch && sourceMatch;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case 'date_desc': return new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime();
        case 'date_asc': return new Date(a.addedDate).getTime() - new Date(b.addedDate).getTime();
        case 'company_asc': return a.company.localeCompare(b.company);
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

  const handleDeleteSelected = async () => {
    if (!confirm(`Czy na pewno chcesz usunąć ${selectedIds.size} leadów z bazy?`)) return;

    const idsToDelete = Array.from(selectedIds);
    setLeads(prev => prev.filter(lead => !selectedIds.has(lead.id)));
    setSelectedIds(new Set());

    const { error } = await supabase.from('user_leads').delete().in('id', idsToDelete);
    if (error) {
      console.error('Błąd usuwania:', error);
      alert('Wystąpił błąd podczas usuwania. Odśwież stronę.');
    }
  };

  // --- FUNKCJA DEWELOPERSKA: DODAJ MOCK LEADY ---
  const handleAddMockLeads = async () => {
    setIsAddingMock(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      alert('Musisz być zalogowany.');
      setIsAddingMock(false);
      return;
    }

    const rand = Math.floor(Math.random() * 100000);
    const mockHistory = [{ date: new Date().toISOString(), action: 'Wyszukano', details: 'Zescrapowano z Google Maps. Dodano przez Dev-Button.' }];

    // Zmiana JSONa na zwykły tekst w punktach
    const igDataText = `• Obserwujący: 14 500\n• Bio: 🚀 Skalujemy Twój biznes | Agencja 360\n• Ostatnie posty:\n  - Prezentacja nowego case-study z branży e-commerce (wzrost konwersji o 150%).\n  - Zdjęcia z integracji zespołu w górach - mocny nacisk na kulturę pracy.\n  - Promocja nowej usługi automatyzacji marketingu przy użyciu AI.`;

    const inDataText = `• Wielkość firmy: 11-50 pracowników\n• Założona: 2018 (Polska)\n• Ostatnie posty:\n  - Ogłoszenie o poszukiwaniu Mid/Senior React Developera na projekt zagraniczny.\n  - Komentarz CEO dotyczący przyszłości sztucznej inteligencji w B2B SaaS.\n  - Podsumowanie kwartału: pozyskanie 3 nowych, dużych klientów z rynku brytyjskiego.`;

    const mockData = [
      { c: `Digital Growth ${rand}`, e: `kontakt${rand}@digitalgrowth.pl`, ind: 'Agencja Marketingowa', loc: 'Warszawa', person: 'Anna Nowak', ig: true, in: true, status: 'sent', summary: 'Dynamiczna agencja reklamowa. Mocno aktywna na LinkedIn, szukają rozwiązań do automatyzacji.' },
      { c: `Code Crafters ${rand}`, e: `hello${rand}@codecrafters.io`, ind: 'Software House', loc: 'Kraków', person: 'Piotr Zieliński', ig: false, in: true, status: 'pending', summary: 'Firma IT tworząca aplikacje webowe. Zatrudniają około 50 osób. Nie prowadzą Instagrama.' },
      { c: `Beauty Med Clinic ${rand}`, e: `recepcja${rand}@beautymed.pl`, ind: 'Medycyna Estetyczna', loc: 'Wrocław', person: 'Marta Kowal', ig: true, in: false, status: 'pending', summary: 'Klinika medycyny estetycznej premium. Mają świetny i angażujący profil na Instagramie.' },
      { c: `Logistix B2B ${rand}`, e: `biuro${rand}@logistix.com.pl`, ind: 'Logistyka', loc: 'Poznań', person: 'Jan Kowalski', ig: false, in: false, status: 'pending', summary: 'Tradycyjna firma logistyczna, stara strona www. Potrzebują digitalizacji.' },
      { c: `Eco Store E-commerce ${rand}`, e: `sklep${rand}@ecostore.pl`, ind: 'E-commerce', loc: 'Gdańsk', person: 'Tomasz Lis', ig: true, in: true, status: 'sent', summary: 'Szybko rosnący e-commerce z kosmetykami naturalnymi. Skalują się na rynki zagraniczne.' },
      { c: `Archi Studio ${rand}`, e: `design${rand}@archistudio.pl`, ind: 'Architektura', loc: 'Warszawa', person: 'Katarzyna Zając', ig: true, in: false, status: 'pending', summary: 'Biuro projektowe z nagrodami. Publikują piękne realizacje na swoim profilu.' },
      { c: `Fin-Tech Polska ${rand}`, e: `contact${rand}@fintech.pl`, ind: 'Finanse', loc: 'Warszawa', person: 'Michał Wiśniewski', ig: false, in: true, status: 'sent', summary: 'Startup technologiczny w branży finansowej. Właśnie zebrali drugą rundę finansowania.' },
      { c: `Green Solar Energy ${rand}`, e: `biuro${rand}@greensolar.pl`, ind: 'OZE', loc: 'Rzeszów', person: 'Adam Małysz', ig: false, in: false, status: 'pending', summary: 'Lokalny instalator fotowoltaiki. Dużo negatywnych opinii w Google Maps, trzeba podejść ostrożnie.' },
      { c: `Next Gen AI ${rand}`, e: `hello${rand}@nextgen.ai`, ind: 'SaaS', loc: 'Kraków', person: 'Julia Wieniawa', ig: true, in: true, status: 'pending', summary: 'Nowoczesny SaaS. Mocny content marketing i świetny Employer Branding na LinkedInie.' },
      { c: `Real Estate Pro ${rand}`, e: `agents${rand}@realestate.com`, ind: 'Nieruchomości', loc: 'Gdynia', person: 'Robert Lewandowski', ig: false, in: true, status: 'sent', summary: 'Agencja nieruchomości premium z Trójmiasta. Oferują obsługę inwestorów z zagranicy.' },
    ];

    try {
      let addedCount = 0;

      for (const m of mockData) {
        // 1. Wstaw do global_leads
        const { data: globalData, error: globalErr } = await supabase
          .from('global_leads')
          .insert({ 
            query_hash: `dev-mock-${rand}-${addedCount}`, 
            company_name: m.c, 
            email: m.e, 
            industry: m.ind, 
            city: m.loc, 
            website: `www.${m.c.toLowerCase().replace(/\s+/g, '')}.pl` 
          })
          .select('id')
          .single();

        if (globalErr) { 
          console.error('Błąd global_leads:', globalErr); 
          alert(`Błąd dodawania do global_leads: ${globalErr.message}`);
          continue; 
        }

        // 2. Wstaw do user_leads przypisane do usera
        const { error: userErr } = await supabase
          .from('user_leads')
          .insert({
            user_id: session.user.id,
            global_lead_id: globalData.id,
            name: m.person,
            status: m.status,
            summary: m.summary,
            has_instagram: m.ig,
            has_linkedin: m.in,
            instagram_data: m.ig ? igDataText : null,
            linkedin_data: m.in ? inDataText : null,
            history: mockHistory
          });

        if (userErr) {
          console.error('Błąd user_leads:', userErr);
          alert(`Błąd dodawania do user_leads: ${userErr.message}`);
        } else {
          addedCount++;
        }
      }
      
      if (addedCount > 0) {
        alert(`Dodano ${addedCount} leadów testowych!`);
        fetchLeads(); // Odśwież listę po udanym dodaniu
      }
    } catch (err) {
      console.error(err);
      alert('Wystąpił nieoczekiwany błąd podczas dodawania mocków.');
    } finally {
      setIsAddingMock(false);
    }
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
        <h1 className="text-[28px] font-serif text-[#EAE8E1] tracking-tight mb-1">Baza leadów</h1>
        <p className="text-[15px] text-[#A3A09A]">Zarządzaj swoimi kontaktami. Wzbogacaj dane i przypisuj do kampanii.</p>
      </motion.div>

      {/* Pasek narzędzi */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#827E78]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Szukaj firmy, branży lub miasta..."
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-10 pr-4 py-3 text-[14px] text-[#EAE8E1] placeholder:text-[#827E78] focus:border-white/[0.2] focus:bg-white/[0.06] transition-all outline-none"
            />
          </div>
          <button 
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className={`px-5 py-3 rounded-xl border flex items-center gap-2 text-[14px] font-medium transition-all ${
              isFiltersOpen || filterStatus !== 'all' || filterSource !== 'all' || sortBy !== 'date_desc'
              ? 'bg-[#EAE8E1] text-[#0a0a0a] border-[#EAE8E1]' 
              : 'bg-white/[0.04] text-[#EAE8E1] border-white/[0.08] hover:bg-white/[0.08]'
            }`}
          >
            <SlidersHorizontal className="size-4" /> Filtry
          </button>
        </div>

        {/* Rozwijany panel filtrów */}
        <AnimatePresence>
          {isFiltersOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="p-5 border border-white/[0.06] bg-white/[0.02] rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-[12px] font-medium text-[#827E78] mb-2 uppercase tracking-wider">Status</label>
                  <select 
                    value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-[#EAE8E1] outline-none hover:bg-white/[0.06] transition-all cursor-pointer appearance-none"
                    style={{ WebkitAppearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23A3A09A%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.7rem top 50%', backgroundSize: '0.65rem auto' }}
                  >
                    <option value="all" className="bg-[#1A1A1A]">Wszystkie statusy</option>
                    <option value="pending" className="bg-[#1A1A1A]">Oczekujące</option>
                    <option value="sent" className="bg-[#1A1A1A]">W Kampanii</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#827E78] mb-2 uppercase tracking-wider">Typ danych</label>
                  <select 
                    value={filterSource} onChange={(e) => setFilterSource(e.target.value as any)}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-[#EAE8E1] outline-none hover:bg-white/[0.06] transition-all cursor-pointer appearance-none"
                    style={{ WebkitAppearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23A3A09A%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.7rem top 50%', backgroundSize: '0.65rem auto' }}
                  >
                    <option value="all" className="bg-[#1A1A1A]">Wszystkie leady</option>
                    <option value="ig" className="bg-[#1A1A1A]">Z Instagramem</option>
                    <option value="in" className="bg-[#1A1A1A]">Z LinkedInem</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#827E78] mb-2 uppercase tracking-wider">Sortowanie</label>
                  <select 
                    value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-[#EAE8E1] outline-none hover:bg-white/[0.06] transition-all cursor-pointer appearance-none"
                    style={{ WebkitAppearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23A3A09A%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.7rem top 50%', backgroundSize: '0.65rem auto' }}
                  >
                    <option value="date_desc" className="bg-[#1A1A1A]">Najnowsze wpierw</option>
                    <option value="date_asc" className="bg-[#1A1A1A]">Najstarsze wpierw</option>
                    <option value="company_asc" className="bg-[#1A1A1A]">Alfabetycznie (A-Z)</option>
                    <option value="city_asc" className="bg-[#1A1A1A]">Według Miasta</option>
                    <option value="industry_asc" className="bg-[#1A1A1A]">Według Branży</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Główna Tabela */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
        
        {/* Nagłówki Tabeli */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/[0.06] bg-white/[0.02]">
          <div className="col-span-5 flex items-center gap-4">
            <button onClick={toggleSelectAll} className={`size-4 rounded flex items-center justify-center transition-all border ${selectedIds.size > 0 && selectedIds.size === processedLeads.length ? 'bg-[#EAE8E1] border-[#EAE8E1]' : 'border-white/[0.15] bg-transparent hover:border-white/[0.3]'}`}>
              {selectedIds.size > 0 && <Check strokeWidth={3} className="size-3 text-[#0a0a0a]" />}
            </button>
            <span className="text-[13px] font-medium text-[#827E78] flex items-center gap-1.5">Firma & Lokalizacja <ArrowUpDown className="size-3" /></span>
          </div>
          <div className="col-span-3 text-[13px] font-medium text-[#827E78]">Dane kontaktowe</div>
          <div className="col-span-2 text-[13px] font-medium text-[#827E78]">Status</div>
          <div className="col-span-2 text-[13px] font-medium text-[#827E78] text-right">Data</div>
        </div>

        {/* Lista */}
        <div className="divide-y divide-white/[0.04]">
          {processedLeads.length === 0 ? (
            <div className="px-8 py-20 text-center">
              <div className="size-14 bg-white/[0.03] border border-white/[0.06] rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm">
                <Users className="size-6 text-[#A3A09A]" />
              </div>
              {leads.length === 0 ? (
                <>
                  <p className="text-[18px] font-medium text-[#EAE8E1] mb-2">Brak zapisanych leadów</p>
                  <p className="text-[14px] text-[#A3A09A] mb-8 max-w-[320px] mx-auto leading-relaxed">Skorzystaj z naszej wyszukiwarki i znajdź idealne firmy do swojej pierwszej kampanii.</p>
                  <Link to="/app/prospecting" className="inline-flex items-center justify-center px-6 py-3 bg-[#EAE8E1] hover:bg-white text-[#1A1A1A] text-[14px] font-medium rounded-xl transition-all shadow-sm">Wyszukaj nowe firmy</Link>
                </>
              ) : (
                <>
                  <p className="text-[18px] font-medium text-[#EAE8E1] mb-2">Brak wyników wyszukiwania</p>
                  <p className="text-[14px] text-[#A3A09A] mb-8 max-w-[320px] mx-auto leading-relaxed">Żaden z Twoich zapisanych leadów nie pasuje do obecnych kryteriów filtrowania.</p>
                  <button onClick={() => { setSearchQuery(''); setFilterStatus('all'); setFilterSource('all'); }} className="inline-flex items-center justify-center px-6 py-3 bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] text-[#EAE8E1] text-[14px] font-medium rounded-xl transition-all shadow-sm">Wyczyść filtry</button>
                </>
              )}
            </div>
          ) : (
            processedLeads.map((lead) => {
              const statusInfo = statusConfig[lead.status] || statusConfig.pending;
              const isSelected = selectedIds.has(lead.id);

              return (
                <div key={lead.id} onClick={() => setSelectedLead(lead)} className={`grid grid-cols-12 gap-4 px-6 py-4 items-center cursor-pointer transition-all ${isSelected ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]'}`}>
                  {/* Firma & Lokalizacja */}
                  <div className="col-span-5 flex items-center gap-4">
                    <button onClick={(e) => toggleSelect(e, lead.id)} className={`size-4 rounded flex items-center justify-center transition-all border shrink-0 ${isSelected ? 'bg-[#EAE8E1] border-[#EAE8E1]' : 'border-white/[0.15] bg-transparent hover:border-white/[0.3]'}`}>
                      {isSelected && <Check strokeWidth={3} className="size-3 text-[#0a0a0a]" />}
                    </button>
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium text-[#EAE8E1] truncate">{lead.company}</p>
                      <p className="text-[13px] text-[#827E78] truncate flex items-center gap-1.5">
                        {lead.industry || 'Brak branży'} {lead.city && <><span className="w-1 h-1 rounded-full bg-white/[0.15]" /> {lead.city}</>}
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
              <button onClick={handleDeleteSelected} className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-[#b56060] hover:bg-[#b56060]/10 rounded-xl transition-all">
                <Trash2 className="size-4" /> Usuń
              </button>
              <button
                onClick={() => { setCreatorLeadIds([...selectedIds]); setIsCreatorOpen(true); }}
                className="flex items-center gap-2 px-5 py-2 bg-[#EAE8E1] hover:bg-white text-[#0a0a0a] text-[13px] font-semibold rounded-xl transition-all">
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedLead(null)} className="fixed left-0 right-0 top-[72px] h-[calc(100vh-72px)] bg-black/60 backdrop-blur-sm z-30" />

            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed right-0 top-[72px] h-[calc(100vh-72px)] w-full max-w-xl bg-[#0a0a0a] border-l border-white/[0.08] z-40 flex flex-col shadow-2xl">
              <div className="px-8 py-6 border-b border-white/[0.06] flex justify-between items-start bg-white/[0.02]">
                <div>
                  <h2 className="text-[22px] font-serif text-[#EAE8E1] mb-1">{selectedLead.company}</h2>
                  <p className="text-[14px] text-[#A3A09A] flex items-center gap-2">
                    {selectedLead.industry || 'Brak branży'} {selectedLead.city && <><span className="size-1 rounded-full bg-white/[0.15]" /> {selectedLead.city}</>}
                  </p>
                </div>
                <button onClick={() => setSelectedLead(null)} className="p-2 bg-white/[0.04] hover:bg-white/[0.08] rounded-xl text-[#827E78] hover:text-[#EAE8E1] transition-all">
                  <X className="size-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
                  <h3 className="text-[12px] font-medium text-[#A3A09A] mb-3 uppercase tracking-wider">Podsumowanie</h3>
                  <p className="text-[14px] text-[#EAE8E1] leading-relaxed">
                    {selectedLead.summary || "Brak wygenerowanego podsumowania dla tego leada."}
                  </p>
                </div>

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
                        <div className="text-[13px] text-[#A3A09A] whitespace-pre-wrap leading-relaxed">
                          {typeof selectedLead.instagramData === 'string' 
                            ? selectedLead.instagramData 
                            : JSON.stringify(selectedLead.instagramData, null, 2)}
                        </div>
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
                        <div className="text-[13px] text-[#A3A09A] whitespace-pre-wrap leading-relaxed">
                          {typeof selectedLead.linkedinData === 'string' 
                            ? selectedLead.linkedinData 
                            : JSON.stringify(selectedLead.linkedinData, null, 2)}
                        </div>
                      </div>
                    )
                  )}
                </div>

                <div className="pt-8 border-t border-white/[0.06]">
                  <h3 className="text-[14px] font-medium text-[#EAE8E1] mb-6">Historia operacji</h3>
                  <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[11px] before:h-full before:w-px before:bg-white/[0.08]">
                    {selectedLead.history && selectedLead.history.map((event, i) => (
                      <div key={i} className="relative flex gap-4">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white/[0.1] bg-[#0a0a0a] z-10 shrink-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#EAE8E1]"></div>
                        </div>
                        <div className="flex-1 bg-white/[0.02] border border-white/[0.04] p-4 rounded-xl">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[13px] font-medium text-[#EAE8E1]">{event.action}</span>
                            <span className="text-[11px] text-[#827E78] font-mono">{new Date(event.date).toLocaleDateString()}</span>
                          </div>
                          <p className="text-[13px] text-[#A3A09A] leading-relaxed">{event.details}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
              
              <div className="p-6 border-t border-white/[0.06] bg-[#0a0a0a] flex gap-3">
                <button
                  onClick={() => {
                    setCreatorLeadIds([selectedLead.id]);
                    setSelectedLead(null);
                    setIsCreatorOpen(true);
                  }}
                  className="flex-1 px-4 py-3 bg-[#EAE8E1] hover:bg-white text-[#0a0a0a] text-[14px] font-semibold rounded-xl transition-all"
                >
                  Utwórz kampanię dla tego leada
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <CampaignCreator
        isOpen={isCreatorOpen}
        onClose={() => setIsCreatorOpen(false)}
        preselectedLeadIds={creatorLeadIds}
      />

      {/* --- DEV BUTTON: DODAJ TESTOWE LEADY --- */}
      <div className="fixed bottom-4 right-4 z-50">
        <button 
          onClick={handleAddMockLeads} 
          disabled={isAddingMock}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#b56060]/10 border border-[#b56060]/30 hover:bg-[#b56060]/20 text-[#b56060] text-[11px] font-mono rounded-md transition-all opacity-50 hover:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {isAddingMock ? <Loader2 className="size-3 animate-spin" /> : <ShieldAlert className="size-3" />}
          DEV: Wstaw 10 Mocków
        </button>
      </div>

    </div>
  );
}