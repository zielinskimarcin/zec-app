import { motion } from 'motion/react';
import { Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Michał Kowalczyk',
    role: 'CEO, Digital Growth Agency',
    company: 'Warsaw',
    text: 'ZEC wygenerował mi 5 nowych klientów w tydzień. ROI zwrócił się już pierwszego miesiąca. Absolutna rewolucja w cold outreach.',
    rating: 5,
    avatar: 'MK',
  },
  {
    name: 'Anna Wiśniewska',
    role: 'Founder',
    company: 'Marketing Studio',
    text: 'Wcześniej spędzałam godziny na szukaniu leadów. Teraz zajmuje mi to 5 minut dziennie. AI pisze lepsze maile niż ja.',
    rating: 5,
    avatar: 'AW',
  },
  {
    name: 'Piotr Nowak',
    role: 'Sales Director',
    company: 'PropTech Solutions',
    text: 'Przeszliśmy z 20 leadów miesięcznie na 200+. System się zwraca wielokrotnie. Nie wyobrażam sobie pracy bez ZEC.',
    rating: 5,
    avatar: 'PN',
  },
];

export function Testimonials() {
  return (
    <div className="relative bg-[#0a0a0a] py-24 border-t border-white/10">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black opacity-50" />
      
      <div className="relative max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Zaufali nam przedsiębiorcy
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Zobacz, jak ZEC zmienił ich biznes
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="relative group"
            >
              {/* Card */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 hover:border-white/20 transition-all h-full flex flex-col">
                {/* Rating stars */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="size-4 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-gray-300 leading-relaxed mb-6 flex-1">
                  "{testimonial.text}"
                </p>

                {/* Author info */}
                <div className="flex items-center gap-4 pt-6 border-t border-white/10">
                  {/* Avatar */}
                  <div className="size-12 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-sm">
                      {testimonial.avatar}
                    </span>
                  </div>

                  {/* Name and role */}
                  <div>
                    <div className="text-white font-semibold">
                      {testimonial.name}
                    </div>
                    <div className="text-gray-500 text-sm">
                      {testimonial.role}
                    </div>
                    <div className="text-gray-600 text-xs">
                      {testimonial.company}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
            <div className="flex -space-x-2">
              {['MK', 'AW', 'PN', 'JK', 'AS'].map((initials, i) => (
                <div
                  key={i}
                  className="size-8 bg-white/10 rounded-full border-2 border-[#0a0a0a] flex items-center justify-center"
                >
                  <span className="text-white text-xs font-semibold">{initials}</span>
                </div>
              ))}
            </div>
            <span className="text-gray-400 text-sm">
              Dołącz do <span className="text-white font-semibold">200+</span> zadowolonych użytkowników
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
