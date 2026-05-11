import Stripe from 'stripe';
import { supabaseRpc } from './_supabaseRest.js';

export const config = {
  api: {
    bodyParser: false,
  },
};

const BILLING_TOKEN = process.env.ZEC_BILLING_WEBHOOK_TOKEN;

function unixToIso(value) {
  return typeof value === 'number' ? new Date(value * 1000).toISOString() : null;
}

async function readRawBody(req) {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return Buffer.from(req.body);
  if (req.body && typeof req.body === 'object') return Buffer.from(JSON.stringify(req.body));

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

async function applySubscription(subscription, fallback = {}) {
  const metadata = {
    ...(fallback.metadata || {}),
    ...(subscription.metadata || {}),
  };
  const userId = metadata.user_id || fallback.user_id;
  const planId = metadata.plan_id || fallback.plan_id;
  if (!userId || !planId) return;

  await supabaseRpc('zec_apply_billing_subscription', {
    p_worker_token: BILLING_TOKEN,
    p_user_id: userId,
    p_plan_id: planId,
    p_status: subscription.status || fallback.status || 'active',
    p_billing_period: metadata.billing_period || fallback.billing_period || 'monthly',
    p_current_period_start: unixToIso(subscription.current_period_start),
    p_current_period_end: unixToIso(subscription.current_period_end),
    p_cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
    p_stripe_customer_id: typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id || fallback.customer_id || null,
    p_stripe_subscription_id: subscription.id || fallback.subscription_id || null,
  });
}

async function recordInvoice(stripe, invoice) {
  let subscription = null;
  const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
  if (subscriptionId) {
    subscription = await stripe.subscriptions.retrieve(subscriptionId);
  }

  const metadata = {
    ...(subscription?.metadata || {}),
    ...(invoice.metadata || {}),
  };
  const userId = metadata.user_id;
  const planId = metadata.plan_id;
  if (!userId || !planId) return;

  await supabaseRpc('zec_record_billing_invoice', {
    p_worker_token: BILLING_TOKEN,
    p_user_id: userId,
    p_provider_invoice_id: invoice.id,
    p_plan_id: planId,
    p_status: invoice.status || 'open',
    p_amount_cents: invoice.amount_paid || invoice.amount_due || 0,
    p_currency: invoice.currency || 'usd',
    p_invoice_number: invoice.number || null,
    p_hosted_invoice_url: invoice.hosted_invoice_url || null,
    p_invoice_pdf_url: invoice.invoice_pdf || null,
    p_issued_at: unixToIso(invoice.created),
    p_paid_at: invoice.status === 'paid' ? unixToIso(invoice.status_transitions?.paid_at) : null,
    p_reset_credits: invoice.status === 'paid',
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ received: false, error: 'Method not allowed' });
  }

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeSecret || !webhookSecret || !BILLING_TOKEN) {
    return res.status(501).json({
      received: false,
      error: 'Stripe webhook is not configured.',
    });
  }

  const stripe = new Stripe(stripeSecret);
  let event;

  try {
    const rawBody = await readRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, req.headers['stripe-signature'], webhookSecret);
  } catch (error) {
    console.error(error);
    return res.status(400).json({
      received: false,
      error: error instanceof Error ? error.message : 'Invalid Stripe signature.',
    });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await applySubscription(subscription, {
            metadata: session.metadata || {},
            user_id: session.client_reference_id,
            customer_id: typeof session.customer === 'string' ? session.customer : session.customer?.id,
            subscription_id: subscriptionId,
          });
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await applySubscription(subscription, {
          status: event.type === 'customer.subscription.deleted' ? 'canceled' : subscription.status,
        });
        break;
      }
      case 'invoice.paid':
      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed': {
        await recordInvoice(stripe, event.data.object);
        break;
      }
      default:
        break;
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      received: false,
      error: error instanceof Error ? error.message : 'Stripe webhook handling failed.',
    });
  }
}
