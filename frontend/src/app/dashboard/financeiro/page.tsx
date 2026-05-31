'use client';

import { formatCurrency, formatDate } from '@/lib/utils';
import { FinancialStatus, FinancialType, FinancialEntry } from '@/types';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowDownRight, ArrowUpRight, DollarSign, Plus, Wallet, X, Download, Search } from 'lucide-react';
import { useState, useMemo, useRef } from 'react';
import { useModal } from '@/hooks/useModal';
import { Toast } from '@/components/ui/Toast';
import { useFinancialStore } from '@/stores/financialStore';
import { useProjectStore } from '@/stores/projectStore';
import { useAuthStore } from '@/lib/auth-store';
import { Role } from '@/types';
import { StatusBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function exportFinanceiroCSV(entries: FinancialEntry[]) {
  const header = ['Descrição', 'Tipo', 'Valor (R$)', 'Vencimento', 'Status', 'Categoria'];
  const rows = entries.map(e => [
    e.description,
    e.type === 'RECEIVABLE' ? 'Receita' : 'Despesa',
    e.amount.toFixed(2).replace('.', ','),
    new Date(e.dueDate).toLocaleDateString('pt-BR'),
    e.status,
    e.category || 'Geral',
  ]);
  const lines = [header.join(';'), ...rows.map(r => r.map(v => `"${v}"`).join(';'))];
  const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'financeiro.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function exportFinanceiroPDF(entries: FinancialEntry[]) {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Relatório Financeiro', 14, 22);
  
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);

  const tableColumn = ["Descrição", "Tipo", "Valor", "Vencimento", "Status", "Categoria"];
  const tableRows = entries.map(e => [
    e.description,
    e.type === 'RECEIVABLE' ? 'Receita' : 'Despesa',
    e.amount.toFixed(2).replace('.', ','),
    new Date(e.dueDate).toLocaleDateString('pt-BR'),
    e.status,
    e.category || 'Geral',
  ]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 40,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [41, 128, 185] },
  });

  doc.save('financeiro.pdf');
}

