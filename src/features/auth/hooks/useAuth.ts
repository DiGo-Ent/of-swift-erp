import { useState, useEffect } from 'react';
import { User, LoginCredentials, SignupCredentials } from '@/types/auth.types';
import { authService, mapSupabaseUser } from '@/features/auth/services/authService';
import { useSession } from '@/context/SessionContext';
import { navigateTo } from '@/config/navigationConfig';

import { notify } from '@/utils/notification';

export function useAuth() {
  const { session, userId, isSessionLoading, authEventId } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [isResolvingMfa, setIsResolvingMfa] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [mfaFactor, setMfaFactor] = useState<{ factorId: string } | null>(null);

  // Reacts to the single app-wide session listener — no extra subscription here.
  useEffect(() => {
    if (isSessionLoading) return;

    let isMounted = true;

    if (!session?.user) {
      setUser(null);
      setMfaFactor(null);
      setIsResolvingMfa(false);
      return;
    }

    void (async () => {
      const mfaCheck = await authService.checkMfaStatus();
      if (!isMounted) return;
      if (!mfaCheck.isSatisfied && mfaCheck.factorId) {
        setMfaFactor({ factorId: mfaCheck.factorId });
        setUser(null);
      } else {
        setUser(mapSupabaseUser(session.user));
        setMfaFactor(null);
      }
      setIsResolvingMfa(false);
    })();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, isSessionLoading, authEventId]);

  const isInitialLoading = isSessionLoading || isResolvingMfa;


  const login = async (credentials: LoginCredentials) => {
    setError(null);
    try {
      const res = await authService.login(credentials);
      if (res.mfaRequired) {
        setUser(null);
        setMfaFactor(res.mfaRequired);
        notify.info('2FA Code Required', 'Please enter your 6-digit authenticator code.');
        return { mfaRequired: true };
      }
      if (res.user) {
        setUser(res.user);
        setMfaFactor(null);
        notify.success('Signed in successfully', `Welcome back, ${res.user.email}`);
        void notify.native('Welcome to DiGo ERP', { body: `Signed in as ${res.user.email}` });
      }
      return { mfaRequired: false };
    } catch (err: any) {
      const msg = err.message || 'Login failed.';
      setError(msg);
      notify.error('Authentication Error', msg);
      throw new Error(msg);
    }
  };

  const verifyMfa = async (code: string) => {
    if (!mfaFactor) return;
    setError(null);
    try {
      const verifiedUser = await authService.verifyMfa(mfaFactor.factorId, code);
      setUser(verifiedUser);
      setMfaFactor(null);
      notify.success('2FA Verified', 'Authentication completed.');
      return verifiedUser;
    } catch (err: any) {
      const msg = err.message || 'Invalid verification code.';
      setError(msg);
      notify.error('2FA Verification Failed', msg);
      throw new Error(msg);
    }
  };

  const signup = async (credentials: SignupCredentials) => {
    setError(null);
    try {
      const res = await authService.signup(credentials);
      if (res.user) {
        setUser(res.user);
        notify.success('Account Created', 'Your account has been set up successfully.');
      } else if (res.requiresEmailConfirmation) {
        notify.info('Verification Email Sent', 'Please check your inbox to confirm your email.');
      }
      return res;
    } catch (err: any) {
      const msg = err.message || 'Signup failed.';
      setError(msg);
      notify.error('Signup Error', msg);
      throw new Error(msg);
    }
  };

  const forgotPassword = async (email: string, captchaToken?: string | null) => {
    setError(null);
    try {
      const msg = await authService.forgotPassword(email, captchaToken);
      notify.success('Password Reset Link Sent', msg);
      return msg;
    } catch (err: any) {
      const msg = err.message || 'Password reset failed.';
      setError(msg);
      notify.error('Password Reset Error', msg);
      throw new Error(msg);
    }
  };

  const logout = async () => {
    setUser(null);
    setMfaFactor(null);
    setError(null);
    notify.info('Signed Out', 'You have been logged out safely.');
    await authService.logout();

    if (window.location.pathname !== '/') {
      navigateTo('/', { replace: true });
    }

  };

  return {
    user,
    isAuthenticated: !!user,
    isInitialLoading,
    error,
    mfaFactor,
    login,
    verifyMfa,
    signup,
    forgotPassword,
    logout,
    cancelMfa: logout,
    clearError: () => setError(null),
  };
}
