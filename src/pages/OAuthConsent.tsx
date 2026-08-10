import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShieldCheck, XCircle } from "lucide-react";

type AuthorizationDetails = {
  client?: { name?: string; client_uri?: string } | null;
  redirect_url?: string | null;
  redirect_to?: string | null;
  scopes?: string[];
};

function isValidRelativePath(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//");
}

export default function OAuthConsent() {
  const [searchParams] = useSearchParams();
  const authorizationId = searchParams.get("authorization_id") ?? "";
  const [details, setDetails] = useState<AuthorizationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) return setError("Missing authorization_id");
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        if (isValidRelativePath(next)) {
          window.location.href = "/login?next=" + encodeURIComponent(next);
        } else {
          window.location.href = "/login";
        }
        return;
      }
      const oauth = supabase.auth.oauth as any;
      if (!oauth?.getAuthorizationDetails) {
        return setError("OAuth authorization server is not available in this project.");
      }
      const { data, error: detailsError } = await oauth.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (detailsError) return setError(detailsError.message);
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    const oauth = supabase.auth.oauth as any;
    if (!oauth?.approveAuthorization || !oauth?.denyAuthorization) {
      setBusy(false);
      return setError("OAuth authorization methods are not available.");
    }
    const { data, error: decisionError } = approve
      ? await oauth.approveAuthorization(authorizationId)
      : await oauth.denyAuthorization(authorizationId);
    if (decisionError) {
      setBusy(false);
      return setError(decisionError.message);
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      return setError("No redirect returned by the authorization server.");
    }
    window.location.href = target;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="w-12 h-12 mx-auto text-destructive mb-2" />
            <CardTitle>No se pudo procesar la solicitud</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const clientName = details.client?.name ?? "una aplicación";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-3">
          <ShieldCheck className="w-12 h-12 mx-auto text-primary" />
          <CardTitle className="text-2xl">Conectar {clientName}</CardTitle>
          <CardDescription>
            {clientName} quiere acceder a tu información de BudgetTrack como si fueras tú.
            Solo se compartirán tus propios datos financieros y acciones que tú apruebes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 text-sm space-y-2">
            <p className="font-medium">Permisos solicitados:</p>
            <ul className="list-disc list-inside text-muted-foreground">
              <li>Leer tus transacciones, presupuestos y metas de ahorro</li>
              <li>Crear transacciones en tu nombre</li>
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => decide(false)}
              className="w-full"
            >
              Denegar
            </Button>
            <Button
              disabled={busy}
              onClick={() => decide(true)}
              className="w-full gradient-primary"
            >
              {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Aprobar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
