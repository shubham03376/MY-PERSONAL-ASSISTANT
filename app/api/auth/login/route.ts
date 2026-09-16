import { NextRequest, NextResponse } from "next/server";
import { findUserByIdentifier, verifyPassword } from "@/lib/users";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { logActivity } from "@/lib/activity-logger";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const forwarded = request.headers.get("x-forwarded-for");
    const clientIp = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";

    const rateCheck = checkRateLimit(`login:${clientIp}`, 20, 60);
    if (!rateCheck.allowed) {
      logActivity("LOGIN_FAILED", "rate_limited", request, `Rate limited. IP: ${clientIp}`);
      return NextResponse.json(
        {
          error: `Too many login attempts. Please wait ${rateCheck.resetInSeconds} seconds before trying again.`,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { id, password, isAdminMode } = body;

    if (!id || !password) {
      logActivity("LOGIN_FAILED", id || "empty", request, "Missing ID or password");
      return NextResponse.json(
        { error: "Vault ID / Email and Password are required." },
        { status: 400 }
      );
    }

    const user = findUserByIdentifier(id.trim());

    if (!user) {
      logActivity("LOGIN_FAILED", id.trim(), request, "User not found");
      return NextResponse.json(
        { error: "Invalid Vault ID or Password. Access denied." },
        { status: 401 }
      );
    }

    const isValidPassword = verifyPassword(password.trim(), user.passwordHash);

    if (!isValidPassword) {
      logActivity("LOGIN_FAILED", user.username, request, "Incorrect password entered");
      return NextResponse.json(
        { error: "Invalid Vault ID or Password. Access denied." },
        { status: 401 }
      );
    }

    // Strictly enforce: Only the platform owner can log in through Developer Admin Mode
    if (isAdminMode) {
      if (user.role !== "admin" || user.username.toLowerCase() !== "shubham@1700") {
        logActivity(
          "LOGIN_FAILED",
          user.username,
          request,
          "Unauthorized user attempted to log in via Developer Admin Portal"
        );
        return NextResponse.json(
          {
            error:
              "Access Denied: Only the verified platform owner can log in through the Developer Admin Portal. Please switch to Standard User Login.",
          },
          { status: 403 }
        );
      }
    }

    const token = await createSessionToken(user.id, user.username, user.email, user.role);

    // Record login activity
    logActivity(
      user.role === "admin" ? "ADMIN_LOGIN" : "LOGIN_SUCCESS",
      user.username,
      request,
      user.role === "admin" ? "Developer Admin Portal Login" : "Standard Vault Login"
    );

    resetRateLimit(`login:${clientIp}`);

    const response = NextResponse.json({
      success: true,
      message: "Vault unlocked successfully.",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });

    setSessionCookie(response, token);
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during authentication." },
      { status: 500 }
    );
  }
}
