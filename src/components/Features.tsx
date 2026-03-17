import { motion } from 'motion/react';
import { Search, Mail, Sparkles, Zap, Target, TrendingUp } from 'lucide-react';

const features = [
  {
    icon: Search,
    title: 'Google Maps Scraping',
    description: 'Extract business data in seconds. Get addresses, phone numbers, and more automatically.',
  },
  {
    icon: Mail,
    title: 'Email Finder',
    description: 'Find verified email addresses for each lead. No manual research needed.',
  },
  {
    icon: Sparkles,
    title: 'AI Personalization',
    description: 'Each message crafted by AI based on business profile and your goals.',
  },
  {
    icon: Zap,
    title: 'Instant Results',
    description: 'Get hundreds of leads in seconds. No waiting, no manual work.',
  },
  {
    icon: Target,
    title: 'Precision Targeting',
    description: 'Filter by industry, location, and more. Find exactly who you need.',
  },
  {
    icon: TrendingUp,
    title: 'Scale Your Outreach',
    description: 'From 3 to 500+ leads. Scale without hiring more people.',
  },
];

export function Features() {
  return (
    <div id="features" className="relative bg-black py-24 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Everything you need.
            <br />
            <span className="text-gray-500">Nothing you don't.</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Stop wasting time on manual prospecting. Let automation do the work.
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
              Ready to find your next 500 clients?
            </h3>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Start for free. No credit card required. 3 real leads instantly.
            </p>
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-8 py-4 bg-white text-black rounded-xl font-medium hover:bg-gray-200 transition-all text-lg shadow-2xl shadow-white/20"
            >
              Get started for free
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}