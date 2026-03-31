"use client";
import React, { useState, useEffect } from "react";
import "./auth.css";
import { supabase } from "@/lib/supabaseClient";
import Footer from "@/components/Footer";
import Image from "next/image";

type Mode = "login" | "register";
type OAuthProvider = "google" | "github" | "discord";

type FormState = {
  firstname: string;
  lastname: string;
  loginEmail: string;
  loginPassword: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const initialForm: FormState = {
  firstname: "",
  lastname: "",
  loginEmail: "",
  loginPassword: "",
  email: "",
  password: "",
  confirmPassword: "",
};

function OAuthIcon({ provider }: { provider: OAuthProvider }) {
  if (provider === "google") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="oauth-logo google-logo">
        <path d="M12 11v3.5h5.9c-.25 1.5-1.8 4.4-5.9 4.4-3.55 0-6.45-2.95-6.45-6.6s2.9-6.6 6.45-6.6c2.03 0 3.4.86 4.18 1.6l2.85-2.75C17.2 2.85 14.87 2 12 2 6.95 2 2.86 6.18 2.86 11.3S6.95 20.6 12 20.6c6.93 0 9.14-4.86 9.14-7.35 0-.5-.05-.87-.12-1.25H12z" />
      </svg>
    );
  }

  if (provider === "github") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="oauth-logo">
        <path fill="currentColor" d="M12 2a10 10 0 0 0-3.16 19.49c.5.1.68-.22.68-.48v-1.69c-2.78.61-3.37-1.36-3.37-1.36-.46-1.19-1.11-1.5-1.11-1.5-.91-.63.07-.62.07-.62 1.01.07 1.54 1.05 1.54 1.05.9 1.57 2.37 1.12 2.95.86.1-.66.35-1.12.64-1.37-2.22-.26-4.56-1.13-4.56-5.03 0-1.11.39-2.01 1.03-2.72-.1-.26-.45-1.31.1-2.74 0 0 .84-.27 2.75 1.04A9.4 9.4 0 0 1 12 6.84c.85 0 1.7.12 2.5.35 1.9-1.31 2.74-1.04 2.74-1.04.56 1.43.21 2.48.1 2.74.65.71 1.03 1.62 1.03 2.72 0 3.91-2.35 4.77-4.59 5.02.36.32.69.93.69 1.88v2.78c0 .27.18.59.69.48A10 10 0 0 0 12 2Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="oauth-logo">
      <path fill="currentColor" d="M20.32 4.37A17.28 17.28 0 0 0 16.2 3a12.33 12.33 0 0 0-.53 1.1c-2.45-.37-4.9-.37-7.31 0-.18-.37-.36-.74-.54-1.1a17.7 17.7 0 0 0-4.14 1.39C1.05 8.33.4 12.16.74 15.94a17.9 17.9 0 0 0 5.08 2.56c.42-.58.8-1.19 1.13-1.82-.6-.23-1.18-.5-1.73-.82.14-.1.27-.2.4-.31 3.33 1.55 6.93 1.55 10.22 0 .13.1.26.21.4.31-.55.32-1.13.59-1.73.82.34.63.72 1.24 1.13 1.82a17.8 17.8 0 0 0 5.1-2.56c.39-4.37-.67-8.16-2.42-11.57ZM8.02 13.6c-1 0-1.83-.95-1.83-2.1s.81-2.1 1.83-2.1c1.03 0 1.85.95 1.83 2.1 0 1.16-.8 2.1-1.83 2.1Zm7.96 0c-1 0-1.83-.95-1.83-2.1s.81-2.1 1.83-2.1c1.03 0 1.85.95 1.83 2.1 0 1.16-.8 2.1-1.83 2.1Z" />
    </svg>
  );
}

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [showRegisterEmailForm, setShowRegisterEmailForm] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [oauthLoadingProvider, setOauthLoadingProvider] = useState<OAuthProvider | null>(null);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const goToNextPage = (): void => {
    window.location.href = "/profile";
  };

  useEffect(() => {
    async function checkSession() {
      if (window.location.hash.includes("type=recovery")) return;
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        goToNextPage();
      }
    }

    checkSession();
  }, []);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setMode("login");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.name;
    const value = e.target.value;
    setErrorMessage("");
    setSuccessMessage("");

    setForm((prevForm) => {
      const updatedForm = {
        ...prevForm,
      };

      updatedForm[name as keyof FormState] = value;
      return updatedForm;
    });
  }

  async function ensureProfileExists(
    userId: string,
    metadata?: { firstname?: string; lastname?: string },
    fallback?: { firstname?: string; lastname?: string },
  ): Promise<string | null> {
    const { error: insertError } = await supabase.from("profiles").insert({
      id: userId,
      firstname: fallback?.firstname ?? metadata?.firstname ?? null,
      lastname: fallback?.lastname ?? metadata?.lastname ?? null,
    });

    if (insertError?.code === "23505") {
      return null;
    }

    return insertError?.message ?? null;
  }

  async function registerUser(): Promise<void> {
    if (isSubmitting) {
      return;
    }

    const { firstname, lastname, email, password, confirmPassword } = form;
    const hasSpecialCharacter = /[^A-Za-z0-9]/.test(password);
    const first = firstname.trim();
    const last = lastname.trim();

    if (!first || !last || !email || !password || !confirmPassword) {
      setErrorMessage("First name, last name, email, and password fields are required.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    if (!hasSpecialCharacter) {
      setErrorMessage("Password must include at least one special character.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            firstname: first,
            lastname: last,
          },
        },
      });

      if (error || !data.user) {
        setErrorMessage(error?.message ?? "Registration failed");
        return;
      }

      setErrorMessage("");

      if (data.session) {
        const profileError = await ensureProfileExists(
          data.user.id,
          data.user.user_metadata as
            | { firstname?: string; lastname?: string }
            | undefined,
          {
            firstname: first,
            lastname: last,
          },
        );

        if (profileError) {
          setErrorMessage(profileError);
          return;
        }

        goToNextPage();
        return;
      }

      setMode("login");
      setForm({
        ...initialForm,
        loginEmail: email,
      });
      setSuccessMessage("Check your email to verify your account, then log in.");
    } finally {
      setIsSubmitting(false);
    }

  }

  async function loginUser(): Promise<void> {
    if (isSubmitting) {
      return;
    }

    const email = form.loginEmail.trim();
    const password = form.loginPassword;

    if (!email || !password) {
      setErrorMessage("Please enter all fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("LOGIN ERROR:", error);
        setErrorMessage(error.message);
        return;
      }

      if (!authData.user) {
        setErrorMessage("Login failed.");
        return;
      }

      const profileError = await ensureProfileExists(
        authData.user.id,
        authData.user.user_metadata as
          | { firstname?: string; lastname?: string }
          | undefined,
      );
      if (profileError) {
        setErrorMessage(profileError);
        return;
      }

      setErrorMessage("");
      setSuccessMessage("");
      goToNextPage();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function forgotPassword(): Promise<void> {
    if (isSubmitting) {
      return;
    }

    const email = form.loginEmail.trim();

    if (!email) {
      setErrorMessage("Enter your email, then click 'Forgot your password?'");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setErrorMessage("");
      setSuccessMessage("If email exists, a password reset link has been sent.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function signInWithProvider(provider: OAuthProvider): Promise<void> {
    if (isSubmitting || oauthLoadingProvider) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setOauthLoadingProvider(provider);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth`,
        },
      });

      if (error) {
        setErrorMessage(error.message);
      }
    } finally {
      setOauthLoadingProvider(null);
    }
  }

  const providerLabel = (provider: OAuthProvider) => {
    if (provider === "google") return "Google";
    if (provider === "github") return "GitHub";
    return "Discord";
  };

  const oauthButtons = (context: "login" | "register") => (
    <>
      <div className="oauth-divider"><span>{context === "login" ? "or" : "or continue with"}</span></div>
      <div className="oauth-grid">
        {(["google", "github", "discord"] as OAuthProvider[]).map((provider) => (
          <button
            key={provider}
            type="button"
            className="oauth-btn"
            onClick={() => signInWithProvider(provider)}
            disabled={isSubmitting || !!oauthLoadingProvider}
          >
            <OAuthIcon provider={provider} />
            {oauthLoadingProvider === provider ? "Connecting..." : `${context === "login" ? "Log in with" : "Continue with"} ${providerLabel(provider)}`}
          </button>
        ))}
      </div>
    </>
  );

  return (
    <>
      <div className="page">
        <div className="auth-card">
          <div className="auth-brand">
            <Image src="/images/logo.png" alt="11Planner" width={170} height={85} className="auth-logo" priority />
          </div>

          <div className="mode-switch" role="tablist" aria-label="Authentication mode">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "login"}
              className={`mode-btn ${mode === "login" ? "active" : ""}`}
              onClick={() => {
                setMode("login");
                setShowRegisterEmailForm(false);
                setErrorMessage("");
                setSuccessMessage("");
              }}
            >
              Log in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "register"}
              className={`mode-btn ${mode === "register" ? "active" : ""}`}
              onClick={() => {
                setMode("register");
                setShowRegisterEmailForm(false);
                setErrorMessage("");
                setSuccessMessage("");
              }}
            >
              Register
            </button>
          </div>

          <h2 className="auth-heading">{mode === "login" ? "Log in to your account" : "Create your 11Planner account"}</h2>

          {errorMessage && (
            <div className="error-card" role="alert">
              <div className="error-title">Please fix the following:</div>
              <div className="error-text">{errorMessage}</div>
            </div>
          )}
          {successMessage && (
            <div className="success-card" role="status">
              <div className="success-text">{successMessage}</div>
            </div>
          )}

          {mode === "login" ? (
            <>

              <input
                type="email"
                name="loginEmail"
                placeholder="Email"
                value={form.loginEmail}
                onChange={handleInputChange}
              />

              <div className="password-field">
                <input
                  type={showLoginPassword ? "text" : "password"}
                  name="loginPassword"
                  placeholder="Password"
                  value={form.loginPassword}
                  onChange={handleInputChange}
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowLoginPassword((prev) => !prev)}
                >
                  {showLoginPassword ? "Hide" : "Show"}
                </button>
              </div>

              <div className="login-meta-row">
                <label className="remember-label">
                  <input type="checkbox" />
                  Remember me
                </label>
                <button type="button" className="forgot-password-btn" onClick={forgotPassword} disabled={isSubmitting || !!oauthLoadingProvider}>
                  Forgot password?
                </button>
              </div>

              <button className="btn" onClick={loginUser} disabled={isSubmitting || !!oauthLoadingProvider}>
                {isSubmitting ? "Logging in..." : "Log in"}
              </button>

              {oauthButtons("login")}

              <div className="auth-footer">
                <span>Don’t have an account?</span>
                <button
                  className="link-btn"
                  onClick={() => {
                    setMode("register");
                    setForm(initialForm);
                    setErrorMessage("");
                    setSuccessMessage("");
                  }}
                >
                  Register
                </button>
              </div>
            </>
          ) : (
            <>
              {!showRegisterEmailForm ? (
                <>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setShowRegisterEmailForm(true)}
                    disabled={isSubmitting || !!oauthLoadingProvider}
                  >
                    Continue with Email
                  </button>
                  {oauthButtons("register")}
                </>
              ) : (
                <>
                  <input
                    type="text"
                    name="firstname"
                    placeholder="First Name (required)"
                    value={form.firstname}
                    onChange={handleInputChange}
                  />

                  <input
                    type="text"
                    name="lastname"
                    placeholder="Last Name (required)"
                    value={form.lastname}
                    onChange={handleInputChange}
                  />

                  <input
                    type="email"
                    name="email"
                    placeholder="Email (required)"
                    value={form.email}
                    onChange={handleInputChange}
                  />

                  <div className="password-field">
                    <input
                      type={showRegisterPassword ? "text" : "password"}
                      name="password"
                      placeholder="Password (required)"
                      value={form.password}
                      minLength={6}
                      onChange={handleInputChange}
                    />
                    <button
                      type="button"
                      className="toggle-password-btn"
                      onClick={() => setShowRegisterPassword((prev) => !prev)}
                    >
                      {showRegisterPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <p className="field-hint">Password must be at least 6 characters and include 1 special character.</p>

                  <div className="password-field">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="Confirm Password (required)"
                      value={form.confirmPassword}
                      onChange={handleInputChange}
                    />
                    <button
                      type="button"
                      className="toggle-password-btn"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                    >
                      {showConfirmPassword ? "Hide" : "Show"}
                    </button>
                  </div>

                  <button className="btn" onClick={registerUser} disabled={isSubmitting || !!oauthLoadingProvider}>
                    {isSubmitting ? "Creating account..." : "Create Account"}
                  </button>

                  <button type="button" className="secondary-btn" onClick={() => setShowRegisterEmailForm(false)}>
                    Back to social options
                  </button>
                </>
              )}

              <div className="auth-footer">
                <span>Already have an account?</span>
                <button
                  className="link-btn"
                  onClick={() => {
                    setMode("login");
                    setForm(initialForm);
                    setErrorMessage("");
                    setSuccessMessage("");
                  }}
                >
                  Log in
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
