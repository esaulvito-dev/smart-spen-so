import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus } from 'lucide-react';
import { 
  Transaction, 
  TransactionType, 
  TransactionCategory, 
  CATEGORY_LABELS, 
  CATEGORY_ICONS,
  useUpdateTransaction 
} from '@/hooks/useTransactions';
import { useCustomCategories, useCreateCustomCategory } from '@/hooks/useCustomCategories';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/hooks/useCurrency';

const EMOJI_OPTIONS = ['📋', '💰', '🏪', '🎁', '✈️', '🎓', '💻', '🏋️', '🎵', '📱', '🚀', '💡', '🔧', '📦', '🛒', '💳'];

interface EditTransactionDialogProps {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const defaultCategories: TransactionCategory[] = [
  'hogar', 'negocio', 'trabajo', 'alimentacion', 'transporte',
  'entretenimiento', 'salud', 'educacion', 'servicios', 'otros'
];

export function EditTransactionDialog({ transaction, open, onOpenChange }: EditTransactionDialogProps) {
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState<string>('otros');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  
  // Custom category dialog state - moved outside of Select
  const [customCategoryOpen, setCustomCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('📋');
  const [newCategoryType, setNewCategoryType] = useState<'income' | 'expense' | 'both'>('expense');
  
  const updateTransaction = useUpdateTransaction();
  const { data: customCategories = [] } = useCustomCategories();
  const createCustomCategory = useCreateCustomCategory();
  const { toast } = useToast();
  const { symbol, locale, convertAmount, convertToBase } = useCurrency();

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

  // Extract custom category from description if present
  const extractCustomCategory = (desc: string | null) => {
    if (!desc) return { customCatName: null, cleanDesc: '' };
    const match = desc.match(/^\[([^\]]+)\]\s*/);
    if (match) {
      return { customCatName: match[1], cleanDesc: desc.replace(match[0], '') };
    }
    return { customCatName: null, cleanDesc: desc };
  };

  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setAmount(convertAmount(Number(transaction.amount)).toFixed(2));
      setDate(transaction.date);
      
      // Check if description contains a custom category marker
      const { customCatName, cleanDesc } = extractCustomCategory(transaction.description);
      
      if (customCatName) {
        // Find matching custom category
        const matchingCat = customCategories.find(c => c.name === customCatName);
        if (matchingCat) {
          setCategory(matchingCat.id);
          setDescription(cleanDesc);
          return;
        }
      }
      
      setCategory(transaction.category);
      setDescription(transaction.description || '');
    }
  }, [transaction, customCategories]);

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

    // Determine if it's a default category or custom
    const isDefaultCategory = defaultCategories.includes(category as TransactionCategory);
    const finalCategory = isDefaultCategory ? category as TransactionCategory : 'otros';
    const customCat = customCategories.find(c => c.id === category);
    const finalDescription = customCat 
      ? `[${customCat.name}] ${description || ''}`.trim()
      : description.trim() || null;

    const baseAmount = convertToBase(parsedAmount);

    try {
      await updateTransaction.mutateAsync({
        id: transaction.id,
        type,
        category: finalCategory,
        amount: baseAmount,
        description: finalDescription,
        date,
      });
      
      toast({
        title: 'Transacción actualizada',
        description: `Se ha actualizado ${type === 'income' ? 'el ingreso' : 'el gasto'} de ${symbol} ${parsedAmount.toLocaleString(locale, { minimumFractionDigits: 2 })}`,
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
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{symbol}</span>
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
              <Select value={category} onValueChange={(value) => {
                if (value === '__add_new__') {
                  setNewCategoryType(type === 'income' ? 'income' : 'expense');
                  setCustomCategoryOpen(true);
                } else {
                  setCategory(value);
                }
              }}>
                <SelectTrigger className="h-11 sm:h-10 text-base sm:text-sm">
                  <SelectValue>
                    {getCategoryDisplay()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {/* Default categories */}
                  {defaultCategories.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-base sm:text-sm">
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
                        <SelectItem key={cat.id} value={cat.id} className="text-base sm:text-sm">
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
                  <SelectItem value="__add_new__" className="text-base sm:text-sm text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      <span>Agregar categoría</span>
                    </span>
                  </SelectItem>
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
              <Label htmlFor="edit-new-category-name" className="text-sm">Nombre</Label>
              <Input
                id="edit-new-category-name"
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
              <Label htmlFor="edit-new-category-type" className="text-sm">Tipo</Label>
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
