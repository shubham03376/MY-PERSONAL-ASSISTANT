import { NextRequest, NextResponse } from "next/server";
import { getDocuments, saveDocument } from "@/lib/vault-store";
import { uploadOrUpdateFileToGitHub } from "@/lib/github-storage";
import { getSessionUser } from "@/lib/auth";
import { validateDocumentUpload } from "@/lib/file-validator";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const docs = await getDocuments(session.sub);
    return NextResponse.json({ documents: docs });
  } catch (err) {
    console.error("Failed to fetch documents:", err);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const category = (formData.get("category") as string) || "General";
    const notes = (formData.get("notes") as string) || "";
    const title = (formData.get("title") as string) || "";

    if (!file) {
      return NextResponse.json({ error: "No file provided for upload" }, { status: 400 });
    }

    const validation = validateDocumentUpload(file.name, file.size, file.type);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const document = await saveDocument(
      session.sub,
      buffer,
      validation.sanitizedName || file.name,
      file.type,
      category,
      notes,
      title || validation.sanitizedName || file.name
    );

    // Optional background sync to GitHub
    uploadOrUpdateFileToGitHub(
      `vault/${session.username}/documents/${document.filename}`,
      buffer,
      `Upload document: ${document.originalName}`
    ).catch(() => {});

    return NextResponse.json({ success: true, document }, { status: 201 });
  } catch (err) {
    console.error("Document upload failed:", err);
    return NextResponse.json({ error: "File upload failed" }, { status: 500 });
  }
}
