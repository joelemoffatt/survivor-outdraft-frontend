import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextType {
  isLoggedIn: boolean;
  user: { name: string; isAdmin: boolean } | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ name: string; isAdmin: boolean } | null>(null);

  const login = async (username: string, password: string): Promise<boolean> => {
    // TODO: Replace with actual API call to Spring Boot backend
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Demo credentials
    if (username === 'admin' && password === 'admin') {
      setUser({ name: 'Admin User', isAdmin: true });
      setIsLoggedIn(true);
      return true;
    } else if (username === 'player' && password === 'player') {
      setUser({ name: 'Player User', isAdmin: false });
      setIsLoggedIn(true);
      return true;
    }
    
    return false;
  };

  const logout = () => {
    setUser(null);
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
