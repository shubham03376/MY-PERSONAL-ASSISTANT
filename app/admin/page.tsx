"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  Users,
  KeyRound,
  Lock,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  LogOut,
  AlertCircle,
  Key,
  Download,
} from "lucide-react";
import { validatePassword } from "@/lib/password-validator";

interface AdminData {
  metrics: {
    totalUsers: number;
    totalLogins: number;
    failedAttempts: number;
    adminUser: string;
  };
  users: Array<{
    id: string;
    email: string;
    username: string;
    role: string;
    createdAt: string;
  }>;
  logs: Array<{
    id: string;
    timestamp: string;
    event: string;
    identifier: string;
    ip: string;
    userAgent: string;
    details?: string;
  }>;
}

export default function AdminPage() {
  const router = useRouter();
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"logs" | "users" | "password">("logs");
  const [searchLog, setSearchLog] = useState("");

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [changingPw, setChangingPw] = useState(false);

  async function loadAdminData() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/overview");
      if (res.status === 403 || res.status === 401) {
        router.push("/login?error=admin_required");
        return;
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdminData();
  }, []);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);

    if (newPassword !== confirmPassword) {
      setPwMsg({ type: "error", text: "New passwords do not match." });
      return;
    }

    const pwdCheck = validatePassword(newPassword);
    if (!pwdCheck.isValid) {
      setPwMsg({
        type: "error",
        text:
          pwdCheck.error ||
          "New password must be at least 8 characters long and contain letters, numbers, and special characters (!@#$%^&*).",
      });
      return;
    }

    setChangingPw(true);

    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const resData = await res.json();

      if (res.ok) {
        setPwMsg({ type: "success", text: "Admin master password updated successfully!" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        await loadAdminData();
      } else {
        setPwMsg({ type: "error", text: resData.error || "Failed to change password." });
      }
    } catch {
      setPwMsg({ type: "error", text: "Network error occurred." });
    } finally {
      setChangingPw(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/login";
    }
  }

  const filteredLogs = data?.logs.filter((log) => {
    const q = searchLog.toLowerCase();
    return (
      log.identifier.toLowerCase().includes(q) ||
      log.event.toLowerCase().includes(q) ||
      log.ip.toLowerCase().includes(q) ||
      (log.details && log.details.toLowerCase().includes(q))
    );
  });

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <p className="text-xs text-slate-400 font-mono">Loading Developer Command Center...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 p-4 sm:p-8 text-white selection:bg-emerald-500 selection:text-white">
      {/* Header with Brand Logo */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border-2 border-emerald-500/40 bg-black shadow-lg shadow-emerald-500/20">
            <img
              src="/logo.jpg"
              alt="Logo"
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                Developer Admin Panel
              </h1>
              <span className="rounded-md bg-purple-500/20 border border-purple-500/30 px-2 py-0.5 text-[10px] font-bold text-purple-300 uppercase">
                Developer Mode
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Platform Owner: <span className="text-emerald-400 font-semibold">SHUBHAM</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/MyPrivateAssistant.zip"
            download="MyPrivateAssistant.zip"
            className="flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3.5 py-2 text-xs font-semibold text-purple-300 hover:bg-purple-500/20 transition shadow-sm"
            title="Download full project source code as a ZIP archive"
          >
            <Download className="h-4 w-4 text-purple-400" />
            <span className="hidden sm:inline">Export Code (.ZIP)</span>
          </a>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            My Personal Vault
          </Link>
          <button
            onClick={loadAdminData}
            className="rounded-xl border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Refresh logs"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-xl bg-red-500/10 border border-red-500/20 px-3.5 py-2 text-xs font-semibold text-red-400 hover:bg-red-500 hover:text-white transition"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      {data && (
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Platform Users
            </span>
            <p className="text-3xl font-bold text-white mt-2 flex items-center gap-2">
              <Users className="h-6 w-6 text-blue-400" />
              {data.metrics.totalUsers}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Successful Logins
            </span>
            <p className="text-3xl font-bold text-emerald-400 mt-2 flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              {data.metrics.totalLogins}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Failed Attempts
            </span>
            <p className="text-3xl font-bold text-rose-400 mt-2 flex items-center gap-2">
              <XCircle className="h-6 w-6 text-rose-400" />
              {data.metrics.failedAttempts}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Security Level
            </span>
            <p className="text-xl font-bold text-purple-400 mt-2 flex items-center gap-2">
              <Shield className="h-6 w-6 text-purple-400" />
              Bcrypt Salted
            </p>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="mt-8 flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab("logs")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
            activeTab === "logs"
              ? "bg-emerald-500 text-slate-950 font-bold"
              : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
          }`}
        >
          <Clock className="h-4 w-4" />
          Live Login Activity & Audit Logs
        </button>

        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
            activeTab === "users"
              ? "bg-emerald-500 text-slate-950 font-bold"
              : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
          }`}
        >
          <Users className="h-4 w-4" />
          Registered Users Directory ({data?.users.length || 0})
        </button>

        <button
          onClick={() => setActiveTab("password")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
            activeTab === "password"
              ? "bg-emerald-500 text-slate-950 font-bold"
              : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
          }`}
        >
          <KeyRound className="h-4 w-4" />
          Change Admin Password (Self-Only)
        </button>
      </div>

      {/* TAB 1: LOGIN ACTIVITY & AUDIT LOGS */}
      {activeTab === "logs" && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={searchLog}
                onChange={(e) => setSearchLog(e.target.value)}
                placeholder="Search audit logs by ID, IP, or event..."
                className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
              />
            </div>
            <span className="text-xs text-slate-500">
              Showing {filteredLogs?.length || 0} recorded events
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Status / Event</th>
                  <th className="py-3 px-4">User / Vault ID</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Device / Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredLogs && filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase ${
                            log.event === "ADMIN_LOGIN"
                              ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                              : log.event === "LOGIN_SUCCESS"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : log.event === "LOGIN_FAILED"
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              : log.event === "USER_REGISTERED"
                              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {log.event.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-white">
                        {log.identifier}
                      </td>
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">
                        {log.ip}
                      </td>
                      <td className="py-3 px-4 text-slate-400 truncate max-w-xs" title={log.details || log.userAgent}>
                        {log.details || log.userAgent}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No activity logs recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: REGISTERED USERS DIRECTORY */}
      {activeTab === "users" && (
        <div className="mt-6">
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Vault ID / Username</th>
                  <th className="py-3 px-4">Email ID</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4">Vault Storage Isolation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data?.users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                          u.role === "admin"
                            ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                            : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-white">
                      {u.username}
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-mono">
                      {u.email}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-emerald-400 flex items-center gap-1">
                      <Lock className="h-3 w-3" /> Private Directory Isolated
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CHANGE ADMIN MASTER PASSWORD (SELF-ONLY) */}
      {activeTab === "password" && (
        <div className="mt-6 max-w-lg">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 backdrop-blur">
            <h2 className="text-lg font-bold flex items-center gap-2 text-white">
              <Key className="h-5 w-5 text-emerald-400" />
              Change Developer Admin Password
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              This will update the master password for the platform owner (<span className="text-emerald-400 font-semibold">SHUBHAM</span>). Only you can perform this change.
            </p>

            {pwMsg && (
              <div
                className={`mt-5 flex items-center gap-3 rounded-xl p-3.5 text-xs ${
                  pwMsg.type === "success"
                    ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                    : "border border-red-500/20 bg-red-500/10 text-red-400"
                }`}
              >
                {pwMsg.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                )}
                <p>{pwMsg.text}</p>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Current Master Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  required
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3.5 text-sm text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  New Master Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="8+ chars with letters, numbers & symbols"
                  required
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3.5 text-sm text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3.5 text-sm text-white outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={changingPw}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 transition"
              >
                {changingPw ? "Updating..." : "Update Admin Password"}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
