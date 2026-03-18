import { motion } from 'motion/react';
import { Mail, Eye, Reply, Clock, TrendingUp, ArrowRight, Search } from 'lucide-react';
import { Link } from 'react-router';

const stats = [
  {
    label: 'Wysłane e-maile',
    value: '1,247',
    change: '+12%',
    trend: 'up',
    icon: Mail,
  },
  {
    label: 'Open Rate',
    value: '43.2%',
    change: '+5.3%',
    trend: 'up',
    icon: Eye,
  },
  {
    label: 'Reply Rate',
    value: '12.8%',
    change: '+2.1%',
    trend: 'up',
    icon: Reply,
  },
  {
    label: 'Zaoszczędzony czas',
    value: '45h',
    change: 'ten miesiąc',
    trend: 'neutral',
    icon: Clock,
  },
];

const campaigns = [
  {
    name: 'Architekci Warszawa',
    status: 'active',
    progress: 65,
    sent: 195,
    total: 300,
    replies: 24,
  },
  {
    name: 'Deweloperzy Kraków',
    status: 'active',
    progress: 42,
    sent: 84,
    total: 200,
    replies: 11,
  },
  {
    name: 'Marketing Agencies',
    status: 'paused',
    progress: 30,
    sent: 45,
    total: 150,
    replies: 7,
  },
];

export function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Dashboard
        </h1>
        <p className="text-gray-400">
          Witaj ponownie! Oto Twoje statystyki
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 hover:border-white/20 transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="size-10 bg-white/10 rounded-lg flex items-center justify-center group-hover:bg-white/15 transition-all">
                <stat.icon className="size-5 text-white" />
              </div>
              {stat.trend !== 'neutral' && (
                <div className={`flex items-center gap-1 text-xs font-medium ${
                  stat.trend === 'up' ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  <TrendingUp className={`size-3 ${stat.trend === 'down' && 'rotate-180'}`} />
                  {stat.change}
                </div>
              )}
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {stat.value}
            </div>
            <div className="text-sm text-gray-400">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Active Campaigns */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden"
      >
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">
                Aktywne kampanie
              </h2>
              <p className="text-sm text-gray-400">
                Śledź postęp swoich kampanii w czasie rzeczywistym
              </p>
            </div>
            <Link
              to="/app/campaigns"
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg transition-all text-sm font-medium group"
            >
              Zobacz wszystkie
              <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        <div className="divide-y divide-white/10">
          {campaigns.map((campaign) => (
            <div key={campaign.name} className="p-6 hover:bg-white/5 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-white">
                    {campaign.name}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    campaign.status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-yellow-500/10 text-yellow-400'
                  }`}>
                    {campaign.status === 'active' ? 'Aktywna' : 'Wstrzymana'}
                  </span>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <span className="text-gray-400">Wysłano: </span>
                    <span className="text-white font-medium">{campaign.sent}/{campaign.total}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Odpowiedzi: </span>
                    <span className="text-emerald-400 font-medium">{campaign.replies}</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${campaign.progress}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-white to-gray-400 rounded-full"
                />
              </div>
              <div className="mt-2 text-xs text-gray-400">
                {campaign.progress}% ukończone
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="grid md:grid-cols-2 gap-6"
      >
        <Link
          to="/app/prospecting"
          className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-8 hover:border-white/20 transition-all group"
        >
          <div className="size-12 bg-white/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-white/15 transition-all">
            <Search className="size-6 text-white" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            Znajdź nowych leadów
          </h3>
          <p className="text-gray-400 mb-4">
            Rozpocznij nowe wyszukiwanie i znajdź potencjalnych klientów
          </p>
          <div className="flex items-center gap-2 text-white font-medium group-hover:gap-3 transition-all">
            Rozpocznij wyszukiwanie
            <ArrowRight className="size-5" />
          </div>
        </Link>

        <Link
          to="/app/campaigns"
          className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-8 hover:border-white/20 transition-all group"
        >
          <div className="size-12 bg-white/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-white/15 transition-all">
            <Mail className="size-6 text-white" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            Utwórz kampanię
          </h3>
          <p className="text-gray-400 mb-4">
            Stwórz nową kampanię mailową z AI personalizacją
          </p>
          <div className="flex items-center gap-2 text-white font-medium group-hover:gap-3 transition-all">
            Nowa kampania
            <ArrowRight className="size-5" />
          </div>
        </Link>
      </motion.div>
    </div>
  );
}