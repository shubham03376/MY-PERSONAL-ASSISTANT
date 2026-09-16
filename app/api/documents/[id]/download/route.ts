import { NextRequest, NextResponse } from "next/server";
import { getDocumentFile } from "@/lib/vault-store";
import { getSessionUser } from "@/lib/auth";
import fs from "fs";

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
      return NextResponse.json({ error: "Document not found or access denied" }, { status: 404 });
    }

    const { doc, filePath } = fileInfo;
    const fileBuffer = fs.readFileSync(filePath);

    const cleanFilename = doc.originalName.replace(/["\r\n]/g, "_");

    const { searchParams } = new URL(req.url);
    const isInline = searchParams.get("inline") === "true" || searchParams.get("view") === "true";
    const disposition = isInline ? "inline" : "attachment";

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": doc.mimeType || "application/octet-stream",
        "Content-Length": doc.size.toString(),
        "Content-Disposition": `${disposition}; filename="${cleanFilename}"; filename*=UTF-8''${encodeURIComponent(cleanFilename)}`,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (err) {
    console.error("Document download failed:", err);
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
