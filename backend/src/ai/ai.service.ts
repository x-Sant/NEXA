import {
  Injectable,
  BadRequestException,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

interface GeminiErrorResponse {
  error?: {
    message?: string;
    code?: number;
    details?: Array<{ retryDelay?: string }>;
  };
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

// Format the duration a collaborator has been in the company nicely in Portuguese
function formatTimeInCompany(createdAt: Date): string {
  const now = new Date();
  let years = now.getFullYear() - createdAt.getFullYear();
  let months = now.getMonth() - createdAt.getMonth();

  if (months < 0) {
    years--;
    months += 12;
  }

  const parts: string[] = [];
  if (years > 0) {
    parts.push(`${years} ${years === 1 ? 'ano' : 'anos'}`);
  }
  if (months > 0) {
    parts.push(`${months} ${months === 1 ? 'mês' : 'meses'}`);
  }

  if (parts.length === 0) {
    return 'Na empresa recentemente';
  }

  return `Na empresa há ${parts.join(' e ')}`;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly apiKey = process.env.GEMINI_API_KEY || '';
  private readonly model = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
  private readonly modelUrl = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`;

  constructor(private readonly prisma: PrismaService) {}

  async search(question: string, userId?: string, userRole?: string): Promise<{ answer: string }> {
    if (!question || !question.trim()) {
      throw new BadRequestException('A pergunta não pode ser vazia.');
    }

    if (!this.apiKey) {
      throw new HttpException(
        'A chave da API do Gemini (GEMINI_API_KEY) não está configurada no servidor. Contate o administrador.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const context = await this.buildDynamicContext(userId, userRole);
    const answer = await this.callGemini(question, context);
    return { answer };
  }

  private async buildDynamicContext(userId?: string, userRole?: string): Promise<string> {
    // Para garantir segurança máxima contra vazamentos de dados, se o perfil não estiver definido, aplicamos o filtro mais restritivo.
    const role = userRole || 'CLIENTE';

    try {
      let colaboradoresText = '';
      let projetosText = '';
      let financeiroText = '';

      // 1. Fetch & Filter Collaborators
      if (role === 'NIVEL_3' || role === 'PROFESSOR' || role === 'NIVEL_2') {
        const collaborators = await this.prisma.users.findMany({
          where: {
            role: { in: ['NIVEL_1', 'NIVEL_2'] },
            is_active: true,
          },
          include: {
            project_members: {
              include: {
                projects: true,
              },
            },
          },
          orderBy: {
            name: 'asc',
          },
        });

        for (const col of collaborators) {
          const level = col.role === 'NIVEL_1' ? 'Nível 1' : 'Nível 2';
          const timeStr = formatTimeInCompany(new Date(col.created_at));

          if (!col.project_members || col.project_members.length === 0) {
            colaboradoresText += `- ${col.name} | ${level} | Sem projeto ativo | ${timeStr}\n`;
          } else {
            for (const pm of col.project_members) {
              const projName = pm.projects?.name || 'Sem nome';
              
              // Regra de Sigilo: Apenas admin, orientador ou o próprio estagiário podem ver sua produtividade individual.
              const canSeeMetrics = role === 'NIVEL_3' || role === 'PROFESSOR' || userId === col.id;
              if (canSeeMetrics) {
                const prod = Math.round(Number(pm.productivity));
                const prog = Math.round(Number(pm.progress));
                colaboradoresText += `- ${col.name} | ${level} | Produtividade: ${prod}% | Progresso: ${prog}% | Projeto: ${projName} | ${timeStr}\n`;
              } else {
                colaboradoresText += `- ${col.name} | ${level} | Projeto: ${projName} | ${timeStr}\n`;
              }
            }
          }
        }
      } else if (role === 'CLIENTE') {
        // Clientes podem ver apenas quem está alocado em seus próprios projetos (sem produtividade individual)
        const members = await this.prisma.project_members.findMany({
          where: {
            projects: {
              client_id: userId
            }
          },
          include: {
            users: true,
            projects: true
          }
        });
        const colMap = new Map<string, string>();
        for (const m of members) {
          if (m.users) {
            colMap.set(m.users.name, `- ${m.users.name} | Estagiário alocado no seu projeto **${m.projects?.name}**\n`);
          }
        }
        colaboradoresText = Array.from(colMap.values()).join('');
      } else if (role === 'NIVEL_1') {
        // Estagiário Nível 1 vê apenas o seu próprio perfil e desempenho
        const self = await this.prisma.users.findUnique({
          where: { id: userId },
          include: {
            project_members: {
              include: {
                projects: true
              }
            }
          }
        });
        if (self) {
          const timeStr = formatTimeInCompany(new Date(self.created_at));
          if (!self.project_members || self.project_members.length === 0) {
            colaboradoresText += `- Você (${self.name}) | Nível 1 | Sem projeto ativo | ${timeStr}\n`;
          } else {
            for (const pm of self.project_members) {
              const prod = Math.round(Number(pm.productivity));
              const prog = Math.round(Number(pm.progress));
              const projName = pm.projects?.name || 'Sem nome';
              colaboradoresText += `- Você (${self.name}) | Nível 1 | Sua Produtividade: ${prod}% | Seu Progresso no Projeto: ${prog}% | Projeto: ${projName} | ${timeStr}\n`;
            }
          }
        }
      }

      // 2. Fetch & Filter Projects
      let projectWhereClause: any = {};
      if (role === 'NIVEL_2' || role === 'NIVEL_1') {
        // Apenas projetos onde é membro de equipe
        projectWhereClause = {
          project_members: {
            some: {
              user_id: userId
            }
          }
        };
      } else if (role === 'CLIENTE') {
        // Apenas projetos do próprio cliente
        projectWhereClause = {
          client_id: userId
        };
      }

      const projects = await this.prisma.projects.findMany({
        where: projectWhereClause,
        include: {
          users_projects_client_idTousers: true,
          financial_entries: {
            where: {
              type: 'RECEIVABLE',
              status: { not: 'CANCELLED' },
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });

      const statusMap = {
        ACTIVE: 'ATIVO',
        PAUSED: 'PAUSADO',
        COMPLETED: 'CONCLUÍDO',
        CANCELLED: 'CANCELADO',
      };

      for (const proj of projects) {
        const statusStr = statusMap[proj.status] || proj.status;
        const deadlineStr = proj.deadline
          ? new Date(proj.deadline).toLocaleDateString('pt-BR')
          : 'Sem prazo';
        const clientName = proj.users_projects_client_idTousers?.name || 'NEXA (interno)';

        // Regra de Sigilo de Orçamentos: Apenas Admin, Clientes (do seu projeto) ou Nível 2 (do seu projeto) vêem valores.
        // Professor e Nível 1 NUNCA vêem orçamentos.
        const canSeeBudget = role === 'NIVEL_3' || role === 'CLIENTE' || role === 'NIVEL_2';

        if (canSeeBudget) {
          const budgetCents = proj.financial_entries.reduce(
            (sum, entry) => sum + Number(entry.amount_cents),
            0,
          );
          const budgetReais = budgetCents / 100;
          const budgetStr = budgetReais.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          });
          projetosText += `- ${proj.name} | Status: ${statusStr} | Prazo: ${deadlineStr} | Cliente: ${clientName} | Orçamento: ${budgetStr}\n`;
        } else {
          projetosText += `- ${proj.name} | Status: ${statusStr} | Prazo: ${deadlineStr} | Cliente: ${clientName}\n`;
        }
      }

      // 3. Fetch & Filter Financial Aggregates (Apenas para Administrador - Nível 3)
      if (role === 'NIVEL_3') {
        const financialEntries = await this.prisma.financial_entries.findMany({
          where: {
            status: { not: 'CANCELLED' },
          },
        });

        let totalReceitasCents = 0n;
        let totalDespesasCents = 0n;
        for (const entry of financialEntries) {
          if (entry.type === 'RECEIVABLE') {
            totalReceitasCents += entry.amount_cents;
          } else if (entry.type === 'PAYABLE') {
            totalDespesasCents += entry.amount_cents;
          }
        }

        const totalReceitas = Number(totalReceitasCents) / 100;
        const totalDespesas = Number(totalDespesasCents) / 100;
        const saldoLiquido = totalReceitas - totalDespesas;

        const totalReceitasStr = totalReceitas.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        });
        const totalDespesasStr = totalDespesas.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        });
        const saldoLiquidoStr = saldoLiquido.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        });

        financeiroText = `
=== FINANCEIRO ===
- Total de Receitas (Contas a Receber): ${totalReceitasStr}
- Total de Despesas (Bolsas de Estágio): ${totalDespesasStr}
- Saldo Líquido: ${saldoLiquidoStr}
`;
      }

      return `
Você é o assistente inteligente do sistema NEXA — uma empresa júnior de desenvolvimento de software.
Responda perguntas sobre os dados abaixo de forma direta, profissional e em português do Brasil.
Use markdown para formatar números e nomes importantes com **negrito**.

=== COLABORADORES (ESTAGIÁRIOS) ===
${colaboradoresText.trim() || 'Nenhum colaborador encontrado.'}

=== PROJETOS ===
${projetosText.trim() || 'Nenhum projeto encontrado.'}
${financeiroText}
`;
    } catch (err) {
      this.logger.error('Erro ao construir contexto dinâmico do banco:', err);
      // Fallback seguro: Omitimos tudo se falhar as queries do banco
      return `
Você é o assistente inteligente do sistema NEXA — uma empresa júnior de desenvolvimento de software.
Responda de forma limitada pois o banco de dados está temporariamente indisponível.
`;
    }
  }

  private async callGemini(question: string, context: string): Promise<string> {
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `${context}\n\n=== PERGUNTA DO USUÁRIO ===\n${question}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 500,
      },
    };

    let response: Response;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout

    try {
      response = await fetch(`${this.modelUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
    } catch (networkErr: unknown) {
      clearTimeout(timeoutId);

      if (networkErr instanceof Error && networkErr.name === 'AbortError') {
        this.logger.error('Timeout: A API do Gemini não respondeu a tempo.');
        throw new HttpException(
          'O servidor da Inteligência Artificial demorou muito para responder (Timeout). Tente novamente mais tarde.',
          HttpStatus.GATEWAY_TIMEOUT,
        );
      }
      this.logger.error(
        'Falha de rede ao contatar a API do Gemini.',
        networkErr,
      );
      throw new HttpException(
        'Não foi possível conectar à API do Gemini. Verifique a conexão com a internet do servidor.',
        HttpStatus.BAD_GATEWAY,
      );
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errorBody = (await response
        .json()
        .catch(() => ({}))) as GeminiErrorResponse;
      const errorMessage = errorBody?.error?.message || response.statusText;
      const errorCode = errorBody?.error?.code || response.status;

      this.logger.error(
        `Erro da API do Gemini [${errorCode}]: ${errorMessage}`,
      );

      // Map specific Gemini errors to user-friendly messages
      if (response.status === 429) {
        const retryDelay =
          errorBody?.error?.details?.find((d) => d.retryDelay)?.retryDelay ||
          '';
        throw new HttpException(
          `Limite de requisições da API do Gemini atingido (Rate Limit).${retryDelay ? ` Tente novamente em ${retryDelay}.` : ' Aguarde alguns segundos e tente novamente.'}`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      if (response.status === 400) {
        throw new HttpException(
          `A requisição foi rejeitada pelo Gemini: ${errorMessage}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      if (response.status === 403 || response.status === 401) {
        throw new HttpException(
          'A chave da API do Gemini é inválida ou não tem permissão para usar este modelo.',
          HttpStatus.FORBIDDEN,
        );
      }

      if (response.status === 404) {
        throw new HttpException(
          `Modelo não encontrado na API do Gemini: ${errorMessage}`,
          HttpStatus.NOT_FOUND,
        );
      }

      throw new HttpException(
        `Erro inesperado da API do Gemini [${errorCode}]: ${errorMessage}`,
        HttpStatus.BAD_GATEWAY,
      );
    }

    const json = (await response.json()) as GeminiResponse;
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      this.logger.error(
        'Resposta do Gemini chegou vazia ou em formato inesperado.',
        JSON.stringify(json),
      );
      throw new HttpException(
        'O Gemini retornou uma resposta vazia ou inválida. Tente reformular sua pergunta.',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    return text.trim();
  }
}
