'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useSocket(room?: string) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Only in browser
    if (typeof window === 'undefined') return;

    const socketUrl = window.location.origin;
    const socket = io(socketUrl, {
      path: '/socket.io',
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      if (room) {
        socket.emit('join:room', room);
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    return () => {
      if (room) {
        socket.emit('leave:room', room);
      }
      socket.disconnect();
    };
  }, [room]);

  return {
    socket: socketRef.current,
    isConnected,
  };
}
