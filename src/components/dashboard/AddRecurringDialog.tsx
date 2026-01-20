import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Loader2 } from 'lucide-react';
import { TransactionType, TransactionCategory, CATEGORY_LABELS } from '@/hooks/useTransactions';
import { 
  useCreateRecurringTransaction, 
  useUpdateRecurringTransaction, 
  RecurringTransaction,
  Frequency,
  FREQUENCY_LABELS 
} from '@/hooks/useRecurringTransactions';

interface AddRecurringDialogProps {
  editRecurring?: RecurringTransaction | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const categories: TransactionCategory[] = [
  'hogar', 'negocio', 'trabajo', 'alimentacion', 'transporte',
  'entretenimiento', 'salud', 'educacion', 'servicios', 'otros'
];

const frequencies: Frequency[] = ['daily', 'weekly', 'biweekly', 'monthly', 'yearly'];

export function AddRecurringDialog({ editRecurring, open, onOpenChange }: AddRecurringDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState<TransactionCategory>('servicios');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('monthly');
  const [startDate, setStartDate] = useState('');
  
  const createRecurring = useCreateRecurringTransaction();
  const updateRecurring = useUpdateRecurringTransaction();
  const { toast } = useToast();

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? onOpenChange! : setInternalOpen;

  const isEditing = !!editRecurring;

  useEffect(() => {
    if (editRecurring) {
      setType(editRecurring.type);
      setCategory(editRecurring.category);
      setAmount(editRecurring.amount.toString());
      setDescription(editRecurring.description || '');
      setFrequency(editRecurring.frequency);
      setStartDate(editRecurring.next_due_date);
    } else {
      setType('expense');
      setCategory('servicios');
      setAmount('');
      setDescription('');
      setFrequency('monthly');
      setStartDate(new Date().toISOString().split('T')[0]);
    }
  }, [editRecurring, isOpen]);

  const handleSubmit = async () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({
        title: 'Error',
        description: 'Por favor ingresa un monto válido',
        variant: 'destructive',
      });
      return;
    }

    if (!startDate) {
      toast({
        title: 'Error',
        description: 'Por favor selecciona una fecha',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (isEditing && editRecurring) {
        await updateRecurring.mutateAsync({
          id: editRecurring.id,
          type,
          category,
          amount: parsedAmount,
          description: description.trim() || null,
          frequency,
          next_due_date: startDate,
        });
        toast({
          title: 'Transacción actualizada',
          description: 'La transacción recurrente ha sido actualizada',
        });
      } else {
        await createRecurring.mutateAsync({
          type,
          category,
          amount: parsedAmount,
          description: description.trim() || undefined,
          frequency,
          start_date: startDate,
          next_due_date: startDate,
        });
        toast({
          title: 'Transacción creada',
          description: `Se ha creado una transacción ${FREQUENCY_LABELS[frequency].toLowerCase()}`,
        });
      }
      
      setAmount('');
      setDescription('');
      setIsOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: isEditing ? 'No se pudo actualizar' : 'No se pudo crear la transacción',
        variant: 'destructive',
      });
    }
  };

  const isPending = createRecurring.isPending || updateRecurring.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button className="gradient-primary gap-2 h-10 sm:h-11 px-4 sm:px-6 active:scale-[0.98]">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nueva Recurrente</span>
            <span className="sm:hidden">Agregar</span>
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {isEditing ? 'Editar Recurrente' : 'Nueva Transacción Recurrente'}
          </DialogTitle>
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
            <Label htmlFor="recurring-amount" className="text-sm">Monto</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">S/</span>
              <Input
                id="recurring-amount"
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

          {/* Frequency */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-sm">Frecuencia</Label>
            <Select value={frequency} onValueChange={(value) => setFrequency(value as Frequency)}>
              <SelectTrigger className="h-11 sm:h-10 text-base sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {frequencies.map((freq) => (
                  <SelectItem key={freq} value={freq} className="text-base sm:text-sm">
                    {FREQUENCY_LABELS[freq]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Category */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-sm">Categoría</Label>
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
          
          {/* Start Date */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="recurring-date" className="text-sm">
              {isEditing ? 'Próxima fecha' : 'Fecha de inicio'}
            </Label>
            <Input
              id="recurring-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-11 sm:h-10 text-base sm:text-sm"
            />
          </div>
          
          {/* Description */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="recurring-description" className="text-sm">Descripción (opcional)</Label>
            <Textarea
              id="recurring-description"
              placeholder="Ej: Renta del departamento"
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
            onClick={() => setIsOpen(false)} 
            className="flex-1 h-11 sm:h-10 active:scale-[0.98]"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isPending}
            className="flex-1 h-11 sm:h-10 active:scale-[0.98]"
          >
            {isPending ? (
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
