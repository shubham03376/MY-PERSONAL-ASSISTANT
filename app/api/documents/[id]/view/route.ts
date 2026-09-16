import { NextRequest, NextResponse } from "next/server";
import { getDocumentFile } from "@/lib/vault-store";
import { getSessionUser } from "@/lib/auth";
import fs from "fs";
import path from "path";

// MIME type lookup helper for proper browser inline rendering
function getMimeType(originalName: string, storedMime?: string): string {
  if (storedMime && storedMime !== "application/octet-stream") {
    return storedMime;
  }

  const ext = path.extname(originalName).toLowerCase();
  const mimeMap: Record<string, string> = {
    ".pdf": "application/pdf",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".txt": "text/plain; charset=utf-8",
    ".md": "text/markdown; charset=utf-8",
    ".json": "application/json",
    ".csv": "text/csv; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".htm": "text/html; charset=utf-8",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".mp4": "video/mp4",
  };

  return mimeMap[ext] || storedMime || "application/octet-stream";
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const fileInfo = await getDocumentFile(session.sub, id);

    if (!fileInfo) {
      return NextResponse.json(
        { error: "Document not found or access denied" },
        { status: 404 }
      );
    }

    const { doc, filePath } = fileInfo;
    const fileBuffer = fs.readFileSync(filePath);

    const cleanFilename = doc.originalName.replace(/["\r\n]/g, "_");
    const mimeType = getMimeType(doc.originalName, doc.mimeType);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Length": doc.size.toString(),
        "Content-Disposition": `inline; filename="${cleanFilename}"; filename*=UTF-8''${encodeURIComponent(
          cleanFilename
        )}`,
        "Cache-Control": "private, max-age=3600, must-revalidate",
      },
    });
  } catch (err) {
    console.error("Document inline view failed:", err);
    return NextResponse.json({ error: "Failed to open document" }, { status: 500 });
  }
}
