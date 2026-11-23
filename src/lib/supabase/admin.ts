import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './types';

let adminClient: SupabaseClient<Database> | null = null;

/**
 * Server-side Supabase Admin Client.
 * Uses SUPABASE_SERVICE_ROLE_KEY to bypass Row Level Security (RLS) for backend operations,
 * API routes, order processing, and scheduled jobs.
 * Falls back to NEXT_PUBLIC_SUPABASE_ANON_KEY if service key is not configured.
 */
export function getSupabaseAdmin(): SupabaseClient<Database> {
  if (adminClient) return adminClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.warn(
      '[Supabase Admin] Supabase URL or Service Key is missing. Check your .env.local file.'
    );
  }

  adminClient = createClient<Database>(
    supabaseUrl || 'https://placeholder.supabase.co',
    serviceKey || 'placeholder-key',
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  return adminClient;
}

/**
 * Helper to check whether Supabase is configured with valid credentials
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && !url.includes('placeholder') && !key.includes('placeholder'));
}
