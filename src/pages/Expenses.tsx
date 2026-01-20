import { Sidebar } from '@/components/dashboard/Sidebar';
import { TransactionList } from '@/components/dashboard/TransactionList';
import { AddTransactionDialog } from '@/components/dashboard/AddTransactionDialog';
import { useTransactions, CATEGORY_LABELS, CATEGORY_ICONS, TransactionCategory } from '@/hooks/useTransactions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown, Loader2 } from 'lucide-react';
import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Expenses() {
  const now = new Date();
  const startDate = format(startOfMonth(now), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(now), 'yyyy-MM-dd');
  
  const { data: allTransactions = [], isLoading } = useTransactions();
  const { data: monthTransactions = [] } = useTransactions(startDate, endDate);

  const expenseTransactions = useMemo(() => 
    allTransactions.filter((t) => t.type === 'expense'),
    [allTransactions]
  );

  const monthlyExpenses = useMemo(() => 
    monthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0),
    [monthTransactions]
  );

  const expensesByCategory = useMemo(() => {
    const grouped = monthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
        return acc;
      }, {} as Record<string, number>);
    
    return Object.entries(grouped)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [monthTransactions]);

  const currentMonth = format(now, "MMMM yyyy", { locale: es });

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
              <div className="w-9 h-9 sm:w-10 sm:h-10 gradient-expense rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
                <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Gastos</h1>
                <p className="text-sm text-muted-foreground hidden sm:block">
                  Controla todos tus gastos
                </p>
              </div>
            </div>
            <AddTransactionDialog defaultType="expense" />
          </div>

          {/* Monthly Summary */}
          <Card className="shadow-soft border-border/50 border-l-4 border-l-destructive">
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Gastos de {currentMonth}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-destructive">
                    -S/ {monthlyExpenses.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="w-12 h-12 sm:w-16 sm:h-16 gradient-expense rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
                  <TrendingDown className="w-6 h-6 sm:w-8 sm:h-8 text-primary-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Categories */}
          {expensesByCategory.length > 0 && (
            <Card className="shadow-soft border-border/50">
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="text-base sm:text-lg">Top categorías</CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                <div className="space-y-3 sm:space-y-4">
                  {expensesByCategory.map(([category, amount]) => {
                    const percentage = (amount / monthlyExpenses) * 100;
                    return (
                      <div key={category} className="space-y-1.5 sm:space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-base sm:text-lg">{CATEGORY_ICONS[category as TransactionCategory]}</span>
                            <span className="font-medium text-sm sm:text-base truncate">{CATEGORY_LABELS[category as TransactionCategory]}</span>
                          </div>
                          <span className="font-semibold text-sm sm:text-base shrink-0">
                            S/ {amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-destructive rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Transaction List */}
          <Card className="shadow-soft border-border/50">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Historial de gastos</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <TransactionList transactions={expenseTransactions} showDelete showEdit />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
