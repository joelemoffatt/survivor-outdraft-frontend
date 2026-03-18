import React, { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import apiService from '../services/api';
import { useAuth } from './AuthContext';

interface GroupContextType {
  selectedGroupId: number | null;
  setSelectedGroupId: (id: number | null) => void;
  groupsLoaded: boolean;
  userHasGroups: boolean;
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);

export function GroupProvider({ children }: { children: ReactNode }) {
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [groupsLoaded, setGroupsLoaded] = useState(false);
  const [userHasGroups, setUserHasGroups] = useState(false);
  const { user, token } = useAuth();
  const autoSelectRequestInFlightRef = useRef(false);
  const autoSelectAttemptedUserIdRef = useRef<number | null>(null);

  const updateSelectedGroupId = useCallback((id: number | null) => {
    setSelectedGroupId(id);

    if (!user?.id || id === null) {
      return;
    }

    apiService.markGroupAccessed(id).catch((error) => {
      console.error('Failed to persist selected group:', error);
    });
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setSelectedGroupId(null);
      autoSelectRequestInFlightRef.current = false;
      autoSelectAttemptedUserIdRef.current = null;
      return;
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || !token) {
      return;
    }

    // Only auto-select if no group is currently selected and we haven't already
    // attempted once for this user in the current app session.
    if (
      selectedGroupId !== null ||
      autoSelectRequestInFlightRef.current ||
      autoSelectAttemptedUserIdRef.current === user.id
    ) {
      return;
    }

    let isActive = true;
    autoSelectRequestInFlightRef.current = true;
    autoSelectAttemptedUserIdRef.current = user.id;

    const autoSelectFirstGroup = async () => {
      try {
        const userGroups = await apiService.getUserGroups(user.id);
        if (!isActive) return;

        setGroupsLoaded(true);
        setUserHasGroups(userGroups.length > 0);

        if (userGroups.length > 0) {
          updateSelectedGroupId(userGroups[0].id);
        }
      } catch (error) {
        console.error('Failed to auto-select first group:', error);
      } finally {
        if (isActive) {
          autoSelectRequestInFlightRef.current = false;
        }
      }
    };

    autoSelectFirstGroup();

    return () => {
      isActive = false;
    };
  }, [user?.id, token, selectedGroupId, updateSelectedGroupId]);

  return (
    <GroupContext.Provider
      value={{
        selectedGroupId,
        setSelectedGroupId: updateSelectedGroupId,
        groupsLoaded,
        userHasGroups,
      }}
    >
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
