"use client";
import React, { useState, useEffect } from "react";
import "./auth.css";
import { supabase } from "@/lib/supabaseClient";
import Footer from "@/components/Footer";

type Mode = "login" | "register";

type FormState = {
  firstname: string;
  lastname: string;
  loginEmail: string;
  loginPassword: string;
  email: string;
  university: string;
  major: string;
  password: string;
  confirmPassword: string;
};

const initialForm: FormState = {
  firstname: "",
  lastname: "",
  loginEmail: "",
  loginPassword: "",
  email: "",
  university: "",
  major: "",
  password: "",
  confirmPassword: "",
};

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [form, setForm] = useState<FormState>(initialForm);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
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
    metadata?: { firstname?: string; lastname?: string; university?: string; major?: string },
    fallback?: { firstname?: string; lastname?: string; university?: string; major?: string },
  ): Promise<string | null> {
    const { error: insertError } = await supabase.from("profiles").insert({
      id: userId,
      firstname: fallback?.firstname ?? metadata?.firstname ?? null,
      lastname: fallback?.lastname ?? metadata?.lastname ?? null,
      university: fallback?.university ?? metadata?.university ?? null,
      major: fallback?.major ?? metadata?.major ?? null,
    });

    if (insertError?.code === "23505") {
      return null;
    }

    return insertError?.message ?? null;
  }

  async function registerUser(): Promise<void> {
    const { firstname, lastname, email, password, confirmPassword, university, major } = form;
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

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          firstname: first,
          lastname: last,
          university: university || null,
          major: major || null,
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
          | { firstname?: string; lastname?: string; university?: string; major?: string }
          | undefined,
        {
          firstname: first,
          lastname: last,
          university,
          major,
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

  }

  async function loginUser(): Promise<void> {
    const email = form.loginEmail.trim();
    const password = form.loginPassword;

    if (!email || !password) {
      setErrorMessage("Please enter all fields.");
      return;
    }

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
        | { firstname?: string; lastname?: string; university?: string; major?: string }
        | undefined,
    );
    if (profileError) {
      setErrorMessage(profileError);
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    goToNextPage();
  }

  async function forgotPassword(): Promise<void> {
    const email = form.loginEmail.trim();

    if (!email) {
      setErrorMessage("Enter your email, then click 'Forgot your password?'");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setErrorMessage("");
    setSuccessMessage("If email exists, a password reset link has been sent.");
  }

  return (
    <>
      <div className="page">
        <div className="auth-card">
          <div className="auth-title">Welcome to 11Planner</div>

          <h2>{mode === "login" ? "Login" : "Register"}</h2>

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
              <button type="button" className="forgot-password-btn" onClick={forgotPassword}>
                Forgot your password?
              </button>

              <button className="btn" onClick={loginUser}>
                Log in
              </button>

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


              <input
                type="text"
                name="university"
                placeholder="University"
                value={form.university}
                onChange={handleInputChange}
              />

              <input
                type="text"
                name="major"
                placeholder="Major"
                value={form.major}
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

              <button className="btn" onClick={registerUser}>
                Register
              </button>

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
