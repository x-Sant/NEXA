'use client';

import { getInitials, getRoleBadgeColor, getRoleLabel, formatDate } from '@/lib/utils';
import { Role, User } from '@/types';
import { Search, Plus, Mail, Calendar, FolderKanban, TrendingUp, Users, X, LayoutGrid, Layers } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import Link from 'next/link';
import { useModal } from '@/hooks/useModal';
import { Toast } from '@/components/ui/Toast';
import { useProjectStore } from '@/stores/projectStore';
import { useUserStore } from '@/stores/userStore';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
} from 'recharts';

// Feature 2 — Team productivity mock data (historical collective metric, not user-level)
const productivityData = [
  { mes: 'Dez', entregas: 18, meta: 20 },
  { mes: 'Jan', entregas: 22, meta: 20 },
  { mes: 'Fev', entregas: 19, meta: 22 },
  { mes: 'Mar', entregas: 25, meta: 22 },
  { mes: 'Abr', entregas: 21, meta: 25 },
  { mes: 'Mai', entregas: 17, meta: 25 },
];

const currentMonth = productivityData[productivityData.length - 1];
const goalPercent = Math.round((currentMonth.entregas / currentMonth.meta) * 100);

const radialData = [
  { name: 'Meta', value: 100, fill: 'rgba(255,255,255,0.05)' },
  { name: 'Progresso', value: goalPercent, fill: 'var(--color-primary)' },
];

function getUserMetrics(
  userId: string,
  members: ReturnType<typeof useProjectStore.getState>['members']
) {
  const userMembers = members.filter((m) => m.userId === userId);
  const projectCount = userMembers.length;
  const avgProductivity =
    userMembers.length > 0
      ? Math.round(
          userMembers.reduce((s, m) => s + m.productivity, 0) / userMembers.length
        )
      : 0;
  return { projectCount, avgProductivity };
}

