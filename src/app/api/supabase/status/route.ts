import { NextResponse } from 'next/server';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/admin';

export async function GET() {
  const configured = isSupabaseConfigured();

  if (!configured) {
    return NextResponse.json({
      success: true,
      configured: false,
      message: 'Supabase environment variables not configured yet. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local',
      instructions: {
        step1: 'Create a Supabase project at https://supabase.com',
        step2: 'Run the SQL script located in supabase/schema.sql in the Supabase SQL Editor',
        step3: 'Copy your Project URL and service_role key into .env.local',
        step4: 'Run npm run seed:supabase to populate store data',
      },
    });
  }

  try {
    const supabase = getSupabaseAdmin();

    // Check categories count
    const { count: categoriesCount, error: catErr } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true });

    // Check products count
    const { count: productsCount, error: prodErr } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    // Check orders count
    const { count: ordersCount, error: ordErr } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    // Check storage bucket
    const { data: buckets } = await supabase.storage.listBuckets();
    const assetBucketExists = buckets?.some((b) => b.name === 'cloudkitchen-assets');

    return NextResponse.json({
      success: true,
      configured: true,
      connected: !catErr && !prodErr,
      database: {
        categories: categoriesCount ?? 0,
        products: productsCount ?? 0,
        orders: ordersCount ?? 0,
      },
      storage: {
        bucketConfigured: assetBucketExists ?? false,
        bucketName: 'cloudkitchen-assets',
      },
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        configured: true,
        connected: false,
        error: err.message,
      },
      { status: 500 }
    );
  }
}
