import { getSupabaseAdmin } from '../admin';
import { Database } from '../types';

type ProductRow = Database['public']['Tables']['products']['Row'];
type ProductInsert = Database['public']['Tables']['products']['Insert'];
type ProductUpdate = Database['public']['Tables']['products']['Update'];

export interface ProductFilterOptions {
  categorySlug?: string;
  categoryId?: string;
  isVeg?: boolean;
  bestseller?: boolean;
  search?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'default';
  adminMode?: boolean;
  limit?: number;
}

export async function getProducts(filters: ProductFilterOptions = {}): Promise<ProductRow[]> {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from('products')
    .select('*, categories (id, name, slug)');

  if (!filters.adminMode) {
    query = query.eq('is_available', true).eq('in_stock', true);
  }

  if (filters.categoryId) {
    query = query.eq('category_id', filters.categoryId);
  }

  if (filters.isVeg !== undefined) {
    query = query.eq('is_veg', filters.isVeg);
  }

  if (filters.bestseller) {
    query = query.eq('is_bestseller', true);
  }

  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  if (filters.sortBy === 'price_asc') {
    query = query.order('price', { ascending: true });
  } else if (filters.sortBy === 'price_desc') {
    query = query.order('price', { ascending: false });
  } else if (filters.sortBy === 'rating') {
    query = query.order('rating', { ascending: false });
  } else {
    query = query.order('is_bestseller', { ascending: false }).order('created_at', { ascending: false });
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) {
    console.error('[Supabase ProductService] getProducts error:', error.message);
    throw new Error(error.message);
  }

  return (data as any) || [];
}

export async function getProductById(id: string): Promise<ProductRow | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('products')
    .select('*, categories (id, name, slug)')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(error.message);
  }

  return (data as any) || null;
}

export async function getProductBySlug(slug: string): Promise<ProductRow | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('products')
    .select('*, categories (id, name, slug)')
    .eq('slug', slug)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(error.message);
  }

  return (data as any) || null;
}

export async function createProduct(product: ProductInsert): Promise<ProductRow> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('products').insert(product).select().single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateProduct(id: string, updates: ProductUpdate): Promise<ProductRow> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('products').update(updates).eq('id', id).select().single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('products').delete().eq('id', id);

  if (error) {
    throw new Error(error.message);
  }

  return true;
}
