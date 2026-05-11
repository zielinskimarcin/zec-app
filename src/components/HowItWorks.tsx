import { motion } from 'motion/react';
import { CheckCircle2, MailCheck, Search, Send } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Search,
    title: 'Wyszukujesz leady',
    description: 'Wpisujesz branżę, lokalizację i kryteria. ZEC zbiera firmy, porządkuje dane i pozwala wybrać konkretne rekordy do kampanii.',
  },
  {
    number: '02',
    icon: MailCheck,
    title: 'Tworzysz kampanię',
    description: 'Wybierasz leady, skrzynkę nadawczą i kierunek wiadomości. Generator przygotowuje maile, które możesz przejrzeć przed wysyłką.',
  },
  {
    number: '03',
    icon: Send,
    title: 'Uruchamiasz wysyłkę',
    description: 'Kampania trafia do kolejki. System pilnuje limitów, harmonogramu i statusów, a Ty widzisz postęp bez ręcznego przeklejania.',
  },
];

const pipeline = [
  'Lead zapisany w bazie',
  'Mail wygenerowany do akceptacji',
  'Wiadomość dodana do kolejki SMTP',
  'Status kampanii aktualizowany automatycznie',
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-[#0a0a0a] py-24 border-t border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mb-14"
        >
          <p className="text-sm font-medium text-[#827E78] mb-3">Jak to działa</p>
          <h2 className="text-3xl md:text-5xl font-serif text-[#EAE8E1] tracking-tight mb-4">
            Jak to działa
          </h2>
          <p className="text-base md:text-lg text-[#A3A09A] leading-relaxed">
            Cały outbound przechodzi przez jeden prosty flow: wyszukanie firm, wybór leadów, wygenerowanie wiadomości i kontrolowaną wysyłkę z kampanii.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-10 items-start">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] overflow-hidden">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                className="grid md:grid-cols-[88px_1fr] gap-5 p-6 md:p-7 border-b border-white/[0.08] last:border-b-0"
              >
                <div className="flex md:block items-center gap-3">
                  <div className="size-11 rounded-xl border border-white/[0.08] bg-white/[0.06] flex items-center justify-center">
                    <step.icon className="size-5 text-[#EAE8E1]" />
                  </div>
                  <span className="mt-3 block text-xs font-medium text-[#827E78]">{step.number}</span>
                </div>
                <div>
                  <h3 className="text-xl font-medium text-[#EAE8E1] mb-2">{step.title}</h3>
                  <p className="text-sm md:text-base text-[#A3A09A] leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-6"
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-5 mb-5">
              <div>
                <p className="text-xs text-[#827E78]">Pipeline kampanii</p>
                <p className="text-lg font-medium text-[#EAE8E1]">Od leada do wysyłki</p>
              </div>
              <div className="size-10 rounded-xl border border-white/[0.08] bg-white/[0.06] flex items-center justify-center">
                <CheckCircle2 className="size-5 text-emerald-300" />
              </div>
            </div>

            <div className="space-y-3">
              {pipeline.map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-[#A3A09A]">
                  <div className="size-1.5 rounded-full bg-[#EAE8E1]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
