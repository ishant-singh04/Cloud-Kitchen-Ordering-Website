import { getSupabaseAdmin } from '../admin';
import { Database, Json } from '../types';

type UserRow = Database['public']['Tables']['users']['Row'];
type UserInsert = Database['public']['Tables']['users']['Insert'];
type UserUpdate = Database['public']['Tables']['users']['Update'];

export async function getUserById(id: string): Promise<UserRow | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('users').select('*').eq('id', id).maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function getUserByEmail(email: string): Promise<UserRow | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .ilike('email', email.trim())
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function createUser(userData: UserInsert): Promise<UserRow> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('users').insert(userData).select().single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateUser(id: string, updates: UserUpdate): Promise<UserRow> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('users')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getDeliveryStaffList(): Promise<UserRow[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'delivery')
    .eq('active_status', 'active');

  if (error) throw new Error(error.message);
  return data || [];
}