export default function FinanceiroPage() {
  const { user } = useAuthStore();

  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  if (!user || user.role !== Role.NIVEL_3) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center glass-card rounded-2xl p-8 max-w-lg mx-auto mt-12 border border-danger/20 animate-[fadeIn_0.3s_ease-out]">
        <DollarSign className="text-danger mb-4" size={48} />
        <h2 className="text-xl font-bold text-white mb-2">Acesso Negado</h2>
        <p className="text-sm text-text-muted">Você não possui permissão para acessar o painel financeiro.</p>
      </div>
    );
  }

  const toggleTypeFilter = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const addModal = useModal();
  const reportModal = useModal();
  const allEntriesRef = useRef<HTMLDivElement>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // States for report modal filters
  const [reportSearch, setReportSearch] = useState('');
  const [reportType, setReportType] = useState<string>('ALL');
  const [reportStatus, setReportStatus] = useState<string>('ALL');

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    const timer = setTimeout(() => setSuccessMessage(null), 3500);
    return () => clearTimeout(timer);
  };

  const [newEntry, setNewEntry] = useState({
    description: '',
    amount: '',
    dueDate: '',
    type: FinancialType.RECEIVABLE,
    status: FinancialStatus.PENDING,
    category: '',
    projectId: '',
  });

  // Store selectors
  const entries = useFinancialStore((s) => s.entries);
  const addEntry = useFinancialStore((s) => s.addEntry);
  const isLoading = useFinancialStore((s) => s.isLoading);
  const getTotalRevenue = useFinancialStore((s) => s.getTotalRevenue);
  const getTotalExpenses = useFinancialStore((s) => s.getTotalExpenses);
  const getBalance = useFinancialStore((s) => s.getBalance);
  const getOverdue = useFinancialStore((s) => s.getOverdue);
  const projects = useProjectStore((s) => s.projects);

  const totalRevenue = getTotalRevenue();
  const totalExpenses = getTotalExpenses();
  const balance = getBalance();
  const overdue = getOverdue();

  // Chart data derived from real entries
  const chartData = useMemo(() => {
    const months: Record<string, { mes: string; receita: number; despesa: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      months[key] = { mes: label, receita: 0, despesa: 0 };
    }
    entries.forEach((e) => {
      if (e.status !== FinancialStatus.PAID) return;
      const d = new Date(e.dueDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!months[key]) return;
      if (e.type === FinancialType.RECEIVABLE) months[key].receita += e.amount;
      else months[key].despesa += e.amount;
    });
    return Object.values(months);
  }, [entries]);

  const filteredEntries = useMemo(
    () =>
      entries
        .filter(e => selectedTypes.length === 0 || selectedTypes.includes(e.type))
        .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()),
    [entries, selectedTypes]
  );

  const reportFilteredEntries = useMemo(() => {
    return entries
      .filter((e) => {
        const matchesSearch = e.description.toLowerCase().includes(reportSearch.toLowerCase()) || 
          (e.category && e.category.toLowerCase().includes(reportSearch.toLowerCase()));
        const matchesType = reportType === 'ALL' || e.type === reportType;
        const matchesStatus = reportStatus === 'ALL' || e.status === reportStatus;
        return matchesSearch && matchesType && matchesStatus;
      })
      .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
  }, [entries, reportSearch, reportType, reportStatus]);

  const reportSummary = useMemo(() => {
    let revenue = 0;
    let expenses = 0;
    reportFilteredEntries.forEach((e) => {
      if (e.status === FinancialStatus.PAID) {
        if (e.type === FinancialType.RECEIVABLE) revenue += e.amount;
        else expenses += e.amount;
      }
    });
    return {
      revenue,
      expenses,
      balance: revenue - expenses
    };
  }, [reportFilteredEntries]);

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntry.description || !newEntry.amount || !newEntry.dueDate) return;

    const entry: FinancialEntry = {
      id: `fin-${Date.now()}`,
      description: newEntry.description,
      amount: parseFloat(newEntry.amount),
      dueDate: new Date(newEntry.dueDate).toISOString(),
      type: newEntry.type,
      status: newEntry.status,
      category: newEntry.category || undefined,
      projectId: newEntry.projectId || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addEntry(entry);
    addModal.close();
    setNewEntry({
      description: '',
      amount: '',
      dueDate: '',
      type: FinancialType.RECEIVABLE,
      status: FinancialStatus.PENDING,
      category: '',
      projectId: '',
    });
    showSuccess('Lançamento financeiro registrado com sucesso!');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Financeiro</h1>
          <p className="text-sm text-text-muted mt-1">Gestão de receitas e despesas</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportFinanceiroCSV(filteredEntries)}
            className="btn btn-secondary gap-2"
          >
            <Download size={16} />
            Exportar CSV
          </button>
          <button
            onClick={addModal.open}
            className="btn btn-primary gap-2"
          >
            <Plus size={18} />
            Novo Lançamento
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl border-t-4 border-t-success stagger-1">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-text-muted mb-1">Receitas (Pagas)</p>
              <h3 className="text-2xl font-bold text-text-primary">{formatCurrency(totalRevenue)}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center">
              <ArrowUpRight size={20} />
            </div>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border-t-4 border-t-danger stagger-2">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-text-muted mb-1">Despesas (Pagas)</p>
              <h3 className="text-2xl font-bold text-text-primary">{formatCurrency(totalExpenses)}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-danger/10 text-danger flex items-center justify-center">
              <ArrowDownRight size={20} />
            </div>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border-t-4 border-t-primary stagger-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-text-muted mb-1">Saldo Atual</p>
              <h3 className="text-2xl font-bold text-text-primary">{formatCurrency(balance)}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-glow-primary">
              <Wallet size={20} />
            </div>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border-t-4 border-t-warning stagger-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-text-muted mb-1">Vencido</p>
              <h3 className="text-2xl font-bold text-text-primary">{formatCurrency(overdue)}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-warning/10 text-warning flex items-center justify-center">
              <DollarSign size={20} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="xl:col-span-2 glass-card rounded-2xl p-6 stagger-5">
          <h3 className="text-lg font-semibold mb-6">Fluxo de Caixa (6 meses)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorDespesa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="mes" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$ ${value / 1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0c1220', borderColor: '#1e293b', borderRadius: '12px' }}
                  itemStyle={{ fontSize: '14px' }}
                  formatter={(value: unknown) => [formatCurrency(Number(value)), '']}
                />
                <Area type="monotone" dataKey="receita" name="Receita" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorReceita)" />
                <Area type="monotone" dataKey="despesa" name="Despesa" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorDespesa)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transactions List */}
        <div ref={allEntriesRef} className="glass-card rounded-2xl p-0 overflow-hidden flex flex-col stagger-6">
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Lançamentos Recentes</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleTypeFilter(FinancialType.RECEIVABLE)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-300 transform hover:scale-[1.03] active:scale-[0.97] cursor-pointer ${
                  selectedTypes.includes(FinancialType.RECEIVABLE)
                    ? 'bg-primary/20 text-primary-light border-primary/30 shadow-glow-primary'
                    : 'bg-white/5 text-text-muted border-white/10 hover:bg-white/10 hover:text-white'
                }`}
              >
                Receitas
              </button>
              <button
                onClick={() => toggleTypeFilter(FinancialType.PAYABLE)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-300 transform hover:scale-[1.03] active:scale-[0.97] cursor-pointer ${
                  selectedTypes.includes(FinancialType.PAYABLE)
                    ? 'bg-primary/20 text-primary-light border-primary/30 shadow-glow-primary'
                    : 'bg-white/5 text-text-muted border-white/10 hover:bg-white/10 hover:text-white'
                }`}
              >
                Despesas
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[400px]">
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="text-center py-12 text-sm text-text-muted italic">Nenhum lançamento encontrado</div>
            ) : (
              <ul className="divide-y divide-white/5">
                {filteredEntries.slice(0, 10).map((entry) => {
                  const isReceivable = entry.type === FinancialType.RECEIVABLE;
                  return (
                    <li key={entry.id} className="p-4 hover:bg-white/5 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isReceivable ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                            {isReceivable ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-text-primary line-clamp-1" title={entry.description}>{entry.description}</p>
                            <p className="text-xs text-text-muted mt-0.5">{entry.category || 'Geral'} • {formatDate(entry.dueDate)}</p>
                          </div>
                        </div>
                        <div className="text-right pl-3">
                          <p className={`text-sm font-bold whitespace-nowrap ${isReceivable ? 'text-success' : 'text-danger'}`}>
                            {isReceivable ? '+' : '-'}{formatCurrency(entry.amount)}
                          </p>
                          <StatusBadge status={entry.status} className="mt-1 text-[9px] px-1.5 py-0" />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="px-5 py-2 border-t border-white/5 text-xs text-text-muted text-center">
            Exibindo {Math.min(10, filteredEntries.length)} de {filteredEntries.length} lançamentos
          </div>
          <div className="p-3 border-t border-white/5 text-center">
            <button
              className="text-sm text-primary hover:underline cursor-pointer"
              onClick={reportModal.open}
            >
              Ver relatório completo
            </button>
          </div>
        </div>
      </div>

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
                <DollarSign size={28} className="text-primary animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold text-white text-center">Novo Lançamento</h2>
              <p className="text-sm text-text-muted mt-1 text-center">Cadastre uma receita ou despesa</p>
            </div>

            <form onSubmit={handleAddEntry} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">Descrição <span className="text-danger">*</span></label>
                <input
                  type="text"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-white placeholder-white/20"
                  placeholder="Ex: Mensalidade Portal TechSol"
                  value={newEntry.description}
                  onChange={e => setNewEntry({ ...newEntry, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">Valor (R$) <span className="text-danger">*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-white placeholder-white/20"
                    placeholder="0.00"
                    value={newEntry.amount}
                    onChange={e => setNewEntry({ ...newEntry, amount: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">Vencimento <span className="text-danger">*</span></label>
                  <input
                    type="date"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-white"
                    style={{ colorScheme: 'dark' }}
                    value={newEntry.dueDate}
                    onChange={e => setNewEntry({ ...newEntry, dueDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">Tipo <span className="text-danger">*</span></label>
                  <select
                    required
                    className="w-full bg-[#1b1c21] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-white cursor-pointer"
                    value={newEntry.type}
                    onChange={e => setNewEntry({ ...newEntry, type: e.target.value as FinancialType })}
                  >
                    <option value={FinancialType.RECEIVABLE}>Receita</option>
                    <option value={FinancialType.PAYABLE}>Despesa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">Status <span className="text-danger">*</span></label>
                  <select
                    required
                    className="w-full bg-[#1b1c21] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-white cursor-pointer"
                    value={newEntry.status}
                    onChange={e => setNewEntry({ ...newEntry, status: e.target.value as FinancialStatus })}
                  >
                    <option value={FinancialStatus.PENDING}>Pendente</option>
                    <option value={FinancialStatus.PAID}>Pago</option>
                    <option value={FinancialStatus.OVERDUE}>Vencido</option>
                    <option value={FinancialStatus.CANCELLED}>Cancelado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">Categoria</label>
                  <input
                    type="text"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-white placeholder-white/20"
                    placeholder="Ex: Infraestrutura"
                    value={newEntry.category}
                    onChange={e => setNewEntry({ ...newEntry, category: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">Projeto Associado</label>
                  <select
                    className="w-full bg-[#1b1c21] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-white cursor-pointer"
                    value={newEntry.projectId}
                    onChange={e => setNewEntry({ ...newEntry, projectId: e.target.value })}
                  >
                    <option value="">Nenhum</option>
                    {projects.map(proj => (
                      <option key={proj.id} value={proj.id}>{proj.name}</option>
                    ))}
                  </select>
                </div>
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
                  className="btn btn-primary px-8 py-2.5 text-sm font-semibold rounded-xl shadow-[0_0_15px_rgba(249,115,22,0.3)] flex-1 sm:flex-initial justify-center"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {reportModal.isOpen && (
        <Modal isOpen={reportModal.isOpen} onClose={reportModal.close} size="xl">
          <Modal.Header title="Relatório Financeiro Completo" onClose={reportModal.close} />
          <Modal.Body className="max-h-[70vh] overflow-y-auto custom-scrollbar flex flex-col gap-6">
            {/* Summary Mini Cards inside Modal */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-success/5 border border-success/20 rounded-xl p-3.5 flex justify-between items-center">
                <div>
                  <p className="text-[11px] font-medium text-text-muted mb-0.5">Receitas (Pagas)</p>
                  <h4 className="text-lg font-bold text-success">{formatCurrency(reportSummary.revenue)}</h4>
                </div>
                <ArrowUpRight size={18} className="text-success" />
              </div>
              <div className="bg-danger/5 border border-danger/20 rounded-xl p-3.5 flex justify-between items-center">
                <div>
                  <p className="text-[11px] font-medium text-text-muted mb-0.5">Despesas (Pagas)</p>
                  <h4 className="text-lg font-bold text-danger">{formatCurrency(reportSummary.expenses)}</h4>
                </div>
                <ArrowDownRight size={18} className="text-danger" />
              </div>
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3.5 flex justify-between items-center">
                <div>
                  <p className="text-[11px] font-medium text-text-muted mb-0.5">Saldo Líquido</p>
                  <h4 className="text-lg font-bold text-primary">{formatCurrency(reportSummary.balance)}</h4>
                </div>
                <Wallet size={18} className="text-primary" />
              </div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white/5 border border-white/10 rounded-xl p-4">
              {/* Search Input */}
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                <input
                  type="text"
                  placeholder="Buscar por descrição ou categoria..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-white placeholder-white/30"
                  value={reportSearch}
                  onChange={(e) => setReportSearch(e.target.value)}
                />
              </div>

              {/* Select Type & Status */}
              <div className="flex gap-3 w-full md:w-auto flex-wrap">
                <div className="w-[120px]">
                  <select
                    className="w-full bg-[#1b1c21] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                  >
                    <option value="ALL">Todos os Tipos</option>
                    <option value="RECEIVABLE">Receitas</option>
                    <option value="PAYABLE">Despesas</option>
                  </select>
                </div>

                <div className="w-[130px]">
                  <select
                    className="w-full bg-[#1b1c21] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
                    value={reportStatus}
                    onChange={(e) => setReportStatus(e.target.value)}
                  >
                    <option value="ALL">Todos os Status</option>
                    <option value="PAID">Pago</option>
                    <option value="PENDING">Pendente</option>
                    <option value="OVERDUE">Vencido</option>
                    <option value="CANCELLED">Cancelado</option>
                  </select>
                </div>

                {/* Export Button inside Modal */}
                <div className="flex gap-2">
                  <button
                    onClick={() => exportFinanceiroCSV(reportFilteredEntries)}
                    className="btn btn-secondary btn-sm gap-1.5 whitespace-nowrap"
                  >
                    <Download size={14} />
                    CSV
                  </button>
                  <button
                    onClick={() => exportFinanceiroPDF(reportFilteredEntries)}
                    className="btn btn-primary btn-sm gap-1.5 whitespace-nowrap"
                  >
                    <Download size={14} />
                    PDF
                  </button>
                </div>
              </div>
            </div>

            {/* Table Container */}
            <div className="border border-white/10 rounded-xl overflow-hidden bg-white/2 max-h-[300px] overflow-y-auto custom-scrollbar">
              {reportFilteredEntries.length === 0 ? (
                <div className="text-center py-12 text-xs text-text-muted italic">
                  Nenhum lançamento encontrado para os filtros selecionados.
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10 text-[10px] uppercase font-bold text-text-muted tracking-wider">
                      <th className="p-3 pl-4">Lançamento</th>
                      <th className="p-3">Categoria</th>
                      <th className="p-3">Vencimento</th>
                      <th className="p-3">Tipo</th>
                      <th className="p-3 text-right">Valor</th>
                      <th className="p-3 pr-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {reportFilteredEntries.map((entry) => {
                      const isReceivable = entry.type === FinancialType.RECEIVABLE;
                      return (
                        <tr key={entry.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-3 pl-4 font-medium text-white max-w-[200px] truncate" title={entry.description}>
                            {entry.description}
                          </td>
                          <td className="p-3 text-text-muted">{entry.category || 'Geral'}</td>
                          <td className="p-3 text-text-muted">{formatDate(entry.dueDate)}</td>
                          <td className="p-3">
                            <span className={`inline-flex items-center gap-1 font-semibold ${isReceivable ? 'text-success' : 'text-danger'}`}>
                              {isReceivable ? 'Receita' : 'Despesa'}
                            </span>
                          </td>
                          <td className="p-3 text-right font-bold text-white">
                            {formatCurrency(entry.amount)}
                          </td>
                          <td className="p-3 pr-4 text-center">
                            <StatusBadge status={entry.status} className="text-[9px] px-2 py-0 border-none" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="ghost" onClick={reportModal.close}>
              Fechar
            </Button>
          </Modal.Footer>
        </Modal>
      )}
      <Toast message={successMessage} />
    </div>
  );
}
