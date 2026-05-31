import { AsyncLocalStorage } from 'async_hooks';

export interface DatabaseContext {
  userId: string;
  userRole: string;
}

export const databaseContextStorage = new AsyncLocalStorage<DatabaseContext>();
