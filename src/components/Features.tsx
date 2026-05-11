import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Coins, ListChecks, Mail, Search, Settings2, Workflow } from 'lucide-react';

const features = [
  {
    icon: Search,
    title: 'Wyszukiwarka leadów',
    description: 'Szukasz firm po branży i lokalizacji, a wyniki możesz od razu selekcjonować do dalszej pracy.',
  },
  {
    icon: ListChecks,
    title: 'Listy i wybór rekordów',
    description: 'Zapisane leady są widoczne w aplikacji, więc kampania startuje z konkretnych firm, a nie z przypadkowego pliku.',
  },
  {
    icon: Mail,
    title: 'Generowanie maili',
    description: 'Kreator kampanii przygotowuje wiadomości dla wybranych leadów i scenariusza, który podajesz w briefie.',
  },
  {
    icon: Workflow,
    title: 'Kolejka wysyłki',
    description: 'Wysyłka działa przez podpiętą skrzynkę, z kolejką, statusem i limitem dziennym nadawcy.',
  },
  {
    icon: Settings2,
    title: 'Ustawienia nadawcy',
    description: 'SMTP, dane nadawcy i limity są trzymane w panelu, żeby kampanie nie zależały od ręcznej konfiguracji za każdym razem.',
  },
  {
    icon: Coins,
    title: 'Kredyty i billing',
    description: 'Plan i wykorzystanie kredytów są widoczne w aplikacji, więc łatwo ocenić, kiedy zwiększyć miesięczny pakiet.',
  },
];

export function Features() {
  return (
    <section id="features" className="bg-[#0a0a0a] py-24 border-t border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mb-12"
        >
          <p className="text-sm font-medium text-[#827E78] mb-3">Platforma</p>
          <h2 className="text-3xl md:text-5xl font-serif text-[#EAE8E1] tracking-tight mb-4">
            Jedno miejsce na prospecting i kampanie
          </h2>
          <p className="text-base md:text-lg text-[#A3A09A] leading-relaxed">
            Interfejs pozostaje prosty, ale pod spodem każdy etap ma swój stan: lead, kampania, mail, kolejka, wysyłka i rozliczenie.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.06 }}
              className="rounded-2xl p-6 border border-white/[0.08] bg-white/[0.035] hover:border-white/[0.14] transition-colors"
            >
              <div className="size-10 rounded-xl border border-white/[0.08] bg-white/[0.06] flex items-center justify-center mb-6">
                <feature.icon className="size-5 text-[#EAE8E1]" />
              </div>
              <h3 className="text-lg font-medium text-[#EAE8E1] mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-[#A3A09A] leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-16 flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-t border-white/[0.08] pt-8"
        >
          <div>
            <p className="text-sm text-[#827E78] mb-2">Gotowy sprawdzić flow?</p>
            <h3 className="text-2xl font-serif text-[#EAE8E1] tracking-tight">
              Zacznij od wyszukania pierwszych leadów.
            </h3>
          </div>
          <Link
            to="/register"
            className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-[#EAE8E1] text-[#0a0a0a] text-sm font-medium hover:bg-white transition-colors w-fit"
          >
            Załóż konto
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
