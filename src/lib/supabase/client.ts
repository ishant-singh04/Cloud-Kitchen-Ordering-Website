import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './types';

let client: SupabaseClient<Database> | null = null;

/**
 * Returns a browser-friendly Supabase client using the anon key.
 * Can safely be invoked in client components or browser contexts.
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  if (client) return client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      'Supabase credentials (NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY) are missing in environment variables.'
    );
  }

  client = createClient<Database>(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder-anon-key', {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  return client;
}

export const supabase = getSupabaseClient();
