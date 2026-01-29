import { useState } from 'react';
import { useCreateCustomCategory } from '@/hooks/useCustomCategories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Loader2 } from 'lucide-react';

const EMOJI_OPTIONS = ['📋', '💰', '🏪', '🎁', '✈️', '🎓', '💻', '🏋️', '🎵', '📱', '🚀', '💡', '🔧', '📦', '🛒', '💳'];

interface AddCustomCategoryDialogProps {
  defaultType?: 'income' | 'expense' | 'both';
  triggerClassName?: string;
  onSuccess?: () => void;
}

export function AddCustomCategoryDialog({ 
  defaultType = 'both', 
  triggerClassName,
  onSuccess 
}: AddCustomCategoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📋');
  const [type, setType] = useState<'income' | 'expense' | 'both'>(defaultType);
  
  const createCategory = useCreateCustomCategory();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast({
        title: 'Error',
        description: 'Por favor ingresa un nombre para la categoría.',
        variant: 'destructive',
      });
      return;
    }

    if (trimmedName.length > 30) {
      toast({
        title: 'Error',
        description: 'El nombre no puede tener más de 30 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createCategory.mutateAsync({
        name: trimmedName,
        icon,
        type,
      });
      
      toast({
        title: 'Categoría creada',
        description: `La categoría "${trimmedName}" ha sido creada exitosamente.`,
      });
      
      // Reset form
      setName('');
      setIcon('📋');
      setType(defaultType);
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo crear la categoría.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={triggerClassName || "w-full justify-start text-muted-foreground hover:text-foreground"}
        >
          <Plus className="w-4 h-4 mr-2" />
          Agregar categoría
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Nueva categoría personalizada</DialogTitle>
          <DialogDescription className="text-sm">
            Crea una categoría personalizada para organizar tus transacciones.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="category-name" className="text-sm">Nombre</Label>
            <Input
              id="category-name"
              placeholder="Ej: Freelance, Inversiones..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 sm:h-10 text-base sm:text-sm"
              maxLength={30}
              required
            />
          </div>
          
          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-sm">Icono</Label>
            <div className="grid grid-cols-8 gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`h-10 w-10 text-xl rounded-lg border-2 transition-all hover:scale-105 ${
                    icon === emoji 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="category-type" className="text-sm">Tipo</Label>
            <Select value={type} onValueChange={(v) => setType(v as 'income' | 'expense' | 'both')}>
              <SelectTrigger className="h-11 sm:h-10 text-base sm:text-sm">
                <SelectValue placeholder="Selecciona un tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="both" className="text-sm py-2.5 sm:py-2">
                  Ambos (Ingreso y Gasto)
                </SelectItem>
                <SelectItem value="income" className="text-sm py-2.5 sm:py-2">
                  Solo Ingresos
                </SelectItem>
                <SelectItem value="expense" className="text-sm py-2.5 sm:py-2">
                  Solo Gastos
                </SelectItem>
              </SelectContent>
            </Select>
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
              disabled={createCategory.isPending}
              className="w-full sm:w-auto h-11 sm:h-10 order-1 sm:order-2"
            >
              {createCategory.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Crear categoría
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
