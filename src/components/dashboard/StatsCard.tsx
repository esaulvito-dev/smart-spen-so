import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'income' | 'expense' | 'balance';
}

export function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  variant = 'default' 
}: StatsCardProps) {
  const variantStyles = {
    default: 'bg-card',
    income: 'bg-card border-l-4 border-l-success',
    expense: 'bg-card border-l-4 border-l-destructive',
    balance: 'gradient-primary text-primary-foreground',
  };

  const iconStyles = {
    default: 'bg-primary/10 text-primary',
    income: 'bg-success/10 text-success',
    expense: 'bg-destructive/10 text-destructive',
    balance: 'bg-primary-foreground/20 text-primary-foreground',
  };

  return (
    <div className={cn(
      'rounded-xl p-4 sm:p-6 shadow-soft border border-border/50 animate-slide-up',
      variantStyles[variant]
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className={cn(
            'text-xs sm:text-sm font-medium truncate',
            variant === 'balance' ? 'text-primary-foreground/80' : 'text-muted-foreground'
          )}>
            {title}
          </p>
          <p className="text-lg sm:text-2xl font-bold mt-1 truncate">{value}</p>
          {subtitle && (
            <p className={cn(
              'text-xs mt-1 truncate',
              variant === 'balance' ? 'text-primary-foreground/70' : 'text-muted-foreground'
            )}>
              {subtitle}
            </p>
          )}
          {trend && (
            <div className={cn(
              'flex items-center gap-1 mt-2 text-xs font-medium',
              trend.isPositive ? 'text-success' : 'text-destructive'
            )}>
              <span>{trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%</span>
              <span className="text-muted-foreground hidden sm:inline">vs mes anterior</span>
            </div>
          )}
        </div>
        <div className={cn(
          'w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0',
          iconStyles[variant]
        )}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>
    </div>
  );
}
