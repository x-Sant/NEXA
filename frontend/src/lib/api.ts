import { useAuthStore } from './auth-store';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Utilitário padrão para fazer chamadas HTTP ao Backend.
 * Injeta automaticamente o cabeçalho Authorization: Bearer <token>.
 */
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = useAuthStore.getState().token;
  
  const headers: any = {
    ...options.headers,
  };

  // Se não for FormData, injeta application/json por padrão
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401 && !(options as any)._retry) {
      const refreshed = await useAuthStore.getState().refresh();
      if (refreshed) {
        return apiFetch(endpoint, {
          ...options,
          _retry: true,
        } as any);
      }
      useAuthStore.getState().logout();
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Erro de API: ${response.status}`);
  }

  // Permite requisições que não retornam JSON (ex: 204 No Content)
  try {
    return await response.json();
  } catch (err) {
    return null;
  }
}
