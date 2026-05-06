import { motion } from 'motion/react';
import { Search, Mail, Sparkles, Zap, Target, TrendingUp } from 'lucide-react';

const features = [
  {
    icon: Search,
    title: 'Google Maps Scraping',
    description: 'Wydobądź dane biznesowe w sekundy. Adresy, telefony i więcej automatycznie.',
  },
  {
    icon: Mail,
    title: 'Email Finder',
    description: 'Znajdź zweryfikowane adresy email dla każdego leada. Zero ręcznej pracy.',
  },
  {
    icon: Sparkles,
    title: 'AI Personalizacja',
    description: 'Każda wiadomość tworzona przez AI na podstawie profilu firmy i Twoich celów.',
  },
  {
    icon: Zap,
    title: 'Natychmiastowe wyniki',
    description: 'Setki leadów w sekundy. Bez czekania, bez ręcznej pracy.',
  },
  {
    icon: Target,
    title: 'Precyzyjne targetowanie',
    description: 'Filtruj po branży, lokalizacji i więcej. Znajdź dokładnie kogo potrzebujesz.',
  },
  {
    icon: TrendingUp,
    title: 'Skaluj outreach',
    description: 'Od 3 do 500+ leadów. Skaluj bez zatrudniania nowych osób.',
  },
];

export function Features() {
  return (
    <div id="features" className="relative bg-[#0a0a0a] py-24 border-t border-white/10">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:64px_64px] opacity-50" />
      
      <div className="relative max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Wszystko, czego potrzebujesz.
            <br />
            <span className="text-gray-500">Nic zbędnego.</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Zautomatyzuj poszukiwanie nowych współprac i odzyskaj godziny cennego czasu każdego dnia.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all"
            >
              <div className="size-12 bg-white/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-white/20 transition-all">
                <feature.icon className="size-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-20 text-center"
        >
          <div className="inline-block bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-12">
            <h3 className="text-3xl font-bold text-white mb-4">
              Gotowy znaleźć kolejnych 500 klientów?
            </h3>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Zacznij za darmo. Bez karty kredytowej. 3 prawdziwe leady natychmiast.
            </p>
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-8 py-4 bg-white text-black rounded-xl font-medium hover:bg-gray-200 transition-all text-lg shadow-2xl shadow-white/20"
            >
              Zacznij za darmo
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}