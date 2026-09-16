import { NextRequest, NextResponse } from "next/server";
import { updateDocument, deleteDocument } from "@/lib/vault-store";
import { getSessionUser } from "@/lib/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { title, category, notes } = body;

    const updated = await updateDocument(session.sub, id, { title, category, notes });
    if (!updated) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, document: updated });
  } catch (err) {
    console.error("Failed to update document:", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const success = await deleteDocument(session.sub, id);
    if (!success) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Document deleted successfully" });
  } catch (err) {
    console.error("Failed to delete document:", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
