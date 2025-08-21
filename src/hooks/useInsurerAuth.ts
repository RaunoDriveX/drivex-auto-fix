import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface InsurerProfile {
  id: string;
  insurer_name: string;
  email: string | null;
  contact_person: string | null;
  phone: string | null;
}

interface InsurerUser {
  id: string;
  role: 'admin' | 'claims_user';
  is_active: boolean;
  full_name: string;
}

export function useInsurerAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<InsurerProfile | null>(null);
  const [userRole, setUserRole] = useState<InsurerUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user?.id) {
          // Fetch user role and insurer profile
          setTimeout(async () => {
            const [{ data: insurerUser }, { data: insurerId }] = await Promise.all([
              supabase
                .from('insurer_users')
                .select('*')
                .eq('user_id', session.user.id)
                .eq('is_active', true)
                .single(),
              supabase.rpc('get_user_insurer_id', { _user_id: session.user.id })
            ]);

            if (insurerUser && insurerId) {
              setUserRole(insurerUser);
              
              // Fetch insurer profile
              const { data: insurerProfile } = await supabase
                .from('insurer_profiles')
                .select('*')
                .eq('id', insurerId)
                .single();
              
              setProfile(insurerProfile);
            } else {
              // Fallback to legacy profile check
              const { data: legacyProfile } = await supabase
                .from('insurer_profiles')
                .select('*')
                .eq('email', session.user.email)
                .single();
              
              setProfile(legacyProfile);
            }
          }, 0);
        } else {
          setProfile(null);
          setUserRole(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user?.id) {
        // Fetch user role and insurer profile
        Promise.all([
          supabase
            .from('insurer_users')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('is_active', true)
            .single(),
          supabase.rpc('get_user_insurer_id', { _user_id: session.user.id })
        ]).then(([{ data: insurerUser }, { data: insurerId }]) => {
          if (insurerUser && insurerId) {
            setUserRole(insurerUser);
            
            // Fetch insurer profile
            supabase
              .from('insurer_profiles')
              .select('*')
              .eq('id', insurerId)
              .single()
              .then(({ data: insurerProfile }) => {
                setProfile(insurerProfile);
                setLoading(false);
              });
          } else {
            // Fallback to legacy profile check
            supabase
              .from('insurer_profiles')
              .select('*')
              .eq('email', session.user.email)
              .single()
              .then(({ data: legacyProfile }) => {
                setProfile(legacyProfile);
                setLoading(false);
              });
          }
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      setUserRole(null);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const requireAuth = () => {
    if (!loading && (!user || !profile)) {
      navigate('/insurer-auth');
      return false;
    }
    return true;
  };

  const isAdmin = () => {
    return userRole?.role === 'admin';
  };

  return {
    user,
    session,
    profile,
    userRole,
    loading,
    signOut,
    requireAuth,
    isAdmin,
    isAuthenticated: !!user && !!profile
  };
}