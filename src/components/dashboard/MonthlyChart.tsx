import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Transaction } from '@/hooks/useTransactions';
import { format, startOfMonth, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { useCurrency } from '@/hooks/useCurrency';

interface MonthlyChartProps {
  transactions: Transaction[];
}

export function MonthlyChart({ transactions }: MonthlyChartProps) {
  const { symbol, locale } = useCurrency();

  const data = useMemo(() => {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = startOfMonth(subMonths(now, i));
      const monthKey = format(monthDate, 'yyyy-MM');
      const monthLabel = format(monthDate, 'MMM', { locale: es });
      
      const monthTransactions = transactions.filter((t) => 
        t.date.startsWith(monthKey)
      );
      
      const income = monthTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const expenses = monthTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      months.push({
        month: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
        ingresos: income,
        gastos: expenses,
      });
    }
    
    return months;
  }, [transactions]);

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="month" 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickFormatter={(value) => `${symbol} ${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip 
            formatter={(value: number) => [`${symbol} ${value.toLocaleString(locale, { minimumFractionDigits: 2 })}`, '']}
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))', 
              border: '1px solid hsl(var(--border))',
              borderRadius: '0.5rem',
            }}
          />
          <Legend />
          <Bar 
            dataKey="ingresos" 
            name="Ingresos"
            fill="hsl(142, 76%, 36%)" 
            radius={[4, 4, 0, 0]} 
          />
          <Bar 
            dataKey="gastos" 
            name="Gastos"
            fill="hsl(0, 84%, 60%)" 
            radius={[4, 4, 0, 0]} 
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
