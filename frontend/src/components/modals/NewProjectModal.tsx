'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UploadCloud, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Modal } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

import { createProjectSchema, CreateProjectInput } from '@/schemas/project';
import { useAuthStore } from '@/lib/auth-store';
import { useProjectStore } from '@/stores/projectStore';
import { useUserStore } from '@/stores/userStore';
import { useToast } from '@/hooks/useToast';
import { getInitials } from '@/lib/utils';
import { apiFetch } from '@/lib/api';
import { Role, ContractStatus, Project, Contract, ProjectStatus } from '@/types';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialClientId?: string;
  onSuccess?: () => void;
}

export default function NewProjectModal({
  isOpen,
  onClose,
  initialClientId,
  onSuccess,
}: NewProjectModalProps) {
  const { user } = useAuthStore();
  const { addProject, addProjectFiles, addContract, projects } = useProjectStore();
  const { users } = useUserStore();
  const { showSuccess, ToastComponent } = useToast();
  const router = useRouter();

  const [contractFile, setContractFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateProjectInput & { selectedMembers: string[]; files: File[] }>({
    resolver: zodResolver(createProjectSchema) as any,
    defaultValues: {
      name: '',
      description: '',
      clientId: initialClientId ?? '',
      deadline: '',
      selectedMembers: [],
      files: [],
    },
  });

  const selectedMembers = watch('selectedMembers') ?? [];
  const files = watch('files') ?? [];

  // Sync initialClientId when modal reopens
  useEffect(() => {
    if (isOpen) {
      setValue('clientId', initialClientId ?? '');
    }
  }, [isOpen, initialClientId, setValue]);

  const clients = users.filter((u) => u.role === Role.CLIENTE);
  const interns = users.filter((u) => u.role === Role.NIVEL_1 || u.role === Role.NIVEL_2);

  const toggleMember = (id: string) => {
    const current = selectedMembers;
    setValue(
      'selectedMembers',
      current.includes(id) ? current.filter((m) => m !== id) : [...current, id]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setValue('files', [...files, ...Array.from(e.target.files as FileList)]);
    }
  };

  const removeFile = (idx: number) => {
    setValue('files', files.filter((_, i) => i !== idx));
  };

  const onSubmit = handleSubmit(async (data) => {
    const projectId = `p-${Date.now()}`;

    const members = selectedMembers.map((userId) => ({
      id: `pm-${Date.now()}-${userId}`,
      userId,
      projectId,
      assignedAt: new Date().toISOString(),
      productivity: 100,
      progress: 0,
    }));

    const project: Project = {
      id: projectId,
      name: data.name,
      description: data.description,
      deadline: new Date(data.deadline).toISOString(),
      status: ProjectStatus.ACTIVE,
      ownerId: user?.id ?? 'u-001',
      clientId: data.clientId || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      members,
    };

    const realProject = await addProject(project);

    if (files.length > 0) {
      const newProjectFiles = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const formData = new FormData();
        formData.append('file', f);

        // Upload físico
        const uploadRes = await apiFetch(`/files/upload/${realProject.id}/referencias`, {
          method: 'POST',
          body: formData,
        });

        if (uploadRes) {
          newProjectFiles.push({
            id: `df-${Date.now()}-${i}`,
            projectId: realProject.id,
            subfolder: 'referencias',
            fileName: uploadRes.fileName || f.name,
            fileKey: uploadRes.fileKey || `projetos/${realProject.id}/referencias/${f.name}`,
            fileSize: uploadRes.fileSize || f.size,
            mimeType: uploadRes.mimeType || f.type || 'application/octet-stream',
            uploadedById: user?.id || 'u-001',
            createdAt: new Date().toISOString(),
          });
        }
      }
      if (newProjectFiles.length > 0) {
        await addProjectFiles(newProjectFiles);
      }
    }

    if (contractFile) {
      const formData = new FormData();
      formData.append('file', contractFile);

      // Upload do arquivo PDF do contrato na rota /files/upload/:id/contratos
      const uploadRes = await apiFetch(`/files/upload/${realProject.id}/contratos`, {
        method: 'POST',
        body: formData,
      });

      if (uploadRes) {
        await addContract(realProject.id, {
          title: contractFile.name.replace('.pdf', ''),
          content: uploadRes.url || `http://localhost:3001/files/download?key=${uploadRes.fileKey}`,

        });
      }
    }

    reset();
    setContractFile(null);
    showSuccess('Projeto criado com sucesso!');
    router.push(`/dashboard/projetos/${realProject.id}`);
    onClose();
  });

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <Modal.Header title="Novo Projeto" onClose={onClose} />

        <form onSubmit={onSubmit}>
          <Modal.Body className="max-h-[70vh] overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Core Info */}
              <div className="space-y-5">
                <Input
                  label="Nome do Projeto *"
                  placeholder="Ex: Portal de Pagamentos"
                  error={errors.name?.message}
                  {...register('name')}
                />

                <Textarea
                  label="Descricao"
                  placeholder="Breve descricao dos objetivos do projeto..."
                  className="min-h-[120px]"
                  error={errors.description?.message}
                  {...register('description')}
                />

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-white/60">Prazo de Entrega *</label>
                  <input
                    type="date"
                    style={{ colorScheme: 'dark' }}
                    className={`w-full bg-white/5 border ${
                      errors.deadline ? 'border-red-500/50' : 'border-white/10'
                    } rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all`}
                    {...register('deadline')}
                  />
                  {errors.deadline && (
                    <p className="text-xs text-red-400 mt-0.5">{errors.deadline.message}</p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-white/60">Cliente do Projeto *</label>
                  <select
                    className={`w-full bg-[#1b1c21] border ${
                      errors.clientId ? 'border-red-500/50' : 'border-white/10'
                    } rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer`}
                    {...register('clientId')}
                  >
                    <option value="" className="bg-background">
                      Selecione um cliente...
                    </option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id} className="bg-background text-white">
                        {client.name}
                      </option>
                    ))}
                  </select>
                  {errors.clientId && (
                    <p className="text-xs text-red-400 mt-0.5">{errors.clientId.message}</p>
                  )}
                </div>
              </div>

              {/* Right Column: Team & Files */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2 flex items-center justify-between">
                    <span>Atribuir Estagiarios</span>
                    <span className="text-xs text-primary">{selectedMembers.length} selecionados</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                    {interns.map((u) => {
                      const isSelected = selectedMembers.includes(u.id);
                      return (
                        <label
                          key={u.id}
                          className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-primary/20 border-primary/50 shadow-[0_0_10px_rgba(249,115,22,0.2)]'
                              : 'bg-white/5 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={isSelected}
                            onChange={() => toggleMember(u.id)}
                          />
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              isSelected ? 'bg-primary text-white' : 'bg-white/10 text-text-primary'
                            }`}
                          >
                            {getInitials(u.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-xs font-medium truncate ${
                                isSelected ? 'text-white' : 'text-text-primary'
                              }`}
                            >
                              {u.name}
                            </p>
                            <p className="text-[10px] text-text-muted truncate">
                              {u.role === Role.NIVEL_1 ? 'Nivel 1' : 'Nivel 2'}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">
                    Anexos (Imagens, PDFs)
                  </label>
                  <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-white/10 rounded-xl cursor-pointer bg-white/5 hover:bg-white/10 hover:border-primary/50 transition-all group">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-text-muted group-hover:text-text-primary">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <UploadCloud size={20} className="text-primary" />
                      </div>
                      <p className="text-xs font-medium">Clique ou arraste arquivos</p>
                      <p className="text-[10px] mt-1 opacity-60">PNG, JPG ou PDF (Max. 10MB)</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      multiple
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                    />
                  </label>

                  {files.length > 0 && (
                    <div className="mt-3 flex gap-2 flex-wrap max-h-20 overflow-y-auto custom-scrollbar">
                      {files.map((f, i) => (
                        <div
                          key={i}
                          className="px-3 py-1.5 bg-white/10 rounded-lg border border-white/10 flex items-center gap-2 max-w-[140px] group animate-fade-in"
                        >
                          <span className="truncate text-xs text-white flex-1">{f.name}</span>
                          <button
                            type="button"
                            onClick={() => removeFile(i)}
                            className="text-text-muted hover:text-danger p-0.5 rounded-full hover:bg-white/10 transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Full Width: Contract PDF Upload */}
              <div className="md:col-span-2 border-t border-white/10 pt-6 mt-2 space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <span>Contrato do Projeto (PDF)</span>
                  <span className="text-xs font-normal text-text-muted">
                    (opcional — se anexado, o cliente deverá assinar eletronicamente)
                  </span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-1">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/10 rounded-xl cursor-pointer bg-white/5 hover:bg-white/10 hover:border-primary/50 transition-all group">
                      <div className="flex flex-col items-center justify-center pt-4 pb-4 text-text-muted group-hover:text-text-primary text-center px-4">
                        <UploadCloud size={24} className="text-primary mb-2 group-hover:scale-110 transition-transform" />
                        <p className="text-xs font-medium">Selecione o Contrato PDF</p>
                        <p className="text-[10px] mt-1 opacity-60">Apenas arquivos .pdf</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            setContractFile(e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                  </div>

                  <div className="md:col-span-2 flex items-center">
                    {contractFile ? (
                      <div className="w-full p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between animate-fade-in">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white shrink-0 font-bold text-xs">
                            PDF
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{contractFile.name}</p>
                            <p className="text-xs text-text-muted">{(contractFile.size / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setContractFile(null)}
                          className="p-1.5 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm text-text-muted italic">Nenhum arquivo de contrato selecionado.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Modal.Body>

          <Modal.Footer>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              Criar Projeto
            </Button>
          </Modal.Footer>
        </form>
      </Modal>

      <ToastComponent />
    </>
  );
}
