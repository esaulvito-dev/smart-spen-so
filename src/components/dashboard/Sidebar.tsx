import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Target,
  RefreshCw,
  FileText,
  Lightbulb,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState, useEffect } from 'react';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: TrendingUp, label: 'Ingresos', path: '/income' },
  { icon: TrendingDown, label: 'Gastos', path: '/expenses' },
  { icon: PiggyBank, label: 'Presupuestos', path: '/budgets' },
  { icon: Target, label: 'Metas', path: '/goals' },
  { icon: RefreshCw, label: 'Recurrentes', path: '/recurring' },
  { icon: FileText, label: 'Reportes', path: '/reports' },
  { icon: Lightbulb, label: 'Consejos', path: '/tips' },
  { icon: Settings, label: 'Configuración', path: '/settings' },
];

export function Sidebar() {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { data: profile } = useProfile();
  const [isOpen, setIsOpen] = useState(false);

  // Apply theme color to document
  useEffect(() => {
    const themeColor = profile?.theme_color || 'emerald';
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove('theme-emerald', 'theme-blue', 'theme-purple', 'theme-orange', 'theme-teal');
    
    // Add current theme class if not default
    if (themeColor !== 'emerald') {
      root.classList.add(`theme-${themeColor}`);
    }
  }, [profile?.theme_color]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return user?.email?.charAt(0).toUpperCase() || 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      {/* Mobile Header Bar */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-card/95 backdrop-blur-sm border-b border-border z-40 lg:hidden flex items-center px-4 gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-gradient">BudgetTrack</span>
        </div>
      </header>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full w-[280px] max-w-[85vw] bg-card border-r border-border z-50 transform transition-transform duration-300 ease-out lg:translate-x-0 lg:w-64',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full p-4 safe-area-inset">
          {/* Logo - Hidden on mobile (shown in header) */}
          <div className="hidden lg:flex items-center gap-3 px-2 py-4 mb-6">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-glow">
              <TrendingUp className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-gradient">BudgetTrack</span>
          </div>

          {/* Mobile: Close button area spacer */}
          <div className="h-4 lg:hidden" />

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-3 sm:py-2.5 rounded-lg text-sm font-medium transition-all duration-200 active:scale-[0.98]',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-soft'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground active:bg-secondary'
                  )}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-border pt-4 mt-4">
            <div className="flex items-center gap-3 px-2 mb-4">
              <Avatar className="w-10 h-10 border-2 border-primary/20 shrink-0">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {getInitials(profile?.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {profile?.full_name || 'Usuario'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-destructive active:scale-[0.98] py-3 sm:py-2"
              onClick={signOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar sesión
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
