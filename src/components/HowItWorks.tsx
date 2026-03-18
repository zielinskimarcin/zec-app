import { motion } from 'motion/react';
import { Search, Sparkles, Send } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Search,
    title: 'Szukaj',
    description: 'Wprowadź branżę i miasto. Nasz system automatycznie znajdzie setki potencjalnych klientów z Google Maps.',
  },
  {
    number: '02',
    icon: Sparkles,
    title: 'AI pisze maile',
    description: 'Dla każdego leada AI tworzy spersonalizowaną wiadomość dopasowaną do branży i lokalizacji.',
  },
  {
    number: '03',
    icon: Send,
    title: 'Wysyłaj automatycznie',
    description: 'Zaplanuj wysyłkę i pozwól systemowi działać. Śledź otwarcia, odpowiedzi i konwersje w czasie rzeczywistym.',
  },
];

export function HowItWorks() {
  return (
    <div className="relative bg-[#0a0a0a] py-24 border-t border-white/10">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] opacity-50" />
      
      <div className="relative max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Jak to działa
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Od wyszukiwania do spersonalizowanego outreachu — wszystko w 3 prostych krokach
          </p>
        </motion.div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="relative"
            >
              {/* Connecting line (only between steps on desktop) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-[60%] w-full h-[2px] bg-gradient-to-r from-white/20 to-transparent" />
              )}

              {/* Step Card */}
              <div className="relative">
                {/* Number badge */}
                <div className="absolute -top-4 -left-4 size-12 bg-white rounded-xl flex items-center justify-center shadow-2xl shadow-white/10">
                  <span className="text-black font-bold text-lg">{step.number}</span>
                </div>

                {/* Main content */}
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 pt-12 hover:border-white/20 transition-all group">
                  {/* Icon */}
                  <div className="size-14 bg-white/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-white/15 transition-all">
                    <step.icon className="size-7 text-white" />
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl font-bold text-white mb-3">
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 text-center"
        >
          <p className="text-gray-500 text-sm">
            Średni czas na pierwsze wyniki: <span className="text-white font-semibold">2 minuty</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}