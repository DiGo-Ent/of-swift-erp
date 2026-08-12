import { useState } from 'react';
import { notify } from '@/utils/notification';
import { authService } from '@/features/auth/services/authService';

interface Requirement {
  key: string;
  label: string;
  test: (pw: string) => boolean;
}

export const REQUIREMENTS: Requirement[] = [
  { key: 'len', label: 'At least 8 characters long', test: (pw) => pw.length >= 8 },
  { key: 'upper', label: 'Contains uppercase letter (A-Z)', test: (pw) => /[A-Z]/.test(pw) },
  { key: 'lower', label: 'Contains lowercase letter (a-z)', test: (pw) => /[a-z]/.test(pw) },
  { key: 'num', label: 'Contains numeric digit (0-9)', test: (pw) => /[0-9]/.test(pw) },
  { key: 'spec', label: 'Contains special symbol (!@#$%^&*)', test: (pw) => /[!@#$%^&*(),.?":{}|<>\-_]/.test(pw) },
];

export function useChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);

  const [isCurrentVerified, setIsCurrentVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const validReqs = REQUIREMENTS.map((r) => ({ ...r, isValid: r.test(newPassword) }));
  const criteriaCount = validReqs.filter((r) => r.isValid).length;
  const strengthScore = (criteriaCount / 5) * 100;

  let strengthLabel = 'Very Weak';
  let strengthColor = 'var(--red-danger)';
  if (criteriaCount === 5) {
    strengthLabel = 'Strong (Excellent)';
    strengthColor = 'var(--green-success)';
  } else if (criteriaCount >= 3) {
    strengthLabel = 'Good (Fair)';
    strengthColor = 'var(--blue-primary)';
  } else if (criteriaCount >= 2) {
    strengthLabel = 'Medium';
    strengthColor = 'var(--amber-warning)';
  }

  const isMatch = confirmPassword.length > 0 && newPassword === confirmPassword;
  const isMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const isFormValid = isCurrentVerified && criteriaCount >= 3 && isMatch;

  const handleVerifyCurrentPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) return;

    setIsVerifying(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await authService.verifyCurrentPassword(currentPassword, captchaToken);
      setIsCurrentVerified(true);
      setSuccessMsg('Current password verified successfully! You can now enter your new password below.');
    } catch (err: any) {
      setIsCurrentVerified(false);
      setError(err.message || 'Incorrect current password. Please try again.');
      setCaptchaResetKey((k) => k + 1);
      setCaptchaToken(null);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await authService.updatePassword(newPassword);
      setSuccessMsg('Your account password has been updated successfully!');
      notify.success('Password Updated', 'Your account password has been changed successfully.');
      void notify.native('Security Alert', { body: 'Your account password was updated.' });
      handleReset();
    } catch (err: any) {
      const msg = err.message || 'Failed to update password. Please try again.';
      setError(msg);
      notify.error('Password Update Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setIsCurrentVerified(false);
    setError(null);
    setSuccessMsg(null);
    setCaptchaResetKey((k) => k + 1);
    setCaptchaToken(null);
  };

  return {
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    captchaResetKey,
    setCaptchaToken,
    isCurrentVerified,
    isVerifying,
    isSubmitting,
    showCurrent,
    setShowCurrent,
    showNew,
    setShowNew,
    showConfirm,
    setShowConfirm,
    error,
    successMsg,
    validReqs,
    strengthLabel,
    strengthColor,
    strengthScore,
    isMatch,
    isMismatch,
    isFormValid,
    handleVerifyCurrentPassword,
    handleUpdatePassword,
    handleReset,
  };
}
