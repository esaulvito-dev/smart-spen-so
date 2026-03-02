import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

let cachedRate: { rate: number; timestamp: number } | null = null;
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const now = Date.now();

    if (cachedRate && now - cachedRate.timestamp < CACHE_DURATION_MS) {
      return new Response(
        JSON.stringify({ rate: cachedRate.rate, cached: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Try multiple free APIs
    let rate: number | null = null;

    // API 1: ExchangeRate-API (free tier, no key needed)
    try {
      const res = await fetch("https://open.er-api.com/v6/latest/USD");
      if (res.ok) {
        const data = await res.json();
        rate = data.rates?.PEN;
      }
    } catch (e) {
      console.error("er-api failed:", e);
    }

    // API 2: Fallback
    if (!rate) {
      try {
        const res = await fetch("https://api.exchangerate.host/latest?base=USD&symbols=PEN");
        if (res.ok) {
          const data = await res.json();
          rate = data.rates?.PEN;
        }
      } catch (e) {
        console.error("exchangerate.host failed:", e);
      }
    }

    if (!rate) {
      throw new Error("Could not fetch exchange rate from any API");
    }

    cachedRate = { rate, timestamp: now };

    return new Response(
      JSON.stringify({ rate, cached: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Exchange rate error:", error);
    return new Response(
      JSON.stringify({ rate: 3.75, fallback: true, error: error.message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
