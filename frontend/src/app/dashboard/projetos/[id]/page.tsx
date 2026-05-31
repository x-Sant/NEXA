'use client';


import {
  calculateDaysRemaining,
  formatDate,
  getInitials,
  getStatusColor,
  getRoleLabel,
  getStatusLabel,
} from '@/lib/utils';
import { API_BASE_URL, apiFetch } from '@/lib/api';
import { Role, Contract } from '@/types';
import { useAuthStore } from '@/lib/auth-store';
import {
  ArrowLeft,
  Calendar,
  FileText,
  CheckCircle2,
  Clock,
  Users,
  HardDrive,
  Edit3,
  FolderKanban,
  Plus,
  UploadCloud,
  Code2,
  Database,
  Image as ImageIcon,
  GitBranch,
  GitCommit,
  FileArchive,
  ChevronDown,
  Star,
  LayoutList,
  Download,
  Activity,
  BookOpen,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useState, useEffect } from 'react';
import { useModal } from '@/hooks/useModal';
import { useToast } from '@/hooks/useToast';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { NovaDemandaModal } from '@/components/modals/projeto/NovaDemandaModal';
import { NovaEntregaModal } from '@/components/modals/projeto/NovaEntregaModal';
import { EditarProjetoModal } from '@/components/modals/projeto/EditarProjetoModal';
import { AssinarContratoModal } from '@/components/modals/projeto/AssinarContratoModal';
import { AdicionarMembroModal } from '@/components/modals/projeto/AdicionarMembroModal';
import { useProjectStore } from '@/stores/projectStore';
import { useUserStore } from '@/stores/userStore';

// ---- Subfolder icon/label helpers ----
type SubfolderKey = 'front' | 'back' | 'bd' | 'imgs' | 'git' | 'commits' | 'zip' | 'referencias';

const subfolderConfig: Record<
  SubfolderKey,
  { label: string; icon: React.ElementType; isZip?: boolean }
> = {
  front: { label: 'Frontend', icon: Code2 },
  back: { label: 'Backend', icon: Code2 },
  bd: { label: 'Banco de Dados', icon: Database },
  imgs: { label: 'Imagens', icon: ImageIcon },
  git: { label: 'Git Patches', icon: GitBranch },
  commits: { label: 'Commits', icon: GitCommit },
  zip: { label: 'Pacotes ZIP', icon: FileArchive, isZip: true },
  referencias: { label: 'Referências', icon: BookOpen },
};

