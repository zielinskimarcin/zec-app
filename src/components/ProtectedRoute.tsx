import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // 1. Sprawdzamy sesję przy pierwszym wejściu
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    // 2. Nasłuchujemy zmian (np. wylogowanie, wygaśnięcie tokena)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Pokazujemy loader, dopóki Supabase nie zwróci statusu sesji
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-white" />
      </div>
    );
  }

  // Jeśli ma sesję -> wpuszczamy do środka (Outlet). Jeśli nie -> wyrzucamy na login.
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}