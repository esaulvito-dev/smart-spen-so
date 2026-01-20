import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Budget } from '@/hooks/useBudgets';
import { Transaction } from '@/hooks/useTransactions';
import { cn } from '@/lib/utils';

interface BudgetSummaryProps {
  budgets: Budget[];
  transactions: Transaction[];
}

export function BudgetSummary({ budgets, transactions }: BudgetSummaryProps) {
  const summary = useMemo(() => {
    const totalBudget = budgets.reduce((sum, b) => sum + Number(b.amount), 0);
    
    const totalSpent = budgets.reduce((sum, budget) => {
      const categorySpent = transactions
        .filter(t => t.type === 'expense' && t.category === budget.category)
        .reduce((s, t) => s + Number(t.amount), 0);
      return sum + categorySpent;
    }, 0);

    const percentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    const remaining = totalBudget - totalSpent;
    const isOverBudget = totalSpent > totalBudget;
    const isNearLimit = percentage >= 80 && percentage < 100;

    return { totalBudget, totalSpent, percentage, remaining, isOverBudget, isNearLimit };
  }, [budgets, transactions]);

  if (budgets.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-soft border-border/50">
      <CardHeader className="pb-2 sm:pb-4">
        <CardTitle className="text-base sm:text-lg">Resumen de presupuestos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">Total presupuestado</p>
            <p className="text-lg sm:text-xl font-bold">
              S/ {summary.totalBudget.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">Total gastado</p>
            <p className={cn(
              "text-lg sm:text-xl font-bold",
              summary.isOverBudget ? "text-destructive" : ""
            )}>
              S/ {summary.totalSpent.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progreso general</span>
            <span className={cn(
              "font-medium",
              summary.isOverBudget ? "text-destructive" : 
              summary.isNearLimit ? "text-warning" : "text-success"
            )}>
              {summary.percentage.toFixed(1)}%
            </span>
          </div>
          <Progress 
            value={Math.min(summary.percentage, 100)} 
            className={cn(
              "h-3",
              summary.isOverBudget && "[&>div]:bg-destructive",
              summary.isNearLimit && !summary.isOverBudget && "[&>div]:bg-warning"
            )}
          />
        </div>

        <div className={cn(
          "p-3 rounded-lg text-center",
          summary.isOverBudget ? "bg-destructive/10" :
          summary.isNearLimit ? "bg-warning/10" : "bg-success/10"
        )}>
          <p className={cn(
            "text-sm font-medium",
            summary.isOverBudget ? "text-destructive" :
            summary.isNearLimit ? "text-warning-foreground" : "text-success"
          )}>
            {summary.isOverBudget ? (
              <>Excediste tu presupuesto por S/ {Math.abs(summary.remaining).toLocaleString('es-PE', { minimumFractionDigits: 2 })}</>
            ) : (
              <>Te quedan S/ {summary.remaining.toLocaleString('es-PE', { minimumFractionDigits: 2 })} disponibles</>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
