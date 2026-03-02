import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { TransactionList } from '@/components/dashboard/TransactionList';
import { ExpenseChart } from '@/components/dashboard/ExpenseChart';
import { MonthlyChart } from '@/components/dashboard/MonthlyChart';
import { AddTransactionDialog } from '@/components/dashboard/AddTransactionDialog';
import { ExportReportDialog } from '@/components/dashboard/ExportReportDialog';
import { useTransactions, CATEGORY_LABELS, CATEGORY_ICONS, TransactionCategory } from '@/hooks/useTransactions';
import { useCustomCategories } from '@/hooks/useCustomCategories';
import { useProfile } from '@/hooks/useProfile';
import { useCurrency } from '@/hooks/useCurrency';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, TrendingUp, TrendingDown, PiggyBank, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function Dashboard() {
  const { data: profile } = useProfile();
  const { formatCurrency, symbol } = useCurrency();
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const startDate = format(monthStart, 'yyyy-MM-dd');
  const endDate = format(monthEnd, 'yyyy-MM-dd');
  
  const { data: allTransactions = [], isLoading } = useTransactions();
  const { data: monthTransactions = [] } = useTransactions(startDate, endDate);
  const { data: customCategories = [] } = useCustomCategories();

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

  // Extract custom category name from description
  const extractCustomCategory = (desc: string | null): string | null => {
    if (!desc) return null;
    const match = desc.match(/^\[([^\]]+)\]/);
    return match ? match[1] : null;
  };

  // Get category display info
  const getCategoryDisplay = (category: string) => {
    const customCat = customCategories.find(c => c.name === category);
    if (customCat) {
      return { icon: customCat.icon, label: customCat.name };
    }
    if (CATEGORY_LABELS[category as TransactionCategory]) {
      return { 
        icon: CATEGORY_ICONS[category as TransactionCategory], 
        label: CATEGORY_LABELS[category as TransactionCategory] 
      };
    }
    return { icon: '📋', label: category };
  };

  // Top income categories (with custom category support)
  const incomeByCategory = useMemo(() => {
    const grouped: Record<string, number> = {};
    monthTransactions
      .filter(t => t.type === 'income')
      .forEach(t => {
        const customCatName = extractCustomCategory(t.description);
        const effectiveCategory = customCatName || t.category;
        grouped[effectiveCategory] = (grouped[effectiveCategory] || 0) + Number(t.amount);
      });
    
    return Object.entries(grouped)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);
  }, [monthTransactions]);

  // Top expense categories (with custom category support)
  const expensesByCategory = useMemo(() => {
    const grouped: Record<string, number> = {};
    monthTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const customCatName = extractCustomCategory(t.description);
        const effectiveCategory = customCatName || t.category;
        grouped[effectiveCategory] = (grouped[effectiveCategory] || 0) + Number(t.amount);
      });
    
    return Object.entries(grouped)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);
  }, [monthTransactions]);

  // Recent transactions by type
  const recentIncome = useMemo(() => 
    allTransactions.filter(t => t.type === 'income').slice(0, 5),
    [allTransactions]
  );

  const recentExpenses = useMemo(() => 
    allTransactions.filter(t => t.type === 'expense').slice(0, 5),
    [allTransactions]
  );

  const currentMonth = format(now, "MMMM yyyy", { locale: es });
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
    <div className="min-h-screen min-h-[100dvh] bg-background">
      <Sidebar />
      <main className="lg:pl-64 p-3 sm:p-4 lg:p-8 pt-[72px] lg:pt-8 pb-6">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
          {/* Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">{greeting}</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Resumen de {currentMonth}
              </p>
            </div>
            <div className="flex gap-2">
              <ExportReportDialog 
                transactions={monthTransactions}
                periodLabel={currentMonth}
                startDate={monthStart}
                endDate={monthEnd}
              />
              <AddTransactionDialog />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatsCard
              title="Balance"
              value={formatCurrency(stats.balance)}
              subtitle={stats.balance >= 0 ? 'Vas bien 💪' : 'Cuidado'}
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
              title="Ahorro"
              value={`${stats.savingsRate}%`}
              subtitle={Number(stats.savingsRate) >= 20 ? '¡Excelente!' : 'Meta: 20%'}
              icon={PiggyBank}
            />
          </div>

          {/* Income & Expenses Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Income Section */}
            <Card className="shadow-soft border-border/50 border-l-4 border-l-success">
              <CardHeader className="pb-2 sm:pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg gradient-income flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-base sm:text-lg">Ingresos del mes</CardTitle>
                  </div>
                  <span className="text-lg sm:text-xl font-bold text-success">
                    +{formatCurrency(stats.totalIncome)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Top Income Categories */}
                {incomeByCategory.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground font-medium">Top categorías</p>
                    {incomeByCategory.map(({ category, amount }) => {
                      const percentage = stats.totalIncome > 0 ? (amount / stats.totalIncome) * 100 : 0;
                      const { icon, label } = getCategoryDisplay(category);
                      return (
                        <div key={category} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span>{icon}</span>
                              <span className="font-medium">{label}</span>
                            </div>
                            <span className="text-success font-medium">
                              {formatCurrency(amount)}
                            </span>
                          </div>
                          <Progress value={percentage} className="h-1.5 [&>div]:bg-success" />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Sin ingresos este mes
                  </p>
                )}
                
                {/* Recent Income */}
                {recentIncome.length > 0 && (
                  <div className="pt-2 border-t border-border/50">
                    <p className="text-xs text-muted-foreground font-medium mb-2">Últimos ingresos</p>
                    <TransactionList transactions={recentIncome} showEdit />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Expenses Section */}
            <Card className="shadow-soft border-border/50 border-l-4 border-l-destructive">
              <CardHeader className="pb-2 sm:pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg gradient-expense flex items-center justify-center">
                      <TrendingDown className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-base sm:text-lg">Gastos del mes</CardTitle>
                  </div>
                  <span className="text-lg sm:text-xl font-bold text-destructive">
                    -{formatCurrency(stats.totalExpenses)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Top Expense Categories */}
                {expensesByCategory.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground font-medium">Top categorías</p>
                    {expensesByCategory.map(({ category, amount }) => {
                      const percentage = stats.totalExpenses > 0 ? (amount / stats.totalExpenses) * 100 : 0;
                      const { icon, label } = getCategoryDisplay(category);
                      return (
                        <div key={category} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span>{icon}</span>
                              <span className="font-medium">{label}</span>
                            </div>
                            <span className="text-destructive font-medium">
                              {formatCurrency(amount)}
                            </span>
                          </div>
                          <Progress value={percentage} className="h-1.5 [&>div]:bg-destructive" />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Sin gastos este mes
                  </p>
                )}
                
                {/* Recent Expenses */}
                {recentExpenses.length > 0 && (
                  <div className="pt-2 border-t border-border/50">
                    <p className="text-xs text-muted-foreground font-medium mb-2">Últimos gastos</p>
                    <TransactionList transactions={recentExpenses} showEdit />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card className="shadow-soft border-border/50">
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="text-base sm:text-lg">Gastos por categoría</CardTitle>
              </CardHeader>
              <CardContent className="px-2 sm:px-6">
                <ExpenseChart transactions={monthTransactions} />
              </CardContent>
            </Card>

            <Card className="shadow-soft border-border/50">
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="text-base sm:text-lg">Resumen mensual</CardTitle>
              </CardHeader>
              <CardContent className="px-2 sm:px-6">
                <MonthlyChart transactions={allTransactions} />
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions */}
          <Card className="shadow-soft border-border/50">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Todas las transacciones recientes</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <TransactionList transactions={allTransactions.slice(0, 10)} showEdit />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
