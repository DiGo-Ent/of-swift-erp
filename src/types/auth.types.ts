export interface User {
  id: string;
  email: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  captchaToken?: string | null;
}

export interface SignupCredentials {
  email: string;
  password: string;
  captchaToken?: string | null;
}

export interface ForgotPasswordCredentials {
  email: string;
  captchaToken?: string | null;
}
