import { getSupabaseAdmin } from '../admin';
import { Database } from '../types';

type CategoryRow = Database['public']['Tables']['categories']['Row'];
type CategoryInsert = Database['public']['Tables']['categories']['Insert'];
type CategoryUpdate = Database['public']['Tables']['categories']['Update'];

export async function getCategories(includeInactive = false): Promise<CategoryRow[]> {
  const supabase = getSupabaseAdmin();
  let query = supabase.from('categories').select('*').order('order_index', { ascending: true });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;
  if (error) {
    console.error('[Supabase CategoryService] getCategories error:', error.message);
    throw new Error(error.message);
  }

  return data || [];
}

export async function getCategoryBySlug(slug: string): Promise<CategoryRow | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('categories').select('*').eq('slug', slug).single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(error.message);
  }

  return data || null;
}

export async function createCategory(category: CategoryInsert): Promise<CategoryRow> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('categories').insert(category).select().single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateCategory(id: string, updates: CategoryUpdate): Promise<CategoryRow> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('categories').update(updates).eq('id', id).select().single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function deleteCategory(id: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('categories').delete().eq('id', id);

  if (error) {
    throw new Error(error.message);
  }

  return true;
}
