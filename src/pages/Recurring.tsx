import { useState, useMemo } from 'react';
import { format, isPast, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Loader2, Plus, Pencil, Trash2, Play, Pause, AlertCircle } from 'lucide-react';
import { 
  useRecurringTransactions, 
  useDeleteRecurringTransaction, 
  useUpdateRecurringTransaction,
  RecurringTransaction,
  FREQUENCY_LABELS,
  calculateNextDueDate
} from '@/hooks/useRecurringTransactions';
import { useCreateTransaction } from '@/hooks/useTransactions';
import { CATEGORY_LABELS, CATEGORY_ICONS, TransactionCategory } from '@/hooks/useTransactions';
import { AddRecurringDialog } from '@/components/dashboard/AddRecurringDialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function Recurring() {
  const [editingRecurring, setEditingRecurring] = useState<RecurringTransaction | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const { data: recurring = [], isLoading } = useRecurringTransactions();
  const deleteRecurring = useDeleteRecurringTransaction();
  const updateRecurring = useUpdateRecurringTransaction();
  const createTransaction = useCreateTransaction();
  const { toast } = useToast();

  const { activeRecurring, pausedRecurring, dueToday, overdue } = useMemo(() => {
    const active = recurring.filter(r => r.is_active);
    const paused = recurring.filter(r => !r.is_active);
    const due = active.filter(r => isToday(new Date(r.next_due_date)));
    const over = active.filter(r => isPast(new Date(r.next_due_date)) && !isToday(new Date(r.next_due_date)));
    return { activeRecurring: active, pausedRecurring: paused, dueToday: due, overdue: over };
  }, [recurring]);

  const monthlyTotal = useMemo(() => {
    return activeRecurring.reduce((sum, r) => {
      let monthlyAmount = Number(r.amount);
      switch (r.frequency) {
        case 'daily': monthlyAmount *= 30; break;
        case 'weekly': monthlyAmount *= 4; break;
        case 'biweekly': monthlyAmount *= 2; break;
        case 'yearly': monthlyAmount /= 12; break;
      }
      return sum + monthlyAmount;
    }, 0);
  }, [activeRecurring]);

  const handleDelete = async (id: string) => {
    try {
      await deleteRecurring.mutateAsync(id);
      toast({
        title: 'Transacción eliminada',
        description: 'La transacción recurrente ha sido eliminada.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la transacción.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (r: RecurringTransaction) => {
    try {
      await updateRecurring.mutateAsync({
        id: r.id,
        is_active: !r.is_active,
      });
      toast({
        title: r.is_active ? 'Pausada' : 'Activada',
        description: `La transacción ha sido ${r.is_active ? 'pausada' : 'activada'}.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la transacción.',
        variant: 'destructive',
      });
    }
  };

  const handleExecute = async (r: RecurringTransaction) => {
    try {
      // Create the actual transaction
      await createTransaction.mutateAsync({
        type: r.type,
        category: r.category,
        amount: Number(r.amount),
        description: r.description || undefined,
        date: format(new Date(), 'yyyy-MM-dd'),
      });

      // Update next due date
      const nextDue = calculateNextDueDate(r.next_due_date, r.frequency);
      await updateRecurring.mutateAsync({
        id: r.id,
        next_due_date: nextDue,
      });

      toast({
        title: 'Transacción registrada',
        description: `Se registró ${r.type === 'income' ? 'el ingreso' : 'el gasto'} de S/ ${Number(r.amount).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo registrar la transacción.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const RecurringCard = ({ r, showActions = true }: { r: RecurringTransaction; showActions?: boolean }) => {
    const isDue = isToday(new Date(r.next_due_date));
    const isOver = isPast(new Date(r.next_due_date)) && !isDue;

    return (
      <Card className={cn(
        "shadow-soft border-border/50",
        !r.is_active && "opacity-60",
        isOver && r.is_active && "border-destructive/50",
        isDue && r.is_active && "border-warning/50"
      )}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center text-lg",
                r.type === 'income' ? 'bg-success/20' : 'bg-destructive/20'
              )}>
                {CATEGORY_ICONS[r.category as TransactionCategory]}
              </div>
              <div>
                <h3 className="font-semibold text-sm sm:text-base">
                  {r.description || CATEGORY_LABELS[r.category as TransactionCategory]}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {FREQUENCY_LABELS[r.frequency]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {CATEGORY_LABELS[r.category as TransactionCategory]}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className={cn(
                "font-bold",
                r.type === 'income' ? 'text-success' : 'text-destructive'
              )}>
                {r.type === 'income' ? '+' : '-'}S/ {Number(r.amount).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
              </p>
              <p className={cn(
                "text-xs mt-1",
                isOver ? "text-destructive font-medium" :
                isDue ? "text-warning font-medium" :
                "text-muted-foreground"
              )}>
                {isOver ? '⚠️ Vencida' : isDue ? '📌 Hoy' : format(new Date(r.next_due_date), "d MMM", { locale: es })}
              </p>
            </div>
          </div>

          {showActions && (
            <div className="flex gap-2 mt-3 pt-3 border-t border-border/50">
              {r.is_active && (isDue || isOver) && (
                <Button
                  size="sm"
                  className="flex-1 gradient-primary"
                  onClick={() => handleExecute(r)}
                  disabled={createTransaction.isPending}
                >
                  <Play className="w-3 h-3 mr-1" />
                  Registrar
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggleActive(r)}
              >
                {r.is_active ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingRecurring(r);
                  setEditDialogOpen(true);
                }}
              >
                <Pencil className="w-3 h-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => handleDelete(r.id)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-background">
      <Sidebar />
      <main className="lg:pl-64 p-3 sm:p-4 lg:p-8 pt-[72px] lg:pt-8 pb-6">
        <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
          {/* Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 gradient-primary rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Transacciones Recurrentes</h1>
                <p className="text-sm text-muted-foreground hidden sm:block">
                  Gastos e ingresos fijos automáticos
                </p>
              </div>
            </div>
            <AddRecurringDialog />
          </div>

          {/* Summary */}
          {recurring.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Card className="shadow-soft border-border/50">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Activas</p>
                  <p className="text-xl sm:text-2xl font-bold">{activeRecurring.length}</p>
                </CardContent>
              </Card>
              <Card className="shadow-soft border-border/50">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Total mensual</p>
                  <p className="text-xl sm:text-2xl font-bold">
                    S/ {monthlyTotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                  </p>
                </CardContent>
              </Card>
              {overdue.length > 0 && (
                <Card className="shadow-soft border-destructive/50 bg-destructive/5">
                  <CardContent className="p-4">
                    <p className="text-xs text-destructive">Vencidas</p>
                    <p className="text-xl sm:text-2xl font-bold text-destructive">{overdue.length}</p>
                  </CardContent>
                </Card>
              )}
              {dueToday.length > 0 && (
                <Card className="shadow-soft border-warning/50 bg-warning/5">
                  <CardContent className="p-4">
                    <p className="text-xs text-warning-foreground">Para hoy</p>
                    <p className="text-xl sm:text-2xl font-bold">{dueToday.length}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Overdue Alert */}
          {overdue.length > 0 && (
            <Card className="shadow-soft border-destructive/50 bg-destructive/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  Transacciones vencidas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {overdue.map(r => (
                  <RecurringCard key={r.id} r={r} />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Due Today */}
          {dueToday.length > 0 && (
            <Card className="shadow-soft border-warning/50 bg-warning/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  📌 Para hoy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {dueToday.map(r => (
                  <RecurringCard key={r.id} r={r} />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Active Recurring */}
          {activeRecurring.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Todas las recurrentes</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeRecurring.map(r => (
                  <RecurringCard key={r.id} r={r} />
                ))}
              </div>
            </div>
          ) : (
            <Card className="shadow-soft border-border/50">
              <CardContent>
                <div className="text-center py-8 sm:py-12">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 gradient-primary rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <RefreshCw className="w-8 h-8 sm:w-10 sm:h-10 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">Sin transacciones recurrentes</h3>
                  <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto px-4 mb-4">
                    Agrega gastos o ingresos fijos como renta, servicios o sueldo 
                    para registrarlos automáticamente cada período.
                  </p>
                  <AddRecurringDialog />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Paused */}
          {pausedRecurring.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-muted-foreground">Pausadas</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {pausedRecurring.map(r => (
                  <RecurringCard key={r.id} r={r} />
                ))}
              </div>
            </div>
          )}

          {/* Edit Dialog */}
          <AddRecurringDialog
            editRecurring={editingRecurring}
            open={editDialogOpen}
            onOpenChange={(open) => {
              setEditDialogOpen(open);
              if (!open) setEditingRecurring(null);
            }}
          />
        </div>
      </main>
    </div>
  );
}
