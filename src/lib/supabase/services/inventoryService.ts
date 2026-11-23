import { getSupabaseAdmin } from '../admin';
import { Database } from '../types';

type IngredientRow = Database['public']['Tables']['ingredients']['Row'];
type InventoryTransactionRow = Database['public']['Tables']['inventory_transactions']['Row'];

export async function getIngredients(): Promise<IngredientRow[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('ingredients').select('*').order('name', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function getIngredientById(id: string): Promise<IngredientRow | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('ingredients').select('*').eq('id', id).single();

  if (error && error.code !== 'PGRST116') throw new Error(error.message);
  return data || null;
}

export async function adjustIngredientStock(
  ingredientId: string,
  quantityChange: number,
  changeType: 'deduction' | 'restock' | 'adjustment',
  notes?: string,
  performedBy = 'System',
  orderId?: string
): Promise<{ ingredient: IngredientRow; transaction: InventoryTransactionRow }> {
  const supabase = getSupabaseAdmin();
  const current = await getIngredientById(ingredientId);

  if (!current) {
    throw new Error(`Ingredient with id ${ingredientId} not found`);
  }

  const previousStock = current.current_stock;
  const newStock = Math.max(0, previousStock + quantityChange);

  // 1. Update ingredient stock
  const { data: updatedIngredient, error: updateError } = await supabase
    .from('ingredients')
    .update({ current_stock: newStock })
    .eq('id', ingredientId)
    .select()
    .single();

  if (updateError) throw new Error(updateError.message);

  // 2. Insert audit log in inventory_transactions
  const { data: transaction, error: txnError } = await supabase
    .from('inventory_transactions')
    .insert({
      ingredient_id: ingredientId,
      ingredient_name: current.name,
      change_type: changeType,
      quantity: quantityChange,
      previous_stock: previousStock,
      new_stock: newStock,
      unit: current.unit,
      order_id: orderId || null,
      notes: notes || null,
      performed_by: performedBy,
    })
    .select()
    .single();

  if (txnError) throw new Error(txnError.message);

  return { ingredient: updatedIngredient, transaction };
}

export async function getInventoryTransactions(limit = 100): Promise<InventoryTransactionRow[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('inventory_transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data || [];
}
