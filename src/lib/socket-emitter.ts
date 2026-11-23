/**
 * Real-time event broadcasting helper.
 * When running with custom server.mjs, global.__io is available.
 * If running in standalone environments, it safely logs and falls back.
 */

export interface SocketOrderPayload {
  orderId: string;
  orderNumber: string;
  status: string;
  customerName: string;
  totalAmount: number;
  itemsCount: number;
  updatedAt: string;
  order?: any;
}

export function emitToAll(event: string, data: any) {
  try {
    const io = (global as any).__io;
    if (io) {
      io.emit(event, data);
      console.log(`[Socket.IO Broadcast] Event: ${event}`, { event, data });
    } else {
      console.log(`[Socket.IO Standby] Event: ${event} (io not initialized yet)`);
    }
  } catch (err) {
    console.error(`[Socket.IO Error] Failed to emit ${event}:`, err);
  }
}

export function emitToRoom(room: string, event: string, data: any) {
  try {
    const io = (global as any).__io;
    if (io) {
      io.to(room).emit(event, data);
      console.log(`[Socket.IO Room:${room}] Event: ${event}`);
    } else {
      console.log(`[Socket.IO Standby Room:${room}] Event: ${event}`);
    }
  } catch (err) {
    console.error(`[Socket.IO Error] Failed to emit to room ${room}:`, err);
  }
}

export function broadcastNewOrder(order: any) {
  const payload: SocketOrderPayload = {
    orderId: order._id.toString(),
    orderNumber: order.orderNumber,
    status: order.status,
    customerName: order.customerName,
    totalAmount: order.totalAmount,
    itemsCount: order.items?.length || 0,
    updatedAt: new Date().toISOString(),
    order,
  };

  emitToAll('order:new', payload);
  emitToRoom('admin', 'order:new', payload);
  emitToRoom('kitchen', 'order:new', payload);
}

export function broadcastOrderStatusChange(order: any) {
  const payload: SocketOrderPayload = {
    orderId: order._id.toString(),
    orderNumber: order.orderNumber,
    status: order.status,
    customerName: order.customerName,
    totalAmount: order.totalAmount,
    itemsCount: order.items?.length || 0,
    updatedAt: new Date().toISOString(),
    order,
  };

  emitToAll('order:status_updated', payload);
  emitToRoom(`order:${order._id}`, 'order:status_updated', payload);
  emitToRoom('admin', 'order:status_updated', payload);
  emitToRoom('kitchen', 'order:status_updated', payload);
  emitToRoom('delivery', 'order:status_updated', payload);
}

export function broadcastDeliveryAssigned(assignment: any, order: any) {
  const payload = {
    assignmentId: assignment._id.toString(),
    orderId: order._id.toString(),
    orderNumber: order.orderNumber,
    deliveryStaffId: assignment.deliveryStaffId.toString(),
    deliveryStaffName: assignment.deliveryStaffName,
    deliveryStaffPhone: assignment.deliveryStaffPhone,
    status: assignment.status,
    assignedAt: assignment.assignedAt,
    order,
    assignment,
  };

  emitToAll('delivery:assigned', payload);
  emitToRoom('admin', 'delivery:assigned', payload);
  emitToRoom(`user:${assignment.deliveryStaffId}`, 'delivery:assigned', payload);
  emitToRoom(`order:${order._id}`, 'delivery:assigned', payload);
}

export function broadcastDeliveryStatusChange(assignment: any, order: any) {
  const payload = {
    assignmentId: assignment._id.toString(),
    orderId: order._id.toString(),
    orderNumber: order.orderNumber,
    status: assignment.status,
    orderStatus: order.status,
    deliveryStaffName: assignment.deliveryStaffName,
    updatedAt: new Date().toISOString(),
    order,
    assignment,
  };

  emitToAll('delivery:status_updated', payload);
  emitToRoom(`order:${order._id}`, 'delivery:status_updated', payload);
  emitToRoom('admin', 'delivery:status_updated', payload);
  emitToRoom(`user:${assignment.deliveryStaffId}`, 'delivery:status_updated', payload);
}

export function broadcastDeliveryLocation(orderId: string, location: { lat: number; lng: number }) {
  const payload = {
    orderId,
    location,
    updatedAt: new Date().toISOString(),
  };

  emitToRoom(`order:${orderId}`, 'delivery:location_update', payload);
  emitToRoom('admin', 'delivery:location_update', payload);
}
