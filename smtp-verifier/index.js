const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN || true }));

const apiSecret = process.env.SMTP_VERIFY_SECRET;

app.post('/verify', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (apiSecret && authHeader !== `Bearer ${apiSecret}`) {
    return res.status(401).json({ success: false, error: 'Brak autoryzacji' });
  }

  const { email, password, host, port } = req.body;
  const smtpPort = parseInt(port, 10);

  if (!email || !password || !host || ![465, 587].includes(smtpPort)) {
    return res.status(400).json({ success: false, error: 'Uzupełnij poprawne dane SMTP.' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: smtpPort,
      secure: smtpPort === 465,
      requireTLS: smtpPort === 587,
      auth: { user: email, pass: password },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 8000,
    });

    await transporter.verify();
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(400).json({ success: false, error: 'Odrzucono połączenie SMTP. Sprawdź hasło lub port.' });
  }
});

app.listen(3000, () => console.log('ZEC Verifier działa na porcie 3000'));
