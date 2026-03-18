import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Home } from 'lucide-react';

export function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] opacity-50" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative text-center"
      >
        <div className="text-9xl font-bold text-white/10 mb-4">404</div>
        <h1 className="text-4xl font-bold text-white mb-4">
          Strona nie znaleziona
        </h1>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          Przepraszamy, strona której szukasz nie istnieje lub została przeniesiona.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition-all"
        >
          <Home className="size-5" />
          Powrót do strony głównej
        </Link>
      </motion.div>
    </div>
  );
}
