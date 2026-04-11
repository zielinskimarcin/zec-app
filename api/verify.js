export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Vercel uderza bezpiecznie "od tyłu" do Twojego VPS-a
    const response = await fetch('http://187.127.69.58:3000/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    return res.status(response.status).json(data);
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Błąd mostu Vercel -> VPS' });
  }
}