import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

const transactionCategories = [
  "hogar",
  "negocio",
  "trabajo",
  "alimentacion",
  "transporte",
  "entretenimiento",
  "salud",
  "educacion",
  "servicios",
  "otros",
] as const;

export default defineTool({
  name: "create_transaction",
  title: "Create transaction",
  description: "Record a new income or expense transaction for the signed-in user. Amounts are stored in PEN ( soles).",
  inputSchema: {
    amount: z.number().positive().describe("Transaction amount in positive numeric form."),
    type: z.enum(["income", "expense"]).describe("Whether this is income or expense."),
    category: z.enum(transactionCategories).describe("Budget category for the transaction."),
    description: z.string().max(255).optional().describe("Short description or note."),
    date: z.string().date().optional().describe("Transaction date (YYYY-MM-DD); defaults to today."),
  },
  annotations: { readOnlyHint: false, idempotentHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const date = input.date ?? new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("transactions")
      .insert({
        user_id: ctx.getUserId(),
        amount: input.amount,
        type: input.type,
        category: input.category,
        description: input.description ?? null,
        date,
      })
      .select("id, amount, type, category, description, date")
      .single();
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: `Transaction recorded: ${JSON.stringify(data)}` }],
      structuredContent: { transaction: data },
    };
  },
});
