import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_savings_goals",
  title: "List savings goals",
  description: "List the signed-in user's savings goals and their progress.",
  inputSchema: {
    limit: z.number().int().min(1).max(100).default(50).describe("Maximum goals to return."),
    include_completed: z.boolean().default(false).describe("Include goals already marked as completed."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("savings_goals")
      .select("id, name, target_amount, current_amount, deadline, is_completed, color, icon, created_at")
      .eq("user_id", ctx.getUserId())
      .order("created_at", { ascending: false })
      .limit(input.limit);
    if (!input.include_completed) query = query.eq("is_completed", false);
    const { data, error } = await query;
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [
        { type: "text", text: `Found ${data?.length ?? 0} savings goal(s).` },
        { type: "text", text: JSON.stringify(data ?? [], null, 2) },
      ],
      structuredContent: { goals: data ?? [] },
    };
  },
});
