import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { TransactionType, TransactionCategory } from './useTransactions';

export type Frequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';

export interface RecurringTransaction {
  id: string;
  user_id: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  description: string | null;
  frequency: Frequency;
  start_date: string;
  next_due_date: string;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateRecurringTransaction {
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  description?: string;
  frequency: Frequency;
  start_date: string;
  next_due_date?: string;
}

export interface UpdateRecurringTransaction {
  id: string;
  type?: TransactionType;
  category?: TransactionCategory;
  amount?: number;
  description?: string | null;
  frequency?: Frequency;
  next_due_date?: string;
  is_active?: boolean;
}

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  daily: 'Diario',
  weekly: 'Semanal',
  biweekly: 'Quincenal',
  monthly: 'Mensual',
  yearly: 'Anual',
};

export function useRecurringTransactions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['recurring_transactions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('recurring_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('next_due_date', { ascending: true });
      
      if (error) throw error;
      return data as RecurringTransaction[];
    },
    enabled: !!user?.id,
  });
}

export function useCreateRecurringTransaction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (transaction: CreateRecurringTransaction) => {
      if (!user?.id) throw new Error('No user');
      
      const { data, error } = await supabase
        .from('recurring_transactions')
        .insert({
          ...transaction,
          next_due_date: transaction.next_due_date || transaction.start_date,
          user_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring_transactions'] });
    },
  });
}

export function useUpdateRecurringTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateRecurringTransaction) => {
      const { data, error } = await supabase
        .from('recurring_transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring_transactions'] });
    },
  });
}

export function useDeleteRecurringTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('recurring_transactions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring_transactions'] });
    },
  });
}

// Helper function to calculate next due date
export function calculateNextDueDate(currentDate: string, frequency: Frequency): string {
  const date = new Date(currentDate);
  
  switch (frequency) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'biweekly':
      date.setDate(date.getDate() + 14);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
  }
  
  return date.toISOString().split('T')[0];
}
