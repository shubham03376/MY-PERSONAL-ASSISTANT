"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  ArrowLeft,
  Lock,
  Database,
  Save,
  LogOut,
  ExternalLink,
  Download,
  Upload,
  Trash2,
  History,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

interface UserActivityLog {
  id: string;
  timestamp: string;
  event: string;
  ip: string;
  userAgent: string;
  details?: string;
}

interface SettingsData {
  user?: {
    id: string;
    username: string;
    email: string;
    role?: string;
    isOwner?: boolean;
  };
  stats: {
    documentsCount: number;
    photosCount: number;
    contactsCount: number;
    notesCount: number;
    tasksCount: number;
    totalStorageBytes: number;
  };
  github?: {
    owner: string;
    repo: string;
    hasToken: boolean;
  } | null;
}

export default function SettingsPage() {
  const router = useRouter();
  const [data, setData] = useState<SettingsData | null>(null);

  const isOwner = Boolean(
    data?.user?.isOwner ||
    (data?.user?.role === "admin" && data?.user?.username === "shubham@1700")
  );

  // GitHub form state
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("my-private-assistant-vault");
  const [token, setToken] = useState("");
  const [savingGithub, setSavingGithub] = useState(false);
  const [githubMsg, setGithubMsg] = useState("");

  // Vault backup, restore, purge, and activity logs
  const [userLogs, setUserLogs] = useState<UserActivityLog[]>([]);
  const [restoring, setRestoring] = useState(false);
  const [restoreMsg, setRestoreMsg] = useState("");
  const [purging, setPurging] = useState(false);
  const [purgeMsg, setPurgeMsg] = useState("");

  async function loadActivityLogs() {
    try {
      const res = await fetch("/api/vault/activity");
      const json = await res.json();
      if (json.logs) {
        setUserLogs(json.logs);
      }
    } catch (err) {
      console.error("Failed to load activity logs:", err);
    }
  }

  async function loadSettings() {
    try {
      const res = await fetch("/api/settings");
      const json = await res.json();
      if (json.stats) {
        setData(json);
        if (json.github) {
          setOwner(json.github.owner || "");
          setRepo(json.github.repo || "my-private-assistant-vault");
        }
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    }
  }

  useEffect(() => {
    loadSettings();
    loadActivityLogs();
  }, []);

  async function handleRestoreBackup(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoring(true);
    setRestoreMsg("");

    try {
      const text = await file.text();
      const backupData = JSON.parse(text);

      const res = await fetch("/api/vault/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(backupData),
      });

      const resData = await res.json();
      if (res.ok) {
        setRestoreMsg(resData.message || "Backup restored successfully!");
        await loadSettings();
      } else {
        setRestoreMsg(resData.error || "Failed to restore backup.");
      }
    } catch {
      setRestoreMsg("Invalid JSON backup file or corrupted format.");
    } finally {
      setRestoring(false);
      e.target.value = "";
    }
  }

  async function handlePurgeVault() {
    const prompt1 = confirm(
      "⚠️ WARNING: Are you sure you want to permanently delete all data in your private vault?\n\nThis will physically remove all documents, photos, notes, contacts, and tasks from disk and database. This action CANNOT be undone."
    );
    if (!prompt1) return;

    const userInput = prompt(
      'Type "PERMANENTLY DELETE ALL DATA" to confirm complete vault purge:'
    );
    if (userInput !== "PERMANENTLY DELETE ALL DATA") {
      alert("Purge cancelled. The confirmation string did not match.");
      return;
    }

    setPurging(true);
    setPurgeMsg("");

    try {
      const res = await fetch("/api/vault/purge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: "PERMANENTLY DELETE ALL DATA" }),
      });

      const resData = await res.json();
      if (res.ok) {
        setPurgeMsg("All vault data has been permanently deleted.");
        await loadSettings();
        await loadActivityLogs();
      } else {
        setPurgeMsg(resData.error || "Failed to purge vault data.");
      }
    } catch {
      setPurgeMsg("An error occurred while purging vault.");
    } finally {
      setPurging(false);
    }
  }

  async function handleSaveGithub(e: React.FormEvent) {
    e.preventDefault();
    setSavingGithub(true);
    setGithubMsg("");

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, repo, token }),
      });

      const resData = await res.json();
      if (res.ok) {
        setGithubMsg("GitHub settings saved successfully!");
        setToken("");
        await loadSettings();
      } else {
        setGithubMsg(resData.error || "Failed to save settings.");
      }
    } catch {
      setGithubMsg("Error saving GitHub settings.");
    } finally {
      setSavingGithub(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/login";
    }
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  return (
    <main className="min-h-screen bg-slate-950 p-4 sm:p-8 text-white">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            ⚙️ Vault Settings & Backup
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            {isOwner
              ? "Manage your credentials, storage, and GitHub repository sync."
              : "Manage your credentials, storage, and encrypted vault backups."}
          </p>
        </div>
      </div>

      <div className="mt-8 max-w-3xl space-y-6">
        {/* 1. VAULT IDENTITY */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 backdrop-blur">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2 text-white">
              <Shield className="h-5 w-5 text-blue-400" />
              Vault Security Status
            </h2>
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400 tracking-wider">
              {isOwner ? "OWNER: SHUBHAM" : "PRIVATE VAULT"}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-slate-950/60 p-4 border border-slate-800">
              <span className="text-xs text-slate-400 uppercase font-semibold">
                {isOwner ? "Vault Owner" : "Account Type"}
              </span>
              <p className="mt-1 text-base font-bold text-emerald-400 tracking-wide">
                {isOwner ? "SHUBHAM" : "Private Vault"}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-950/60 p-4 border border-slate-800">
              <span className="text-xs text-slate-400 uppercase font-semibold">
                {isOwner ? "Vault ID" : "Your Vault ID"}
              </span>
              <p className="mt-1 text-base font-mono font-bold text-blue-400 truncate">
                {data?.user?.username || data?.user?.email || "Personal Vault"}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-950/60 p-4 border border-slate-800">
              <span className="text-xs text-slate-400 uppercase font-semibold">Session Protection</span>
              <p className="mt-1 text-base font-semibold text-emerald-400 flex items-center gap-1.5">
                <Lock className="h-4 w-4" /> Active & Encrypted
              </p>
            </div>
          </div>
        </div>

        {/* 2. GITHUB BACKUP & STORAGE (OWNER ONLY) */}
        {isOwner && data?.github && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 backdrop-blur">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2 text-white">
                <svg className="h-5 w-5 fill-purple-400" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                GitHub Cloud Repository Backup
              </h2>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-400">
                Owner: SHUBHAM
              </span>
            </div>

            <p className="mt-2 text-xs text-slate-400">
              Automatically backup your files and data to your GitHub account repository.
            </p>

            <form onSubmit={handleSaveGithub} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    GitHub Username / Owner
                  </label>
                  <input
                    type="text"
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    placeholder="Enter private GitHub username"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Repository Name
                  </label>
                  <input
                    type="text"
                    value={repo}
                    onChange={(e) => setRepo(e.target.value)}
                    placeholder="my-private-assistant-vault"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3.5 text-sm text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  GitHub Personal Access Token (PAT)
                </label>
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder={
                    data?.github?.hasToken
                      ? "•••••••••••• (Token is currently configured)"
                      : "Paste your GitHub token with repo access"
                  }
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3.5 text-sm text-white outline-none focus:border-blue-500"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Create a token at{" "}
                  <a
                    href="https://github.com/settings/tokens"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    github.com/settings/tokens
                  </a>{" "}
                  with <code className="text-slate-300">repo</code> permissions.
                </p>
              </div>

              {githubMsg && (
                <p className="text-xs font-medium text-emerald-400">{githubMsg}</p>
              )}

              <button
                type="submit"
                disabled={savingGithub}
                className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-50 transition"
              >
                {savingGithub ? "Saving..." : <><Save className="h-4 w-4" /> Save GitHub Settings</>}
              </button>
            </form>
          </div>
        )}

        {/* 3. STORAGE STATS */}
        {data && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 backdrop-blur">
            <h2 className="text-lg font-bold flex items-center gap-2 text-white">
              <Database className="h-5 w-5 text-cyan-400" />
              Vault Storage Statistics
            </h2>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="rounded-2xl bg-slate-950/60 p-4 border border-slate-800">
                <span className="text-xs text-slate-400">Total Documents</span>
                <p className="mt-1 text-xl font-bold text-white">{data.stats.documentsCount}</p>
              </div>
              <div className="rounded-2xl bg-slate-950/60 p-4 border border-slate-800">
                <span className="text-xs text-slate-400">Total Photos</span>
                <p className="mt-1 text-xl font-bold text-white">{data.stats.photosCount}</p>
              </div>
              <div className="rounded-2xl bg-slate-950/60 p-4 border border-slate-800">
                <span className="text-xs text-slate-400">Total Contacts</span>
                <p className="mt-1 text-xl font-bold text-white">{data.stats.contactsCount}</p>
              </div>
              <div className="rounded-2xl bg-slate-950/60 p-4 border border-slate-800">
                <span className="text-xs text-slate-400">Total Notes</span>
                <p className="mt-1 text-xl font-bold text-white">{data.stats.notesCount}</p>
              </div>
              <div className="rounded-2xl bg-slate-950/60 p-4 border border-slate-800">
                <span className="text-xs text-slate-400">Total Tasks</span>
                <p className="mt-1 text-xl font-bold text-white">{data.stats.tasksCount}</p>
              </div>
              <div className="rounded-2xl bg-slate-950/60 p-4 border border-slate-800">
                <span className="text-xs text-slate-400">Storage Used</span>
                <p className="mt-1 text-xl font-bold text-blue-400">
                  {formatSize(data.stats.totalStorageBytes)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 4. ONE-CLICK LOCAL BACKUP & RESTORE */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 backdrop-blur">
          <h2 className="text-lg font-bold flex items-center gap-2 text-white">
            <Download className="h-5 w-5 text-emerald-400" />
            Local Encrypted Vault Backup & Restore
          </h2>
          <p className="mt-1.5 text-xs text-slate-400">
            Export an offline encrypted JSON backup of your entire vault (contacts, notes, tasks, documents & photos metadata) or restore from an earlier backup file.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-4">
            <a
              href="/api/vault/backup"
              download
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 transition shadow-md shadow-emerald-600/20"
            >
              <Download className="h-4 w-4" />
              Download Vault Backup (JSON)
            </a>

            <a
              href="/MyPrivateAssistant.zip"
              download="MyPrivateAssistant.zip"
              className="inline-flex items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-2.5 text-xs font-semibold text-purple-300 hover:bg-purple-500/20 transition shadow-sm"
              title="Download full project source code as a ZIP archive"
            >
              <Download className="h-4 w-4 text-purple-400" />
              Download Website Code (.ZIP)
            </a>

            <label className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 cursor-pointer transition">
              <Upload className="h-4 w-4 text-blue-400" />
              {restoring ? "Restoring..." : "Restore Vault from Backup"}
              <input
                type="file"
                accept=".json"
                onChange={handleRestoreBackup}
                disabled={restoring}
                className="hidden"
              />
            </label>
          </div>

          {restoreMsg && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <p>{restoreMsg}</p>
            </div>
          )}
        </div>

        {/* 5. PERSONAL SECURITY & RECENT LOGIN HISTORY */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 backdrop-blur">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2 text-white">
              <History className="h-5 w-5 text-purple-400" />
              Personal Security & Login Activity
            </h2>
            <button
              onClick={loadActivityLogs}
              className="text-xs text-slate-400 hover:text-white transition flex items-center gap-1"
            >
              Refresh
            </button>
          </div>
          <p className="mt-1.5 text-xs text-slate-400">
            Recent authentication events and sessions detected on your private vault account.
          </p>

          <div className="mt-4 space-y-2 max-h-60 overflow-y-auto pr-1">
            {userLogs.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">No recent security events recorded.</p>
            ) : (
              userLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between rounded-xl bg-slate-950/60 border border-slate-800/80 p-3 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        log.event === "LOGIN_SUCCESS" || log.event === "ADMIN_LOGIN"
                          ? "bg-emerald-400"
                          : log.event === "USER_REGISTERED"
                          ? "bg-blue-400"
                          : "bg-red-400"
                      }`}
                    />
                    <div>
                      <p className="font-semibold text-white">
                        {log.event.replace(/_/g, " ")}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        IP: {log.ip} • {log.userAgent.slice(0, 45)}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 6. DANGER ZONE: PERMANENT VAULT PURGE */}
        <div className="rounded-3xl border border-red-500/30 bg-red-950/10 p-6 backdrop-blur">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-red-400 text-base">Permanent Vault Data Purge</h3>
              <p className="mt-1 text-xs text-slate-400">
                Permanently deletes all your documents, photos, notes, contacts, and tasks from disk storage and database. This action is irreversible.
              </p>

              {purgeMsg && (
                <div className="mt-3 rounded-xl bg-red-500/20 border border-red-500/30 p-2.5 text-xs text-red-300">
                  {purgeMsg}
                </div>
              )}

              <div className="mt-4">
                <button
                  type="button"
                  onClick={handlePurgeVault}
                  disabled={purging}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600/20 border border-red-500/40 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-600 hover:text-white transition disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  {purging ? "Purging Vault..." : "Purge All Data Permanently"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 7. LOCK VAULT / LOGOUT */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 backdrop-blur flex items-center justify-between">
          <div>
            <h3 className="font-bold text-red-400">Lock Personal Assistant</h3>
            <p className="text-xs text-slate-400">
              End your session and require entering your ID and password again.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-500 transition shadow-lg shadow-red-500/20"
          >
            <LogOut className="h-4 w-4" />
            Lock Vault
          </button>
        </div>
      </div>
    </main>
  );
}