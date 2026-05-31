'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { Role } from '@/types';
import { cn, getInitials, getRoleBadgeColor, getRoleLabel } from '@/lib/utils';
import type { Notification } from '@/types';
import { useNotificationStore } from '@/stores/notificationStore';
import {
  Home,
  Users,
  DollarSign,
  Building2,
  FolderKanban,
  MessageSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ArrowLeft,
  Bell,
  X,
  Package,
  FileText,
  MessageCircle,
  CheckCheck,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: Home, roles: [Role.NIVEL_1, Role.NIVEL_2, Role.NIVEL_3, Role.PROFESSOR, Role.CLIENTE] },
  { label: 'Pessoas', href: '/dashboard/pessoas', icon: Users, roles: [Role.NIVEL_1, Role.NIVEL_2, Role.NIVEL_3, Role.PROFESSOR] },
  { label: 'Financeiro', href: '/dashboard/financeiro', icon: DollarSign, roles: [Role.NIVEL_3] },
  { label: 'Clientes', href: '/dashboard/clientes', icon: Building2, roles: [Role.NIVEL_2, Role.NIVEL_3] },
  { label: 'Projetos', href: '/dashboard/projetos', icon: FolderKanban, roles: [Role.NIVEL_1, Role.NIVEL_2, Role.NIVEL_3, Role.CLIENTE] },
  { label: 'Suporte', href: '/dashboard/suporte', icon: MessageSquare, roles: [Role.NIVEL_1, Role.NIVEL_2, Role.NIVEL_3, Role.PROFESSOR, Role.CLIENTE] },
  { label: 'Configurações', href: '/dashboard/configuracoes', icon: Settings, roles: [Role.NIVEL_3] },
];

const notifTypeIcon: Record<Notification['type'], React.ElementType> = {
  ticket: MessageSquare,
  delivery: Package,
  contract: FileText,
  comment: MessageCircle,
};

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'agora mesmo';
  if (hours < 24) return `há ${hours}h`;
  return `há ${Math.floor(hours / 24)}d`;
}

