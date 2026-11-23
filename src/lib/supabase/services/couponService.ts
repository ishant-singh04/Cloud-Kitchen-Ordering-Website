import { getSupabaseAdmin } from '../admin';
import { Database } from '../types';

type CouponRow = Database['public']['Tables']['coupons']['Row'];
type CouponInsert = Database['public']['Tables']['coupons']['Insert'];

export async function getCoupons(includeInactive = false): Promise<CouponRow[]> {
  const supabase = getSupabaseAdmin();
  let query = supabase.from('coupons').select('*').order('created_at', { ascending: false });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

export async function validateCoupon(code: string, subtotal: number): Promise<{
  valid: boolean;
  discount: number;
  message?: string;
  coupon?: CouponRow;
}> {
  const supabase = getSupabaseAdmin();
  const { data: coupon, error } = await supabase
    .from('coupons')
    .select('*')
    .ilike('code', code.trim())
    .eq('is_active', true)
    .maybeSingle();

  if (error || !coupon) {
    return { valid: false, discount: 0, message: 'Invalid or inactive coupon code' };
  }

  if (new Date(coupon.expiry_date) < new Date()) {
    return { valid: false, discount: 0, message: 'This coupon has expired' };
  }

  if (coupon.used_count >= coupon.total_usage_limit) {
    return { valid: false, discount: 0, message: 'Coupon usage limit reached' };
  }

  if (subtotal < coupon.min_order_amount) {
    return {
      valid: false,
      discount: 0,
      message: `Minimum order amount of ₹${coupon.min_order_amount} required to use this coupon`,
    };
  }

  let discount = 0;
  if (coupon.discount_type === 'percentage') {
    discount = (subtotal * coupon.discount_value) / 100;
    if (coupon.max_discount_amount && discount > coupon.max_discount_amount) {
      discount = coupon.max_discount_amount;
    }
  } else {
    discount = Math.min(coupon.discount_value, subtotal);
  }

  return { valid: true, discount: Math.round(discount * 100) / 100, coupon };
}

export async function createCoupon(coupon: CouponInsert): Promise<CouponRow> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('coupons').insert(coupon).select().single();

  if (error) throw new Error(error.message);
  return data;
}

export async function incrementCouponUsage(code: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from('coupons').select('id, used_count').ilike('code', code).maybeSingle();
  if (data) {
    await supabase.from('coupons').update({ used_count: data.used_count + 1 }).eq('id', data.id);
  }
}
