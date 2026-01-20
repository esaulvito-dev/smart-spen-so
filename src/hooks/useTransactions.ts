import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type TransactionType = 'income' | 'expense';
export type TransactionCategory = 
  | 'hogar' 
  | 'negocio' 
  | 'trabajo' 
  | 'alimentacion' 
  | 'transporte' 
  | 'entretenimiento' 
  | 'salud' 
  | 'educacion' 
  | 'servicios' 
  | 'otros';

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  description: string | null;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTransaction {
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  description?: string;
  date: string;
}

export function useTransactions(startDate?: string, endDate?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['transactions', user?.id, startDate, endDate],
    queryFn: async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });
      
      if (startDate) {
        query = query.gte('date', startDate);
      }
      if (endDate) {
        query = query.lte('date', endDate);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Transaction[];
    },
    enabled: !!user?.id,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (transaction: CreateTransaction) => {
      if (!user?.id) throw new Error('No user');
      
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          ...transaction,
          user_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export const CATEGORY_LABELS: Record<TransactionCategory, string> = {
  hogar: 'Hogar',
  negocio: 'Negocio',
  trabajo: 'Trabajo',
  alimentacion: 'Alimentación',
  transporte: 'Transporte',
  entretenimiento: 'Entretenimiento',
  salud: 'Salud',
  educacion: 'Educación',
  servicios: 'Servicios',
  otros: 'Otros',
};

export const CATEGORY_ICONS: Record<TransactionCategory, string> = {
  hogar: '🏠',
  negocio: '💼',
  trabajo: '👔',
  alimentacion: '🍽️',
  transporte: '🚗',
  entretenimiento: '🎬',
  salud: '💊',
  educacion: '📚',
  servicios: '⚡',
  otros: '📦',
};
