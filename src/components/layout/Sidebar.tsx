import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  ClipboardList,
  Calendar,
  Users,
  MapPin,
  Wrench,
  FileText,
  DollarSign,
  BarChart3,
  FolderArchive,
  Settings,
  ChevronLeft,
  PhoneCall,
  UserCheck,
  ShieldAlert,
  Smartphone,
  Lock,
  Menu,
  X,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export type NavigationPage =
  | 'dashboard'
  | 'work-orders'
  | 'schedule'
  | 'customers'
  | 'locations'
  | 'services'
  | 'quotes'
  | 'financial'
  | 'reports'
  | 'documents'
  | 'team'
  | 'notifications'
  | 'users'
  | 'settings'
  | 'audit-logs'
  | 'technician-mobile';

interface SidebarProps {
  currentPage: NavigationPage;
  onSelectPage: (page: NavigationPage) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  activeWorkOrdersCount?: number;
  pendingQuotesCount?: number;
  unreadNotificationsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onSelectPage,
  mobileOpen,
  onCloseMobile,
  activeWorkOrdersCount = 0,
  pendingQuotesCount = 0,
}) => {
  const { user } = useAuth();
  const { theme, setTheme, toggleTheme } = useTheme();
  const isAdmin = user?.role === 'admin' || user?.role === 'manager';
  const isEmployee = user?.role === 'employee' || user?.role === 'technician';

  const [isHovered, setIsHovered] = useState(false);
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    leaveTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current);
      }
    };
  }, []);

  const handleNavClick = (page: NavigationPage) => {
    onSelectPage(page);
    setIsHovered(false);
    onCloseMobile();
  };

  // Nav Item Renderer: Adapts dynamically whether hovered (expanded) or icon-only
  const renderNavItem = (
    page: NavigationPage,
    label: string,
    IconComponent: React.ElementType,
    badgeCount: number = 0,
    iconColorClass: string = 'text-slate-600'
  ) => {
    const isActive = currentPage === page;

    return (
      <button
        type="button"
        onClick={() => handleNavClick(page)}
        className={`w-full flex items-center rounded-xl font-medium text-sm transition-all duration-150 cursor-pointer group relative px-3 py-2.5 gap-3.5 justify-start ${
          isActive
            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-800 shadow-2xs'
            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
        }`}
      >
        <IconComponent
          className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
            isActive ? 'text-blue-600 dark:text-blue-400' : iconColorClass
          }`}
        />

        <span className="truncate whitespace-nowrap text-left flex-1">{label}</span>
        {badgeCount > 0 && (
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shrink-0">
            {badgeCount}
          </span>
        )}
      </button>
    );
  };

  return (
    <>
      {/* Sensor invisível na borda esquerda da tela para desktop abrir suavemente ao passar o mouse */}
      <div
        className="fixed top-0 bottom-0 left-0 w-3 z-40 hidden lg:block"
        onMouseEnter={handleMouseEnter}
      />

      {/* Backdrop para mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={() => {
            setIsHovered(false);
            onCloseMobile();
          }}
        />
      )}

      {/* Sidebar: Recolhe 100% ao fechar e surge com animação suave e sombra apenas ao passar o mouse por cima */}
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 transition-all duration-300 ease-out select-none w-[270px] shadow-2xl ${
          isHovered || mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Topo Limpo: Loguinho da CR e botão para recolher */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2 shrink-0">
            <img src="/logo-cr.svg" alt="CR Serviços Gerais" className="h-5 w-auto max-w-[105px] object-contain shrink-0 select-none" />
          </div>
          <button
            type="button"
            onClick={() => {
              setIsHovered(false);
              onCloseMobile();
            }}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer flex items-center justify-center min-w-[36px] min-h-[36px]"
            title="Fechar menu lateral"
          >
            <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
        </div>

        {/* Lista de Ícones / Itens de Menu */}
        <div className="flex-1 overflow-y-auto px-2 lg:px-2.5 py-3 space-y-4 custom-scrollbar">
          {/* Se for Funcionário: Apenas seus Atendimentos, Ordens e Agenda */}
          {isEmployee ? (
            <div className="space-y-1">
              {(isHovered || mobileOpen) && (
                <p className="px-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase font-mono mb-1">
                  Painel do Funcionário
                </p>
              )}
              {renderNavItem('dashboard', 'Painel Diário', LayoutDashboard, 0, 'text-blue-600 dark:text-blue-400')}
              {renderNavItem('work-orders', 'Minhas Ordens de Serviço', ClipboardList, activeWorkOrdersCount, 'text-slate-600 dark:text-slate-300')}
              {renderNavItem('schedule', 'Minha Agenda & Escala', Calendar, 0, 'text-indigo-600 dark:text-indigo-400')}
              {renderNavItem('services', 'Catálogo de Serviços', Wrench, 0, 'text-amber-600 dark:text-amber-400')}
            </div>
          ) : (
            /* Se for Administrador: Todas as Áreas, Finanças, Auditoria e Usuários */
            <>
              {/* Grupo: Operação */}
              <div className="space-y-1">
                {(isHovered || mobileOpen) && (
                  <p className="px-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase font-mono mb-1">
                    Operação
                  </p>
                )}
                {renderNavItem('dashboard', 'Painel Operacional', LayoutDashboard, 0, 'text-blue-600 dark:text-blue-400')}
                {renderNavItem('work-orders', 'Ordens de Serviço', ClipboardList, activeWorkOrdersCount, 'text-slate-600 dark:text-slate-300')}
                {renderNavItem('schedule', 'Agenda & Escala', Calendar, 0, 'text-indigo-600 dark:text-indigo-400')}
                {renderNavItem('customers', 'Clientes', Users, 0, 'text-slate-600 dark:text-slate-300')}
                {renderNavItem('services', 'Catálogo de Serviços', Wrench, 0, 'text-amber-600 dark:text-amber-400')}
              </div>

              {/* Grupo: Gestão & Finanças */}
              <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                {(isHovered || mobileOpen) && (
                  <p className="px-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase font-mono mb-1">
                    Gestão & Vendas
                  </p>
                )}
                {renderNavItem('quotes', 'Orçamentos', FileText, pendingQuotesCount, 'text-blue-600 dark:text-blue-400')}
                {renderNavItem('financial', 'Financeiro & Caixa', DollarSign, 0, 'text-emerald-600 dark:text-emerald-400')}
                {renderNavItem('reports', 'Relatórios Gerenciais', BarChart3, 0, 'text-purple-600 dark:text-purple-400')}
                {renderNavItem('documents', 'Documentos & Termos', FolderArchive, 0, 'text-slate-600 dark:text-slate-300')}
                {renderNavItem('team', 'Equipe Técnica', UserCheck, 0, 'text-blue-600 dark:text-blue-400')}
              </div>

              {/* Grupo: Sistema & Segurança */}
              <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                {(isHovered || mobileOpen) && (
                  <p className="px-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase font-mono mb-1">
                    Sistema & Auditoria
                  </p>
                )}
                {renderNavItem('audit-logs', 'Auditoria Completa', ShieldAlert, 0, 'text-indigo-600 dark:text-indigo-400')}
                {renderNavItem('users', 'Gerenciar Usuários', UserCheck, 0, 'text-purple-600 dark:text-purple-400')}
                {renderNavItem('settings', 'Configurações', Settings, 0, 'text-slate-600 dark:text-slate-300')}
              </div>
            </>
          )}
        </div>

        {/* Rodapé: Seletor de Tema (Admin) / Conexão / Telefone */}
        <div className={`border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 transition-all ${
          isHovered || mobileOpen ? 'p-3 space-y-2.5' : 'p-2 flex flex-col items-center justify-center gap-2'
        }`}>
          {isHovered || mobileOpen ? (
            <>
              {/* Seletor de Tema Corporativo Persistente para o Administrador */}
              {isAdmin && (
                <div className="p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-2xs">
                  <div className="flex items-center justify-between gap-1 mb-1.5 px-0.5">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase font-mono">
                      Tema do Sistema
                    </span>
                    <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                      {theme === 'dark' ? 'Modo Escuro' : 'Modo Claro'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-100 dark:bg-slate-900 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setTheme('light')}
                      className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                        theme === 'light'
                          ? 'bg-white text-slate-900 shadow-2xs border border-slate-200 font-bold'
                          : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                      }`}
                      title="Ativar Modo Claro corporativo"
                    >
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                      <span>Claro</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme('dark')}
                      className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                        theme === 'dark'
                          ? 'bg-slate-800 text-blue-400 shadow-2xs border border-slate-700 font-bold'
                          : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                      }`}
                      title="Ativar Modo Escuro corporativo"
                    >
                      <Moon className="w-3.5 h-3.5 text-blue-400" />
                      <span>Escuro</span>
                    </button>
                  </div>
                </div>
              )}

              {isEmployee && (
                <div className="px-2 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-[10px] text-blue-800 dark:text-blue-300 flex items-start gap-1">
                  <Lock className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <span className="leading-tight">
                    <strong>Funcionário:</strong> Acesso às suas Ordens de Serviço e Agenda.
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 px-1 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-semibold text-emerald-700 dark:text-emerald-400 text-[11px]">Sistema Operacional Ativo</span>
              </div>
              <a
                href="https://wa.me/5554996224098"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all"
              >
                <PhoneCall className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="truncate font-mono font-medium text-[11px]">(54) 99622-4098</span>
              </a>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 py-1">
              {isAdmin && (
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                  title={theme === 'dark' ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
                >
                  {theme === 'dark' ? (
                    <Sun className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Moon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  )}
                </button>
              )}
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block" title="Sistema Operacional Conectado" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
