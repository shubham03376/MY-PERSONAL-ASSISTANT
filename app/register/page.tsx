"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  UserCheck,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Check,
  X,
  ShieldCheck,
} from "lucide-react";
import { validatePassword, validateEmail, validateVaultId } from "@/lib/password-validator";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const pwdValidation = validatePassword(password);
  const hasMinLength = pwdValidation.hasMinLength;
  const hasLetters = pwdValidation.hasLetters;
  const hasNumbers = pwdValidation.hasNumbers;
  const hasSpecialChar = pwdValidation.hasSpecialChar;
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    const emailCheck = validateEmail(email);
    if (!emailCheck.isValid) {
      setError(emailCheck.error || "Please provide a valid email address.");
      return;
    }

    const vaultIdCheck = validateVaultId(username);
    if (!vaultIdCheck.isValid) {
      setError(vaultIdCheck.error || "Please choose a valid Vault ID.");
      return;
    }

    const pwdCheck = validatePassword(password);
    if (!pwdCheck.isValid) {
      setError(
        pwdCheck.error ||
          "Password must be at least 8 characters long and contain letters, numbers, and special characters (!@#$%^&* etc.)."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Account creation failed. Please try again.");
        setLoading(false);
        return;
      }

      setSuccessMsg(
        data.message ||
          `Account registered successfully! Your email (${email.trim()}) is linked to Vault ID "${username.trim()}".`
      );

      // Auto redirect to vault dashboard
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1500);
    } catch {
      setError("Network error. Could not connect to the registration server.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-white selection:bg-emerald-500 selection:text-white">
      {/* Background neon green glow effects matching the logo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-teal-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md rounded-3xl border border-slate-800/80 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl">
        {/* Brand Logo */}
        <div className="flex flex-col items-center text-center">
          <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-2 border-emerald-500/40 bg-black shadow-lg shadow-emerald-500/25">
            <img
              src="/logo.jpg"
              alt="My Private Assistant Logo"
              className="h-full w-full object-cover"
            />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Create Account
          </h1>
          <p className="mt-1 text-sm text-emerald-400 font-medium">
            Register your email & unlock your isolated private vault
          </p>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="mt-6 flex flex-col items-center gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 shrink-0" />
            <div>
              <p className="text-sm font-bold text-white">Email Registered Successfully!</p>
              <p className="mt-1 text-xs text-emerald-300">{successMsg}</p>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
              Redirecting to your private vault...
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mt-6 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-sm text-red-400">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
            <p>{error}</p>
          </div>
        )}

        {/* Registration Form */}
        {!successMsg && (
          <form onSubmit={handleRegister} className="mt-6 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Your Email ID
                </label>
                <span className="text-[10px] text-emerald-400 font-mono">1 Email = 1 Account</span>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email (e.g. name@example.com)"
                  required
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Choose Your Unique Vault ID
                </label>
                <span className="text-[10px] text-slate-400 font-mono">Must be unique</span>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <UserCheck className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your unique ID (e.g. rahul@1800)"
                  required
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Create Master Password
                </label>
                <span className="text-[10px] text-slate-400 font-mono">Min 8 chars</span>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <KeyRound className="h-5 w-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="8+ chars with letters, numbers & symbols"
                  required
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-3 pl-11 pr-11 text-sm text-white placeholder-slate-500 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Password Requirements Live Checklist */}
              {password.length > 0 && (
                <div className="mt-2.5 rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 space-y-1.5 text-xs">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Password Requirements:
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    <span
                      className={`flex items-center gap-1.5 ${
                        hasMinLength ? "text-emerald-400 font-medium" : "text-slate-500"
                      }`}
                    >
                      {hasMinLength ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-600 inline-block ml-1 mr-1" />
                      )}
                      8+ Characters
                    </span>
                    <span
                      className={`flex items-center gap-1.5 ${
                        hasLetters ? "text-emerald-400 font-medium" : "text-slate-500"
                      }`}
                    >
                      {hasLetters ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-600 inline-block ml-1 mr-1" />
                      )}
                      Letters (A-Z, a-z)
                    </span>
                    <span
                      className={`flex items-center gap-1.5 ${
                        hasNumbers ? "text-emerald-400 font-medium" : "text-slate-500"
                      }`}
                    >
                      {hasNumbers ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-600 inline-block ml-1 mr-1" />
                      )}
                      Numbers (0-9)
                    </span>
                    <span
                      className={`flex items-center gap-1.5 ${
                        hasSpecialChar ? "text-emerald-400 font-medium" : "text-slate-500"
                      }`}
                    >
                      {hasSpecialChar ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-600 inline-block ml-1 mr-1" />
                      )}
                      Special (!@#$%^&*)
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Confirm Master Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <KeyRound className="h-5 w-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  required
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {confirmPassword.length > 0 && (
                <p
                  className={`mt-1.5 text-[11px] font-medium flex items-center gap-1 ${
                    passwordsMatch ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {passwordsMatch ? (
                    <>
                      <Check className="h-3 w-3" /> Passwords match
                    </>
                  ) : (
                    <>
                      <X className="h-3 w-3" /> Passwords do not match
                    </>
                  )}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:from-emerald-400 hover:to-teal-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Register Account & Open Vault
                </>
              )}
            </button>
          </form>
        )}

        {/* Back to Login Link */}
        <div className="mt-6 border-t border-slate-800/80 pt-5 text-center">
          <p className="text-xs text-slate-400">Already have an account?</p>
          <Link
            href="/login"
            className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
