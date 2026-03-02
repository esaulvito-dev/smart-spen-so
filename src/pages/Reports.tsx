import { useState, useMemo, useRef } from 'react';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from 'date-fns';
import { es } from 'date-fns/locale';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Loader2, Download, TrendingUp, TrendingDown, Wallet, PiggyBank } from 'lucide-react';
import { useTransactions, CATEGORY_LABELS, CATEGORY_ICONS, TransactionCategory } from '@/hooks/useTransactions';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/hooks/useCurrency';

type Period = 'current' | 'last' | 'last3' | 'last6' | 'year';

const PERIOD_LABELS: Record<Period, string> = {
  current: 'Este mes',
  last: 'Mes pasado',
  last3: 'Últimos 3 meses',
  last6: 'Últimos 6 meses',
  year: 'Este año',
};

export default function Reports() {
  const [period, setPeriod] = useState<Period>('current');
  const reportRef = useRef<HTMLDivElement>(null);
  const { formatCurrency, symbol } = useCurrency();

  const now = new Date();

  const dateRange = useMemo(() => {
    switch (period) {
      case 'current':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'last':
        const lastMonth = subMonths(now, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      case 'last3':
        return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
      case 'last6':
        return { start: startOfMonth(subMonths(now, 5)), end: endOfMonth(now) };
      case 'year':
        return { start: startOfYear(now), end: endOfYear(now) };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  }, [period]);

  const { data: transactions = [], isLoading } = useTransactions(
    format(dateRange.start, 'yyyy-MM-dd'),
    format(dateRange.end, 'yyyy-MM-dd')
  );

  const stats = useMemo(() => {
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const balance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;

    return { totalIncome, totalExpenses, balance, savingsRate };
  }, [transactions]);

  const incomeByCategory = useMemo(() => {
    const grouped: Record<string, number> = {};
    transactions
      .filter(t => t.type === 'income')
      .forEach(t => {
        grouped[t.category] = (grouped[t.category] || 0) + Number(t.amount);
      });
    
    return Object.entries(grouped)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  const expensesByCategory = useMemo(() => {
    const grouped: Record<string, number> = {};
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        grouped[t.category] = (grouped[t.category] || 0) + Number(t.amount);
      });
    
    return Object.entries(grouped)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  const handleExportPDF = () => {
    const printContent = `
      <html>
        <head>
          <title>Reporte Financiero - BudgetTrack</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            h1 { color: #10B981; margin-bottom: 8px; }
            h2 { color: #374151; margin-top: 32px; border-bottom: 2px solid #E5E7EB; padding-bottom: 8px; }
            .header { margin-bottom: 32px; }
            .period { color: #6B7280; font-size: 14px; }
            .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin: 24px 0; }
            .stat-card { padding: 16px; border: 1px solid #E5E7EB; border-radius: 8px; }
            .stat-label { font-size: 12px; color: #6B7280; }
            .stat-value { font-size: 24px; font-weight: bold; }
            .income { color: #10B981; }
            .expense { color: #EF4444; }
            .category-list { margin-top: 16px; }
            .category-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #F3F4F6; }
            .footer { margin-top: 48px; text-align: center; color: #9CA3AF; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📊 BudgetTrack</h1>
            <p class="period">Reporte: ${PERIOD_LABELS[period]} (${format(dateRange.start, "d MMM", { locale: es })} - ${format(dateRange.end, "d MMM yyyy", { locale: es })})</p>
          </div>

          <div class="stats">
            <div class="stat-card">
              <p class="stat-label">Ingresos Totales</p>
              <p class="stat-value income">+${symbol} ${stats.totalIncome.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
            </div>
            <div class="stat-card">
              <p class="stat-label">Gastos Totales</p>
              <p class="stat-value expense">-${symbol} ${stats.totalExpenses.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
            </div>
            <div class="stat-card">
              <p class="stat-label">Balance</p>
              <p class="stat-value" style="color: ${stats.balance >= 0 ? '#10B981' : '#EF4444'}">${symbol} ${stats.balance.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
            </div>
            <div class="stat-card">
              <p class="stat-label">Tasa de Ahorro</p>
              <p class="stat-value">${stats.savingsRate.toFixed(1)}%</p>
            </div>
          </div>

          <h2>📈 Ingresos por Categoría</h2>
          <div class="category-list">
            ${incomeByCategory.map(({ category, amount }) => `
              <div class="category-item">
                <span>${CATEGORY_ICONS[category as TransactionCategory]} ${CATEGORY_LABELS[category as TransactionCategory]}</span>
                <span class="income">${symbol} ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
              </div>
            `).join('')}
            ${incomeByCategory.length === 0 ? '<p style="color: #9CA3AF">Sin ingresos en este período</p>' : ''}
          </div>

          <h2>📉 Gastos por Categoría</h2>
          <div class="category-list">
            ${expensesByCategory.map(({ category, amount }) => `
              <div class="category-item">
                <span>${CATEGORY_ICONS[category as TransactionCategory]} ${CATEGORY_LABELS[category as TransactionCategory]}</span>
                <span class="expense">${symbol} ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
              </div>
            `).join('')}
            ${expensesByCategory.length === 0 ? '<p style="color: #9CA3AF">Sin gastos en este período</p>' : ''}
          </div>

          <div class="footer">
            <p>Generado por BudgetTrack el ${format(new Date(), "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
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
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Reportes</h1>
                <p className="text-sm text-muted-foreground hidden sm:block">
                  Análisis detallado de tus finanzas
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
                <SelectTrigger className="w-[160px] h-10 sm:h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PERIOD_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleExportPDF} className="gradient-primary gap-2">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Exportar PDF</span>
              </Button>
            </div>
          </div>

          {/* Period Label */}
          <p className="text-sm text-muted-foreground">
            {format(dateRange.start, "d 'de' MMMM", { locale: es })} - {format(dateRange.end, "d 'de' MMMM 'de' yyyy", { locale: es })}
          </p>

          {/* Summary Stats */}
          <div ref={reportRef} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card className="shadow-soft border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-success" />
                  <p className="text-xs text-muted-foreground">Ingresos</p>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-success">
                  +{formatCurrency(stats.totalIncome)}
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-soft border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-destructive" />
                  <p className="text-xs text-muted-foreground">Gastos</p>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-destructive">
                  -{formatCurrency(stats.totalExpenses)}
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-soft border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="w-4 h-4" />
                  <p className="text-xs text-muted-foreground">Balance</p>
                </div>
                <p className={cn(
                  "text-xl sm:text-2xl font-bold",
                  stats.balance >= 0 ? "text-success" : "text-destructive"
                )}>
                  {formatCurrency(stats.balance)}
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-soft border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <PiggyBank className="w-4 h-4" />
                  <p className="text-xs text-muted-foreground">Tasa de ahorro</p>
                </div>
                <p className={cn(
                  "text-xl sm:text-2xl font-bold",
                  stats.savingsRate >= 20 ? "text-success" : 
                  stats.savingsRate >= 10 ? "text-warning" : "text-destructive"
                )}>
                  {stats.savingsRate.toFixed(1)}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Income by Category */}
          <Card className="shadow-soft border-border/50">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-success" />
                Ingresos por categoría
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {incomeByCategory.length > 0 ? (
                incomeByCategory.map(({ category, amount }) => {
                  const percentage = stats.totalIncome > 0 ? (amount / stats.totalIncome) * 100 : 0;
                  return (
                    <div key={category} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span>{CATEGORY_ICONS[category as TransactionCategory]}</span>
                          <span className="font-medium">{CATEGORY_LABELS[category as TransactionCategory]}</span>
                          <span className="text-muted-foreground">({percentage.toFixed(1)}%)</span>
                        </div>
                        <span className="text-success font-medium">
                          {formatCurrency(amount)}
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2 [&>div]:bg-success" />
                    </div>
                  );
                })
              ) : (
                <p className="text-center py-4 text-muted-foreground">Sin ingresos en este período</p>
              )}
            </CardContent>
          </Card>

          {/* Expenses by Category */}
          <Card className="shadow-soft border-border/50">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-destructive" />
                Gastos por categoría
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {expensesByCategory.length > 0 ? (
                expensesByCategory.map(({ category, amount }) => {
                  const percentage = stats.totalExpenses > 0 ? (amount / stats.totalExpenses) * 100 : 0;
                  return (
                    <div key={category} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span>{CATEGORY_ICONS[category as TransactionCategory]}</span>
                          <span className="font-medium">{CATEGORY_LABELS[category as TransactionCategory]}</span>
                          <span className="text-muted-foreground">({percentage.toFixed(1)}%)</span>
                        </div>
                        <span className="text-destructive font-medium">
                          {formatCurrency(amount)}
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2 [&>div]:bg-destructive" />
                    </div>
                  );
                })
              ) : (
                <p className="text-center py-4 text-muted-foreground">Sin gastos en este período</p>
              )}
            </CardContent>
          </Card>

          {/* Transactions Count */}
          <Card className="shadow-soft border-border/50">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total de transacciones</span>
                <span className="font-bold text-lg">{transactions.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