export function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { notifications, markAllRead } = useNotificationStore();
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [notifOpen]);

  if (!mounted || !user) return null;

  const allowedNavItems = NAV_ITEMS.filter(item => item.roles.includes(user.role));

  const userNotifs = notifications.filter(n => n.targetRole.includes(user.role));
  const unreadCount = userNotifs.filter(n => !n.read).length;

  return (
    <aside
      className={cn(
        'glass fixed left-0 top-0 z-40 h-screen transition-all duration-300 ease-in-out flex flex-col',
        isCollapsed ? 'w-20' : 'w-72'
      )}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/5">
        {!isCollapsed && (
          <div className="text-2xl font-bold tracking-tighter gradient-text-primary">
            NEXA
          </div>
        )}
        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-2 rounded-lg hover:bg-white/5 text-text-secondary hover:text-white transition-all cursor-pointer active:scale-95 group ml-auto"
            title="Recolher barra lateral"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {allowedNavItems.map(item => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center rounded-xl transition-all duration-200 group relative',
                isCollapsed ? 'justify-center p-3' : 'px-4 py-3 gap-3',
                isActive
                  ? 'bg-primary/10 text-primary shadow-glow-primary'
                  : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
              )}
              <Icon size={20} className={cn(isActive ? 'text-primary' : '')} />
              {!isCollapsed && <span className="font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer (User & Logout) */}
      <div className="border-t border-white/5 p-4 flex flex-col gap-4">
        {/* Notification Bell */}
        <div className={cn('relative', isCollapsed ? 'flex justify-center' : '')} ref={notifRef}>
          <button
            onClick={() => setNotifOpen(prev => !prev)}
            className={cn(
              'relative flex items-center gap-2 rounded-xl p-2 text-text-secondary hover:text-white hover:bg-white/5 transition-all cursor-pointer',
              isCollapsed ? 'justify-center' : 'w-full px-3 py-2'
            )}
            title="Notificações"
          >
            <Bell size={20} />
            {!isCollapsed && <span className="text-sm font-medium">Notificações</span>}
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-danger text-white text-[9px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {notifOpen && (
            <div className={cn(
              'absolute bottom-full mb-2 z-50 glass-card border border-white/10 rounded-xl shadow-2xl overflow-hidden',
              isCollapsed ? 'left-full ml-2 w-72' : 'left-0 right-0 w-full'
            )}>
              <div className="flex items-center justify-between p-3 border-b border-white/5">
                <span className="text-xs font-semibold text-white">Notificações</span>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[10px] text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                    >
                      <CheckCheck size={12} />
                      Marcar todas
                    </button>
                  )}
                  <button
                    onClick={() => setNotifOpen(false)}
                    className="p-0.5 rounded text-text-muted hover:text-white transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto divide-y divide-white/5">
                {userNotifs.length === 0 ? (
                  <p className="text-xs text-text-muted text-center py-6">Sem notificações</p>
                ) : (
                  userNotifs
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map(notif => {
                      const Icon = notifTypeIcon[notif.type];
                      return (
                        <div
                          key={notif.id}
                          className={cn(
                            'flex items-start gap-2.5 p-3 hover:bg-white/5 transition-colors',
                            !notif.read && 'bg-primary/5'
                          )}
                        >
                          <div className={cn(
                            'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                            notif.type === 'ticket' ? 'bg-amber-400/10 text-amber-400' :
                            notif.type === 'delivery' ? 'bg-blue-400/10 text-blue-400' :
                            notif.type === 'contract' ? 'bg-emerald-400/10 text-emerald-400' :
                            'bg-violet-400/10 text-violet-400'
                          )}>
                            <Icon size={13} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn('text-[11px] leading-snug', notif.read ? 'text-text-muted' : 'text-white font-medium')}>
                              {notif.message}
                            </p>
                            <p className="text-[10px] text-text-muted mt-0.5">{relativeTime(notif.createdAt)}</p>
                          </div>
                          {!notif.read && (
                            <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1" />
                          )}
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          )}
        </div>

        <div className={cn('flex items-center justify-between gap-3', isCollapsed && 'flex-col justify-center')}>
          <Link
            href={`/dashboard/pessoas/${user.id}`}
            className={cn(
              'flex items-center gap-3 overflow-hidden hover:bg-white/5 p-1.5 -m-1.5 rounded-xl transition-all duration-200 cursor-pointer active:scale-95 group',
              isCollapsed && 'justify-center'
            )}
            title="Visualizar meu perfil"
          >
            <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-bold shrink-0 shadow-glow-primary group-hover:scale-105 transition-transform duration-200">
              {getInitials(user.name)}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium text-text-primary truncate">{user.name}</span>
                <span className="text-xs text-text-muted truncate mb-1.5">{user.email}</span>
                <span className={cn('inline-block self-start px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase', getRoleBadgeColor(user.role))}>
                  {getRoleLabel(user.role)}
                </span>
              </div>
            )}
          </Link>

          {!isCollapsed ? (
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-2 rounded-lg hover:bg-white/5 text-text-secondary hover:text-white transition-colors cursor-pointer shrink-0 ml-auto"
              title="Recolher barra lateral"
            >
              <ChevronLeft size={18} />
            </button>
          ) : (
            <button
              onClick={() => setIsCollapsed(false)}
              className="p-2 rounded-lg hover:bg-white/5 text-text-secondary hover:text-white transition-colors mx-auto mt-1 cursor-pointer"
              title="Expandir barra lateral"
            >
              <ChevronRight size={18} />
            </button>
          )}
        </div>

        <button
          onClick={logout}
          className={cn(
            'w-full flex items-center rounded-xl transition-all duration-200 gap-3 text-danger hover:bg-danger/10 cursor-pointer',
            isCollapsed ? 'justify-center p-3' : 'px-4 py-2.5'
          )}
        >
          <LogOut size={20} />
          {!isCollapsed && <span className="font-medium text-sm">Sair</span>}
        </button>
      </div>
    </aside>
  );
}
