/**
 * Global Centralized Error Handling System — ERP Solution (Powered by DiGo)
 * Parses, translates, and formats all runtime, authentication, database, and network errors.
 */

export interface FormattedError {
  title: string;
  message: string;
  originalError?: any;
}

export function formatGlobalError(error: any): FormattedError {
  if (!error) {
    return {
      title: 'Unexpected Issue',
      message: 'An unexpected issue occurred. Please try again or refresh the page.'
    };
  }

  const rawMsg = typeof error === 'string' ? error : error.message || String(error);
  const lower = rawMsg.toLowerCase();

  // 1. Security CAPTCHA & Protection Errors (Check FIRST to catch all Captcha/Turnstile variants)
  if (
    lower.includes('captcha') || 
    lower.includes('turnstile') || 
    lower.includes('captcha_token') || 
    lower.includes('request disallowed')
  ) {
    return {
      title: 'Security Check Required',
      message: 'Please complete the security verification (CAPTCHA) check before proceeding.',
      originalError: error
    };
  }

  // 2. Two-Factor Authentication (2MFA) Duplicate Factor & Friendly Name Errors
  if (
    lower.includes('friendly name') || 
    lower.includes('already exists') || 
    lower.includes('factor with the friendly') ||
    (lower.includes('factor') && lower.includes('exists'))
  ) {
    return {
      title: '2FA Setup In Progress',
      message: 'A 2FA security setup session is already active. Please enter your 6-digit TOTP code to activate 2FA, or click Enable 2FA Security to generate a new QR code.',
      originalError: error
    };
  }

  // 3. Invalid 6-Digit Code / Verification Failed Errors
  if (
    lower.includes('invalid totp') || 
    lower.includes('mfa') || 
    lower.includes('challenge failed') || 
    lower.includes('verification failed')
  ) {
    return {
      title: 'Security Code Invalid',
      message: 'Incorrect 6-digit verification code. Please check your authenticator app and try again.',
      originalError: error
    };
  }

  // 4. Authentication Credentials & Login Errors
  if (lower.includes('invalid login credentials') || lower.includes('invalid_credentials')) {
    return {
      title: 'Invalid Credentials',
      message: 'Incorrect email or password. Please verify your details and try again.',
      originalError: error
    };
  }

  // 5. Account Registration Errors
  if (lower.includes('user already registered') || lower.includes('user_already_exists')) {
    return {
      title: 'Account Already Exists',
      message: 'An account with this email address already exists. Please sign in or use Forgot Password.',
      originalError: error
    };
  }

  // 6. Rate Limiting & Abuse Prevention
  if (lower.includes('email rate limit exceeded') || lower.includes('rate limit')) {
    return {
      title: 'Too Many Attempts',
      message: 'Too many authentication attempts. Please wait a few minutes before trying again.',
      originalError: error
    };
  }

  // 7. Password Policy Errors
  if (lower.includes('password should be at least')) {
    return {
      title: 'Weak Password',
      message: 'Password must be at least 6 characters long.',
      originalError: error
    };
  }

  // 8. Network & Server Connectivity Errors
  if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('net::')) {
    return {
      title: 'Network Connection Error',
      message: 'Unable to connect to ERP servers. Please check your internet connection and try again.',
      originalError: error
    };
  }

  // 9. Email Verification Errors
  if (lower.includes('email not confirmed')) {
    return {
      title: 'Email Unverified',
      message: 'Your email address is not verified yet. Please check your inbox for the confirmation link.',
      originalError: error
    };
  }

  // Fallback: Clean Raw Error String (Strip all technical prefix prefixes)
  const cleanMsg = rawMsg
    .replace(/^AuthApiError:\s*/i, '')
    .replace(/^Error:\s*/i, '')
    .replace(/^TypeError:\s*/i, '');

  return {
    title: 'Operation Failed',
    message: cleanMsg || 'Something went wrong. Please try again.',
    originalError: error
  };
}

export function getErrorMessage(error: any): string {
  return formatGlobalError(error).message;
}
