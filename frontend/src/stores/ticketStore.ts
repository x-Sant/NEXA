import { create } from 'zustand';
import { apiFetch } from '@/lib/api';
import type { Ticket, TicketResponse } from '@/types';
import { TicketStatus } from '@/types';

interface TicketState {
  tickets: Ticket[];
  responses: TicketResponse[];
  addTicket: (ticket: Ticket) => Promise<void>;
  addResponse: (response: TicketResponse) => Promise<void>;
  updateTicketStatus: (ticketId: string, status: TicketStatus) => Promise<void>;
  updateTicket: (ticketId: string, updates: Partial<Ticket>) => Promise<void>;
  isLoading: boolean;
  fetchTickets: () => Promise<void>;
}

export const useTicketStore = create<TicketState>()((set) => ({
  tickets: [],
  responses: [],
  isLoading: false,
  fetchTickets: async () => {
    set({ isLoading: true });
    try {
      const data = await apiFetch('/tickets/dump');
      if (data) {
        set({
          tickets: data.tickets || [],
          responses: data.responses || [],
        });
      }
    } catch (error) {
      console.error('Failed to fetch tickets dump', error);
    } finally {
      set({ isLoading: false });
    }
  },
  addTicket: async (ticket) => {
    const res = await apiFetch('/tickets', { method: 'POST', body: JSON.stringify(ticket) });
    set((s) => ({ tickets: [res || ticket, ...s.tickets] }));
  },
  addResponse: async (response) => {
    const res = await apiFetch(`/tickets/${response.ticketId}/respostas`, { method: 'POST', body: JSON.stringify(response) }).catch(() => null);
    set((s) => ({ responses: [...s.responses, res || response] }));
  },
  updateTicketStatus: async (ticketId, status) => {
    await apiFetch(`/tickets/${ticketId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }).catch(() => null);
    set((s) => ({ tickets: s.tickets.map((t) => t.id === ticketId ? { ...t, status, updatedAt: new Date().toISOString() } : t) }));
  },
  updateTicket: async (ticketId, updates) => {
    await apiFetch(`/tickets/${ticketId}`, { method: 'PATCH', body: JSON.stringify(updates) }).catch(() => null);
    set((s) => ({ tickets: s.tickets.map((t) => t.id === ticketId ? { ...t, ...updates } : t) }));
  },
}));
