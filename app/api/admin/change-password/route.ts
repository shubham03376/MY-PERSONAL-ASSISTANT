import { NextRequest, NextResponse } from "next/server";
import { updateAdminPassword } from "@/lib/users";
import { getSessionUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity-logger";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "admin" || session.username !== "shubham@1700") {
      return NextResponse.json(
        { error: "Forbidden: Platform owner developer administrator access required." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required." },
        { status: 400 }
      );
    }

    const result = updateAdminPassword(session.sub, currentPassword, newPassword);

    if (!result.success) {
      logActivity(
        "PASSWORD_CHANGED",
        session.username,
        req,
        `Admin password change failed: ${result.error}`
      );
      return NextResponse.json({ error: result.error || "Password change failed." }, { status: 400 });
    }

    logActivity(
      "PASSWORD_CHANGED",
      session.username,
      req,
      "Developer admin master password updated successfully"
    );

    return NextResponse.json({
      success: true,
      message: "Admin master password has been changed successfully.",
    });
  } catch (err) {
    console.error("Change password error:", err);
    return NextResponse.json({ error: "Failed to change admin password." }, { status: 500 });
  }
}
