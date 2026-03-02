import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Minus } from 'lucide-react';
import { useUpdateSavingsGoal, SavingsGoal } from '@/hooks/useSavingsGoals';
import { useCurrency } from '@/hooks/useCurrency';

interface AddToGoalDialogProps {
  goal: SavingsGoal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddToGoalDialog({ goal, open, onOpenChange }: AddToGoalDialogProps) {
  const [amount, setAmount] = useState('');
  const [isAdding, setIsAdding] = useState(true);
  
  const updateGoal = useUpdateSavingsGoal();
  const { toast } = useToast();
  const { symbol, formatCurrency, convertToBase } = useCurrency();

  useEffect(() => {
    if (open) {
      setAmount('');
      setIsAdding(true);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!goal) return;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({
        title: 'Error',
        description: 'Por favor ingresa un monto válido',
        variant: 'destructive',
      });
      return;
    }

    const baseInput = convertToBase(parsedAmount);
    const currentAmount = Number(goal.current_amount);
    let newAmount = isAdding ? currentAmount + baseInput : currentAmount - baseInput;
    
    // Don't allow negative amounts
    if (newAmount < 0) newAmount = 0;

    try {
      await updateGoal.mutateAsync({
        id: goal.id,
        current_amount: newAmount,
      });
      
      toast({
        title: isAdding ? 'Ahorro agregado' : 'Monto retirado',
        description: `${isAdding ? 'Se agregaron' : 'Se retiraron'} ${formatCurrency(parsedAmount)} ${isAdding ? 'a' : 'de'} "${goal.name}"`,
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la meta',
        variant: 'destructive',
      });
    }
  };

  if (!goal) return null;

  const remaining = Number(goal.target_amount) - Number(goal.current_amount);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
            <span className="text-2xl">{goal.icon}</span>
            {goal.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Current Progress */}
          <div className="p-3 bg-secondary rounded-lg text-center">
            <p className="text-xs text-muted-foreground">Progreso actual</p>
            <p className="text-lg font-bold">
              {formatCurrency(Number(goal.current_amount))}
              <span className="text-muted-foreground font-normal text-sm">
                {' '}/ {formatCurrency(Number(goal.target_amount))}
              </span>
            </p>
            {remaining > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Te faltan {formatCurrency(remaining)}
              </p>
            )}
          </div>

          {/* Add/Subtract Toggle */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={isAdding ? 'default' : 'outline'}
              className={`flex-1 h-11 sm:h-10 active:scale-[0.98] ${isAdding ? 'gradient-income' : ''}`}
              onClick={() => setIsAdding(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Agregar
            </Button>
            <Button
              type="button"
              variant={!isAdding ? 'default' : 'outline'}
              className={`flex-1 h-11 sm:h-10 active:scale-[0.98] ${!isAdding ? 'gradient-expense' : ''}`}
              onClick={() => setIsAdding(false)}
            >
              <Minus className="w-4 h-4 mr-1" />
              Retirar
            </Button>
          </div>
          
          {/* Amount */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="add-amount" className="text-sm">Monto</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{symbol}</span>
              <Input
                id="add-amount"
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
            onClick={() => onOpenChange(false)} 
            className="flex-1 h-11 sm:h-10 active:scale-[0.98]"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={updateGoal.isPending}
            className="flex-1 h-11 sm:h-10 active:scale-[0.98]"
          >
            {updateGoal.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Confirmar'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
