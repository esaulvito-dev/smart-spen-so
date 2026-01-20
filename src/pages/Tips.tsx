import { Sidebar } from '@/components/dashboard/Sidebar';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Lightbulb, TrendingUp, PiggyBank, CreditCard, AlertTriangle, Target, Loader2 } from 'lucide-react';

const tips = [
  {
    icon: PiggyBank,
    title: 'Regla 50/30/20',
    description: 'Destina el 50% de tus ingresos a necesidades, 30% a deseos y 20% a ahorro e inversiones.',
    color: 'bg-success/10 text-success',
  },
  {
    icon: Target,
    title: 'Define metas claras',
    description: 'Establece objetivos financieros específicos y medibles. Divide metas grandes en pasos pequeños.',
    color: 'bg-primary/10 text-primary',
  },
  {
    icon: AlertTriangle,
    title: 'Fondo de emergencia',
    description: 'Ahorra de 3 a 6 meses de gastos para imprevistos antes de invertir en otros objetivos.',
    color: 'bg-warning/10 text-warning',
  },
  {
    icon: CreditCard,
    title: 'Evita deudas malas',
    description: 'Las tarjetas de crédito pueden ser útiles, pero paga el saldo completo cada mes para evitar intereses.',
    color: 'bg-destructive/10 text-destructive',
  },
  {
    icon: TrendingUp,
    title: 'Invierte temprano',
    description: 'El interés compuesto es tu mejor aliado. Mientras antes empieces a invertir, mejor.',
    color: 'bg-info/10 text-info',
  },
  {
    icon: Lightbulb,
    title: 'Automatiza tus ahorros',
    description: 'Configura transferencias automáticas a tu cuenta de ahorros el día que recibes tu sueldo.',
    color: 'bg-accent/10 text-accent-foreground',
  },
];

const quickTips = [
  '💡 Revisa tus suscripciones mensuales y cancela las que no uses.',
  '💡 Compara precios antes de hacer compras grandes.',
  '💡 Cocina en casa más seguido para ahorrar en comida.',
  '💡 Espera 24 horas antes de hacer compras impulsivas.',
  '💡 Negocia tus servicios (internet, celular, seguros).',
  '💡 Usa apps de cashback para tus compras regulares.',
];

export default function Tips() {
  const { data: profile, isLoading } = useProfile();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background ${profile?.theme_color ? `theme-${profile.theme_color}` : ''}`}>
      <Sidebar />
      <main className="lg:pl-64 p-4 lg:p-8 pt-20 lg:pt-8">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-accent-foreground" />
              </div>
              Consejos financieros
            </h1>
            <p className="text-muted-foreground mt-1">
              Recomendaciones para mejorar tu salud financiera
            </p>
          </div>

          {/* Quick Tips */}
          <Card className="shadow-soft border-border/50 gradient-card overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Tips rápidos del día</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {quickTips.map((tip, index) => (
                  <div 
                    key={index}
                    className="p-3 bg-secondary/50 rounded-lg text-sm animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {tip}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Main Tips */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tips.map((tip, index) => (
              <Card 
                key={tip.title} 
                className="shadow-soft border-border/50 hover:shadow-elevated transition-shadow animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tip.color}`}>
                      <tip.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{tip.title}</CardTitle>
                      <CardDescription className="mt-2">
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
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="w-20 h-20 bg-primary-foreground/20 rounded-2xl flex items-center justify-center">
                  <TrendingUp className="w-10 h-10" />
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="text-xl font-bold mb-2">
                    ¿Listo para tomar el control?
                  </h3>
                  <p className="text-primary-foreground/80">
                    Empieza registrando todos tus gastos e ingresos. 
                    La clave está en la consistencia.
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
