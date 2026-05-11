import { requireSupabaseUser } from './_auth.js';

const WEBHOOK_URL =
  process.env.N8N_CAMPAIGN_EMAIL_WEBHOOK_URL ||
  process.env.VITE_N8N_CAMPAIGN_EMAIL_WEBHOOK_URL;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const auth = await requireSupabaseUser(req);
    if (!auth.ok) {
      return res.status(auth.status).json({ success: false, error: auth.error });
    }

    if (!WEBHOOK_URL) {
      return res.status(500).json({
        success: false,
        error: 'Brak konfiguracji webhooka generowania kampanii.',
      });
    }

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-ZEC-User-Id': auth.user.id,
      },
      body: JSON.stringify(req.body),
    });

    const text = await response.text();
    res.status(response.status);
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
    return res.send(text);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      error: 'Nie udało się połączyć z generatorem kampanii.',
    });
  }
}
