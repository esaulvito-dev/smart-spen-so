import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_transactions",
  title: "List transactions",
  description: "List the signed-in user's recent income and expense transactions, optionally filtered by type or date range.",
  inputSchema: {
    limit: z.number().int().min(1).max(100).default(20).describe("Maximum number of transactions to return."),
    type: z.enum(["income", "expense"]).optional().describe("Filter by transaction type."),
    start_date: z.string().date().optional().describe("Filter from this date (YYYY-MM-DD)."),
    end_date: z.string().date().optional().describe("Filter up to this date (YYYY-MM-DD)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("transactions")
      .select("id, amount, type, category, description, date, created_at")
      .eq("user_id", ctx.getUserId())
      .order("date", { ascending: false })
      .limit(input.limit);
    if (input.type) query = query.eq("type", input.type);
    if (input.start_date) query = query.gte("date", input.start_date);
    if (input.end_date) query = query.lte("date", input.end_date);
    const { data, error } = await query;
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [
        { type: "text", text: `Found ${data?.length ?? 0} transaction(s).` },
        { type: "text", text: JSON.stringify(data ?? [], null, 2) },
      ],
      structuredContent: { transactions: data ?? [] },
    };
  },
});
