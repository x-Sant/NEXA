'use client';

import { getInitials, getStatusColor, formatDate, getStatusLabel } from '@/lib/utils';
import { Role, User } from '@/types';
import { Search, Plus, Building2, FolderKanban, MessageSquare, Mail, X, Calendar, Clock, Edit, Trash, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import NewProjectModal from '@/components/modals/NewProjectModal';
import { useModal } from '@/hooks/useModal';
import { Toast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useUserStore } from '@/stores/userStore';
import { useProjectStore } from '@/stores/projectStore';
import { useTicketStore } from '@/stores/ticketStore';
import { useAuthStore } from '@/lib/auth-store';

export default function ClientesPage() {
  const { user } = useAuthStore();
  const { users, addUser, updateUser, deleteUser, isLoading } = useUserStore();
  const projects = useProjectStore(s => s.projects);
  const tickets = useTicketStore(s => s.tickets);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<User | null>(null);
  const [tempSelectedClient, setTempSelectedClient] = useState<User | null>(null);
  const [isClosingDetail, setIsClosingDetail] = useState(false);

  // Edit state
  const [editingClient, setEditingClient] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', cnpj: '' });
  const [clientToDelete, setClientToDelete] = useState<User | null>(null);

  const addModal = useModal();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    const timer = setTimeout(() => setSuccessMessage(null), 3500);
    return () => clearTimeout(timer);
  };

  useEffect(() => {
    if (selectedClient) {
      setTempSelectedClient(selectedClient);
      setIsClosingDetail(false);
    } else if (tempSelectedClient) {
      setIsClosingDetail(true);
      const timer = setTimeout(() => {
        setTempSelectedClient(null);
        setIsClosingDetail(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [selectedClient, tempSelectedClient]);

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [selectedClientIdForProject, setSelectedClientIdForProject] = useState('');
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    cpfCnpj: '',
    password: '',
  });

  const clients = users.filter(u => u.role === Role.CLIENTE);

  const filteredClients = clients.filter(client => {
    return client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           client.email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!newClient.name || !newClient.email) return;

    const client: any = {
      id: `u-${Date.now()}`,
      name: newClient.name,
      email: newClient.email,
      role: Role.CLIENTE,
      cpfCnpj: newClient.cpfCnpj.replace(/\D/g, ''),
      password: newClient.password,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setIsSubmitting(true);
    try {
      await addUser(client);
      addModal.close();
      setNewClient({ name: '', email: '', cpfCnpj: '', password: '' });
      showSuccess("Cliente cadastrado com sucesso!");
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao cadastrar cliente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingClient) return;
    setIsSubmitting(true);
    try {
      await updateUser(editingClient.id, {
        name: editForm.name,
        email: editForm.email,
        cpfCnpj: editForm.cnpj,
      });
      setEditingClient(null);
      showSuccess("Cliente atualizado com sucesso!");
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao atualizar cliente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Clientes</h1>
          <p className="text-sm text-text-muted mt-1">Gestão de empresas parceiras</p>
        </div>
        {(user?.role === Role.NIVEL_3 || user?.role === Role.NIVEL_2) && (
          <button
            onClick={addModal.open}
            className="btn btn-primary gap-2"
          >
            <Plus size={18} />
            <span>Cadastrar Cliente</span>
          </button>
        )}
      </div>

      <div className="glass-card rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
          <input
            type="text"
            placeholder="Buscar clientes por nome ou email..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-white placeholder-white/30"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="text-center py-12 glass-card rounded-2xl">
          <Building2 className="mx-auto text-text-muted mb-3" size={32} />
          <h3 className="text-lg font-medium text-text-primary">Nenhum cliente encontrado</h3>
          <p className="text-text-muted mt-1">Tente ajustar os filtros de busca.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredClients.map((client, idx) => {
            const clientProjects = projects.filter(p => p.clientId === client.id);
            const activeProjects = clientProjects.filter(p => p.status === 'ACTIVE').length;
            const clientTickets = tickets.filter(t => t.creatorId === client.id);
            const openTickets = clientTickets.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;

            return (
              <div key={client.id} className={`glass-card rounded-2xl overflow-hidden hover:border-white/20 transition-all group stagger-${(idx % 8) + 1}`}>
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-surface-active flex items-center justify-center border border-white/10 shadow-sm shrink-0">
                      <Building2 size={24} className="text-text-muted" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-text-primary leading-tight mb-1">{client.name}</h3>
                      <div className="text-xs text-text-muted space-y-1">
                        <p className="flex items-center gap-1.5"><Mail size={12}/> {client.email}</p>
                        {client.cpfCnpj && <p className="flex items-center gap-1.5">CNPJ: {client.cpfCnpj}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-6">
                    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                      <div className="flex items-center gap-2 text-primary mb-1">
                        <FolderKanban size={14} />
                        <span className="text-xs font-semibold uppercase tracking-wider">Projetos</span>
                      </div>
                      <div className="flex items-end justify-between">
                        <span className="text-2xl font-bold">{clientProjects.length}</span>
                        <span className="text-xs text-text-muted mb-1">{activeProjects} ativos</span>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                      <div className="flex items-center gap-2 text-warning mb-1">
                        <MessageSquare size={14} />
                        <span className="text-xs font-semibold uppercase tracking-wider">Chamados</span>
                      </div>
                      <div className="flex items-end justify-between">
                        <span className="text-2xl font-bold">{clientTickets.length}</span>
                        <span className="text-xs text-text-muted mb-1">{openTickets} abertos</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 p-4 border-t border-white/5 flex gap-2">
                  <button
                    onClick={() => setSelectedClient(client)}
                    className="btn btn-secondary btn-sm flex-1"
                  >
                    Detalhes
                  </button>
                  {user?.role === Role.NIVEL_3 && (
                    <button
                      onClick={() => {
                        setSelectedClientIdForProject(client.id);
                        setIsProjectModalOpen(true);
                      }}
                      className="btn btn-primary btn-sm flex-1 text-center"
                    >
                      Novo Projeto
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Detalhes do Cliente */}
      {tempSelectedClient && (() => {
        const client = tempSelectedClient;
        const clientProjects = projects.filter(p => p.clientId === client.id);
        const clientTickets = tickets.filter(t => t.creatorId === client.id);

        return (
          <div className={`fixed inset-0 bg-background/90 backdrop-blur-md z-50 flex items-center justify-center p-4 ${isClosingDetail ? 'animate-backdrop-out' : 'animate-backdrop-in'}`}>
            <div className={`glass-card rounded-xl p-8 w-full max-w-4xl relative border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar ${isClosingDetail ? 'animate-scale-down' : 'animate-fade-in'}`}>
              <button
                onClick={() => setSelectedClient(null)}
                className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-text-muted hover:text-white hover:bg-white/10 transition-all"
              >
                <X size={18} />
              </button>

              <div className="flex flex-col items-center mb-6 mt-2">
                <div className="w-20 h-20 rounded-2xl bg-surface-active flex items-center justify-center border-2 border-primary shadow-glow-primary mb-4">
                  <Building2 size={32} className="text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-white text-center">{client.name}</h2>
                <div className="badge bg-primary/20 text-primary mt-2 border border-primary/30">Cliente Parceiro</div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-xs text-text-muted mb-1 font-medium">E-mail Corporativo</p>
                  <p className="text-sm text-white font-semibold flex items-center gap-2 truncate">
                    <Mail size={16} className="text-primary shrink-0"/>
                    <span className="truncate">{client.email}</span>
                  </p>
                </div>
                {client.cpfCnpj ? (
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <p className="text-xs text-text-muted mb-1 font-medium">CNPJ / Documento</p>
                    <p className="text-sm text-white font-semibold flex items-center gap-2">
                      <Building2 size={16} className="text-primary shrink-0"/>
                      <span>{client.cpfCnpj}</span>
                    </p>
                  </div>
                ) : (
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10 flex items-center justify-center text-text-muted text-xs">
                    Sem documento cadastrado
                  </div>
                )}
              </div>

              {/* Projects & Tickets Split View */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Projects Column */}
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2 pb-2 border-b border-white/10">
                    <FolderKanban size={18} className="text-primary" />
                    <span>Projetos Associados</span>
                    <span className="text-xs font-normal text-text-muted">({clientProjects.length})</span>
                  </h3>

                  {clientProjects.length === 0 ? (
                    <div className="bg-white/5 rounded-xl p-6 border border-white/5 text-center text-text-muted text-sm">
                      Nenhum projeto associado.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[260px] overflow-y-auto pr-2 custom-scrollbar">
                      {clientProjects.map(proj => (
                        <Link
                          href={`/dashboard/projetos/${proj.id}`}
                          key={proj.id}
                          className="bg-white/5 border border-white/5 hover:border-primary/30 rounded-xl p-4 transition-all flex justify-between items-center cursor-pointer group"
                        >
                          <div className="flex-1 min-w-0 pr-2">
                            <p className="font-semibold text-white text-sm line-clamp-1 group-hover:text-primary transition-colors">{proj.name}</p>
                            <p className="text-xs text-text-muted mt-1.5 flex items-center gap-1">
                              <Calendar size={12} className="shrink-0" />
                              <span>Prazo: {formatDate(proj.deadline)}</span>
                            </p>
                          </div>
                          <span className={`badge shrink-0 text-[10px] ${getStatusColor(proj.status)}`}>
                            {getStatusLabel(proj.status)}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tickets Column */}
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2 pb-2 border-b border-white/10">
                    <MessageSquare size={18} className="text-warning" />
                    <span>Chamados de Suporte</span>
                    <span className="text-xs font-normal text-text-muted">({clientTickets.length})</span>
                  </h3>

                  {clientTickets.length === 0 ? (
                    <div className="bg-white/5 rounded-xl p-6 border border-white/5 text-center text-text-muted text-sm">
                      Nenhum chamado aberto.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[260px] overflow-y-auto pr-2 custom-scrollbar">
                      {clientTickets.map(ticket => (
                        <Link
                          href={`/dashboard/suporte?id=${ticket.id}`}
                          key={ticket.id}
                          className="bg-white/5 border border-white/5 hover:border-warning/40 rounded-xl p-4 transition-all flex justify-between items-center cursor-pointer group"
                        >
                          <div className="flex-1 min-w-0 pr-2">
                            <p className="font-semibold text-white text-sm truncate group-hover:text-warning transition-colors" title={ticket.subject}>{ticket.subject}</p>
                            <p className="text-xs text-text-muted mt-1.5 flex items-center gap-1">
                              <Clock size={12} className="shrink-0" />
                              <span>Aberto em: {formatDate(ticket.createdAt)}</span>
                            </p>
                          </div>
                          <span className={`badge shrink-0 text-[10px] ${getStatusColor(ticket.status)}`}>
                            {getStatusLabel(ticket.status)}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-white/10 flex justify-end gap-3">
                {user?.role === Role.NIVEL_3 && (
                  <>
                    <button
                      onClick={() => {
                        setClientToDelete(client);
                        setSelectedClient(null);
                        setErrorMessage(null);
                      }}
                      className="btn bg-danger/10 text-danger hover:bg-danger/20 border-danger/30 text-sm gap-2 mr-auto"
                    >
                      <Trash size={14} />
                      Excluir
                    </button>
                    <button
                      onClick={() => {
                        setEditingClient(client);
                        setEditForm({ name: client.name, email: client.email, cnpj: client.cpfCnpj ?? '' });
                        setSelectedClient(null);
                      }}
                      className="btn btn-secondary text-sm gap-2"
                    >
                      <Edit size={14} />
                      Editar
                    </button>
                  </>
                )}
                <button
                  onClick={() => setSelectedClient(null)}
                  className="btn btn-secondary px-8 py-2.5 rounded-xl text-sm font-semibold flex-1 sm:flex-initial"
                >
                  Fechar Detalhes
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal Editar Cliente */}
      <Modal isOpen={!!editingClient} onClose={() => setEditingClient(null)} size="md">
        <Modal.Header title="Editar Cliente" onClose={() => setEditingClient(null)} />
        <Modal.Body className="space-y-4">
          <Input
            label="Nome"
            value={editForm.name}
            onChange={(e) => setEditForm(p => ({ ...p, name: e.target.value }))}
          />
          <Input
            label="E-mail"
            type="email"
            value={editForm.email}
            onChange={(e) => setEditForm(p => ({ ...p, email: e.target.value }))}
          />
          <Input
            label="CNPJ"
            value={editForm.cnpj}
            onChange={(e) => setEditForm(p => ({ ...p, cnpj: e.target.value }))}
            placeholder="00.000.000/0000-00"
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" disabled={isSubmitting} onClick={() => setEditingClient(null)}>Cancelar</Button>
          <Button disabled={isSubmitting} onClick={handleSaveEdit}>
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Salvar'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Confirmar Exclusão */}
      <Modal isOpen={!!clientToDelete} onClose={() => { setClientToDelete(null); setErrorMessage(null); }} size="md">
        <Modal.Header title="Atenção" onClose={() => { setClientToDelete(null); setErrorMessage(null); }} />
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
            <h3 className="text-xl font-bold text-white mb-2">Você tem certeza?</h3>
            <p className="text-text-muted text-sm px-4">
              Deseja realmente excluir o cliente <strong className="text-white">{clientToDelete?.name}</strong>?<br/>
              Essa ação não pode ser desfeita e irá desativar o acesso à plataforma.
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" disabled={isDeleting} onClick={() => { setClientToDelete(null); setErrorMessage(null); }}>Cancelar</Button>
          <Button 
            className="bg-danger hover:bg-danger-hover text-white border-0 flex items-center justify-center min-w-[150px]" 
            disabled={isDeleting}
            onClick={async () => {
              if (clientToDelete) {
                setIsDeleting(true);
                try {
                  await deleteUser(clientToDelete.id);
                  showSuccess("Cliente excluído com sucesso!");
                  setClientToDelete(null);
                  setErrorMessage(null);
                } catch (err: any) {
                  setErrorMessage(err.message || "Erro ao excluir cliente.");
                } finally {
                  setIsDeleting(false);
                }
              }
            }}
          >
            {isDeleting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Sim, Excluir Cliente'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Cadastrar Cliente */}
      {addModal.tempIsOpen && (
        <div className={`fixed inset-0 bg-background/90 backdrop-blur-md z-50 flex items-center justify-center p-4 ${addModal.isClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'}`}>
          <div className={`glass-card rounded-xl p-8 w-full max-w-md relative border border-white/10 shadow-2xl ${addModal.isClosing ? 'animate-scale-down' : 'animate-fade-in'}`}>
            <button
              onClick={addModal.close}
              className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-text-muted hover:text-white hover:bg-white/10 transition-all"
            >
              <X size={18} />
            </button>

            <div className="flex flex-col items-center mb-6 mt-2">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-glow-primary mb-3">
                <Building2 size={28} className="text-primary animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold text-white text-center">Cadastrar Novo Cliente</h2>
              <p className="text-sm text-text-muted mt-1 text-center">Adicione os dados da empresa parceira</p>
            </div>

            {errorMessage && (
              <div className="mb-6 p-4 rounded-xl bg-danger/10 border border-danger/20 flex items-start gap-3">
                <div className="p-1 rounded-full bg-danger/20 text-danger shrink-0 mt-0.5">
                  <X size={14} />
                </div>
                <p className="text-sm text-danger-light font-medium">{errorMessage}</p>
              </div>
            )}

            <form onSubmit={handleAddClient} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">Nome do Cliente / Empresa <span className="text-danger">*</span></label>
                <input
                  type="text"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-white placeholder-white/20"
                  placeholder="Ex: TechSol Soluções Ltda."
                  value={newClient.name}
                  onChange={e => setNewClient({...newClient, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">E-mail Corporativo <span className="text-danger">*</span></label>
                <input
                  type="email"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-white placeholder-white/20"
                  placeholder="Ex: contato@empresa.com.br"
                  value={newClient.email}
                  onChange={e => setNewClient({...newClient, email: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">CNPJ ou Documento</label>
                <input
                  type="text"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-white placeholder-white/20"
                  placeholder="Ex: 00.000.000/0001-00"
                  value={newClient.cpfCnpj}
                  onChange={e => setNewClient({...newClient, cpfCnpj: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">Senha Provisória de Acesso <span className="text-danger">*</span></label>
                <input
                  type="text"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-white placeholder-white/20"
                  placeholder="Mínimo 8 caracteres, com letras e números"
                  value={newClient.password}
                  onChange={e => setNewClient({...newClient, password: e.target.value})}
                />
                <p className="text-xs text-text-muted mt-1.5">O cliente usará essa senha no primeiro acesso e poderá alterá-la depois.</p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10 mt-6">
                <button
                  type="button"
                  onClick={addModal.close}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-text-muted hover:text-white hover:bg-white/5 transition-all flex-1 sm:flex-initial text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !newClient.name.trim() || 
                    !newClient.email.includes('@') ||
                    (newClient.cpfCnpj.replace(/\D/g, '').length !== 11 && newClient.cpfCnpj.replace(/\D/g, '').length !== 14) ||
                    newClient.password.length < 8 || 
                    !/[A-Za-z]/.test(newClient.password) || 
                    !/\d/.test(newClient.password)
                  }
                  className="btn btn-primary px-8 py-2.5 text-sm font-semibold rounded-xl shadow-[0_0_15px_rgba(249,115,22,0.3)] flex-1 sm:flex-initial justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Cadastrar'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <NewProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        initialClientId={selectedClientIdForProject}
        onSuccess={() => {
          showSuccess("Novo projeto criado com sucesso!");
        }}
      />

      <Toast message={successMessage} />
    </div>
  );
}
