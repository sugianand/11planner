"use client";
import React, { useState, useEffect } from "react";
import "./auth.css";
import { supabase } from "@/lib/supabaseClient";
import Footer from "@/components/Footer";
import Image from "next/image";

type Mode = "login" | "register";
type OAuthProvider = "google";

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

function OAuthIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="oauth-logo google-logo">
      <path d="M12 11v3.5h5.9c-.25 1.5-1.8 4.4-5.9 4.4-3.55 0-6.45-2.95-6.45-6.6s2.9-6.6 6.45-6.6c2.03 0 3.4.86 4.18 1.6l2.85-2.75C17.2 2.85 14.87 2 12 2 6.95 2 2.86 6.18 2.86 11.3S6.95 20.6 12 20.6c6.93 0 9.14-4.86 9.14-7.35 0-.5-.05-.87-.12-1.25H12z" />
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
    window.location.href = "/dashboard";
  };

  const goToQuizOnboarding = (): void => {
    window.location.href = "/profile/quiz?onboarding=1";
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

        goToQuizOnboarding();
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
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
        },
      });

      if (error) {
        setErrorMessage(error.message);
      }
    } finally {
      setOauthLoadingProvider(null);
    }
  }

  const oauthButtons = (context: "login" | "register") => (
    <>
      <div className="oauth-divider"><span>{context === "login" ? "or" : "or continue with"}</span></div>
      <div className="oauth-grid">
        <button
          type="button"
          className="oauth-btn"
          onClick={() => signInWithProvider("google")}
          disabled={isSubmitting || !!oauthLoadingProvider}
        >
          <OAuthIcon />
          {oauthLoadingProvider === "google" ? "Connecting..." : `${context === "login" ? "Log in with" : "Continue with"} Google`}
        </button>
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
                    Back
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
