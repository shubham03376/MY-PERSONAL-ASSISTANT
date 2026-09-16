import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { exportVaultData } from "@/lib/vault-store";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const backupData = await exportVaultData(session.sub);
    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `vault-backup-${session.username}-${dateStr}.json`;

    return new NextResponse(JSON.stringify(backupData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, private",
      },
    });
  } catch (err) {
    console.error("Failed to export vault backup:", err);
    return NextResponse.json({ error: "Failed to export vault backup" }, { status: 500 });
  }
}
