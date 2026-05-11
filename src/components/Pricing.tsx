import { useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    description: 'Do sprawdzenia flow bez decyzji zakupowej',
    monthlyPrice: 0,
    yearlyPrice: 0,
    credits: '50 kredytów / miesiąc',
    popular: false,
    features: [
      'Wyszukiwanie leadów',
      'Pierwsze listy firm w aplikacji',
      'Testowe kampanie',
      'Podgląd wygenerowanych maili',
    ],
  },
  {
    name: 'Starter',
    description: 'Dla osób, które robią własny outbound',
    monthlyPrice: 49,
    yearlyPrice: 39,
    credits: '600 kredytów / miesiąc',
    popular: false,
    features: [
      'Zapisywanie i selekcja leadów',
      'Kampanie z generowaniem wiadomości',
      'Kolejka wysyłki przez podpiętą skrzynkę',
      'Statusy kampanii i maili',
    ],
  },
  {
    name: 'Growth',
    description: 'Dla zespołów, które regularnie prowadzą kampanie',
    monthlyPrice: 129,
    yearlyPrice: 103,
    credits: '2 000 kredytów / miesiąc',
    popular: true,
    features: [
      'Większy limit wyszukiwania i kampanii',
      'Obsługa wielu scenariuszy outreachu',
      'Limity wysyłki i harmonogram',
      'Billing i kredyty w panelu',
    ],
  },
  {
    name: 'Scale',
    description: 'Dla firm i agencji z większym wolumenem',
    monthlyPrice: 299,
    yearlyPrice: 239,
    credits: '7 000 kredytów / miesiąc',
    popular: false,
    features: [
      'Największy pakiet kredytów',
      'Wysyłka w większej skali',
      'Priorytetowe limity operacyjne',
      'Przygotowanie pod proces zespołowy',
    ],
  },
];

export function Pricing() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="bg-[#0a0a0a] py-24 border-t border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid lg:grid-cols-[1fr_auto] gap-8 lg:items-end mb-12"
        >
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-[#827E78] mb-3">Cennik</p>
            <h2 className="text-3xl md:text-5xl font-serif text-[#EAE8E1] tracking-tight mb-4">
              Plany oparte o kredyty
            </h2>
            <p className="text-base md:text-lg text-[#A3A09A] leading-relaxed">
              Kredyty odblokowują pracę na leadach i kampaniach. Startujesz za darmo, a potem dobierasz miesięczny limit do wolumenu wyszukiwania i wysyłki.
            </p>
          </div>

          <div className="inline-flex items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.04] p-1 w-fit">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${
                !isYearly
                  ? 'bg-[#EAE8E1] text-[#0a0a0a]'
                  : 'text-[#A3A09A] hover:text-[#EAE8E1]'
              }`}
            >
              Miesięcznie
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${
                isYearly
                  ? 'bg-[#EAE8E1] text-[#0a0a0a]'
                  : 'text-[#A3A09A] hover:text-[#EAE8E1]'
              }`}
            >
              Rocznie
            </button>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.07 }}
              className="relative"
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <div className="px-3 py-1 rounded-full border border-white/[0.1] bg-[#EAE8E1] text-[#0a0a0a] text-xs font-medium">
                    Najpopularniejszy
                  </div>
                </div>
              )}

              <div
                className={`h-full rounded-2xl border p-6 transition-colors ${
                  plan.popular
                    ? 'border-white/[0.18] bg-white/[0.07]'
                    : 'border-white/[0.08] bg-white/[0.035] hover:border-white/[0.14]'
                }`}
              >
                <div className="mb-6">
                  <h3 className="text-xl font-medium text-[#EAE8E1] mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-[#A3A09A] leading-relaxed">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-medium text-[#EAE8E1] tracking-tight">
                      ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                    </span>
                    <span className="text-sm text-[#827E78]">/ mies.</span>
                  </div>
                  <p className="text-sm text-[#A3A09A] mt-2">{plan.credits}</p>
                </div>

                <Link
                  to="/register"
                  className={`block text-center w-full py-3 rounded-xl text-sm font-medium transition-colors mb-6 ${
                    plan.popular
                      ? 'bg-[#EAE8E1] text-[#0a0a0a] hover:bg-white'
                      : 'bg-white/[0.06] text-[#EAE8E1] border border-white/[0.08] hover:bg-white/[0.1]'
                  }`}
                >
                  Załóż konto
                </Link>

                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div className="size-5 rounded-full border border-white/[0.08] bg-white/[0.05] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="size-3 text-[#EAE8E1]" />
                      </div>
                      <span className="text-[#A3A09A] text-sm leading-relaxed">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8 text-sm text-[#827E78]"
        >
          <p>
            Plan możesz zmienić później w ustawieniach aplikacji. Darmowy plan zostaje dostępny bez podpinania karty.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
