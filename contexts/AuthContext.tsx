import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService, { AuthResponse } from '../services/api';

interface AuthContextType {
  isLoggedIn: boolean;
  user: { id: number; username: string; email: string; isAdmin: boolean } | null;
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  isAdminView: boolean;
  setAdminView: (enabled: boolean) => Promise<void>;
  toggleAdminView: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';
const ADMIN_VIEW_KEY = 'admin_view_enabled';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ id: number; username: string; email: string; isAdmin: boolean } | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdminView, setIsAdminView] = useState(false);

  // Check for stored token on app launch
  useEffect(() => {
    const checkStoredToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
        const storedUser = await AsyncStorage.getItem(USER_KEY);
        const storedAdminView = await AsyncStorage.getItem(ADMIN_VIEW_KEY);
        
        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser);

          // Migrate: isAdmin was added after initial release.
          // If the stored user pre-dates it, clear the session so a fresh
          // login writes the correct isAdmin value.
          if (parsedUser.isAdmin === undefined) {
            await AsyncStorage.removeItem(TOKEN_KEY);
            await AsyncStorage.removeItem(USER_KEY);
            await AsyncStorage.removeItem(ADMIN_VIEW_KEY);
            return;
          }

          const canUseAdminView = Boolean(parsedUser?.isAdmin);
          const adminViewEnabled = canUseAdminView && storedAdminView === 'true';

          setToken(storedToken);
          setUser(parsedUser);
          setIsAdminView(adminViewEnabled);
          setIsLoggedIn(true);
          // Set token in API service
          apiService.setToken(storedToken);
        }
      } catch (error) {
        console.error('Error checking stored token:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkStoredToken();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await apiService.login(username, password);
      
      const userData = {
        id: response.id,
        username: response.username,
        email: response.email,
        isAdmin: response.role === 'ADMIN',
      };
      
      // Store token and user data
      await AsyncStorage.setItem(TOKEN_KEY, response.token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
      await AsyncStorage.removeItem(ADMIN_VIEW_KEY);
      
      setToken(response.token);
      setUser(userData);
      setIsAdminView(false);
      setIsLoggedIn(true);
      
      // Set token in API service for authenticated requests
      apiService.setToken(response.token);
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiService.register(username, email, password);
      
      const userData = {
        id: response.id,
        username: response.username,
        email: response.email,
        isAdmin: response.role === 'ADMIN',
      };
      
      // Store token and user data
      await AsyncStorage.setItem(TOKEN_KEY, response.token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
      await AsyncStorage.removeItem(ADMIN_VIEW_KEY);
      
      setToken(response.token);
      // Set token in API service for authenticated requests
      apiService.setToken(response.token);
      
      setUser(userData);
      setIsAdminView(false);
      setIsLoggedIn(true);
      
      return true;
    } catch (error) {
      console.error('Register error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
      await AsyncStorage.removeItem(ADMIN_VIEW_KEY);
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
    
    
    // Clear token from API service
    apiService.setToken(null);
    setUser(null);
    setToken(null);
    setIsLoggedIn(false);
    setIsAdminView(false);
  };

  const setAdminView = async (enabled: boolean) => {
    const canUseAdminView = Boolean(user?.isAdmin);
    const nextValue = canUseAdminView ? enabled : false;
    setIsAdminView(nextValue);

    try {
      if (nextValue) {
        await AsyncStorage.setItem(ADMIN_VIEW_KEY, 'true');
      } else {
        await AsyncStorage.removeItem(ADMIN_VIEW_KEY);
      }
    } catch (error) {
      console.error('Error saving admin view preference:', error);
    }
  };

  const toggleAdminView = async () => {
    await setAdminView(!isAdminView);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, token, login, register, logout, isLoading, isAdminView, setAdminView, toggleAdminView }}>
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
