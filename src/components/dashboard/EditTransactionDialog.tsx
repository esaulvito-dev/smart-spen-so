import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { 
  Transaction, 
  TransactionType, 
  TransactionCategory, 
  CATEGORY_LABELS, 
  useUpdateTransaction 
} from '@/hooks/useTransactions';

interface EditTransactionDialogProps {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categories: TransactionCategory[] = [
  'hogar', 'negocio', 'trabajo', 'alimentacion', 'transporte',
  'entretenimiento', 'salud', 'educacion', 'servicios', 'otros'
];

export function EditTransactionDialog({ transaction, open, onOpenChange }: EditTransactionDialogProps) {
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState<TransactionCategory>('otros');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  
  const updateTransaction = useUpdateTransaction();
  const { toast } = useToast();

  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setCategory(transaction.category);
      setAmount(transaction.amount.toString());
      setDescription(transaction.description || '');
      setDate(transaction.date);
    }
  }, [transaction]);

  const handleSubmit = async () => {
    if (!transaction) return;
    
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({
        title: 'Error',
        description: 'Por favor ingresa un monto válido',
        variant: 'destructive',
      });
      return;
    }

    if (!date) {
      toast({
        title: 'Error',
        description: 'Por favor selecciona una fecha',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateTransaction.mutateAsync({
        id: transaction.id,
        type,
        category,
        amount: parsedAmount,
        description: description.trim() || null,
        date,
      });
      
      toast({
        title: 'Transacción actualizada',
        description: `Se ha actualizado ${type === 'income' ? 'el ingreso' : 'el gasto'} de S/ ${parsedAmount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la transacción',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Editar Transacción</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Type Toggle */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={type === 'expense' ? 'default' : 'outline'}
              className={`flex-1 h-11 sm:h-10 active:scale-[0.98] ${type === 'expense' ? 'gradient-expense' : ''}`}
              onClick={() => setType('expense')}
            >
              Gasto
            </Button>
            <Button
              type="button"
              variant={type === 'income' ? 'default' : 'outline'}
              className={`flex-1 h-11 sm:h-10 active:scale-[0.98] ${type === 'income' ? 'gradient-income' : ''}`}
              onClick={() => setType('income')}
            >
              Ingreso
            </Button>
          </div>
          
          {/* Amount */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="edit-amount" className="text-sm">Monto</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">S/</span>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-9 h-11 sm:h-10 text-base sm:text-sm"
              />
            </div>
          </div>
          
          {/* Category */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="edit-category" className="text-sm">Categoría</Label>
            <Select value={category} onValueChange={(value) => setCategory(value as TransactionCategory)}>
              <SelectTrigger className="h-11 sm:h-10 text-base sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-base sm:text-sm">
                    {CATEGORY_LABELS[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Date */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="edit-date" className="text-sm">Fecha</Label>
            <Input
              id="edit-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-11 sm:h-10 text-base sm:text-sm"
            />
          </div>
          
          {/* Description */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="edit-description" className="text-sm">Descripción (opcional)</Label>
            <Textarea
              id="edit-description"
              placeholder="Ej: Compras del supermercado"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="resize-none text-base sm:text-sm min-h-[80px]"
              maxLength={200}
            />
          </div>
        </div>
        
        <div className="flex gap-3 pt-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            className="flex-1 h-11 sm:h-10 active:scale-[0.98]"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={updateTransaction.isPending}
            className="flex-1 h-11 sm:h-10 active:scale-[0.98]"
          >
            {updateTransaction.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Guardar'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}