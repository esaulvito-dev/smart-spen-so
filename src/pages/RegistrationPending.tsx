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
      <div className="w-full max-w-md rounded-xl bg-[hsl(0,0%,100%)] shadow-lg p-8 space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[hsl(35,100%,96%)]">
            <Clock className="h-8 w-8 text-[hsl(35,92%,50%)]" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-center text-[hsl(220,15%,15%)]">
          Solicitud Recibida
        </h1>

        {/* Description */}
        <p className="text-center text-[hsl(220,10%,45%)] text-sm leading-relaxed">
          Tu cuenta{" "}
          <span className="font-semibold text-[hsl(220,15%,15%)]">
            {user?.email ?? ""}
          </span>{" "}
          está en proceso de autorización. Te avisaremos por correo cuando el
          administrador te dé acceso.
        </p>

        {/* Alert box */}
        <div className="rounded-lg border border-[hsl(45,80%,85%)] bg-[hsl(48,100%,96%)] p-4">
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 h-5 w-5 shrink-0 text-[hsl(38,75%,45%)]" />
            <p className="text-sm text-[hsl(38,50%,30%)] leading-relaxed">
              Recibirás un correo electrónico con un enlace para iniciar sesión
              cuando tu cuenta sea autorizada por el administrador.
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-3 pt-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleVerifyStatus}
            disabled={verifying || signingOut}
          >
            {verifying && <Loader2 className="h-4 w-4 animate-spin" />}
            Verificar Estado
          </Button>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={verifying || signingOut}
            className="w-full text-sm font-medium text-[hsl(220,10%,50%)] hover:text-[hsl(220,10%,30%)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 py-2"
          >
            {signingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
}
