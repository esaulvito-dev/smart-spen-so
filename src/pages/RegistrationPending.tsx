import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock3, Mail, Loader2, LogOut } from "lucide-react";
import pendingApprovalStateImage from "@/assets/pending-approval-state.png";

export default function RegistrationPending() {
  const navigate = useNavigate();
  const { user, signOut, recheckAccess } = useAuth();
  const { toast } = useToast();
  const [verifying, setVerifying] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleVerifyStatus = async () => {
    if (!user?.id) {
      navigate("/login", { replace: true });
      return;
    }

    setVerifying(true);
    try {
      const [{ data: isActive, error: activeError }, { data: isValid, error: validityError }] = await Promise.all([
        supabase.rpc("is_user_active", { _user_id: user.id }),
        supabase.rpc("is_user_access_valid", { _user_id: user.id }),
      ]);

      if (activeError || validityError) {
        throw activeError ?? validityError;
      }

      if (isActive && isValid) {
        await recheckAccess();
        navigate("/", { replace: true });
        return;
      }

      toast({
        description: "Tu cuenta aún está en revisión.",
      });
    } catch (error) {
      console.error("Error verificando estado de autorización:", error);
      toast({
        title: "No se pudo verificar",
        description: "Intenta nuevamente en unos minutos.",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      navigate("/login", { replace: true });
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="dark min-h-screen min-h-[100dvh] bg-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-3xl items-center justify-center sm:min-h-[calc(100dvh-3rem)] lg:min-h-[calc(100dvh-4rem)]">
        <Card className="w-full border-border/80 bg-card/95 shadow-elevated backdrop-blur-md">
          <CardHeader className="space-y-5 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/15">
              <Clock3 className="h-8 w-8 text-accent" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold text-foreground">Solicitud Recibida</CardTitle>
              <CardDescription className="mx-auto max-w-xl text-base text-muted-foreground">
                Tu cuenta <span className="font-semibold text-foreground">{user?.email ?? "(sin correo disponible)"}</span> está en proceso de autorización. Te avisaremos por correo cuando el administrador te dé acceso.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <img
              src={pendingApprovalStateImage}
              alt="Estado de solicitud pendiente de autorización"
              loading="lazy"
              className="h-auto w-full rounded-xl border border-border/70 object-cover"
            />

            <div className="rounded-xl border border-accent/40 bg-accent/10 p-4 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <p>
                  Recibirás un correo electrónico con un enlace para iniciar sesión cuando tu cuenta sea autorizada por el administrador.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button variant="outline" onClick={handleVerifyStatus} disabled={verifying || signingOut}>
                {verifying && <Loader2 className="h-4 w-4 animate-spin" />}
                Verificar Estado
              </Button>
              <Button
                variant="ghost"
                onClick={handleSignOut}
                disabled={verifying || signingOut}
                className="border border-destructive/35 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                {signingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                Cerrar Sesión
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
