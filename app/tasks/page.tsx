"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckSquare,
  Plus,
  Trash2,
  Edit2,
  ArrowLeft,
  X,
  Calendar,
  CheckCircle2,
  Circle,
} from "lucide-react";

interface VaultTask {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
  priority: "low" | "medium" | "high";
  createdAt: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<VaultTask[]>([]);
  const [loading, setLoading] = useState(true);

  // Add state
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [saving, setSaving] = useState(false);

  // Edit state
  const [editingTask, setEditingTask] = useState<VaultTask | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editPriority, setEditPriority] = useState<"low" | "medium" | "high">("medium");
  const [updating, setUpdating] = useState(false);

  async function loadTasks() {
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      if (data.tasks) {
        setTasks(data.tasks);
      }
    } catch (err) {
      console.error("Failed to load tasks:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          dueDate: dueDate || undefined,
          priority,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setTitle("");
        setDueDate("");
        setPriority("medium");
        await loadTasks();
      } else {
        alert("Failed to add task.");
      }
    } catch {
      alert("Error saving task.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleComplete(task: VaultTask) {
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...task,
          completed: !task.completed,
        }),
      });

      if (res.ok) {
        setTasks(
          tasks.map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t))
        );
      }
    } catch {
      console.error("Failed to toggle task");
    }
  }

  async function handleUpdateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!editingTask || !editTitle.trim()) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/tasks/${editingTask.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          dueDate: editDueDate || undefined,
          priority: editPriority,
          completed: editingTask.completed,
        }),
      });

      if (res.ok) {
        setEditingTask(null);
        await loadTasks();
      } else {
        alert("Failed to update task.");
      }
    } catch {
      alert("Error updating task.");
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete(task: VaultTask) {
    if (!confirm(`Delete task "${task.title}"?`)) return;

    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      if (res.ok) {
        setTasks(tasks.filter((t) => t.id !== task.id));
      } else {
        alert("Failed to delete task.");
      }
    } catch {
      alert("Error deleting task.");
    }
  }

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
              ✅ Vault Tasks & Reminders
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Manage personal to-dos, priorities, and deadlines.
            </p>
          </div>
        </div>

        {/* 1) ADD TASK BUTTON */}
        <button
          onClick={() => {
            setTitle("");
            setDueDate("");
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500 transition"
        >
          <Plus className="h-4 w-4" />
          Add Task
        </button>
      </div>

      {/* Task List */}
      <div className="mt-8 max-w-3xl">
        {loading ? (
          <div className="flex justify-center p-12 text-slate-500">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center">
            <CheckSquare className="mx-auto h-12 w-12 text-slate-600" />
            <h3 className="mt-4 text-lg font-semibold text-slate-300">All tasks completed!</h3>
            <p className="mt-1 text-sm text-slate-500">
              Add reminders or to-dos to keep track of your daily responsibilities.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition"
            >
              <Plus className="h-4 w-4" />
              Create First Task
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-center justify-between rounded-2xl border p-4 backdrop-blur transition ${
                  task.completed
                    ? "border-slate-800/40 bg-slate-950/40 opacity-60"
                    : "border-slate-800/80 bg-slate-900/80 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center gap-3 flex-1 overflow-hidden">
                  <button
                    onClick={() => toggleComplete(task)}
                    className="shrink-0 text-slate-400 hover:text-blue-400"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </button>
                  <div className="overflow-hidden">
                    <p
                      className={`text-sm font-medium truncate ${
                        task.completed ? "line-through text-slate-400" : "text-white"
                      }`}
                    >
                      {task.title}
                    </p>
                    {task.dueDate && (
                      <span className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                        <Calendar className="h-3 w-3" />
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      task.priority === "high"
                        ? "bg-red-500/10 text-red-400 border border-red-500/20"
                        : task.priority === "medium"
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    }`}
                  >
                    {task.priority}
                  </span>

                  {/* 3) EDIT BUTTON */}
                  <button
                    onClick={() => {
                      setEditingTask(task);
                      setEditTitle(task.title);
                      setEditDueDate(task.dueDate || "");
                      setEditPriority(task.priority);
                    }}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                    title="Edit task"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>

                  {/* 2) DELETE BUTTON */}
                  <button
                    onClick={() => handleDelete(task)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-500/10 hover:text-red-400"
                    title="Delete task"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 1) ADD TASK MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                <Plus className="h-5 w-5 text-blue-400" />
                Add New Task
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddTask} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Renew passport, Download bank statement"
                  required
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3.5 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3.5 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3.5 text-sm text-white outline-none focus:border-blue-500"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
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
                  {saving ? "Saving..." : "Add Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3) EDIT TASK MODAL */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                <Edit2 className="h-5 w-5 text-blue-400" />
                Edit Task
              </h3>
              <button
                onClick={() => setEditingTask(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateTask} className="mt-5 space-y-4">
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
                  Due Date
                </label>
                <input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3.5 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Priority
                </label>
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value as "low" | "medium" | "high")}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3.5 text-sm text-white outline-none focus:border-blue-500"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
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