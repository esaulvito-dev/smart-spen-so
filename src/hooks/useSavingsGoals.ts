import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  icon: string;
  color: string;
  is_completed: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateSavingsGoal {
  name: string;
  target_amount: number;
  current_amount?: number;
  deadline?: string | null;
  icon?: string;
  color?: string;
}

export interface UpdateSavingsGoal {
  id: string;
  name?: string;
  target_amount?: number;
  current_amount?: number;
  deadline?: string | null;
  icon?: string;
  color?: string;
  is_completed?: boolean;
}

export function useSavingsGoals() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['savings_goals', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SavingsGoal[];
    },
    enabled: !!user?.id,
  });
}

export function useCreateSavingsGoal() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (goal: CreateSavingsGoal) => {
      if (!user?.id) throw new Error('No user');
      
      const { data, error } = await supabase
        .from('savings_goals')
        .insert({
          ...goal,
          user_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings_goals'] });
    },
  });
}

export function useUpdateSavingsGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateSavingsGoal) => {
      const { data, error } = await supabase
        .from('savings_goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings_goals'] });
    },
  });
}

export function useDeleteSavingsGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('savings_goals')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings_goals'] });
    },
  });
}
