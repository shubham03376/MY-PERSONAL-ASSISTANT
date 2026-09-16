import { NextRequest, NextResponse } from "next/server";
import { getContacts, addContact } from "@/lib/vault-store";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contacts = await getContacts(session.sub);
    return NextResponse.json({ contacts });
  } catch (err) {
    console.error("Failed to fetch contacts:", err);
    return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, phone, email, category, notes } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Contact name is required" }, { status: 400 });
    }

    const contact = await addContact(session.sub, {
      name: name.trim(),
      phone: phone?.trim() || "",
      email: email?.trim() || "",
      category: category?.trim() || "General",
      notes: notes?.trim() || "",
    });

    return NextResponse.json({ success: true, contact }, { status: 201 });
  } catch (err) {
    console.error("Failed to add contact:", err);
    return NextResponse.json({ error: "Failed to add contact" }, { status: 500 });
  }
}
