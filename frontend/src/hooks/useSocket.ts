import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/lib/auth-store';
import { useToast } from '@/hooks/useToast';

let socket: Socket | null = null;

export function useSocket() {
  const { user } = useAuthStore();
  const { showSuccess, showInfo, showError } = useToast();

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
      return;
    }

    if (!socket) {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      // Connect to the socket server
      socket = io(API_URL);

      socket.on('connect', () => {
        console.log('Connected to socket server');
        socket?.emit('join', { userId: user.id });
      });

      socket.on('notification', (payload: any) => {
        const { title, message, type } = payload;
        
        // Show toast notification based on type
        if (type === 'success') {
          showSuccess(message);
        } else if (type === 'error') {
          showError(message);
        } else {
          // Add a title to showInfo if supported, or just concatenate
          showInfo(title ? `${title}: ${message}` : message);
        }
      });

      socket.on('disconnect', () => {
        console.log('Disconnected from socket server');
      });
    }

    return () => {
      // Cleanup? Only if we want to disconnect when the component unmounts
      // Since it's a global hook used in a layout, we might just leave it alive
    };
  }, [user, showSuccess, showInfo, showError]);

  return { socket };
}
