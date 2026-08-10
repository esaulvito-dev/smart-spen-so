import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listTransactionsTool from "./tools/list-transactions";
import createTransactionTool from "./tools/create-transaction";
import listBudgetsTool from "./tools/list-budgets";
import listGoalsTool from "./tools/list-goals";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "lovable-finance-hub",
  title: "Lovable Finance Hub",
  version: "0.1.0",
  instructions:
    "BudgetTrack personal finance assistant. Tools let a connected user list and create their own transactions, review monthly budgets, and check savings goals. Always use the signed-in user's identity; never accept a user_id from input.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listTransactionsTool, createTransactionTool, listBudgetsTool, listGoalsTool],
});
