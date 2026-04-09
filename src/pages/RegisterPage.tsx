import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Sparkles, Mail, Lock, User, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function RegisterPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    });

    if (error) {
      if (error.message.includes('already registered')) {
        setError('Konto z tym adresem email już istnieje.');
      } else if (error.message.includes('Password should be')) {
        setError('Hasło musi mieć co najmniej 6 znaków.');
      } else {
        setError(error.message);
      }
      setLoading(false);
    } else {
      if (data.session) {
        navigate('/app');
      } else {
        setSuccessMessage('Konto utworzone! Sprawdź email, aby potwierdzić rejestrację.');
        setLoading(false);
      }
    }
  };

  const handleSocialSignup = async (provider: 'google' | 'azure') => {
    setError(null);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider,
      options: {
        redirectTo: `${window.location.origin}/app`,
      }
    });

    if (error) {
      setError(`Błąd logowania: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#111111] flex items-center justify-center p-6 text-white font-sans relative overflow-hidden">
      
      {/* Subtelna siatka w tle nawiązująca do Hero */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-2xl z-10"
      >
        <Link to="/" className="flex items-center justify-center gap-2 mb-6">
          <div className="size-8 bg-white rounded-md flex items-center justify-center">
            <Sparkles className="size-5 text-black fill-black" />
          </div>
          <span className="text-xl font-bold tracking-tight">ZECLEADS</span>
        </Link>

        {/* Główne okno */}
        <div className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-2xl p-8 md:p-10 shadow-2xl relative">
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-3 tracking-tight" style={{ fontFamily: "'Libre Baskerville', serif" }}>
              Odblokuj pełną moc poszukiwań
            </h1>
            <p className="text-gray-400 text-sm">
              Załóż darmowe konto, aby zachować historię i odblokować limity.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            
            {/* Lewa kolumna: Social & Info */}
            <div className="flex-1 md:border-r border-white/10 md:pr-8 flex flex-col justify-center">
              <div className="space-y-4 mb-6 md:mb-0">
                <button
                  onClick={() => handleSocialSignup('google')}
                  type="button"
                  className="w-full py-3 px-4 bg-white text-black rounded-lg text-sm font-semibold hover:bg-gray-200 transition-all flex items-center justify-center gap-3 shadow-lg shadow-white/5"
                >
                  <svg className="size-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Szybki start z Google
                </button>
                
                <button
                  onClick={() => handleSocialSignup('azure')}
                  type="button"
                  className="w-full py-3 px-4 bg-white/5 text-white rounded-lg text-sm font-medium hover:bg-white/10 transition-all border border-white/10 flex items-center justify-center gap-3"
                >
                  <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z" />
                  </svg>
                  Zaloguj się z Microsoft
                </button>
              </div>
              
              {/* Opcjonalny mały tekst korzyści z lewej strony */}
              <div className="hidden md:block mt-8 text-xs text-gray-500 leading-relaxed border-t border-white/5 pt-6">
                <p>Dołączając do ZEC, zyskujesz dostęp do najszybszej bazy B2B. Zero ukrytych opłat za konto testowe.</p>
              </div>
            </div>

            {/* Prawa kolumna: Tradycyjny formularz */}
            <div className="flex-1 flex flex-col justify-center">
              <div className="relative mb-6 md:hidden">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
                <div className="relative flex justify-center text-xs uppercase tracking-wider"><span className="px-3 bg-[#0f0f0f] text-gray-500 font-semibold">lub użyj emaila</span></div>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {successMessage && (
                <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex flex-col items-center text-green-400 text-sm text-center">
                  <CheckCircle2 className="size-6 mb-1" />
                  <span>{successMessage}</span>
                </div>
              )}

              {!successMessage && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        disabled={loading}
                        className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all disabled:opacity-50"
                        placeholder="Imię i nazwisko"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all disabled:opacity-50"
                        placeholder="Adres email"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all disabled:opacity-50"
                        placeholder="Hasło (min. 6 znaków)"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <div className="flex items-start gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="terms"
                      className="mt-1 size-3.5 rounded border-white/20 bg-white/5 text-white focus:ring-0 focus:ring-offset-0 cursor-pointer"
                      required
                    />
                    <label htmlFor="terms" className="text-xs text-gray-500 leading-tight cursor-pointer">
                      Akceptuję <Link to="/terms" className="text-gray-300 hover:text-white transition-colors underline decoration-white/30 underline-offset-2">regulamin</Link> i <Link to="/privacy" className="text-gray-300 hover:text-white transition-colors underline decoration-white/30 underline-offset-2">politykę prywatności</Link>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-3 px-4 bg-white/10 border border-white/20 text-white rounded-lg text-sm font-semibold hover:bg-white hover:text-black hover:border-transparent transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <>
                        Utwórz konto
                        <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Masz już konto? <Link to="/login" className="text-white hover:underline decoration-white/50 underline-offset-4">Zaloguj się</Link>
        </p>
      </motion.div>
    </div>
  );
}