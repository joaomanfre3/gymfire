import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/client';
import { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (username: string, password: string) => Promise<string | null>;
  register: (
    email: string,
    username: string,
    password: string,
    displayName: string,
  ) => Promise<string | null>;
  logout: () => Promise<void>;
  loadSession: () => Promise<void>;
  setUser: (user: User) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  refreshToken: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (username: string, password: string): Promise<string | null> => {
    try {
      const { data } = await api.post('/auth/login', { username, password });

      const accessToken: string = data.access_token;
      const refreshToken: string = data.refresh_token;

      await AsyncStorage.setItem('access_token', accessToken);
      await AsyncStorage.setItem('refresh_token', refreshToken);

      // Fetch user profile
      const { data: user } = await api.get('/auth/me');

      set({
        token: accessToken,
        refreshToken,
        user,
        isAuthenticated: true,
      });

      return null;
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Login failed. Please try again.';
      return message;
    }
  },

  register: async (
    email: string,
    username: string,
    password: string,
    displayName: string,
  ): Promise<string | null> => {
    try {
      await api.post('/auth/register', {
        email,
        username,
        password,
        displayName,
      });
      return null;
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Registration failed. Please try again.';
      return message;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore errors on logout
    } finally {
      await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
      set({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
      });
    }
  },

  loadSession: async () => {
    try {
      const accessToken = await AsyncStorage.getItem('access_token');
      const refreshToken = await AsyncStorage.getItem('refresh_token');

      if (!accessToken) {
        set({ isLoading: false });
        return;
      }

      // Validate the token by fetching user
      const { data: user } = await api.get('/auth/me');

      set({
        token: accessToken,
        refreshToken,
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
      set({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  setUser: (user: User) => {
    set({ user });
  },

  clearAuth: () => {
    set({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },
}));
