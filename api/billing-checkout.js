import Stripe from 'stripe';
import { requireSupabaseUser } from './_auth.js';
import { getOrigin, supabaseRest } from './_supabaseRest.js';

const PERIODS = new Set(['monthly', 'yearly']);

function envPriceId(planId, billingPeriod) {
  const key = `STRIPE_PRICE_${planId}_${billingPeriod}`.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
  return process.env[key];
}

async function getPlan(planId, authHeader) {
  const encodedId = encodeURIComponent(planId);
  const rows = await supabaseRest(`billing_plans?id=eq.${encodedId}&active=eq.true&select=*`, {
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
      error: 'Stripe nie jest jeszcze skonfigurowany. Dodaj STRIPE_SECRET_KEY i Price ID planu.',
    });
  }

  try {
    const planId = String(req.body?.planId || '').trim();
    const billingPeriod = PERIODS.has(req.body?.billingPeriod) ? req.body.billingPeriod : 'monthly';
    if (!planId || planId === 'free') {
      return res.status(400).json({ success: false, error: 'Wybierz płatny plan.' });
    }

    const plan = await getPlan(planId, req.headers.authorization);
    if (!plan) {
      return res.status(404).json({ success: false, error: 'Nie znaleziono planu.' });
    }

    const priceId = billingPeriod === 'yearly'
      ? (plan.stripe_price_yearly || envPriceId(planId, 'yearly'))
      : (plan.stripe_price_monthly || envPriceId(planId, 'monthly'));

    if (!priceId) {
      return res.status(501).json({
        success: false,
        error: `Brak Stripe Price ID dla planu ${plan.name}.`,
      });
    }

    const stripe = new Stripe(stripeSecret);
    const origin = getOrigin(req);
    const metadata = {
      user_id: auth.user.id,
      plan_id: plan.id,
      billing_period: billingPeriod,
    };

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: auth.user.email,
      client_reference_id: auth.user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      metadata,
      subscription_data: { metadata },
      success_url: `${origin}/app/settings?billing=success`,
      cancel_url: `${origin}/app/settings?billing=cancelled`,
    });

    return res.status(200).json({ success: true, url: session.url });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Nie udało się utworzyć sesji Stripe.',
    });
  }
}
