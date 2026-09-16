import { NextRequest, NextResponse } from "next/server";
import { searchVault, getVaultStats } from "@/lib/vault-store";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { query } = await req.json();

    if (!query || !query.trim()) {
      return NextResponse.json({
        reply: "Please enter a search query or question about your vault (e.g. 'find my passport', 'show contacts', 'check notes').",
        results: null,
      });
    }

    const q = query.trim().toLowerCase();
    const stats = await getVaultStats(session.sub);
    const results = await searchVault(session.sub, q);

    const totalMatches =
      results.documents.length +
      results.photos.length +
      results.contacts.length +
      results.notes.length +
      results.tasks.length;

    let reply = "";

    if (totalMatches === 0) {
      reply = `I searched across all your private folders (Documents, Photos, Notes, Contacts, and Tasks), but couldn't find anything matching "${query}". Your vault currently has ${stats.documentsCount} documents, ${stats.photosCount} photos, ${stats.contactsCount} contacts, and ${stats.notesCount} notes.`;
    } else {
      const matchDescriptions: string[] = [];
      if (results.documents.length > 0) {
        matchDescriptions.push(
          `${results.documents.length} document${results.documents.length > 1 ? "s" : ""} (${results.documents.map((d) => d.title).join(", ")})`
        );
      }
      if (results.contacts.length > 0) {
        matchDescriptions.push(
          `${results.contacts.length} contact${results.contacts.length > 1 ? "s" : ""} (${results.contacts.map((c) => `${c.name}: ${c.phone || c.email}`).join(", ")})`
        );
      }
      if (results.notes.length > 0) {
        matchDescriptions.push(
          `${results.notes.length} note${results.notes.length > 1 ? "s" : ""} (${results.notes.map((n) => n.title).join(", ")})`
        );
      }
      if (results.photos.length > 0) {
        matchDescriptions.push(
          `${results.photos.length} photo${results.photos.length > 1 ? "s" : ""}`
        );
      }
      if (results.tasks.length > 0) {
        matchDescriptions.push(
          `${results.tasks.length} task${results.tasks.length > 1 ? "s" : ""}`
        );
      }

      reply = `Found ${totalMatches} item${totalMatches > 1 ? "s" : ""} matching "${query}" in your vault: ${matchDescriptions.join("; ")}. Direct actions are available below:`;
    }

    return NextResponse.json({
      reply,
      results,
      totalMatches,
    });
  } catch (err) {
    console.error("AI assistant error:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
