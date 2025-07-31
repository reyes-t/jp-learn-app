
"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
  User,
  Auth,
} from 'firebase/auth';
import { auth } from '@/lib/firebase'; // Assuming your firebase setup is in 'lib/firebase'
import { useToast } from './use-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<any>;
  register: (email: string, pass: string, name: string) => Promise<any>;
  logout: () => Promise<any>;
  updateUserProfile: (name: string) => Promise<void>;
  changePassword: (currentPass: string, newPass: string) => Promise<void>;
  deleteAccount: (currentPass: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => Promise.resolve(),
  register: () => Promise.resolve(),
  logout: () => Promise.resolve(),
  updateUserProfile: () => Promise.resolve(),
  changePassword: () => Promise.resolve(),
  deleteAccount: () => Promise.resolve(),
});

const ADMIN_EMAIL = "admin@sakuralearn.com";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);

      const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/admin';
      const isAdminPage = pathname.startsWith('/admin/dashboard');

      if (!user && !isAuthPage) {
        router.push('/login');
      } else if (user && isAuthPage && pathname !== '/admin') {
         router.push('/');
      } else if (user && isAdminPage && user.email !== ADMIN_EMAIL) {
        // Redirect non-admins trying to access admin pages
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, [router, pathname]);

  const login = (email: string, pass: string) => {
    return signInWithEmailAndPassword(auth, email, pass);
  };

  const register = useCallback(async (email: string, pass: string, name: string) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        await updateProfile(userCredential.user, { displayName: name });
        // Manually setting user here to update UI immediately
        setUser(userCredential.user);
        return userCredential;
    } catch (error: any) {
        console.error("Registration failed:", error);
        toast({
            title: "Registration Failed",
            description: error.message || "An unexpected error occurred.",
            variant: "destructive",
        });
        throw error;
    }
  }, [toast]);


  const logout = () => {
    return signOut(auth);
  };

  const updateUserProfile = async (name: string) => {
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName: name });
      // Create a new user object to trigger re-render
      setUser({ ...auth.currentUser });
    }
  };

  const changePassword = async (currentPass: string, newPass: string) => {
    if (!auth.currentUser || !auth.currentUser.email) {
        throw new Error("No user is currently signed in.");
    }
    const user = auth.currentUser;
    const credential = EmailAuthProvider.credential(user.email, currentPass);

    // Re-authenticate the user
    await reauthenticateWithCredential(user, credential);

    // If re-authentication is successful, update the password
    await updatePassword(user, newPass);
  };

  const deleteAccount = async (currentPass: string) => {
    if (!auth.currentUser || !auth.currentUser.email) {
        throw new Error("No user is currently signed in.");
    }
    const user = auth.currentUser;
    const credential = EmailAuthProvider.credential(user.email, currentPass);

    // Re-authenticate the user
    await reauthenticateWithCredential(user, credential);
    
    // If re-authentication is successful, delete the user
    await deleteUser(user);
  };


  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUserProfile,
    changePassword,
    deleteAccount,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
