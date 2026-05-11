import Stripe from 'stripe';
import { requireSupabaseUser } from './_auth.js';
import { getOrigin, supabaseRest } from './_supabaseRest.js';

async function getBilling(userId, authHeader) {
  const rows = await supabaseRest(`user_billing?user_id=eq.${encodeURIComponent(userId)}&select=*`, {
    method: 'GET',
    authorization: authHeader,
  });
  return Array.isArray(rows) ? rows[0] : null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const auth = await requireSupabaseUser(req);
  if (!auth.ok) {
    return res.status(auth.status).json({ success: false, error: auth.error });
  }

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) {
    return res.status(501).json({
      success: false,
      error: 'Stripe nie jest jeszcze skonfigurowany.',
    });
  }

  try {
    const billing = await getBilling(auth.user.id, req.headers.authorization);
    if (!billing?.stripe_customer_id) {
      return res.status(409).json({
        success: false,
        error: 'Ten użytkownik nie ma jeszcze klienta Stripe.',
      });
    }

    const stripe = new Stripe(stripeSecret);
    const session = await stripe.billingPortal.sessions.create({
      customer: billing.stripe_customer_id,
      return_url: `${getOrigin(req)}/app/settings`,
    });

    return res.status(200).json({ success: true, url: session.url });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Nie udało się otworzyć panelu płatności.',
    });
  }
}
