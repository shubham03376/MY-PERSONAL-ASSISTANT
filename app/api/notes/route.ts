import { NextRequest, NextResponse } from "next/server";
import { getNotes, addNote } from "@/lib/vault-store";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notes = await getNotes(session.sub);
    return NextResponse.json({ notes });
  } catch (err) {
    console.error("Failed to fetch notes:", err);
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, content, tag, isPinned } = body;

    if (!title && !content) {
      return NextResponse.json({ error: "Title or content is required" }, { status: 400 });
    }

    const note = await addNote(session.sub, {
      title: title?.trim() || "Untitled Note",
      content: content?.trim() || "",
      tag: tag?.trim() || "Personal",
      isPinned: !!isPinned,
    });

    return NextResponse.json({ success: true, note }, { status: 201 });
  } catch (err) {
    console.error("Failed to add note:", err);
    return NextResponse.json({ error: "Failed to add note" }, { status: 500 });
  }
}
