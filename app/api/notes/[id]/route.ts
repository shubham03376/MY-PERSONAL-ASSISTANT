import { NextRequest, NextResponse } from "next/server";
import { updateNote, deleteNote } from "@/lib/vault-store";
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
    const { title, content, tag, isPinned } = body;

    const updated = await updateNote(session.sub, id, { title, content, tag, isPinned });
    if (!updated) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, note: updated });
  } catch (err) {
    console.error("Note update error:", err);
    return NextResponse.json({ error: "Failed to update note" }, { status: 500 });
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
    const success = await deleteNote(session.sub, id);
    if (!success) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Note deleted" });
  } catch (err) {
    console.error("Note delete error:", err);
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
  }
}
