import React, { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import apiService, { GroupMemberResponse, GroupResponse, TeamResponse } from '../services/api';
import { useAuth } from './AuthContext';

export interface GroupData {
  group: GroupResponse | null;
  teams: TeamResponse[];
  members: GroupMemberResponse[];
  myTeam: TeamResponse | null;
  loading: boolean;
  error: string | null;
}

const initialGroupData: GroupData = {
  group: null,
  teams: [],
  members: [],
  myTeam: null,
  loading: false,
  error: null,
};

interface GroupContextType {
  selectedGroupId: number | null;
  setSelectedGroupId: (id: number | null) => void;
  groupsLoaded: boolean;
  userHasGroups: boolean;
  groupData: GroupData;
  refreshGroupData: () => Promise<void>;
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);

export function GroupProvider({ children }: { children: ReactNode }) {
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [groupsLoaded, setGroupsLoaded] = useState(false);
  const [userHasGroups, setUserHasGroups] = useState(false);
  const [groupData, setGroupData] = useState<GroupData>(initialGroupData);
  const { user, token } = useAuth();
  const autoSelectRequestInFlightRef = useRef(false);
  const autoSelectAttemptedUserIdRef = useRef<number | null>(null);

  const fetchGroupData = useCallback(async (groupId: number, userId: number, forceRefresh: boolean) => {
    try {
      const dashboard = await apiService.getGroupDashboard(groupId, { forceRefresh });
      const myTeam = dashboard.teams.find((t) => t.userId === userId) ?? null;
      setGroupData({
        group: dashboard.group,
        teams: dashboard.teams,
        members: dashboard.members,
        myTeam,
        loading: false,
        error: null,
      });
    } catch (err) {
      setGroupData(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load group data',
      }));
    }
  }, []);

  // Fetch group data whenever selected group or user changes
  useEffect(() => {
    if (!selectedGroupId || !user?.id) {
      setGroupData(initialGroupData);
      return;
    }
    setGroupData(prev => ({ ...prev, loading: true, error: null }));
    fetchGroupData(selectedGroupId, user.id, false);
  }, [selectedGroupId, user?.id, fetchGroupData]);

  const refreshGroupData = useCallback(async () => {
    if (!selectedGroupId || !user?.id) return;
    await fetchGroupData(selectedGroupId, user.id, true);
  }, [selectedGroupId, user?.id, fetchGroupData]);

  const updateSelectedGroupId = useCallback((id: number | null) => {
    setSelectedGroupId(id);
    if (!user?.id || id === null) return;
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
    if (!user?.id || !token) return;
    if (
      selectedGroupId !== null ||
      autoSelectRequestInFlightRef.current ||
      autoSelectAttemptedUserIdRef.current === user.id
    ) return;

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
        if (isActive) autoSelectRequestInFlightRef.current = false;
      }
    };

    autoSelectFirstGroup();
    return () => { isActive = false; };
  }, [user?.id, token, selectedGroupId, updateSelectedGroupId]);

  return (
    <GroupContext.Provider value={{
      selectedGroupId,
      setSelectedGroupId: updateSelectedGroupId,
      groupsLoaded,
      userHasGroups,
      groupData,
      refreshGroupData,
    }}>
      {children}
    </GroupContext.Provider>
  );
}

export function useGroup() {
  const context = useContext(GroupContext);
  if (!context) throw new Error('useGroup must be used within GroupProvider');
  return context;
}
