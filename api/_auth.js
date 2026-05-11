export async function requireSupabaseUser(req) {
  const authHeader = req.headers.authorization;
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!authHeader?.startsWith('Bearer ')) {
    return { ok: false, status: 401, error: 'Brak autoryzacji.' };
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return { ok: false, status: 500, error: 'Brak konfiguracji Supabase po stronie serwera.' };
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: supabaseAnonKey,
      authorization: authHeader,
    },
  });

  if (!response.ok) {
    return { ok: false, status: 401, error: 'Sesja wygasła. Zaloguj się ponownie.' };
  }

  const user = await response.json();
  return { ok: true, user };
}
