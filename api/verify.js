import nodemailer from 'nodemailer';
import { requireSupabaseUser } from './_auth.js';

const SMTP_TIMEOUT_MS = 8000;
const ALLOWED_PORTS = new Set([465, 587]);

function parseMailboxPayload(body = {}) {
  const email = String(body.email || '').trim();
  const password = String(body.password || '');
  const host = String(body.host || '').trim();
  const port = Number.parseInt(String(body.port || ''), 10);

  if (!email || !password || !host || !ALLOWED_PORTS.has(port)) {
    throw new Error('Uzupełnij poprawny adres, hasło, host SMTP oraz port 465 lub 587.');
  }

  return { email, password, host, port };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const auth = await requireSupabaseUser(req);
    if (!auth.ok) {
      return res.status(auth.status).json({ success: false, error: auth.error });
    }

    const { email, password, host, port } = parseMailboxPayload(req.body);
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      requireTLS: port === 587,
      auth: { user: email, pass: password },
      connectionTimeout: SMTP_TIMEOUT_MS,
      greetingTimeout: SMTP_TIMEOUT_MS,
      socketTimeout: SMTP_TIMEOUT_MS,
    });

    await transporter.verify();
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(400).json({
      success: false,
      error: error instanceof Error
        ? error.message
        : 'Odrzucono połączenie SMTP. Sprawdź hasło, host lub port.',
    });
  }
}
