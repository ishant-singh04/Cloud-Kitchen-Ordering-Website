import { getSupabaseAdmin } from '../admin';
import { Database, Json } from '../types';

type OrderRow = Database['public']['Tables']['orders']['Row'];
type OrderInsert = Database['public']['Tables']['orders']['Insert'];
type OrderUpdate = Database['public']['Tables']['orders']['Update'];
type OrderItemInsert = Database['public']['Tables']['order_items']['Insert'];
type OrderItemRow = Database['public']['Tables']['order_items']['Row'];

export type OrderWithItems = OrderRow & { order_items?: OrderItemRow[] };

export interface CreateOrderParams {
  orderData: Omit<OrderInsert, 'id' | 'created_at' | 'updated_at'>;
  items: Array<{
    productId?: string;
    name: string;
    price: number;
    quantity: number;
    isVeg?: boolean;
    image?: string;
    selectedAddOns?: Array<{ name: string; price: number }>;
    specialInstructions?: string;
    itemTotal: number;
  }>;
}

export async function createOrder({ orderData, items }: CreateOrderParams): Promise<OrderRow> {
  const supabase = getSupabaseAdmin();

  // 1. Insert order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert(orderData)
    .select()
    .single();

  if (orderError) {
    console.error('[Supabase OrderService] Order creation error:', orderError.message);
    throw new Error(orderError.message);
  }

  // 2. Insert order items
  if (items && items.length > 0) {
    const orderItems: OrderItemInsert[] = items.map((item) => ({
      order_id: order.id,
      product_id: item.productId || null,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      is_veg: item.isVeg ?? true,
      image: item.image || null,
      selected_add_ons: (item.selectedAddOns as Json) || [],
      special_instructions: item.specialInstructions || null,
      item_total: item.itemTotal,
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
    if (itemsError) {
      console.error('[Supabase OrderService] Order items creation error:', itemsError.message);
    }
  }

  return order;
}

export async function getOrders(filters: { customerId?: string; status?: string; limit?: number } = {}) {
  const supabase = getSupabaseAdmin();
  let query = supabase.from('orders').select('*, order_items (*)').order('created_at', { ascending: false });

  if (filters.customerId) {
    query = query.eq('customer_id', filters.customerId);
  }

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getOrderById(id: string): Promise<OrderWithItems | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items (*)')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') throw new Error(error.message);
  return (data as any) || null;
}

export async function getOrderByNumber(orderNumber: string): Promise<OrderWithItems | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items (*)')
    .eq('order_number', orderNumber)
    .single();

  if (error && error.code !== 'PGRST116') throw new Error(error.message);
  return (data as any) || null;
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: string,
  note?: string,
  updatedBy = 'System'
) {
  const supabase = getSupabaseAdmin();
  const current = await getOrderById(orderId);

  if (!current) throw new Error('Order not found');

  const history = Array.isArray(current.status_history) ? current.status_history : [];
  const updatedHistory = [
    ...history,
    { status: newStatus, timestamp: new Date().toISOString(), note: note || '', updatedBy },
  ];

  const updateFields: OrderUpdate = {
    status: newStatus,
    status_history: updatedHistory as any,
    updated_at: new Date().toISOString(),
  };

  if (newStatus === 'PICKED_UP' || newStatus === 'OUT_FOR_DELIVERY') {
    updateFields.picked_up_at = new Date().toISOString();
  } else if (newStatus === 'DELIVERED') {
    updateFields.delivered_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('orders')
    .update(updateFields)
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function verifyDeliveryOtp(orderId: string, enteredOtp: string, riderId: string) {
  const supabase = getSupabaseAdmin();
  const order = await getOrderById(orderId);

  if (!order) throw new Error('Order not found');
  if (order.delivery_otp !== enteredOtp) {
    return { success: false, error: 'Invalid 4-digit Delivery OTP' };
  }

  // Mark order as DELIVERED
  await updateOrderStatus(orderId, 'DELIVERED', `Verified delivery OTP by rider ${riderId}`, riderId);

  // Mark assignment as DELIVERED
  await supabase
    .from('delivery_assignments')
    .update({
      status: 'DELIVERED',
      otp_verified: true,
      delivered_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('order_id', orderId);

  return { success: true };
}
