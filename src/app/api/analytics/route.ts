import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Order from '@/models/Order';
import Product from '@/models/Product';
import User from '@/models/User';
import { getAuthUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthUserFromRequest(req);
    if (!auth || auth.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin required' }, { status: 403 });
    }

    await connectToDatabase();

    // 1. Total Metrics
    const allOrders = await Order.find().lean();
    const totalOrders = allOrders.length;

    // Filter valid paid or non-cancelled orders for revenue
    const nonCancelledOrders = allOrders.filter(
      (o) => o.status !== 'CANCELLED' && o.status !== 'REJECTED'
    );

    const totalRevenue = nonCancelledOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    // Today's metrics
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayOrders = nonCancelledOrders.filter(
      (o) => new Date(o.createdAt) >= startOfToday
    );
    const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    // Order status counts
    const pendingOrders = allOrders.filter((o) => o.status === 'PENDING').length;
    const preparingOrders = allOrders.filter((o) => o.status === 'PREPARING' || o.status === 'CONFIRMED').length;
    const readyOrders = allOrders.filter((o) => o.status === 'READY_FOR_PICKUP' || o.status === 'OUT_FOR_DELIVERY').length;
    const completedOrders = allOrders.filter((o) => o.status === 'DELIVERED').length;
    const cancelledOrders = allOrders.filter((o) => o.status === 'CANCELLED' || o.status === 'REJECTED').length;

    const averageOrderValue =
      nonCancelledOrders.length > 0
        ? Math.round((totalRevenue / nonCancelledOrders.length) * 100) / 100
        : 0;

    // 2. Daily Revenue Trend (Last 7 Days)
    const last7Days: { date: string; revenue: number; orders: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);

      const dayOrders = nonCancelledOrders.filter((o) => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= dayStart && orderDate <= dayEnd;
      });

      const dayRev = dayOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
      last7Days.push({
        date: dayStr,
        revenue: Math.round(dayRev),
        orders: dayOrders.length,
      });
    }

    // 3. Top Selling Food Items
    const itemMap: { [key: string]: { name: string; quantity: number; revenue: number } } = {};
    for (const order of nonCancelledOrders) {
      if (order.items && Array.isArray(order.items)) {
        for (const item of order.items) {
          if (!itemMap[item.name]) {
            itemMap[item.name] = { name: item.name, quantity: 0, revenue: 0 };
          }
          itemMap[item.name].quantity += item.quantity || 1;
          itemMap[item.name].revenue += item.itemTotal || 0;
        }
      }
    }

    const popularDishes = Object.values(itemMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // 4. Counts
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalProducts = await Product.countDocuments();
    const activeDeliveryPersonnel = await User.countDocuments({
      role: 'delivery',
      isAvailable: true,
      activeStatus: 'active',
    });
    const ordersAwaitingAssignment = await Order.countDocuments({
      status: 'READY_FOR_PICKUP',
      $or: [{ deliveryStaffId: { $exists: false } }, { deliveryStaffId: null }],
    });

    return NextResponse.json({
      success: true,
      metrics: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        todayRevenue: Math.round(todayRevenue * 100) / 100,
        totalOrders,
        todayOrdersCount: todayOrders.length,
        pendingOrders,
        preparingOrders,
        readyOrders,
        completedOrders,
        cancelledOrders,
        averageOrderValue,
        totalCustomers,
        totalProducts,
        activeDeliveryPersonnel,
        ordersAwaitingAssignment,
      },
      charts: {
        dailyRevenue: last7Days,
        popularDishes,
      },
    });
  } catch (error: any) {
    console.error('Analytics aggregation error:', error);
    return NextResponse.json({ success: false, error: 'Failed to calculate analytics' }, { status: 500 });
  }
}
