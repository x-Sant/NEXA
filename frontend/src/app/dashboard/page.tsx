'use client';

import { useMemo, useState } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { useModal } from '@/hooks/useModal';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Role, FinancialType, FinancialStatus, ContractStatus } from '@/types';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';
import { Building2, FolderKanban, MessageSquare, TrendingUp, Users, AlertCircle, Plus, Calendar } from 'lucide-react';
import Link from 'next/link';
import NewProjectModal from '@/components/modals/NewProjectModal';
import NewCollaboratorModal from '@/components/modals/NewCollaboratorModal';
import NewClientModal from '@/components/modals/NewClientModal';
import NewFinancialEntryModal from '@/components/modals/NewFinancialEntryModal';
import { Toast } from '@/components/ui/Toast';
import { StatCard } from '@/components/ui/StatCard';
import { useDashboardStats } from '@/stores/dashboardStore';
import { useProjectStore } from '@/stores/projectStore';
import { useUserStore } from '@/stores/userStore';
import { useTicketStore } from '@/stores/ticketStore';
import { useFinancialStore } from '@/stores/financialStore';

export default function DashboardHome() {
  const { user } = useAuthStore();
  const date = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' }).format(new Date());

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="glass-card p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-l-4 border-l-primary relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="relative z-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
            Bem-vindo(a), <span className="gradient-text-primary">{user.name.split(' ')[0]}</span>!
          </h2>
          <p className="text-text-muted text-sm mt-1 capitalize">{date}</p>
        </div>
      </div>

      {/* Role Based Content */}
      {user.role === Role.NIVEL_3 && <AdminDashboard />}
      {user.role === Role.NIVEL_2 && <ManagerDashboard userId={user.id} />}
      {user.role === Role.NIVEL_1 && <InternDashboard userId={user.id} />}
      {user.role === Role.PROFESSOR && <ProfessorDashboard />}
      {user.role === Role.CLIENTE && <ClientDashboard userId={user.id} />}

      {/* Global KPIs visible to Admin and Level 2 Interns */}
      {(user.role === Role.NIVEL_3 || user.role === Role.NIVEL_2) && (
        <KPISummarySection />
      )}
    </div>
  );
}

