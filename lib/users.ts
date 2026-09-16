import fs from "fs";
import path from "path";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { validatePassword, validateEmail, validateVaultId } from "./password-validator";

export interface VaultUser {
  id: string;
  email: string;
  username: string; // Vault ID
  passwordHash: string;
  role: "admin" | "user";
  createdAt: string;
}

const STORAGE_DIR = path.join(process.cwd(), "storage", "data");
const USERS_FILE = path.join(STORAGE_DIR, "users.json");

function ensureDir() {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
}

export function getUsers(): VaultUser[] {
  ensureDir();
  if (!fs.existsSync(USERS_FILE)) {
    // Seed default master account (shubham@1700 / 11897105115104117)
    const masterPasswordHash = bcrypt.hashSync("11897105115104117", 10);
    const initialUsers: VaultUser[] = [
      {
        id: "vault-shubham-001",
        email: "shubham@vault.local",
        username: "shubham@1700",
        passwordHash: masterPasswordHash,
        role: "admin",
        createdAt: new Date().toISOString(),
      },
    ];
    fs.writeFileSync(USERS_FILE, JSON.stringify(initialUsers, null, 2), "utf-8");
    return initialUsers;
  }

  try {
    const raw = fs.readFileSync(USERS_FILE, "utf-8");
    return JSON.parse(raw) as VaultUser[];
  } catch {
    return [];
  }
}

function saveUsers(users: VaultUser[]) {
  ensureDir();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
}

export function findUserByIdentifier(identifier: string): VaultUser | null {
  const users = getUsers();
  const clean = identifier.trim().toLowerCase();

  return (
    users.find(
      (u) =>
        u.username.toLowerCase() === clean ||
        u.email.toLowerCase() === clean ||
        (u.username.toLowerCase() === "shubham@1700" && clean === "shubhama@1700")
    ) || null
  );
}

export function findUserById(id: string): VaultUser | null {
  const users = getUsers();
  return users.find((u) => u.id === id) || null;
}

export function verifyPassword(password: string, hash: string): boolean {
  try {
    return bcrypt.compareSync(password.trim(), hash);
  } catch {
    return false;
  }
}

export function createVaultAccount(
  email: string,
  username: string,
  password: string
): { success: boolean; user?: VaultUser; error?: string } {
  const cleanEmail = (email || "").trim().toLowerCase();
  const cleanUsername = (username || "").trim();

  // 1. Email format validation
  const emailValidation = validateEmail(cleanEmail);
  if (!emailValidation.isValid) {
    return { success: false, error: emailValidation.error || "Please provide a valid email address." };
  }

  // 2. Vault ID format & reserved words validation
  const vaultIdValidation = validateVaultId(cleanUsername);
  if (!vaultIdValidation.isValid) {
    return { success: false, error: vaultIdValidation.error || "Invalid Vault ID." };
  }

  // 3. Password policy validation (8+ chars, letters, numbers, special characters)
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    return {
      success: false,
      error:
        passwordValidation.error ||
        "Password must be at least 8 characters long and contain letters, numbers, and special characters (!@#$%^&* etc.).",
    };
  }

  const users = getUsers();

  // 4. Unique Email Check: "just one email id can use for once, don't get it another time"
  const existingEmail = users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (existingEmail) {
    return {
      success: false,
      error: "This Email ID is already registered. Each email address can only be used once. Please sign in or use a different email address.",
    };
  }

  // 5. Unique Vault ID Check: "every user has different id, can't accept the same id"
  const existingUsername = users.find(
    (u) => u.username.toLowerCase() === cleanUsername.toLowerCase()
  );
  if (existingUsername) {
    return {
      success: false,
      error: `The Vault ID "${cleanUsername}" is already taken. Every user must have a unique ID. Please choose a different Vault ID.`,
    };
  }

  const saltRounds = 10;
  const passwordHash = bcrypt.hashSync(password.trim(), saltRounds);

  const newUser: VaultUser = {
    id: `user_${crypto.randomUUID()}`,
    email: cleanEmail,
    username: cleanUsername,
    passwordHash,
    role: "user",
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);

  return { success: true, user: newUser };
}

export function getAllUsersSafe() {
  const users = getUsers();
  return users.map((u) => ({
    id: u.id,
    email: u.email,
    username: u.username,
    role: u.role,
    createdAt: u.createdAt,
  }));
}

export function updateAdminPassword(
  adminId: string,
  currentPass: string,
  newPass: string
): { success: boolean; error?: string } {
  // Password policy validation for admin as well
  const passwordValidation = validatePassword(newPass);
  if (!passwordValidation.isValid) {
    return {
      success: false,
      error:
        passwordValidation.error ||
        "New password must be at least 8 characters long and contain letters, numbers, and special characters (!@#$%^&* etc.).",
    };
  }

  const users = getUsers();
  const index = users.findIndex(
    (u) => u.id === adminId && u.role === "admin" && u.username === "shubham@1700"
  );

  if (index === -1) {
    return { success: false, error: "Platform owner account not found or access denied." };
  }

  const admin = users[index];
  const isMatch = bcrypt.compareSync(currentPass.trim(), admin.passwordHash);

  if (!isMatch) {
    return { success: false, error: "Current admin password does not match." };
  }

  const newHash = bcrypt.hashSync(newPass.trim(), 10);
  users[index].passwordHash = newHash;
  saveUsers(users);

  return { success: true };
}
