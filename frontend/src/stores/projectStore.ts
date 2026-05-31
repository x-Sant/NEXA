import { create } from 'zustand';
import { apiFetch } from '@/lib/api';
import { ContractStatus } from '@/types';
import type { Project, ProjectMember, Demand, Delivery } from '@/types';

type DemandItem = any;
type DeliveryItem = any;

interface ProjectState {
  projects: Project[];
  demands: DemandItem[];
  projectFiles: any[];
  tickets: any[];
  members: ProjectMember[];
  deliveries: DeliveryItem[];
  addProject: (project: Project) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addDemand: (demand: DemandItem) => Promise<void>;
  updateDemand: (id: string, updates: Partial<DemandItem>) => Promise<void>;
  addDelivery: (delivery: DeliveryItem) => Promise<void>;
  updateDelivery: (id: string, updates: Partial<DeliveryItem>) => Promise<void>;
  addProjectFiles: (files: any[]) => Promise<void>;
  removeMembersByUserId: (userId: string) => Promise<void>;
  addProjectMember: (projectId: string, userId: string, productivity?: number, progress?: number) => Promise<any>;
  removeProjectMember: (projectId: string, userId: string) => Promise<void>;
  addContract: (projectId: string, contract: any) => Promise<any>;
  signContract: (projectId: string, contractId: string) => Promise<any>;
  isLoading: boolean;
  fetchProjects: () => Promise<void>;
}

export const useProjectStore = create<ProjectState>()((set) => ({
  projects: [],
  demands: [],
  projectFiles: [],
  tickets: [],
  members: [],
  deliveries: [],
  isLoading: false,
  fetchProjects: async () => {
    set({ isLoading: true });
    try {
      const data = await apiFetch('/projetos-dump');
      if (data) {
        set({
          projects: data.projects || [],
          demands: data.demands || [],
          projectFiles: data.projectFiles || [],
          tickets: data.tickets || [],
          members: data.members || [],
          deliveries: data.deliveries || [],
        });
      }
    } catch (error) {
      console.error('Failed to fetch projects dump', error);
    } finally {
      set({ isLoading: false });
    }
  },
  addProject: async (project) => {
    const res = await apiFetch('/projetos', { method: 'POST', body: JSON.stringify(project) });
    set((s) => ({ projects: [res || project, ...s.projects] }));
    return res || project;
  },
  updateProject: async (id, updates) => {
    await apiFetch(`/projetos/${id}`, { method: 'PATCH', body: JSON.stringify(updates) });
    set((s) => ({ projects: s.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)) }));
  },
  deleteProject: async (id) => {
    await apiFetch(`/projetos/${id}`, { method: 'DELETE' });
    set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }));
  },
  addDemand: async (demand) => {
    const res = await apiFetch(`/projetos/${demand.projectId}/demandas`, { method: 'POST', body: JSON.stringify(demand) });
    set((s) => ({ demands: [...s.demands, res || demand] }));
  },
  updateDemand: async (id, updates) => {
    await apiFetch(`/demandas/${id}`, { method: 'PATCH', body: JSON.stringify(updates) });
    set((s) => ({ demands: s.demands.map((d) => (d.id === id ? { ...d, ...updates } : d)) }));
  },
  addDelivery: async (delivery) => {
    const res = await apiFetch(`/projetos/${delivery.projectId}/entregas`, { method: 'POST', body: JSON.stringify(delivery) });
    set((s) => ({ deliveries: [res || delivery, ...s.deliveries] }));
  },
  updateDelivery: async (id, updates) => {
    // If we're updating status to VALIDATED, call the backend
    if (updates.status === 'VALIDATED') {
      const delivery = useProjectStore.getState().deliveries.find(d => d.id === id);
      if (delivery) {
        await apiFetch(`/projetos/${delivery.projectId}/entregas/${id}/validar`, { 
          method: 'PATCH', 
          body: JSON.stringify(updates) 
        });
      }
    }
    set((s) => ({ deliveries: s.deliveries.map((d) => (d.id === id ? { ...d, ...updates } : d)) }));
  },
  addProjectFiles: async (files) => {
    if (files.length === 0) return;
    const projectId = files[0].projectId;
    await apiFetch(`/projetos/${projectId}/arquivos`, { method: 'POST', body: JSON.stringify(files) });
    set((s) => ({ projectFiles: [...s.projectFiles, ...files] }));
  },
  removeMembersByUserId: async (userId) => {
    set((s) => ({ members: s.members.filter((m) => m.userId !== userId) }));
  },
  addProjectMember: async (projectId, userId, productivity = 0, progress = 0) => {
    const res = await apiFetch(`/projetos/${projectId}/membros`, {
      method: 'POST',
      body: JSON.stringify({ userId, productivity, progress }),
    });
    set((s) => {
      const exists = s.members.some(m => m.projectId === projectId && m.userId === userId);
      if (exists) {
        return {
          members: s.members.map(m =>
            m.projectId === projectId && m.userId === userId ? { ...m, ...res } : m
          ),
        };
      }
      return { members: [...s.members, res] };
    });
    return res;
  },
  removeProjectMember: async (projectId, userId) => {
    await apiFetch(`/projetos/${projectId}/membros/${userId}`, {
      method: 'DELETE',
    });
    set((s) => ({
      members: s.members.filter(m => !(m.projectId === projectId && m.userId === userId)),
    }));
  },
  addContract: async (projectId, contract) => {
    const res = await apiFetch(`/projetos/${projectId}/contratos`, {
      method: 'POST',
      body: JSON.stringify(contract),
    });
    set((s) => ({
      projects: s.projects.map((p) => {
        if (p.id === projectId) {
          const projectContracts = p.contracts || [];
          return { ...p, contracts: [...projectContracts, res || contract] };
        }
        return p;
      }),
    }));
    return res || contract;
  },
  signContract: async (projectId, contractId) => {
    const res = await apiFetch(`/projetos/${projectId}/contratos/${contractId}/assinar`, {
      method: 'PATCH',
    });
    set((s) => ({
      projects: s.projects.map((p) => {
        if (p.id === projectId) {
          const projectContracts = p.contracts || [];
          return {
            ...p,
            contracts: projectContracts.map((c) =>
              c.id === contractId ? { ...c, status: ContractStatus.SIGNED } : c
            ),
          };
        }
        return p;
      }),
    }));
    return res;
  },
}));