// --- NIVEL_3 (Admin) ---
function AdminDashboard() {
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isNewCollaboratorModalOpen, setIsNewCollaboratorModalOpen] = useState(false);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [isNewFinancialModalOpen, setIsNewFinancialModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const stats = useDashboardStats();
  const projects = useProjectStore((s) => s.projects);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    const timer = setTimeout(() => setSuccessMessage(null), 3500);
    return () => clearTimeout(timer);
  };

  const recentProjects = useMemo(() => projects.slice(0, 4), [projects]);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Projetos Ativos" value={stats.activeProjects.toString()} icon={FolderKanban} color="primary" href="/dashboard/projetos" />
        <StatCard title="Colaboradores" value={stats.activeUsers.toString()} icon={Users} color="success" href="/dashboard/pessoas" />
        <StatCard title="Chamados Abertos" value={stats.openTickets.toString()} icon={MessageSquare} color="warning" href="/dashboard/suporte" />
        <StatCard title="Receita Mês" value={formatCurrency(stats.totalRevenue)} icon={TrendingUp} color="primary" href="/dashboard/financeiro" />
      </div>

      {/* Actions & Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Projetos Recentes</h3>
            <Link href="/dashboard/projetos" className="text-sm text-primary hover:underline">Ver todos</Link>
          </div>
          <div className="space-y-3">
            {recentProjects.map(project => (
              <Link
                key={project.id}
                href={`/dashboard/projetos/${project.id}`}
                className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 cursor-pointer hover:scale-[1.01] active:scale-[0.99] duration-200"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getStatusColor(project.status)}`}>
                    <FolderKanban size={20} />
                  </div>
                  <div>
                    <h4 className="font-medium text-text-primary">{project.name}</h4>
                    <p className="text-xs text-text-muted flex items-center gap-1 mt-1">
                      <Calendar size={12} /> Prazo: {formatDate(project.deadline)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`badge rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(project.status)}`}>
                    {getStatusLabel(project.status)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-6">Ações Rápidas</h3>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setIsNewProjectModalOpen(true)}
              className="btn btn-primary w-full justify-start cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus size={18} /> Novo Projeto
            </button>
            <button
              onClick={() => setIsNewCollaboratorModalOpen(true)}
              className="btn btn-secondary w-full justify-start cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Users size={18} /> Cadastrar Colaborador
            </button>
            <button
              onClick={() => setIsNewClientModalOpen(true)}
              className="btn btn-secondary w-full justify-start cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Building2 size={18} /> Cadastrar Cliente
            </button>
            <button
              onClick={() => setIsNewFinancialModalOpen(true)}
              className="btn btn-secondary w-full justify-start cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <TrendingUp size={18} /> Lançar Financeiro
            </button>
          </div>
        </div>
      </div>

      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onSuccess={() => {
          showSuccess("Novo projeto criado com sucesso!");
        }}
      />

      <NewCollaboratorModal
        isOpen={isNewCollaboratorModalOpen}
        onClose={() => setIsNewCollaboratorModalOpen(false)}
        onSuccess={() => {
          showSuccess("Colaborador cadastrado com sucesso!");
        }}
      />

      <NewClientModal
        isOpen={isNewClientModalOpen}
        onClose={() => setIsNewClientModalOpen(false)}
        onSuccess={() => {
          showSuccess("Cliente cadastrado com sucesso!");
        }}
      />

      <NewFinancialEntryModal
        isOpen={isNewFinancialModalOpen}
        onClose={() => setIsNewFinancialModalOpen(false)}
        onSuccess={() => {
          showSuccess("Lançamento financeiro registrado com sucesso!");
        }}
      />

      <Toast message={successMessage} />
    </div>
  );
}

// --- NIVEL_2 (Manager) ---
function ManagerDashboard({ userId }: { userId: string }) {
  const projects = useProjectStore((s) => s.projects);
  const demands = useProjectStore((s) => s.demands);
  const tickets = useTicketStore((s) => s.tickets);

  const myProjects = useMemo(
    () => projects.filter((p) => p.ownerId === userId && p.status === 'ACTIVE'),
    [projects, userId]
  );

  const myProjectIds = useMemo(() => new Set(myProjects.map((p) => p.id)), [myProjects]);

  const pendingDemands = useMemo(
    () => demands.filter((d) => myProjectIds.has(d.projectId) && d.status === 'PENDING').length,
    [demands, myProjectIds]
  );

  const openTickets = useMemo(
    () => tickets.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length,
    [tickets]
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Meus Projetos" value={myProjects.length.toString()} icon={FolderKanban} color="primary" href="/dashboard/projetos" />
        <StatCard title="Demandas Pendentes" value={pendingDemands.toString()} icon={AlertCircle} color="warning" />
        <StatCard title="Chamados Ativos" value={openTickets.toString()} icon={MessageSquare} color="info" />
      </div>
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-4">Meus Projetos</h3>
        {myProjects.length === 0 ? (
          <p className="text-text-muted">Nenhum projeto ativo atribuído.</p>
        ) : (
          <div className="space-y-3">
            {myProjects.map((project) => (
              <Link
                key={project.id}
                href={`/dashboard/projetos/${project.id}`}
                className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 cursor-pointer hover:scale-[1.01] duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${getStatusColor(project.status)}`}>
                    <FolderKanban size={18} />
                  </div>
                  <div>
                    <h4 className="font-medium text-text-primary">{project.name}</h4>
                    <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                      <Calendar size={11} /> Prazo: {formatDate(project.deadline)}
                    </p>
                  </div>
                </div>
                <div className={`badge rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(project.status)}`}>
                  {getStatusLabel(project.status)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- NIVEL_1 (Intern) ---
function InternDashboard({ userId }: { userId: string }) {
  const demands = useProjectStore((s) => s.demands);
  const members = useProjectStore((s) => s.members);

  const myDemands = useMemo(
    () => demands.filter((d) => d.status === 'IN_PROGRESS' || d.status === 'REVIEW'),
    [demands]
  );

  const myMemberships = useMemo(
    () => members.filter((m) => m.userId === userId),
    [members, userId]
  );

  const avgProductivity = useMemo(() => {
    if (myMemberships.length === 0) return 0;
    return Math.round(
      myMemberships.reduce((sum, m) => sum + m.productivity, 0) / myMemberships.length
    );
  }, [myMemberships]);

  const firstDemand = myDemands[0];
  const firstMembership = myMemberships[0];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard title="Demandas em Andamento" value={myDemands.length.toString()} icon={FolderKanban} color="primary" href="/dashboard/projetos" />
        <StatCard title="Produtividade" value={`${avgProductivity}%`} icon={TrendingUp} color="success" />
      </div>
      {firstDemand && (
        <div className="glass-card rounded-2xl p-6 border-l-2 border-l-primary">
          <h3 className="text-lg font-semibold mb-2">Demanda Atual</h3>
          <p className="text-text-primary">{firstDemand.title}</p>
          {firstMembership && (
            <div className="mt-4 flex items-center gap-4">
              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${firstMembership.progress}%` }} />
              </div>
              <span className="text-sm font-bold text-primary">{firstMembership.progress}%</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- PROFESSOR ---
function ProfessorDashboard() {
  const users = useUserStore((s) => s.users);
  const members = useProjectStore((s) => s.members);
  const demands = useProjectStore((s) => s.demands);

  const internUsers = useMemo(
    () => users.filter((u) => u.role === Role.NIVEL_1 || u.role === Role.NIVEL_2),
    [users]
  );

  const internIds = useMemo(() => new Set(internUsers.map((u) => u.id)), [internUsers]);

  const internMemberships = useMemo(
    () => members.filter((m) => internIds.has(m.userId)),
    [members, internIds]
  );

  const avgProductivity = useMemo(() => {
    if (internMemberships.length === 0) return 0;
    return Math.round(
      internMemberships.reduce((sum, m) => sum + m.productivity, 0) / internMemberships.length
    );
  }, [internMemberships]);

  const reviewDemands = useMemo(
    () => demands.filter((d) => d.status === 'REVIEW').length,
    [demands]
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Estagiários" value={internUsers.length.toString()} icon={Users} color="primary" />
        <StatCard title="Produtividade Média" value={`${avgProductivity}%`} icon={TrendingUp} color="success" />
        <StatCard title="Demandas em Revisão" value={reviewDemands.toString()} icon={AlertCircle} color="warning" />
      </div>
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-4">Acompanhamento de Estagiários</h3>
        {internUsers.length === 0 ? (
          <p className="text-text-muted">Nenhum estagiário cadastrado.</p>
        ) : (
          <div className="space-y-2">
            {internUsers.map((intern) => {
              const internMemberRecords = members.filter((m) => m.userId === intern.id);
              const productivity = internMemberRecords.length > 0
                ? Math.round(internMemberRecords.reduce((s, m) => s + m.productivity, 0) / internMemberRecords.length)
                : 0;
              return (
                <div key={intern.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                  <span className="text-sm text-text-primary">{intern.name}</span>
                  <span className="text-sm font-semibold text-primary">{productivity}%</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// --- CLIENTE ---
function ClientDashboard({ userId }: { userId: string }) {
  const projects = useProjectStore((s) => s.projects);
  const pendingContractsModal = useModal();

  const myProjects = useMemo(
    () => projects.filter((p) => p.clientId === userId),
    [projects, userId]
  );

  const pendingContracts = useMemo(() => {
    let count = 0;
    myProjects.forEach(p => {
      if (p.contracts) {
        count += p.contracts.filter(c => c.status === ContractStatus.PENDING).length;
      }
    });
    return count;
  }, [myProjects]);

  const pendingContractsList = useMemo(() => {
    const list: Array<{ contract: any; project: any }> = [];
    myProjects.forEach((project) => {
      if (project.contracts) {
        project.contracts.forEach((contract) => {
          if (contract.status === ContractStatus.PENDING) {
            list.push({ contract, project });
          }
        });
      }
    });
    return list;
  }, [myProjects]);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard title="Meus Projetos" value={myProjects.length.toString()} icon={FolderKanban} color="primary" href="/dashboard/projetos" />
        <StatCard title="Contratos Pendentes" value={pendingContracts.toString()} icon={MessageSquare} color={pendingContracts > 0 ? 'warning' : 'success'} onClick={pendingContractsModal.open} />
      </div>

      <Modal isOpen={pendingContractsModal.isOpen} onClose={pendingContractsModal.close} size="lg">
        <Modal.Header title="Contratos Pendentes de Assinatura" onClose={pendingContractsModal.close} />
        <Modal.Body className="max-h-[60vh] overflow-y-auto custom-scrollbar">
          {pendingContractsList.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-6">Não há nenhum contrato pendente de assinatura.</p>
          ) : (
            <div className="space-y-3">
              {pendingContractsList.map(({ contract, project }) => (
                <div key={contract.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                  <div className="min-w-0 flex-1 mr-4">
                    <h4 className="font-semibold text-white truncate">{contract.title}</h4>
                    <p className="text-xs text-text-muted mt-1 truncate">Projeto: <span className="text-white/60">{project.name}</span></p>
                  </div>
                  <Link
                    href={`/dashboard/projetos/${project.id}?tab=contracts`}
                    className="btn btn-primary btn-sm shrink-0"
                    onClick={pendingContractsModal.close}
                  >
                    Ir para o Projeto
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={pendingContractsModal.close}>
            Fechar
          </Button>
        </Modal.Footer>
      </Modal>
      <div className="glass-card rounded-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Meus Projetos</h3>
        </div>
        {myProjects.length === 0 ? (
          <p className="text-text-muted">Nenhum projeto ativo no momento.</p>
        ) : (
          <div className="space-y-3">
            {myProjects.map((project) => (
              <Link
                key={project.id}
                href={`/dashboard/projetos/${project.id}`}
                className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 cursor-pointer hover:scale-[1.01] duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${getStatusColor(project.status)}`}>
                    <FolderKanban size={18} />
                  </div>
                  <div>
                    <h4 className="font-medium text-text-primary">{project.name}</h4>
                    <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                      <Calendar size={11} /> Prazo: {formatDate(project.deadline)}
                    </p>
                  </div>
                </div>
                <div className={`badge rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(project.status)}`}>
                  {getStatusLabel(project.status)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- KPI Section (Admin + Manager) ---
function KPISummarySection() {
  const projects = useProjectStore((s) => s.projects);
  const tickets = useTicketStore((s) => s.tickets);
  const getTotalRevenue = useFinancialStore((s) => s.getTotalRevenue);
  const getTotalExpenses = useFinancialStore((s) => s.getTotalExpenses);

  const totalProjects = projects.length;
  const activeProjects = useMemo(() => projects.filter((p) => p.status === 'ACTIVE').length, [projects]);
  const completedProjects = useMemo(() => projects.filter((p) => p.status === 'COMPLETED').length, [projects]);
  const pausedProjects = useMemo(() => projects.filter((p) => p.status === 'PAUSED').length, [projects]);

  const totalTickets = tickets.length;
  const openTickets = useMemo(() => tickets.filter((t) => t.status === 'OPEN').length, [tickets]);
  const progressTickets = useMemo(() => tickets.filter((t) => t.status === 'IN_PROGRESS').length, [tickets]);
  const resolvedTickets = useMemo(() => tickets.filter((t) => t.status === 'RESOLVED').length, [tickets]);

  const totalRevenue = getTotalRevenue();
  const totalExpenses = getTotalExpenses();
  const balance = totalRevenue - totalExpenses;

  return (
    <div className="glass-card rounded-2xl p-6 border border-white/10 mt-6 animate-fade-in-up">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="text-primary w-5 h-5" />
        <h3 className="text-lg font-bold text-white">Indicadores de Desempenho (KPIs Globais)</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Projetos KPIs */}
        <div className="bg-white/5 rounded-xl p-5 border border-white/5 hover:border-primary/20 transition-all duration-300">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
            <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <FolderKanban className="text-primary w-4 h-4" />
              Gestão de Projetos
            </h4>
            <span className="text-xs text-text-muted font-bold">Total: {totalProjects}</span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-text-muted">Projetos Ativos</span>
              <span className="font-bold text-primary-light">{activeProjects}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-text-muted">Projetos Concluídos</span>
              <span className="font-bold text-success">{completedProjects}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-text-muted">Projetos Pausados</span>
              <span className="font-bold text-warning">{pausedProjects}</span>
            </div>
          </div>
        </div>

        {/* Chamados KPIs */}
        <div className="bg-white/5 rounded-xl p-5 border border-white/5 hover:border-warning/20 transition-all duration-300">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
            <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <MessageSquare className="text-warning w-4 h-4" />
              Suporte & Chamados
            </h4>
            <span className="text-xs text-text-muted font-bold">Total: {totalTickets}</span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-text-muted">Chamados Abertos</span>
              <span className="font-bold text-warning">{openTickets}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-text-muted">Em Andamento</span>
              <span className="font-bold text-info">{progressTickets}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-text-muted">Chamados Resolvidos</span>
              <span className="font-bold text-success">{resolvedTickets}</span>
            </div>
          </div>
        </div>

        {/* Financeiro KPIs */}
        <div className="bg-white/5 rounded-xl p-5 border border-white/5 hover:border-success/20 transition-all duration-300">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
            <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <TrendingUp className="text-success w-4 h-4" />
              Fluxo Financeiro
            </h4>
            <span className="text-xs text-text-muted font-bold">Saldo</span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-text-muted">Receita Realizada</span>
              <span className="font-bold text-success">{formatCurrency(totalRevenue)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-text-muted">Despesas Pagas</span>
              <span className="font-bold text-danger">{formatCurrency(totalExpenses)}</span>
            </div>
            <div className="flex justify-between items-center text-sm pt-1 border-t border-white/5">
              <span className="text-text-primary font-medium">Saldo Líquido</span>
              <span className={`font-bold ${balance >= 0 ? 'text-success' : 'text-danger'}`}>
                {formatCurrency(balance)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
