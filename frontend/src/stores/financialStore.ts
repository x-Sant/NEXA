import { create } from 'zustand';
import { apiFetch } from '@/lib/api';
import type { FinancialEntry } from '@/types';
import { FinancialType, FinancialStatus } from '@/types';

interface FinancialState {
  entries: FinancialEntry[];
  addEntry: (entry: FinancialEntry) => Promise<void>;
  updateEntry: (id: string, updates: Partial<FinancialEntry>) => Promise<void>;
  getTotalRevenue: () => number;
  getTotalExpenses: () => number;
  getBalance: () => number;
  getOverdue: () => number;
  isLoading: boolean;
  fetchFinancials: () => Promise<void>;
}

export const useFinancialStore = create<FinancialState>()((set, get) => ({
  entries: [],
  isLoading: false,
  fetchFinancials: async () => {
    set({ isLoading: true });
    try {
      const data = await apiFetch('/financeiro').catch(() => []);
      if (data) {
        set({ entries: data.data || data });
      }
    } catch (error) {
      console.error('Failed to fetch financials', error);
    } finally {
      set({ isLoading: false });
    }
  },
  addEntry: async (entry) => {
    const res = await apiFetch('/financeiro', { method: 'POST', body: JSON.stringify(entry) });
    set((s) => ({ entries: [res || entry, ...s.entries] }));
  },
  updateEntry: async (id, updates) => {
    // Caso backend suporte PATCH /financeiro/:id
    await apiFetch(`/financeiro/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }).catch(() => {});
    set((s) => ({ entries: s.entries.map((e) => (e.id === id ? { ...e, ...updates } : e)) }));
  },
  getTotalRevenue: () => get().entries.filter((e) => e.type === FinancialType.RECEIVABLE && e.status === FinancialStatus.PAID).reduce((sum, e) => sum + e.amount, 0),
  getTotalExpenses: () => get().entries.filter((e) => e.type === FinancialType.PAYABLE && e.status === FinancialStatus.PAID).reduce((sum, e) => sum + e.amount, 0),
  getBalance: () => get().getTotalRevenue() - get().getTotalExpenses(),
  getOverdue: () => get().entries.filter((e) => e.status === FinancialStatus.OVERDUE).reduce((sum, e) => sum + e.amount, 0),
}));
