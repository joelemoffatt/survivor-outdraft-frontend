import React, { createContext, useContext, useState, ReactNode } from 'react';

interface GroupContextType {
  selectedGroupId: number | null;
  setSelectedGroupId: (id: number | null) => void;
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);

export function GroupProvider({ children }: { children: ReactNode }) {
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

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
