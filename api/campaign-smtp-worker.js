import { randomUUID } from 'node:crypto';
import nodemailer from 'nodemailer';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const WORKER_TOKEN = process.env.ZEC_WORKER_TOKEN;
const SMTP_TIMEOUT_MS = 10000;

function escapeHtml(value = '') {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function htmlFromText(value = '') {
  return escapeHtml(value).replace(/\r?\n/g, '<br>');
}

async function supabaseRpc(name, payload) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase server configuration.');
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(text || `Supabase RPC ${name} failed`);
  }
  return text ? JSON.parse(text) : null;
}

async function sendCampaignEmail(row) {
  if (!row.recipient_email) {
    throw new Error('Lead does not have a recipient email.');
  }

  const transporter = nodemailer.createTransport({
    host: row.smtp_host,
    port: row.smtp_port,
    secure: row.smtp_port === 465,
    requireTLS: row.smtp_port === 587,
    auth: {
      user: row.sender_email,
      pass: row.smtp_password,
    },
    connectionTimeout: SMTP_TIMEOUT_MS,
    greetingTimeout: SMTP_TIMEOUT_MS,
    socketTimeout: SMTP_TIMEOUT_MS,
  });

  const body = String(row.body || '');
  const hasHtml = /<\/?[a-z][\s\S]*>/i.test(body);
  const info = await transporter.sendMail({
    from: {
      name: row.sender_name || row.sender_email,
      address: row.sender_email,
    },
    to: row.recipient_email,
    subject: row.subject || 'Szybkie pytanie',
    text: hasHtml ? body.replace(/<[^>]*>/g, ' ') : body,
    html: hasHtml ? body : htmlFromText(body),
  });

  return info.messageId || null;
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  if (!process.env.CRON_SECRET || req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  if (!WORKER_TOKEN) {
    return res.status(500).json({ success: false, error: 'Missing campaign worker token.' });
  }

  const claimToken = randomUUID();
  const limit = Math.max(1, Math.min(Number(req.query?.limit || 5) || 5, 25));
  const result = {
    success: true,
    claimed: 0,
    sent: 0,
    failed: 0,
    failures: [],
  };

  try {
    const rows = await supabaseRpc('zec_claim_due_campaign_emails', {
      p_limit: limit,
      p_claim_token: claimToken,
      p_worker_token: WORKER_TOKEN,
    });

    const claimedRows = Array.isArray(rows) ? rows : [];
    result.claimed = claimedRows.length;

    for (const row of claimedRows) {
      try {
        const messageId = await sendCampaignEmail(row);
        await supabaseRpc('zec_mark_campaign_email_sent', {
          p_email_id: row.email_id,
          p_claim_token: row.claim_token || claimToken,
          p_smtp_message_id: messageId,
          p_worker_token: WORKER_TOKEN,
        });
        result.sent += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'SMTP send failed';
        await supabaseRpc('zec_mark_campaign_email_failed', {
          p_email_id: row.email_id,
          p_claim_token: row.claim_token || claimToken,
          p_error: message,
          p_worker_token: WORKER_TOKEN,
        });
        result.failed += 1;
        result.failures.push({ email_id: row.email_id, error: message });
      }
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Campaign SMTP worker failed.',
    });
  }
}
