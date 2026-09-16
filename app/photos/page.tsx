"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Image as ImageIcon,
  Upload,
  Download,
  Trash2,
  Edit2,
  ArrowLeft,
  X,
  Check,
  Maximize2,
} from "lucide-react";

interface VaultPhoto {
  id: string;
  title: string;
  originalName: string;
  mimeType: string;
  size: number;
  caption: string;
  createdAt: string;
}

export default function PhotosPage() {
  const [photos, setPhotos] = useState<VaultPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload modal & gallery picker
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadCaption, setUploadCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit modal
  const [editingPhoto, setEditingPhoto] = useState<VaultPhoto | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCaption, setEditCaption] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Lightbox view
  const [viewingPhoto, setViewingPhoto] = useState<VaultPhoto | null>(null);

  async function loadPhotos() {
    try {
      const res = await fetch("/api/photos");
      const data = await res.json();
      if (data.photos) {
        setPhotos(data.photos);
      }
    } catch (err) {
      console.error("Failed to load photos:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPhotos();
  }, []);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      if (!uploadTitle) setUploadTitle(file.name);
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("title", uploadTitle.trim() || uploadFile.name);
      formData.append("caption", uploadCaption.trim());

      const res = await fetch("/api/photos", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setShowUploadModal(false);
        setUploadFile(null);
        setPreviewUrl(null);
        setUploadTitle("");
        setUploadCaption("");
        await loadPhotos();
      } else {
        alert("Upload failed. Please try again.");
      }
    } catch {
      alert("Error uploading image.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingPhoto) return;

    setSavingEdit(true);
    try {
      const res = await fetch(`/api/photos/${editingPhoto.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          caption: editCaption.trim(),
        }),
      });

      if (res.ok) {
        setEditingPhoto(null);
        await loadPhotos();
      } else {
        alert("Failed to update photo details.");
      }
    } catch {
      alert("Error updating photo.");
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDelete(photo: VaultPhoto) {
    if (!confirm(`Are you sure you want to delete this photo "${photo.title}"?`)) return;

    try {
      const res = await fetch(`/api/photos/${photo.id}`, { method: "DELETE" });
      if (res.ok) {
        setPhotos(photos.filter((p) => p.id !== photo.id));
      } else {
        alert("Failed to delete photo.");
      }
    } catch {
      alert("Error deleting photo.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 p-4 sm:p-8 text-white">
      {/* Top Header */}
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
              📸 Private Photo Gallery
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Upload from your gallery, view, edit, download, or delete personal photos.
            </p>
          </div>
        </div>

        {/* 1) UPLOAD BUTTON (Opens device gallery / camera) */}
        <button
          onClick={() => {
            setUploadFile(null);
            setPreviewUrl(null);
            setUploadTitle("");
            setUploadCaption("");
            setShowUploadModal(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500 transition"
        >
          <Upload className="h-4 w-4" />
          Upload Image
        </button>
      </div>

      {/* Gallery Grid */}
      <div className="mt-8">
        {loading ? (
          <div className="flex justify-center p-12 text-slate-500">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          </div>
        ) : photos.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center">
            <ImageIcon className="mx-auto h-12 w-12 text-slate-600" />
            <h3 className="mt-4 text-lg font-semibold text-slate-300">No photos in your vault yet</h3>
            <p className="mt-1 text-sm text-slate-500">
              Click upload to open your device gallery and add your private pictures.
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition"
            >
              <Upload className="h-4 w-4" />
              Open Gallery & Upload
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="group overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 transition hover:border-slate-700 flex flex-col justify-between"
              >
                <div
                  className="relative aspect-video sm:aspect-square w-full bg-slate-950 overflow-hidden cursor-pointer"
                  onClick={() => setViewingPhoto(photo)}
                >
                  <img
                    src={`/api/photos/${photo.id}`}
                    alt={photo.title}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <Maximize2 className="h-7 w-7 text-white" />
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-white truncate" title={photo.title}>
                      {photo.title}
                    </h3>
                    {photo.caption && (
                      <p className="mt-1 text-xs text-slate-400 line-clamp-2">
                        {photo.caption}
                      </p>
                    )}
                  </div>

                  {/* Actions: Download, Edit, Delete */}
                  <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3 gap-2">
                    <a
                      href={`/api/photos/${photo.id}`}
                      download={photo.originalName}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-600/20 py-1.5 px-3 text-xs font-semibold text-blue-400 hover:bg-blue-600 hover:text-white transition"
                      title="Download image"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </a>

                    {/* Edit */}
                    <button
                      onClick={() => {
                        setEditingPhoto(photo);
                        setEditTitle(photo.title);
                        setEditCaption(photo.caption);
                      }}
                      className="rounded-xl bg-slate-800 p-2 text-slate-300 hover:bg-slate-700 hover:text-white transition"
                      title="Edit photo"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(photo)}
                      className="rounded-xl bg-red-500/10 p-2 text-red-400 hover:bg-red-500 hover:text-white transition"
                      title="Delete photo"
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

      {/* 1) UPLOAD MODAL (Gallery / File Picker) */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                <Upload className="h-5 w-5 text-blue-400" />
                Choose Image from Gallery
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="mt-5 space-y-4">
              {/* Image picker */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950/60 p-4 text-center transition hover:border-blue-500 hover:bg-slate-950"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {previewUrl ? (
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="h-full w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="py-6">
                    <ImageIcon className="mx-auto h-10 w-10 text-blue-400" />
                    <p className="mt-2 text-sm font-semibold text-slate-200">
                      Tap to open Device Gallery
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Supports JPG, PNG, WEBP, GIF
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Photo Title
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Family Trip, ID Card Photo"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3.5 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Caption / Memory
                </label>
                <textarea
                  value={uploadCaption}
                  onChange={(e) => setUploadCaption(e.target.value)}
                  placeholder="Describe this photo..."
                  rows={2}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3.5 text-sm text-white outline-none focus:border-blue-500"
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
                      Save Photo
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3) EDIT MODAL */}
      {editingPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                <Edit2 className="h-5 w-5 text-blue-400" />
                Edit Photo Details
              </h3>
              <button
                onClick={() => setEditingPhoto(null)}
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
                  Caption
                </label>
                <textarea
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3.5 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingPhoto(null)}
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

      {/* Lightbox Modal */}
      {viewingPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
          onClick={() => setViewingPhoto(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setViewingPhoto(null)}
              className="absolute -top-12 right-0 rounded-full bg-slate-800 p-2 text-white hover:bg-slate-700"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={`/api/photos/${viewingPhoto.id}`}
              alt={viewingPhoto.title}
              className="max-h-[75vh] w-auto rounded-2xl object-contain shadow-2xl"
            />
            <div className="mt-4 text-center">
              <h2 className="text-lg font-bold text-white">{viewingPhoto.title}</h2>
              {viewingPhoto.caption && (
                <p className="mt-1 text-sm text-slate-300">{viewingPhoto.caption}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}