'use client';

import { calculateDaysRemaining, formatDate, getInitials, getStatusColor, getStatusLabel } from '@/lib/utils';
import { useAuthStore } from '@/lib/auth-store';
import { Role, ContractStatus, ProjectMember } from '@/types';
import { Plus, Search, FolderKanban, Calendar, Users, Clock, X, UploadCloud, Trash, AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import Link from 'next/link';
import { useState } from 'react';
import NewProjectModal from '@/components/modals/NewProjectModal';

import { useProjectStore } from '@/stores/projectStore';
import { useUserStore } from '@/stores/userStore';

export default function ProjetosPage() {
  const { user } = useAuthStore();
  const users = useUserStore(s => s.users);
  const projects = useProjectStore(s => s.projects);
  const isLoading = useProjectStore(s => s.isLoading);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Delete project state
  const [projectToDelete, setProjectToDelete] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteProjectStore = useProjectStore(s => s.deleteProject);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    const timer = setTimeout(() => setSuccessMessage(null), 3500);
    return () => clearTimeout(timer);
  };

  const toggleStatusFilter = (status: string) => {
    setSelectedStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  if (user?.role === Role.PROFESSOR) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center glass-card rounded-2xl p-8">
        <FolderKanban className="text-text-muted mb-4" size={48} />
        <h2 className="text-xl font-bold text-white mb-2">Acesso Negado</h2>
        <p className="text-sm text-text-muted">Professores não possuem permissão para acessar o painel de projetos.</p>
      </div>
    );
  }

  // Filter projects based on role and search/status
  const filteredProjects = projects.filter(p => {
    const projectMembers = p.members || [];

    // Role-based filtering
    let hasAccess = false;
    if (user?.role === Role.NIVEL_3 || user?.role === Role.NIVEL_2) {
      hasAccess = true; // Admins and Level 2 interns see all
    } else if (user?.role === Role.CLIENTE) {
      hasAccess = p.clientId === user.id; // Clients see their own
    } else {
      // Level 1 interns see projects they are members of or own
      hasAccess = p.ownerId === user?.id || (projectMembers.some(m => m.userId === user?.id));
    }

    if (!hasAccess) return false;

    // Search and status filtering
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(p.status);
    
    return matchesSearch && matchesStatus;
  });

  const sortedProjects = [...filteredProjects].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Projetos</h1>
          <p className="text-sm text-text-muted mt-1">Acompanhamento e gestão de entregas</p>
        </div>
        
        {user?.role === Role.NIVEL_3 && (
          <button 
            className="btn btn-primary gap-2"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={18} />
            <span>Novo Projeto</span>
          </button>
        )}
      </div>

      <div className="glass-card rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
          <input 
            type="text" 
            placeholder="Buscar projetos..." 
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto sm:justify-end">
          <span className="text-xs font-semibold text-text-muted mr-1 flex items-center gap-1">
            <FolderKanban size={14} /> Filtrar:
          </span>
          
          {(['ACTIVE', 'COMPLETED', 'PAUSED'] as const).map(status => {
            const isActive = selectedStatuses.includes(status);
            const label = status === 'ACTIVE' ? 'Ativos' :
                          status === 'COMPLETED' ? 'Concluídos' : 'Pausados';

            const activeClass = isActive
              ? 'bg-primary/20 text-primary-light border-primary/30 shadow-glow-primary'
              : 'bg-white/5 text-text-muted border-white/10 hover:bg-white/10 hover:text-white';

            return (
              <button
                key={status}
                onClick={() => toggleStatusFilter(status)}
                className={`px-4 py-1.5 rounded-xl text-xs font-medium border transition-all duration-300 transform hover:scale-[1.03] active:scale-[0.97] ${activeClass}`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-2xl">
          <FolderKanban className="mx-auto text-text-muted mb-4" size={40} />
          <h3 className="text-xl font-medium text-text-primary">Nenhum projeto encontrado</h3>
          <p className="text-text-muted mt-1">Nenhum projeto corresponde aos filtros selecionados.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedProjects.map((project, idx) => {
            const daysRemaining = calculateDaysRemaining(project.deadline);
            const isLate = daysRemaining < 0;
            
            const members = project.members || [];
            const progress = members.length > 0 
              ? Math.round(members.reduce((acc, m) => acc + m.progress, 0) / members.length)
              : 0;

            return (
              <Link 
                href={`/dashboard/projetos/${project.id}`} 
                key={project.id}
                className={`block glass-card rounded-2xl p-5 hover:border-primary/30 transition-all group hover:shadow-glow-primary hover:-translate-y-0.5 duration-200 stagger-${(idx % 8) + 1}`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                  {/* Left Section: Icon and Info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 gradient-primary text-white shadow-glow-primary">
                      <FolderKanban size={24} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                        <h3 className="text-lg font-bold text-text-primary group-hover:text-primary transition-colors truncate">
                          {project.name}
                        </h3>
                        <div className={`badge ${getStatusColor(project.status)} rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider`}>
                          {getStatusLabel(project.status)}
                        </div>
                      </div>
                      
                      <p className="text-sm text-text-muted line-clamp-1" title={project.description}>
                        {project.description || 'Sem descrição.'}
                      </p>
                    </div>
                  </div>

                  {/* Middle Section: Progress Bar */}
                  <div className="w-full md:w-64 shrink-0">
                    <div className="flex justify-between text-xs mb-1.5 font-medium">
                      <span className="text-text-muted">Progresso</span>
                      <span className="font-bold text-white">{progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          progress === 100 ? 'bg-success' : 'gradient-primary'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Right Section: Team, Deadline and Clock */}
                  <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 pt-3 md:pt-0 border-t border-white/5 md:border-t-0">
                    {/* Team Avatars */}
                    <div className="flex -space-x-2">
                      {members.slice(0, 3).map((member: ProjectMember) => {
                        const memberUser = users.find(u => u.id === member.userId);
                        if (!memberUser) return null;
                        return (
                          <div key={member.id} className="w-8 h-8 rounded-full border-2 border-surface bg-surface-active flex items-center justify-center text-[10px] font-bold text-text-primary z-10 relative group/avatar">
                            {getInitials(memberUser.name)}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-surface-active text-text-primary text-[10px] rounded opacity-0 group-hover/avatar:opacity-100 pointer-events-none whitespace-nowrap z-50">
                              {memberUser.name}
                            </div>
                          </div>
                        );
                      })}
                      {members.length > 3 && (
                        <div className="w-8 h-8 rounded-full border-2 border-surface bg-white/5 flex items-center justify-center text-[10px] font-bold text-text-muted z-0">
                          +{members.length - 3}
                        </div>
                      )}
                      {members.length === 0 && (
                        <span className="text-xs text-text-muted">Sem equipe</span>
                      )}
                    </div>

                    {/* Deadline & Clock */}
                    <div className="flex flex-col items-end gap-1 text-right">
                      <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded ${
                        isLate ? 'bg-danger/20 text-danger' : 
                        daysRemaining <= 7 ? 'bg-warning/20 text-warning' : 'bg-success/20 text-success'
                      }`}>
                        <Clock size={12} />
                        <span>
                          {isLate ? `${Math.abs(daysRemaining)}d atrasado` : 
                           daysRemaining === 0 ? 'Hoje' : `${daysRemaining}d restantes`}
                        </span>
                      </div>
                      <span className="text-[10px] text-text-muted flex items-center gap-1">
                        <Calendar size={10} />
                        {formatDate(project.deadline)}
                      </span>
                    </div>

                    {/* Excluir Button (Admin only) */}
                    {user?.role === Role.NIVEL_3 && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setProjectToDelete(project);
                        }}
                        className="p-2 text-danger hover:bg-danger/15 rounded-xl transition-all duration-200 border border-transparent hover:border-danger/30 hover:scale-[1.05]"
                        title="Excluir Projeto"
                      >
                        <Trash size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <NewProjectModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => setRefreshKey(prev => prev + 1)}
      />

      {/* Modal Confirmar Exclusão de Projeto */}
      <Modal isOpen={!!projectToDelete} onClose={() => { setProjectToDelete(null); setErrorMessage(null); }} size="md">
        <Modal.Header title="Excluir Projeto" onClose={() => { setProjectToDelete(null); setErrorMessage(null); }} />
        <Modal.Body>
          {errorMessage && (
            <div className="mb-4 p-4 rounded-xl bg-danger/10 border border-danger/20 flex items-start gap-3 text-left">
              <div className="p-1 rounded-full bg-danger/20 text-danger shrink-0 mt-0.5">
                <X size={14} />
              </div>
              <p className="text-sm text-danger-light font-medium">{errorMessage}</p>
            </div>
          )}
          <div className="flex flex-col items-center justify-center text-center py-4">
            <div className="w-16 h-16 rounded-full bg-danger/10 text-danger flex items-center justify-center mb-4">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Você tem certeza absoluta?</h3>
            <p className="text-text-muted text-sm px-4">
              Deseja realmente excluir o projeto <strong className="text-white">{projectToDelete?.name}</strong>?<br/>
              Essa ação é irreversível e irá apagar todas as demandas, alocações e registros associados a este projeto.
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" disabled={isDeleting} onClick={() => { setProjectToDelete(null); setErrorMessage(null); }}>Cancelar</Button>
          <Button 
            className="bg-danger hover:bg-danger-hover text-white border-0 flex items-center justify-center min-w-[150px]" 
            disabled={isDeleting}
            onClick={async () => {
              if (projectToDelete) {
                setIsDeleting(true);
                try {
                  await deleteProjectStore(projectToDelete.id);
                  showSuccess("Projeto excluído com sucesso!");
                  setProjectToDelete(null);
                  setErrorMessage(null);
                } catch (err: any) {
                  setErrorMessage(err.message || "Erro ao excluir projeto.");
                } finally {
                  setIsDeleting(false);
                }
              }
            }}
          >
            {isDeleting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Confirmar Exclusão'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <Toast message={successMessage} />
    </div>
  );
}
