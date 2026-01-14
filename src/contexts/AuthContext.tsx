import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'admin' | 'developer' | null;
type ApprovalStatus = 'pending' | 'approved' | 'rejected' | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole;
  approvalStatus: ApprovalStatus;
  isLoading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch all user roles - prioritize admin role if exists
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (roleData && roleData.length > 0) {
        // Check if user has admin role
        const hasAdminRole = roleData.some(r => r.role === 'admin');
        setRole(hasAdminRole ? 'admin' : (roleData[0].role as UserRole));
      }

      // Fetch approval status for developers
      const { data: approvalData } = await supabase
        .from('developer_approvals')
        .select('status')
        .eq('user_id', userId)
        .maybeSingle();

      if (approvalData) {
        setApprovalStatus(approvalData.status as ApprovalStatus);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const refreshUserData = async () => {
    if (user) {
      await fetchUserData(user.id);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer Supabase calls with setTimeout to prevent deadlock
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setRole(null);
          setApprovalStatus(null);
        }
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    setApprovalStatus(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        approvalStatus,
        isLoading,
        signUp,
        signIn,
        signOut,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
