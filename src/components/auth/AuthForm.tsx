import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Mail,
  Lock,
  User,
  TrendingUp,
  PiggyBank,
  Target,
  BarChart3,
  RefreshCw,
  Shield,
  Smartphone
} from 'lucide-react';
import loginBackground from '@/assets/login-background.png';

const features = [
  {
    icon: BarChart3,
    title: 'Control Total de Gastos',
    description: 'Visualiza tus gastos por categorías con gráficos intuitivos'
  },
  {
    icon: PiggyBank,
    title: 'Presupuestos Inteligentes',
    description: 'Establece límites mensuales y recibe alertas automáticas'
  },
  {
    icon: Target,
    title: 'Metas de Ahorro',
    description: 'Define objetivos financieros y monitorea tu progreso'
  },
  {
    icon: RefreshCw,
    title: 'Transacciones Recurrentes',
    description: 'Automatiza el registro de pagos fijos mensuales'
  },
  {
    icon: Shield,
    title: 'Seguridad Garantizada',
    description: 'Tus datos protegidos con encriptación de nivel bancario'
  },
  {
    icon: Smartphone,
    title: '100% Responsivo',
    description: 'Accede desde cualquier dispositivo, en cualquier momento'
  }
];

export function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: 'Error al iniciar sesión',
            description: error.message,
            variant: 'destructive',
          });
        }
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          toast({
            title: 'Error al registrarse',
            description: error.message,
            variant: 'destructive',
          });
        } else {
          navigate('/pending-approval', { replace: true });
          return;
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen min-h-[100dvh] flex bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: `url(${loginBackground})` }}
    >
      {/* Overlay for better contrast */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/85 via-black/70 to-black/85" />

      <div className="relative z-10 flex flex-col items-center justify-center w-full px-4 py-8">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 lg:w-14 lg:h-14 gradient-primary rounded-xl flex items-center justify-center shadow-glow">
            <TrendingUp className="w-6 h-6 lg:w-7 lg:h-7 text-primary-foreground" />
          </div>
          <span className="text-2xl lg:text-3xl font-bold text-white">BudgetTrack</span>
        </div>

        {/* Tagline */}
        <h1 className="text-2xl lg:text-4xl font-bold text-white text-center mb-2">
          Toma el control de <span className="text-gradient">tus finanzas</span>
        </h1>
        <p className="text-white/80 text-center mb-8 max-w-md">
          La herramienta profesional para gestionar tus gastos y alcanzar tus metas de ahorro.
        </p>

        {/* Auth Form - Centered */}
        <div className="w-full max-w-md">
          <Card className="w-full max-w-md shadow-elevated border-0 bg-card/95 backdrop-blur-md">
            <CardHeader className="text-center space-y-3 sm:space-y-4 pb-4 sm:pb-6">
              <div className="mx-auto w-12 h-12 sm:w-14 sm:h-14 gradient-primary rounded-xl sm:rounded-2xl flex items-center justify-center shadow-glow lg:hidden">
                <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-xl sm:text-2xl font-bold">
                  {isLogin ? 'Bienvenido de nuevo' : 'Únete a BudgetTrack'}
                </CardTitle>
                <CardDescription className="text-sm sm:text-base mt-1 sm:mt-2">
                  {isLogin ? 'Ingresa tus credenciales para continuar' : 'Crea tu cuenta y comienza a ahorrar'}
                </CardDescription>
              </div>
            </CardHeader>
            
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
                {!isLogin && (
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="fullName" className="text-sm">Nombre completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="Juan Pérez"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-10 h-11 sm:h-10 text-base sm:text-sm"
                        required={!isLogin}
                      />
                    </div>
                  </div>
                )}
                
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="email" className="text-sm">Correo electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-11 sm:h-10 text-base sm:text-sm"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="password" className="text-sm">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-11 sm:h-10 text-base sm:text-sm"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="flex flex-col gap-3 sm:gap-4 px-4 sm:px-6 pt-2">
                <Button 
                  type="submit" 
                  className="w-full h-11 sm:h-10 text-base sm:text-sm gradient-primary text-primary-foreground hover:opacity-90 transition-opacity active:scale-[0.98]"
                  disabled={loading}
                >
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
                </Button>
                
                <p className="text-sm text-muted-foreground text-center pb-2">
                  {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
                  <button
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-primary font-medium hover:underline active:opacity-80"
                  >
                    {isLogin ? 'Regístrate' : 'Inicia sesión'}
                  </button>
                </p>
              </CardFooter>
            </form>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl w-full">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="flex flex-col items-center text-center p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/15 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center mb-2">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-white text-xs sm:text-sm">{feature.title}</h3>
            </div>
          ))}
        </div>

        {/* Trust Badge */}
        <div className="mt-6 flex items-center justify-center gap-4 text-white/60 text-sm flex-wrap">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>Datos 100% seguros</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-white/40" />
          <span>Sin anuncios</span>
          <div className="w-1 h-1 rounded-full bg-white/40" />
          <span>Soporte incluido</span>
        </div>
      </div>
    </div>
  );
}
