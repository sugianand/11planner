"use client";
import React, { useState, useEffect } from "react";
import "./auth.css";
import { supabase } from "@/lib/supabaseClient";

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

  const goToNextPage = (): void => {
    window.location.href = "/profile";
  };

  useEffect(() => {
    async function checkSession() {
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

    setForm((prevForm) => {
      const updatedForm = {
        ...prevForm,
      };

      updatedForm[name as keyof FormState] = value;
      return updatedForm;
    });
  }
  async function registerUser(): Promise<void> {
    const { firstname, lastname, email, password, confirmPassword, university, major } = form;
    const hasSpecialCharacter = /[^A-Za-z0-9]/.test(password);

    if (!email || !password || !confirmPassword) {
      setErrorMessage("Please enter all required fields.");
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
    });

    if (error || !data.user) {
      setErrorMessage(error?.message ?? "Registration failed");
      return;
    }


    const { error: profileError } = await supabase.from("profiles").insert({
      id: data.user.id,
      firstname: firstname || null,
      lastname: lastname || null,
      university: university || null,
      major: major || null,
    });

    if (profileError) {
      setErrorMessage(profileError.message);
      return;
    }


    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setErrorMessage(signInError.message);
      return;
    }

    setErrorMessage("");
    goToNextPage();

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

    setErrorMessage("");
    goToNextPage();
  }

  return (
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
                  setErrorMessage("");
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
              placeholder="First Name"
              value={form.firstname}
              onChange={handleInputChange}
            />


            <input
              type="text"
              name="lastname"
              placeholder="Last Name"
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


            <input
              type="password"
              name="password"
              placeholder="Password (required)"
              value={form.password}
              minLength={6}
              onChange={handleInputChange}
            />
            <p className="field-hint">Password must be at least 6 characters and include 1 special character.</p>

            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password (required)"
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
                  setErrorMessage("");
                }}
              >
                Log in
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
