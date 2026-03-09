import React, { useState, useEffect } from "react";
import "./auth.css";
import { supabase } from "@/lib/supabaseClient";

type Mode = "login" | "register";

type FormState = {
  loginEmail: string;
  loginPassword: string;
  username: string;
  email: string;
  dob: string;
  password: string;
  confirmPassword: string;
};

const initialForm: FormState = {
  loginEmail: "",
  loginPassword: "",
  username: "",
  email: "",
  dob: "",
  password: "",
  confirmPassword: "",
};

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [form, setForm] = useState<FormState>(initialForm);

  function goToNextPage(): void {
    window.location.href = "/";
  }

  useEffect(() => {
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

    setForm((prevForm) => {
      const updatedForm = {
        ...prevForm,
      };

      updatedForm[name as keyof FormState] = value;
      return updatedForm;
    });
  }
  async function registerUser(): Promise<void> {
    const { username, email, dob, password, confirmPassword } = form;

    if (!username || !email || !dob || !password || !confirmPassword) {
      alert("Please enter all fields.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
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
      alert(error?.message ?? "Registration failed");
      return;
    }


    await supabase.from("profiles").insert({
      id: data.user.id,
      username, dob
    })

    alert("Registration successful! You can now log in.");
    setMode("login");
    setForm(initialForm);
  }

  async function loginUser(): Promise<void> {
    const email = form.loginEmail.trim();
    const password = form.loginPassword;

    if (!email || !password) {
      alert("Please enter all fields.");
      return;
    }

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !authData.user) {
      alert(error?.message ?? "Login failed");
      return;
    }

    goToNextPage();
  }

  return (
   <div className="auth-shell">
    <div className="page">
      <div className="auth-card">
        <div className="auth-title">Welcome to 11Planner</div>

         {mode === "login" ? "Login" : "Register"}


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

            <div className="auth-footer">
              <span>Don’t have an account?</span>
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
        ) : (
          <>
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={form.username}
              onChange={handleInputChange}
            />

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
    </div>
  );
}
