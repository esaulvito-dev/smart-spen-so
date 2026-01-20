import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldX, LogOut, RefreshCw } from 'lucide-react';

export default function AccessDenied() {
  const { signOut, recheckAccess, checkingAccess } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleRetry = async () => {
    await recheckAccess();
    // If access is now valid, ProtectedRoute will handle the redirect
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-4 rounded-full bg-destructive/10 w-fit">
            <ShieldX className="w-12 h-12 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Acceso Denegado</CardTitle>
          <CardDescription className="text-base">
            Tu acceso a la aplicación ha sido revocado o ha expirado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Si crees que esto es un error, por favor contacta al administrador para solicitar acceso nuevamente.
          </p>
          <div className="flex flex-col gap-2">
            <Button 
              variant="outline" 
              onClick={handleRetry}
              disabled={checkingAccess}
              className="w-full"
            >
              {checkingAccess ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Verificar acceso nuevamente
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleLogout}
              className="w-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar sesión
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
