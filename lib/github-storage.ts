import fs from "fs";
import path from "path";

interface GitHubSettings {
  owner: string;
  repo: string;
  token: string;
}

export function getGitHubConfig(): GitHubSettings {
  const owner = process.env.GITHUB_OWNER || "";
  const repo = process.env.GITHUB_REPO || "my-private-assistant-vault";
  const token = process.env.GITHUB_TOKEN || "";

  // Also check if user saved custom token in settings.json
  const settingsFile = path.join(process.cwd(), "storage", "data", "settings.json");
  if (fs.existsSync(settingsFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(settingsFile, "utf-8"));
      return {
        owner: data.owner || owner,
        repo: data.repo || repo,
        token: data.token || token,
      };
    } catch {
      // ignore
    }
  }

  return { owner, repo, token };
}

export function saveGitHubConfig(updates: Partial<GitHubSettings>) {
  const current = getGitHubConfig();
  const next = { ...current, ...updates };
  const settingsDir = path.join(process.cwd(), "storage", "data");
  if (!fs.existsSync(settingsDir)) {
    fs.mkdirSync(settingsDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(settingsDir, "settings.json"),
    JSON.stringify(next, null, 2),
    "utf-8"
  );
  return next;
}

export async function uploadOrUpdateFileToGitHub(
  filePathInRepo: string,
  contentBuffer: Buffer,
  commitMessage: string
): Promise<{ success: boolean; message: string }> {
  const { owner, repo, token } = getGitHubConfig();

  if (!token) {
    return {
      success: false,
      message: "GitHub Personal Access Token is not set. Add it in Settings to enable GitHub backups.",
    };
  }

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePathInRepo}`;
  const base64Content = contentBuffer.toString("base64");

  try {
    // Check if file already exists to get its SHA
    let existingSha: string | undefined;
    const getRes = await fetch(url, {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (getRes.status === 200) {
      const fileData = await getRes.json();
      existingSha = fileData.sha;
    }

    // Commit file
    const body: Record<string, unknown> = {
      message: commitMessage,
      content: base64Content,
    };
    if (existingSha) {
      body.sha = existingSha;
    }

    const putRes = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!putRes.ok) {
      const err = await putRes.text();
      return { success: false, message: `GitHub API error: ${err}` };
    }

    return { success: true, message: "Successfully synced to GitHub repository!" };
  } catch (error) {
    return {
      success: false,
      message: `Failed to connect to GitHub: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
