import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Transaction, CATEGORY_LABELS, CATEGORY_ICONS, useDeleteTransaction } from '@/hooks/useTransactions';
import { Button } from '@/components/ui/button';
import { Trash2, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { EditTransactionDialog } from './EditTransactionDialog';

interface TransactionListProps {
  transactions: Transaction[];
  showDelete?: boolean;
  showEdit?: boolean;
}

export function TransactionList({ transactions, showDelete = false, showEdit = false }: TransactionListProps) {
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
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

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setEditDialogOpen(true);
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12 text-muted-foreground">
        <p className="text-sm sm:text-base">No hay transacciones para mostrar</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2 sm:space-y-3">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-card rounded-lg border border-border/50 hover:shadow-soft transition-shadow animate-fade-in active:bg-secondary/50"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-secondary flex items-center justify-center text-base sm:text-lg shrink-0">
              {CATEGORY_ICONS[transaction.category]}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm sm:text-base truncate">
                {transaction.description || CATEGORY_LABELS[transaction.category]}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                {CATEGORY_LABELS[transaction.category]} • {format(new Date(transaction.date), "d MMM", { locale: es })}
              </p>
            </div>
            
            <div className="text-right shrink-0">
              <p className={cn(
                'font-semibold text-sm sm:text-base',
                transaction.type === 'income' ? 'text-success' : 'text-destructive'
              )}>
                {transaction.type === 'income' ? '+' : '-'}S/ {transaction.amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            {(showEdit || showDelete) && (
              <div className="flex gap-1 shrink-0">
                {showEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-primary w-9 h-9 sm:w-10 sm:h-10"
                    onClick={() => handleEdit(transaction)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                )}
                {showDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive w-9 h-9 sm:w-10 sm:h-10"
                    onClick={() => handleDelete(transaction.id)}
                    disabled={deleteTransaction.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <EditTransactionDialog
        transaction={editingTransaction}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
    </>
  );
}