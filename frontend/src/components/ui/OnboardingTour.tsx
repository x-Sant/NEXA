'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, LayoutDashboard, Sidebar, BarChart2, Rocket, X } from 'lucide-react';

const STORAGE_KEY = 'nexa-onboarding-done';

const steps = [
  {
    icon: Rocket,
    title: 'Bem-vindo à NEXA!',
    description: 'Este é seu workspace de gestão de projetos acadêmicos. Aqui você acompanha tudo em tempo real, de demandas a contratos.',
    color: 'from-primary to-accent',
  },
  {
    icon: Sidebar,
    title: 'Navegação na Sidebar',
    description: 'Na barra lateral você encontra todos os módulos: Projetos, Pessoas, Financeiro, Suporte e mais. Acesse de qualquer lugar.',
    color: 'from-blue-500 to-cyan-400',
  },
  {
    icon: BarChart2,
    title: 'KPIs no Dashboard',
    description: 'No Dashboard você acompanha os indicadores mais importantes: projetos ativos, tickets abertos, receitas e contratos pendentes.',
    color: 'from-violet-500 to-purple-400',
  },
  {
    icon: LayoutDashboard,
    title: 'Você está pronto!',
    description: 'Explore o sistema à vontade. Cada módulo foi pensado para tornar sua gestão mais eficiente e colaborativa.',
    color: 'from-emerald-500 to-teal-400',
  },
];

export function OnboardingTour() {
  const [visible, setVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const done = localStorage.getItem(STORAGE_KEY);
      if (!done) {
        // Small delay so the dashboard loads first
        const timer = setTimeout(() => setVisible(true), 800);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const finish = () => {
    setIsExiting(true);
    setTimeout(() => {
      setVisible(false);
      localStorage.setItem(STORAGE_KEY, 'true');
    }, 350);
  };

  const dismiss = () => finish();

  if (!visible) return null;

  const step = steps[currentStep];
  const StepIcon = step.icon;
  const isLast = currentStep === steps.length - 1;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-350 ${
        isExiting ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ background: 'rgba(10,14,26,0.88)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className={`relative w-full max-w-md glass-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden transition-all duration-350 ${
          isExiting ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
        style={{ animation: isExiting ? undefined : 'fadeIn 0.35s ease-out' }}
      >
        {/* Top gradient bar */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${step.color}`} />

        {/* Dismiss button */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all"
          title="Fechar tour"
        >
          <X size={16} />
        </button>

        <div className="p-8 text-center">
          {/* Icon */}
          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mx-auto mb-6 shadow-lg`}>
            <StepIcon size={36} className="text-white" />
          </div>

          {/* Step counter */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  i === currentStep ? 'w-6 h-2 bg-primary' : 'w-2 h-2 bg-white/20'
                }`}
              />
            ))}
          </div>

          <h2 className="text-2xl font-bold text-white mb-3">{step.title}</h2>
          <p className="text-sm text-white/60 leading-relaxed mb-8">{step.description}</p>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
              className="btn btn-secondary btn-sm flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
              Anterior
            </button>

            <span className="text-xs text-white/30 font-medium">
              {currentStep + 1} / {steps.length}
            </span>

            {isLast ? (
              <button
                onClick={finish}
                className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-glow-primary"
              >
                <Rocket size={14} />
                Começar
              </button>
            ) : (
              <button
                onClick={() => setCurrentStep(prev => Math.min(steps.length - 1, prev + 1))}
                className="btn btn-primary btn-sm flex items-center gap-1.5"
              >
                Próximo
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
