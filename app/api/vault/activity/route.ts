import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getActivityLogs } from "@/lib/activity-logger";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allLogs = getActivityLogs(200);
    const userLogs = allLogs
      .filter(
        (l) =>
          l.identifier.toLowerCase() === session.username.toLowerCase() ||
          l.identifier.toLowerCase() === session.email.toLowerCase()
      )
      .slice(0, 15);

    return NextResponse.json({ logs: userLogs });
  } catch (err) {
    console.error("Failed to load user activity:", err);
    return NextResponse.json({ error: "Failed to load activity" }, { status: 500 });
  }
}
