import { create } from 'zustand';
import type { Notification } from '@/types';

interface NotificationState {
  notifications: Notification[];
  markAllRead: () => void;
  markAsRead: (id: string) => void;
  getUnreadCount: (role: string) => number;
}

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  notifications: [],
  markAllRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
  markAsRead: (id) => set((s) => ({ notifications: s.notifications.map((n) => n.id === id ? { ...n, read: true } : n) })),
  getUnreadCount: (role) => get().notifications.filter((n) => !n.read && n.targetRole.includes(role)).length,
}));
