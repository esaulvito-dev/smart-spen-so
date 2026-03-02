import { useState, useMemo } from 'react';
import { useCreateTransaction, TransactionType, TransactionCategory, CATEGORY_LABELS, CATEGORY_ICONS } from '@/hooks/useTransactions';
import { useCustomCategories, useCreateCustomCategory } from '@/hooks/useCustomCategories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/hooks/useCurrency';

const EMOJI_OPTIONS = ['📋', '💰', '🏪', '🎁', '✈️', '🎓', '💻', '🏋️', '🎵', '📱', '🚀', '💡', '🔧', '📦', '🛒', '💳'];

interface AddTransactionDialogProps {
  defaultType?: TransactionType;
}

export function AddTransactionDialog({ defaultType = 'expense' }: AddTransactionDialogProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TransactionType>(defaultType);
  const [category, setCategory] = useState<string>('otros');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  // Custom category dialog state - moved outside of Select
  const [customCategoryOpen, setCustomCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('📋');
  const [newCategoryType, setNewCategoryType] = useState<'income' | 'expense' | 'both'>(defaultType === 'income' ? 'income' : 'expense');
  
  const createTransaction = useCreateTransaction();
  const { data: customCategories = [] } = useCustomCategories();
  const createCustomCategory = useCreateCustomCategory();
  const { toast } = useToast();
  const { symbol, locale, convertToBase } = useCurrency();

  // Filter custom categories based on transaction type
  const filteredCustomCategories = useMemo(() => {
    return customCategories.filter(cat => 
      cat.type === 'both' || cat.type === type
    );
  }, [customCategories, type]);

  // Check if current category is a custom one
  const isCustomCategory = useMemo(() => {
    return customCategories.some(cat => cat.id === category);
  }, [customCategories, category]);

  const handleCreateCustomCategory = async () => {
    const trimmedName = newCategoryName.trim();
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
      const newCategory = await createCustomCategory.mutateAsync({
        name: trimmedName,
        icon: newCategoryIcon,
        type: newCategoryType,
      });
      
      toast({
        title: 'Categoría creada',
        description: `La categoría "${trimmedName}" ha sido creada exitosamente.`,
      });
      
      // Select the new category
      if (newCategory?.id) {
        setCategory(newCategory.id);
      }
      
      // Reset and close
      setNewCategoryName('');
      setNewCategoryIcon('📋');
      setNewCategoryType(type === 'income' ? 'income' : 'expense');
      setCustomCategoryOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo crear la categoría.',
        variant: 'destructive',
      });
    }
  };

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

    // Determine if it's a default category or custom
    const isDefaultCategory = Object.keys(CATEGORY_LABELS).includes(category);
    const finalCategory = isDefaultCategory ? category as TransactionCategory : 'otros';
    const customCat = customCategories.find(c => c.id === category);
    const finalDescription = customCat 
      ? `[${customCat.name}] ${description || ''}`.trim()
      : description;

    const baseAmount = convertToBase(parsedAmount);

    try {
      await createTransaction.mutateAsync({
        type,
        category: finalCategory,
        amount: baseAmount,
        description: finalDescription || undefined,
        date,
      });
      
      toast({
        title: type === 'income' ? 'Ingreso registrado' : 'Gasto registrado',
        description: `Se ha registrado ${type === 'income' ? 'un ingreso' : 'un gasto'} de ${symbol} ${parsedAmount.toLocaleString(locale, { minimumFractionDigits: 2 })}`,
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

  // Get display value for select
  const getCategoryDisplay = () => {
    if (isCustomCategory) {
      const customCat = customCategories.find(c => c.id === category);
      return customCat ? `${customCat.icon} ${customCat.name}` : category;
    }
    return `${CATEGORY_ICONS[category as TransactionCategory] || ''} ${CATEGORY_LABELS[category as TransactionCategory] || category}`;
  };

  return (
    <>
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
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{symbol}</span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-9 h-11 sm:h-10 text-base sm:text-sm"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="category" className="text-sm">Categoría</Label>
              <Select value={category} onValueChange={(value) => {
                if (value === '__add_new__') {
                  setNewCategoryType(type === 'income' ? 'income' : 'expense');
                  setCustomCategoryOpen(true);
                } else {
                  setCategory(value);
                }
              }}>
                <SelectTrigger className="h-11 sm:h-10 text-base sm:text-sm">
                  <SelectValue placeholder="Selecciona una categoría">
                    {getCategoryDisplay()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {/* Default categories */}
                  {(Object.keys(CATEGORY_LABELS) as TransactionCategory[]).map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-sm py-2.5 sm:py-2">
                      <span className="flex items-center gap-2">
                        <span>{CATEGORY_ICONS[cat]}</span>
                        <span>{CATEGORY_LABELS[cat]}</span>
                      </span>
                    </SelectItem>
                  ))}
                  
                  {/* Custom categories */}
                  {filteredCustomCategories.length > 0 && (
                    <>
                      <SelectSeparator />
                      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                        Personalizadas
                      </div>
                      {filteredCustomCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id} className="text-sm py-2.5 sm:py-2">
                          <span className="flex items-center gap-2">
                            <span>{cat.icon}</span>
                            <span>{cat.name}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </>
                  )}
                  
                  {/* Add category option */}
                  <SelectSeparator />
                  <SelectItem value="__add_new__" className="text-sm py-2.5 sm:py-2 text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      <span>Agregar categoría</span>
                    </span>
                  </SelectItem>
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

      {/* Custom Category Dialog - Separate from Select to avoid nesting issues */}
      <Dialog open={customCategoryOpen} onOpenChange={setCustomCategoryOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Nueva categoría personalizada</DialogTitle>
            <DialogDescription className="text-sm">
              Crea una categoría personalizada para organizar tus transacciones.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="new-category-name" className="text-sm">Nombre</Label>
              <Input
                id="new-category-name"
                placeholder="Ej: Freelance, Inversiones..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="h-11 sm:h-10 text-base sm:text-sm"
                maxLength={30}
              />
            </div>
            
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-sm">Icono</Label>
              <div className="grid grid-cols-8 gap-2">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setNewCategoryIcon(emoji)}
                    className={cn(
                      "h-10 w-10 text-xl rounded-lg border-2 transition-all hover:scale-105",
                      newCategoryIcon === emoji 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="new-category-type" className="text-sm">Tipo</Label>
              <Select value={newCategoryType} onValueChange={(v) => setNewCategoryType(v as 'income' | 'expense' | 'both')}>
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
                onClick={() => setCustomCategoryOpen(false)}
                className="w-full sm:w-auto h-11 sm:h-10 order-2 sm:order-1"
              >
                Cancelar
              </Button>
              <Button 
                type="button"
                onClick={handleCreateCustomCategory}
                disabled={createCustomCategory.isPending}
                className="w-full sm:w-auto h-11 sm:h-10 order-1 sm:order-2"
              >
                {createCustomCategory.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Crear categoría
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
