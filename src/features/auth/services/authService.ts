import { supabase } from '@/integrations/supabase/client';
import { User, LoginCredentials, SignupCredentials } from '@/types/auth.types';
import { getErrorMessage, formatGlobalError } from '@/utils/errorUtils';

export { formatGlobalError, getErrorMessage };
export const formatAuthError = getErrorMessage;

export function mapSupabaseUser(sbUser: any): User | null {
  if (!sbUser) return null;
  return {
    id: sbUser.id,
    email: sbUser.email || '',
  };
}

export const authService = {
  async checkMfaStatus(): Promise<{ isSatisfied: boolean; factorId: string | null }> {
    try {
      const { data: aalData, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (error || !aalData) return { isSatisfied: true, factorId: null };

      if (aalData.nextLevel === 'aal2' && aalData.currentLevel !== 'aal2') {
        const { data: factors, error: fErr } = await supabase.auth.mfa.listFactors();
        if (fErr || !factors) return { isSatisfied: true, factorId: null };

        const totpFactor = factors.totp && factors.totp.length > 0 ? factors.totp.find((f: any) => f.status === 'verified') : null;
        if (totpFactor) {
          return { isSatisfied: false, factorId: totpFactor.id };
        }
      }
      return { isSatisfied: true, factorId: null };
    } catch {
      return { isSatisfied: true, factorId: null };
    }
  },

  async getCurrentUser(): Promise<{ user: User | null; mfaRequired: { factorId: string } | null }> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session?.user) return { user: null, mfaRequired: null };

      const mfaCheck = await this.checkMfaStatus();
      if (!mfaCheck.isSatisfied && mfaCheck.factorId) {
        return { user: null, mfaRequired: { factorId: mfaCheck.factorId } };
      }

      return { user: mapSupabaseUser(session.user), mfaRequired: null };
    } catch {
      return { user: null, mfaRequired: null };
    }
  },

  async login(credentials: LoginCredentials): Promise<{ user: User | null; mfaRequired: { factorId: string } | null }> {
    if (!credentials.email || !credentials.password) {
      throw new Error(getErrorMessage('Please fill in both email and password.'));
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email.trim(),
      password: credentials.password,
      options: credentials.captchaToken ? { captchaToken: credentials.captchaToken } : undefined,
    });

    if (error) {
      throw new Error(getErrorMessage(error));
    }

    if (!data.user) {
      throw new Error(getErrorMessage('Authentication failed. Please check your credentials.'));
    }

    const mfaCheck = await this.checkMfaStatus();
    if (!mfaCheck.isSatisfied && mfaCheck.factorId) {
      return { user: null, mfaRequired: { factorId: mfaCheck.factorId } };
    }

    return { user: mapSupabaseUser(data.user), mfaRequired: null };
  },

  async verifyMfa(factorId: string, code: string): Promise<User> {
    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: code.trim(),
    });

    if (error) throw new Error(getErrorMessage(error));

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error(getErrorMessage('Verification failed.'));
    return mapSupabaseUser(session.user)!;
  },

  async enrollMfa(): Promise<{ factorId: string; qrCodeSvg: string; secret: string }> {
    try {
      const { data: factorsData } = await supabase.auth.mfa.listFactors();
      if (factorsData && factorsData.totp && factorsData.totp.length > 0) {
        for (const f of factorsData.totp) {
          if (f.status !== 'verified') {
            try {
              await supabase.auth.mfa.unenroll({ factorId: f.id });
            } catch {
              // ignore
            }
          }
        }
      }
    } catch {
      // ignore
    }

    const { data: { session } } = await supabase.auth.getSession();
    const userEmail = session?.user?.email || 'user@digo.com';

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      issuer: 'DiGo ERP',
      friendlyName: `DiGo ERP (${userEmail})`,
    });

    if (error) {
      const retryRes = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        issuer: 'DiGo ERP',
        friendlyName: `DiGo ERP (${userEmail}) - ${Date.now()}`,
      });

      if (retryRes.error) {
        throw new Error(getErrorMessage(retryRes.error));
      }
      if (!retryRes.data?.totp) {
        throw new Error(getErrorMessage('Failed to generate MFA secret key.'));
      }

      return {
        factorId: retryRes.data.id,
        qrCodeSvg: retryRes.data.totp.qr_code,
        secret: retryRes.data.totp.secret,
      };
    }

    if (!data?.totp) throw new Error(getErrorMessage('Failed to generate MFA secret key.'));

    return {
      factorId: data.id,
      qrCodeSvg: data.totp.qr_code,
      secret: data.totp.secret,
    };
  },

  async verifyAndActivateMfa(factorId: string, code: string): Promise<void> {
    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: code.trim(),
    });
    if (error) throw new Error(getErrorMessage(error));
  },

  async unenrollMfa(factorId: string): Promise<void> {
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) throw new Error(getErrorMessage(error));
  },

  async getActiveMfaFactors(): Promise<{ verifiedFactor: any | null; unverifiedFactor: any | null }> {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error || !data) return { verifiedFactor: null, unverifiedFactor: null };

    const totpFactors = data.totp || [];
    const verifiedFactor = totpFactors.find((f: any) => f.status === 'verified') || null;
    const unverifiedFactor = totpFactors.find((f: any) => f.status === 'unverified') || null;

    return { verifiedFactor, unverifiedFactor };
  },

  async verifyCurrentPassword(currentPassword: string, captchaToken?: string | null): Promise<boolean> {
    if (!currentPassword) {
      throw new Error('Please enter your current password.');
    }

    const { data: { user } } = await supabase.auth.getUser();
    const userEmail = user?.email;

    if (!userEmail) {
      throw new Error('Active user session not found. Please log in again.');
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: currentPassword,
      options: captchaToken ? { captchaToken } : undefined,
    });

    if (error) {
      console.error('[authService] Current password verification error:', error);
      const lowerErr = (error.message || '').toLowerCase();
      if (lowerErr.includes('invalid login credentials') || lowerErr.includes('invalid_credentials')) {
        throw new Error('Incorrect current password. Please check what you typed and try again.');
      }
      throw new Error(getErrorMessage(error));
    }

    return true;
  },

  async updatePassword(newPassword: string): Promise<void> {
    if (!newPassword) {
      throw new Error('Please enter your new password.');
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.error('[authService] Update password error:', error);
      throw new Error(getErrorMessage(error));
    }
  },

  async changePassword(currentPassword: string, newPassword: string, captchaToken?: string | null): Promise<void> {
    await this.verifyCurrentPassword(currentPassword, captchaToken);
    await this.updatePassword(newPassword);
  },

  async signup(data: SignupCredentials): Promise<{ user: User | null; requiresEmailConfirmation: boolean }> {
    if (!data.email || !data.password) {
      throw new Error(getErrorMessage('Please enter both email and password.'));
    }

    const { data: res, error } = await supabase.auth.signUp({
      email: data.email.trim(),
      password: data.password,
      options: {
        captchaToken: data.captchaToken || undefined,
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      throw new Error(getErrorMessage(error));
    }

    if (res.user && res.session) {
      return { user: mapSupabaseUser(res.user), requiresEmailConfirmation: false };
    }

    return { user: null, requiresEmailConfirmation: true };
  },

  async forgotPassword(email: string, captchaToken?: string | null): Promise<string> {
    if (!email) throw new Error(getErrorMessage('Please enter a valid email address.'));
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      captchaToken: captchaToken || undefined,
      redirectTo: `${window.location.origin}/`,
    });

    if (error) {
      throw new Error(getErrorMessage(error));
    }

    return `Password reset link has been sent to ${email}. Check your inbox.`;
  },

  async logout(): Promise<void> {
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch (err) {
      console.error('[authService] Error signing out from Supabase:', err);
    } finally {
      try {
        const theme = localStorage.getItem('digo_theme_mode');
        localStorage.clear();
        sessionStorage.clear();
        if (theme) localStorage.setItem('digo_theme_mode', theme);
      } catch {
        // ignore storage errors
      }
    }
  },
};
