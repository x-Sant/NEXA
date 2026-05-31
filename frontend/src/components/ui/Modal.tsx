'use client';

import { useEffect, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  size?: ModalSize;
  children: React.ReactNode;
}

interface ModalHeaderProps {
  title: string;
  onClose: () => void;
  children?: React.ReactNode;
}

interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

function ModalHeader({ title, onClose, children }: ModalHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/10">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <h2 className="text-lg font-semibold text-white truncate">{title}</h2>
        {children}
      </div>
      <button
        onClick={onClose}
        aria-label="Fechar modal"
        className="ml-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all cursor-pointer shrink-0"
      >
        <X size={16} />
      </button>
    </div>
  );
}

function ModalBody({ children, className = '' }: ModalBodyProps) {
  return (
    <div className={`px-6 py-5 ${className}`}>
      {children}
    </div>
  );
}

function ModalFooter({ children, className = '' }: ModalFooterProps) {
  return (
    <div className={`flex items-center justify-end gap-3 px-6 pb-6 pt-4 border-t border-white/10 ${className}`}>
      {children}
    </div>
  );
}

function ModalRoot({ isOpen, onClose, size = 'md', children }: ModalProps) {
  const [active, setActive] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setActive(true);
      setIsClosing(false);
    } else if (active) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setActive(false);
        setIsClosing(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, active]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!active || !mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className={`fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 ${
        isClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`glass-card rounded-2xl w-full border border-white/10 shadow-2xl ${sizeClasses[size]} ${
          isClosing ? 'animate-scale-down' : 'animate-fade-in'
        }`}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

export const Modal = Object.assign(ModalRoot, {
  Header: ModalHeader,
  Body: ModalBody,
  Footer: ModalFooter,
});
