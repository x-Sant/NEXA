import { create } from 'zustand';
import type { User } from '@/types';
import { apiFetch } from '@/lib/api';

interface UserState {
  users: User[];
  isLoading: boolean;
  fetchUsers: () => Promise<void>;
  addUser: (user: User) => Promise<void>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
}

export const useUserStore = create<UserState>()((set, get) => ({
  users: [],
  isLoading: false,
  fetchUsers: async () => {
    set({ isLoading: true });
    try {
      const [colaboradores, clientes] = await Promise.all([
        apiFetch('/colaboradores').catch(() => []),
        apiFetch('/clientes').catch(() => []),
      ]);
      set({
        users: [...(colaboradores?.data || colaboradores || []), ...(clientes?.data || clientes || [])],
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to fetch users:', error);
      set({ isLoading: false });
    }
  },
  addUser: async (user) => {
    const endpoint = user.role === 'CLIENTE' ? '/clientes' : '/colaboradores';
    const res = await apiFetch(endpoint, { method: 'POST', body: JSON.stringify(user) });
    set((s) => ({ users: [res || user, ...s.users] }));
  },
  updateUser: async (id, updates) => {
    const userToUpdate = get().users.find(u => u.id === id);
    if (!userToUpdate) return;
    const endpoint = userToUpdate.role === 'CLIENTE' ? `/clientes/${id}` : `/colaboradores/${id}`;
    await apiFetch(endpoint, { method: 'PATCH', body: JSON.stringify(updates) });
    set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, ...updates } : u)) }));
  },
  deleteUser: async (id) => {
    const userToDelete = get().users.find(u => u.id === id);
    if (!userToDelete) return;
    const endpoint = userToDelete.role === 'CLIENTE' ? `/clientes/${id}` : `/colaboradores/${id}`;
    await apiFetch(endpoint, { method: 'DELETE' });
    set((s) => ({ users: s.users.filter((u) => u.id !== id) }));
  },
}));
