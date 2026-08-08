import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Turnstile } from "@/components/turnstile";
import { Btn, Field, Label, Panel } from "@/components/ui-kit";
import logo from "@/assets/digo-logo.png.asset.json";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — ERP Solution by DiGo" },
      {
        name: "description",
        content:
          "Secure sign in to ERP Solution, powered by DiGo. Login, sign up, password reset and two-factor authentication.",
      },
      { property: "og:title", content: "Sign in — ERP Solution by DiGo" },
      {
        property: "og:description",
        content: "Secure access to your ERP Solution workspace, powered by DiGo.",
      },
    ],
  }),
  component: AuthPage,
});

type Mode = "login" | "signup" | "forgot";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [captchaKey, setCaptchaKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "error" | "ok"; text: string } | null>(null);
  const [mfa, setMfa] = useState<{ factorId: string } | null>(null);
  const [code, setCode] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  const resetCaptcha = () => {
    setCaptcha(null);
    setCaptchaKey((k) => k + 1);
  };

  async function afterLogin() {
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error) throw error;
    if (data.nextLevel === "aal2" && data.nextLevel !== data.currentLevel) {
      const { data: factors, error: fErr } = await supabase.auth.mfa.listFactors();
      if (fErr) throw fErr;
      const factor = factors.totp[0];
      if (!factor) throw new Error("No TOTP factor found");
      setMfa({ factorId: factor.id });
      return;
    }
    navigate({ to: "/dashboard", replace: true });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!captcha) {
      setMsg({ type: "error", text: "Please complete the security check." });
      return;
    }
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
          options: { captchaToken: captcha },
        });
        if (error) throw error;
        await afterLogin();
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            captchaToken: captcha,
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        if (error) throw error;
        if (data.session) navigate({ to: "/dashboard", replace: true });
        else setMsg({ type: "ok", text: "Check your email to confirm your account." });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          captchaToken: captcha,
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setMsg({ type: "ok", text: "Password reset link sent to your email." });
      }
    } catch (err) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Something went wrong" });
    } finally {
      resetCaptcha();
      setBusy(false);
    }
  }

  async function verifyMfa(e: React.FormEvent) {
    e.preventDefault();
    if (!mfa) return;
    setBusy(true);
    setMsg(null);
    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: mfa.factorId,
        code: code.trim(),
      });
      if (error) throw error;
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Invalid code" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src={logo.url} alt="DiGo logo" width={56} height={56} className="h-14 w-14" />
          <h1 className="mt-3 text-xl font-semibold tracking-tight">ERP Solution</h1>
          <p className="text-xs text-muted-foreground">Powered by DiGo</p>
        </div>

        <Panel>
          {mfa ? (
            <form onSubmit={verifyMfa} className="space-y-4">
              <div>
                <h2 className="text-sm font-semibold">Two-factor verification</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Enter the 6-digit code from your authenticator app.
                </p>
              </div>
              <Field
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
              <Btn type="submit" disabled={busy} className="w-full">
                {busy ? "Verifying…" : "Verify"}
              </Btn>
            </form>
          ) : (
            <>
              <div className="mb-4 grid grid-cols-2 gap-1 rounded-md bg-secondary p-1">
                {(["login", "signup"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setMode(m);
                      setMsg(null);
                    }}
                    className={`h-8 rounded text-xs font-medium transition-colors ${
                      mode === m
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {m === "login" ? "Sign in" : "Sign up"}
                  </button>
                ))}
              </div>

              <form onSubmit={submit} className="space-y-3">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Field
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                {mode !== "forgot" && (
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Field
                      id="password"
                      type="password"
                      minLength={8}
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                )}

                <Turnstile resetKey={captchaKey} onToken={setCaptcha} />

                <Btn type="submit" disabled={busy} className="w-full">
                  {busy
                    ? "Please wait…"
                    : mode === "login"
                      ? "Sign in"
                      : mode === "signup"
                        ? "Create account"
                        : "Send reset link"}
                </Btn>
              </form>

              <button
                type="button"
                onClick={() => {
                  setMode(mode === "forgot" ? "login" : "forgot");
                  setMsg(null);
                }}
                className="mt-3 w-full text-xs text-primary hover:underline"
              >
                {mode === "forgot" ? "Back to sign in" : "Forgot password?"}
              </button>
            </>
          )}

          {msg && (
            <p
              className={`mt-3 text-xs ${msg.type === "error" ? "text-destructive" : "text-primary"}`}
            >
              {msg.text}
            </p>
          )}
        </Panel>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          Protected by Cloudflare Turnstile · TLS secured
        </p>
      </div>
    </main>
  );
}
