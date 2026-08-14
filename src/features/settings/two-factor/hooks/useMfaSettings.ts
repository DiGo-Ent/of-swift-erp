import { useState, useEffect } from 'react';
import { notify } from '@/utils/notification';
import { authService } from '@/features/auth/services/authService';

export function useMfaSettings() {
  const [loading, setLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [verifiedFactor, setVerifiedFactor] = useState<any | null>(null);
  const [enrollData, setEnrollData] = useState<{ factorId: string; qrCodeSvg: string; secret: string } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  const loadMfaStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const { verifiedFactor: vFact } = await authService.getActiveMfaFactors();
      setVerifiedFactor(vFact);
    } catch (err: any) {
      setError(err.message || 'Failed to load 2FA status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMfaStatus();
  }, []);

  const handleStartEnrollment = async () => {
    setError(null);
    setSuccessMsg(null);
    setIsEnrolling(true);
    try {
      const data = await authService.enrollMfa();
      setEnrollData(data);
    } catch (err: any) {
      setError(err.message || 'Could not start 2FA enrollment.');
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleActivate2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollData || verificationCode.length < 6) return;
    setIsVerifying(true);
    setError(null);
    try {
      await authService.verifyAndActivateMfa(enrollData.factorId, verificationCode);
      const msg = '2FA Security activated successfully! Your account is now protected.';
      setSuccessMsg(msg);
      notify.success('2FA Activated', msg);
      void notify.native('Security Status Updated', { body: 'Two-Factor Authentication is now enabled.' });
      setEnrollData(null);
      setVerificationCode('');
      await loadMfaStatus();
    } catch (err: any) {
      const msg = err.message || 'Invalid 6-digit verification code.';
      setError(msg);
      notify.error('2FA Activation Error', msg);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!verifiedFactor) return;
    setIsEnrolling(true);
    setError(null);
    try {
      await authService.unenrollMfa(verifiedFactor.id);
      const msg = '2FA has been disabled for your account.';
      setSuccessMsg(msg);
      notify.info('2FA Disabled', msg);
      void notify.native('Security Status Updated', { body: 'Two-Factor Authentication has been disabled.' });
      setVerifiedFactor(null);
      setEnrollData(null);
    } catch (err: any) {
      const msg = err.message || 'Failed to disable 2FA.';
      setError(msg);
      notify.error('2FA Disable Error', msg);
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleCopySecret = () => {
    if (!enrollData?.secret) return;
    navigator.clipboard.writeText(enrollData.secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  return {
    loading,
    isEnrolling,
    verifiedFactor,
    enrollData,
    setEnrollData,
    verificationCode,
    setVerificationCode,
    isVerifying,
    error,
    successMsg,
    copiedSecret,
    handleStartEnrollment,
    handleActivate2FA,
    handleDisable2FA,
    handleCopySecret,
  };
}
