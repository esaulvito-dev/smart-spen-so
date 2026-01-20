import { useMemo } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, AlertCircle, TrendingUp } from 'lucide-react';
import { Budget } from '@/hooks/useBudgets';
import { Transaction, CATEGORY_LABELS, TransactionCategory } from '@/hooks/useTransactions';

interface BudgetAlertsProps {
  budgets: Budget[];
  transactions: Transaction[];
}

interface AlertItem {
  type: 'over' | 'near' | 'good';
  category: TransactionCategory;
  spent: number;
  budget: number;
  percentage: number;
}

export function BudgetAlerts({ budgets, transactions }: BudgetAlertsProps) {
  const alerts = useMemo(() => {
    const alertList: AlertItem[] = [];

    budgets.forEach(budget => {
      const spent = transactions
        .filter(t => t.type === 'expense' && t.category === budget.category)
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

      if (percentage >= 100) {
        alertList.push({
          type: 'over',
          category: budget.category,
          spent,
          budget: budget.amount,
          percentage,
        });
      } else if (percentage >= 80) {
        alertList.push({
          type: 'near',
          category: budget.category,
          spent,
          budget: budget.amount,
          percentage,
        });
      }
    });

    // Sort by severity (over first, then near)
    return alertList.sort((a, b) => {
      if (a.type === 'over' && b.type !== 'over') return -1;
      if (a.type !== 'over' && b.type === 'over') return 1;
      return b.percentage - a.percentage;
    });
  }, [budgets, transactions]);

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert, index) => (
        <Alert 
          key={`${alert.category}-${index}`}
          variant={alert.type === 'over' ? 'destructive' : 'default'}
          className={alert.type === 'near' ? 'border-warning bg-warning/10' : ''}
        >
          {alert.type === 'over' ? (
            <AlertTriangle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4 text-warning" />
          )}
          <AlertTitle className="text-sm font-medium">
            {alert.type === 'over' ? '¡Presupuesto excedido!' : '¡Alerta de presupuesto!'}
          </AlertTitle>
          <AlertDescription className="text-xs sm:text-sm">
            {alert.type === 'over' ? (
              <>
                Has gastado <strong>S/ {alert.spent.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</strong> en{' '}
                <strong>{CATEGORY_LABELS[alert.category]}</strong>, excediendo tu presupuesto de{' '}
                S/ {alert.budget.toLocaleString('es-PE', { minimumFractionDigits: 2 })} por{' '}
                <strong>S/ {(alert.spent - alert.budget).toLocaleString('es-PE', { minimumFractionDigits: 2 })}</strong>.
              </>
            ) : (
              <>
                Has usado el <strong>{alert.percentage.toFixed(0)}%</strong> de tu presupuesto en{' '}
                <strong>{CATEGORY_LABELS[alert.category]}</strong>. Te quedan{' '}
                <strong>S/ {(alert.budget - alert.spent).toLocaleString('es-PE', { minimumFractionDigits: 2 })}</strong>.
              </>
            )}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