// ---- Relative time helper ----
function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `há ${mins} minuto${mins !== 1 ? 's' : ''}`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours} hora${hours !== 1 ? 's' : ''}`;
  const days = Math.floor(hours / 24);
  return `há ${days} dia${days !== 1 ? 's' : ''}`;
}

// ---- CSV export helper ----
function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const lines = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuthStore();
  const projects = useProjectStore((s) => s.projects);
  const demands = useProjectStore((s) => s.demands);
  const deliveries = useProjectStore((s) => s.deliveries);
  const projectMembers = useProjectStore((s) => s.members);
  const projectFilesData = useProjectStore((s) => s.projectFiles);
  const signContract = useProjectStore((s) => s.signContract);
  const users = useUserStore((s) => s.users);

  const project = projects.find(p => p.id === id);
  const client = users.find(u => u.id === project?.clientId);

  // ---- ALL HOOKS ----
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const tabParam = searchParams.get('tab');
      const allowedTabs = user?.role === Role.CLIENTE
        ? ['overview', 'deliveries', 'timeline', 'contracts']
        : ['overview', 'demands', 'deliveries', 'timeline', 'team', 'files', 'contracts'];
      if (tabParam && allowedTabs.includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, [user]);

  const demandModal = useModal();
  const deliveryModal = useModal();
  const editProjectModal = useModal();
  const signContractModal = useModal();
  const adicionarMembroModal = useModal();
  const [refreshKey, setRefreshKey] = useState(0);
  const { showSuccess, ToastComponent } = useToast();
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);
  const [deletingMemberName, setDeletingMemberName] = useState<string | null>(null);
  const [isRemovingMember, setIsRemovingMember] = useState(false);

  // Feature 1 — Files accordion
  const [expandedDemandId, setExpandedDemandId] = useState<string | null>(null);

  // Feature 5 — Contract signing
  const [signingContract, setSigningContract] = useState<Contract | null>(null);

  // P-04 — Contract viewing
  const [viewingContract, setViewingContract] = useState<Contract | null>(null);
  const [viewingAgreed, setViewingAgreed] = useState(false);

  useEffect(() => {
    setViewingAgreed(false);
  }, [viewingContract]);

  // Feature 8 — Delivery rating
  const [ratingDeliveryId, setRatingDeliveryId] = useState<string | null>(null);
  const [ratingStars, setRatingStars] = useState(0);
  const [ratingComment, setRatingComment] = useState('');

  useEffect(() => {
    if (!project && id) {
      router.push('/dashboard/projetos');
    }
  }, [project, id, router]);

  // ---- HANDLERS ----
  const handleValidateDelivery = (deliveryId: string) => {
    setRatingDeliveryId(deliveryId);
    setRatingStars(0);
    setRatingComment('');
  };

  const handleConfirmValidation = async () => {
    if (!ratingDeliveryId) return;
    try {
      await useProjectStore.getState().updateDelivery(ratingDeliveryId, {
        status: 'VALIDATED',
        rating: ratingStars || undefined,
        ratingComment: ratingComment.trim() || undefined
      });
      setRefreshKey(prev => prev + 1);
      showSuccess('Entrega validada com sucesso!');
    } catch (e) {
      showSuccess('Erro ao validar entrega.'); // Use showError instead if it exists, otherwise showSuccess as hack
    }
    setRatingDeliveryId(null);
  };

  const handleRemoveMember = (userId: string, userName: string) => {
    setDeletingMemberId(userId);
    setDeletingMemberName(userName);
  };

  const handleConfirmRemoveMember = async () => {
    if (!project || !deletingMemberId) return;
    setIsRemovingMember(true);
    try {
      await useProjectStore.getState().removeProjectMember(project.id, deletingMemberId);
      setRefreshKey((prev) => prev + 1);
      showSuccess(`${deletingMemberName} removido com sucesso da equipe!`);
    } catch (err: any) {
      showSuccess('Erro ao remover membro da equipe: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setIsRemovingMember(false);
      setDeletingMemberId(null);
      setDeletingMemberName(null);
    }
  };

  const handleOpenSignContract = (contractId: string) => {
    if (!project) return;
    const contract = project.contracts?.find(c => c.id === contractId);
    if (contract) {
      setSigningContract(contract);
      signContractModal.open();
    }
  };

  const handleContractSigned = async (contractId: string) => {
    if (!project) return;
    await signContract(project.id, contractId);
    setRefreshKey(prev => prev + 1);
  };

  const handleContractSignModalClose = () => {
    signContractModal.close();
    setSigningContract(null);
  };

  const handleExportDemands = () => {
    if (!project) return;
    const projectDemands = demands.filter(d => d.projectId === project.id);
    downloadCSV(
      `demandas-${project.name.replace(/\\s+/g, '-')}.csv`,
      ['Título', 'Status', 'Prazo', 'Descrição'],
      projectDemands.map(d => [d.title, getStatusLabel(d.status), formatDate(d.deadline), d.description || ''])
    );
  };

  // ---- EARLY RETURNS ----
  if (user?.role === Role.PROFESSOR) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center glass-card rounded-2xl p-8">
        <FolderKanban className="text-text-muted mb-4" size={48} />
        <h2 className="text-xl font-bold text-white mb-2">Acesso Negado</h2>
        <p className="text-sm text-text-muted">Professores não possuem permissão para acessar o painel de projetos.</p>
      </div>
    );
  }

  const hasAccess = (() => {
    if (!project) return false;
    if (user?.role === Role.NIVEL_3 || user?.role === Role.NIVEL_2) return true;
    if (user?.role === Role.CLIENTE) return project.clientId === user.id;
    if (user?.role === Role.NIVEL_1) {
      const pMembers = projectMembers.filter(m => m.projectId === project.id);
      return project.ownerId === user.id || pMembers.some(m => m.userId === user.id);
    }
    return false;
  })();

  if (project && !hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center glass-card rounded-2xl p-8">
        <FolderKanban className="text-text-muted mb-4" size={48} />
        <h2 className="text-xl font-bold text-white mb-2">Acesso Negado</h2>
        <p className="text-sm text-text-muted">Você não possui permissão para acessar este projeto.</p>
      </div>
    );
  }

  if (!project) return null;

  const daysRemaining = calculateDaysRemaining(project.deadline);
  const isLate = daysRemaining < 0;

  const members = project.members || projectMembers.filter(m => m.projectId === project.id);
  const progress = members.length > 0
    ? Math.round(members.reduce((acc, m) => acc + m.progress, 0) / members.length)
    : 0;

  const projectDemands = demands.filter(d => d.projectId === project.id);
  const projectActivities: any[] = []; // mockProjectActivities removed

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: FolderKanban },
    ...(user?.role !== Role.CLIENTE ? [{ id: 'demands', label: 'Demandas', icon: CheckCircle2 }] : []),
    { id: 'deliveries', label: 'Entregas', icon: UploadCloud },
    { id: 'timeline', label: 'Timeline', icon: LayoutList },
    ...(user?.role !== Role.CLIENTE ? [{ id: 'team', label: 'Equipe', icon: Users }] : []),
    ...(user?.role !== Role.CLIENTE ? [{ id: 'files', label: 'Arquivos', icon: HardDrive }] : []),
    { id: 'contracts', label: 'Contratos', icon: FileText },
  ];

  // ---- RENDER ----
  return (
    <div className="space-y-6 animate-fade-in pb-12" key={refreshKey}>
      {/* Back & Actions */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard/projetos" className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors">
          <ArrowLeft size={16} />
          <span className="text-sm font-medium">Voltar aos Projetos</span>
        </Link>
        {(user?.role === Role.NIVEL_3 || user?.role === Role.NIVEL_2) && (
          <button onClick={editProjectModal.open} className="btn btn-secondary btn-sm gap-2 cursor-pointer">
            <Edit3 size={14} />
            Editar Projeto
          </button>
        )}
      </div>

      {/* Header Card */}
      <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="relative z-10 flex flex-col lg:flex-row gap-6 justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className={`badge ${getStatusColor(project.status)} text-sm px-3 py-1 rounded-full`}>
                {getStatusLabel(project.status)}
              </div>
              <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md ${isLate ? 'bg-danger/20 text-danger' : 'bg-success/20 text-success'}`}>
                <Clock size={12} />
                {isLate ? `${Math.abs(daysRemaining)} dias atrasado` : `${daysRemaining} dias restantes`}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">{project.name}</h1>
            <p className="text-text-muted max-w-3xl">{project.description}</p>
            <div className="flex flex-wrap gap-6 mt-6">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-surface-active flex items-center justify-center border border-white/10">
                  <Calendar size={18} className="text-text-muted" />
                </div>
                <div>
                  <p className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Prazo Final</p>
                  <p className="text-sm font-semibold">{formatDate(project.deadline)}</p>
                </div>
              </div>
              {client && (
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-surface-active flex items-center justify-center border border-white/10">
                    <span className="text-xs font-bold text-text-muted">{getInitials(client.name)}</span>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Cliente</p>
                    <p className="text-sm font-semibold">{client.name}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="w-full lg:w-64 bg-surface/50 rounded-xl p-5 border border-white/5">
            <h4 className="text-sm font-semibold mb-4 text-center">Progresso Geral</h4>
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold gradient-text-primary shrink-0">{progress}%</div>
              <div className="flex-1 space-y-2">
                <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${progress === 100 ? 'bg-success' : 'bg-primary'}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-text-muted text-right">{members.length} membros na equipe</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar border-b border-white/5 pb-px">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${isActive
                  ? 'border-primary text-primary bg-primary/5 rounded-t-lg'
                  : 'border-transparent text-text-muted hover:text-text-primary hover:bg-white/5 rounded-t-lg'
                }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {/* ---- OVERVIEW ---- */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            <div className={user?.role === Role.CLIENTE ? "w-full" : "grid grid-cols-1 md:grid-cols-2 gap-6"}>
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">Membros da Equipe</h3>
                <div className="space-y-4">
                  {members.map(member => {
                    const mUser = users.find(u => u.id === member.userId);
                    if (!mUser) return null;
                    return (
                      <div key={member.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-surface-active flex items-center justify-center font-bold text-sm">
                            {getInitials(mUser.name)}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{mUser.name}</p>
                            <p className="text-xs text-text-muted">{getRoleLabel(mUser.role)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-primary">{member.progress}% concluído</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {user?.role !== Role.CLIENTE && (
                <div className="glass-card rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Resumo Financeiro</h3>
                  <div className="bg-surface p-4 rounded-xl border border-white/5">
                    <p className="text-sm text-text-muted mb-2">Este recurso estará disponível após a integração completa do módulo financeiro.</p>
                    <div className="skeleton h-20 w-full mt-4 opacity-50" />
                  </div>
                </div>
              )}
            </div>

            {/* Feature 10 — Activity Feed */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Activity size={18} className="text-primary" />
                <h3 className="text-lg font-semibold">Atividade Recente</h3>
              </div>
              {projectActivities.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-6">Nenhuma atividade registrada.</p>
              ) : (
                <div className="space-y-4">
                  {projectActivities
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 5)
                    .map(activity => {
                      return (
                        <div key={activity.id} className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-xs shrink-0">
                            {getInitials(activity.userName)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white">
                              <span className="font-semibold">{activity.userName}</span>
                              {' '}<span className="text-text-muted">{activity.action}</span>
                              {' '}<span className="text-primary font-medium">"{activity.target}"</span>
                            </p>
                            <p className="text-xs text-text-muted mt-0.5">{relativeTime(activity.createdAt)}</p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---- DEMANDS ---- */}
        {activeTab === 'demands' && (
          <div className="glass-card rounded-2xl p-0 overflow-hidden animate-fade-in">
            <div className="p-4 border-b border-white/5 flex justify-between items-center">
              <h3 className="font-semibold">Demandas do Projeto</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportDemands}
                  className="btn btn-secondary btn-sm gap-1.5"
                  title="Exportar CSV"
                >
                  <Download size={14} />
                  Exportar
                </button>
                {user?.role !== Role.CLIENTE && (
                  <button
                    onClick={demandModal.open}
                    className="btn btn-sm btn-primary flex items-center gap-1.5 shadow-glow-primary"
                  >
                    <Plus size={14} />
                    Nova Demanda
                  </button>
                )}
              </div>
            </div>
            <div className="divide-y divide-white/5">
              {projectDemands.map(demand => (
                <div key={demand.id} className="p-5 hover:bg-white/5 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                    <h4 className="font-medium text-text-primary text-lg">{demand.title}</h4>
                    <span className={`badge ${getStatusColor(demand.status)} rounded-full px-2.5 py-0.5 text-xs font-semibold border`}>
                      {getStatusLabel(demand.status)}
                    </span>
                  </div>
                  <p className="text-sm text-text-muted mb-4">{demand.description}</p>
                  <div className="flex items-center gap-4 text-xs text-text-muted">
                    <span className="flex items-center gap-1"><Clock size={14} /> Prazo: {formatDate(demand.deadline)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---- DELIVERIES ---- */}
        {activeTab === 'deliveries' && (
          <div className="space-y-4 animate-fade-in">
            <div className="glass-card rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-bold text-lg">Entregas de Trabalho</h3>
                  <p className="text-sm text-text-muted mt-1">Registros de progresso submetidos pelos estagiários</p>
                </div>
                {(user?.role === Role.NIVEL_1 || user?.role === Role.NIVEL_2) && (
                  <button onClick={deliveryModal.open} className="btn btn-primary btn-sm gap-2">
                    <Plus size={16} />
                    Entregar Trabalho
                  </button>
                )}
              </div>

              <div className="divide-y divide-white/5 space-y-6">
                {deliveries.filter(d => d.projectId === project.id).length === 0 ? (
                  <div className="text-center py-12 text-text-muted">Nenhuma entrega realizada neste projeto ainda.</div>
                ) : (
                  deliveries
                    .filter(d => d.projectId === project.id)
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((delivery, idx) => (
                      <div key={delivery.id} className={`pt-6 ${idx === 0 ? 'pt-0' : ''}`}>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-bold shrink-0 shadow-sm">
                              {getInitials(delivery.internName)}
                            </div>
                            <div>
                              <h4 className="font-bold text-white text-base">{delivery.internName}</h4>
                              <span className="text-xs text-text-muted flex items-center gap-1.5 mt-0.5">
                                <Clock size={12} />
                                Entregue em: {formatDate(delivery.createdAt)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 flex-wrap">
                            <span className={`badge rounded-full px-2.5 py-0.5 text-xs font-semibold border ${delivery.status === 'VALIDATED'
                                ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
                                : 'text-amber-400 bg-amber-400/10 border-amber-400/20'
                              }`}>
                              {delivery.status === 'VALIDATED' ? 'Validada com Sucesso' : 'Pendente de Validação'}
                            </span>

                            {user?.role === Role.NIVEL_3 && delivery.status === 'PENDING' && ratingDeliveryId !== delivery.id && (
                              <button
                                onClick={() => handleValidateDelivery(delivery.id)}
                                className="btn btn-sm btn-primary bg-emerald-600 border-none shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:bg-emerald-500 cursor-pointer text-white"
                              >
                                Validar Entrega
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Feature 8 — Rating inline form */}
                        {user?.role === Role.NIVEL_3 && ratingDeliveryId === delivery.id && (
                          <div className="mb-4 p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Avaliar Entrega</p>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map(star => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setRatingStars(star)}
                                  className="cursor-pointer transition-colors"
                                >
                                  <Star
                                    size={22}
                                    className={star <= ratingStars ? 'text-amber-400 fill-amber-400' : 'text-white/20'}
                                  />
                                </button>
                              ))}
                              <span className="text-xs text-text-muted ml-2">
                                {ratingStars > 0 ? `${ratingStars}/5` : 'Selecione uma nota'}
                              </span>
                            </div>
                            <textarea
                              placeholder="Comentário sobre a entrega (opcional)"
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-white placeholder-white/30 min-h-[72px] resize-none"
                              value={ratingComment}
                              onChange={e => setRatingComment(e.target.value)}
                            />
                            <div className="flex gap-2 justify-end">
                              <button
                                type="button"
                                onClick={() => setRatingDeliveryId(null)}
                                className="btn btn-secondary btn-sm"
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                onClick={handleConfirmValidation}
                                className="btn btn-primary btn-sm bg-emerald-600 border-none text-white"
                              >
                                Confirmar Validação
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="bg-white/5 rounded-xl p-4 border border-white/5 text-sm text-text-primary whitespace-pre-wrap mb-4">
                          {delivery.description}
                        </div>

                        {/* Show rating if validated */}
                        {delivery.status === 'VALIDATED' && delivery.rating && (
                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map(s => (
                                <Star
                                  key={s}
                                  size={14}
                                  className={s <= delivery.rating! ? 'text-amber-400 fill-amber-400' : 'text-white/20'}
                                />
                              ))}
                            </div>
                            {delivery.ratingComment && (
                              <span className="text-xs text-text-muted italic">"{delivery.ratingComment}"</span>
                            )}
                          </div>
                        )}

                        {delivery.imageUrls && delivery.imageUrls.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {delivery.imageUrls.map((url: string, imgIdx: number) => (
                              <div key={imgIdx} className="relative aspect-video rounded-xl overflow-hidden border border-white/10 group cursor-pointer">
                                <img
                                  src={url}
                                  alt={`Entrega de ${delivery.internName}`}
                                  className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ---- TIMELINE (Feature 9) ---- */}
        {activeTab === 'timeline' && (
          <div className="glass-card rounded-2xl p-6 animate-fade-in">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <LayoutList size={20} className="text-primary" />
              Timeline de Demandas
            </h3>
            {projectDemands.length === 0 ? (
              <p className="text-text-muted text-center py-8">Nenhuma demanda neste projeto.</p>
            ) : (
              <div className="relative pl-6">
                {/* Vertical line */}
                <div className="absolute left-2.5 top-0 bottom-0 w-0.5 bg-white/10" />
                <div className="space-y-6">
                  {[...projectDemands]
                    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
                    .map(demand => {
                      const daysLeft = calculateDaysRemaining(demand.deadline);
                      const isOverdue = daysLeft < 0 && demand.status !== 'COMPLETED';
                      const dotColor = isOverdue
                        ? 'bg-danger'
                        : demand.status === 'COMPLETED'
                          ? 'bg-success'
                          : demand.status === 'IN_PROGRESS'
                            ? 'bg-blue-400'
                            : demand.status === 'REVIEW'
                              ? 'bg-violet-400'
                              : 'bg-white/30';

                      return (
                        <div key={demand.id} className="relative flex items-start gap-4">
                          {/* Dot */}
                          <div className={`absolute -left-[17px] w-4 h-4 rounded-full border-2 border-background ${dotColor} shrink-0 mt-1`} />
                          <div className="flex-1 glass-card rounded-xl p-4 hover:bg-white/5 transition-colors">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                              <h4 className="font-semibold text-white">{demand.title}</h4>
                              <span className={`badge text-xs rounded-full px-2.5 py-0.5 font-semibold border ${getStatusColor(demand.status)}`}>
                                {getStatusLabel(demand.status)}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-4 text-xs text-text-muted">
                              <span className="flex items-center gap-1">
                                <Calendar size={12} />
                                Criado em: {formatDate(demand.createdAt)}
                              </span>
                              <span className={`flex items-center gap-1 ${isOverdue ? 'text-danger font-semibold' : ''}`}>
                                <Clock size={12} />
                                Prazo: {formatDate(demand.deadline)}
                                {isOverdue && ' — Atrasado'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---- TEAM ---- */}
        {activeTab === 'team' && (
          <div className="glass-card rounded-2xl p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold">Equipe do Projeto</h3>
                <p className="text-sm text-text-muted mt-1">Colaboradores responsáveis pela execução das demandas</p>
              </div>
              {(user?.role === Role.NIVEL_3 || user?.role === Role.NIVEL_2) && (
                <button
                  onClick={adicionarMembroModal.open}
                  className="btn btn-primary btn-sm gap-2"
                >
                  <Plus size={16} />
                  Adicionar Membro
                </button>
              )}
            </div>

            <div className="space-y-4">
              {members.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-6">Nenhum membro na equipe deste projeto ainda.</p>
              ) : (
                members.map(member => {
                  const mUser = users.find(u => u.id === member.userId);
                  if (!mUser) return null;
                  return (
                    <div key={member.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/8 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-white font-bold shrink-0">
                          {getInitials(mUser.name)}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{mUser.name}</p>
                          <p className="text-xs text-text-muted">{getRoleLabel(mUser.role)}</p>
                          <p className="text-xs text-text-muted">{mUser.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm font-bold text-primary">{member.progress}%</p>
                          <p className="text-xs text-text-muted">Progresso</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-accent">{member.productivity}%</p>
                          <p className="text-xs text-text-muted">Produtividade</p>
                        </div>
                        {(user?.role === Role.NIVEL_3 || user?.role === Role.NIVEL_2) && (
                          <button
                            onClick={() => handleRemoveMember(member.userId, mUser.name)}
                            className="p-2 text-danger hover:bg-danger/10 rounded-lg transition-colors cursor-pointer ml-2"
                            title="Remover da equipe"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ---- FILES (Feature 1) ---- */}
        {activeTab === 'files' && (
          <div className="space-y-4 animate-fade-in">
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <HardDrive size={20} className="text-primary" />
                Arquivos do Projeto
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {(Object.keys(subfolderConfig) as SubfolderKey[]).map(folder => {
                  const config = subfolderConfig[folder];
                  const FolderIcon = config.icon;

                  // Puxa arquivos do projeto atual, filtrando pela pasta atual
                  const folderFiles = projectFilesData.filter(
                    f => f.projectId === project.id && f.subfolder === folder
                  );
                  console.log(`Folder ${folder}:`, folderFiles);

                  return (
                    <div key={folder} className="rounded-xl bg-white/5 border border-white/8 p-4 space-y-4 shadow-sm hover:border-white/15 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FolderIcon size={16} className="text-primary" />
                          <span className="text-sm font-semibold text-white">{config.label}</span>
                        </div>
                        {config.isZip && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-400 border border-amber-400/20">
                            .zip
                          </span>
                        )}
                      </div>

                      {folderFiles.length === 0 ? (
                        <p className="text-xs text-text-muted italic py-2">Vazio</p>
                      ) : (
                        <ul className="space-y-2">
                          {folderFiles.map(file => {
                            const uploader = users.find(u => u.id === file.uploadedById);
                            const sizeKb = (file.fileSize / 1024).toFixed(1);
                            return (
                              <li
                                key={file.id}
                                onClick={() => window.open(`${API_BASE_URL}/files/download?key=${file.fileKey}&download=true`, '_blank')}

                                className="flex items-center gap-2 text-xs text-text-muted hover:text-white transition-colors bg-white/2 p-2 rounded-lg border border-white/5 cursor-pointer group"
                              >
                                <FileText size={12} className="shrink-0 text-text-muted group-hover:text-primary transition-colors" />
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-white font-medium group-hover:text-primary transition-colors">{file.fileName}</p>
                                  <p className="text-[10px] text-text-muted mt-0.5">{sizeKb} KB · {uploader?.name || 'Desconhecido'}</p>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}

                      {/* Upload button for NIVEL_2+ */}
                      {(user?.role === Role.NIVEL_2 || user?.role === Role.NIVEL_3) && (
                        <label className="w-full flex items-center justify-center gap-1.5 text-[11px] font-semibold text-primary/80 hover:text-primary border border-primary/20 hover:border-primary/40 hover:bg-primary/5 rounded-lg py-2 transition-all mt-2 cursor-pointer">
                          <Plus size={12} />
                          Upload
                          <input
                            type="file"
                            className="hidden"
                            accept={config.isZip ? ".zip,application/zip,application/x-zip-compressed" : undefined}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const el = e.target;

                              try {
                                const formData = new FormData();
                                formData.append('file', file);
                                const uploadRes = await apiFetch(`/files/upload/${project.id}/${folder}`, {
                                  method: 'POST',
                                  body: formData,
                                });
                                if (uploadRes && uploadRes.fileKey) {
                                  // Call projectStore to add file reference to database
                                  await useProjectStore.getState().addProjectFiles([{
                                    projectId: project.id,
                                    subfolder: folder,
                                    fileName: uploadRes.fileName,
                                    fileKey: uploadRes.fileKey,
                                    fileSize: uploadRes.fileSize,
                                    mimeType: uploadRes.mimeType
                                  }]);
                                  setRefreshKey(prev => prev + 1);
                                  showSuccess('Arquivo enviado com sucesso!');
                                }
                              } catch (err: any) {
                                showSuccess('Erro ao fazer upload: ' + (err.message || 'Desconhecido'));
                              } finally {
                                el.value = '';
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ---- CONTRACTS ---- */}
        {activeTab === 'contracts' && (
          <div className="space-y-4 animate-fade-in">
            {(project.contracts || []).map(contract => (
              <div key={contract.id} className="glass-card rounded-2xl p-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${getStatusColor(contract.status)}`}>
                    <FileText size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">{contract.title}</h4>
                    <p className="text-sm text-text-muted mb-2">Criado em {formatDate(contract.createdAt)}</p>
                    <span className={`badge ${getStatusColor(contract.status)} rounded-full text-xs px-2.5 py-0.5 border`}>
                      {contract.status === 'SIGNED' ? 'Assinado' : contract.status === 'PENDING' ? 'Pendente' : contract.status === 'APPROVED' ? 'Aprovado' : contract.status}
                    </span>
                  </div>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                  {/* P-04 fix: Visualizar button now has a handler */}
                  <button
                    className="btn btn-secondary flex-1 md:flex-none"
                    onClick={() => setViewingContract(contract)}
                  >
                    Visualizar
                  </button>
                  {contract.status === 'PENDING' && user?.role === Role.CLIENTE && (
                    <button
                      onClick={() => handleOpenSignContract(contract.id)}
                      className="btn btn-primary shadow-glow-primary flex-1 md:flex-none"
                    >
                      Assinar
                    </button>
                  )}
                </div>
              </div>
            ))}
            {(project.contracts || []).length === 0 && (
              <div className="text-center py-12 glass-card rounded-2xl">
                <FileText className="mx-auto text-text-muted mb-3" size={32} />
                <h3 className="text-lg font-medium">Nenhum contrato</h3>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ---- MODAL: Nova Demanda ---- */}
      <NovaDemandaModal
        isOpen={demandModal.isOpen}
        onClose={demandModal.close}
        projectId={project.id}
        projectMembers={members}
        onSuccess={() => setRefreshKey(prev => prev + 1)}
      />

      {/* ---- MODAL: Nova Entrega ---- */}
      <NovaEntregaModal
        isOpen={deliveryModal.isOpen}
        onClose={deliveryModal.close}
        projectId={project.id}
        userId={user?.id ?? ''}
        userName={user?.name ?? ''}
        onSuccess={() => setRefreshKey(prev => prev + 1)}
      />

      {/* ---- MODAL: Editar Projeto ---- */}
      <EditarProjetoModal
        isOpen={editProjectModal.isOpen}
        onClose={editProjectModal.close}
        project={project}
        onSuccess={() => setRefreshKey(prev => prev + 1)}
      />

      {/* ---- MODAL: Adicionar Membro ---- */}
      <AdicionarMembroModal
        isOpen={adicionarMembroModal.isOpen}
        onClose={adicionarMembroModal.close}
        projectId={project.id}
        projectMembers={members}
        onSuccess={() => setRefreshKey(prev => prev + 1)}
      />

      {/* ---- MODAL: Confirmação de Remoção de Membro ---- */}
      <Modal isOpen={!!deletingMemberId} onClose={() => setDeletingMemberId(null)} size="sm">
        <Modal.Header title="Remover Membro" onClose={() => setDeletingMemberId(null)}>
          <AlertTriangle className="text-danger shrink-0 animate-pulse" size={20} />
        </Modal.Header>
        <Modal.Body className="space-y-4">
          <div className="flex flex-col items-center text-center p-2">
            <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center border border-danger/20 mb-4 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
              <Trash2 className="text-danger animate-pulse" size={28} />
            </div>
            <h4 className="text-base font-semibold text-white mb-2">Remover da equipe?</h4>
            <p className="text-sm text-text-muted">
              Tem certeza de que deseja remover <span className="font-semibold text-white">{deletingMemberName}</span> da equipe deste projeto?
            </p>
            <div className="text-xs text-text-muted mt-4 bg-white/5 border border-white/10 rounded-xl p-3 w-full text-left flex gap-2">
              <span className="shrink-0 text-amber-500">⚠️</span>
              <p>
                <span className="font-semibold text-white/80">Aviso Importante:</span> Esta ação é imediata e limpará todas as atribuições ativas do colaborador em demandas vinculadas a este projeto.
              </p>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDeletingMemberId(null)} disabled={isRemovingMember}>
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            className="bg-danger hover:bg-danger/80 border-none text-white cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.2)]"
            onClick={handleConfirmRemoveMember} 
            disabled={isRemovingMember}
          >
            {isRemovingMember ? 'Removendo...' : 'Remover Colaborador'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ---- MODAL: Assinar Contrato ---- */}
      {signingContract && (
        <AssinarContratoModal
          isOpen={signContractModal.isOpen}
          onClose={handleContractSignModalClose}
          contract={signingContract}
          onSuccess={handleContractSigned}
        />
      )}

      {/* ---- MODAL: Visualizar Contrato (P-04) ---- */}
      <Modal isOpen={!!viewingContract} onClose={() => setViewingContract(null)} size="xl">
        <Modal.Header
          title={viewingContract?.title ?? 'Contrato'}
          onClose={() => setViewingContract(null)}
        />
        <Modal.Body className="p-0 overflow-hidden flex flex-col">
          {viewingContract && (
            <iframe
              src={`${viewingContract.content}#toolbar=0`}
              className="w-full h-[60vh] border-none"
              title={viewingContract.title}
            />
          )}
          {viewingContract?.status === 'PENDING' && user?.role === Role.CLIENTE && (
            <div className="p-4 border-t border-white/10 bg-white/5 flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer group select-none">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded bg-white/5 border-white/20 text-primary focus:ring-primary/50 cursor-pointer"
                  checked={viewingAgreed}
                  onChange={(e) => setViewingAgreed(e.target.checked)}
                />
                <span className="text-xs text-white/70 group-hover:text-white transition-colors">
                  Li e concordo integralmente com os termos deste contrato.
                </span>
              </label>
            </div>
          )}
          {viewingContract?.status === 'SIGNED' && (
            <div className="p-4 border-t border-white/10 bg-emerald-500/10 flex items-center gap-2">
              <span className="text-xs font-semibold text-emerald-400">✓ Este contrato foi aceito e assinado digitalmente.</span>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setViewingContract(null)}>
            Fechar
          </Button>
          {viewingContract?.status === 'PENDING' && user?.role === Role.CLIENTE && (
            <button
              onClick={() => {
                if (viewingContract) {
                  const id = viewingContract.id;
                  setViewingContract(null);
                  handleOpenSignContract(id);
                }
              }}
              disabled={!viewingAgreed}
              className="btn btn-primary shadow-glow-primary gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Prosseguir para Assinatura
            </button>
          )}
          {viewingContract && (
            <a
              href={viewingContract.content.includes('?') ? `${viewingContract.content}&download=true` : `${viewingContract.content}?download=true`}
              download={`${viewingContract.title}.pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary gap-2"
            >
              <Download size={14} />
              Baixar Contrato
            </a>
          )}
        </Modal.Footer>
      </Modal>

      <ToastComponent />
    </div>
  );
}
