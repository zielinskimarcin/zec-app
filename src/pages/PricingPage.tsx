import { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Zap, Sparkles, Crown } from 'lucide-react';
import { Link } from 'react-router';

const plans = [
  {
    name: 'Starter',
    price: { monthly: 49, yearly: 39 },
    description: 'Dla freelancerów i solopreneurów',
    icon: Zap,
    features: [
      '500 leadów miesięcznie',
      '1 podpięta skrzynka',
      'Podstawowe szablony',
      'Standardowy support',
      'AI generowanie treści',
      'Podstawowe statystyki',
    ],
    cta: 'Rozpocznij za darmo',
    highlighted: false,
  },
  {
    name: 'Growth',
    price: { monthly: 129, yearly: 103 },
    description: 'Dla małych firm i agencji',
    icon: Sparkles,
    features: [
      '2000 leadów miesięcznie',
      '3 podpięte skrzynki',
      'AI Hyper-Personalization',
      'Auto-Follow-upy',
      'Zaawansowane statystyki',
      'Priorytetowy support',
      'API dostęp',
    ],
    cta: 'Rozpocznij 14-dniowy trial',
    highlighted: true,
    badge: 'Najpopularniejszy',
  },
  {
    name: 'Agency',
    price: { monthly: 299, yearly: 239 },
    description: 'Dla dużych agencji lead-genowych',
    icon: Crown,
    features: [
      '10 000 leadów miesięcznie',
      'Nielimitowane skrzynki',
      'Dedykowane proxy',
      'White-label opcja',
      'Dedykowany account manager',
      'SLA 99.9%',
      'Customowe integracje',
    ],
    cta: 'Skontaktuj się z nami',
    highlighted: false,
  },
];

export function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <div className="min-h-screen bg-[#111111] py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-6"
          >
            <span className="text-sm font-medium text-white">Proste, transparentne ceny</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-6xl font-bold text-white mb-6"
          >
            Wybierz plan dla siebie
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-400 max-w-2xl mx-auto mb-12"
          >
            Zacznij za darmo i rozwijaj się razem z nami. Bez ukrytych kosztów.
          </motion.p>

          {/* Billing Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full p-2"
          >
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-white text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Miesięcznie
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-6 py-2 rounded-full font-medium transition-all flex items-center gap-2 ${
                billingPeriod === 'yearly'
                  ? 'bg-white text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Rocznie
              <span className="text-xs bg-emerald-500 text-white px-2 py-1 rounded-full">
                -20%
              </span>
            </button>
          </motion.div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className={`relative bg-white/5 backdrop-blur-sm rounded-2xl border p-8 ${
                  plan.highlighted
                    ? 'border-white/40 shadow-2xl shadow-white/10'
                    : 'border-white/10'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-white text-black text-sm font-semibold rounded-full">
                    {plan.badge}
                  </div>
                )}

                <div className="mb-6">
                  <div className="size-12 bg-white/10 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="size-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-gray-400 text-sm">{plan.description}</p>
                </div>

                <div className="mb-8">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-5xl font-bold text-white">
                      ${billingPeriod === 'monthly' ? plan.price.monthly : plan.price.yearly}
                    </span>
                    <span className="text-gray-400">/msc</span>
                  </div>
                  {billingPeriod === 'yearly' && (
                    <div className="text-sm text-gray-400">
                      Płatne rocznie (${plan.price.yearly * 12})
                    </div>
                  )}
                </div>

                <Link
                  to="/register"
                  className={`block w-full text-center px-6 py-3 rounded-lg font-semibold transition-all mb-8 ${
                    plan.highlighted
                      ? 'bg-white hover:bg-gray-100 text-black'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  {plan.cta}
                </Link>

                <div className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Check className="size-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Często zadawane pytania
          </h2>

          <div className="space-y-4">
            {[
              {
                q: 'Czy mogę zmienić plan w dowolnym momencie?',
                a: 'Tak! Możesz zmienić plan w dowolnym momencie. Przy upgrade\'zie natychmiast otrzymasz dostęp do nowych funkcji, a przy downgrade\'zie zmiany wejdą w życie w następnym cyklu rozliczeniowym.',
              },
              {
                q: 'Co się stanie gdy wykorzystam wszystkie kredyty?',
                a: 'Gdy wykorzystasz wszystkie kredyty, możesz dokupić dodatkowe pakiety lub zaczekać do następnego miesiąca, kiedy limit się odnowi. Zawsze otrzymasz powiadomienie gdy zbliżysz się do limitu.',
              },
              {
                q: 'Czy mogę anulować subskrypcję?',
                a: 'Oczywiście! Możesz anulować subskrypcję w dowolnym momencie z poziomu ustawień. Nie ma żadnych ukrytych opłat czy kar za wcześniejszą rezygnację.',
              },
              {
                q: 'Czy oferujecie zwrot pieniędzy?',
                a: 'Tak, oferujemy 14-dniową gwarancję zwrotu pieniędzy. Jeśli ZEC nie spełni Twoich oczekiwań, zwrócimy Ci 100% wpłaconej kwoty.',
              },
            ].map((faq, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all"
              >
                <h3 className="text-lg font-semibold text-white mb-3">{faq.q}</h3>
                <p className="text-gray-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mt-20 text-center"
        >
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 rounded-2xl p-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Gotowy do rozpoczęcia?
            </h2>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              Dołącz do setek firm, które już wykorzystują ZEC do automatyzacji swojego outreachu
            </p>
            <Link
              to="/register"
              className="inline-block px-8 py-4 bg-white hover:bg-gray-100 text-black font-bold rounded-lg transition-all text-lg"
            >
              Rozpocznij za darmo
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
