import fs from "fs";
import path from "path";
import crypto from "crypto";

const STORAGE_DIR = path.join(process.cwd(), "storage");
const UPLOADS_DIR = path.join(STORAGE_DIR, "uploads");
const DATA_DIR = path.join(STORAGE_DIR, "data");

function ensureDirs(userId?: string) {
  if (!fs.existsSync(STORAGE_DIR)) fs.mkdirSync(STORAGE_DIR, { recursive: true });
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  if (userId) {
    const userUploads = path.join(UPLOADS_DIR, userId);
    if (!fs.existsSync(userUploads)) {
      fs.mkdirSync(userUploads, { recursive: true });
    }
  }
}

function readJsonFile<T>(filename: string, fallback: T): T {
  ensureDirs();
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2), "utf-8");
    return fallback;
  }
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch {
    return fallback;
  }
}

function writeJsonFile<T>(filename: string, data: T) {
  ensureDirs();
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

/* ==========================================================================
   DOCUMENT TYPES & METHODS (User-Scoped)
   ========================================================================== */
export interface VaultDocument {
  id: string;
  userId: string;
  title: string;
  originalName: string;
  filename: string;
  mimeType: string;
  size: number;
  category: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export async function getDocuments(userId: string): Promise<VaultDocument[]> {
  const allDocs = readJsonFile<VaultDocument[]>("documents.json", []);
  // Backwards compatibility for unseeded docs: assign to master if missing
  return allDocs.filter((d) => d.userId === userId || (!d.userId && userId === "vault-shubham-001"));
}

export async function saveDocument(
  userId: string,
  fileBuffer: Buffer,
  originalName: string,
  mimeType: string,
  category: string = "General",
  notes: string = "",
  title?: string
): Promise<VaultDocument> {
  ensureDirs(userId);
  const id = crypto.randomUUID();
  const ext = path.extname(originalName) || "";
  const safeFilename = `${id}${ext}`;
  const userUploadDir = path.join(UPLOADS_DIR, userId);
  const filePath = path.join(userUploadDir, safeFilename);

  fs.writeFileSync(filePath, fileBuffer);

  const newDoc: VaultDocument = {
    id,
    userId,
    title: title?.trim() || originalName,
    originalName,
    filename: safeFilename,
    mimeType: mimeType || "application/octet-stream",
    size: fileBuffer.length,
    category: category || "General",
    notes: notes || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const allDocs = readJsonFile<VaultDocument[]>("documents.json", []);
  allDocs.unshift(newDoc);
  writeJsonFile("documents.json", allDocs);

  return newDoc;
}

export async function updateDocument(
  userId: string,
  id: string,
  updates: Partial<Pick<VaultDocument, "title" | "category" | "notes">>
): Promise<VaultDocument | null> {
  const allDocs = readJsonFile<VaultDocument[]>("documents.json", []);
  const index = allDocs.findIndex(
    (d) => d.id === id && (d.userId === userId || (!d.userId && userId === "vault-shubham-001"))
  );
  if (index === -1) return null;

  allDocs[index] = {
    ...allDocs[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  writeJsonFile("documents.json", allDocs);
  return allDocs[index];
}

export async function deleteDocument(userId: string, id: string): Promise<boolean> {
  const allDocs = readJsonFile<VaultDocument[]>("documents.json", []);
  const doc = allDocs.find(
    (d) => d.id === id && (d.userId === userId || (!d.userId && userId === "vault-shubham-001"))
  );
  if (!doc) return false;

  const userDir = path.join(UPLOADS_DIR, doc.userId || userId);
  const filePath = path.join(userDir, doc.filename);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error("Failed to remove file from disk:", err);
    }
  } else {
    const fallbackPath = path.join(UPLOADS_DIR, doc.filename);
    if (fs.existsSync(fallbackPath)) {
      try {
        fs.unlinkSync(fallbackPath);
      } catch {}
    }
  }

  const updated = allDocs.filter((d) => d.id !== id);
  writeJsonFile("documents.json", updated);
  return true;
}

export async function getDocumentFile(
  userId: string,
  id: string
): Promise<{ doc: VaultDocument; filePath: string } | null> {
  const allDocs = readJsonFile<VaultDocument[]>("documents.json", []);
  const doc = allDocs.find(
    (d) => d.id === id && (d.userId === userId || (!d.userId && userId === "vault-shubham-001"))
  );
  if (!doc) return null;

  const userDir = path.join(UPLOADS_DIR, doc.userId || userId);
  let filePath = path.join(userDir, doc.filename);
  if (!fs.existsSync(filePath)) {
    // Fallback to root uploads folder for earlier single-tenant files
    const fallbackPath = path.join(UPLOADS_DIR, doc.filename);
    if (fs.existsSync(fallbackPath)) {
      filePath = fallbackPath;
    } else {
      return null;
    }
  }

  return { doc, filePath };
}

/* ==========================================================================
   PHOTO TYPES & METHODS (User-Scoped)
   ========================================================================== */
export interface VaultPhoto {
  id: string;
  userId: string;
  title: string;
  originalName: string;
  filename: string;
  mimeType: string;
  size: number;
  caption: string;
  createdAt: string;
}

export async function getPhotos(userId: string): Promise<VaultPhoto[]> {
  const all = readJsonFile<VaultPhoto[]>("photos.json", []);
  return all.filter((p) => p.userId === userId || (!p.userId && userId === "vault-shubham-001"));
}

export async function savePhoto(
  userId: string,
  fileBuffer: Buffer,
  originalName: string,
  mimeType: string,
  caption: string = "",
  title?: string
): Promise<VaultPhoto> {
  ensureDirs(userId);
  const id = crypto.randomUUID();
  const ext = path.extname(originalName) || ".jpg";
  const safeFilename = `photo_${id}${ext}`;
  const userUploadDir = path.join(UPLOADS_DIR, userId);
  const filePath = path.join(userUploadDir, safeFilename);

  fs.writeFileSync(filePath, fileBuffer);

  const newPhoto: VaultPhoto = {
    id,
    userId,
    title: title?.trim() || originalName,
    originalName,
    filename: safeFilename,
    mimeType: mimeType || "image/jpeg",
    size: fileBuffer.length,
    caption: caption || "",
    createdAt: new Date().toISOString(),
  };

  const all = readJsonFile<VaultPhoto[]>("photos.json", []);
  all.unshift(newPhoto);
  writeJsonFile("photos.json", all);

  return newPhoto;
}

export async function updatePhoto(
  userId: string,
  id: string,
  updates: Partial<Pick<VaultPhoto, "title" | "caption">>
): Promise<VaultPhoto | null> {
  const all = readJsonFile<VaultPhoto[]>("photos.json", []);
  const index = all.findIndex(
    (p) => p.id === id && (p.userId === userId || (!p.userId && userId === "vault-shubham-001"))
  );
  if (index === -1) return null;

  all[index] = { ...all[index], ...updates };
  writeJsonFile("photos.json", all);
  return all[index];
}

export async function deletePhoto(userId: string, id: string): Promise<boolean> {
  const all = readJsonFile<VaultPhoto[]>("photos.json", []);
  const photo = all.find(
    (p) => p.id === id && (p.userId === userId || (!p.userId && userId === "vault-shubham-001"))
  );
  if (!photo) return false;

  const userDir = path.join(UPLOADS_DIR, photo.userId || userId);
  const filePath = path.join(userDir, photo.filename);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error("Failed to remove photo:", err);
    }
  } else {
    const fallbackPath = path.join(UPLOADS_DIR, photo.filename);
    if (fs.existsSync(fallbackPath)) {
      try {
        fs.unlinkSync(fallbackPath);
      } catch {}
    }
  }

  const updated = all.filter((p) => p.id !== id);
  writeJsonFile("photos.json", updated);
  return true;
}

export async function getPhotoFile(
  userId: string,
  id: string
): Promise<{ photo: VaultPhoto; filePath: string } | null> {
  const all = readJsonFile<VaultPhoto[]>("photos.json", []);
  const photo = all.find(
    (p) => p.id === id && (p.userId === userId || (!p.userId && userId === "vault-shubham-001"))
  );
  if (!photo) return null;

  const userDir = path.join(UPLOADS_DIR, photo.userId || userId);
  let filePath = path.join(userDir, photo.filename);
  if (!fs.existsSync(filePath)) {
    const fallbackPath = path.join(UPLOADS_DIR, photo.filename);
    if (fs.existsSync(fallbackPath)) {
      filePath = fallbackPath;
    } else {
      return null;
    }
  }

  return { photo, filePath };
}

/* ==========================================================================
   CONTACT TYPES & METHODS (User-Scoped)
   ========================================================================== */
export interface VaultContact {
  id: string;
  userId: string;
  name: string;
  phone: string;
  email: string;
  category: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export async function getContacts(userId: string): Promise<VaultContact[]> {
  const all = readJsonFile<VaultContact[]>("contacts.json", []);
  return all.filter((c) => c.userId === userId || (!c.userId && userId === "vault-shubham-001"));
}

export async function addContact(
  userId: string,
  contact: Omit<VaultContact, "id" | "userId" | "createdAt" | "updatedAt">
): Promise<VaultContact> {
  const id = crypto.randomUUID();
  const newContact: VaultContact = {
    ...contact,
    id,
    userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const all = readJsonFile<VaultContact[]>("contacts.json", []);
  all.unshift(newContact);
  writeJsonFile("contacts.json", all);
  return newContact;
}

export async function updateContact(
  userId: string,
  id: string,
  updates: Partial<Omit<VaultContact, "id" | "userId" | "createdAt">>
): Promise<VaultContact | null> {
  const all = readJsonFile<VaultContact[]>("contacts.json", []);
  const index = all.findIndex(
    (c) => c.id === id && (c.userId === userId || (!c.userId && userId === "vault-shubham-001"))
  );
  if (index === -1) return null;

  all[index] = { ...all[index], ...updates, updatedAt: new Date().toISOString() };
  writeJsonFile("contacts.json", all);
  return all[index];
}

export async function deleteContact(userId: string, id: string): Promise<boolean> {
  const all = readJsonFile<VaultContact[]>("contacts.json", []);
  const filtered = all.filter(
    (c) => !(c.id === id && (c.userId === userId || (!c.userId && userId === "vault-shubham-001")))
  );
  if (filtered.length === all.length) return false;
  writeJsonFile("contacts.json", filtered);
  return true;
}

/* ==========================================================================
   NOTE TYPES & METHODS (User-Scoped)
   ========================================================================== */
export interface VaultNote {
  id: string;
  userId: string;
  title: string;
  content: string;
  tag: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function getNotes(userId: string): Promise<VaultNote[]> {
  const all = readJsonFile<VaultNote[]>("notes.json", []);
  return all.filter((n) => n.userId === userId || (!n.userId && userId === "vault-shubham-001"));
}

export async function addNote(
  userId: string,
  note: Omit<VaultNote, "id" | "userId" | "createdAt" | "updatedAt">
): Promise<VaultNote> {
  const id = crypto.randomUUID();
  const newNote: VaultNote = {
    ...note,
    id,
    userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const all = readJsonFile<VaultNote[]>("notes.json", []);
  all.unshift(newNote);
  writeJsonFile("notes.json", all);
  return newNote;
}

export async function updateNote(
  userId: string,
  id: string,
  updates: Partial<Omit<VaultNote, "id" | "userId" | "createdAt">>
): Promise<VaultNote | null> {
  const all = readJsonFile<VaultNote[]>("notes.json", []);
  const index = all.findIndex(
    (n) => n.id === id && (n.userId === userId || (!n.userId && userId === "vault-shubham-001"))
  );
  if (index === -1) return null;

  all[index] = { ...all[index], ...updates, updatedAt: new Date().toISOString() };
  writeJsonFile("notes.json", all);
  return all[index];
}

export async function deleteNote(userId: string, id: string): Promise<boolean> {
  const all = readJsonFile<VaultNote[]>("notes.json", []);
  const filtered = all.filter(
    (n) => !(n.id === id && (n.userId === userId || (!n.userId && userId === "vault-shubham-001")))
  );
  if (filtered.length === all.length) return false;
  writeJsonFile("notes.json", filtered);
  return true;
}

/* ==========================================================================
   TASK TYPES & METHODS (User-Scoped)
   ========================================================================== */
export interface VaultTask {
  id: string;
  userId: string;
  title: string;
  completed: boolean;
  dueDate?: string;
  priority: "low" | "medium" | "high";
  createdAt: string;
}

export async function getTasks(userId: string): Promise<VaultTask[]> {
  const all = readJsonFile<VaultTask[]>("tasks.json", []);
  return all.filter((t) => t.userId === userId || (!t.userId && userId === "vault-shubham-001"));
}

export async function addTask(
  userId: string,
  task: Omit<VaultTask, "id" | "userId" | "createdAt">
): Promise<VaultTask> {
  const id = crypto.randomUUID();
  const newTask: VaultTask = {
    ...task,
    id,
    userId,
    createdAt: new Date().toISOString(),
  };

  const all = readJsonFile<VaultTask[]>("tasks.json", []);
  all.unshift(newTask);
  writeJsonFile("tasks.json", all);
  return newTask;
}

export async function updateTask(
  userId: string,
  id: string,
  updates: Partial<Omit<VaultTask, "id" | "userId" | "createdAt">>
): Promise<VaultTask | null> {
  const all = readJsonFile<VaultTask[]>("tasks.json", []);
  const index = all.findIndex(
    (t) => t.id === id && (t.userId === userId || (!t.userId && userId === "vault-shubham-001"))
  );
  if (index === -1) return null;

  all[index] = { ...all[index], ...updates };
  writeJsonFile("tasks.json", all);
  return all[index];
}

export async function deleteTask(userId: string, id: string): Promise<boolean> {
  const all = readJsonFile<VaultTask[]>("tasks.json", []);
  const filtered = all.filter(
    (t) => !(t.id === id && (t.userId === userId || (!t.userId && userId === "vault-shubham-001")))
  );
  if (filtered.length === all.length) return false;
  writeJsonFile("tasks.json", filtered);
  return true;
}

/* ==========================================================================
   USER-SCOPED STATS & SEARCH
   ========================================================================== */
export async function getVaultStats(userId: string) {
  const [docs, photos, contacts, notes, tasks] = await Promise.all([
    getDocuments(userId),
    getPhotos(userId),
    getContacts(userId),
    getNotes(userId),
    getTasks(userId),
  ]);

  const totalBytes = docs.reduce((acc, d) => acc + d.size, 0) + photos.reduce((acc, p) => acc + p.size, 0);

  return {
    documentsCount: docs.length,
    photosCount: photos.length,
    contactsCount: contacts.length,
    notesCount: notes.length,
    tasksCount: tasks.length,
    totalStorageBytes: totalBytes,
  };
}

export async function searchVault(userId: string, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) {
    return {
      documents: [],
      photos: [],
      contacts: [],
      notes: [],
      tasks: [],
    };
  }

  const [docs, photos, contacts, notes, tasks] = await Promise.all([
    getDocuments(userId),
    getPhotos(userId),
    getContacts(userId),
    getNotes(userId),
    getTasks(userId),
  ]);

  return {
    documents: docs.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.originalName.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q) ||
        d.notes.toLowerCase().includes(q)
    ),
    photos: photos.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.originalName.toLowerCase().includes(q) ||
        p.caption.toLowerCase().includes(q)
    ),
    contacts: contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.notes.toLowerCase().includes(q)
    ),
    notes: notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.tag.toLowerCase().includes(q)
    ),
    tasks: tasks.filter((t) => t.title.toLowerCase().includes(q)),
  };
}

