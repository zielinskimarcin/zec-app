const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Twój lokalny klucz
const API_SECRET = 'ZEC_SECRET_2026';

app.post('/verify', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${API_SECRET}`) {
    return res.status(401).json({ success: false, error: 'Brak autoryzacji' });
  }

  const { email, password, host, port } = req.body;

  try {
    const transporter = nodemailer.createTransport({
      host: host,
      port: parseInt(port),
      secure: parseInt(port) === 465,
      auth: { user: email, pass: password },
      connectionTimeout: 5000 // 5 sekund timeoutu
    });

    await transporter.verify();
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(400).json({ success: false, error: 'Odrzucono połączenie SMTP. Sprawdź hasło lub port.' });
  }
});

app.listen(3000, () => console.log('ZEC Verifier działa na porcie 3000'));