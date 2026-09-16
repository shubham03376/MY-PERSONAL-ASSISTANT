import { NextRequest, NextResponse } from "next/server";
import { createVaultAccount } from "@/lib/users";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { logActivity } from "@/lib/activity-logger";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const forwarded = request.headers.get("x-forwarded-for");
    const clientIp = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";

    const rateCheck = checkRateLimit(`register:${clientIp}`, 30, 60);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Too many registration attempts. Please wait ${rateCheck.resetInSeconds} seconds.`,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, username, password } = body;

    if (!email || !username || !password) {
      return NextResponse.json(
        { error: "Email, Vault ID, and Password are required." },
        { status: 400 }
      );
    }

    const result = createVaultAccount(email, username, password);

    if (!result.success || !result.user) {
      logActivity("LOGIN_FAILED", username || email, request, `Registration failed: ${result.error}`);
      return NextResponse.json(
        { error: result.error || "Failed to create vault account." },
        { status: 400 }
      );
    }

    // Auto-login newly registered user
    const token = await createSessionToken(
      result.user.id,
      result.user.username,
      result.user.email,
      result.user.role
    );

    // Audit log
    logActivity(
      "USER_REGISTERED",
      result.user.username,
      request,
      `New user account registered with email: ${result.user.email}`
    );
    resetRateLimit(`register:${clientIp}`);

    const response = NextResponse.json({
      success: true,
      message: `Account registered successfully! Your email (${result.user.email}) is now linked to Vault ID "${result.user.username}". Welcome to your private vault.`,
      user: {
        id: result.user.id,
        username: result.user.username,
        email: result.user.email,
        role: result.user.role,
      },
    });

    setSessionCookie(response, token);
    return response;
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during account creation." },
      { status: 500 }
    );
  }
}
