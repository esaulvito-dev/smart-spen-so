import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Transaction, CATEGORY_LABELS, CATEGORY_ICONS, useDeleteTransaction } from '@/hooks/useTransactions';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface TransactionListProps {
  transactions: Transaction[];
  showDelete?: boolean;
}

export function TransactionList({ transactions, showDelete = false }: TransactionListProps) {
  const deleteTransaction = useDeleteTransaction();
  const { toast } = useToast();

  const handleDelete = async (id: string) => {
    try {
      await deleteTransaction.mutateAsync(id);
      toast({
        title: 'Transacción eliminada',
        description: 'La transacción ha sido eliminada correctamente.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la transacción.',
        variant: 'destructive',
      });
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No hay transacciones para mostrar</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          className="flex items-center gap-4 p-4 bg-card rounded-lg border border-border/50 hover:shadow-soft transition-shadow animate-fade-in"
        >
          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-lg">
            {CATEGORY_ICONS[transaction.category]}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">
              {transaction.description || CATEGORY_LABELS[transaction.category]}
            </p>
            <p className="text-sm text-muted-foreground">
              {CATEGORY_LABELS[transaction.category]} • {format(new Date(transaction.date), "d 'de' MMMM", { locale: es })}
            </p>
          </div>
          
          <div className="text-right">
            <p className={cn(
              'font-semibold',
              transaction.type === 'income' ? 'text-success' : 'text-destructive'
            )}>
              {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </p>
          </div>

          {showDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => handleDelete(transaction.id)}
              disabled={deleteTransaction.isPending}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
