import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_budgets",
  title: "List budgets",
  description: "List the signed-in user's monthly budgets, optionally filtered by year and month.",
  inputSchema: {
    year: z.number().int().min(2000).max(2100).optional().describe("Year to filter budgets."),
    month: z.number().int().min(1).max(12).optional().describe("Month to filter budgets (1-12)."),
    limit: z.number().int().min(1).max(100).default(50).describe("Maximum budgets to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("budgets")
      .select("id, amount, category, month, year, created_at")
      .eq("user_id", ctx.getUserId())
      .order("year", { ascending: false })
      .order("month", { ascending: false })
      .limit(input.limit);
    if (input.year) query = query.eq("year", input.year);
    if (input.month) query = query.eq("month", input.month);
    const { data, error } = await query;
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [
        { type: "text", text: `Found ${data?.length ?? 0} budget(s).` },
        { type: "text", text: JSON.stringify(data ?? [], null, 2) },
      ],
      structuredContent: { budgets: data ?? [] },
    };
  },
});
