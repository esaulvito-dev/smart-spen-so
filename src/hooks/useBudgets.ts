import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { TransactionCategory } from './useTransactions';

export interface Budget {
  id: string;
  user_id: string;
  category: TransactionCategory;
  amount: number;
  month: number;
  year: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateBudget {
  category: TransactionCategory;
  amount: number;
  month: number;
  year: number;
}

export interface UpdateBudget {
  id: string;
  amount?: number;
}

export function useBudgets(month?: number, year?: number) {
  const { user } = useAuth();
  const now = new Date();
  const targetMonth = month ?? now.getMonth() + 1;
  const targetYear = year ?? now.getFullYear();

  return useQuery({
    queryKey: ['budgets', user?.id, targetMonth, targetYear],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', targetMonth)
        .eq('year', targetYear);
      
      if (error) throw error;
      return data as Budget[];
    },
    enabled: !!user?.id,
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (budget: CreateBudget) => {
      if (!user?.id) throw new Error('No user');
      
      const { data, error } = await supabase
        .from('budgets')
        .insert({
          ...budget,
          user_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateBudget) => {
      const { data, error } = await supabase
        .from('budgets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}
