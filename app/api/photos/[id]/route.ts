import { NextRequest, NextResponse } from "next/server";
import { updatePhoto, deletePhoto, getPhotoFile } from "@/lib/vault-store";
import { getSessionUser } from "@/lib/auth";
import fs from "fs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const fileInfo = await getPhotoFile(session.sub, id);

    if (!fileInfo) {
      return NextResponse.json({ error: "Photo not found or access denied" }, { status: 404 });
    }

    const { photo, filePath } = fileInfo;
    const buffer = fs.readFileSync(filePath);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": photo.mimeType || "image/jpeg",
        "Content-Length": photo.size.toString(),
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err) {
    console.error("Photo view error:", err);
    return NextResponse.json({ error: "Failed to load photo" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { title, caption } = body;

    const updated = await updatePhoto(session.sub, id, { title, caption });
    if (!updated) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, photo: updated });
  } catch (err) {
    console.error("Photo update error:", err);
    return NextResponse.json({ error: "Failed to update photo" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const success = await deletePhoto(session.sub, id);
    if (!success) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Photo deleted" });
  } catch (err) {
    console.error("Photo delete error:", err);
    return NextResponse.json({ error: "Failed to delete photo" }, { status: 500 });
  }
}
