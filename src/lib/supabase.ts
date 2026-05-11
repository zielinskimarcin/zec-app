import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// Te dane weźmiesz z Dashboardu Supabase (Project Settings -> API)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Brak kluczy Supabase w pliku .env!");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
