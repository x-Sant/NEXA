'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { useModal } from '@/hooks/useModal';
import { Toast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useUserStore } from '@/stores/userStore';
import { useProjectStore } from '@/stores/projectStore';
import { useTicketStore } from '@/stores/ticketStore';
import {
  getInitials,
  getRoleBadgeColor,
  getRoleLabel,
  formatCurrency,
  formatDate
} from '@/lib/utils';
import { Role, TicketStatus } from '@/types';
import {
  ArrowLeft,
  Mail,
  Calendar,
  TrendingUp,
  FolderKanban,
  MessageSquare,
  Target,
  Award,
  Plus,
  Check,
  Clock,
  User,
  Shield,
  Edit,
  Trash2,
  CheckCircle,
  Ban,
} from 'lucide-react';

interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

export default function CollaboratorProfilePage({ params }: ProfilePageProps) {
  const { id } = React.use(params);
  const router = useRouter();
  const { user: currentUser } = useAuthStore();

  const users = useUserStore((s) => s.users);
  const projects = useProjectStore((s) => s.projects);
  const tickets = useTicketStore((s) => s.tickets);
  const updateTicket = useTicketStore((s) => s.updateTicket);

  // Find target user
  let targetUser = users.find(u => u.id === id);
  if (!targetUser && currentUser && currentUser.id === id) {
    targetUser = currentUser;
  }

  // Real-time comments state
  const initialComments: any[] = [];
  const [comments, setComments] = useState(initialComments);
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentSuccess, setCommentSuccess] = useState(false);

  // Local state for actions
  const [refreshKey, setRefreshKey] = useState(0);
  const editModal = useModal();
  const assignModal = useModal();
  const deleteModal = useModal();
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: Role.NIVEL_1,
    cpfCnpj: '',
  });
  const [selectedTicketId, setSelectedTicketId] = useState('');
  const [userActive, setUserActive] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Initialize active state when user changes or loads
  React.useEffect(() => {
    if (targetUser) {
      setUserActive(targetUser.isActive);
      setEditForm({
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        cpfCnpj: targetUser.cpfCnpj || '',
      });
    }
  }, [targetUser]);

  if (!targetUser) {
    return (
      <div className="glass-card p-8 rounded-2xl text-center max-w-lg mx-auto border border-danger/25 mt-12 animate-[fadeIn_0.3s_ease-out]">
        <h2 className="text-xl font-bold text-white mb-2">Colaborador não encontrado</h2>
        <p className="text-sm text-white/50 mb-6">O perfil solicitado não existe no banco de dados.</p>
        <Link href="/dashboard/pessoas" className="btn btn-primary inline-flex">
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Diretório
        </Link>
      </div>
    );
  }

  if (currentUser?.role === Role.PROFESSOR) {
    if (targetUser.role !== Role.NIVEL_1 && targetUser.role !== Role.NIVEL_2) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center glass-card rounded-2xl p-8">
          <User className="text-text-muted mb-4" size={48} />
          <h2 className="text-xl font-bold text-white mb-2">Acesso Negado</h2>
          <p className="text-sm text-text-muted">Professores possuem acesso apenas aos perfis de estagiários.</p>
        </div>
      );
    }
  }

  // Filter projects where user is assigned
  const assignedProjects = projects.filter(p =>
    p.members?.some(m => m.userId === targetUser.id)
  );

  // Get user productivity from mock projects membership
  const memberProductivity = assignedProjects.length > 0
    ? assignedProjects[0].members?.find(m => m.userId === targetUser.id)?.productivity || 80
    : 80;

  // Find user profitability goal
  const profitabilityGoal: any = null;

  // Submit comment handler
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !currentUser) return;

    setIsSubmittingComment(true);
    // Simulate API Delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const newComment = {
      id: `comment-${Date.now()}`,
      targetId: targetUser.id,
      authorId: currentUser.id,
      author: currentUser,
      comment: newCommentText,
      createdAt: new Date().toISOString()
    };

    setComments([newComment, ...comments]);
    setNewCommentText('');
    setIsSubmittingComment(false);
    setCommentSuccess(true);
    setTimeout(() => setCommentSuccess(false), 3000);
  };

  // Toggle user active status
  const handleToggleActive = () => {
    const newActiveState = !targetUser.isActive;
    useUserStore.getState().updateUser(targetUser.id, { isActive: newActiveState });
    setUserActive(newActiveState);
    showToast(newActiveState ? 'Perfil ativado com sucesso!' : 'Perfil desativado com sucesso!');
  };

  // Edit user profile — persists via userStore
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    useUserStore.getState().updateUser(targetUser.id, {
      name: editForm.name,
      email: editForm.email,
      role: editForm.role,
      cpfCnpj: editForm.cpfCnpj || undefined,
      updatedAt: new Date().toISOString(),
    });

    editModal.close();
    showToast('Informações do colaborador atualizadas com sucesso!');
  };

  // Assign ticket
  const handleAssignTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketId) return;

    const ticket = tickets.find(t => t.id === selectedTicketId);
    if (ticket) {
      updateTicket(ticket.id, {
        status: TicketStatus.IN_PROGRESS,
        description: ticket.description.includes('Atribuído a:') 
          ? ticket.description 
          : ticket.description + `\n\n[Atribuído a: ${targetUser.name}]`,
        updatedAt: new Date().toISOString()
      });

      assignModal.close();
      showToast(`Chamado atribuído com sucesso para ${targetUser.name}!`);
      setSelectedTicketId('');
      setRefreshKey(prev => prev + 1);
    }
  };

  // Delete user profile — removes from userStore and cleans up project memberships (PE-08)
  const handleDeleteUser = () => {
    useUserStore.getState().deleteUser(targetUser.id);
    useProjectStore.getState().removeMembersByUserId(targetUser.id);
    deleteModal.close();
    router.push('/dashboard/pessoas');
  };

  const showToast = (message: string) => {
    setActionSuccessMessage(message);
    setTimeout(() => {
      setActionSuccessMessage(null);
    }, 3500);
  };

  const isProfessorOrAdmin = currentUser?.role === Role.PROFESSOR || currentUser?.role === Role.NIVEL_3;

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
      {/* Back link & Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Diretório
        </button>
        <div className="text-right text-xs text-white/40">
          ID: {targetUser.id}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT COLUMN: PRIMARY CARD, ACTIONS & GOALS */}
        <div className="space-y-6">

          {/* User Card */}
          <div className="glass-card rounded-2xl p-6 text-center relative overflow-hidden border border-white/[0.08]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3" />

            {/* Avatar */}
            <div className="w-24 h-24 rounded-full gradient-primary flex items-center justify-center text-3xl font-bold text-white mx-auto shadow-lg shadow-primary/20 relative">
              {getInitials(targetUser.name)}
              <span className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-4 border-[#0a0e1a] transition-all duration-300 ${userActive ? 'bg-success shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-white/20'}`} />
            </div>

            <h2 className="text-xl font-bold text-white mt-4">{targetUser.name}</h2>
            <div className="flex items-center justify-center gap-1.5 text-sm text-white/50 mt-1">
              <Mail className="w-3.5 h-3.5" />
              <span>{targetUser.email}</span>
            </div>

            <div className="mt-4 inline-flex">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${getRoleBadgeColor(targetUser.role)}`}>
                {getRoleLabel(targetUser.role)}
              </span>
            </div>

            {/* General metrics */}
            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/5">
              <div className="text-center">
                <p className="text-[10px] text-white/40 uppercase tracking-wider">Produtividade Média</p>
                <p className="text-lg font-bold text-white mt-1">
                  {targetUser.role === Role.NIVEL_1 || targetUser.role === Role.NIVEL_2 ? `${memberProductivity}%` : 'N/A'}
                </p>
              </div>
              <div className="text-center border-l border-white/5">
                <p className="text-[10px] text-white/40 uppercase tracking-wider">Membro Desde</p>
                <p className="text-sm font-bold text-white mt-1.5">
                  {new Date(targetUser.createdAt).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })}
                </p>
              </div>
            </div>
          </div>

          {/* Admin Actions Panel */}
          {currentUser?.role === Role.NIVEL_3 && (
            <div className="glass-card rounded-2xl p-6 border border-white/[0.08] relative overflow-hidden animate-[fadeIn_0.3s_ease-out]">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3" />

              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Shield className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">Painel de Ações (Admin)</h3>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={assignModal.open}
                  className="w-full btn btn-secondary text-xs flex items-center justify-start gap-2.5 py-2.5 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-primary" />
                  Atribuir Chamado
                </button>

                <button
                  onClick={() => {
                    setEditForm({
                      name: targetUser.name,
                      email: targetUser.email,
                      role: targetUser.role,
                      cpfCnpj: targetUser.cpfCnpj || '',
                    });
                    editModal.open();
                  }}
                  className="w-full btn btn-secondary text-xs flex items-center justify-start gap-2.5 py-2.5 cursor-pointer"
                >
                  <Edit className="w-4 h-4 text-accent" />
                  Editar Informações
                </button>

                <button
                  onClick={handleToggleActive}
                  className={`w-full btn btn-secondary text-xs flex items-center justify-start gap-2.5 py-2.5 cursor-pointer ${userActive ? 'text-warning/90' : 'text-success/90'}`}
                >
                  {userActive ? (
                    <>
                      <Ban className="w-4 h-4 text-warning" />
                      Desativar Perfil
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 text-success" />
                      Ativar Perfil
                    </>
                  )}
                </button>

                <button
                  onClick={deleteModal.open}
                  className="w-full btn btn-secondary text-xs flex items-center justify-start gap-2.5 py-2.5 border-danger/20 hover:border-danger/40 hover:bg-danger/10 text-danger cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-danger animate-pulse" />
                  Excluir Perfil
                </button>
              </div>
            </div>
          )}

          {/* Profitability Goal (Only for Interns N1 & N2) */}
          {(targetUser.role === Role.NIVEL_1 || targetUser.role === Role.NIVEL_2) && (
            <div className="glass-card rounded-2xl p-6 border border-white/[0.08] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl -translate-y-1/2 -translate-x-1/3" />

              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                  <Target className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">Meta de Rentabilidade</h3>
              </div>

              {profitabilityGoal ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/50">Mês de Referência</span>
                    <span className="text-white font-medium capitalize">
                      {new Date(profitabilityGoal.month).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-white/[0.02] border border-white/5 rounded-xl p-3">
                    <div>
                      <p className="text-[10px] text-white/40">Alvo Estabelecido</p>
                      <p className="text-sm font-bold text-white mt-0.5">{formatCurrency(profitabilityGoal.target)}</p>
                    </div>
                    <div className="border-l border-white/5 pl-3">
                      <p className="text-[10px] text-white/40">Valor Entregue</p>
                      <p className="text-sm font-bold text-accent mt-0.5">{formatCurrency(profitabilityGoal.actual)}</p>
                    </div>
                  </div>

                  {/* Goal Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-white/40">Progresso da Meta</span>
                      <span className="text-accent font-bold">
                        {((profitabilityGoal.actual / profitabilityGoal.target) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                        style={{ width: `${Math.min((profitabilityGoal.actual / profitabilityGoal.target) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-white/30 text-xs">
                  Nenhuma meta financeira estipulada para o mês ativo.
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: ASSIGNED PROJECTS & COMMENTS */}
        <div className="lg:col-span-2 space-y-6">

          {/* Assigned Projects */}
          <div className="glass-card rounded-2xl p-6 border border-white/[0.08]">
            <div className="flex items-center gap-2.5 mb-6 border-b border-white/5 pb-4">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <FolderKanban className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white">Projetos Atribuídos</h3>
            </div>

            {assignedProjects.length > 0 ? (
              <div className="space-y-4">
                {assignedProjects.map(project => {
                  const memberStats = project.members?.find(m => m.userId === targetUser.id);
                  const progress = memberStats?.progress || 0;

                  return (
                    <div key={project.id} className="p-4 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h4 className="font-semibold text-white text-sm">{project.name}</h4>
                        <p className="text-xs text-white/40 flex items-center gap-1 mt-1">
                          <Calendar className="w-3.5 h-3.5" /> Prazo final: {formatDate(project.deadline)}
                        </p>
                      </div>

                      {/* Productivity & Progress */}
                      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-12 min-w-[200px]">
                        {memberStats && (
                          <div className="text-left md:text-right">
                            <p className="text-[10px] text-white/40">Produtividade Individual</p>
                            <p className="text-xs font-bold text-accent flex items-center gap-1 mt-0.5">
                              <TrendingUp className="w-3 h-3" /> {memberStats.productivity}%
                            </p>
                          </div>
                        )}

                        <div className="flex-1 w-full md:w-32 space-y-1">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-white/40">Entregas</span>
                            <span className="text-primary font-bold">{progress}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 text-white/30 text-xs">
                Este colaborador não está associado a nenhum projeto ativo.
              </div>
            )}
          </div>

          {/* Professor Comments Section */}
          <div className="glass-card rounded-2xl p-6 border border-white/[0.08] space-y-6">
            <div className="flex items-center gap-2.5 border-b border-white/5 pb-4">
              <div className="w-8 h-8 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/20 flex items-center justify-center text-[#ef4444]">
                <MessageSquare className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white">Notas de Avaliação e Observações</h3>
            </div>

            {/* Add Comment Form (Visible to Professors and Admin) */}
            {isProfessorOrAdmin && (
              <form onSubmit={handleAddComment} className="space-y-3 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-2 text-xs text-white/60 font-medium mb-1">
                  <Award className="w-4 h-4 text-accent" />
                  <span>Adicionar nota de supervisão pedagógica</span>
                </div>
                <textarea
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Escreva observações sobre a produtividade, comportamento ou evolução do estagiário..."
                  rows={3}
                  className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] text-white px-4 py-2.5 text-xs outline-none transition-all placeholder:text-white/20 focus:ring-2 focus:ring-primary/40 focus:border-primary/50"
                  required
                />
                <div className="flex justify-end gap-2 items-center">
                  {commentSuccess && (
                    <span className="text-xs text-success flex items-center gap-1 mr-2 animate-[fadeIn_0.2s_ease-out]">
                      <Check className="w-3.5 h-3.5" /> Nota adicionada!
                    </span>
                  )}
                  <button
                    type="submit"
                    disabled={isSubmittingComment}
                    className="btn btn-primary btn-sm rounded-xl"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {isSubmittingComment ? 'Adicionando...' : 'Adicionar Nota'}
                  </button>
                </div>
              </form>
            )}

            {/* Comments List */}
            <div className="space-y-4">
              {comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment.id} className="p-4 rounded-xl bg-white/[0.03] border border-white/5 flex items-start gap-4 animate-[fadeIn_0.3s_ease-out]">
                    <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {getInitials(comment.author?.name || 'Prof')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4">
                        <h4 className="text-xs font-bold text-white truncate">{comment.author?.name}</h4>
                        <span className="text-[10px] text-white/30 flex items-center gap-1 shrink-0">
                          <Clock className="w-3 h-3" /> {new Date(comment.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[10px] text-accent font-semibold uppercase mt-0.5">
                        {getRoleLabel(comment.author?.role || Role.PROFESSOR)}
                      </p>
                      <p className="text-xs text-white/70 mt-2 whitespace-pre-wrap leading-relaxed">
                        {comment.comment}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-white/30 text-xs">
                  Nenhuma observação ou avaliação cadastrada para este colaborador.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODALS */}

      {/* Modal 1 — Editar Perfil */}
      <Modal isOpen={editModal.isOpen} onClose={editModal.close} size="md">
        <Modal.Header title="Editar Colaborador" onClose={editModal.close} />
        <Modal.Body className="space-y-4">
          <Input
            label="Nome Completo"
            type="text"
            required
            value={editForm.name}
            onChange={(e) => setEditForm(p => ({ ...p, name: e.target.value }))}
          />
          <Input
            label="E-mail"
            type="email"
            required
            value={editForm.email}
            onChange={(e) => setEditForm(p => ({ ...p, email: e.target.value }))}
          />
          <Input
            label="CPF / CNPJ"
            type="text"
            placeholder="Ex: 000.000.000-00"
            value={editForm.cpfCnpj}
            onChange={(e) => setEditForm(p => ({ ...p, cpfCnpj: e.target.value }))}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-white/60">Cargo</label>
            <select
              value={editForm.role}
              onChange={(e) => setEditForm(p => ({ ...p, role: e.target.value as Role }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 bg-[#1b1c21] cursor-pointer"
            >
              <option value={Role.NIVEL_3} className="bg-background text-white">Administrador (Nível 3)</option>
              <option value={Role.NIVEL_2} className="bg-background text-white">Supervisor (Nível 2)</option>
              <option value={Role.NIVEL_1} className="bg-background text-white">Estagiário (Nível 1)</option>
              <option value={Role.PROFESSOR} className="bg-background text-white">Professor Orientador</option>
            </select>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={editModal.close}>Cancelar</Button>
          <Button onClick={handleSaveEdit}>Salvar Alterações</Button>
        </Modal.Footer>
      </Modal>

      {/* Modal 2 — Atribuir Chamado */}
      <Modal isOpen={assignModal.isOpen} onClose={assignModal.close} size="md">
        <Modal.Header title="Atribuir Chamado" onClose={assignModal.close} />
        <Modal.Body className="space-y-4">
          <p className="text-sm text-white/50">
            Selecione um chamado pendente para atribuir a <span className="text-white font-medium">{targetUser.name}</span>.
          </p>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-white/60">Chamados Disponíveis</label>
            <select
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 bg-[#1b1c21] cursor-pointer"
              value={selectedTicketId}
              onChange={(e) => setSelectedTicketId(e.target.value)}
            >
              <option value="" disabled className="bg-background">Selecione um chamado...</option>
              {tickets
                .filter(t => t.status !== TicketStatus.CLOSED && t.status !== TicketStatus.RESOLVED)
                .map(ticket => (
                  <option key={ticket.id} value={ticket.id} className="bg-background text-white">
                    #{ticket.id.split('-')[1] || ticket.id} - {ticket.subject}
                  </option>
                ))
              }
            </select>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={assignModal.close}>Cancelar</Button>
          <Button onClick={handleAssignTicket} disabled={!selectedTicketId}>Atribuir Chamado</Button>
        </Modal.Footer>
      </Modal>

      {/* Modal 3 — Excluir Perfil */}
      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={handleDeleteUser}
        title="Excluir Colaborador"
        message={`Tem certeza que deseja excluir o perfil de ${targetUser.name}? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        variant="danger"
      />

      <Toast message={actionSuccessMessage} />
    </div>
  );
}
