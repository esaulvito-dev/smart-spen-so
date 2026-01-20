import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'admin' | 'user';
  created_at: string;
  is_active: boolean;
}

export interface Invitation {
  id: string;
  email: string;
  invited_by: string;
  is_accepted: boolean;
  is_active: boolean;
  created_at: string;
  accepted_at: string | null;
}

export function useIsAdmin() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['is-admin', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      
      if (error) {
        console.error('Error checking admin status:', error);
        return false;
      }
      
      return !!data;
    },
    enabled: !!user?.id,
  });
}

export function useUsers() {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      // Get all user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, created_at');
      
      if (rolesError) throw rolesError;
      
      // Get profiles for these users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url');
      
      if (profilesError) throw profilesError;
      
      // Combine data
      const users: UserWithRole[] = (roles || []).map((role) => {
        const profile = profiles?.find(p => p.id === role.user_id);
        return {
          id: role.user_id,
          email: profile?.email || 'Sin email',
          full_name: profile?.full_name,
          avatar_url: profile?.avatar_url,
          role: role.role as 'admin' | 'user',
          created_at: role.created_at,
          is_active: true,
        };
      });
      
      return users;
    },
  });
}

export function useInvitations() {
  return useQuery({
    queryKey: ['admin-invitations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Invitation[];
    },
  });
}

export function useCreateInvitation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (email: string) => {
      if (!user?.id) throw new Error('No user');
      
      // First create the invitation in the database
      const { data: invitation, error: dbError } = await supabase
        .from('invitations')
        .insert({
          email: email.toLowerCase(),
          invited_by: user.id,
        })
        .select()
        .single();
      
      if (dbError) throw dbError;
      
      // Then send the email via edge function
      const { error: emailError } = await supabase.functions.invoke('send-invitation', {
        body: { email: email.toLowerCase(), invitationId: invitation.id },
      });
      
      if (emailError) {
        console.error('Error sending email:', emailError);
        // Don't throw - invitation was created, just email failed
      }
      
      return invitation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-invitations'] });
    },
  });
}

export function useToggleUserAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      if (isActive) {
        // Deactivate: remove from user_roles
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId);
        
        if (error) throw error;
      } else {
        // Reactivate: add back to user_roles
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'user' });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      // Delete from user_roles (this will cascade properly)
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);
      
      if (error) throw error;
      
      // Note: To fully delete a user from auth.users, you'd need an admin function
      // For now, we just remove their access
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
}

export function useDeleteInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', invitationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-invitations'] });
    },
  });
}

export function useResendInvitation() {
  return useMutation({
    mutationFn: async ({ email, invitationId }: { email: string; invitationId: string }) => {
      const { error } = await supabase.functions.invoke('send-invitation', {
        body: { email, invitationId },
      });
      
      if (error) throw error;
    },
  });
}
