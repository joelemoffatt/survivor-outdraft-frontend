import React, { createContext, useContext, useState, ReactNode, useEffect, useRef, useCallback } from 'react';
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
const SESSION_STARTED_AT_KEY = 'session_started_at';
const APP_MODE = process.env.EXPO_PUBLIC_APP_MODE ?? 'development';

const parseSessionDurationMs = () => {
  const configuredMinutes = Number(process.env.EXPO_PUBLIC_SESSION_DURATION_MINUTES);
  if (Number.isFinite(configuredMinutes) && configuredMinutes > 0) {
    return configuredMinutes * 60 * 1000;
  }

  return APP_MODE === 'development'
    ? 60 * 60 * 1000 // 1 hour for development
    : 24 * 60 * 60 * 1000; // 24 hours for share or production
};

const SESSION_DURATION_MS = parseSessionDurationMs();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ id: number; username: string; email: string; isAdmin: boolean } | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdminView, setIsAdminView] = useState(false);
  const sessionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSessionTimeout = () => {
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
      sessionTimeoutRef.current = null;
    }
  };

  const scheduleSessionExpiration = (sessionStartedAt: number) => {
    clearSessionTimeout();

    const elapsed = Date.now() - sessionStartedAt;
    const remainingMs = SESSION_DURATION_MS - elapsed;

    if (remainingMs <= 0) {
      return false;
    }

    sessionTimeoutRef.current = setTimeout(() => {
      void logout();
    }, remainingMs);

    return true;
  };

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
      await AsyncStorage.removeItem(ADMIN_VIEW_KEY);
      await AsyncStorage.removeItem(SESSION_STARTED_AT_KEY);
    } catch (error) {
      console.error('Error clearing storage:', error);
    }

    clearSessionTimeout();

    apiService.setToken(null);
    setUser(null);
    setToken(null);
    setIsLoggedIn(false);
    setIsAdminView(false);
  }, []);

  // Check for stored token on app launch
  useEffect(() => {
    const checkStoredToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
        const storedUser = await AsyncStorage.getItem(USER_KEY);
        const storedAdminView = await AsyncStorage.getItem(ADMIN_VIEW_KEY);
        const storedSessionStartedAt = await AsyncStorage.getItem(SESSION_STARTED_AT_KEY);
        
        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser);

          // Migrate: isAdmin was added after initial release.
          // If the stored user pre-dates it, clear the session so a fresh
          // login writes the correct isAdmin value.
          if (parsedUser.isAdmin === undefined) {
            await AsyncStorage.removeItem(TOKEN_KEY);
            await AsyncStorage.removeItem(USER_KEY);
            await AsyncStorage.removeItem(ADMIN_VIEW_KEY);
            await AsyncStorage.removeItem(SESSION_STARTED_AT_KEY);
            return;
          }

          const sessionStartedAt = storedSessionStartedAt ? Number(storedSessionStartedAt) : NaN;
          if (!Number.isFinite(sessionStartedAt) || !scheduleSessionExpiration(sessionStartedAt)) {
            await logout();
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
  }, [logout]);

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
      const sessionStartedAt = Date.now();
      await AsyncStorage.setItem(SESSION_STARTED_AT_KEY, String(sessionStartedAt));
      
      setToken(response.token);
      setUser(userData);
      setIsAdminView(false);
      setIsLoggedIn(true);
      
      // Set token in API service for authenticated requests
      apiService.setToken(response.token);
      scheduleSessionExpiration(sessionStartedAt);
      
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
      const sessionStartedAt = Date.now();
      await AsyncStorage.setItem(SESSION_STARTED_AT_KEY, String(sessionStartedAt));
      
      setToken(response.token);
      // Set token in API service for authenticated requests
      apiService.setToken(response.token);
      scheduleSessionExpiration(sessionStartedAt);
      
      setUser(userData);
      setIsAdminView(false);
      setIsLoggedIn(true);
      
      return true;
    } catch (error) {
      console.error('Register error:', error);
      return false;
    }
  };

  useEffect(() => {
    apiService.setAuthFailureHandler(() => {
      void logout();
    });

    return () => {
      apiService.setAuthFailureHandler(null);
      clearSessionTimeout();
    };
  }, [logout]);

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
