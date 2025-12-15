import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { UserProfile, UserRole } from '../types/auth';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  showLoginModal: boolean;
  intendedRoute: string | null;
  openLoginModal: (intendedRoute?: string) => void;
  closeLoginModal: () => void;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (
    email: string,
    password: string,
    metadata: { first_name?: string; last_name?: string; role?: UserRole }
  ) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [intendedRoute, setIntendedRoute] = useState<string | null>(null);

  // Fetch user profile from user_profiles table
  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Attempting to fetch profile for user ID:', userId);

      // Check if we have a session
      const { data: sessionData } = await supabase.auth.getSession();
      console.log('Current session:', sessionData.session ? 'EXISTS' : 'NULL');

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      console.log('Profile fetched successfully:', data);
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUserProfile(null);
    }
  };

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  // Sign up new user
  const signUp = async (
    email: string,
    password: string,
    metadata: { first_name?: string; last_name?: string; role?: UserRole } = {}
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
    return { error };
  };

  // Sign out
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // Check if user has one of the specified roles
  const hasRole = (roles: UserRole[]): boolean => {
    if (!userProfile) return false;
    return roles.includes(userProfile.role);
  };

  // Open login modal with optional intended route
  const openLoginModal = (route?: string) => {
    setIntendedRoute(route || null);
    setShowLoginModal(true);
  };

  // Close login modal
  const closeLoginModal = () => {
    setShowLoginModal(false);
    setIntendedRoute(null);
  };

  const value = {
    user,
    userProfile,
    session,
    loading,
    showLoginModal,
    intendedRoute,
    openLoginModal,
    closeLoginModal,
    signIn,
    signUp,
    signOut,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