/* ==========================================================================
   VAULT BACKUP, RESTORE & PERMANENT DATA PURGE (User-Scoped)
   ========================================================================== */
export interface VaultBackup {
  version: string;
  exportedAt: string;
  userId: string;
  contacts: VaultContact[];
  notes: VaultNote[];
  tasks: VaultTask[];
  documents: VaultDocument[];
  photos: VaultPhoto[];
}

export async function exportVaultData(userId: string): Promise<VaultBackup> {
  const [contacts, notes, tasks, documents, photos] = await Promise.all([
    getContacts(userId),
    getNotes(userId),
    getTasks(userId),
    getDocuments(userId),
    getPhotos(userId),
  ]);

  return {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    userId,
    contacts,
    notes,
    tasks,
    documents,
    photos,
  };
}

export async function restoreVaultData(
  userId: string,
  backup: Partial<VaultBackup>
): Promise<{ restoredContacts: number; restoredNotes: number; restoredTasks: number }> {
  let restoredContacts = 0;
  let restoredNotes = 0;
  let restoredTasks = 0;

  if (Array.isArray(backup.contacts)) {
    for (const c of backup.contacts) {
      if (c && c.name) {
        await addContact(userId, {
          name: c.name,
          phone: c.phone || "",
          email: c.email || "",
          category: c.category || "General",
          notes: c.notes || "",
        });
        restoredContacts++;
      }
    }
  }

  if (Array.isArray(backup.notes)) {
    for (const n of backup.notes) {
      if (n && n.title) {
        await addNote(userId, {
          title: n.title,
          content: n.content || "",
          tag: n.tag || "General",
          isPinned: !!n.isPinned,
        });
        restoredNotes++;
      }
    }
  }

  if (Array.isArray(backup.tasks)) {
    for (const t of backup.tasks) {
      if (t && t.title) {
        await addTask(userId, {
          title: t.title,
          priority: t.priority || "medium",
          completed: !!t.completed,
          dueDate: t.dueDate,
        });
        restoredTasks++;
      }
    }
  }

  return { restoredContacts, restoredNotes, restoredTasks };
}

