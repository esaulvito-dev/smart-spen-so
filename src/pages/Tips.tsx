import { Sidebar } from '@/components/dashboard/Sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Lightbulb, TrendingUp, PiggyBank, CreditCard, AlertTriangle, Target } from 'lucide-react';

const tips = [
  {
    icon: PiggyBank,
    title: 'Regla 50/30/20',
    description: 'Destina el 50% a necesidades, 30% a deseos y 20% a ahorro.',
    color: 'bg-success/10 text-success',
  },
  {
    icon: Target,
    title: 'Define metas claras',
    description: 'Establece objetivos específicos y divide metas grandes en pasos pequeños.',
    color: 'bg-primary/10 text-primary',
  },
  {
    icon: AlertTriangle,
    title: 'Fondo de emergencia',
    description: 'Ahorra de 3 a 6 meses de gastos para imprevistos.',
    color: 'bg-warning/10 text-warning',
  },
  {
    icon: CreditCard,
    title: 'Evita deudas malas',
    description: 'Paga el saldo completo de tus tarjetas cada mes.',
    color: 'bg-destructive/10 text-destructive',
  },
  {
    icon: TrendingUp,
    title: 'Invierte temprano',
    description: 'El interés compuesto es tu mejor aliado.',
    color: 'bg-info/10 text-info',
  },
  {
    icon: Lightbulb,
    title: 'Automatiza ahorros',
    description: 'Transfiere automáticamente a tu cuenta de ahorros.',
    color: 'bg-accent/10 text-accent-foreground',
  },
];

const quickTips = [
  '💡 Revisa tus suscripciones y cancela las que no uses.',
  '💡 Compara precios antes de compras grandes.',
  '💡 Cocina en casa para ahorrar en comida.',
  '💡 Espera 24h antes de compras impulsivas.',
  '💡 Negocia tus servicios (internet, celular).',
  '💡 Usa apps de cashback para tus compras.',
];

export default function Tips() {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-background">
      <Sidebar />
      <main className="lg:pl-64 p-3 sm:p-4 lg:p-8 pt-[72px] lg:pt-8 pb-6">
        <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-accent rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
              <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-accent-foreground" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Consejos</h1>
              <p className="text-sm text-muted-foreground hidden sm:block">
                Recomendaciones para tu salud financiera
              </p>
            </div>
          </div>

          {/* Quick Tips */}
          <Card className="shadow-soft border-border/50 overflow-hidden">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-base sm:text-lg">Tips rápidos</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {quickTips.map((tip, index) => (
                  <div 
                    key={index}
                    className="p-2.5 sm:p-3 bg-secondary/50 rounded-lg text-xs sm:text-sm animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {tip}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Main Tips */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
            {tips.map((tip, index) => (
              <Card 
                key={tip.title} 
                className="shadow-soft border-border/50 hover:shadow-elevated transition-shadow animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader className="pb-0 sm:pb-2">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${tip.color}`}>
                      <tip.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-base sm:text-lg">{tip.title}</CardTitle>
                      <CardDescription className="mt-1 sm:mt-2 text-xs sm:text-sm">
                        {tip.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* CTA Card */}
          <Card className="shadow-soft border-border/50 gradient-hero text-primary-foreground overflow-hidden">
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                <div className="w-14 h-14 sm:w-20 sm:h-20 bg-primary-foreground/20 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
                  <TrendingUp className="w-7 h-7 sm:w-10 sm:h-10" />
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">
                    ¿Listo para tomar el control?
                  </h3>
                  <p className="text-primary-foreground/80 text-sm sm:text-base">
                    Empieza registrando todos tus gastos e ingresos. La clave está en la consistencia.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
