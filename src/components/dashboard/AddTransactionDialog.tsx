import { useState } from 'react';
import { useCreateTransaction, TransactionType, TransactionCategory, CATEGORY_LABELS } from '@/hooks/useTransactions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface AddTransactionDialogProps {
  defaultType?: TransactionType;
}

export function AddTransactionDialog({ defaultType = 'expense' }: AddTransactionDialogProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TransactionType>(defaultType);
  const [category, setCategory] = useState<TransactionCategory>('otros');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  const createTransaction = useCreateTransaction();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({
        title: 'Error',
        description: 'Por favor ingresa un monto válido.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createTransaction.mutateAsync({
        type,
        category,
        amount: parsedAmount,
        description: description || undefined,
        date,
      });
      
      toast({
        title: type === 'income' ? 'Ingreso registrado' : 'Gasto registrado',
        description: `Se ha registrado ${type === 'income' ? 'un ingreso' : 'un gasto'} de $${parsedAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      });
      
      // Reset form
      setAmount('');
      setDescription('');
      setCategory('otros');
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo registrar la transacción.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-primary text-primary-foreground hover:opacity-90 active:scale-[0.98] h-10 sm:h-9 px-3 sm:px-4 text-sm">
          <Plus className="w-4 h-4 mr-1.5 sm:mr-2" />
          <span className="hidden sm:inline">Nueva transacción</span>
          <span className="sm:hidden">Nuevo</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Nueva transacción</DialogTitle>
          <DialogDescription className="text-sm">
            Registra un nuevo ingreso o gasto en tu cuenta.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={type === 'expense' ? 'default' : 'outline'}
              className={cn(
                'h-11 sm:h-10 text-sm active:scale-[0.98]',
                type === 'expense' ? 'gradient-expense text-primary-foreground' : ''
              )}
              onClick={() => setType('expense')}
            >
              Gasto
            </Button>
            <Button
              type="button"
              variant={type === 'income' ? 'default' : 'outline'}
              className={cn(
                'h-11 sm:h-10 text-sm active:scale-[0.98]',
                type === 'income' ? 'gradient-income text-primary-foreground' : ''
              )}
              onClick={() => setType('income')}
            >
              Ingreso
            </Button>
          </div>
          
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="amount" className="text-sm">Monto</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-7 h-11 sm:h-10 text-base sm:text-sm"
                required
              />
            </div>
          </div>
          
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="category" className="text-sm">Categoría</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as TransactionCategory)}>
              <SelectTrigger className="h-11 sm:h-10 text-base sm:text-sm">
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(CATEGORY_LABELS) as TransactionCategory[]).map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-sm py-2.5 sm:py-2">
                    {CATEGORY_LABELS[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="date" className="text-sm">Fecha</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-11 sm:h-10 text-base sm:text-sm"
              required
            />
          </div>
          
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="description" className="text-sm">Descripción (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Ej: Pago de luz del mes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="text-base sm:text-sm resize-none"
            />
          </div>
          
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="w-full sm:w-auto h-11 sm:h-10 order-2 sm:order-1"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createTransaction.isPending}
              className="w-full sm:w-auto h-11 sm:h-10 order-1 sm:order-2"
            >
              {createTransaction.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
