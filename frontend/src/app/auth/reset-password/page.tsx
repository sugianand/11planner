"use client";

// Disable static prerendering for this page (requires browser APIs)
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    // Check if user is in recovery mode (from email link)
    async function checkSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setSessionReady(true);
        } else {
          setErrorMessage("Invalid or expired recovery link. Please request a new password reset.");
        }
      } catch (err) {
        console.error("Session check error:", err);
        setErrorMessage("Could not verify session.");
      }
    }
    checkSession();
  }, []);

  async function updatePassword(): Promise<void> {
    const hasSpecialCharacter = /[^A-Za-z0-9]/.test(password);

    if (!password || !confirmPassword) {
      setErrorMessage("Please fill out both password fields.");
      setSuccessMessage("");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      setSuccessMessage("");
      return;
    }

    if (!hasSpecialCharacter) {
      setErrorMessage("Password must include at least one special character.");
      setSuccessMessage("");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      setSuccessMessage("");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
      setSuccessMessage("");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("Password updated successfully. You can now log in.");
  }

  return (
    <div className="page">
      <div className="auth-card">
        <div className="auth-title">Reset Password</div>
        <h2>Create a new password</h2>

        {!sessionReady && errorMessage && (
          <div className="error-card" role="alert">
            <div className="error-title">Unable to Reset Password</div>
            <div className="error-text">{errorMessage}</div>
          </div>
        )}

        {sessionReady && (
          <>
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

            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="New Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMessage("");
                }}
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <p className="field-hint">Password must be at least 6 characters and include 1 special character.</p>

            <div className="password-field">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setErrorMessage("");
                }}
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>

            <button className="btn" onClick={updatePassword} disabled={submitting}>
              {submitting ? "Updating" : "Update Password"}
            </button>
          </>
        )}

        <div className="auth-footer">
          <Link className="link-btn" href="/auth">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
