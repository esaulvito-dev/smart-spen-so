import { Sidebar } from '@/components/dashboard/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PiggyBank, Loader2 } from 'lucide-react';

export default function Budgets() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="lg:pl-64 p-4 lg:p-8 pt-20 lg:pt-8">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                <PiggyBank className="w-5 h-5 text-primary-foreground" />
              </div>
              Presupuestos
            </h1>
            <p className="text-muted-foreground mt-1">
              Planifica tus gastos mensuales
            </p>
          </div>

          {/* Coming Soon */}
          <Card className="shadow-soft border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Planificación de presupuestos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <div className="w-20 h-20 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <PiggyBank className="w-10 h-10 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Próximamente</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
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
