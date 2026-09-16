import { NextRequest, NextResponse } from "next/server";
import { updateContact, deleteContact } from "@/lib/vault-store";
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
    const { name, phone, email, category, notes } = body;

    const updated = await updateContact(session.sub, id, { name, phone, email, category, notes });
    if (!updated) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, contact: updated });
  } catch (err) {
    console.error("Contact update error:", err);
    return NextResponse.json({ error: "Failed to update contact" }, { status: 500 });
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
    const success = await deleteContact(session.sub, id);
    if (!success) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Contact deleted" });
  } catch (err) {
    console.error("Contact delete error:", err);
    return NextResponse.json({ error: "Failed to delete contact" }, { status: 500 });
  }
}
