import fs from "fs";
import path from "path";
import crypto from "crypto";
import { NextRequest } from "next/server";

export interface ActivityLog {
  id: string;
  timestamp: string;
  event: "LOGIN_SUCCESS" | "LOGIN_FAILED" | "USER_REGISTERED" | "PASSWORD_CHANGED" | "ADMIN_LOGIN";
  identifier: string;
  ip: string;
  userAgent: string;
  details?: string;
}

const STORAGE_DIR = path.join(process.cwd(), "storage", "data");
const LOGS_FILE = path.join(STORAGE_DIR, "activity_logs.json");

function ensureDir() {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
}

export function getActivityLogs(limit = 100): ActivityLog[] {
  ensureDir();
  if (!fs.existsSync(LOGS_FILE)) {
    return [];
  }
  try {
    const data = fs.readFileSync(LOGS_FILE, "utf-8");
    const logs = JSON.parse(data) as ActivityLog[];
    return logs.slice(0, limit);
  } catch {
    return [];
  }
}

export function logActivity(
  event: ActivityLog["event"],
  identifier: string,
  req?: NextRequest,
  details?: string
): ActivityLog {
  ensureDir();

  let ip = "127.0.0.1";
  let userAgent = "Unknown Device";

  if (req) {
    ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";
    userAgent = req.headers.get("user-agent") || "Browser Session";
  }

  const newLog: ActivityLog = {
    id: `log_${crypto.randomUUID()}`,
    timestamp: new Date().toISOString(),
    event,
    identifier: identifier.trim(),
    ip,
    userAgent: userAgent.slice(0, 120), // trim long user agent strings
    details: details || "",
  };

  const logs = getActivityLogs(500);
  logs.unshift(newLog);

  fs.writeFileSync(LOGS_FILE, JSON.stringify(logs, null, 2), "utf-8");
  return newLog;
}
