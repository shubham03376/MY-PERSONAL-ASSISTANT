"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  UserCheck,
  AlertCircle,
  UserPlus,
  ShieldCheck,
  User,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [error, setError] = useState("");

  // Check URL query parameters on load
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("error") === "admin_required") {
        setError("Developer Administrator access required. Please sign in with the platform owner account.");
        setIsAdminMode(true);
      } else if (params.get("mode") === "admin") {
        setIsAdminMode(true);
      }
    }
  }, []);

  function toggleAdminMode() {
    setIsAdminMode(!isAdminMode);
    setId("");
    setPassword("");
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!id.trim() || !password.trim()) {
      setError("Please enter both your Vault ID / Email and Password.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: id.trim(), password: password.trim(), isAdminMode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Authentication failed. Please verify your credentials.");
        setLoading(false);
        return;
      }

      setLoginSuccess(true);

      // Navigate reliably to dashboard or admin
      if (data.user?.role === "admin" && isAdminMode) {
        window.location.href = "/admin";
      } else {
        window.location.href = "/dashboard";
      }
    } catch {
      setError("Network error. Could not connect to the authentication server.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-white selection:bg-emerald-500 selection:text-white">
      {/* Background glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-3xl transition-colors duration-500 ${
            isAdminMode ? "bg-purple-600/15" : "bg-emerald-500/10"
          }`}
        />
        <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-teal-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md rounded-3xl border border-slate-800/80 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl">
        {/* Entrance Mode Switch (Admin vs Standard User) */}
        <div className="mb-6 flex justify-center">
          <button
            type="button"
            onClick={toggleAdminMode}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold border transition ${
              isAdminMode
                ? "border-purple-500/40 bg-purple-500/20 text-purple-300"
                : "border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white hover:border-slate-700"
            }`}
          >
            {isAdminMode ? (
              <>
                <ShieldCheck className="h-3.5 w-3.5 text-purple-400" />
                Developer Admin Mode • Click to Switch
              </>
            ) : (
              <>
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                Developer / Admin Login? Click Here
              </>
            )}
          </button>
        </div>

        {/* Brand Logo */}
        <div className="flex flex-col items-center text-center">
          <div
            className={`relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-2 bg-black shadow-lg transition duration-500 ${
              isAdminMode
                ? "border-purple-500/60 shadow-purple-500/25"
                : "border-emerald-500/40 shadow-emerald-500/25"
            }`}
          >
            <img
              src="/logo.jpg"
              alt="My Private Assistant Logo"
              className="h-full w-full object-cover"
            />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {isAdminMode ? "Developer Admin" : "Personal Assistant"}
          </h1>
          <p
            className={`mt-1 text-sm font-medium flex items-center gap-1.5 ${
              isAdminMode ? "text-purple-400" : "text-emerald-400"
            }`}
          >
            {isAdminMode
              ? "Developer & Platform Command Center"
              : "Encrypted Personal Data Vault"}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-sm text-red-400">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-400 mt-0.5" />
              <div className="flex-1">
                <p>{error}</p>
                {isAdminMode && error.includes("Standard User Login") && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdminMode(false);
                      setError("");
                    }}
                    className="mt-2 text-xs font-semibold text-emerald-400 underline hover:text-emerald-300"
                  >
                    Click here to switch to Standard User Login →
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {loginSuccess && (
          <div className="mt-6 flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-sm text-emerald-400 animate-pulse">
            <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-400" />
            <p>Access Granted! Unlocking secure session...</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              {isAdminMode ? "Developer Admin ID" : "Vault ID / Username / Email"}
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                <UserCheck className="h-5 w-5" />
              </div>
              <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder={
                  isAdminMode
                    ? "Enter Developer Admin ID (e.g. shubham@1700)"
                    : "Enter your Vault ID or Email"
                }
                autoComplete="username"
                required
                className={`w-full rounded-xl border border-slate-800 bg-slate-950/80 py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 outline-none transition ${
                  isAdminMode
                    ? "focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                    : "focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                }`}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              {isAdminMode ? "Developer Master Password" : "Master Password"}
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                <KeyRound className="h-5 w-5" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                required
                className={`w-full rounded-xl border border-slate-800 bg-slate-950/80 py-3 pl-11 pr-11 text-sm text-white placeholder-slate-500 outline-none transition ${
                  isAdminMode
                    ? "focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                    : "focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-white"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || loginSuccess}
            className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white shadow-lg transition focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              isAdminMode
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 shadow-purple-500/25 hover:from-purple-500 hover:to-indigo-500 focus:ring-purple-500/40"
                : "bg-gradient-to-r from-emerald-500 to-teal-600 shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-500 focus:ring-emerald-500/40"
            }`}
          >
            {loginSuccess ? (
              <>
                <ShieldCheck className="h-5 w-5 text-white animate-bounce" />
                <span>Access Granted... Opening Vault</span>
              </>
            ) : loading ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Verifying Credentials...</span>
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                {isAdminMode ? "Enter Developer Admin Panel" : "Unlock Private Assistant"}
              </>
            )}
          </button>
        </form>

        {/* Regular / Admin Switch or Create Account */}
        {!isAdminMode ? (
          <div className="mt-6 border-t border-slate-800/80 pt-5 text-center">
            <p className="text-xs text-slate-400">
              Want to store your own private data?
            </p>
            <Link
              href="/register"
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 transition"
            >
              <UserPlus className="h-4 w-4" />
              Create Account
            </Link>
          </div>
        ) : (
          <div className="mt-6 border-t border-slate-800/80 pt-5 text-center">
            <p className="text-xs text-slate-400">
              Not a developer?
            </p>
            <button
              onClick={() => setIsAdminMode(false)}
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition"
            >
              <User className="h-4 w-4" />
              Switch to Standard User Login
            </button>
          </div>
        )}

        {/* Footer info */}
        <div className="mt-6 pt-3 text-center border-t border-slate-800/40">
          <p className="text-[11px] text-slate-500">
            End-to-End Private Encryption • Isolated User Vaults
          </p>
        </div>
      </div>
    </div>
  );
}
