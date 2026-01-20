import { Sidebar } from '@/components/dashboard/Sidebar';
import { TransactionList } from '@/components/dashboard/TransactionList';
import { AddTransactionDialog } from '@/components/dashboard/AddTransactionDialog';
import { useTransactions } from '@/hooks/useTransactions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Loader2 } from 'lucide-react';
import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Income() {
  const now = new Date();
  const startDate = format(startOfMonth(now), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(now), 'yyyy-MM-dd');
  
  const { data: allTransactions = [], isLoading } = useTransactions();
  const { data: monthTransactions = [] } = useTransactions(startDate, endDate);

  const incomeTransactions = useMemo(() => 
    allTransactions.filter((t) => t.type === 'income'),
    [allTransactions]
  );

  const monthlyIncome = useMemo(() => 
    monthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0),
    [monthTransactions]
  );

  const currentMonth = format(now, "MMMM 'de' yyyy", { locale: es });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="lg:pl-64 p-4 lg:p-8 pt-20 lg:pt-8">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-3">
                <div className="w-10 h-10 gradient-income rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary-foreground" />
                </div>
                Ingresos
              </h1>
              <p className="text-muted-foreground mt-1">
                Gestiona todos tus ingresos
              </p>
            </div>
            <AddTransactionDialog defaultType="income" />
          </div>

          {/* Monthly Summary */}
          <Card className="shadow-soft border-border/50 border-l-4 border-l-success">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ingresos de {currentMonth}</p>
                  <p className="text-3xl font-bold text-success">
                    +${monthlyIncome.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="w-16 h-16 gradient-income rounded-2xl flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-primary-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transaction List */}
          <Card className="shadow-soft border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Historial de ingresos</CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionList transactions={incomeTransactions} showDelete />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
