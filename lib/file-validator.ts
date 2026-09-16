import path from "path";

// Maximum limits
export const MAX_DOCUMENT_SIZE = 30 * 1024 * 1024; // 30 MB
export const MAX_PHOTO_SIZE = 15 * 1024 * 1024; // 15 MB

// Dangerous executable file extensions to block unconditionally
const BLOCKED_EXTENSIONS = new Set([
  ".exe",
  ".bat",
  ".cmd",
  ".sh",
  ".vbs",
  ".js",
  ".scr",
  ".msi",
  ".ps1",
  ".com",
  ".hta",
  ".jar",
  ".jsp",
  ".php",
  ".pif",
  ".reg",
  ".wsf",
  ".dll",
  ".sys",
]);

export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitizedName?: string;
}

/**
 * Validates and sanitizes a document file upload.
 */
export function validateDocumentUpload(
  fileName: string,
  fileSize: number,
  _mimeType?: string
): ValidationResult {
  if (!fileName || typeof fileName !== "string") {
    return { valid: false, error: "Invalid filename provided." };
  }

  // Prevent path traversal and strip dangerous characters
  const cleanName = path.basename(fileName).replace(/[\0\r\n\t]/g, "").trim();
  if (!cleanName || cleanName === "." || cleanName === "..") {
    return { valid: false, error: "Invalid or dangerous filename." };
  }

  const ext = path.extname(cleanName).toLowerCase();
  if (BLOCKED_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      error: `Executable and script file uploads (${ext}) are blocked for vault security.`,
    };
  }

  if (fileSize <= 0) {
    return { valid: false, error: "Empty file cannot be uploaded." };
  }

  if (fileSize > MAX_DOCUMENT_SIZE) {
    return {
      valid: false,
      error: `File size exceeds the 30 MB limit. (Size: ${(fileSize / (1024 * 1024)).toFixed(1)} MB)`,
    };
  }

  return { valid: true, sanitizedName: cleanName };
}

/**
 * Validates and sanitizes a photo upload.
 */
export function validatePhotoUpload(
  fileName: string,
  fileSize: number,
  _mimeType?: string
): ValidationResult {
  if (!fileName || typeof fileName !== "string") {
    return { valid: false, error: "Invalid image filename provided." };
  }

  const cleanName = path.basename(fileName).replace(/[\0\r\n\t]/g, "").trim();
  if (!cleanName) {
    return { valid: false, error: "Invalid filename." };
  }

  const ext = path.extname(cleanName).toLowerCase();
  const allowedImageExts = new Set([
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".gif",
    ".bmp",
    ".svg",
    ".tiff",
    ".ico",
    ".heic",
  ]);

  if (!allowedImageExts.has(ext)) {
    return {
      valid: false,
      error: `Only supported image formats (.jpg, .jpeg, .png, .webp, .gif, .svg) are allowed.`,
    };
  }

  if (fileSize <= 0) {
    return { valid: false, error: "Empty image file cannot be uploaded." };
  }

  if (fileSize > MAX_PHOTO_SIZE) {
    return {
      valid: false,
      error: `Image size exceeds the 15 MB limit. (Size: ${(fileSize / (1024 * 1024)).toFixed(1)} MB)`,
    };
  }

  return { valid: true, sanitizedName: cleanName };
}
