import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import apiService from '../services/api';
import { useAuth } from './AuthContext';

interface GroupContextType {
  selectedGroupId: number | null;
  setSelectedGroupId: (id: number | null) => void;
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);

export function GroupProvider({ children }: { children: ReactNode }) {
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setSelectedGroupId(null);
      return;
    }

    if (selectedGroupId !== null || !user.id) {
      return;
    }

    let isActive = true;

    const loadGroups = async () => {
      try {
        const userGroups = await apiService.getUserGroups(user.id);
        if (isActive && userGroups.length > 0) {
          setSelectedGroupId(userGroups[0].id);
        }
      } catch (error) {
        console.error('Failed to auto-select group:', error);
      }
    };

    loadGroups();

    return () => {
      isActive = false;
    };
  }, [user, selectedGroupId]);

  return (
    <GroupContext.Provider value={{ selectedGroupId, setSelectedGroupId }}>
      {children}
    </GroupContext.Provider>
  );
}

export function useGroup() {
  const context = useContext(GroupContext);
  if (!context) {
    throw new Error('useGroup must be used within GroupProvider');
  }
  return context;
}
