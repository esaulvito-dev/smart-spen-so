import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Loader2 } from 'lucide-react';
import { useCreateSavingsGoal, useUpdateSavingsGoal, SavingsGoal } from '@/hooks/useSavingsGoals';

interface AddGoalDialogProps {
  editGoal?: SavingsGoal | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const GOAL_ICONS = ['🎯', '✈️', '🏠', '🚗', '💻', '📱', '🎓', '💍', '🏖️', '💰', '🏥', '🎁'];

export function AddGoalDialog({ editGoal, open, onOpenChange }: AddGoalDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [icon, setIcon] = useState('🎯');
  
  const createGoal = useCreateSavingsGoal();
  const updateGoal = useUpdateSavingsGoal();
  const { toast } = useToast();

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? onOpenChange! : setInternalOpen;

  const isEditing = !!editGoal;

  useEffect(() => {
    if (editGoal) {
      setName(editGoal.name);
      setTargetAmount(editGoal.target_amount.toString());
      setCurrentAmount(editGoal.current_amount.toString());
      setDeadline(editGoal.deadline || '');
      setIcon(editGoal.icon);
    } else {
      setName('');
      setTargetAmount('');
      setCurrentAmount('');
      setDeadline('');
      setIcon('🎯');
    }
  }, [editGoal, isOpen]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({
        title: 'Error',
        description: 'Por favor ingresa un nombre para la meta',
        variant: 'destructive',
      });
      return;
    }

    const parsedTarget = parseFloat(targetAmount);
    if (isNaN(parsedTarget) || parsedTarget <= 0) {
      toast({
        title: 'Error',
        description: 'Por favor ingresa un monto objetivo válido',
        variant: 'destructive',
      });
      return;
    }

    const parsedCurrent = parseFloat(currentAmount) || 0;

    try {
      if (isEditing && editGoal) {
        await updateGoal.mutateAsync({
          id: editGoal.id,
          name: name.trim(),
          target_amount: parsedTarget,
          current_amount: parsedCurrent,
          deadline: deadline || null,
          icon,
        });
        toast({
          title: 'Meta actualizada',
          description: `Se ha actualizado la meta "${name}"`,
        });
      } else {
        await createGoal.mutateAsync({
          name: name.trim(),
          target_amount: parsedTarget,
          current_amount: parsedCurrent,
          deadline: deadline || null,
          icon,
        });
        toast({
          title: 'Meta creada',
          description: `Se ha creado la meta "${name}"`,
        });
      }
      
      setName('');
      setTargetAmount('');
      setCurrentAmount('');
      setDeadline('');
      setIcon('🎯');
      setIsOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: isEditing ? 'No se pudo actualizar la meta' : 'No se pudo crear la meta',
        variant: 'destructive',
      });
    }
  };

  const isPending = createGoal.isPending || updateGoal.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button className="gradient-primary gap-2 h-10 sm:h-11 px-4 sm:px-6 active:scale-[0.98]">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nueva Meta</span>
            <span className="sm:hidden">Agregar</span>
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {isEditing ? 'Editar Meta' : 'Nueva Meta de Ahorro'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Icon Selection */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-sm">Ícono</Label>
            <div className="flex flex-wrap gap-2">
              {GOAL_ICONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                    icon === emoji 
                      ? 'bg-primary text-primary-foreground scale-110' 
                      : 'bg-secondary hover:bg-secondary/80'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="goal-name" className="text-sm">Nombre de la meta</Label>
            <Input
              id="goal-name"
              placeholder="Ej: Vacaciones, Fondo de emergencia"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 sm:h-10 text-base sm:text-sm"
              maxLength={50}
            />
          </div>
          
          {/* Target Amount */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="goal-target" className="text-sm">Monto objetivo</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">S/</span>
              <Input
                id="goal-target"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="pl-9 h-11 sm:h-10 text-base sm:text-sm"
              />
            </div>
          </div>

          {/* Current Amount */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="goal-current" className="text-sm">Monto actual (opcional)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">S/</span>
              <Input
                id="goal-current"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                className="pl-9 h-11 sm:h-10 text-base sm:text-sm"
              />
            </div>
          </div>
          
          {/* Deadline */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="goal-deadline" className="text-sm">Fecha límite (opcional)</Label>
            <Input
              id="goal-deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="h-11 sm:h-10 text-base sm:text-sm"
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
