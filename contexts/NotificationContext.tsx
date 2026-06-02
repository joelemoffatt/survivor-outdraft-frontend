import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import apiService from '../services/api';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  const refreshUnreadCount = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { unreadCount } = await apiService.getNotificationUnreadCount();
      setUnreadCount(unreadCount);
    } catch {
      // Badge absence is acceptable — fail silently
    }
  }, [user?.id]);

  // Fetch on mount / when user changes
  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  // Re-fetch when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        refreshUnreadCount();
      }
    });
    return () => subscription.remove();
  }, [refreshUnreadCount]);

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
