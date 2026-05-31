import { useProjectStore } from './projectStore';
import { useTicketStore } from './ticketStore';
import { useFinancialStore } from './financialStore';
import { useUserStore } from './userStore';
import { TicketStatus, Role } from '@/types';

export interface DashboardStats {
  activeProjects: number;
  openTickets: number;
  totalRevenue: number;
  totalExpenses: number;
  balance: number;
  overdue: number;
  activeUsers: number;
  totalClients: number;
}

export function useDashboardStats(): DashboardStats {
  const projects = useProjectStore((s) => s.projects);
  const tickets = useTicketStore((s) => s.tickets);
  const getTotalRevenue = useFinancialStore((s) => s.getTotalRevenue);
  const getTotalExpenses = useFinancialStore((s) => s.getTotalExpenses);
  const getBalance = useFinancialStore((s) => s.getBalance);
  const getOverdue = useFinancialStore((s) => s.getOverdue);
  const users = useUserStore((s) => s.users);
  return {
    activeProjects: projects.filter((p) => p.status === 'ACTIVE').length,
    openTickets: tickets.filter((t) => t.status === TicketStatus.OPEN || t.status === TicketStatus.IN_PROGRESS).length,
    totalRevenue: getTotalRevenue(),
    totalExpenses: getTotalExpenses(),
    balance: getBalance(),
    overdue: getOverdue(),
    activeUsers: users.filter((u) => u.isActive && (u.role === Role.NIVEL_1 || u.role === Role.NIVEL_2)).length,
    totalClients: users.filter((u) => u.role === Role.CLIENTE).length,
  };
}
