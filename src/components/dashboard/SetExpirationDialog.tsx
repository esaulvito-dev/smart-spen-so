import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calendar, Clock, Infinity } from 'lucide-react';
import { format, addDays, addMonths } from 'date-fns';

interface SetExpirationDialogProps {
  userName: string;
  userEmail: string;
  currentExpiration: string | null;
  onSetExpiration: (expiresAt: string | null) => void;
  isPending?: boolean;
}

export function SetExpirationDialog({
  userName,
  userEmail,
  currentExpiration,
  onSetExpiration,
  isPending,
}: SetExpirationDialogProps) {
  const [open, setOpen] = useState(false);
  const [expirationDate, setExpirationDate] = useState(
    currentExpiration ? format(new Date(currentExpiration), 'yyyy-MM-dd') : ''
  );

  const handleQuickOption = (days: number | null) => {
    if (days === null) {
      setExpirationDate('');
    } else {
      const date = addDays(new Date(), days);
      setExpirationDate(format(date, 'yyyy-MM-dd'));
    }
  };

  const handleMonthOption = (months: number) => {
    const date = addMonths(new Date(), months);
    setExpirationDate(format(date, 'yyyy-MM-dd'));
  };

  const handleSubmit = () => {
    if (expirationDate) {
      // Set to end of day in user's timezone
      const date = new Date(expirationDate + 'T23:59:59');
      onSetExpiration(date.toISOString());
    } else {
      onSetExpiration(null);
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" title="Configurar tiempo de acceso">
          <Clock className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Configurar acceso temporal
          </DialogTitle>
          <DialogDescription>
            Define el tiempo de acceso para <strong>{userName || userEmail}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Quick options */}
          <div className="space-y-2">
            <Label>Opciones rápidas</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickOption(7)}
                className="text-xs"
              >
                7 días
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickOption(15)}
                className="text-xs"
              >
                15 días
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickOption(30)}
                className="text-xs"
              >
                30 días
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMonthOption(3)}
                className="text-xs"
              >
                3 meses
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMonthOption(6)}
                className="text-xs"
              >
                6 meses
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMonthOption(12)}
                className="text-xs"
              >
                1 año
              </Button>
            </div>
          </div>

          {/* Custom date */}
          <div className="space-y-2">
            <Label htmlFor="expiration-date">Fecha personalizada</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="expiration-date"
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Permanent access */}
          <Button
            variant="secondary"
            className="w-full gap-2"
            onClick={() => handleQuickOption(null)}
          >
            <Infinity className="w-4 h-4" />
            Acceso permanente
          </Button>

          {/* Current status */}
          {expirationDate && (
            <p className="text-sm text-muted-foreground text-center">
              El acceso expirará el{' '}
              <strong>{format(new Date(expirationDate), 'dd/MM/yyyy')}</strong>
            </p>
          )}
          {!expirationDate && (
            <p className="text-sm text-muted-foreground text-center">
              El usuario tendrá <strong>acceso permanente</strong>
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
