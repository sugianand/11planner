import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { AuthChangeEvent } from "@supabase/supabase-js";
import AppDialog from "@/components/AppDialog";

type Mode = "login" | "register" | "forgot-password";

type FormState = {
  loginEmail: string;
  loginPassword: string;
  username: string;
  email: string;
  dob: string;
  password: string;
  confirmPassword: string;
  resetEmail: string;
};

const initialForm: FormState = {
  loginEmail: "",
  loginPassword: "",
  username: "",
  email: "",
  dob: "",
  password: "",
  confirmPassword: "",
  resetEmail: "",
};
// Main auth page that handles login, registration, and password reset by switching modes, with form state management and dialog for feedback
export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [form, setForm] = useState<FormState>(initialForm);
  const [dialog, setDialog] = useState<{ isOpen: boolean; title: string; message: string }>({
    isOpen: false,
    title: "",
    message: "",
  });

  // Sends authenticated users away from auth screens.
  function goToNextPage(): void {
    window.location.href = "frontend/src/app/page.tsx";
  }

  useEffect(() => {
    // Redirects immediately when an active session already exists.
    async function checkSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          goToNextPage();
        }
      } catch (err) {
        console.debug("No active session on auth page:", err);
      }
    }

    checkSession();
  }, []);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session) => {
      if (!session) {
        setMode("login");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Updates the controlled auth form state for any text/date input.
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.name;
    const value = e.target.value;

    setForm((prevForm) => {
      const updatedForm = {
        ...prevForm,
      };

      updatedForm[name as keyof FormState] = value;
      return updatedForm;
    });
  }

  // Creates a new auth account and profile row after validation.
  async function registerUser(): Promise<void> {
    const { username, email, dob, password, confirmPassword } = form;

    if (!username || !email || !dob || !password || !confirmPassword) {
      setDialog({
        isOpen: true,
        title: "Missing required fields",
        message: "Please enter all registration fields.",
      });
      return;
    }

    if (password !== confirmPassword) {
      setDialog({
        isOpen: true,
        title: "Password mismatch",
        message: "Passwords do not match.",
      });
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, dob },
      },
    });

    if (error || !data.user) {
      setDialog({
        isOpen: true,
        title: "Registration failed",
        message: error?.message ?? "Registration failed",
      });
      return;
    }


    await supabase.from("profiles").insert({
      id: data.user.id,
      username, dob
    })

    setDialog({
      isOpen: true,
      title: "Registration successful",
      message: "You can now log in.",
    });
    setMode("login");
    setForm(initialForm);
  }

  // Authenticates an existing user with email and password.
  async function loginUser(): Promise<void> {
    const email = form.loginEmail.trim();
    const password = form.loginPassword;

    if (!email || !password) {
      setDialog({
        isOpen: true,
        title: "Missing required fields",
        message: "Please enter your email and password.",
      });
      return;
    }
// Attempt to sign in with Supabase auth, showing error dialog on failure and routing on success
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !authData.user) {
      setDialog({
        isOpen: true,
        title: "Login failed",
        message: error?.message ?? "Login failed",
      });
      return;
    }

    goToNextPage();
  }

  // Sends the password reset email flow for the entered address.
  async function sendPasswordResetEmail(): Promise<void> {
    const email = form.resetEmail.trim();

    if (!email) {
      setDialog({
        isOpen: true,
        title: "Missing email",
        message: "Please enter your email address.",
      });
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      setDialog({
        isOpen: true,
        title: "Reset link failed",
        message: error.message ?? "Failed to send reset email",
      });
      return;
    }

    setDialog({
      isOpen: true,
      title: "Reset link sent",
      message: "Password reset email sent! Check your inbox for the reset link.",
    });
    setMode("login");
    setForm(initialForm);
  }

  return (
   <div className="auth-shell">
    <div className="page">
      <div className="auth-card">
        <div className="auth-title">Welcome to 11Planner</div>

         {mode === "login" ? "Login" : mode === "forgot-password" ? "Reset Password" : "Register"}


        {mode === "login" ? (
          <>
            <input
              type="email"
              name="loginEmail"
              placeholder="Email"
              value={form.loginEmail}
              onChange={handleInputChange}
            />

            <input
              type="password"
              name="loginPassword"
              placeholder="Password"
              value={form.loginPassword}
              onChange={handleInputChange}
            />

            <button className="btn" onClick={loginUser}>
              Log in
            </button>

            <div className="auth-footer">              <button
                className="link-btn"
                onClick={() => {
                  console.log("Forgot Password clicked");
                  setMode("forgot-password");
                  setForm(initialForm);
                }}
              >
                Forgot Password?
              </button>
            </div>

            <div className="auth-footer">              <span>Don’t have an account?</span>
              <button
                className="link-btn"
                onClick={() => {
                  setMode("register");
                  setForm(initialForm);
                }}
              >
                Register
              </button>
            </div>
          </>
        ) : mode === "forgot-password" ? (
          <>
            <p style={{ fontSize: "14px", marginBottom: "20px" }}>
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>
            <input
              type="email"
              name="resetEmail"
              placeholder="Email"
              value={form.resetEmail}
              onChange={handleInputChange}
            />

            <button className="btn" onClick={sendPasswordResetEmail}>
              Send Reset Link
            </button>
// Back to login link in forgot password mode
            <div className="auth-footer">
              <button
                className="link-btn"
                onClick={() => {
                  setMode("login");
                  setForm(initialForm);
                }}
              >
                Back to Login
              </button>
            </div>
          </>
        ) : (
          <>
            <input 
              type="text"
              name="username"
              placeholder="Username"
              value={form.username}
              onChange={handleInputChange}
            />
// Added date of birth field to registration form
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleInputChange}
            />

            <input
              type="date"
              name="dob"
              value={form.dob}
              onChange={handleInputChange}
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleInputChange}
            />
// Added confirm password field to registration form for validation
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={form.confirmPassword}
              onChange={handleInputChange}
            />

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
                }}
              >
                Log in
              </button>
            </div>
          </>
        )}
      </div>
    </div>
    <AppDialog
      isOpen={dialog.isOpen}
      title={dialog.title}
      message={dialog.message}
      onClose={() => setDialog({ isOpen: false, title: "", message: "" })}
    />
    </div>
  );
}
