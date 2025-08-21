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

export function useInsurerAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<InsurerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user?.email) {
          // Fetch insurer profile
          setTimeout(async () => {
            const { data: insurerProfile } = await supabase
              .from('insurer_profiles')
              .select('*')
              .eq('email', session.user.email)
              .single();
            
            setProfile(insurerProfile);
          }, 0);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user?.email) {
        // Fetch insurer profile
        supabase
          .from('insurer_profiles')
          .select('*')
          .eq('email', session.user.email)
          .single()
          .then(({ data: insurerProfile }) => {
            setProfile(insurerProfile);
            setLoading(false);
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

  return {
    user,
    session,
    profile,
    loading,
    signOut,
    requireAuth,
    isAuthenticated: !!user && !!profile
  };
}