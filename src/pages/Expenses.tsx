import { Sidebar } from '@/components/dashboard/Sidebar';
import { TransactionList } from '@/components/dashboard/TransactionList';
import { AddTransactionDialog } from '@/components/dashboard/AddTransactionDialog';
import { useTransactions, CATEGORY_LABELS, CATEGORY_ICONS, TransactionCategory } from '@/hooks/useTransactions';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown, Loader2 } from 'lucide-react';
import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Expenses() {
  const { data: profile } = useProfile();
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

  const currentMonth = format(now, "MMMM 'de' yyyy", { locale: es });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background ${profile?.theme_color ? `theme-${profile.theme_color}` : ''}`}>
      <Sidebar />
      <main className="lg:pl-64 p-4 lg:p-8 pt-20 lg:pt-8">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-3">
                <div className="w-10 h-10 gradient-expense rounded-xl flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-primary-foreground" />
                </div>
                Gastos
              </h1>
              <p className="text-muted-foreground mt-1">
                Controla todos tus gastos
              </p>
            </div>
            <AddTransactionDialog defaultType="expense" />
          </div>

          {/* Monthly Summary */}
          <Card className="shadow-soft border-border/50 border-l-4 border-l-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Gastos de {currentMonth}</p>
                  <p className="text-3xl font-bold text-destructive">
                    -${monthlyExpenses.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="w-16 h-16 gradient-expense rounded-2xl flex items-center justify-center">
                  <TrendingDown className="w-8 h-8 text-primary-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Categories */}
          {expensesByCategory.length > 0 && (
            <Card className="shadow-soft border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Top categorías del mes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {expensesByCategory.map(([category, amount]) => {
                    const percentage = (amount / monthlyExpenses) * 100;
                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{CATEGORY_ICONS[category as TransactionCategory]}</span>
                            <span className="font-medium">{CATEGORY_LABELS[category as TransactionCategory]}</span>
                          </div>
                          <span className="font-semibold">
                            ${amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
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
            <CardHeader>
              <CardTitle className="text-lg">Historial de gastos</CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionList transactions={expenseTransactions} showDelete />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
