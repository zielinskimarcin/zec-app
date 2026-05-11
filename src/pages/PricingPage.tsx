import { useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Check } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    description: 'Do pierwszego sprawdzenia aplikacji',
    price: { monthly: 0, yearly: 0 },
    credits: '50 kredytów / miesiąc',
    highlighted: false,
    features: [
      'Wyszukiwanie leadów',
      'Zapisywanie pierwszych firm',
      'Testowe kampanie',
      'Podgląd wygenerowanych wiadomości',
    ],
  },
  {
    name: 'Starter',
    description: 'Dla własnego outboundu',
    price: { monthly: 49, yearly: 39 },
    credits: '600 kredytów / miesiąc',
    highlighted: false,
    features: [
      'Selekcja leadów do kampanii',
      'Generowanie maili',
      'Kolejka wysyłki SMTP',
      'Statusy maili i kampanii',
    ],
  },
  {
    name: 'Growth',
    description: 'Dla regularnych kampanii',
    price: { monthly: 129, yearly: 103 },
    credits: '2 000 kredytów / miesiąc',
    highlighted: true,
    badge: 'Najpopularniejszy',
    features: [
      'Większy wolumen wyszukiwania',
      'Wiele scenariuszy kampanii',
      'Limity i harmonogram wysyłki',
      'Billing i kredyty w panelu',
    ],
  },
  {
    name: 'Scale',
    description: 'Dla większych wolumenów',
    price: { monthly: 299, yearly: 239 },
    credits: '7 000 kredytów / miesiąc',
    highlighted: false,
    features: [
      'Największy pakiet kredytów',
      'Wysyłka w większej skali',
      'Priorytetowe limity operacyjne',
      'Przygotowanie pod proces zespołowy',
    ],
  },
];

const faqs = [
  {
    q: 'Czym są kredyty?',
    a: 'Kredyty określają miesięczny limit pracy na leadach i kampaniach. W aplikacji widzisz dostępny plan, wykorzystanie i reset limitu.',
  },
  {
    q: 'Czy Free wymaga karty?',
    a: 'Nie. Darmowy plan jest dostępny bez podpinania karty i wystarcza do sprawdzenia podstawowego flow.',
  },
  {
    q: 'Czy mogę zmienić plan później?',
    a: 'Tak. Plan i wykorzystanie kredytów są widoczne w ustawieniach aplikacji, a płatne pakiety są przygotowane do uruchamiania z poziomu panelu.',
  },
  {
    q: 'Czy wysyłka działa z mojej skrzynki?',
    a: 'Tak. Kampanie korzystają z konfiguracji nadawcy i kolejki SMTP, dzięki czemu masz kontrolę nad wysyłką oraz limitami.',
  },
];

export function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#EAE8E1] px-6 py-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.12] flex items-center justify-center group-hover:bg-white/[0.1] transition-colors">
              <img src="/logo.png" alt="ZEC" className="w-5 h-5 object-contain brightness-0 invert" />
            </div>
            <span className="font-['Outfit'] font-medium text-[20px] text-[#EAE8E1] tracking-[-0.02em]">
              zec
            </span>
          </Link>

          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-[#827E78] hover:text-[#EAE8E1] transition-colors"
          >
            <ArrowLeft className="size-4" />
            Strona główna
          </Link>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid lg:grid-cols-[1fr_auto] gap-8 lg:items-end mb-12"
        >
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-[#827E78] mb-3">Cennik</p>
            <h1 className="text-4xl md:text-6xl font-serif font-normal tracking-tight text-[#EAE8E1] mb-5">
              Plany dopasowane do wolumenu outboundu
            </h1>
            <p className="text-base md:text-lg text-[#A3A09A] leading-relaxed">
              Zacznij od darmowego planu, a gdy potrzebujesz więcej leadów i kampanii, zwiększ miesięczny pakiet kredytów.
            </p>
          </div>

          <div className="inline-flex items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.04] p-1 w-fit">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-[#EAE8E1] text-[#0a0a0a]'
                  : 'text-[#A3A09A] hover:text-[#EAE8E1]'
              }`}
            >
              Miesięcznie
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${
                billingPeriod === 'yearly'
                  ? 'bg-[#EAE8E1] text-[#0a0a0a]'
                  : 'text-[#A3A09A] hover:text-[#EAE8E1]'
              }`}
            >
              Rocznie
            </button>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4 mb-20">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + index * 0.06 }}
              className="relative"
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <div className="px-3 py-1 rounded-full border border-white/[0.1] bg-[#EAE8E1] text-[#0a0a0a] text-xs font-medium">
                    {plan.badge}
                  </div>
                </div>
              )}

              <div
                className={`h-full rounded-2xl border p-6 ${
                  plan.highlighted
                    ? 'border-white/[0.18] bg-white/[0.07]'
                    : 'border-white/[0.08] bg-white/[0.035]'
                }`}
              >
                <div className="mb-6">
                  <h2 className="text-xl font-medium text-[#EAE8E1] mb-2">{plan.name}</h2>
                  <p className="text-sm text-[#A3A09A] leading-relaxed">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-medium tracking-tight text-[#EAE8E1]">
                      ${billingPeriod === 'monthly' ? plan.price.monthly : plan.price.yearly}
                    </span>
                    <span className="text-sm text-[#827E78]">/ mies.</span>
                  </div>
                  <p className="text-sm text-[#A3A09A] mt-2">{plan.credits}</p>
                </div>

                <Link
                  to="/register"
                  className={`block w-full text-center px-4 py-3 rounded-xl text-sm font-medium transition-colors mb-6 ${
                    plan.highlighted
                      ? 'bg-[#EAE8E1] text-[#0a0a0a] hover:bg-white'
                      : 'bg-white/[0.06] text-[#EAE8E1] border border-white/[0.08] hover:bg-white/[0.1]'
                  }`}
                >
                  Załóż konto
                </Link>

                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div className="size-5 rounded-full border border-white/[0.08] bg-white/[0.05] flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="size-3 text-[#EAE8E1]" />
                      </div>
                      <span className="text-sm text-[#A3A09A] leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        <section className="grid lg:grid-cols-[0.8fr_1fr] gap-10 border-t border-white/[0.08] pt-12">
          <div>
            <p className="text-sm font-medium text-[#827E78] mb-3">FAQ</p>
            <h2 className="text-3xl md:text-4xl font-serif font-normal tracking-tight text-[#EAE8E1]">
              Krótko o rozliczeniu
            </h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <div key={faq.q} className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5">
                <h3 className="text-base font-medium text-[#EAE8E1] mb-2">{faq.q}</h3>
                <p className="text-sm text-[#A3A09A] leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
