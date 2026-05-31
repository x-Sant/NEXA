'use client';

import { formatDate, getInitials, getStatusColor, getStatusLabel } from '@/lib/utils';
import { useAuthStore } from '@/lib/auth-store';
import { Role, TicketStatus, Ticket } from '@/types';
import { MessageSquare, Plus, Search, Filter, Clock, CheckCircle2, ChevronDown, ShieldAlert } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useModal } from '@/hooks/useModal';
import { Toast } from '@/components/ui/Toast';
import { useTicketStore } from '@/stores/ticketStore';
import { useUserStore } from '@/stores/userStore';
import { useProjectStore } from '@/stores/projectStore';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

function getTicketAgeDays(createdAt: string): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
}

function SLABadge({ ticket }: { ticket: Ticket }) {
  if (ticket.status === TicketStatus.RESOLVED || ticket.status === TicketStatus.CLOSED) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
        <CheckCircle2 size={10} />
        Resolvido
      </span>
    );
  }
  const days = getTicketAgeDays(ticket.createdAt);
  if (days < 1) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
        <Clock size={10} />
        Dentro do prazo
      </span>
    );
  }
  if (days < 3) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20">
        <Clock size={10} />
        {days} dia{days !== 1 ? 's' : ''} sem resposta
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-danger/10 text-danger border border-danger/20">
      <ShieldAlert size={10} />
      SLA violado · {days} dias
    </span>
  );
}

