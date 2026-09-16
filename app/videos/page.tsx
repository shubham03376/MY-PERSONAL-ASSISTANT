import Link from "next/link";
import { ArrowLeft, Video } from "lucide-react";

export default function VideosPage() {
  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            🎥 Video Vault
          </h1>
          <p className="mt-1 text-slate-400">
            Your personal video recordings and clips.
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center">
        <Video className="mx-auto h-12 w-12 text-slate-600" />
        <h2 className="mt-4 text-xl font-semibold text-slate-300">
          No videos yet
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Personal video uploads will be available here.
        </p>
      </div>
    </main>
  );
}