'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Role, User } from '@/types';
import { API_BASE_URL } from './api';
import { clearAllStores } from './clear-stores';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refresh: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        try {
          const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            return false;
          }

          const data = await response.json();
          set({
            user: data.user,
            token: data.accessToken,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
          });
          document.cookie = `nexa-token=${data.accessToken}; path=/; max-age=900; SameSite=Strict`;
          return true;
        } catch (error) {
          console.error('Falha de rede ao realizar login:', error);
          return false;
        }
      },

      logout: async () => {
        const { refreshToken } = get();
        if (refreshToken) {
          fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          }).catch(() => null);
        }
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
        document.cookie = `nexa-token=; path=/; max-age=0;`;
        clearAllStores();
      },
      
      refresh: async () => {
        const { refreshToken } = get();
        if (!refreshToken) {
          get().logout();
          return false;
        }
        try {
          const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });

          if (!response.ok) {
            get().logout();
            return false;
          }

          const data = await response.json();
          set({
            token: data.accessToken,
          });
          document.cookie = `nexa-token=${data.accessToken}; path=/; max-age=900; SameSite=Strict`;
          return true;
        } catch (error) {
          console.error('Falha de rede ao dar refresh:', error);
          return false;
        }
      }
    }),
    {
      name: 'nexa-auth',
    }
  )
);
