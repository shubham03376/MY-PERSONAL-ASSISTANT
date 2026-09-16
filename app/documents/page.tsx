"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Edit2,
  Search,
  ArrowLeft,
  Filter,
  Check,
  X,
  FileSpreadsheet,
  FileCode,
  FileArchive,
  Image as ImageIcon,
  File as FileIcon,
  Eye,
  ExternalLink,
} from "lucide-react";

interface VaultDoc {
  id: string;
  title: string;
  originalName: string;
  mimeType: string;
  size: number;
  category: string;
  notes: string;
  createdAt: string;
}

const CATEGORIES = ["All", "ID Proofs", "Financial", "Medical", "Work", "Personal", "General"];

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<VaultDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // In-app document viewer state
  const [viewingDoc, setViewingDoc] = useState<VaultDoc | null>(null);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadCategory, setUploadCategory] = useState("General");
  const [uploadNotes, setUploadNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit modal state
  const [editingDoc, setEditingDoc] = useState<VaultDoc | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("General");
  const [editNotes, setEditNotes] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Load documents
  async function loadDocuments() {
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      if (data.documents) {
        setDocuments(data.documents);
      }
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDocuments();
  }, []);

  // Upload handler
  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("title", uploadTitle.trim() || uploadFile.name);
      formData.append("category", uploadCategory);
      formData.append("notes", uploadNotes.trim());

      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setShowUploadModal(false);
        setUploadFile(null);
        setUploadTitle("");
        setUploadNotes("");
        setUploadCategory("General");
        await loadDocuments();
      } else {
        alert("Upload failed. Please try again.");
      }
    } catch {
      alert("Error uploading file.");
    } finally {
      setUploading(false);
    }
  }

  // Edit handler
  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingDoc) return;

    setSavingEdit(true);
    try {
      const res = await fetch(`/api/documents/${editingDoc.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          category: editCategory,
          notes: editNotes.trim(),
        }),
      });

      if (res.ok) {
        setEditingDoc(null);
        await loadDocuments();
      } else {
        alert("Failed to update document details.");
      }
    } catch {
      alert("Error updating document.");
    } finally {
      setSavingEdit(false);
    }
  }

  // Delete handler
  async function handleDelete(doc: VaultDoc) {
    if (!confirm(`Are you sure you want to delete "${doc.title}"?`)) return;

    try {
      const res = await fetch(`/api/documents/${doc.id}`, { method: "DELETE" });
      if (res.ok) {
        setDocuments(documents.filter((d) => d.id !== doc.id));
      } else {
        alert("Failed to delete document.");
      }
    } catch {
      alert("Error deleting document.");
    }
  }

  // Filtered documents
  const filteredDocs = documents.filter((doc) => {
    const matchesCategory =
      selectedCategory === "All" || doc.category === selectedCategory;
    const matchesSearch =
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      doc.originalName.toLowerCase().includes(search.toLowerCase()) ||
      doc.notes.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  function formatSize(bytes: number) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  function getFileIcon(mime: string, name: string) {
    if (mime.startsWith("image/")) return <ImageIcon className="h-6 w-6 text-emerald-400" />;
    if (mime.includes("pdf")) return <FileText className="h-6 w-6 text-rose-400" />;
    if (mime.includes("sheet") || name.endsWith(".xlsx") || name.endsWith(".csv"))
      return <FileSpreadsheet className="h-6 w-6 text-green-400" />;
    if (mime.includes("zip") || mime.includes("tar") || mime.includes("rar"))
      return <FileArchive className="h-6 w-6 text-amber-400" />;
    if (mime.includes("text") || mime.includes("json"))
      return <FileCode className="h-6 w-6 text-cyan-400" />;
    return <FileIcon className="h-6 w-6 text-blue-400" />;
  }

  return (
    <main className="min-h-screen bg-slate-950 p-4 sm:p-8 text-white">
      {/* Top Navigation */}
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
              📄 Personal Document Vault
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Upload, organize, edit, and download your personal documents anywhere.
            </p>
          </div>
        </div>

        {/* 1) UPLOAD BUTTON */}
        <button
          onClick={() => {
            setUploadFile(null);
            setUploadTitle("");
            setShowUploadModal(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500 transition"
        >
          <Upload className="h-4 w-4" />
          Upload Document
        </button>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents by name, category, notes..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="h-4 w-4 text-slate-500 shrink-0 mr-1" />
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition ${
                selectedCategory === cat
                  ? "bg-blue-600 text-white"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Document List */}
      <div className="mt-6">
        {loading ? (
          <div className="flex justify-center p-12 text-slate-500">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-slate-600" />
            <h3 className="mt-4 text-lg font-semibold text-slate-300">No documents found</h3>
            <p className="mt-1 text-sm text-slate-500">
              {search || selectedCategory !== "All"
                ? "No files match your search criteria."
                : "Upload your first document to start saving in your private vault."}
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 transition"
            >
              <Upload className="h-4 w-4" />
              Upload Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-slate-900/80 p-5 backdrop-blur transition hover:border-slate-700"
              >
                <div>
                  <div
                    onClick={() => setViewingDoc(doc)}
                    className="flex items-start justify-between gap-3 cursor-pointer group/card"
                    title="Click to open and preview document"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-800 transition group-hover/card:bg-blue-600/20 group-hover/card:text-blue-400">
                        {getFileIcon(doc.mimeType, doc.originalName)}
                      </div>
                      <div className="overflow-hidden">
                        <h2 className="font-semibold text-white truncate transition group-hover/card:text-blue-400" title={doc.title}>
                          {doc.title}
                        </h2>
                        <p className="text-xs text-slate-400 truncate" title={doc.originalName}>
                          {doc.originalName}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[11px] font-medium text-blue-400 border border-slate-700/50 shrink-0">
                      {doc.category}
                    </span>
                  </div>

                  {doc.notes && (
                    <p className="mt-3 text-xs text-slate-400 line-clamp-2 bg-slate-950/40 p-2 rounded-lg">
                      {doc.notes}
                    </p>
                  )}

                  <div className="mt-4 flex items-center gap-3 text-xs text-slate-500">
                    <span>{formatSize(doc.size)}</span>
                    <span>•</span>
                    <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* ACTIONS: OPEN, NEW TAB, DOWNLOAD, EDIT, DELETE */}
                <div className="mt-5 flex items-center justify-between border-t border-slate-800/80 pt-3.5 gap-2">
                  {/* OPEN BUTTON */}
                  <button
                    onClick={() => setViewingDoc(doc)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2 px-3 text-xs font-semibold text-white hover:bg-blue-500 shadow-sm shadow-blue-500/20 transition"
                    title="Open and preview document"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Open
                  </button>

                  {/* OPEN IN NEW TAB BUTTON */}
                  <a
                    href={`/api/documents/${doc.id}/view`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center rounded-xl bg-slate-800 p-2 text-slate-300 hover:bg-slate-700 hover:text-white transition"
                    title="Open in new browser tab"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>

                  {/* DOWNLOAD BUTTON */}
                  <a
                    href={`/api/documents/${doc.id}/download`}
                    download={doc.originalName}
                    className="flex items-center justify-center rounded-xl bg-slate-800 p-2 text-slate-300 hover:bg-slate-700 hover:text-white transition"
                    title="Download to device"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </a>

                  {/* EDIT BUTTON */}
                  <button
                    onClick={() => {
                      setEditingDoc(doc);
                      setEditTitle(doc.title);
                      setEditCategory(doc.category);
                      setEditNotes(doc.notes);
                    }}
                    className="flex items-center justify-center rounded-xl bg-slate-800 p-2 text-slate-300 hover:bg-slate-700 hover:text-white transition"
                    title="Edit details"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>

                  {/* DELETE BUTTON */}
                  <button
                    onClick={() => handleDelete(doc)}
                    className="flex items-center justify-center rounded-xl bg-red-500/10 p-2 text-red-400 hover:bg-red-500 hover:text-white transition"
                    title="Delete document"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 1) UPLOAD MODAL (Opens File / Gallery Picker) */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                <Upload className="h-5 w-5 text-blue-400" />
                Upload to Personal Assistant
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="mt-5 space-y-4">
              {/* File selector input */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950/60 p-6 text-center transition hover:border-blue-500 hover:bg-slate-950"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setUploadFile(f);
                      if (!uploadTitle) setUploadTitle(f.name);
                    }
                  }}
                  className="hidden"
                />
                <Upload className="mx-auto h-8 w-8 text-blue-400" />
                <p className="mt-2 text-sm font-semibold text-slate-200">
                  {uploadFile ? uploadFile.name : "Click to select a document or file"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {uploadFile
                    ? formatSize(uploadFile.size)
                    : "PDF, Word, Excel, Images, Text, Archives"}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Passport, Bank Statement, Contract"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Category
                </label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3.5 text-sm text-white outline-none focus:border-blue-500"
                >
                  {CATEGORIES.filter((c) => c !== "All").map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Personal Notes / Tags
                </label>
                <textarea
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  placeholder="Add any reminders, dates, or notes about this file..."
                  rows={2}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="rounded-xl border border-slate-800 px-4 py-2.5 text-sm text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!uploadFile || uploading}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  {uploading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Save & Upload
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3) EDIT MODAL */}
      {editingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                <Edit2 className="h-5 w-5 text-blue-400" />
                Edit Document
              </h3>
              <button
                onClick={() => setEditingDoc(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-5 space-y-4">
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
                  Category
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3.5 text-sm text-white outline-none focus:border-blue-500"
                >
                  {CATEGORIES.filter((c) => c !== "All").map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Notes
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3.5 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingDoc(null)}
                  className="rounded-xl border border-slate-800 px-4 py-2.5 text-sm text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4) IN-APP DOCUMENT VIEWER MODAL */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-6 backdrop-blur-md">
          <div className="flex flex-col w-full max-w-5xl h-[90vh] rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 shrink-0 bg-slate-900/90">
              <div className="flex items-center gap-3 overflow-hidden mr-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800">
                  {getFileIcon(viewingDoc.mimeType, viewingDoc.originalName)}
                </div>
                <div className="overflow-hidden">
                  <h3 className="text-base sm:text-lg font-bold text-white truncate">
                    {viewingDoc.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="truncate">{viewingDoc.originalName}</span>
                    <span>•</span>
                    <span>{formatSize(viewingDoc.size)}</span>
                    <span>•</span>
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-blue-400">
                      {viewingDoc.category}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`/api/documents/${viewingDoc.id}/view`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition"
                  title="Open full document in new browser tab"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Open in Tab</span>
                </a>

                <a
                  href={`/api/documents/${viewingDoc.id}/download`}
                  download={viewingDoc.originalName}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 transition shadow-sm"
                  title="Download document to device"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Download</span>
                </a>

                <button
                  onClick={() => setViewingDoc(null)}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition ml-1"
                  title="Close viewer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Content / Previewer */}
            <div className="flex-1 overflow-hidden bg-slate-950 p-2 sm:p-4 flex items-center justify-center">
              {viewingDoc.mimeType.startsWith("image/") ||
              /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(viewingDoc.originalName) ? (
                <div className="flex h-full w-full items-center justify-center overflow-auto">
                  <img
                    src={`/api/documents/${viewingDoc.id}/view`}
                    alt={viewingDoc.title}
                    className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
                  />
                </div>
              ) : viewingDoc.mimeType === "application/pdf" ||
                viewingDoc.originalName.toLowerCase().endsWith(".pdf") ? (
                <div className="flex flex-col h-full w-full">
                  <iframe
                    src={`/api/documents/${viewingDoc.id}/view`}
                    className="h-full w-full rounded-2xl border border-slate-800/80 bg-slate-900"
                    title={viewingDoc.title}
                  />
                </div>
              ) : viewingDoc.mimeType.startsWith("text/") ||
                /\.(txt|md|json|csv|html|xml|log|js|ts)$/i.test(viewingDoc.originalName) ? (
                <iframe
                  src={`/api/documents/${viewingDoc.id}/view`}
                  className="h-full w-full rounded-2xl border border-slate-800/80 bg-white"
                  title={viewingDoc.title}
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center max-w-md">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800">
                    {getFileIcon(viewingDoc.mimeType, viewingDoc.originalName)}
                  </div>
                  <h4 className="mt-4 text-lg font-bold text-white">{viewingDoc.title}</h4>
                  <p className="mt-1 text-xs text-slate-400">{viewingDoc.originalName}</p>
                  <p className="mt-3 text-xs text-slate-500">
                    This file format ({viewingDoc.mimeType}) can be opened in a browser tab or downloaded directly to your device.
                  </p>
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    <a
                      href={`/api/documents/${viewingDoc.id}/view`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 transition"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open in Browser Tab
                    </a>
                    <a
                      href={`/api/documents/${viewingDoc.id}/download`}
                      download={viewingDoc.originalName}
                      className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-700 transition"
                    >
                      <Download className="h-4 w-4" />
                      Download Document
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}