import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Loader2 } from 'lucide-react';
import { TransactionCategory, CATEGORY_LABELS } from '@/hooks/useTransactions';
import { useCreateBudget, useUpdateBudget, Budget } from '@/hooks/useBudgets';
import { useCurrency } from '@/hooks/useCurrency';

interface AddBudgetDialogProps {
  existingCategories: TransactionCategory[];
  editBudget?: Budget | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const allCategories: TransactionCategory[] = [
  'hogar', 'negocio', 'trabajo', 'alimentacion', 'transporte',
  'entretenimiento', 'salud', 'educacion', 'servicios', 'otros'
];

export function AddBudgetDialog({ existingCategories, editBudget, open, onOpenChange }: AddBudgetDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [category, setCategory] = useState<TransactionCategory | ''>('');
  const [amount, setAmount] = useState('');
  
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();
  const { toast } = useToast();
  const { symbol, locale } = useCurrency();

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? onOpenChange! : setInternalOpen;

  const isEditing = !!editBudget;
  const availableCategories = isEditing 
    ? allCategories 
    : allCategories.filter(cat => !existingCategories.includes(cat));

  useEffect(() => {
    if (editBudget) {
      setCategory(editBudget.category);
      setAmount(editBudget.amount.toString());
    } else {
      setCategory('');
      setAmount('');
    }
  }, [editBudget, isOpen]);

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

    if (!isEditing && !category) {
      toast({
        title: 'Error',
        description: 'Por favor selecciona una categoría',
        variant: 'destructive',
      });
      return;
    }

    try {
      const now = new Date();
      
      if (isEditing && editBudget) {
        await updateBudget.mutateAsync({
          id: editBudget.id,
          amount: parsedAmount,
        });
        toast({
          title: 'Presupuesto actualizado',
          description: `Se ha actualizado el presupuesto de ${CATEGORY_LABELS[editBudget.category]}`,
        });
      } else {
        await createBudget.mutateAsync({
          category: category as TransactionCategory,
          amount: parsedAmount,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        });
        toast({
          title: 'Presupuesto creado',
          description: `Se ha creado un presupuesto de ${symbol} ${parsedAmount.toLocaleString(locale, { minimumFractionDigits: 2 })} para ${CATEGORY_LABELS[category as TransactionCategory]}`,
        });
      }
      
      setCategory('');
      setAmount('');
      setIsOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: isEditing ? 'No se pudo actualizar el presupuesto' : 'No se pudo crear el presupuesto',
        variant: 'destructive',
      });
    }
  };

  const isPending = createBudget.isPending || updateBudget.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button className="gradient-primary gap-2 h-10 sm:h-11 px-4 sm:px-6 active:scale-[0.98]">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nuevo Presupuesto</span>
            <span className="sm:hidden">Agregar</span>
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {isEditing ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Category */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="budget-category" className="text-sm">Categoría</Label>
            {isEditing ? (
              <div className="flex items-center gap-2 p-3 bg-secondary rounded-lg">
                <span>{CATEGORY_LABELS[editBudget!.category]}</span>
              </div>
            ) : (
              <Select value={category} onValueChange={(value) => setCategory(value as TransactionCategory)}>
                <SelectTrigger className="h-11 sm:h-10 text-base sm:text-sm">
                  <SelectValue placeholder="Selecciona categoría" />
                </SelectTrigger>
                <SelectContent>
                  {availableCategories.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      Ya tienes presupuestos para todas las categorías
                    </div>
                  ) : (
                    availableCategories.map((cat) => (
                      <SelectItem key={cat} value={cat} className="text-base sm:text-sm">
                        {CATEGORY_LABELS[cat]}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </div>
          
          {/* Amount */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="budget-amount" className="text-sm">Monto mensual</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{symbol}</span>
              <Input
                id="budget-amount"
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
            disabled={isPending || (!isEditing && availableCategories.length === 0)}
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
