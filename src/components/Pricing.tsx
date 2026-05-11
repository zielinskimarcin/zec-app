import { useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    description: 'Dla solopreneurów i freelancerów',
    monthlyPrice: 49,
    yearlyPrice: 39,
    popular: false,
    features: [
      '500 leadów miesięcznie',
      '1 podpięta skrzynka',
      'Podstawowe szablony',
      'Standardowy support',
      'AI personalizacja',
      'Email finder',
    ],
  },
  {
    name: 'Growth',
    description: 'Dla małych firm i agencji',
    monthlyPrice: 129,
    yearlyPrice: 103,
    popular: true,
    features: [
      '2,000 leadów miesięcznie',
      '3 podpięte skrzynki',
      'AI Hyper-Personalization',
      'Auto-Follow-upy',
      'Czytanie stron www leadów',
      'Priorytetowy support',
      'Zaawansowane analytics',
    ],
  },
  {
    name: 'Agency',
    description: 'Dla dużych agencji',
    monthlyPrice: 299,
    yearlyPrice: 239,
    popular: false,
    features: [
      '10,000 leadów miesięcznie',
      'Nielimitowane skrzynki',
      'Priorytetowy support 24/7',
      'Dedykowane proxy',
      'Custom integracje',
      'Account manager',
      'White-label opcja',
    ],
  },
];

export function Pricing() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <div id="pricing" className="relative bg-black py-24 border-t border-white/10">
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:80px_80px]" />

      <div className="relative max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Proste, przejrzyste ceny
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
            Wybierz plan odpowiedni dla Twojego biznesu
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-full p-1.5 border border-white/10">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-6 py-2 rounded-full transition-all ${
                !isYearly
                  ? 'bg-white text-black font-medium'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Miesięcznie
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-6 py-2 rounded-full transition-all ${
                isYearly
                  ? 'bg-white text-black font-medium'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Rocznie
              <span className="ml-2 text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                -20%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="relative"
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <div className="px-4 py-1.5 bg-white text-black rounded-full text-sm font-semibold shadow-xl">
                    Najpopularniejszy
                  </div>
                </div>
              )}

              {/* Card */}
              <div
                className={`relative h-full bg-white/5 backdrop-blur-sm rounded-2xl border p-8 transition-all ${
                  plan.popular
                    ? 'border-white/30 shadow-2xl shadow-white/10 scale-105'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                {/* Plan name and description */}
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-400 text-sm">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="mb-8">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-white">
                      ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                    </span>
                    <span className="text-gray-400">/miesiąc</span>
                  </div>
                  {isYearly && (
                    <p className="text-sm text-gray-500 mt-2">
                      Płatne rocznie (${plan.yearlyPrice * 12}/rok)
                    </p>
                  )}
                </div>

                {/* CTA Button */}
                <Link
                  to="/register"
                  className={`block text-center w-full py-3 rounded-lg font-medium transition-all mb-8 ${
                    plan.popular
                      ? 'bg-white text-black hover:bg-gray-200'
                      : 'bg-white/10 text-white border border-white/20 hover:bg-white/15'
                  }`}
                >
                  Rozpocznij teraz
                </Link>

                {/* Features */}
                <ul className="space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div className="size-5 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="size-3 text-white" />
                      </div>
                      <span className="text-gray-300 text-sm leading-relaxed">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="text-gray-500 text-sm">
            Wszystkie plany zawierają 14-dniowy okres próbny •{' '}
            <span className="text-white">Bez zobowiązań</span> • Anuluj kiedy chcesz
          </p>
        </motion.div>
      </div>
    </div>
  );
}
