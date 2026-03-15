import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Clock, Mail, Loader2, LogOut } from "lucide-react";

export default function RegistrationPending() {
  const navigate = useNavigate();
  const { user, signOut, recheckAccess } = useAuth();
  const { toast } = useToast();
  const [verifying, setVerifying] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleVerifyStatus = async () => {
    if (!user?.id) {
      navigate("/", { replace: true });
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
        navigate("/dashboard", { replace: true });
        return;
      }

      toast({
        description: "Tu cuenta aún está en revisión.",
      });
    } catch (error) {
      console.error("Error verificando estado:", error);
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
      navigate("/", { replace: true });
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-[hsl(210,20%,98%)] p-4">
      <div className="w-full max-w-md rounded-2xl bg-[hsl(0,0%,100%)] shadow-xl border border-[hsl(210,20%,94%)] p-8 text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[hsl(30,100%,95%)]">
            <Clock className="h-8 w-8 text-[hsl(30,90%,50%)]" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-[hsl(220,15%,15%)]">
          Solicitud Recibida
        </h1>

        {/* Description */}
        <p className="text-[hsl(220,10%,45%)] text-sm leading-relaxed">
          Tu cuenta{" "}
          <span className="font-semibold text-[hsl(220,15%,15%)]">
            {user?.email ?? ""}
          </span>{" "}
          está en proceso de autorización. Te avisaremos por correo cuando el
          administrador te dé acceso.
        </p>

        {/* Alert box */}
        <div className="rounded-lg border border-[hsl(45,80%,85%)] bg-[hsl(48,100%,96%)] p-4">
          <div className="flex items-start gap-3 text-left">
            <Mail className="mt-0.5 h-5 w-5 shrink-0 text-[hsl(38,75%,45%)]" />
            <p className="text-sm text-[hsl(38,50%,30%)] leading-relaxed">
              Recibirás un correo electrónico con un enlace para iniciar sesión
              cuando tu cuenta sea autorizada por el administrador.
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button
            className="w-full bg-[hsl(220,15%,15%)] text-[hsl(0,0%,100%)] rounded-lg hover:bg-[hsl(220,15%,25%)]"
            onClick={handleVerifyStatus}
            disabled={verifying || signingOut}
          >
            {verifying ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Verificar Estado
          </Button>
          <Button
            variant="outline"
            className="w-full bg-[hsl(0,0%,100%)] text-[hsl(0,70%,50%)] border-[hsl(0,60%,88%)] rounded-lg hover:bg-[hsl(0,80%,97%)]"
            onClick={handleSignOut}
            disabled={verifying || signingOut}
          >
            {signingOut ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <LogOut className="h-4 w-4 mr-2" />}
            Cerrar Sesión
          </Button>
        </div>
      </div>
    </div>
  );
}
