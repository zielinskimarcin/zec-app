export const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

export function getOrigin(req) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return host ? `${proto}://${host}` : 'https://www.zecleads.com';
}

export async function supabaseRest(path, options = {}) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase server configuration.');
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      authorization: options.authorization || `Bearer ${SUPABASE_ANON_KEY}`,
      'content-type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(text || `Supabase request failed: ${path}`);
  }
  return text ? JSON.parse(text) : null;
}

export async function supabaseRpc(name, payload, options = {}) {
  return supabaseRest(`rpc/${name}`, {
    method: 'POST',
    body: JSON.stringify(payload),
    ...options,
  });
}
