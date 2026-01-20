import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PiggyBank, Loader2, Plus } from 'lucide-react';
import { useBudgets, Budget } from '@/hooks/useBudgets';
import { useTransactions, TransactionCategory } from '@/hooks/useTransactions';
import { BudgetCard } from '@/components/dashboard/BudgetCard';
import { BudgetSummary } from '@/components/dashboard/BudgetSummary';
import { BudgetAlerts } from '@/components/dashboard/BudgetAlerts';
import { AddBudgetDialog } from '@/components/dashboard/AddBudgetDialog';

export default function Budgets() {
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const now = new Date();
  const startDate = format(startOfMonth(now), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(now), 'yyyy-MM-dd');
  const currentMonth = format(now, "MMMM yyyy", { locale: es });

  const { data: budgets = [], isLoading: budgetsLoading } = useBudgets();
  const { data: monthTransactions = [], isLoading: transactionsLoading } = useTransactions(startDate, endDate);

  const existingCategories = useMemo(() => {
    return budgets.map(b => b.category as TransactionCategory);
  }, [budgets]);

  const isLoading = budgetsLoading || transactionsLoading;

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    setEditDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-background">
      <Sidebar />
      <main className="lg:pl-64 p-3 sm:p-4 lg:p-8 pt-[72px] lg:pt-8 pb-6">
        <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
          {/* Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 gradient-primary rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
                <PiggyBank className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Presupuestos</h1>
                <p className="text-sm text-muted-foreground hidden sm:block">
                  {currentMonth}
                </p>
              </div>
            </div>
            <AddBudgetDialog existingCategories={existingCategories} />
          </div>

          {/* Alerts */}
          <BudgetAlerts budgets={budgets} transactions={monthTransactions} />

          {/* Summary */}
          <BudgetSummary budgets={budgets} transactions={monthTransactions} />

          {/* Budget Cards */}
          {budgets.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {budgets.map((budget) => (
                <BudgetCard 
                  key={budget.id} 
                  budget={budget} 
                  transactions={monthTransactions}
                  onEdit={handleEditBudget}
                />
              ))}
            </div>
          ) : (
            <Card className="shadow-soft border-border/50">
              <CardContent>
                <div className="text-center py-8 sm:py-12">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 gradient-primary rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <PiggyBank className="w-8 h-8 sm:w-10 sm:h-10 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">Sin presupuestos</h3>
                  <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto px-4 mb-4">
                    Crea presupuestos mensuales por categoría para controlar mejor tus gastos 
                    y recibir alertas cuando estés cerca de exceder tus límites.
                  </p>
                  <AddBudgetDialog existingCategories={existingCategories} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Edit Budget Dialog */}
          <AddBudgetDialog
            existingCategories={existingCategories}
            editBudget={editingBudget}
            open={editDialogOpen}
            onOpenChange={(open) => {
              setEditDialogOpen(open);
              if (!open) setEditingBudget(null);
            }}
          />
        </div>
      </main>
    </div>
  );
}
