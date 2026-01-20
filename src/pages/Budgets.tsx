import { Sidebar } from '@/components/dashboard/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PiggyBank } from 'lucide-react';

export default function Budgets() {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-background">
      <Sidebar />
      <main className="lg:pl-64 p-3 sm:p-4 lg:p-8 pt-[72px] lg:pt-8 pb-6">
        <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 gradient-primary rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
              <PiggyBank className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Presupuestos</h1>
              <p className="text-sm text-muted-foreground hidden sm:block">
                Planifica tus gastos mensuales
              </p>
            </div>
          </div>

          {/* Coming Soon */}
          <Card className="shadow-soft border-border/50">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Planificación de presupuestos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 sm:py-12">
                <div className="w-16 h-16 sm:w-20 sm:h-20 gradient-primary rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <PiggyBank className="w-8 h-8 sm:w-10 sm:h-10 text-primary-foreground" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">Próximamente</h3>
                <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto px-4">
                  Pronto podrás crear presupuestos mensuales por categoría y 
                  recibir alertas cuando estés cerca de exceder tus límites.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
