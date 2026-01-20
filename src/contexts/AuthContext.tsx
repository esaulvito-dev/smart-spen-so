import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  accessValid: boolean;
  checkingAccess: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  recheckAccess: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessValid, setAccessValid] = useState(true);
  const [checkingAccess, setCheckingAccess] = useState(false);

  const checkAccessValidity = async (userId: string) => {
    setCheckingAccess(true);
    try {
      const { data, error } = await supabase.rpc('is_user_access_valid', {
        _user_id: userId
      });
      
      if (error) {
        console.error('Error checking access validity:', error);
        setAccessValid(false);
        return;
      }
      
      setAccessValid(data === true);
    } catch (err) {
      console.error('Error in checkAccessValidity:', err);
      setAccessValid(false);
    } finally {
      setCheckingAccess(false);
    }
  };

  const recheckAccess = async () => {
    if (user?.id) {
      await checkAccessValidity(user.id);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Check access validity when user logs in
        if (session?.user?.id) {
          // Use setTimeout to avoid potential deadlock with Supabase calls
          setTimeout(() => {
            checkAccessValidity(session.user.id);
          }, 0);
        } else {
          setAccessValid(true);
        }
      }
    );

    // Then get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user?.id) {
        await checkAccessValidity(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName }
      }
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setAccessValid(true);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      accessValid, 
      checkingAccess,
      signIn, 
      signUp, 
      signOut,
      recheckAccess
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
