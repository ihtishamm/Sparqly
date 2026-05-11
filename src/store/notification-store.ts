import { create } from 'zustand';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;

  // Actions
  addNotification: (
    notification: Omit<Notification, 'id' | 'isRead' | 'createdAt'>
  ) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [
    {
      id: '1',
      title: 'Welcome to Sparqly',
      message: 'Explore the dashboard to see what you can create.',
      type: 'info',
      isRead: false,
      createdAt: new Date().toISOString()
    }
  ],
  unreadCount: 1,

  addNotification: (n) =>
    set((state) => {
      const newNotification: Notification = {
        ...n,
        id: Math.random().toString(36).substring(7),
        isRead: false,
        createdAt: new Date().toISOString()
      };
      return {
        notifications: [newNotification, ...state.notifications],
        unreadCount: state.unreadCount + 1
      };
    }),

  markAsRead: (id) =>
    set((state) => {
      const notifications = state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      );
      return {
        notifications,
        unreadCount: Math.max(0, state.unreadCount - 1)
      };
    }),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0
    })),

  clearAll: () => set({ notifications: [], unreadCount: 0 })
}));
