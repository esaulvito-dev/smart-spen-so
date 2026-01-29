import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CustomCategory {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  type: 'income' | 'expense' | 'both';
  created_at: string;
  updated_at: string;
}

export interface CreateCustomCategory {
  name: string;
  icon: string;
  type: 'income' | 'expense' | 'both';
}

export function useCustomCategories() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['custom_categories', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('custom_categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as CustomCategory[];
    },
    enabled: !!user?.id,
  });
}

export function useCreateCustomCategory() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (category: CreateCustomCategory) => {
      if (!user?.id) throw new Error('No user');
      
      const { data, error } = await supabase
        .from('custom_categories')
        .insert({
          ...category,
          user_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom_categories'] });
    },
  });
}

export function useDeleteCustomCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('custom_categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom_categories'] });
    },
  });
}
