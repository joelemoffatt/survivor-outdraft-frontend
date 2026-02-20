import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService, { AuthResponse } from '../services/api';

interface AuthContextType {
  isLoggedIn: boolean;
  user: { username: string; email: string; isAdmin: boolean } | null;
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ username: string; email: string; isAdmin: boolean } | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored token on app launch
  useEffect(() => {
    const checkStoredToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
        const storedUser = await AsyncStorage.getItem(USER_KEY);
        
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
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
        username: response.username,
        email: response.email,
        isAdmin: response.role === 'ADMIN',
      };
      
      // Store token and user data
      await AsyncStorage.setItem(TOKEN_KEY, response.token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
      
      setToken(response.token);
      setUser(userData);
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
        username: response.username,
        email: response.email,
        isAdmin: response.role === 'ADMIN',
      };
      
      // Store token and user data
      await AsyncStorage.setItem(TOKEN_KEY, response.token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
      
      setToken(response.token);
      // Set token in API service for authenticated requests
      apiService.setToken(response.token);
      
      setUser(userData);
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
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
    
    
    // Clear token from API service
    apiService.setToken(null);
    setUser(null);
    setToken(null);
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, token, login, register, logout, isLoading }}>
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
