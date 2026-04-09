import { useState } from 'react';
import { Link, useNavigate } from 'react-router'; // Używam 'react-router-dom' jeśli używasz standardowego routera
import { motion } from 'motion/react';
import { Sparkles, Mail, Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase'; // <-- WAŻNE: upewnij się, że ścieżka jest poprawna!

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Prawdziwe uderzenie do Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Tłumaczymy generyczne błędy na polski
      if (error.message === 'Invalid login credentials') {
        setError('Nieprawidłowy email lub hasło.');
      } else {
        setError(error.message);
      }
      setLoading(false);
    } else {
      // Sukces! Przekierowujemy do aplikacji
      navigate('/app');
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'azure') => {
    setError(null);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider,
      options: {
        redirectTo: `${window.location.origin}/app`, // Gdzie ma wrócić po udanym logowaniu
      }
    });

    if (error) {
      setError(`Błąd logowania przez ${provider}: ${error.message}`);
    }
    // Przy OAuth przekierowanie dzieje się automatycznie, nie musimy wywoływać navigate()
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] opacity-50" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="size-8 bg-white rounded-lg flex items-center justify-center">
            <Sparkles className="size-5 text-black fill-black" />
          </div>
          <span className="text-2xl font-bold text-white">ZEC</span>
        </Link>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Witaj ponownie
          </h1>
          <p className="text-gray-400 mb-8">
            Zaloguj się do swojego konta
          </p>

          {/* Social Login */}
          <div className="space-y-3 mb-6">
            <button
              onClick={() => handleSocialLogin('google')}
              type="button"
              className="w-full py-3 px-4 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
            >
              <svg className="size-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Kontynuuj z Google
            </button>
            
            <button
              onClick={() => handleSocialLogin('azure')}
              type="button"
              className="w-full py-3 px-4 bg-white/10 text-white rounded-lg font-medium hover:bg-white/20 transition-all border border-white/20 flex items-center justify-center gap-2"
            >
              <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z" />
              </svg>
              Kontynuuj z Microsoft
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#0a0a0a] text-gray-400">lub email</span>
            </div>
          </div>

          {/* Komunikat o błędzie */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/50 flex items-center gap-2 text-red-500 text-sm">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-white/30 transition-all disabled:opacity-50"
                  placeholder="twoj@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Hasło
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-white/30 transition-all disabled:opacity-50"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="size-4 rounded border-white/20 bg-white/5 text-white focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-sm text-gray-400">Zapamiętaj mnie</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-gray-400 hover:text-white transition-colors">
                Zapomniałeś hasła?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  Logowanie...
                </>
              ) : (
                <>
                  Zaloguj się
                  <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Sign up link */}
          <p className="mt-6 text-center text-sm text-gray-400">
            Nie masz konta?{' '}
            <Link to="/register" className="text-white hover:underline">
              Zarejestruj się
            </Link>
          </p>
        </div>

        {/* Back to home */}
        <Link
          to="/"
          className="block mt-6 text-center text-sm text-gray-400 hover:text-white transition-colors"
        >
          ← Powrót do strony głównej
        </Link>
      </motion.div>
    </div>
  );
}