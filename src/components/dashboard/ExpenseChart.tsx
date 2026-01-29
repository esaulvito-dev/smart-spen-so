import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Transaction, CATEGORY_LABELS, TransactionCategory, CATEGORY_ICONS } from '@/hooks/useTransactions';
import { useCustomCategories } from '@/hooks/useCustomCategories';

interface ExpenseChartProps {
  transactions: Transaction[];
}

const COLORS = [
  'hsl(160, 84%, 39%)',  // Primary emerald
  'hsl(45, 93%, 58%)',   // Accent gold
  'hsl(199, 89%, 48%)',  // Info blue
  'hsl(271, 91%, 65%)',  // Purple
  'hsl(24, 95%, 53%)',   // Orange
  'hsl(142, 76%, 36%)',  // Success green
  'hsl(0, 84%, 60%)',    // Destructive red
  'hsl(174, 72%, 40%)',  // Teal
  'hsl(38, 92%, 50%)',   // Warning yellow
  'hsl(215, 16%, 47%)',  // Muted gray
];

// Extract custom category name from description
const extractCustomCategory = (desc: string | null): string | null => {
  if (!desc) return null;
  const match = desc.match(/^\[([^\]]+)\]/);
  return match ? match[1] : null;
};

export function ExpenseChart({ transactions }: ExpenseChartProps) {
  const { data: customCategories = [] } = useCustomCategories();

  const data = useMemo(() => {
    const expenses = transactions.filter((t) => t.type === 'expense');
    
    // Group by effective category (including custom)
    const grouped = expenses.reduce((acc, t) => {
      const customCatName = extractCustomCategory(t.description);
      const effectiveCategory = customCatName || t.category;
      const customCat = customCategories.find(c => c.name === customCatName);
      
      const existing = acc.find((item) => item.category === effectiveCategory);
      if (existing) {
        existing.value += Number(t.amount);
      } else {
        let displayName: string;
        let icon: string;
        
        if (customCat) {
          displayName = customCat.name;
          icon = customCat.icon;
        } else if (customCatName) {
          displayName = customCatName;
          icon = '📋';
        } else {
          displayName = CATEGORY_LABELS[t.category as TransactionCategory] || t.category;
          icon = CATEGORY_ICONS[t.category as TransactionCategory] || '📦';
        }
        
        acc.push({
          category: effectiveCategory,
          name: `${icon} ${displayName}`,
          value: Number(t.amount),
        });
      }
      return acc;
    }, [] as { category: string; name: string; value: number }[]);
    
    return grouped.sort((a, b) => b.value - a.value);
  }, [transactions, customCategories]);

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        <p>No hay gastos para mostrar</p>
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => [`S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`, 'Monto']}
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))', 
              border: '1px solid hsl(var(--border))',
              borderRadius: '0.5rem',
            }}
          />
          <Legend 
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
