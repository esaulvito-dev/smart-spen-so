import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    // Get user's transactions for context
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract user from JWT
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) throw new Error("Invalid user");

    // Fetch recent transactions
    const { data: transactions } = await supabase
      .from("transactions")
      .select("type, category, amount, description, date")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(100);

    // Summarize transactions for the AI
    const totalIncome = (transactions || [])
      .filter((t: any) => t.type === "income")
      .reduce((s: number, t: any) => s + Number(t.amount), 0);
    const totalExpenses = (transactions || [])
      .filter((t: any) => t.type === "expense")
      .reduce((s: number, t: any) => s + Number(t.amount), 0);

    const expensesByCategory: Record<string, number> = {};
    const incomeByCategory: Record<string, number> = {};
    (transactions || []).forEach((t: any) => {
      const map = t.type === "expense" ? expensesByCategory : incomeByCategory;
      map[t.category] = (map[t.category] || 0) + Number(t.amount);
    });

    const financialContext = `
Datos financieros del usuario (últimas 100 transacciones):
- Ingresos totales: S/ ${totalIncome.toFixed(2)}
- Gastos totales: S/ ${totalExpenses.toFixed(2)}
- Balance: S/ ${(totalIncome - totalExpenses).toFixed(2)}
- Tasa de ahorro: ${totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100).toFixed(1) : 0}%

Gastos por categoría:
${Object.entries(expensesByCategory).map(([k, v]) => `  - ${k}: S/ ${v.toFixed(2)}`).join("\n")}

Ingresos por categoría:
${Object.entries(incomeByCategory).map(([k, v]) => `  - ${k}: S/ ${v.toFixed(2)}`).join("\n")}

Últimas 10 transacciones:
${(transactions || []).slice(0, 10).map((t: any) => `  - ${t.date} | ${t.type} | ${t.category} | S/ ${Number(t.amount).toFixed(2)} | ${t.description || "Sin descripción"}`).join("\n")}
`;

    const { messages } = await req.json();

    const systemPrompt = `Eres "IA de BudgetTrack", un asesor financiero personal inteligente. Tu rol es analizar los datos financieros del usuario y dar consejos prácticos, específicos y accionables.

Reglas:
- Responde siempre en español
- Sé conciso pero útil
- Usa datos concretos del usuario para dar consejos personalizados
- Sugiere formas de reducir gastos y aumentar ingresos
- Si el usuario pregunta sobre sus gastos, analiza las categorías y da recomendaciones
- Usa emojis moderadamente para hacer la conversación amigable
- Formatea con markdown: usa **negritas**, listas, y encabezados cuando sea útil
- La moneda es Soles peruanos (S/)

${financialContext}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Demasiadas solicitudes. Intenta de nuevo en un momento." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos agotados. Agrega fondos a tu workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Error del servicio de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("budget-ai-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
