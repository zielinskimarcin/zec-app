import { motion } from 'motion/react';
import { Database, MailCheck, ShieldCheck } from 'lucide-react';

const productNotes = [
  {
    icon: Database,
    label: 'Dane',
    title: 'Leady są zapisywane w aplikacji',
    description: 'Wyszukiwarka nie kończy się na jednorazowym eksporcie. Wybrane firmy trafiają do listy i mogą zostać użyte w kampanii.',
  },
  {
    icon: MailCheck,
    label: 'Outreach',
    title: 'Maile powstają w kontekście kampanii',
    description: 'Wiadomości są generowane dla konkretnych leadów i scenariusza sprzedażowego, a nie jako luźny szablon do ręcznego kopiowania.',
  },
  {
    icon: ShieldCheck,
    label: 'Kontrola',
    title: 'Wysyłka ma kolejkę, statusy i limity',
    description: 'Kampanie mogą działać automatycznie, ale z zachowaniem limitów nadawcy i widocznością tego, co jest gotowe, wysłane albo wymaga uwagi.',
  },
];

export function Testimonials() {
  return (
    <section className="bg-[#0a0a0a] py-24 border-t border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid lg:grid-cols-[0.85fr_1fr] gap-8 lg:gap-16 items-end mb-12"
        >
          <div>
            <p className="text-sm font-medium text-[#827E78] mb-3">Co jest w środku</p>
            <h2 className="text-3xl md:text-5xl font-serif text-[#EAE8E1] tracking-tight">
              Od danych do wysyłki w jednym procesie
            </h2>
          </div>
          <p className="text-base md:text-lg text-[#A3A09A] leading-relaxed">
            Każdy etap ma jasny status: zapisany lead, wygenerowany mail, kampania w kolejce i wysyłka przez podpiętą skrzynkę.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4">
          {productNotes.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-6"
            >
              <div className="flex items-center justify-between mb-8">
                <span className="text-xs font-medium text-[#827E78]">{item.label}</span>
                <div className="size-10 rounded-xl border border-white/[0.08] bg-white/[0.06] flex items-center justify-center">
                  <item.icon className="size-5 text-[#EAE8E1]" />
                </div>
              </div>
              <h3 className="text-lg font-medium text-[#EAE8E1] mb-3">{item.title}</h3>
              <p className="text-sm text-[#A3A09A] leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
