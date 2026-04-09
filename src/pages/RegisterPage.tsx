import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Sparkles, Mail, Lock, User, ArrowRight, Loader2, AlertCircle, CheckCircle2, ArrowLeft, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function RegisterPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    // Własna walidacja 
    if (!fullName || !email || !password) {
      setError('Wypełnij wszystkie pola formularza.');
      setLoading(false);
      return;
    }

    if (!termsAccepted) {
      setError('Musisz zaakceptować regulamin i politykę prywatności.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Hasło musi mieć co najmniej 6 znaków.');
      setLoading(false);
      return;
    }

    // Strzał do Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    });

    if (error) {
      if (error.message.includes('already registered')) {
        setError('Konto z tym adresem email już istnieje.');
      } else {
        setError('Wystąpił błąd podczas rejestracji. Spróbuj ponownie.');
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
      options: { redirectTo: `${window.location.origin}/app` }
    });

    if (error) setError(`Błąd logowania: ${error.message}`);
  };

  return (
    <div className="min-h-screen bg-[#111111] flex items-center justify-center p-6 text-white font-sans relative overflow-hidden">
      
      {/* Subtelna siatka w tle */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* Przycisk powrotu w lewym górnym rogu */}
      <Link 
        to="/" 
        className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors group z-20"
      >
        <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
        Strona główna
      </Link>

      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md z-10"
      >
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="size-8 bg-white rounded-md flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            <Sparkles className="size-5 text-black fill-black" />
          </div>
          <span className="text-2xl font-bold tracking-tight">ZEC</span>
        </Link>

        {/* Karta */}
        <div className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-2xl p-8 shadow-2xl relative">
          
          <div className="text-center mb-8">
            {/* Poprawiony font na tytule */}
            <h1 
              className="text-4xl font-bold mb-3 tracking-tight" 
              style={{ fontFamily: "'Libre Baskerville', serif" }}
            >
              Załóż konto
            </h1>
            <p className="text-gray-400 text-sm">Zachowaj historię leadów i odblokuj limity.</p>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex flex-col items-center text-green-400 text-sm text-center">
              <CheckCircle2 className="size-6 mb-1" />
              <span>{successMessage}</span>
            </div>
          )}

          {!successMessage && (
            <>
              {/* Formularz Email na górze */}
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={loading}
                      className="w-full pl-10 pr-4 py-2.5 bg-white/[0.02] border border-white/10 rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-white/30 focus:bg-white/5 transition-all disabled:opacity-50"
                      placeholder="Imię i nazwisko"
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
                      className="w-full pl-10 pr-4 py-2.5 bg-white/[0.02] border border-white/10 rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-white/30 focus:bg-white/5 transition-all disabled:opacity-50"
                      placeholder="Adres email"
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
                      className="w-full pl-10 pr-4 py-2.5 bg-white/[0.02] border border-white/10 rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-white/30 focus:bg-white/5 transition-all disabled:opacity-50"
                      placeholder="Hasło (min. 6 znaków)"
                    />
                  </div>
                </div>

                <div className="flex items-start gap-2 pt-1 group">
                  <div className="relative flex items-center justify-center size-4 shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="absolute inset-0 rounded border border-white/20 bg-white/5 peer-checked:bg-white peer-checked:border-white transition-all group-hover:border-white/40 pointer-events-none" />
                    <Check className="size-3 text-black opacity-0 peer-checked:opacity-100 relative z-10 transition-opacity pointer-events-none" strokeWidth={3} />
                  </div>
                  <label htmlFor="terms" className="text-xs text-gray-500 leading-tight cursor-pointer group-hover:text-gray-400 transition-colors">
                    Akceptuję <Link to="/terms" onClick={(e) => e.stopPropagation()} className="text-gray-400 hover:text-white transition-colors underline decoration-white/20 underline-offset-2">regulamin</Link> i <Link to="/privacy" onClick={(e) => e.stopPropagation()} className="text-gray-400 hover:text-white transition-colors underline decoration-white/20 underline-offset-2">politykę prywatności</Link>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 bg-white text-black rounded-lg text-sm font-bold hover:bg-gray-200 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(255,255,255,0.05)]"
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

              {/* Separator */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5" /></div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-widest"><span className="px-3 bg-[#0f0f0f] text-gray-500 font-semibold">lub</span></div>
              </div>

              {/* Minimalistyczne przyciski Social na dole */}
              <div className="grid grid-cols-2 gap-3 mb-2">
                <button
                  onClick={() => handleSocialSignup('google')}
                  type="button"
                  className="py-2.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 rounded-lg transition-all flex items-center justify-center group"
                >
                  <svg className="size-5 opacity-70 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleSocialSignup('azure')}
                  type="button"
                  className="py-2.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 rounded-lg transition-all flex items-center justify-center group"
                >
                  <svg className="size-5 opacity-70 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z" />
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Masz już konto? <Link to="/login" className="text-white hover:underline decoration-white/30 underline-offset-4">Zaloguj się</Link>
        </p>
      </motion.div>
    </div>
  );
}