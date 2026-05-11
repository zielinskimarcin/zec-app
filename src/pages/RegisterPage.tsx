import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { AlertCircle, ArrowLeft, ArrowRight, Check, CheckCircle2, Loader2, Lock, Mail, User } from 'lucide-react';
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (!fullName || !email || !password) {
      setError('Wypełnij wszystkie pola formularza.');
      setLoading(false);
      return;
    }

    if (!termsAccepted) {
      setError('Musisz zaakceptować warunki korzystania z ZEC.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Hasło musi mieć co najmniej 6 znaków.');
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (error) {
      setError(
        error.message.includes('already registered')
          ? 'Konto z tym adresem email już istnieje.'
          : 'Wystąpił błąd podczas rejestracji. Spróbuj ponownie.'
      );
      setLoading(false);
      return;
    }

    if (data.session) {
      navigate('/app');
      return;
    }

    setSuccessMessage('Konto utworzone. Sprawdź email, aby potwierdzić rejestrację.');
    setLoading(false);
  };

  const handleSocialSignup = async (provider: 'google' | 'azure') => {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/app` },
    });

    if (error) {
      setError(`Błąd logowania: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 text-[#EAE8E1] font-sans">
      <Link
        to="/"
        className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center gap-2 text-sm text-[#827E78] hover:text-[#EAE8E1] transition-colors group"
      >
        <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" />
        Strona główna
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-[420px]"
      >
        <Link to="/" className="flex items-center justify-center gap-2 mb-8 group">
          <div className="w-8 h-8 bg-white/[0.06] border border-white/[0.12] rounded-lg flex items-center justify-center group-hover:bg-white/[0.1] transition-colors">
            <img src="/logo.png" alt="ZEC" className="w-5 h-5 object-contain brightness-0 invert" />
          </div>
          <span className="font-['Outfit'] font-medium text-[22px] lowercase text-[#EAE8E1] tracking-[-0.02em]">
            zec
          </span>
        </Link>

        <div className="bg-white/[0.035] border border-white/[0.08] rounded-2xl p-7 md:p-8">
          <div className="mb-8">
            <h1 className="text-3xl md:text-[34px] font-serif font-normal tracking-tight text-[#EAE8E1] mb-3">
              Załóż konto
            </h1>
            <p className="text-[#A3A09A] text-sm leading-relaxed">
              Zapisz historię leadów, twórz kampanie i kontroluj limity z jednego panelu.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-300 text-sm">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3 text-emerald-200 text-sm">
              <CheckCircle2 className="size-5 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {!successMessage && (
            <>
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#827E78]" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-[#EAE8E1] placeholder:text-[#827E78] focus:outline-none focus:border-white/[0.2] focus:bg-white/[0.06] transition-all disabled:opacity-50"
                    placeholder="Imię i nazwisko"
                  />
                </div>

                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#827E78]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-[#EAE8E1] placeholder:text-[#827E78] focus:outline-none focus:border-white/[0.2] focus:bg-white/[0.06] transition-all disabled:opacity-50"
                    placeholder="Adres email"
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#827E78]" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-[#EAE8E1] placeholder:text-[#827E78] focus:outline-none focus:border-white/[0.2] focus:bg-white/[0.06] transition-all disabled:opacity-50"
                    placeholder="Hasło (min. 6 znaków)"
                  />
                </div>

                <label className="flex items-start gap-2.5 pt-1 cursor-pointer group">
                  <div className="relative flex items-center justify-center size-4 shrink-0 mt-[3px]">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="absolute inset-0 rounded border border-white/[0.15] bg-white/[0.04] peer-checked:bg-[#EAE8E1] peer-checked:border-[#EAE8E1] transition-colors group-hover:border-white/[0.3]" />
                    <Check className="size-3 text-[#1A1A1A] opacity-0 peer-checked:opacity-100 relative z-10 transition-opacity" strokeWidth={3} />
                  </div>
                  <span className="text-xs text-[#A3A09A] leading-relaxed group-hover:text-[#EAE8E1] transition-colors">
                    Akceptuję warunki korzystania z ZEC i zgadzam się na utworzenie konta.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-[#EAE8E1] text-[#0a0a0a] rounded-xl text-sm font-medium hover:bg-white transition-colors flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <>
                      Utwórz konto
                      <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/[0.08]" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                  <span className="px-3 bg-[#101010] text-[#827E78]">lub</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleSocialSignup('google')}
                  type="button"
                  disabled={loading}
                  aria-label="Zarejestruj przez Google"
                  className="py-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl transition-colors flex items-center justify-center gap-2 text-sm text-[#EAE8E1] disabled:opacity-50"
                >
                  <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google
                </button>
                <button
                  onClick={() => handleSocialSignup('azure')}
                  type="button"
                  disabled={loading}
                  aria-label="Zarejestruj przez Microsoft"
                  className="py-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl transition-colors flex items-center justify-center gap-2 text-sm text-[#EAE8E1] disabled:opacity-50"
                >
                  <svg className="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z" />
                  </svg>
                  Microsoft
                </button>
              </div>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-[#827E78]">
          Masz już konto?{' '}
          <Link to="/login" className="text-[#EAE8E1] hover:underline decoration-white/[0.3] underline-offset-4">
            Zaloguj się
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
