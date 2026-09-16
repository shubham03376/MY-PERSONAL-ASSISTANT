"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Image as ImageIcon,
  User,
  CheckSquare,
  Bot,
  Settings,
  Lock,
  Search,
  Shield,
  Sparkles,
  ArrowRight,
} from "lucide-react";

interface VaultStats {
  documentsCount: number;
  photosCount: number;
  contactsCount: number;
  notesCount: number;
  tasksCount: number;
  totalStorageBytes: number;
}

interface UserProfile {
  id: string;
  username: string;
  email: string;
  role?: string;
}

export default function Home() {
  const router = useRouter();
  const [stats, setStats] = useState<VaultStats | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (data.stats) setStats(data.stats);
        if (data.user) setUser(data.user);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      }
    }
    fetchDashboardData();
  }, []);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/login";
    }
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/ai-assistant`);
    }
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 sm:p-8 selection:bg-emerald-500 selection:text-white">
      {/* Security Status Header with New Brand Logo */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border-2 border-emerald-500/40 bg-black shadow-lg shadow-emerald-500/20">
            <img
              src="/logo.jpg"
              alt="My Private Assistant Logo"
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              My Private Assistant
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-xs text-slate-400 font-mono">
                Vault ID:{" "}
                <span className="text-emerald-400 font-semibold">
                  {user ? user.username : "Protected Vault"}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user?.role === "admin" && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3.5 py-2 text-xs font-semibold text-purple-300 hover:bg-purple-500/20 transition shadow-sm"
            >
              <Shield className="h-4 w-4 text-purple-400" />
              Admin Panel
            </Link>
          )}
          <Link
            href="/settings"
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            <Settings className="h-4 w-4 text-slate-400" />
            Settings
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-xl bg-red-500/10 border border-red-500/20 px-3.5 py-2 text-xs font-semibold text-red-400 hover:bg-red-500 hover:text-white transition"
          >
            <Lock className="h-4 w-4" />
            Lock Vault
          </button>
        </div>
      </div>

      {/* AI Assistant Quick Search Hero */}
      <div className="mt-8 rounded-3xl border border-slate-800/80 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/30 p-6 sm:p-8 backdrop-blur shadow-2xl">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-400 mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            Connected across all your private folders
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            What do you need from your vault?
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Search for your uploaded documents, private contacts, memory notes, or tasks instantly.
          </p>

          <form onSubmit={handleSearchSubmit} className="mt-5 flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find my passport, bank statement, or contact..."
                className="w-full rounded-2xl border border-slate-800 bg-slate-950 py-3.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500"
              />
            </div>
            <Link
              href="/ai-assistant"
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-500 transition shrink-0"
            >
              <Bot className="h-4 w-4" />
              Ask AI
            </Link>
          </form>
        </div>
      </div>

      {/* Live Vault Storage Summary */}
      {stats && (
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4">
            <span className="text-xs text-slate-400">Documents</span>
            <p className="text-2xl font-bold text-white mt-1">{stats.documentsCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4">
            <span className="text-xs text-slate-400">Photos</span>
            <p className="text-2xl font-bold text-white mt-1">{stats.photosCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4">
            <span className="text-xs text-slate-400">Contacts</span>
            <p className="text-2xl font-bold text-white mt-1">{stats.contactsCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4">
            <span className="text-xs text-slate-400">Notes</span>
            <p className="text-2xl font-bold text-white mt-1">{stats.notesCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4">
            <span className="text-xs text-slate-400">Tasks</span>
            <p className="text-2xl font-bold text-white mt-1">{stats.tasksCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4">
            <span className="text-xs text-slate-400">Storage Used</span>
            <p className="text-xl font-bold text-emerald-400 mt-1">{formatSize(stats.totalStorageBytes)}</p>
          </div>
        </div>
      )}

      {/* Main Vault Folders Grid */}
      <div className="mt-8">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">
          Vault Folders
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Documents Folder */}
          <Link
            href="/documents"
            className="group flex flex-col justify-between rounded-3xl border border-slate-800/80 bg-slate-900/80 p-6 backdrop-blur transition hover:border-emerald-500/50 hover:bg-slate-900 hover:shadow-xl hover:shadow-emerald-500/5"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-400 border border-blue-500/20">
                  <FileText className="h-6 w-6" />
                </div>
                <span className="text-xs font-semibold text-slate-400">
                  {stats ? `${stats.documentsCount} files` : "Vault"}
                </span>
              </div>
              <h4 className="mt-4 text-xl font-bold text-white">Documents</h4>
              <p className="mt-1 text-xs text-slate-400">
                Upload IDs, bills, contracts, and download them anytime from any browser.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-emerald-400 group-hover:translate-x-1 transition">
              Open Documents Folder <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </Link>

          {/* Photos Folder */}
          <Link
            href="/photos"
            className="group flex flex-col justify-between rounded-3xl border border-slate-800/80 bg-slate-900/80 p-6 backdrop-blur transition hover:border-emerald-500/50 hover:bg-slate-900 hover:shadow-xl hover:shadow-emerald-500/5"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-600/10 text-purple-400 border border-purple-500/20">
                  <ImageIcon className="h-6 w-6" />
                </div>
                <span className="text-xs font-semibold text-slate-400">
                  {stats ? `${stats.photosCount} photos` : "Gallery"}
                </span>
              </div>
              <h4 className="mt-4 text-xl font-bold text-white">Photo Gallery</h4>
              <p className="mt-1 text-xs text-slate-400">
                Pick images directly from your gallery, save captions, edit, and download.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-emerald-400 group-hover:translate-x-1 transition">
              Open Gallery <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </Link>

          {/* Contacts Folder */}
          <Link
            href="/contacts"
            className="group flex flex-col justify-between rounded-3xl border border-slate-800/80 bg-slate-900/80 p-6 backdrop-blur transition hover:border-emerald-500/50 hover:bg-slate-900 hover:shadow-xl hover:shadow-emerald-500/5"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600/10 text-emerald-400 border border-emerald-500/20">
                  <User className="h-6 w-6" />
                </div>
                <span className="text-xs font-semibold text-slate-400">
                  {stats ? `${stats.contactsCount} contacts` : "Directory"}
                </span>
              </div>
              <h4 className="mt-4 text-xl font-bold text-white">Contacts</h4>
              <p className="mt-1 text-xs text-slate-400">
                Store private and emergency numbers, click to call, edit, and copy details.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-emerald-400 group-hover:translate-x-1 transition">
              Open Contacts <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </Link>

          {/* Notes Folder */}
          <Link
            href="/notes"
            className="group flex flex-col justify-between rounded-3xl border border-slate-800/80 bg-slate-900/80 p-6 backdrop-blur transition hover:border-emerald-500/50 hover:bg-slate-900 hover:shadow-xl hover:shadow-emerald-500/5"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-600/10 text-amber-400 border border-amber-500/20">
                  <FileText className="h-6 w-6" />
                </div>
                <span className="text-xs font-semibold text-slate-400">
                  {stats ? `${stats.notesCount} notes` : "Encrypted"}
                </span>
              </div>
              <h4 className="mt-4 text-xl font-bold text-white">Private Notes</h4>
              <p className="mt-1 text-xs text-slate-400">
                Write sensitive thoughts, passwords, checklists, and ideas saved permanently.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-emerald-400 group-hover:translate-x-1 transition">
              Open Notes <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </Link>

          {/* Tasks Folder */}
          <Link
            href="/tasks"
            className="group flex flex-col justify-between rounded-3xl border border-slate-800/80 bg-slate-900/80 p-6 backdrop-blur transition hover:border-emerald-500/50 hover:bg-slate-900 hover:shadow-xl hover:shadow-emerald-500/5"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-600/10 text-cyan-400 border border-cyan-500/20">
                  <CheckSquare className="h-6 w-6" />
                </div>
                <span className="text-xs font-semibold text-slate-400">
                  {stats ? `${stats.tasksCount} tasks` : "To-Dos"}
                </span>
              </div>
              <h4 className="mt-4 text-xl font-bold text-white">Tasks & Reminders</h4>
              <p className="mt-1 text-xs text-slate-400">
                Track personal deadlines, priority to-dos, and daily reminders.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-emerald-400 group-hover:translate-x-1 transition">
              Open Tasks <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </Link>

          {/* AI Assistant Hub */}
          <Link
            href="/ai-assistant"
            className="group flex flex-col justify-between rounded-3xl border border-slate-800/80 bg-slate-900/80 p-6 backdrop-blur transition hover:border-emerald-500/50 hover:bg-slate-900 hover:shadow-xl hover:shadow-emerald-500/5"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20">
                  <Bot className="h-6 w-6" />
                </div>
                <span className="text-xs font-semibold text-indigo-400">All Folders</span>
              </div>
              <h4 className="mt-4 text-xl font-bold text-white">AI Assistant</h4>
              <p className="mt-1 text-xs text-slate-400">
                Ask questions or search across all folders simultaneously with direct links.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-emerald-400 group-hover:translate-x-1 transition">
              Chat with Assistant <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}