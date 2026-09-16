"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  Trash2,
  Edit2,
  Search,
  ArrowLeft,
  X,
  Pin,
  Tag,
} from "lucide-react";

interface VaultNote {
  id: string;
  title: string;
  content: string;
  tag: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

const TAGS = ["All", "Personal", "Work", "Ideas", "Passwords", "Important"];

export default function NotesPage() {
  const [notes, setNotes] = useState<VaultNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("All");

  // Create modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tag, setTag] = useState("Personal");
  const [isPinned, setIsPinned] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit modal state
  const [editingNote, setEditingNote] = useState<VaultNote | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTag, setEditTag] = useState("Personal");
  const [editPinned, setEditPinned] = useState(false);
  const [updating, setUpdating] = useState(false);

  async function loadNotes() {
    try {
      const res = await fetch("/api/notes");
      const data = await res.json();
      if (data.notes) {
        setNotes(data.notes);
      }
    } catch (err) {
      console.error("Failed to load notes:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotes();
  }, []);

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() && !content.trim()) return;

    setSaving(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || "Untitled Note",
          content: content.trim(),
          tag,
          isPinned,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setTitle("");
        setContent("");
        setTag("Personal");
        setIsPinned(false);
        await loadNotes();
      } else {
        alert("Failed to save note.");
      }
    } catch {
      alert("Error saving note.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateNote(e: React.FormEvent) {
    e.preventDefault();
    if (!editingNote) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/notes/${editingNote.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          content: editContent.trim(),
          tag: editTag,
          isPinned: editPinned,
        }),
      });

      if (res.ok) {
        setEditingNote(null);
        await loadNotes();
      } else {
        alert("Failed to update note.");
      }
    } catch {
      alert("Error updating note.");
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete(note: VaultNote) {
    if (!confirm(`Are you sure you want to delete note "${note.title}"?`)) return;

    try {
      const res = await fetch(`/api/notes/${note.id}`, { method: "DELETE" });
      if (res.ok) {
        setNotes(notes.filter((n) => n.id !== note.id));
      } else {
        alert("Failed to delete note.");
      }
    } catch {
      alert("Error deleting note.");
    }
  }

  const filteredNotes = notes
    .filter((note) => {
      const matchesTag = selectedTag === "All" || note.tag === selectedTag;
      const matchesSearch =
        note.title.toLowerCase().includes(search.toLowerCase()) ||
        note.content.toLowerCase().includes(search.toLowerCase());
      return matchesTag && matchesSearch;
    })
    .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));

  return (
    <main className="min-h-screen bg-slate-950 p-4 sm:p-8 text-white">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              📝 Private Notes
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Encrypted thoughts, ideas, passwords, and checklists stored securely.
            </p>
          </div>
        </div>

        {/* 1) ADD NOTE BUTTON */}
        <button
          onClick={() => {
            setTitle("");
            setContent("");
            setTag("Personal");
            setIsPinned(false);
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500 transition"
        >
          <Plus className="h-4 w-4" />
          Create Note
        </button>
      </div>

      {/* Search & Tags */}
      <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes by title or content..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Tag className="h-4 w-4 text-slate-500 shrink-0 mr-1" />
          {TAGS.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTag(t)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition ${
                selectedTag === t
                  ? "bg-blue-600 text-white"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Note Grid */}
      <div className="mt-6">
        {loading ? (
          <div className="flex justify-center p-12 text-slate-500">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-slate-600" />
            <h3 className="mt-4 text-lg font-semibold text-slate-300">No notes found</h3>
            <p className="mt-1 text-sm text-slate-500">
              Write down thoughts, ideas, or sensitive information in your private vault.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 transition"
            >
              <Plus className="h-4 w-4" />
              Write First Note
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotes.map((n) => (
              <div
                key={n.id}
                className={`group relative flex flex-col justify-between rounded-2xl border p-5 backdrop-blur transition hover:border-slate-700 ${
                  n.isPinned
                    ? "border-blue-500/50 bg-slate-900/90 shadow-lg shadow-blue-500/5"
                    : "border-slate-800/80 bg-slate-900/80"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 overflow-hidden">
                      {n.isPinned && (
                        <Pin className="h-4 w-4 text-blue-400 shrink-0 fill-blue-400" />
                      )}
                      <h2 className="font-semibold text-white truncate">{n.title}</h2>
                    </div>
                    <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[11px] font-medium text-blue-400 border border-slate-700/50 shrink-0">
                      {n.tag}
                    </span>
                  </div>

                  <p className="mt-3 text-xs sm:text-sm text-slate-300 whitespace-pre-wrap line-clamp-6">
                    {n.content}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-3 text-xs text-slate-500">
                  <span>{new Date(n.updatedAt).toLocaleDateString()}</span>

                  <div className="flex items-center gap-1">
                    {/* 3) EDIT BUTTON */}
                    <button
                      onClick={() => {
                        setEditingNote(n);
                        setEditTitle(n.title);
                        setEditContent(n.content);
                        setEditTag(n.tag);
                        setEditPinned(n.isPinned);
                      }}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                      title="Edit note"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>

                    {/* 2) DELETE BUTTON */}
                    <button
                      onClick={() => handleDelete(n)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-500/10 hover:text-red-400"
                      title="Delete note"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 1) CREATE NOTE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                <Plus className="h-5 w-5 text-blue-400" />
                New Private Note
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddNote} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Note Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Wi-Fi Passwords, Project Ideas"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3.5 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Tag / Folder
                </label>
                <select
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3.5 text-sm text-white outline-none focus:border-blue-500"
                >
                  {TAGS.filter((t) => t !== "All").map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Note Content
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your note here..."
                  rows={6}
                  required
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3.5 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pinCheck"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="pinCheck" className="text-xs text-slate-300">
                  Pin to top of notes
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-800 px-4 py-2.5 text-sm text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Note"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3) EDIT NOTE MODAL */}
      {editingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                <Edit2 className="h-5 w-5 text-blue-400" />
                Edit Note
              </h3>
              <button
                onClick={() => setEditingNote(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateNote} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3.5 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Tag
                </label>
                <select
                  value={editTag}
                  onChange={(e) => setEditTag(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3.5 text-sm text-white outline-none focus:border-blue-500"
                >
                  {TAGS.filter((t) => t !== "All").map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Content
                </label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={6}
                  required
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3.5 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editPinCheck"
                  checked={editPinned}
                  onChange={(e) => setEditPinned(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="editPinCheck" className="text-xs text-slate-300">
                  Pin to top of notes
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingNote(null)}
                  className="rounded-xl border border-slate-800 px-4 py-2.5 text-sm text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  {updating ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}