export default function SuportePage() {
  const { user } = useAuthStore();
  const tickets = useTicketStore(s => s.tickets);
  const responses = useTicketStore(s => s.responses);
  const addTicket = useTicketStore(s => s.addTicket);
  const addResponse = useTicketStore(s => s.addResponse);
  const updateTicketStatus = useTicketStore(s => s.updateTicketStatus);
  const isLoading = useTicketStore(s => s.isLoading);
  const users = useUserStore((s) => s.users);
  const projects = useProjectStore((s) => s.projects);

  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const toggleStatusFilter = (status: string) => {
    setSelectedStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);
  const [responseInputs, setResponseInputs] = useState<Record<string, string>>({});
  const [confirmingTicketId, setConfirmingTicketId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const newTicketModal = useModal();

  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketDescription, setNewTicketDescription] = useState('');
  const [newTicketProjectId, setNewTicketProjectId] = useState('');

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    const timer = setTimeout(() => setSuccessMessage(null), 3500);
    return () => clearTimeout(timer);
  };

  // Tempo médio calculado dinamicamente
  const avgResponseTime = useMemo(() => {
    const resolved = tickets.filter(t => t.status === TicketStatus.RESOLVED || t.status === TicketStatus.CLOSED);
    if (!resolved.length) return '—';
    const totalHours = resolved.reduce((sum, t) => {
      return sum + (new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime()) / 3600000;
    }, 0);
    const avg = totalHours / resolved.length;
    return avg < 24 ? `${avg.toFixed(1)}h` : `${(avg / 24).toFixed(1)} dias`;
  }, [tickets]);

  const handleResolveTicket = () => {
    if (!confirmingTicketId) return;
    updateTicketStatus(confirmingTicketId, TicketStatus.RESOLVED);
    setConfirmingTicketId(null);
    showSuccess("Chamado resolvido com sucesso!");
  };

  const handleSendResponse = (ticketId: string) => {
    const message = responseInputs[ticketId]?.trim();
    if (!message || !user) return;

    const ticket = tickets.find(t => t.id === ticketId);

    const newResponse = {
      id: `tr-${Date.now()}`,
      ticketId,
      authorId: user.id,
      message,
      content: message,
      isStaff: user.role !== Role.CLIENTE,
      createdAt: new Date().toISOString(),
    };

    addResponse(newResponse);

    // If ticket was OPEN, change status to IN_PROGRESS when staff replies
    if (ticket && user.role !== Role.CLIENTE && ticket.status === TicketStatus.OPEN) {
      updateTicketStatus(ticketId, TicketStatus.IN_PROGRESS);
    }

    setResponseInputs(prev => ({
      ...prev,
      [ticketId]: '',
    }));

    showSuccess("Resposta enviada com sucesso!");
  };

  const handleCreateTicket = () => {
    if (!newTicketSubject.trim() || !newTicketDescription.trim() || !user) return;

    const newTicket: Ticket = {
      id: `t-${Date.now()}`,
      projectId: newTicketProjectId || undefined,
      creatorId: user.id,
      subject: newTicketSubject,
      description: newTicketDescription,
      status: TicketStatus.OPEN,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addTicket(newTicket);

    setNewTicketSubject('');
    setNewTicketDescription('');
    setNewTicketProjectId('');
    newTicketModal.close();

    showSuccess("Chamado aberto com sucesso!");
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const ticketId = params.get('id');
      if (ticketId) {
        setExpandedTicketId(ticketId);
        window.history.replaceState(null, '', '/dashboard/suporte');
      }
    }
  }, []);

  // Filter tickets
  const filteredTickets = tickets.filter(ticket => {
    let hasAccess = true;
    if (user?.role !== Role.NIVEL_3 && user?.role !== Role.NIVEL_2) {
      hasAccess = ticket.creatorId === user?.id;
    }
    if (!hasAccess) return false;

    const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(ticket.status);
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ticket.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // SLA summary stats
  const openTickets = tickets.filter(t => t.status === TicketStatus.OPEN || t.status === TicketStatus.IN_PROGRESS);
  const withinSLA = openTickets.filter(t => getTicketAgeDays(t.createdAt) < 3);
  const slaViolated = openTickets.filter(t => getTicketAgeDays(t.createdAt) >= 3);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Suporte</h1>
          <p className="text-sm text-text-muted mt-1">Suporte e atendimento ao cliente</p>
        </div>

        {user && (
          <button
            onClick={newTicketModal.open}
            className="btn btn-primary gap-2 shadow-glow-primary cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus size={18} />
            <span>Novo Chamado</span>
          </button>
        )}
      </div>

      {/* SLA Summary — for NIVEL_2+ */}
      {(user?.role === Role.NIVEL_2 || user?.role === Role.NIVEL_3) && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card rounded-xl p-4">
            <p className="text-xs text-text-muted mb-1">Tickets Abertos</p>
            <p className="text-2xl font-bold text-white">{openTickets.length}</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <p className="text-xs text-text-muted mb-1">Dentro do Prazo</p>
            <p className="text-2xl font-bold text-emerald-400">{withinSLA.length}</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <p className="text-xs text-text-muted mb-1">SLA Violado</p>
            <p className="text-2xl font-bold text-danger">{slaViolated.length}</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <p className="text-xs text-text-muted mb-1">Tempo Médio</p>
            <p className="text-2xl font-bold text-amber-400">{avgResponseTime}</p>
          </div>
        </div>
      )}

      <div className="glass-card rounded-xl p-4 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
          <input
            type="text"
            placeholder="Buscar chamados..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-white placeholder-white/30"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto lg:justify-end">
          <span className="text-xs font-semibold text-text-muted mr-1 flex items-center gap-1">
            <Filter size={14} /> Filtrar:
          </span>

          {(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const).map(status => {
            const isActive = selectedStatuses.includes(status);
            const label = getStatusLabel(status);

            const activeClass = isActive
              ? 'bg-primary/20 text-primary-light border-primary/30 shadow-glow-primary'
              : 'bg-white/5 text-text-muted border-white/10 hover:bg-white/10 hover:text-white';

            return (
              <button
                key={status}
                onClick={() => toggleStatusFilter(status)}
                className={`px-4 py-2 rounded-xl text-xs font-medium border transition-all duration-300 ${activeClass}`}
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
      ) : filteredTickets.length === 0 ? (
        <div className="text-center py-12 glass-card rounded-2xl">
          <MessageSquare className="mx-auto text-text-muted mb-3" size={32} />
          <h3 className="text-lg font-medium text-text-primary">Nenhum chamado encontrado</h3>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTickets.map((ticket, idx) => {
            const isExpanded = expandedTicketId === ticket.id;
            const creator = users.find(u => u.id === ticket.creatorId);
            const project = projects.find(p => p.id === ticket.projectId);
            const ticketResponses = responses
              .filter(r => r.ticketId === ticket.id)
              .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

            return (
              <div key={ticket.id} className={`glass-card rounded-2xl overflow-hidden transition-all duration-300 stagger-${(idx % 8) + 1}`}>
                {/* Header / Summary (Clickable) */}
                <div
                  className={`p-5 flex items-center justify-between cursor-pointer hover:bg-white/5 ${isExpanded ? 'bg-white/5' : ''}`}
                  onClick={() => setExpandedTicketId(isExpanded ? null : ticket.id)}
                >
                  <div className="flex items-center gap-5 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getStatusColor(ticket.status)}`}>
                      {ticket.status === TicketStatus.RESOLVED || ticket.status === TicketStatus.CLOSED ? <CheckCircle2 size={20} /> : <MessageSquare size={20} />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-xs font-mono text-text-muted">#{ticket.id.split('-')[1] || ticket.id}</span>
                        <h3 className="font-semibold text-text-primary truncate">{ticket.subject}</h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
                        <span className="flex items-center gap-1">
                          <span className="w-4 h-4 rounded-full bg-surface flex items-center justify-center text-[8px] font-bold mr-0.5 border border-white/10">
                            {getInitials(creator?.name || '?')}
                          </span>
                          {creator?.name}
                        </span>
                        {project && (
                          <span>• {project.name}</span>
                        )}
                        <span className="flex items-center gap-1"><Clock size={12}/> {formatDate(ticket.createdAt)}</span>

                        {ticketResponses.length > 0 && (
                          <span className="flex items-center gap-1 text-primary-light">
                            <MessageSquare size={12}/> {ticketResponses.length} resposta(s)
                          </span>
                        )}
                        <SLABadge ticket={ticket} />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 ml-4">
                    <div className={`badge ${getStatusColor(ticket.status)} hidden sm:inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold`}>
                      {getStatusLabel(ticket.status)}
                    </div>
                    <ChevronDown
                      size={20}
                      className={`text-text-muted transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </div>
                </div>

                {/* Expanded Content */}
                <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100 border-t border-white/5 bg-surface/30' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden min-h-0">
                    <div className="p-5 md:p-6 space-y-6">
                      <div>
                        <h4 className="text-sm font-medium text-text-muted mb-2">Descrição Original</h4>
                        <div className="bg-surface p-4 rounded-xl text-sm text-text-primary border border-white/5 whitespace-pre-wrap">
                          {ticket.description}
                        </div>
                      </div>

                      {ticketResponses.length > 0 && (
                        <div className="space-y-4">
                          <h4 className="text-sm font-medium text-text-muted">Histórico</h4>
                          <div className="space-y-3 pl-2 border-l-2 border-white/10 ml-2">
                            {ticketResponses.map(resp => {
                              const author = resp.author || users.find(u => u.id === resp.authorId) || (user && user.id === resp.authorId ? user : null);
                              const isStaff = author?.role !== Role.CLIENTE;
                              return (
                                <div key={resp.id} className="relative pl-6">
                                  <div className={`absolute -left-[21px] top-0 w-10 h-10 rounded-full border-4 border-surface flex items-center justify-center text-[10px] font-bold ${isStaff ? 'bg-primary text-white' : 'bg-surface-active text-text-primary'}`}>
                                    {getInitials(author?.name || '?')}
                                  </div>
                                  <div className={`p-4 rounded-xl text-sm border ${isStaff ? 'bg-primary/5 border-primary/20 text-primary-light' : 'bg-surface border-white/5 text-text-primary'}`}>
                                    <div className="flex justify-between items-center mb-2">
                                      <span className="font-semibold">{author?.name}</span>
                                      <span className="text-xs text-text-muted">{formatDate(resp.createdAt)}</span>
                                    </div>
                                    <p className="whitespace-pre-wrap">{resp.message}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {ticket.status !== TicketStatus.CLOSED && (
                        <div className="pt-4 border-t border-white/5">
                          <textarea
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-white placeholder-white/40 min-h-[100px] resize-none mb-3"
                            placeholder="Escreva sua resposta..."
                            value={responseInputs[ticket.id] || ''}
                            onChange={(e) => setResponseInputs(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                          />
                          <div className="flex justify-end gap-3 flex-wrap">
                            {ticket.status === TicketStatus.RESOLVED && (user?.role === Role.NIVEL_2 || user?.role === Role.NIVEL_3) && (
                              <button
                                onClick={() => updateTicketStatus(ticket.id, TicketStatus.CLOSED)}
                                className="text-xs text-white/40 hover:text-white/70 transition-colors"
                              >
                                Fechar chamado
                              </button>
                            )}
                            {user?.role !== Role.CLIENTE && ticket.status !== TicketStatus.RESOLVED && (
                              <button
                                className="btn btn-secondary text-info hover:bg-info/10 hover:border-info/30"
                                onClick={() => setConfirmingTicketId(ticket.id)}
                              >
                                Marcar como Resolvido
                              </button>
                            )}
                            <button
                              className="btn btn-primary"
                              onClick={() => handleSendResponse(ticket.id)}
                              disabled={!responseInputs[ticket.id]?.trim()}
                            >
                              Enviar Resposta
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Confirmar Resolução */}
      <ConfirmDialog
        isOpen={!!confirmingTicketId}
        onClose={() => setConfirmingTicketId(null)}
        onConfirm={handleResolveTicket}
        title="Resolver Chamado"
        message="Esta ação marcará o chamado como resolvido. O cliente verá o status atualizado ao acessar a plataforma."
        confirmLabel="Marcar como Resolvido"
        cancelLabel="Cancelar"
        variant="default"
      />

      {/* Modal Novo Chamado */}
      <Modal isOpen={newTicketModal.isOpen} onClose={newTicketModal.close} size="md">
        <Modal.Header title="Novo Chamado" onClose={newTicketModal.close} />
        <Modal.Body className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">
              Assunto / Título <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-white placeholder-white/20"
              placeholder="Ex: Erro ao carregar página de faturamento"
              value={newTicketSubject}
              onChange={e => setNewTicketSubject(e.target.value)}
            />
          </div>

          {user?.role !== Role.PROFESSOR && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-muted">Projeto Relacionado</label>
              <select
                value={newTicketProjectId}
                onChange={e => setNewTicketProjectId(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all bg-[#1b1c21] cursor-pointer"
              >
                <option value="" className="bg-background text-text-muted">Nenhum / Suporte Geral</option>
                {(user?.role === Role.CLIENTE
                  ? projects.filter(p => p.clientId === user.id)
                  : projects
                ).map(proj => (
                  <option key={proj.id} value={proj.id} className="bg-background text-white">
                    {proj.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">
              Descrição do Problema <span className="text-danger">*</span>
            </label>
            <textarea
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-white placeholder-white/20 min-h-[120px] resize-none"
              placeholder="Descreva detalhadamente o que está acontecendo..."
              value={newTicketDescription}
              onChange={e => setNewTicketDescription(e.target.value)}
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={newTicketModal.close}>Cancelar</Button>
          <Button
            onClick={handleCreateTicket}
            disabled={!newTicketSubject.trim() || !newTicketDescription.trim()}
          >
            Enviar Chamado
          </Button>
        </Modal.Footer>
      </Modal>

      <Toast message={successMessage} />
    </div>
  );
}
