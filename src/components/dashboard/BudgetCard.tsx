import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, Trash2, Pencil } from 'lucide-react';
import { Budget, useDeleteBudget } from '@/hooks/useBudgets';
import { CATEGORY_LABELS, CATEGORY_ICONS, TransactionCategory, Transaction } from '@/hooks/useTransactions';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface BudgetCardProps {
  budget: Budget;
  transactions: Transaction[];
  onEdit: (budget: Budget) => void;
}

export function BudgetCard({ budget, transactions, onEdit }: BudgetCardProps) {
  const deleteBudget = useDeleteBudget();
  const { toast } = useToast();

  const spent = useMemo(() => {
    return transactions
      .filter(t => t.type === 'expense' && t.category === budget.category)
      .reduce((sum, t) => sum + Number(t.amount), 0);
  }, [transactions, budget.category]);

  const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
  const remaining = budget.amount - spent;
  const isOverBudget = spent > budget.amount;
  const isNearLimit = percentage >= 80 && percentage < 100;

  const handleDelete = async () => {
    try {
      await deleteBudget.mutateAsync(budget.id);
      toast({
        title: 'Presupuesto eliminado',
        description: 'El presupuesto ha sido eliminado correctamente.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el presupuesto.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className={cn(
      "shadow-soft border-border/50 transition-all",
      isOverBudget && "border-destructive/50 bg-destructive/5",
      isNearLimit && !isOverBudget && "border-warning/50 bg-warning/5"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-lg">
              {CATEGORY_ICONS[budget.category as TransactionCategory]}
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base">
                {CATEGORY_LABELS[budget.category as TransactionCategory]}
              </h3>
              <p className="text-xs text-muted-foreground">
                Presupuesto mensual
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-muted-foreground hover:text-primary"
              onClick={() => onEdit(budget)}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
              disabled={deleteBudget.isPending}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Gastado</span>
            <span className={cn(
              "font-medium",
              isOverBudget ? "text-destructive" : ""
            )}>
              S/ {spent.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </span>
          </div>
          
          <Progress 
            value={Math.min(percentage, 100)} 
            className={cn(
              "h-2",
              isOverBudget && "[&>div]:bg-destructive",
              isNearLimit && !isOverBudget && "[&>div]:bg-warning"
            )}
          />
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Presupuesto</span>
            <span className="font-medium">
              S/ {budget.amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Alert or Status */}
        <div className={cn(
          "mt-3 p-2 rounded-lg flex items-center gap-2 text-xs sm:text-sm",
          isOverBudget ? "bg-destructive/10 text-destructive" : 
          isNearLimit ? "bg-warning/10 text-warning-foreground" :
          "bg-success/10 text-success"
        )}>
          {isOverBudget ? (
            <>
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Excediste el presupuesto por S/ {Math.abs(remaining).toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
            </>
          ) : isNearLimit ? (
            <>
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Cerca del límite ({percentage.toFixed(0)}% usado)</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>Te quedan S/ {remaining.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
