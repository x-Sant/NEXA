import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { databaseContextStorage } from './database-context';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private static pool: Pool;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    super({
      adapter,
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'error' },
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
      ],
    });
    PrismaService.pool = pool;
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log(
      'Prisma Client connected successfully to PostgreSQL via pg pool.',
    );
    try {
      await this.$executeRawUnsafe(
        `ALTER TABLE nexa.users ADD COLUMN IF NOT EXISTS password_needs_change BOOLEAN DEFAULT FALSE;`
      );
      this.logger.log('Database schema verified: password_needs_change column exists.');
    } catch (err) {
      this.logger.error('Failed to run migration query:', err);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    if (PrismaService.pool) {
      await PrismaService.pool.end();
    }
    this.logger.log('Prisma Client and pg pool disconnected successfully.');
  }

  /**
   * Executa uma operação de banco dentro de uma transação garantindo a injeção do RLS,
   * auditoria forense do colega e chave de criptografia do pgcrypto.
   */
  async runWithContext<T>(operation: (tx: any) => Promise<T>): Promise<T> {
    const context = databaseContextStorage.getStore();
    const userId = context?.userId || null;
    const userRole = context?.userRole || 'Anonymous';
    const cryptoKey = process.env.CPF_CRYPTO_KEY;

    return this.$transaction(async (tx) => {
      // Injeta variáveis de sessão na transação atual (SET LOCAL)
      if (userId) {
        await tx.$executeRawUnsafe(`SELECT set_config('app.current_user_id', $1, true);`, userId);
      } else {
        await tx.$executeRawUnsafe(`SELECT set_config('app.current_user_id', '', true);`);
      }
      await tx.$executeRawUnsafe(`SELECT set_config('app.current_user_role', $1, true);`, userRole);
      await tx.$executeRawUnsafe(`SELECT set_config('app.crypto_key', $1, true);`, cryptoKey);

      return operation(tx);
    });
  }
}
