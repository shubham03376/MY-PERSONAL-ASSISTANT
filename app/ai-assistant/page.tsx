"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bot,
  ArrowLeft,
  FileText,
  User,
  Image as ImageIcon,
  CheckSquare,
  Download,
  Phone,
  Send,
  Sparkles,
  Eye,
} from "lucide-react";

interface SearchResults {
  documents: Array<{
    id: string;
    title: string;
    originalName: string;
    category: string;
    size: number;
    notes: string;
  }>;
  photos: Array<{
    id: string;
    title: string;
    originalName: string;
    caption: string;
  }>;
  contacts: Array<{
    id: string;
    name: string;
    phone: string;
    email: string;
    category: string;
  }>;
  notes: Array<{
    id: string;
    title: string;
    content: string;
    tag: string;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    completed: boolean;
    priority: string;
  }>;
}

export default function AIAssistantPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [totalMatches, setTotalMatches] = useState(0);

  async function handleSearch(qToSearch?: string) {
    const q = (qToSearch !== undefined ? qToSearch : query).trim();
    if (!q) return;

    setLoading(true);
    try {
      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });

      const data = await res.json();
      setReply(data.reply);
      setResults(data.results);
      setTotalMatches(data.totalMatches || 0);
    } catch {
      setReply("Could not connect to the vault assistant search service.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  }

  const SUGGESTIONS = [
    "Find my passport",
    "Show contacts",
    "Find bank statement",
    "Important notes",
    "High priority tasks",
  ];

  return (
    <main className="min-h-screen bg-slate-950 p-4 sm:p-8 text-white">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            🤖 Vault AI Assistant
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Connected across all your vault folders: Documents, Photos, Notes, Contacts & Tasks.
          </p>
        </div>
      </div>

      {/* Main Search Box */}
      <div className="mt-8 max-w-3xl">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-2xl backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask your assistant to find anything in any folder (e.g. 'find my ID card', 'Rahul phone number')..."
              className="flex-1 bg-transparent text-sm sm:text-base text-white placeholder-slate-500 outline-none"
            />
            <button
              onClick={() => handleSearch()}
              disabled={loading || !query.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 hover:bg-blue-500 disabled:opacity-50 transition"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Suggestion Pills */}
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-800/80 pt-3">
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-blue-400" />
              Suggestions:
            </span>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setQuery(s);
                  handleSearch(s);
                }}
                className="rounded-lg bg-slate-800/80 px-2.5 py-1 text-xs text-slate-300 hover:bg-blue-600/20 hover:text-blue-400 transition"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* AI Response Output */}
        {reply && (
          <div className="mt-6 rounded-2xl border border-blue-500/20 bg-slate-900/60 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400">
                <Sparkles className="h-4 w-4" />
              </div>
              <p className="text-sm text-slate-200 leading-relaxed pt-1">
                {reply}
              </p>
            </div>
          </div>
        )}

        {/* Structured Results Across All Folders */}
        {results && totalMatches > 0 && (
          <div className="mt-8 space-y-6">
            {/* 1. DOCUMENTS SECTION */}
            {results.documents.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-400" />
                  Matching Documents ({results.documents.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {results.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900 p-4 transition hover:border-slate-700"
                    >
                      <div className="overflow-hidden mr-3">
                        <h4 className="font-semibold text-white text-sm truncate">
                          {doc.title}
                        </h4>
                        <span className="text-xs text-slate-400">{doc.category}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <a
                          href={`/api/documents/${doc.id}/view`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 transition shadow-sm"
                          title="Open and view document"
                        >
                          <Eye className="h-3 w-3" />
                          Open
                        </a>
                        <a
                          href={`/api/documents/${doc.id}/download`}
                          download={doc.originalName}
                          className="flex items-center gap-1 rounded-xl bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition"
                          title="Download document"
                        >
                          <Download className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. CONTACTS SECTION */}
            {results.contacts.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <User className="h-4 w-4 text-emerald-400" />
                  Matching Contacts ({results.contacts.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {results.contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900 p-4 transition hover:border-slate-700"
                    >
                      <div>
                        <h4 className="font-semibold text-white text-sm">
                          {contact.name}
                        </h4>
                        {contact.phone && (
                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone className="h-3 w-3 text-emerald-400" />
                            {contact.phone}
                          </p>
                        )}
                      </div>
                      {contact.phone && (
                        <a
                          href={`tel:${contact.phone}`}
                          className="rounded-xl bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500 hover:text-white transition"
                        >
                          Call
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. NOTES SECTION */}
            {results.notes.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-amber-400" />
                  Matching Notes ({results.notes.length})
                </h3>
                <div className="space-y-2">
                  {results.notes.map((note) => (
                    <div
                      key={note.id}
                      className="rounded-2xl border border-slate-800 bg-slate-900 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-white text-sm">{note.title}</h4>
                        <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] text-blue-400">
                          {note.tag}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-300 line-clamp-3">
                        {note.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. PHOTOS SECTION */}
            {results.photos.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-purple-400" />
                  Matching Photos ({results.photos.length})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {results.photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900"
                    >
                      <div className="aspect-video w-full bg-slate-950">
                        <img
                          src={`/api/photos/${photo.id}`}
                          alt={photo.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="p-2.5 flex items-center justify-between">
                        <p className="text-xs font-medium text-white truncate mr-2">
                          {photo.title}
                        </p>
                        <a
                          href={`/api/photos/${photo.id}`}
                          download={photo.originalName}
                          className="text-blue-400 hover:text-white"
                          title="Download photo"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. TASKS SECTION */}
            {results.tasks.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-cyan-400" />
                  Matching Tasks ({results.tasks.length})
                </h3>
                <div className="space-y-2">
                  {results.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-xs"
                    >
                      <span className={task.completed ? "line-through text-slate-400" : "text-white font-medium"}>
                        {task.title}
                      </span>
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] uppercase font-semibold text-slate-400">
                        {task.priority}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}