export interface PasswordValidationResult {
  isValid: boolean;
  hasMinLength: boolean;
  hasLetters: boolean;
  hasNumbers: boolean;
  hasSpecialChar: boolean;
  error?: string;
}

/**
 * Validates that a password satisfies all security requirements:
 * 1. At least 8 characters in length
 * 2. Contains letters (alphabets: a-z, A-Z)
 * 3. Contains numbers (digits: 0-9)
 * 4. Contains special characters (!@#$%^&* etc.)
 */
export function validatePassword(password: string): PasswordValidationResult {
  const pwd = password || "";
  const hasMinLength = pwd.length >= 8;
  const hasLetters = /[a-zA-Z]/.test(pwd);
  const hasNumbers = /[0-9]/.test(pwd);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`^]/.test(pwd);

  let error: string | undefined;
  if (!hasMinLength) {
    error = "Password must be at least 8 characters long.";
  } else if (!hasLetters) {
    error = "Password must include letters (alphabets: a-z, A-Z).";
  } else if (!hasNumbers) {
    error = "Password must include at least one number (0-9).";
  } else if (!hasSpecialChar) {
    error = "Password must include at least one special character (!@#$%^&* etc.).";
  }

  return {
    isValid: hasMinLength && hasLetters && hasNumbers && hasSpecialChar,
    hasMinLength,
    hasLetters,
    hasNumbers,
    hasSpecialChar,
    error,
  };
}

/**
 * Validates email format
 */
export function validateEmail(email: string): { isValid: boolean; error?: string } {
  const clean = (email || "").trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!clean) {
    return { isValid: false, error: "Email ID is required." };
  }
  if (!emailRegex.test(clean)) {
    return {
      isValid: false,
      error: "Please enter a valid email address (e.g. user@example.com).",
    };
  }
  return { isValid: true };
}

/**
 * Validates Vault ID / Username format and prevents reserved keywords
 */
export function validateVaultId(username: string): { isValid: boolean; error?: string } {
  const clean = (username || "").trim();

  if (!clean || clean.length < 3) {
    return { isValid: false, error: "Vault ID must be at least 3 characters long." };
  }
  if (clean.length > 30) {
    return { isValid: false, error: "Vault ID cannot exceed 30 characters." };
  }

  const reserved = [
    "admin",
    "administrator",
    "developer",
    "owner",
    "root",
    "system",
    "shubham@1700",
    "shubhama@1700",
  ];

  if (reserved.includes(clean.toLowerCase())) {
    return {
      isValid: false,
      error: `The Vault ID "${clean}" is reserved. Please choose a different unique Vault ID.`,
    };
  }

  return { isValid: true };
}
