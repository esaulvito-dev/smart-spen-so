import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  email: string;
  invitationId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, invitationId }: InvitationRequest = await req.json();
    
    if (!email || !invitationId) {
      return new Response(
        JSON.stringify({ error: "Email and invitationId are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // URL de la aplicación publicada
    const signupUrl = "https://smart-spen-so.lovable.app";

    const emailResponse = await resend.emails.send({
      from: "BudgetTrack <hola@budgettrack.site>",
      to: [email],
      subject: "Has sido invitado a BudgetTrack",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 520px; width: 100%; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <tr>
                    <td style="padding: 40px 40px 20px;">
                      <div style="text-align: center; margin-bottom: 30px;">
                        <div style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); width: 60px; height: 60px; border-radius: 16px; line-height: 60px;">
                          <span style="font-size: 28px;">💰</span>
                        </div>
                      </div>
                      <h1 style="margin: 0 0 20px; color: #18181b; font-size: 24px; font-weight: 700; text-align: center;">
                        ¡Bienvenido a BudgetTrack!
                      </h1>
                      <p style="margin: 0 0 30px; color: #71717a; font-size: 16px; line-height: 1.6; text-align: center;">
                        Has sido invitado a usar BudgetTrack, tu aplicación de control de finanzas personales.
                      </p>
                      <div style="text-align: center; margin-bottom: 30px;">
                        <a href="${signupUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                          Crear mi cuenta
                        </a>
                      </div>
                      <p style="margin: 0; color: #a1a1aa; font-size: 14px; text-align: center;">
                        Usa este correo electrónico (${email}) al registrarte para activar tu cuenta.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 20px 40px 40px;">
                      <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 0 0 20px;">
                      <p style="margin: 0; color: #a1a1aa; font-size: 12px; text-align: center;">
                        Este email fue enviado por BudgetTrack. Si no esperabas esta invitación, puedes ignorar este mensaje.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    console.log("Invitation email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-invitation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
