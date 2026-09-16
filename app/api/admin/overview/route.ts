import { NextRequest, NextResponse } from "next/server";
import { getAllUsersSafe } from "@/lib/users";
import { getActivityLogs } from "@/lib/activity-logger";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "admin" || session.username !== "shubham@1700") {
      return NextResponse.json(
        { error: "Forbidden: Platform owner developer administrator access required." },
        { status: 403 }
      );
    }

    const users = getAllUsersSafe();
    const logs = getActivityLogs(150);

    const totalLogins = logs.filter(
      (l) => l.event === "LOGIN_SUCCESS" || l.event === "ADMIN_LOGIN"
    ).length;

    const failedAttempts = logs.filter((l) => l.event === "LOGIN_FAILED").length;

    return NextResponse.json({
      metrics: {
        totalUsers: users.length,
        totalLogins,
        failedAttempts,
        adminUser: session.username,
      },
      users,
      logs,
    });
  } catch (err) {
    console.error("Admin overview error:", err);
    return NextResponse.json({ error: "Failed to load admin overview" }, { status: 500 });
  }
}
