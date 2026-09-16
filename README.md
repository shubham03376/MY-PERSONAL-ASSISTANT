# My Private Assistant 🛡️

A modern, highly secure, end-to-end encrypted personal data vault and AI-powered assistant built with Next.js 16, React 19, TypeScript, and Tailwind CSS.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v18+ (v20+ recommended)
- **npm**: v9+

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```

Open your browser and navigate to:
```
http://localhost:3000
```

---

## 🔐 Credentials & Access Portals

### 1. Platform Owner / Developer Admin
- **Entrance**: On the login page, click **"Developer / Admin Login? Click Here"** to switch to **Developer Admin Mode**.
- **Developer ID**: `shubham@1700`
- **Master Password**: `11897105115104117`
- **Destination**: `/admin` (Developer Command Center)
  - Features: Live system metrics, real-time security audit logs, user management, and developer password manager.
  - Can seamlessly jump to their personal vault via the **"My Personal Vault"** button.

### 2. Standard Vault User
- **Entrance**: Default **Standard User Login** mode at `/login`
- **Demo User ID**: `madar@2004`
- **Password**: `madar@2004`
- **Destination**: `/dashboard` (Isolated personal data vault)

### 3. Create a New Account
- Click **"Create Account"** or navigate directly to `/register`.
- Enforces single-use email, unique Vault ID, and an 8+ character strong password policy (letters, numbers, special characters).

---

## 📦 Features & Capabilities

1. **Zero Direct Access Gate**:
   - Pasting or navigating to `http://localhost:3000/` strictly redirects to `/login`. No unauthenticated access to vault data or developer controls is permitted.
2. **Personal Document Vault (`/documents`)**:
   - Securely upload, categorize, edit, preview inline (PDFs, images, text, markdown, CSV), open in new tabs, and download documents.
3. **Encrypted Photo Vault (`/photos`)**:
   - Private media gallery with responsive lightbox preview, captioning, and downloads.
4. **Secret Notes (`/notes`)**:
   - Encrypted note-taking with color tagging, pinning, and instant search.
5. **Private Contacts (`/contacts`)**:
   - Secure address book categorized by Personal, Work, Medical, and Emergency.
6. **Task Manager (`/tasks`)**:
   - Priority task tracking with due dates and completion statuses.
7. **AI Assistant Search (`/ai-assistant`)**:
   - Semantic natural language assistant that queries across all your private folders (Documents, Photos, Notes, Contacts, Tasks) while maintaining strict per-user privacy.
8. **Vault Backup & Export (`/settings`)**:
   - One-click JSON backup and restore of your entire private vault data.
   - Project source code download (.ZIP).
   - Permanent data purge with double-confirmation.

---

## 🛡️ Security Architecture

- **Password Hashing**: Industry-standard bcrypt with salted rounds.
- **Session Authentication**: JWT session cookies (`vault_secure_token`, 2-hour sliding expiry, HttpOnly, SameSite=Lax).
- **Data Isolation**: Per-user partition based on session ID (`session.sub`). Users cannot view, access, or manipulate other users' data.
- **Brute-Force Protection**: In-memory sliding-window rate limiting on login and registration endpoints.
- **Developer Exclusivity**: Admin portal is strictly restricted to `shubham@1700`. Regular users attempting admin access receive HTTP 403 Forbidden.

---

## 🛠️ Build & Deployment

To generate an optimized production build:
```bash
npm run build
npm start
```