export async function purgeUserVault(userId: string): Promise<boolean> {
  // 1. Delete physical files from disk
  const userUploadDir = path.join(UPLOADS_DIR, userId);
  if (fs.existsSync(userUploadDir)) {
    try {
      fs.rmSync(userUploadDir, { recursive: true, force: true });
    } catch (err) {
      console.error("Failed to delete user uploads folder:", err);
    }
  }

  // 2. Remove user records from json stores
  const allDocs = readJsonFile<VaultDocument[]>("documents.json", []).filter((d) => d.userId !== userId);
  writeJsonFile("documents.json", allDocs);

  const allPhotos = readJsonFile<VaultPhoto[]>("photos.json", []).filter((p) => p.userId !== userId);
  writeJsonFile("photos.json", allPhotos);

  const allContacts = readJsonFile<VaultContact[]>("contacts.json", []).filter((c) => c.userId !== userId);
  writeJsonFile("contacts.json", allContacts);

  const allNotes = readJsonFile<VaultNote[]>("notes.json", []).filter((n) => n.userId !== userId);
  writeJsonFile("notes.json", allNotes);

  const allTasks = readJsonFile<VaultTask[]>("tasks.json", []).filter((t) => t.userId !== userId);
  writeJsonFile("tasks.json", allTasks);

  return true;
}
