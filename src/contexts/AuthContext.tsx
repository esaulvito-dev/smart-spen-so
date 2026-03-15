import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AccessStatus = 'valid' | 'pending' | 'expired' | 'unknown';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  accessValid: boolean;
  accessStatus: AccessStatus;
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
  const [accessStatus, setAccessStatus] = useState<AccessStatus>('unknown');
  const [checkingAccess, setCheckingAccess] = useState(false);

  const checkAccessValidity = async (userId: string) => {
    setCheckingAccess(true);
    try {
      const { data: isActive, error: activeError } = await supabase.rpc('is_user_active', {
        _user_id: userId,
      });

      if (activeError) {
        console.error('Error checking active user status:', activeError);
        setAccessValid(false);
        setAccessStatus('expired');
        return;
      }

      if (isActive !== true) {
        setAccessValid(false);
        setAccessStatus('pending');
        return;
      }

      const { data: isValid, error: validityError } = await supabase.rpc('is_user_access_valid', {
        _user_id: userId,
      });

      if (validityError) {
        console.error('Error checking access validity:', validityError);
        setAccessValid(false);
        setAccessStatus('expired');
        return;
      }

      if (isValid === true) {
        setAccessValid(true);
        setAccessStatus('valid');
      } else {
        setAccessValid(false);
        setAccessStatus('expired');
      }
    } catch (err) {
      console.error('Error in checkAccessValidity:', err);
      setAccessValid(false);
      setAccessStatus('expired');
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
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user?.id) {
        setTimeout(() => {
          checkAccessValidity(session.user.id);
        }, 0);
      } else {
        setAccessValid(true);
        setAccessStatus('unknown');
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user?.id) {
        await checkAccessValidity(session.user.id);
      } else {
        setAccessValid(true);
        setAccessStatus('unknown');
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
        data: { full_name: fullName },
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setAccessValid(true);
    setAccessStatus('unknown');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        accessValid,
        accessStatus,
        checkingAccess,
        signIn,
        signUp,
        signOut,
        recheckAccess,
      }}
    >
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
