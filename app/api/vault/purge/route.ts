import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { purgeUserVault } from "@/lib/vault-store";
import { logActivity } from "@/lib/activity-logger";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    if (body.confirmation !== "PERMANENTLY DELETE ALL DATA") {
      return NextResponse.json(
        { error: 'Confirmation string must match "PERMANENTLY DELETE ALL DATA".' },
        { status: 400 }
      );
    }

    await purgeUserVault(session.sub);

    logActivity(
      "PASSWORD_CHANGED", // or security alert
      session.username,
      req,
      "User executed permanent vault data purge"
    );

    return NextResponse.json({
      success: true,
      message: "All vault documents, photos, notes, contacts, and tasks have been permanently purged.",
    });
  } catch (err) {
    console.error("Failed to purge vault data:", err);
    return NextResponse.json({ error: "Failed to purge vault data" }, { status: 500 });
  }
}
