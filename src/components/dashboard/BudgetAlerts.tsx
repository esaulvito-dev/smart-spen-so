import { useMemo } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, AlertCircle } from 'lucide-react';
import { Budget } from '@/hooks/useBudgets';
import { Transaction, CATEGORY_LABELS, TransactionCategory } from '@/hooks/useTransactions';
import { useCurrency } from '@/hooks/useCurrency';

interface BudgetAlertsProps {
  budgets: Budget[];
  transactions: Transaction[];
}

interface AlertItem {
  type: 'over' | 'near';
  category: TransactionCategory;
  spent: number;
  budget: number;
  percentage: number;
}

export function BudgetAlerts({ budgets, transactions }: BudgetAlertsProps) {
  const { formatCurrency } = useCurrency();

  const alerts = useMemo(() => {
    const alertList: AlertItem[] = [];
    budgets.forEach(budget => {
      const spent = transactions
        .filter(t => t.type === 'expense' && t.category === budget.category)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
      if (percentage >= 100) {
        alertList.push({ type: 'over', category: budget.category, spent, budget: budget.amount, percentage });
      } else if (percentage >= 80) {
        alertList.push({ type: 'near', category: budget.category, spent, budget: budget.amount, percentage });
      }
    });
    return alertList.sort((a, b) => {
      if (a.type === 'over' && b.type !== 'over') return -1;
      if (a.type !== 'over' && b.type === 'over') return 1;
      return b.percentage - a.percentage;
    });
  }, [budgets, transactions]);

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-3">
      {alerts.map((alert, index) => (
        <Alert 
          key={`${alert.category}-${index}`}
          variant={alert.type === 'over' ? 'destructive' : 'default'}
          className={alert.type === 'near' ? 'border-warning bg-warning/10' : ''}
        >
          {alert.type === 'over' ? <AlertTriangle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4 text-warning" />}
          <AlertTitle className="text-sm font-medium">
            {alert.type === 'over' ? '¡Presupuesto excedido!' : '¡Alerta de presupuesto!'}
          </AlertTitle>
          <AlertDescription className="text-xs sm:text-sm">
            {alert.type === 'over' ? (
              <>
                Has gastado <strong>{formatCurrency(alert.spent)}</strong> en{' '}
                <strong>{CATEGORY_LABELS[alert.category]}</strong>, excediendo tu presupuesto de{' '}
                {formatCurrency(alert.budget)} por{' '}
                <strong>{formatCurrency(alert.spent - alert.budget)}</strong>.
              </>
            ) : (
              <>
                Has usado el <strong>{alert.percentage.toFixed(0)}%</strong> de tu presupuesto en{' '}
                <strong>{CATEGORY_LABELS[alert.category]}</strong>. Te quedan{' '}
                <strong>{formatCurrency(alert.budget - alert.spent)}</strong>.
              </>
            )}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
