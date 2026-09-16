import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { restoreVaultData } from "@/lib/vault-store";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid backup file format" }, { status: 400 });
    }

    const result = await restoreVaultData(session.sub, body);

    return NextResponse.json({
      success: true,
      message: `Vault backup restored successfully: ${result.restoredContacts} contacts, ${result.restoredNotes} notes, ${result.restoredTasks} tasks.`,
      result,
    });
  } catch (err) {
    console.error("Failed to restore vault backup:", err);
    return NextResponse.json({ error: "Failed to restore backup" }, { status: 500 });
  }
}
