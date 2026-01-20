import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { TransactionList } from '@/components/dashboard/TransactionList';
import { ExpenseChart } from '@/components/dashboard/ExpenseChart';
import { MonthlyChart } from '@/components/dashboard/MonthlyChart';
import { AddTransactionDialog } from '@/components/dashboard/AddTransactionDialog';
import { useTransactions } from '@/hooks/useTransactions';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, TrendingUp, TrendingDown, PiggyBank, Loader2 } from 'lucide-react';

export default function Dashboard() {
  const { data: profile } = useProfile();
  const now = new Date();
  const startDate = format(startOfMonth(now), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(now), 'yyyy-MM-dd');
  
  const { data: allTransactions = [], isLoading } = useTransactions();
  const { data: monthTransactions = [] } = useTransactions(startDate, endDate);

  const stats = useMemo(() => {
    const totalIncome = monthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const totalExpenses = monthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const balance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : '0';
    
    return { totalIncome, totalExpenses, balance, savingsRate };
  }, [monthTransactions]);

  const formatCurrency = (amount: number) => {
    return `$${Math.abs(amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
  };

  const currentMonth = format(now, "MMMM 'de' yyyy", { locale: es });
  const greeting = profile?.full_name 
    ? `¡Hola, ${profile.full_name.split(' ')[0]}!` 
    : '¡Bienvenido!';

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
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold">{greeting}</h1>
              <p className="text-muted-foreground">
                Resumen de {currentMonth}
              </p>
            </div>
            <AddTransactionDialog />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Balance del mes"
              value={formatCurrency(stats.balance)}
              subtitle={stats.balance >= 0 ? 'Vas bien 💪' : 'Cuidado con los gastos'}
              icon={Wallet}
              variant="balance"
            />
            <StatsCard
              title="Ingresos"
              value={formatCurrency(stats.totalIncome)}
              icon={TrendingUp}
              variant="income"
            />
            <StatsCard
              title="Gastos"
              value={formatCurrency(stats.totalExpenses)}
              icon={TrendingDown}
              variant="expense"
            />
            <StatsCard
              title="Tasa de ahorro"
              value={`${stats.savingsRate}%`}
              subtitle={Number(stats.savingsRate) >= 20 ? '¡Excelente!' : 'Meta: 20%'}
              icon={PiggyBank}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-soft border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Gastos por categoría</CardTitle>
              </CardHeader>
              <CardContent>
                <ExpenseChart transactions={monthTransactions} />
              </CardContent>
            </Card>

            <Card className="shadow-soft border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Resumen mensual</CardTitle>
              </CardHeader>
              <CardContent>
                <MonthlyChart transactions={allTransactions} />
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions */}
          <Card className="shadow-soft border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Transacciones recientes</CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionList transactions={allTransactions.slice(0, 10)} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