export default function PessoasPage() {
  const { user: currentUser } = useAuthStore();
  const { users, addUser, isLoading } = useUserStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'colaborador' | 'projeto'>('colaborador');

  const toggleRoleFilter = (role: string) => {
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const addModal = useModal();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    const timer = setTimeout(() => setSuccessMessage(null), 3500);
    return () => clearTimeout(timer);
  };

  const [newCollaborator, setNewCollaborator] = useState({
    name: '',
    email: '',
    role: Role.NIVEL_1,
    cpfCnpj: '',
    password: '',
  });

  // Store selectors
  const members = useProjectStore((s) => s.members);
  const projects = useProjectStore((s) => s.projects);
  const deliveries = useProjectStore((s) => s.deliveries);

  const filteredUsers = useMemo(
    () =>
      users.filter(user => {
        if (currentUser?.role === Role.PROFESSOR) {
          if (user.role !== Role.NIVEL_1 && user.role !== Role.NIVEL_2) return false;
        }
        const matchesSearch =
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = selectedRoles.length === 0 || selectedRoles.includes(user.role);
        return matchesSearch && matchesRole && user.role !== Role.CLIENTE;
      }),
    [users, currentUser, searchTerm, selectedRoles]
  );

  const handleAddCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!newCollaborator.name || !newCollaborator.email || !newCollaborator.role || !newCollaborator.password) return;

    const user: User = {
      id: `u-${Date.now()}`,
      name: newCollaborator.name,
      email: newCollaborator.email,
      role: newCollaborator.role,
      cpfCnpj: newCollaborator.cpfCnpj ? newCollaborator.cpfCnpj.replace(/\D/g, '') : undefined,
      password: newCollaborator.password,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setIsSubmitting(true);
    try {
      await addUser(user);
      addModal.close();
      setNewCollaborator({ name: '', email: '', role: Role.NIVEL_1, cpfCnpj: '', password: '' });
      showSuccess('Colaborador cadastrado com sucesso!');
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao cadastrar colaborador.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Feature 11 — Professor dashboard data
  const internUsers = useMemo(
    () => users.filter(u => u.role === Role.NIVEL_1 || u.role === Role.NIVEL_2),
    [users]
  );

  const internProductivityChart = useMemo(
    () =>
      internUsers.map(u => {
        const { avgProductivity } = getUserMetrics(u.id, members);
        return { name: u.name.split(' ')[0], produtividade: avgProductivity };
      }),
    [internUsers, members]
  );

  const avgInternProductivity = useMemo(() => {
    if (internProductivityChart.length === 0) return 0;
    return Math.round(
      internProductivityChart.reduce((a, u) => a + u.produtividade, 0) /
        internProductivityChart.length
    );
  }, [internProductivityChart]);

  // Pending deliveries from interns (Professor dashboard card)
  const internIds = useMemo(() => new Set(internUsers.map(u => u.id)), [internUsers]);
  const pendingDeliveries = useMemo(
    () => deliveries.filter(d => d.status === 'PENDING' && internIds.has(d.internId)).length,
    [deliveries, internIds]
  );

  // Feature 6 — Group by project
  const projectGroups = useMemo(
    () =>
      projects
        .map(proj => {
          const projectMembers = members.filter(m => m.projectId === proj.id);
          const memberUsers = projectMembers
            .map(m => ({
              ...m,
              user: users.find(u => u.id === m.userId),
            }))
            .filter(m => m.user);
          const avgProgress =
            memberUsers.length > 0
              ? Math.round(memberUsers.reduce((a, m) => a + m.progress, 0) / memberUsers.length)
              : 0;
          return { project: proj, members: memberUsers, avgProgress };
        })
        .filter(g => g.members.length > 0),
    [projects, members, users]
  );

  const showProductivitySection =
    currentUser?.role === Role.NIVEL_1 ||
    currentUser?.role === Role.NIVEL_2 ||
    currentUser?.role === Role.NIVEL_3;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Departamento de Pessoas</h1>
          <p className="text-sm text-text-muted mt-1">Gerencie a equipe e colaboradores da NEXA</p>
        </div>
        {currentUser?.role === Role.NIVEL_3 && (
          <button onClick={() => { setErrorMessage(null); addModal.open(); }} className="btn btn-primary gap-2">
            <Plus size={18} />
            Novo Colaborador
          </button>
        )}
      </div>

      {/* Feature 11 — Professor dashboard */}
      {currentUser?.role === Role.PROFESSOR && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total de Estagiários', value: internUsers.length, color: 'text-primary', bg: 'bg-primary/10' },
              { label: 'Entregas esta semana', value: deliveries.filter(d => d.status === 'VALIDATED').length, color: 'text-success', bg: 'bg-success/10' },
              { label: 'Demandas em atraso', value: pendingDeliveries, color: 'text-danger', bg: 'bg-danger/10' },
              { label: 'Média de Produtividade', value: `${avgInternProductivity}%`, color: 'text-accent', bg: 'bg-accent/10' },
            ].map((card, i) => (
              <div key={i} className="glass-card rounded-xl p-4">
                <p className="text-xs text-text-muted mb-1">{card.label}</p>
                <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
              </div>
            ))}
          </div>

          {/* Comparative bar chart */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-base font-semibold mb-4">Produtividade por Estagiário</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={internProductivityChart} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0c1220', borderColor: '#1e293b', borderRadius: '12px' }}
                    formatter={(value: any) => [`${value}%`, 'Produtividade']}
                  />
                  <Bar dataKey="produtividade" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Feature 2 — Team productivity charts (NIVEL_1, NIVEL_2, NIVEL_3) */}
      {showProductivitySection && currentUser?.role !== Role.PROFESSOR && (
        <div className="glass-card rounded-2xl p-6 bg-white/5">
          <h3 className="text-base font-semibold mb-1">Rentabilidade da Equipe</h3>
          <p className="text-xs text-text-muted mb-5">Dados coletivos — não individuais</p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar chart */}
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Produtividade por Mês</p>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productivityData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="mes" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0c1220', borderColor: '#1e293b', borderRadius: '12px' }}
                      formatter={(value: any, name: any) => [value, name === 'entregas' ? 'Entregas Concluídas' : 'Meta Mínima']}
                    />
                    <Bar dataKey="meta" fill="rgba(255,255,255,0.08)" radius={[4, 4, 0, 0]} name="Meta" />
                    <Bar dataKey="entregas" fill="var(--color-primary)" radius={[4, 4, 0, 0]} name="Entregas" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Radial gauge */}
            <div className="flex flex-col items-center justify-center">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Meta Mensal da Equipe</p>
              <div className="relative h-48 w-full max-w-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    cx="50%"
                    cy="55%"
                    innerRadius="55%"
                    outerRadius="80%"
                    startAngle={180}
                    endAngle={0}
                    data={radialData}
                  >
                    <RadialBar dataKey="value" />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-4">
                  <span className="text-3xl font-bold text-primary">{goalPercent}%</span>
                  <span className="text-xs text-text-muted">{currentMonth.entregas} de {currentMonth.meta} entregas</span>
                </div>
              </div>
              <p className="text-xs text-text-muted mt-2">Mês atual: Maio 2026</p>
            </div>
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div className="glass-card rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-white placeholder-white/30"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto sm:justify-end">
          {/* Feature 6 — View toggle */}
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
            <button
              onClick={() => setViewMode('colaborador')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === 'colaborador' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-text-muted hover:text-white'}`}
            >
              <LayoutGrid size={13} />
              Por Colaborador
            </button>
            <button
              onClick={() => setViewMode('projeto')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === 'projeto' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-text-muted hover:text-white'}`}
            >
              <Layers size={13} />
              Por Projeto
            </button>
          </div>

          {viewMode === 'colaborador' && (
            <>
              <span className="text-xs font-semibold text-text-muted mr-1 flex items-center gap-1">
                <Users size={14} /> Papéis:
              </span>
              {(currentUser?.role === Role.PROFESSOR
                ? ([Role.NIVEL_2, Role.NIVEL_1] as const)
                : ([Role.NIVEL_3, Role.NIVEL_2, Role.NIVEL_1, Role.PROFESSOR] as const)
              ).map(role => {
                const isActive = selectedRoles.includes(role);
                const activeClass = isActive
                  ? 'bg-primary/20 text-primary-light border-primary/30 shadow-glow-primary'
                  : 'bg-white/5 text-text-muted border-white/10 hover:bg-white/10 hover:text-white';
                return (
                  <button
                    key={role}
                    onClick={() => toggleRoleFilter(role)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-medium border transition-all duration-300 ${activeClass}`}
                  >
                    {getRoleLabel(role)}
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* Feature 6 — By Project view */}
      {viewMode === 'projeto' && (
        <div className="space-y-4">
          {projectGroups.map(({ project, members: projectMembers, avgProgress }) => (
            <div key={project.id} className="glass-card rounded-2xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="font-bold text-white text-lg">{project.name}</h3>
                  <p className="text-xs text-text-muted flex items-center gap-1 mt-1">
                    <Calendar size={12} />
                    Prazo: {formatDate(project.deadline)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-text-muted">Progresso médio</p>
                    <p className="text-xl font-bold text-primary">{avgProgress}%</p>
                  </div>
                  <div className="w-16 h-16 relative flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                      <circle
                        cx="18" cy="18" r="15" fill="none"
                        stroke="var(--color-primary)" strokeWidth="3"
                        strokeDasharray={`${(avgProgress / 100) * 94.25} 94.25`}
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {projectMembers.map(m => {
                  if (!m.user) return null;
                  return (
                    <Link key={m.id} href={`/dashboard/pessoas/${m.user.id}`}>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/8 transition-colors cursor-pointer">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${getRoleBadgeColor(m.user.role)}`}>
                          {getInitials(m.user.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{m.user.name}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${m.progress}%` }} />
                            </div>
                            <span className="text-[10px] text-text-muted shrink-0">{m.progress}%</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
          {projectGroups.length === 0 && (
            <div className="text-center py-12 glass-card rounded-2xl">
              <FolderKanban className="mx-auto text-text-muted mb-3" size={32} />
              <h3 className="text-lg font-medium text-text-primary">Nenhum projeto com membros</h3>
            </div>
          )}
        </div>
      )}

      {/* By collaborator view */}
      {viewMode === 'colaborador' && (
        <>
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredUsers.map((user, idx) => {
                const { projectCount, avgProductivity } = getUserMetrics(user.id, members);
                return (
                  <div
                    key={user.id}
                    className={`glass-card rounded-2xl p-5 transition-all duration-300 ease-out group hover:scale-[1.02] hover:-translate-y-1 hover:border-white/20 hover:shadow-2xl hover:shadow-black/50 stagger-${(idx % 8) + 1}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold shadow-sm ${getRoleBadgeColor(user.role)}`}>
                          {getInitials(user.name)}
                        </div>
                        <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-surface ${user.isActive ? 'bg-success' : 'bg-text-muted'}`} />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <h3 className="font-semibold text-text-primary truncate" title={user.name}>{user.name}</h3>
                        <div className="flex items-center gap-1.5 text-xs text-text-muted mt-1 truncate">
                          <Mail size={12} />
                          <span className="truncate">{user.email}</span>
                        </div>
                        <div className="mt-2">
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${getRoleBadgeColor(user.role)}`}>
                            {getRoleLabel(user.role)}
                          </span>
                        </div>
                      </div>
                    </div>
                  <div className="mt-5 grid grid-cols-3 gap-2 border-t border-white/5 pt-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-text-muted mb-1">
                        <FolderKanban size={14} />
                      </div>
                      <p className="text-sm font-semibold text-text-primary">
                        {projectCount}
                      </p>
                      <p className="text-[10px] text-text-muted">Projetos</p>
                    </div>
                    <div className="text-center border-x border-white/5">
                      <div className="flex items-center justify-center gap-1 text-text-muted mb-1">
                        <TrendingUp size={14} />
                      </div>
                      <p className="text-sm font-semibold text-text-primary">
                        {user.role === Role.NIVEL_1 || user.role === Role.NIVEL_2
                          ? avgProductivity > 0 ? `${avgProductivity}%` : 'N/A'
                          : 'N/A'}
                      </p>
                      <p className="text-[10px] text-text-muted">Produtividade</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-text-muted mb-1">
                        <Calendar size={14} />
                      </div>
                      <p className="text-sm font-semibold text-text-primary">
                        {new Date(user.createdAt).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })}
                      </p>
                      <p className="text-[10px] text-text-muted">Desde</p>
                    </div>
                  </div>
                  <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/dashboard/pessoas/${user.id}`} className="w-full block">
                      <button type="button" className="btn btn-secondary btn-sm w-full">Ver Perfil Completo</button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12 glass-card rounded-2xl">
              <Users className="mx-auto text-text-muted mb-3" size={32} />
              <h3 className="text-lg font-medium text-text-primary">Nenhum colaborador encontrado</h3>
              <p className="text-text-muted mt-1">Tente ajustar os filtros de busca.</p>
            </div>
          )}
            </>
          )}
        </>
      )}

      {/* Modal novo colaborador */}
      {addModal.tempIsOpen && (
        <div className={`fixed inset-0 bg-background/90 backdrop-blur-md z-50 flex items-center justify-center p-4 ${addModal.isClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'}`}>
          <div className={`glass-card rounded-xl p-8 w-full max-w-md relative border border-white/10 shadow-2xl ${addModal.isClosing ? 'animate-scale-down' : 'animate-fade-in'}`}>
            <button onClick={addModal.close} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-text-muted hover:text-white hover:bg-white/10 transition-all">
              <X size={18} />
            </button>
            <div className="flex flex-col items-center mb-6 mt-2">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-glow-primary mb-3">
                <Users size={28} className="text-primary animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold text-white text-center">Novo Colaborador</h2>
              <p className="text-sm text-text-muted mt-1 text-center">Cadastre um novo membro na equipe da NEXA</p>
            </div>

            {errorMessage && (
              <div className="mb-6 p-4 rounded-xl bg-danger/10 border border-danger/20 flex items-start gap-3">
                <div className="p-1 rounded-full bg-danger/20 text-danger shrink-0 mt-0.5">
                  <X size={14} />
                </div>
                <p className="text-sm text-danger-light font-medium">{errorMessage}</p>
              </div>
            )}

            <form onSubmit={handleAddCollaborator} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">Nome Completo <span className="text-danger">*</span></label>
                <input type="text" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-white placeholder-white/20" placeholder="Ex: Carlos de Souza" value={newCollaborator.name} onChange={e => setNewCollaborator({ ...newCollaborator, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">E-mail <span className="text-danger">*</span></label>
                <input type="email" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-white placeholder-white/20" placeholder="Ex: carlos.souza@nexa.dev" value={newCollaborator.email} onChange={e => setNewCollaborator({ ...newCollaborator, email: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">Papel / Nível <span className="text-danger">*</span></label>
                <select required className="w-full bg-[#1b1c21] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-white cursor-pointer" value={newCollaborator.role} onChange={e => setNewCollaborator({ ...newCollaborator, role: e.target.value as Role })}>
                  <option value={Role.NIVEL_1}>{getRoleLabel(Role.NIVEL_1)}</option>
                  <option value={Role.NIVEL_2}>{getRoleLabel(Role.NIVEL_2)}</option>
                  <option value={Role.NIVEL_3}>{getRoleLabel(Role.NIVEL_3)}</option>
                  <option value={Role.PROFESSOR}>{getRoleLabel(Role.PROFESSOR)}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">CPF / Documento</label>
                <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-white placeholder-white/20" placeholder="Ex: 000.000.000-00" value={newCollaborator.cpfCnpj} onChange={e => setNewCollaborator({ ...newCollaborator, cpfCnpj: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">Senha Provisória de Acesso <span className="text-danger">*</span></label>
                <input
                  type="text"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-white placeholder-white/20"
                  placeholder="Mínimo 8 caracteres, com letras e números"
                  value={newCollaborator.password}
                  onChange={e => setNewCollaborator({ ...newCollaborator, password: e.target.value })}
                />
                <p className="text-[11px] text-text-muted mt-1.5">O colaborador usará essa senha no primeiro acesso e deverá alterá-la em seguida.</p>
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10 mt-6">
                <button type="button" onClick={addModal.close} className="px-5 py-2.5 rounded-xl text-sm font-medium text-text-muted hover:text-white hover:bg-white/5 transition-all flex-1 sm:flex-initial text-center">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary px-8 py-2.5 text-sm font-semibold rounded-xl shadow-[0_0_15px_rgba(249,115,22,0.3)] flex-1 sm:flex-initial justify-center">
                  {isSubmitting ? 'Cadastrando...' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <Toast message={successMessage} />
    </div>
  );
}
