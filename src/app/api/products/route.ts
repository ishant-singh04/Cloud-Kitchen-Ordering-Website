import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Product from '@/models/Product';
import { getAuthUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);

    const categorySlug = searchParams.get('category');
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');
    const isVeg = searchParams.get('veg');
    const sortBy = searchParams.get('sort');
    const bestseller = searchParams.get('bestseller');
    const adminMode = searchParams.get('admin') === 'true';

    const filter: any = {};

    // Customer only sees available & inStock items unless admin requested
    if (!adminMode) {
      filter.isAvailable = true;
      filter.inStock = true;
    }

    if (categoryId) {
      filter.categoryId = categoryId;
    }

    if (isVeg !== null && isVeg !== undefined && isVeg !== '') {
      if (isVeg === 'true') filter.isVeg = true;
      if (isVeg === 'false') filter.isVeg = false;
    }

    if (bestseller === 'true') {
      filter.isBestseller = true;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    let query = Product.find(filter).populate('categoryId', 'name slug');

    // Sorting
    if (sortBy === 'price_asc') {
      query = query.sort({ price: 1 });
    } else if (sortBy === 'price_desc') {
      query = query.sort({ price: -1 });
    } else if (sortBy === 'rating') {
      query = query.sort({ rating: -1 });
    } else {
      // Default: bestsellers first, then newest
      query = query.sort({ isBestseller: -1, createdAt: -1 });
    }

    const products = await query.exec();

    return NextResponse.json({ success: true, count: products.length, products });
  } catch (error: any) {
    console.error('Fetch products error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthUserFromRequest(req);
    if (!auth || auth.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    await connectToDatabase();
    const body = await req.json();

    const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Math.floor(Math.random() * 1000);

    const product = await Product.create({
      ...body,
      slug,
      isAvailable: body.isAvailable ?? true,
      inStock: body.inStock ?? true,
      stockCount: body.stockCount ?? 999,
      rating: body.rating ?? 4.8,
      numReviews: body.numReviews ?? 0,
    });

    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error: any) {
    console.error('Create product error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to create product' }, { status: 500 });
  }
}
