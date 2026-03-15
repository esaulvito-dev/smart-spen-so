import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Mail, ArrowLeft, ShieldCheck } from 'lucide-react';

export default function RegistrationPending() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-background p-4">
      <Card className="max-w-lg w-full shadow-elevated border-0 bg-card/95 backdrop-blur-md">
        <CardHeader className="text-center space-y-4 pb-4">
          <div className="mx-auto p-5 rounded-full bg-primary/10 w-fit">
            <Clock className="w-14 h-14 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">
              ¡Registro Exitoso!
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Tu cuenta ha sido creada correctamente
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 px-6 pb-8">
          <div className="bg-muted/50 rounded-xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-foreground">
                Tu solicitud de acceso está <span className="font-semibold text-primary">pendiente de aprobación</span> por parte del administrador.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-foreground">
                Recibirás una notificación cuando tu acceso haya sido aprobado. También puedes verificar tu correo electrónico para confirmar tu cuenta.
              </p>
            </div>
          </div>

          <div className="bg-accent/30 rounded-xl p-4 border border-accent">
            <p className="text-sm text-muted-foreground text-center">
              Una vez aprobado por el administrador, podrás iniciar sesión con tu correo y contraseña registrados.
            </p>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al inicio de sesión
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
