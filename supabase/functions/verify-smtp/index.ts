import nodemailer from 'npm:nodemailer';
import { createClient } from 'npm:@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Obsługa CORS (wymagane przy wywołaniach z przeglądarki)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { email, name, smtpHost, smtpPort, imapHost, imapPort, password } = body;

    // 1. Weryfikacja SMTP w locie
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: parseInt(smtpPort) === 465, // true dla portu 465, false dla innych (np. 587)
      auth: { user: email, pass: password },
    });

    // To rzuci błędem, jeśli hasło lub dane serwera są niepoprawne
    await transporter.verify();

    // 2. Jeśli dotarliśmy tutaj, dane są OK. Zapisujemy w Supabase.
    // Inicjalizujemy klienta z użyciem tokena użytkownika, aby zadziałało RLS
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) throw new Error('Brak autoryzacji');

    const { data, error: dbError } = await supabaseClient
      .from('email_accounts')
      .insert([{
        user_id: user.id,
        email_address: email,
        sender_name: name || email.split('@')[0],
        smtp_host: smtpHost,
        smtp_port: parseInt(smtpPort),
        smtp_password: password, 
        imap_host: imapHost,
        imap_port: parseInt(imapPort),
        status: 'connected',
      }])
      .select()
      .single();

    if (dbError) throw dbError;

    // Zwracamy zapisany rekord z bazy z powrotem do Reacta
    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    // Wyrzucamy błąd (złapie go nasz frontend)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});