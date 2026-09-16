import { NextRequest, NextResponse } from "next/server";
import { getVaultStats } from "@/lib/vault-store";
import { getGitHubConfig, saveGitHubConfig } from "@/lib/github-storage";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stats = await getVaultStats(session.sub);
    const isOwner = session.role === "admin" && session.username === "shubham@1700";
    const github = isOwner ? getGitHubConfig() : null;

    return NextResponse.json({
      user: {
        id: session.sub,
        username: session.username,
        email: session.email,
        role: session.role,
        isOwner,
      },
      stats,
      github: github
        ? {
            owner: github.owner,
            repo: github.repo,
            hasToken: !!github.token,
          }
        : null,
    });
  } catch (err) {
    console.error("Settings error:", err);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only the platform owner (shubham@1700) can configure repository backup
    if (session.role !== "admin" || session.username !== "shubham@1700") {
      return NextResponse.json(
        { error: "Access denied. Only the platform owner can configure cloud repository backups." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { owner, repo, token } = body;

    const saved = saveGitHubConfig({
      owner: owner?.trim(),
      repo: repo?.trim(),
      token: token?.trim(),
    });

    return NextResponse.json({
      success: true,
      message: "GitHub storage configuration saved successfully.",
      github: {
        owner: saved.owner,
        repo: saved.repo,
        hasToken: !!saved.token,
      },
    });
  } catch (err) {
    console.error("Failed to save settings:", err);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
