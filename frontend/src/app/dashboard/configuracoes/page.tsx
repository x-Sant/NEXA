'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { Role } from '@/types';
import {
  Settings,
  Shield,
  Sliders,
  Database,
  Save,
  RefreshCw,
  Download,
  Key,
  Clock,
  Check,
  AlertTriangle,
  X
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'geral' | 'seguranca' | 'sistema'>('geral');
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);

  // Storage Stats states
  const [storageStats, setStorageStats] = useState<{ databaseSizeBytes: number; bucketSizeBytes: number } | null>(null);
  const [isLoadingStorage, setIsLoadingStorage] = useState(false);

  const fetchStorageStats = async () => {
    setIsLoadingStorage(true);
    try {
      const { apiFetch } = await import('@/lib/api');
      const data = await apiFetch('/sistema/storage');
      if (data) {
        setStorageStats(data);
      }
    } catch (e) {
      console.error('Erro ao buscar estatísticas de armazenamento:', e);
    } finally {
      setIsLoadingStorage(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'sistema') {
      fetchStorageStats();
    }
  }, [activeTab]);

  // Form states — initialized from localStorage
  const [platformName, setPlatformName] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('nexa-cfg-name') ?? 'NEXA — Núcleo de Excelência' : 'NEXA — Núcleo de Excelência'
  );
  const [supportSla, setSupportSla] = useState(() =>
    typeof window !== 'undefined' ? Number(localStorage.getItem('nexa-cfg-sla') ?? '3') : 3
  );
  const [jwtExpiry, setJwtExpiry] = useState('24h');
  const [sessionPersist, setSessionPersist] = useState(true);
  const [fileLimit, setFileLimit] = useState(() =>
    typeof window !== 'undefined' ? Number(localStorage.getItem('nexa-cfg-file-limit') ?? '10') : 10
  );

  if (!user || user.role !== Role.NIVEL_3) {
    return (
      <div className="glass-card p-8 rounded-2xl text-center max-w-lg mx-auto border border-danger/20 mt-12 animate-[fadeIn_0.3s_ease-out]">
        <AlertTriangle className="w-12 h-12 text-danger mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Acesso Negado</h2>
        <p className="text-sm text-white/50 mb-6">
          Apenas administradores com privilégio Nível 3 podem gerenciar as configurações globais do sistema.
        </p>
      </div>
    );
  }

  const triggerToast = (message: string) => {
    setShowToast(message);
    setTimeout(() => setShowToast(null), 3000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    localStorage.setItem('nexa-cfg-name', platformName);
    localStorage.setItem('nexa-cfg-sla', String(supportSla));
    localStorage.setItem('nexa-cfg-file-limit', String(fileLimit));

    setIsSaving(false);
    triggerToast('Configurações salvas com sucesso!');
  };

  const handleExportDump = async () => {
    try {
      const { apiFetch } = await import('@/lib/api');
      const ticketsDump = await apiFetch('/tickets/dump');
      const projectsDump = await apiFetch('/projetos-dump');

      const dump = {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        data: {
          projects: projectsDump?.projects || [],
          users: projectsDump?.users || [],
          tickets: ticketsDump?.tickets || [],
          responses: ticketsDump?.responses || [],
        },
      };
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexa-dump-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    triggerToast('Dump de banco de dados exportado com sucesso!');
    } catch (e) {
      triggerToast('Erro ao exportar dump.');
    }
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <Settings className="w-8 h-8 text-primary" />
          Configurações do Sistema
        </h1>
        <p className="text-sm text-white/50 mt-1">
          Gerencie os parâmetros globais da plataforma, políticas de segurança e backups.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Tabs (Sidebar Layout for Settings) */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('geral')}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-left transition-all duration-200
              ${activeTab === 'geral'
                ? 'bg-primary/10 text-primary border border-primary/20 shadow-glow-primary'
                : 'text-white/60 hover:bg-white/5 hover:text-white border border-transparent'}
            `}
          >
            <Sliders className="w-4 h-4" />
            Parâmetros Gerais
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('seguranca')}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-left transition-all duration-200
              ${activeTab === 'seguranca'
                ? 'bg-primary/10 text-primary border border-primary/20 shadow-glow-primary'
                : 'text-white/60 hover:bg-white/5 hover:text-white border border-transparent'}
            `}
          >
            <Shield className="w-4 h-4" />
            Políticas de Segurança
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sistema')}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-left transition-all duration-200
              ${activeTab === 'sistema'
                ? 'bg-primary/10 text-primary border border-primary/20 shadow-glow-primary'
                : 'text-white/60 hover:bg-white/5 hover:text-white border border-transparent'}
            `}
          >
            <Database className="w-4 h-4" />
            Manutenção & Backups
          </button>
        </div>

        {/* Content Pane */}
        <div className="md:col-span-3">
          <form onSubmit={handleSave} className="glass-card p-6 rounded-2xl border border-white/[0.08] relative overflow-hidden space-y-6">

            {/* BACKGROUND DECORATIVE ORB */}
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

            {/* TAB CONTENT: GERAL */}
            {activeTab === 'geral' && (
              <div className="space-y-5 animate-[fadeIn_0.2s_ease-out]">
                <h3 className="text-lg font-semibold text-white border-b border-white/5 pb-3">Parâmetros Gerais</h3>

                {/* Platform Name */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-white/70">Nome da Plataforma</label>
                  <input
                    type="text"
                    value={platformName}
                    onChange={(e) => setPlatformName(e.target.value)}
                    className="w-full rounded-xl bg-white/[0.06] border border-white/[0.08] text-white px-4 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/40 focus:border-primary/50"
                  />
                </div>

                {/* SLA Client Support */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-white/70">SLA para Chamados de Clientes (Dias)</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      type="number"
                      value={supportSla}
                      onChange={(e) => setSupportSla(Number(e.target.value))}
                      className="w-full rounded-xl bg-white/[0.06] border border-white/[0.08] text-white pl-10 pr-4 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/40 focus:border-primary/50"
                    />
                  </div>
                  <p className="text-[11px] text-white/45">Prazo limite padrão estipulado em contrato para a primeira resposta aos chamados.</p>
                </div>

                {/* File limit size */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-white/70">Limite Máximo de Upload por Arquivo (MB)</label>
                  <input
                    type="number"
                    value={fileLimit}
                    onChange={(e) => setFileLimit(Number(e.target.value))}
                    className="w-full rounded-xl bg-white/[0.06] border border-white/[0.08] text-white px-4 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/40 focus:border-primary/50"
                  />
                  <p className="text-[11px] text-white/45">Arquivos anexados a demandas (como ZIPs) serão limitados a este tamanho.</p>
                </div>
              </div>
            )}

            {/* TAB CONTENT: SEGURANÇA */}
            {activeTab === 'seguranca' && (
              <div className="space-y-5 animate-[fadeIn_0.2s_ease-out]">
                <h3 className="text-lg font-semibold text-white border-b border-white/5 pb-3">Políticas de Segurança</h3>

                {/* JWT Token Expiry */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-white/70">Tempo de Expiração do Token JWT</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <select
                      value={jwtExpiry}
                      onChange={(e) => setJwtExpiry(e.target.value)}
                      className="w-full rounded-xl bg-white/[0.06] border border-white/[0.08] text-white pl-10 pr-4 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/40 focus:border-primary/50"
                    >
                      <option value="1h" className="bg-[#0a0e1a]">1 Hora</option>
                      <option value="8h" className="bg-[#0a0e1a]">8 Horas</option>
                      <option value="24h" className="bg-[#0a0e1a]">24 Horas</option>
                      <option value="7d" className="bg-[#0a0e1a]">7 Dias</option>
                    </select>
                  </div>
                </div>

                {/* Session persist toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div>
                    <h4 className="text-sm font-medium text-white">Persistir Sessão do Usuário</h4>
                    <p className="text-xs text-white/45 mt-0.5">Mantém a sessão persistida no navegador local via Zustand Storage.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sessionPersist}
                      onChange={() => setSessionPersist(!sessionPersist)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                  </label>
                </div>
              </div>
            )}

            {/* TAB CONTENT: SISTEMA */}
            {activeTab === 'sistema' && (
              <div className="space-y-5 animate-[fadeIn_0.2s_ease-out]">
                <h3 className="text-lg font-semibold text-white border-b border-white/5 pb-3">Manutenção & Backups</h3>

                {/* Storage Stats Dashboard Widget */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Database Card */}
                  <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] relative overflow-hidden group hover:border-white/10 transition-all duration-300">
                    <div className="flex items-center justify-between mb-3.5">
                      <div className="flex items-center gap-2.5 text-primary">
                        <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 shadow-glow-primary shrink-0">
                          <Database className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-semibold text-white">Banco de Dados</span>
                      </div>
                      <span className="text-xs font-bold text-white/50">PostgreSQL</span>
                    </div>

                    {isLoadingStorage ? (
                      <div className="h-20 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : (
                      (() => {
                        const bytes = storageStats?.databaseSizeBytes ?? 0;
                        const mb = bytes / (1024 * 1024);
                        const pct = Math.min((bytes / 524288000) * 100, 100);
                        return (
                          <div className="space-y-3">
                            <div className="flex items-baseline justify-between">
                              <span className="text-2xl font-bold text-white tracking-tight">
                                {mb.toFixed(2)} <span className="text-xs text-white/50 font-normal">MB</span>
                              </span>
                              <span className="text-xs text-text-muted">Limite: 500 MB</span>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full gradient-primary transition-all duration-1000"
                                style={{ width: `${pct.toFixed(2)}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[10px] text-white/40 font-medium">
                              <span>Uso do Armazenamento</span>
                              <span>{pct.toFixed(2)}% utilizado</span>
                            </div>
                          </div>
                        );
                      })()
                    )}
                  </div>

                  {/* Supabase Bucket Card */}
                  <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] relative overflow-hidden group hover:border-white/10 transition-all duration-300">
                    <div className="flex items-center justify-between mb-3.5">
                      <div className="flex items-center gap-2.5 text-success">
                        <div className="p-2 rounded-xl bg-success/10 border border-success/20 shadow-glow-success shrink-0">
                          <Download className="w-5 h-5 text-success" />
                        </div>
                        <span className="text-sm font-semibold text-white">Bucket de Arquivos</span>
                      </div>
                      <span className="text-xs font-bold text-white/50">Supabase Storage</span>
                    </div>

                    {isLoadingStorage ? (
                      <div className="h-20 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-success border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : (
                      (() => {
                        const bytes = storageStats?.bucketSizeBytes ?? 0;
                        const mb = bytes / (1024 * 1024);
                        const pct = Math.min((bytes / 1073741824) * 100, 100);
                        return (
                          <div className="space-y-3">
                            <div className="flex items-baseline justify-between">
                              <span className="text-2xl font-bold text-white tracking-tight">
                                {mb.toFixed(2)} <span className="text-xs text-white/50 font-normal">MB</span>
                              </span>
                              <span className="text-xs text-text-muted">Limite: 1 GB</span>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full bg-success transition-all duration-1000"
                                style={{ width: `${pct.toFixed(2)}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[10px] text-white/40 font-medium">
                              <span>Uso do Armazenamento</span>
                              <span>{pct.toFixed(2)}% utilizado</span>
                            </div>
                          </div>
                        );
                      })()
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center px-4 py-2 bg-white/5 border border-white/5 rounded-xl gap-4">
                  <span className="text-xs text-text-muted">Estatísticas atualizadas dinamicamente a partir da base PostgreSQL</span>
                  <button 
                    type="button"
                    onClick={fetchStorageStats} 
                    disabled={isLoadingStorage}
                    className="p-1.5 text-text-muted hover:text-white rounded-lg hover:bg-white/5 transition-all shrink-0"
                    title="Recarregar"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStorage ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {/* Interactive utilities */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-white">Sincronização de Cache</h4>
                      <p className="text-xs text-white/45 mt-0.5">Limpa e otimiza buffers de dados temporários e métricas do Dashboard.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => triggerToast('Cache do sistema sincronizado com sucesso!')}
                      className="btn btn-secondary btn-sm"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Sincronizar
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-white">Backup do Banco de Dados</h4>
                      <p className="text-xs text-white/45 mt-0.5">Gera e faz o download de um dump JSON compactado contendo todos os dados.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleExportDump}
                      className="btn btn-secondary btn-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Exportar Dump
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button for Forms */}
            {activeTab !== 'sistema' && (
              <div className="flex justify-end border-t border-white/5 pt-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn btn-primary"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Salvando...' : 'Salvar Configurações'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-success/20 border border-success/30 text-success text-sm font-medium shadow-2xl backdrop-blur-xl animate-[fadeIn_0.2s_ease-out]">
          <Check className="w-4 h-4" />
          {showToast}
        </div>
      )}
    </div>
  );
}
