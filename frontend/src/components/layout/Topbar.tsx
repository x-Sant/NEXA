'use client';

import { useAuthStore } from '@/lib/auth-store';
import { Search, Sparkles } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useProjectStore } from '@/stores/projectStore';
import { useTicketStore } from '@/stores/ticketStore';
import { useUserStore } from '@/stores/userStore';

interface TopbarProps {
  onToggleAI: () => void;
  isSidebarCollapsed: boolean;
}

export function Topbar({ onToggleAI, isSidebarCollapsed }: TopbarProps) {
  const { user } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  // Stores
  const { projects } = useProjectStore();
  const { tickets } = useTicketStore();
  const { users } = useUserStore();

  const searchResults = useMemo(() => {
    if (!search || search.trim().length < 2) return [];
    
    const q = search.toLowerCase();
    const results = [];

    // Search Projects
    for (const p of projects) {
      if (p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)) {
        results.push({ type: 'Projeto', label: p.name, url: `/dashboard/projetos/${p.id}` });
      }
    }

    // Search Tickets
    for (const t of tickets) {
      if (t.subject.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)) {
        results.push({ type: 'Ticket', label: t.subject, url: `/dashboard/suporte/${t.id}` });
      }
    }

    // Search Users (if admin/NIVEL_3 can access them)
    for (const u of users) {
      if (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) {
        results.push({ type: 'Usuário', label: u.name, url: `/dashboard/colaboradores` }); // or clientes
      }
    }

    return results.slice(0, 10);
  }, [search, projects, tickets, users]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !user) return null;

  return (
    <header
      className="h-16 glass-light border-b border-white/5 sticky top-0 z-30 flex items-center px-6 transition-all duration-300"
    >
      <div className="w-full max-w-7xl mx-auto flex items-center justify-end">
        <div className="flex items-center gap-4">
          <div className="relative hidden md:block w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
            <input
              type="text"
              placeholder="Buscar..."
              className="input pl-9 h-9 text-sm rounded-full bg-white/5 border-transparent focus:bg-white/10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
            />
            {searchFocused && search.length >= 2 && (
              <div className="absolute top-full mt-1 left-0 right-0 glass-card rounded-xl border border-white/10 p-2 z-50 max-h-64 overflow-y-auto">
                {searchResults.length === 0 ? (
                  <p className="text-xs text-white/40 p-2 text-center">Nenhum resultado encontrado.</p>
                ) : (
                  <ul className="space-y-1">
                    {searchResults.map((res, i) => (
                      <li key={i}>
                        <button 
                          onMouseDown={(e) => {
                            e.preventDefault(); // Prevent blur
                            router.push(res.url);
                            setSearch('');
                            setSearchFocused(false);
                          }}
                          className="w-full text-left p-2 rounded-lg hover:bg-white/10 transition-colors flex flex-col"
                        >
                          <span className="text-xs text-primary font-semibold">{res.type}</span>
                          <span className="text-sm text-white truncate">{res.label}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <button 
            onClick={onToggleAI}
            className="btn btn-sm btn-primary rounded-full px-4 gap-2 animate-pulse-glow"
          >
            <Sparkles size={16} />
            <span className="hidden sm:inline">NEXA AI</span>
          </button>
        </div>
      </div>
    </header>
  );
}
