import { getSupabaseAdmin } from '../admin';
import { Database } from '../types';

type SettingsRow = Database['public']['Tables']['restaurant_settings']['Row'];
type SettingsUpdate = Database['public']['Tables']['restaurant_settings']['Update'];

export async function getRestaurantSettings(): Promise<SettingsRow | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('restaurant_settings').select('*').limit(1).maybeSingle();

  if (error) {
    console.error('[Supabase RestaurantService] getRestaurantSettings error:', error.message);
    throw new Error(error.message);
  }

  return data;
}

export async function updateRestaurantSettings(updates: SettingsUpdate): Promise<SettingsRow> {
  const supabase = getSupabaseAdmin();
  const current = await getRestaurantSettings();

  if (!current) {
    const { data, error } = await supabase
      .from('restaurant_settings')
      .insert(updates as any)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  const { data, error } = await supabase
    .from('restaurant_settings')
    .update(updates)
    .eq('id', current.id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
